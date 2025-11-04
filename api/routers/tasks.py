from fastapi import APIRouter, HTTPException, status

from api.dependencies import UserIdDep
from api.schemas.tasks import TaskCreate, TaskResponse, TaskUpdate
from services.tasks_service import create_task, delete_task, list_tasks, update_task

router = APIRouter()


@router.get("/{project_id}", response_model=list[TaskResponse])
async def get_tasks(project_id: str, user_id: UserIdDep):
    try:
        tasks = list_tasks(project_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return tasks


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_new_task(payload: TaskCreate, user_id: UserIdDep):
    try:
        task = create_task(
            payload.project_id,
            payload.title,
            str(payload.start_date),
            str(payload.end_date),
            progress=payload.progress,
            status=payload.status,
            assignee=payload.assignee or "",
            notes=payload.notes or "",
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_existing_task(task_id: str, payload: TaskUpdate, user_id: UserIdDep):
    try:
        task = update_task(task_id, {k: (str(v) if hasattr(v, "isoformat") else v) for k, v in payload.model_dump(exclude_unset=True).items()})
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_task(task_id: str, user_id: UserIdDep):
    try:
        delete_task(task_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return None
