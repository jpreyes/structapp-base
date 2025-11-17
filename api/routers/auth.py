from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from api.dependencies import TokenDep, UserIdDep
from services.auth_service import delete_user_account, login, register


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    id: str
    email: EmailStr
    plan: str
    session_token: str | None = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register_user(payload: RegisterPayload):
    try:
        user = register(payload.email, payload.password)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return user


@router.post("/login", response_model=AuthResponse)
async def login_user(payload: LoginPayload):
    try:
        user = login(payload.email, payload.password)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return user


@router.delete("/me")
async def delete_account(user_id: str = Depends(UserIdDep), user_token: str = Depends(TokenDep)):
    try:
        delete_user_account(user_id, user_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo eliminar la cuenta.",
        )
    return {"detail": "Cuenta eliminada correctamente"}
