from supa.client import supa
from typing import Optional
def list_columns(project_id: str) -> list[dict]:
    return supa().table("kanban_columns").select("*").eq("project_id", project_id).order("position").execute().data
def create_column(project_id: str, name: str, position: float = 100.0) -> dict:
    return supa().table("kanban_columns").insert({"project_id": project_id, "name": name, "position": position}).execute().data[0]
def rename_column(column_id: str, name: str): supa().table("kanban_columns").update({"name": name}).eq("id", column_id).execute()
def delete_column(column_id: str): supa().table("kanban_columns").delete().eq("id", column_id).execute()
def list_cards_by_column(column_id: str) -> list[dict]:
    return supa().table("kanban_cards").select("*").eq("column_id", column_id).order("position").execute().data
def create_card(project_id: str, column_id: str, title: str, description: str = "", assignee: str = "", due_date: Optional[str] = None, labels: Optional[list[str]] = None, position: float = 100.0) -> dict:
    payload = {"project_id": project_id, "column_id": column_id, "title": title, "description": description, "assignee": assignee, "due_date": due_date, "labels": labels or [], "position": position}
    return supa().table("kanban_cards").insert(payload).execute().data[0]
def update_card(card_id: str, patch: dict): supa().table("kanban_cards").update(patch).eq("id", card_id).execute()
def delete_card(card_id: str): supa().table("kanban_cards").delete().eq("id", card_id).execute()
def move_card(card_id: str, to_column_id: str, new_position: float):
    supa().table("kanban_cards").update({"column_id": to_column_id, "position": new_position}).eq("id", card_id).execute()
