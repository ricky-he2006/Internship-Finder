# InternFinder

An agentic FastAPI backend that uses NVIDIA NIM + Brave Search to find real internship postings for CS students.

---

## Project Structure

```
internfinder/
├── .env                  ← your API keys (never commit this)
├── .gitignore
├── requirements.txt
├── config.py             ← all settings, loaded from .env
├── clients.py            ← shared AsyncOpenAI client factory
├── prompts.py            ← system prompts + StudentProfile class
├── tools.py              ← Brave Search tool schema + implementation
├── agent.py              ← agentic tool-calling loop
├── resume_parser.py      ← PDF extraction + LLM structuring
├── main.py               ← FastAPI server + session store
└── evals/
    ├── test_cases.json   ← golden test set
    └── run_evals.py      ← evaluation harness
```

---

## Setup

### 1. Get API Keys

| Key | Where to get it |
|-----|----------------|
| `NVIDIA_API_KEY` | https://build.nvidia.com → pick any model → "Get API Key" |
| `BRAVE_API_KEY` | https://brave.com/search/api/ → free tier = 2,000 queries/month |

### 2. Clone & install

```bash
git clone <your-repo>
cd internfinder
python -m venv .venv
source .venv/bin activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure

Fill in `NVIDIA_API_KEY` and `BRAVE_API_KEY` in the `.env` file.

### 4. Run the server

```bash
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/chat` | Send a message, get internship results |
| `POST` | `/parse-resume` | Upload PDF/txt resume, get a StudentProfile |

### Example `/chat` request

```json
{
  "message": "Find remote Python internships for sophomores",
  "session_id": "optional-existing-session-id",
  "active_skills": ["Python", "FastAPI"]
}
```

### Example `/parse-resume` request

```bash
curl -X POST http://localhost:8000/parse-resume \
  -F "file=@resume.pdf"
```

---

## Running Evals

```bash
python evals/run_evals.py
```

Tests cover happy paths, edge cases (impossible locations, unrealistic pay), and off-topic guardrails.
