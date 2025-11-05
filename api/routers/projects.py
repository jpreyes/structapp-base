from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Response, status

from api.dependencies import UserIdDep
from api.schemas.projects import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResponse,
    ProjectUpdate,
)
from services.projects_service import create_project, delete_project, fetch_project_detail, fetch_projects, update_project

router = APIRouter()


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(user_id: UserIdDep, archived: Optional[bool] = Query(default=None)):
    try:
        projects = fetch_projects(archived=archived)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return projects


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_new_project(user_id: UserIdDep, payload: ProjectCreate):
    try:
        project = create_project(user_id, payload.name, payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_existing_project(project_id: str, user_id: UserIdDep, payload: ProjectUpdate):
    try:
        project = update_project(project_id, payload.model_dump(exclude_unset=True))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return project


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project_detail(project_id: str, user_id: UserIdDep):
    try:
        detail = fetch_project_detail(project_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return detail


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project(project_id: str, user_id: UserIdDep):
    try:
        delete_project(project_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
