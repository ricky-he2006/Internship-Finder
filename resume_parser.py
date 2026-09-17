"""
Resume parsing: extracts structured data from uploaded resumes (PDF or plain text).

Two-stage pipeline:
  1. Extract raw text deterministically (pypdf or plain decode).
  2. Ask the LLM to structure it into a StudentProfile dict (JSON).
"""
import json
import logging
from io import BytesIO

from pypdf import PdfReader

from clients import nim_client
from config import settings
from prompts import StudentProfile, RESUME_PARSER_PROMPT

logger = logging.getLogger(__name__)


# ── PDF text extraction ───────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Deterministically extract plain text from a PDF.
    Raises ValueError with a user-friendly message on failure.
    """
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        if reader.is_encrypted:
            raise ValueError(
                "PDF is encrypted — please unlock it before uploading."
            )
        text = "\n\n".join(
            (page.extract_text() or "").strip()
            for page in reader.pages
        ).strip()
        if not text:
            raise ValueError(
                "No extractable text found (scanned/image PDF?). "
                "Please paste your resume as plain text instead."
            )
        return text
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Could not read PDF: {e}") from e


def extract_text_from_plain(txt_bytes: bytes) -> str:
    """Decode a plain-text resume upload."""
    try:
        return txt_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        return txt_bytes.decode("latin-1").strip()


# ── LLM structuring ───────────────────────────────────────────────────────────

async def parse_resume(
    file_bytes: bytes,
    content_type: str = "application/pdf",
) -> StudentProfile:
    """
    Two-stage pipeline:
      1. Extract raw text deterministically (pypdf or plain decode).
      2. Ask the LLM to structure it into a StudentProfile dict (JSON).

    Returns a StudentProfile instance.
    Raises ValueError on parse failure so the caller can return HTTP 422.
    """
    # Stage 1 — extract text
    if content_type == "text/plain":
        resume_text = extract_text_from_plain(file_bytes)
    else:
        resume_text = extract_text_from_pdf(file_bytes)

    if not resume_text:
        raise ValueError("Resume appears to be empty.")

    # Stage 2 — structure via LLM
    client = nim_client()

    resp = await client.chat.completions.create(
        model=settings.model,
        max_tokens=1000,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": RESUME_PARSER_PROMPT},
            {"role": "user", "content": f"Parse this resume:\n\n{resume_text}"},
        ],
    )

    raw = (resp.choices[0].message.content or "").strip()

    # Strip accidental markdown fences (model sometimes ignores instructions)
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error(
            "Bad JSON from resume parser (first 300 chars): %s", raw[:300]
        )
        raise ValueError(
            "Model returned malformed JSON — try pasting your resume as text."
        ) from e

    # Build StudentProfile from the parsed dict — use defaults for missing keys
    return StudentProfile(
        name=data.get("name", ""),
        degree=data.get("degree", ""),
        school=data.get("school", ""),
        year=data.get("year", ""),
        gpa=data.get("gpa", ""),
        skills=data.get("skills", {}),
        active_skills=data.get("active_skills", []),
        summary=data.get("summary", ""),
    )
