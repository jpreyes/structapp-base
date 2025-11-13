from supa.client import supa


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
    return supa().table("project_inspections").insert(payload).execute().data[0]


def list_project_inspection_damages(project_id: str):
    return (
        supa()
        .table("project_inspection_damages")
        .select("*")
        .eq("project_id", project_id)
        .order("severity", desc=True)
        .execute()
        .data
    )


def create_project_inspection_damage(payload: dict):
    return supa().table("project_inspection_damages").insert(payload).execute().data[0]


def list_project_inspection_tests(project_id: str):
    return (
        supa()
        .table("project_inspection_tests")
        .select("*")
        .eq("project_id", project_id)
        .order("executed_at", desc=True)
        .execute()
        .data
    )


def create_project_inspection_test(payload: dict):
    return supa().table("project_inspection_tests").insert(payload).execute().data[0]


def list_project_inspection_documents(project_id: str):
    return (
        supa()
        .table("project_inspection_documents")
        .select("*")
        .eq("project_id", project_id)
        .order("issued_at", desc=True)
        .execute()
        .data
    )


def create_project_inspection_document(payload: dict):
    return supa().table("project_inspection_documents").insert(payload).execute().data[0]
