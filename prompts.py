from typing import Optional


class StudentProfile:
    def __init__(
        self,
        name: str = "",
        degree: str = "",
        school: str = "",
        year: str = "",
        gpa: str = "",
        skills: dict = None,
        active_skills: list = None,
        summary: str = "",
    ):
        self.name = name
        self.degree = degree
        self.school = school
        self.year = year
        self.gpa = gpa
        self.skills = skills or {}
        self.active_skills = active_skills or []
        self.summary = summary

    @property
    def active_skills(self) -> list:
        return self._active_skills

    @active_skills.setter
    def active_skills(self, value: list):
        self._active_skills = value or []


# ── Output format injected into the agent system prompt ──────────────────────

SKILL_OUTPUT_FORMAT = """
## Output format
For each internship, emit EXACTLY this block:

[INTERN_CARD]
title: Job Title
company: Company Name
location: City, State or Remote
pay: $X/hr or $X,000/summer or Not listed
deadline: Month YYYY or Rolling or Not listed
match_level: high | medium | low
skills: Comma, Separated, Required, Skills
link: https://...
notes: one sentence on fit
[/INTERN_CARD]
"""

SKILL_MATCH_SCORING = """
## Match scoring
- high   → internship needs 2+ of the student's ACTIVE skills
- medium → needs 1 active skill
- low    → interesting but skills not listed
Always surface at least one "high" match when possible; cite specific profile skills in notes.
"""


# ── Resume parser prompt ──────────────────────────────────────────────────────
# Used in resume_parser.py. Must return ONLY a JSON object — no markdown fences,
# no preamble. Keys must exactly match the StudentProfile class attributes.

RESUME_PARSER_PROMPT = """You are a resume parser. Extract structured data from the resume text and return ONLY a valid JSON object. No markdown, no backticks, no explanation.

Return exactly this shape:
{
  "name":    "Full Name",
  "degree":  "e.g. B.S. Computer Science",
  "school":  "University Name",
  "year":    "Freshman | Sophomore | Junior | Senior | Graduate",
  "gpa":     "3.X or null if not listed",
  "summary": "One sentence describing the student.",
  "skills": {
    "languages":   ["Python", "Java"],
    "frameworks":  ["React", "FastAPI"],
    "tools":       ["Git", "Docker"],
    "other":       []
  }
}

Rules:
- If a field is missing from the resume, use an empty string "" or empty list [].
- For "year", infer from graduation date or class standing if not explicitly stated.
- For "skills", flatten all technical skills into the most appropriate sub-key.
- Never invent information not present in the resume.
"""


# ── Agent system prompt builder ───────────────────────────────────────────────

def build_system_prompt(profile: Optional[StudentProfile] = None) -> str:
    base = (
        "You are InternFinder, an AI agent that helps CS students find internships.\n"
        "You search the live web and return specific, current, real opportunities.\n\n"
        "## Guardrails — follow strictly\n"
        "- ONLY discuss internships, jobs, careers, and student professional development.\n"
        "- NEVER fabricate companies, titles, or links.\n"
        "- If asked about anything unrelated (homework, general coding, etc.), politely redirect.\n"
        "- If a location or pay requirement is unrealistic, say so and ask for a real one.\n"
    ) + SKILL_OUTPUT_FORMAT

    if profile:
        active = profile.active_skills or []
        return (
            base
            + SKILL_MATCH_SCORING
            + f"\n## Student Profile\n"
            + f"- Name: {profile.name}\n"
            + f"- Degree: {profile.degree} at {profile.school}\n"
            + f"- Year: {profile.year}\n"
            + (f"- GPA: {profile.gpa}\n" if profile.gpa else "")
            + f"- Active skills: {', '.join(active) if active else 'None selected yet'}\n"
            + f"- Summary: {profile.summary}\n"
        )

    return base
