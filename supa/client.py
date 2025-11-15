from supabase import Client, create_client
from core.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

_client: Client | None = None
_service_client: Client | None = None


def supa() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_ANON_KEY")
        _client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _client


def supa_service() -> Client:
    global _service_client
    if _service_client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY")
        _service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _service_client
