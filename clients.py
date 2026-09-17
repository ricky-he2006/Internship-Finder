"""
Shared API client factory.
Import nim_client() from here — never instantiate OpenAI directly in other modules.
"""
from openai import AsyncOpenAI

from config import settings


def nim_client() -> AsyncOpenAI:
    """Return an async OpenAI-compatible client pointed at NVIDIA NIM."""
    return AsyncOpenAI(
        base_url=settings.base_url,
        api_key=settings.nvidia_api_key,
    )
