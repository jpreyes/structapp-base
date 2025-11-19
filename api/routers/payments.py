from fastapi import APIRouter, HTTPException, status

from api.dependencies import UserIdDep
from api.schemas.payments import PaymentCreate, PaymentResponse, PaymentUpdate
from supa.client import supa

router = APIRouter()


@router.get("/{project_id}", response_model=list[PaymentResponse])
async def list_payments(project_id: str, user_id: UserIdDep):
    try:
        data = (
            supa()
            .table("project_payments")
            .select("*")
            .eq("project_id", project_id)
            .order("event_date", desc=True)
            .execute()
            .data
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return data


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(payload: PaymentCreate, user_id: UserIdDep):
    try:
        payload_data = payload.model_dump()
        for field in ("event_date", "due_date"):
            if field in payload_data and hasattr(payload_data[field], "isoformat"):
                payload_data[field] = payload_data[field].isoformat()

        response = (
            supa()
            .table("project_payments")
            .insert(payload_data)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if not response.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No payment created")
    return response.data[0]


@router.patch("/{payment_id}", response_model=PaymentResponse)
async def update_payment(payment_id: str, payload: PaymentUpdate, user_id: UserIdDep):
    try:
        patch = payload.model_dump(exclude_unset=True)
        for field in ("event_date", "due_date"):
            if field in patch and hasattr(patch[field], "isoformat"):
                patch[field] = patch[field].isoformat()
        response = (
            supa()
            .table("project_payments")
            .update(patch)
            .eq("id", payment_id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return response.data[0]


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(payment_id: str, user_id: UserIdDep):
    try:
        supa().table("project_payments").delete().eq("id", payment_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return None
