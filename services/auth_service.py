from supa.client import supa
def register(email: str, password: str) -> dict:
    res = supa().auth.sign_up({"email": email, "password": password})
    if res.user is None:
        raise ValueError("No se pudo crear la cuenta (activa email/password en Supabase).")
    supa().table("profiles").upsert({"user_id": res.user.id, "plan": "basic"}).execute()
    return {"id": res.user.id, "email": res.user.email, "plan": "basic"}
def login(email: str, password: str) -> dict:
    res = supa().auth.sign_in_with_password({"email": email, "password": password})
    if not res.user:
        raise ValueError("Credenciales inválidas")
    prof = supa().table("profiles").select("*").eq("user_id", res.user.id).single().execute().data
    return {"id": res.user.id, "email": res.user.email, "plan": prof.get("plan","basic")}
