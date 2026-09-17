"""
Agentic loop: sends user messages to NVIDIA NIM, handles tool calls.

Usage:
    reply, messages = await run_agent(message, history, profile)
"""
import json
import logging
from typing import Optional, Tuple

from clients import nim_client
from config import settings
from prompts import StudentProfile, build_system_prompt
from tools import TOOL_SCHEMAS, execute_tool

logger = logging.getLogger(__name__)


async def run_agent(
    user_message: str,
    conversation_history: list,
    profile: Optional[StudentProfile] = None,
) -> Tuple[str, list]:
    """
    Run the InternFinder agentic loop.

    Returns:
        (final_text, updated_messages) — caller should persist updated_messages
        as the new conversation_history for the next turn.
    """
    client = nim_client()  # AsyncOpenAI → won't block the event loop
    system_prompt = build_system_prompt(profile)
    messages = conversation_history + [{"role": "user", "content": user_message}]

    tool_rounds = 0
    final_text = ""

    while True:
        resp = await client.chat.completions.create(
            model=settings.model,
            max_tokens=settings.max_tokens,
            temperature=0.2,
            tools=TOOL_SCHEMAS,
            messages=[{"role": "system", "content": system_prompt}] + messages,
        )

        msg = resp.choices[0].message
        finish = resp.choices[0].finish_reason

        # ── Model is done ────────────────────────────────────────────────────
        if finish == "stop":
            final_text = msg.content or ""
            messages.append({"role": "assistant", "content": final_text})
            break

        # ── Model wants to call a tool ────────────────────────────────────────
        if finish == "tool_calls":
            if tool_rounds >= settings.max_tool_rounds:
                final_text = (
                    "I searched extensively but couldn't find a complete answer. "
                    "Try narrowing your request — e.g. specify a city, skill, or company."
                )
                break

            # Append the assistant's tool-call turn to history
            messages.append(msg.model_dump(exclude_none=True))

            # Execute each requested tool and append results
            for tc in msg.tool_calls or []:
                try:
                    args = json.loads(tc.function.arguments or "{}")
                    logger.info("Tool call: %s(%s)", tc.function.name, args)
                    result = await execute_tool(tc.function.name, args)
                except Exception as e:
                    logger.error("Tool execution error: %s", e, exc_info=True)
                    result = json.dumps({"error": str(e)})

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": result,
                    }
                )

            tool_rounds += 1
            continue  # loop back → let the model read tool results

        # ── Unexpected finish reason ──────────────────────────────────────────
        logger.warning("Unexpected finish_reason: %s", finish)
        break

    return final_text, messages
