from datetime import date, datetime
from typing import Any, Mapping

from supa.client import supa


def _serialize_payload(payload: Mapping[str, Any]) -> dict:
    serialized: dict[str, Any] = {}
    for key, value in payload.items():
        if isinstance(value, (date, datetime)):
            serialized[key] = value.isoformat()
        elif isinstance(value, list):
            serialized[key] = [
                item.isoformat() if isinstance(item, (date, datetime)) else item for item in value
            ]
        else:
            serialized[key] = value
    return serialized


def list_project_inspections(project_id: str):
    return (
        supa()
        .table("project_inspections")
        .select("*")
        .eq("project_id", project_id)
        .order("inspection_date", desc=True)
        .execute()
        .data
    )


def create_project_inspection(payload: dict):
    return (
        supa()
        .table("project_inspections")
        .insert(_serialize_payload(payload))
        .execute()
        .data[0]
    )


def list_project_inspection_damages(project_id: str, inspection_id: str | None = None):
    query = (
        supa()
        .table("project_inspection_damages")
        .select("*")
        .eq("project_id", project_id)
        .order("severity", desc=True)
    )
    if inspection_id:
        query = query.eq("inspection_id", inspection_id)
    return query.execute().data


def create_project_inspection_damage(payload: dict):
    return (
        supa()
        .table("project_inspection_damages")
        .insert(_serialize_payload(payload))
        .execute()
        .data[0]
    )


def list_project_inspection_tests(project_id: str, inspection_id: str | None = None):
    query = (
        supa()
        .table("project_inspection_tests")
        .select("*")
        .eq("project_id", project_id)
        .order("executed_at", desc=True)
    )
    if inspection_id:
        query = query.eq("inspection_id", inspection_id)
    return query.execute().data


def create_project_inspection_test(payload: dict):
    return (
        supa()
        .table("project_inspection_tests")
        .insert(_serialize_payload(payload))
        .execute()
        .data[0]
    )


def list_project_inspection_documents(project_id: str, inspection_id: str | None = None):
    query = (
        supa()
        .table("project_inspection_documents")
        .select("*")
        .eq("project_id", project_id)
        .order("issued_at", desc=True)
    )
    if inspection_id:
        query = query.eq("inspection_id", inspection_id)
    return query.execute().data


def create_project_inspection_document(payload: dict):
    return (
        supa()
        .table("project_inspection_documents")
        .insert(_serialize_payload(payload))
        .execute()
        .data[0]
    )


def delete_project_inspection(inspection_id: str):
    supa().table("project_inspections").delete().eq("id", inspection_id).execute()


def delete_project_inspection_damage(damage_id: str):
    supa().table("project_inspection_damages").delete().eq("id", damage_id).execute()


def delete_project_inspection_test(test_id: str):
    supa().table("project_inspection_tests").delete().eq("id", test_id).execute()


def delete_project_inspection_document(document_id: str):
    supa().table("project_inspection_documents").delete().eq("id", document_id).execute()


def update_project_inspection_damage(damage_id: str, payload: dict):
    return (
        supa()
        .table("project_inspection_damages")
        .update(_serialize_payload(payload))
        .eq("id", damage_id)
        .execute()
        .data[0]
    )


def update_project_inspection_test(test_id: str, payload: dict):
    return (
        supa()
        .table("project_inspection_tests")
        .update(_serialize_payload(payload))
        .eq("id", test_id)
        .execute()
        .data[0]
    )


def update_project_inspection_document(document_id: str, payload: dict):
    return (
        supa()
        .table("project_inspection_documents")
        .update(_serialize_payload(payload))
        .eq("id", document_id)
        .execute()
        .data[0]
    )
