"""
InternFinder FastAPI server.

Endpoints:
  GET  /            — Health check
  POST /chat        — Conversational internship search
  POST /parse-resume — Upload a resume (PDF or plain text)
"""
import logging
import uuid

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import run_agent
from config import settings
from resume_parser import parse_resume

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("internfinder")

# Validate env vars immediately on startup — fail fast.
settings.validate()

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="InternFinder API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins,  # lock down before production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory session store ───────────────────────────────────────────────────
# ⚠️  Teaching/demo only. Data is lost on every restart and is NOT safe behind
#     multiple Gunicorn workers. Replace with Redis or a DB for production.
sessions: dict = {}


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: str = None
    active_skills: list = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str


class ParseResumeResponse(BaseModel):
    session_id: str
    profile: dict


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": "InternFinder API",
        "version": "2.0.0",
    }


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Get or create session
    sid = req.session_id or str(uuid.uuid4())
    if sid not in sessions:
        sessions[sid] = {"history": [], "profile": None}
    session = sessions[sid]

    # Update active skills if the frontend sent an updated selection
    profile = session["profile"]
    if profile is not None and req.active_skills is not None:
        profile.active_skills = req.active_skills

    try:
        reply, updated_history = await run_agent(
            req.message, session["history"], profile
        )
    except Exception as e:
        logger.error("Agent error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent error: {e}")

    session["history"] = updated_history
    return ChatResponse(reply=reply, session_id=sid)


@app.post(
    "/parse-resume",
    response_model=ParseResumeResponse,
    tags=["Resume"],
)
async def parse_resume_endpoint(
    file: UploadFile = File(...),
    session_id: str = None,
):
    allowed_types = ("application/pdf", "text/plain")
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only PDF or plain-text files are accepted.",
        )

    data = await file.read()
    if len(data) > 5 * 1024 * 1024:  # 5 MB hard limit
        raise HTTPException(
            status_code=413,
            detail="File too large — maximum 5 MB.",
        )

    try:
        profile = await parse_resume(data, content_type=file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Resume parsing failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Resume parsing failed — please try again.",
        )

    sid = session_id or str(uuid.uuid4())
    sessions.setdefault(sid, {"history": [], "profile": None})
    sessions[sid]["profile"] = profile

    return ParseResumeResponse(
        session_id=sid,
        profile=profile.__dict__,
    )


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
