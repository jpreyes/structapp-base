from supabase import create_client, Client
from core.config import SUPABASE_URL, SUPABASE_ANON_KEY
_client: Client | None = None
def supa() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_ANON_KEY")
        _client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _client
