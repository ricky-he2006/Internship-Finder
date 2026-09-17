import os
from dataclasses import dataclass, field
from typing import List

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    # NVIDIA NIM
    nvidia_api_key: str = os.getenv("NVIDIA_API_KEY", "")
    base_url: str = "https://integrate.api.nvidia.com/v1"
    model: str = os.getenv("MODEL", "meta/llama-3.3-70b-instruct")
    max_tokens: int = int(os.getenv("MAX_TOKENS", "1500"))

    # Brave Search
    brave_api_key: str = os.getenv("BRAVE_API_KEY", "")
    brave_endpoint: str = "https://api.search.brave.com/res/v1/web/search"
    brave_result_count: int = 5

    # Agent
    max_tool_rounds: int = 5

    # Server
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    allow_origins: List[str] = field(default_factory=lambda: ["*"])

    def validate(self):
        if not self.nvidia_api_key:
            raise ValueError(
                "NVIDIA_API_KEY is missing — check your .env file."
            )
        if not self.brave_api_key:
            raise ValueError(
                "BRAVE_API_KEY is missing — check your .env file."
            )


settings = Settings()
