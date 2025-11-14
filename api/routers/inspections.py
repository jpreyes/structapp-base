from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from api.dependencies import UserIdDep
from api.schemas.inspections import (
    DamageCreate,
    DamagePhotoResponse,
    DamageResponse,
    DamageUpdate,
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
    InspectionCreate,
    InspectionResponse,
    PhotoUploadResponse,
    TestCreate,
    TestResponse,
    TestUpdate,
)
from services.inspection_archive_service import create_inspection_archive, generate_inspection_pdf
from services.inspections_service import (
    create_project_inspection,
    create_project_inspection_damage,
    create_project_inspection_damage_photo,
    create_project_inspection_document,
    create_project_inspection_test,
    delete_project_inspection,
    delete_project_inspection_damage,
    delete_project_inspection_damage_photo,
    delete_project_inspection_document,
    delete_project_inspection_test,
    get_project_inspection_damage,
    list_project_inspection_damage_photos,
    list_project_inspection_damages,
    list_project_inspection_documents,
    list_project_inspection_tests,
    list_project_inspections,
    update_project_inspection_test,
    update_project_inspection_damage,
    update_project_inspection_document,
)
from services.media_service import compress_and_store_inspection_photo

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
async def get_project_damages(project_id: str, user_id: UserIdDep, inspection_id: str | None = None):
    try:
        return list_project_inspection_damages(project_id, inspection_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/inspection-damages", response_model=DamageResponse, status_code=status.HTTP_201_CREATED)
async def create_damage(payload: DamageCreate, user_id: UserIdDep):
    try:
        damage = create_project_inspection_damage(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return damage


@router.get("/inspection-damages/{damage_id}/photos", response_model=list[DamagePhotoResponse])
async def list_damage_photos(damage_id: str, user_id: UserIdDep):
    damage = get_project_inspection_damage(damage_id)
    if not damage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daño no encontrado")
    photos = list_project_inspection_damage_photos(damage_id)
    return photos


@router.post("/inspection-damages/{damage_id}/photos", response_model=DamagePhotoResponse)
async def upload_damage_photo(
    damage_id: str,
    user_id: UserIdDep,
    file: UploadFile = File(...),
):
    damage = get_project_inspection_damage(damage_id)
    if not damage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daño no encontrado")
    try:
        url = compress_and_store_inspection_photo(file, damage["project_id"], damage["inspection_id"])
        photo = create_project_inspection_damage_photo(
            {
                "project_id": damage.get("project_id"),
                "inspection_id": damage.get("inspection_id"),
                "damage_id": damage_id,
                "photo_url": url,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return photo


@router.delete("/inspection-damages/{damage_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_damage_photo(damage_id: str, photo_id: str, user_id: UserIdDep):
    damage = get_project_inspection_damage(damage_id)
    if not damage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daño no encontrado")
    try:
        delete_project_inspection_damage_photo(photo_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/projects/{project_id}/inspection-tests", response_model=list[TestResponse])
async def get_project_tests(project_id: str, user_id: UserIdDep, inspection_id: str | None = None):
    try:
        return list_project_inspection_tests(project_id, inspection_id)
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
async def get_project_documents(project_id: str, user_id: UserIdDep, inspection_id: str | None = None):
    try:
        return list_project_inspection_documents(project_id, inspection_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/inspection-documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(payload: DocumentCreate, user_id: UserIdDep):
    try:
        document = create_project_inspection_document(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return document


@router.post("/inspection-photos", response_model=PhotoUploadResponse)
async def upload_inspection_photo(
    user_id: UserIdDep,
    project_id: str = Form(...),
    inspection_id: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        url = compress_and_store_inspection_photo(file, project_id, inspection_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return PhotoUploadResponse(url=url)


@router.delete("/inspections/{inspection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inspection(inspection_id: str, user_id: UserIdDep):
    try:
        delete_project_inspection(inspection_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.delete("/inspection-damages/{damage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_damage(damage_id: str, user_id: UserIdDep):
    try:
        delete_project_inspection_damage(damage_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.patch("/inspection-damages/{damage_id}", response_model=DamageResponse)
async def update_damage(damage_id: str, payload: DamageUpdate, user_id: UserIdDep):
    try:
        return update_project_inspection_damage(damage_id, payload.model_dump(exclude_none=True))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.delete("/inspection-tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test(test_id: str, user_id: UserIdDep):
    try:
        delete_project_inspection_test(test_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.patch("/inspection-tests/{test_id}", response_model=TestResponse)
async def update_test(test_id: str, payload: TestUpdate, user_id: UserIdDep):
    try:
        return update_project_inspection_test(test_id, payload.model_dump(exclude_none=True))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.delete("/inspection-documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: str, user_id: UserIdDep):
    try:
        delete_project_inspection_document(document_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.patch("/inspection-documents/{document_id}", response_model=DocumentResponse)
async def update_document(document_id: str, payload: DocumentUpdate, user_id: UserIdDep):
    try:
        return update_project_inspection_document(document_id, payload.model_dump(exclude_none=True))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/inspections/{inspection_id}/report")
async def inspection_report(inspection_id: str, user_id: UserIdDep):
    try:
        pdf_path = generate_inspection_pdf(inspection_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return FileResponse(str(pdf_path), media_type="application/pdf", filename=f"{inspection_id}.pdf")


@router.get("/inspections/{inspection_id}/archive")
async def inspection_archive(inspection_id: str, user_id: UserIdDep):
    try:
        zip_path = create_inspection_archive(inspection_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return FileResponse(str(zip_path), media_type="application/zip", filename=f"{inspection_id}.zip")
