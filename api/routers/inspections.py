from fastapi import APIRouter, HTTPException, status

from api.dependencies import UserIdDep
from api.schemas.inspections import (
    DamageCreate,
    DamageResponse,
    DocumentCreate,
    DocumentResponse,
    InspectionCreate,
    InspectionResponse,
    TestCreate,
    TestResponse,
)
from services.inspections_service import (
    create_project_inspection,
    create_project_inspection_damage,
    create_project_inspection_document,
    create_project_inspection_test,
    list_project_inspection_damages,
    list_project_inspection_documents,
    list_project_inspection_tests,
    list_project_inspections,
)

router = APIRouter()


@router.get("/projects/{project_id}/inspections", response_model=list[InspectionResponse])
async def get_project_inspections(project_id: str, user_id: UserIdDep):
    try:
        return list_project_inspections(project_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/inspections", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
async def create_inspection(payload: InspectionCreate, user_id: UserIdDep):
    try:
        inspection = create_project_inspection(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return inspection


@router.get("/projects/{project_id}/inspection-damages", response_model=list[DamageResponse])
async def get_project_damages(project_id: str, user_id: UserIdDep):
    try:
        return list_project_inspection_damages(project_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/inspection-damages", response_model=DamageResponse, status_code=status.HTTP_201_CREATED)
async def create_damage(payload: DamageCreate, user_id: UserIdDep):
    try:
        damage = create_project_inspection_damage(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return damage


@router.get("/projects/{project_id}/inspection-tests", response_model=list[TestResponse])
async def get_project_tests(project_id: str, user_id: UserIdDep):
    try:
        return list_project_inspection_tests(project_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/inspection-tests", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
async def create_test(payload: TestCreate, user_id: UserIdDep):
    try:
        result = create_project_inspection_test(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return result


@router.get("/projects/{project_id}/inspection-documents", response_model=list[DocumentResponse])
async def get_project_documents(project_id: str, user_id: UserIdDep):
    try:
        return list_project_inspection_documents(project_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/inspection-documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(payload: DocumentCreate, user_id: UserIdDep):
    try:
        document = create_project_inspection_document(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return document
