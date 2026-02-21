from flask import current_app
from openai import OpenAI

_client: OpenAI | None = None


def get_openai() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=current_app.config["OPENAI_API_KEY"])
    return _client


def reset_client() -> None:
    global _client
    _client = None
