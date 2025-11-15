from datetime import date, datetime
import logging
from typing import Any, Mapping

from core.config import SUPABASE_SERVICE_KEY
from supa.client import supa, supa_service

from services.inspection_scoring import (
    calculate_inspection_deterministic_score,
    evaluate_inspection_with_llm,
    score_damage_record,
)


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
    result = (
        supa()
        .table("project_inspections")
        .insert(_serialize_payload(payload))
        .execute()
        .data[0]
    )
    _update_inspection_scores(result["id"])
    return result


def get_project_inspection(inspection_id: str):
    result = (
        supa()
        .table("project_inspections")
        .select("*")
        .eq("id", inspection_id)
        .single()
        .execute()
    )
    return result.data


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
    damages = query.execute().data
    if not damages:
        return damages
    damage_ids = [damage["id"] for damage in damages if damage.get("id")]
    photos = (
        supa()
        .table("project_inspection_damage_photos")
        .select("*")
        .in_("damage_id", damage_ids)
        .execute()
        .data
    )
    photo_map: dict[str, list[dict[str, str]]] = {}
    for photo in photos or []:
        damage_id = photo.get("damage_id")
        url = photo.get("photo_url")
        pid = photo.get("id")
        comments = photo.get("comments")
        if damage_id and url:
            photo_map.setdefault(damage_id, []).append(
                {"id": pid, "photo_url": url, "comments": comments}
            )
    for damage in damages:
        damage["photos"] = photo_map.get(damage.get("id") or "", [])
    return damages


def create_project_inspection_damage(payload: dict):
    result = (
        supa()
        .table("project_inspection_damages")
        .insert(_serialize_payload(payload))
        .execute()
        .data[0]
    )
    _update_damage_and_inspection_scores(result["id"])
    return result


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
    damage = get_project_inspection_damage(damage_id)
    if not damage:
        return
    supa().table("project_inspection_damages").delete().eq("id", damage_id).execute()
    _update_inspection_scores(damage["inspection_id"])


def delete_project_inspection_test(test_id: str):
    supa().table("project_inspection_tests").delete().eq("id", test_id).execute()


def delete_project_inspection_document(document_id: str):
    supa().table("project_inspection_documents").delete().eq("id", document_id).execute()


def update_project_inspection_damage(damage_id: str, payload: dict):
    updated = (
        supa()
        .table("project_inspection_damages")
        .update(_serialize_payload(payload))
        .eq("id", damage_id)
        .execute()
        .data[0]
    )
    _update_damage_and_inspection_scores(damage_id)
    return updated


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
def get_project_inspection_damage(damage_id: str):
    result = (
        supa()
        .table("project_inspection_damages")
        .select("*")
        .eq("id", damage_id)
        .single()
        .execute()
    )
    return result.data


def list_project_inspection_damage_photos(damage_id: str):
    result = (
        supa()
        .table("project_inspection_damage_photos")
        .select("*")
        .eq("damage_id", damage_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data


def create_project_inspection_damage_photo(payload: dict):
    return (
        supa()
        .table("project_inspection_damage_photos")
        .insert(_serialize_payload(payload))
        .execute()
        .data[0]
    )


def delete_project_inspection_damage_photo(photo_id: str):
    supa().table("project_inspection_damage_photos").delete().eq("id", photo_id).execute()


def update_project_inspection_damage_photo(photo_id: str, payload: dict):
    result = (
        supa()
        .table("project_inspection_damage_photos")
        .update(_serialize_payload(payload))
        .eq("id", photo_id)
        .execute()
    )
    data = result.data
    return data[0] if data else None


def _safe_update(table: str, payload: dict[str, Any], condition: dict[str, Any]):
    client = supa_service() if SUPABASE_SERVICE_KEY else supa()
    key, value = next(iter(condition.items()))
    try:
        client.table(table).update(payload).eq(key, value).execute()
    except Exception as exc:
        logger = logging.getLogger(__name__)
        logger.warning("Score update failed for %s: %s", table, exc)


def _format_timestamp(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def _update_damage_and_inspection_scores(damage_id: str):
    damage = get_project_inspection_damage(damage_id)
    if not damage:
        return
    scoring = score_damage_record(damage)
    _safe_update(
        "project_inspection_damages",
        {
            "deterministic_score": scoring["deterministic_score"],
            "llm_score": scoring["llm_score"],
            "llm_reason": scoring["llm_reason"],
            "llm_payload": scoring["llm_payload"],
            "score_updated_at": _format_timestamp(datetime.utcnow()),
        },
        {"id": damage_id},
    )
    _update_inspection_scores(damage["inspection_id"])


def _update_inspection_scores(inspection_id: str):
    inspection = get_project_inspection(inspection_id)
    if not inspection:
        return
    project_id = inspection["project_id"]
    damages = list_project_inspection_damages(project_id, inspection_id)
    deterministic = calculate_inspection_deterministic_score(damages)
    llm_result = evaluate_inspection_with_llm(inspection, damages)
    _safe_update(
        "project_inspections",
        {
            "deterministic_score": deterministic,
            "llm_score": llm_result.get("llm_score"),
            "llm_reason": llm_result.get("reason"),
            "llm_payload": llm_result.get("payload"),
            "score_updated_at": _format_timestamp(datetime.utcnow()),
        },
        {"id": inspection_id},
    )
