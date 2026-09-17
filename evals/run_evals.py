"""
InternFinder evaluation harness.
Run from the project root:  python evals/run_evals.py
"""
import asyncio
import json
import sys
from pathlib import Path

# Make project root importable regardless of cwd
sys.path.insert(0, str(Path(__file__).parent.parent))

from agent import run_agent  # noqa: E402 (must come after sys.path insert)

# ── ANSI colours ──────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"


# ── Single test runner ────────────────────────────────────────────────────────

async def run_one(test: dict) -> bool:
    print(f"\n{'─' * 60}")
    print(f"{CYAN}[{test['id']}]{RESET} {BOLD}{test['prompt']}{RESET}")
    if test.get("note"):
        print(f"  {YELLOW}expect: {test['note']}{RESET}")

    try:
        resp, _ = await run_agent(test["prompt"], [], None)
    except Exception as e:
        print(f"{RED}✗ EXCEPTION: {e}{RESET}")
        return False

    fails = []
    resp_lower = resp.lower()

    for phrase in test.get("expect_contains", []):
        if phrase.lower() not in resp_lower:
            fails.append(f"missing required phrase '{phrase}'")

    for phrase in test.get("expect_not_contains", []):
        if phrase.lower() in resp_lower:
            fails.append(f"forbidden phrase '{phrase}' found in response")

    card_count = resp.count("[INTERN_CARD]")
    min_cards = test.get("min_cards", 0)
    if card_count < min_cards:
        fails.append(f"expected ≥{min_cards} INTERN_CARDs, got {card_count}")

    if not fails:
        print(f"{GREEN}✓ PASSED{RESET}")
    else:
        print(f"{RED}✗ FAILED{RESET}")
        for f in fails:
            print(f"  {RED}→ {f}{RESET}")
        # Print a snippet of the response to help debug
        snippet = resp[:400].replace("\n", " ")
        print(f"  {YELLOW}response snippet: {snippet}…{RESET}")

    return not fails


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    test_file = Path(__file__).parent / "test_cases.json"
    tests = json.loads(test_file.read_text())["test_cases"]

    print(f"\n{BOLD}InternFinder Eval Harness — {len(tests)} tests{RESET}")
    results = [await run_one(t) for t in tests]

    passed = sum(results)
    failed = len(results) - passed

    print(f"\n{'═' * 60}")
    print(
        f"{BOLD}Results: {GREEN}{passed} passed{RESET}  "
        f"{RED}{failed} failed{RESET}  / {len(results)} total{RESET}"
    )

    if failed:
        print(
            f"{YELLOW}→ Fix guardrails or output format in prompts.py, "
            "then re-run.{RESET}"
        )
        sys.exit(1)
    else:
        print(f"{GREEN}All tests passed!{RESET}")


if __name__ == "__main__":
    asyncio.run(main())
