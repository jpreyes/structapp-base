from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from services.auth_service import login, register


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
