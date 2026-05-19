from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from api.dependencies import CurrentUserDep, TokenDep
from services.auth_service import update_user_credentials
from services.user_service import get_user_profile_summary, update_profile_metadata


class UserProfileResponse(BaseModel):
    email: EmailStr
    full_name: str | None = None
    profession: str | None = None
    company_name: str | None = None
    company_role: str | None = None
    plan: str
    plan_status: str | None = None
    plan_started_at: str | None = None
    plan_expires_at: str | None = None
    avatar_url: str | None = None
    project_count: int
    project_limit: int | None = None
    flow_subscription_id: str | None = None
    flow_customer_id: str | None = None


class UpdateProfilePayload(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    profession: str | None = None
    company_name: str | None = None
    company_role: str | None = None
    avatar_url: str | None = None
    password: str | None = None


router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def read_profile(user=Depends(CurrentUserDep)):
    summary = get_user_profile_summary(user.id)
    return {"email": user.email, **summary}


@router.patch("/me", response_model=UserProfileResponse)
async def update_profile(payload: UpdateProfilePayload, user=Depends(CurrentUserDep), token: str = Depends(TokenDep)):
    updates: dict[str, str | None] = {}
    if payload.full_name is not None:
        updates["full_name"] = payload.full_name.strip() or None
    if payload.profession is not None:
        updates["profession"] = payload.profession.strip() or None
    if payload.company_name is not None:
        updates["company_name"] = payload.company_name.strip() or None
    if payload.company_role is not None:
        updates["company_role"] = payload.company_role.strip() or None
    if payload.avatar_url is not None:
        updates["avatar_url"] = payload.avatar_url.strip() or None

    if updates:
        try:
            update_profile_metadata(user.id, updates, token)
        except RuntimeError as exc:
            detail = str(exc) or "No se pudo actualizar el perfil."
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc

    auth_updates: dict[str, str] = {}
    if payload.email and payload.email != user.email:
        auth_updates["email"] = payload.email
    if payload.password:
        auth_updates["password"] = payload.password

    if auth_updates:
        try:
            update_user_credentials(token, auth_updates)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo actualizar la cuenta.",
            ) from exc

    summary = get_user_profile_summary(user.id)
    return {"email": payload.email or user.email, **summary}
