from typing import Annotated, Any

from fastapi import Depends, Header, HTTPException, status

from supa.client import supa


def get_supabase():
    return supa()


SupabaseClientDep = Annotated[object, Depends(get_supabase)]


async def get_current_token(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header must use Bearer token")
    return authorization.split(" ", 1)[1]


async def get_current_user(token: Annotated[str, Depends(get_current_token)]):
    client = supa()
    try:
        session = client.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if not session.user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return session.user


CurrentUserDep = Annotated[Any, Depends(get_current_user)]


async def get_user_id(user = Depends(get_current_user)) -> str:
    return str(user.id)


UserIdDep = Annotated[str, Depends(get_user_id)]

TokenDep = Annotated[str, Depends(get_current_token)]
