from flask import current_app
from supabase import Client, create_client

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            current_app.config["SUPABASE_URL"],
            current_app.config["SUPABASE_KEY"],
        )
    return _client


def reset_client() -> None:
    global _client
    _client = None
