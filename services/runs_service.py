from supa.client import supa


def save_run(project_id: str, user_id: str, element_type: str, inputs: dict, results: dict):
    payload = {
        "project_id": project_id,
        "created_by": user_id,
        "element_type": element_type,
        "input_json": inputs,
        "result_json": results,
    }
    return supa().table("calc_runs").insert(payload).execute().data[0]


def list_runs(project_id: str):
    return (
        supa()
        .table("calc_runs")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )


def fetch_run(run_id: str):
    try:
        response = supa().table("calc_runs").select("*").eq("id", run_id).single().execute()
        return response.data
    except Exception as e:
        print(f"Warning: Could not fetch run {run_id}: {str(e)}")
        return None


def set_critical_element(run_id: str, project_id: str, element_type: str):
    """
    Marca un elemento como crítico y desmarca todos los demás del mismo tipo en el proyecto.

    Args:
        run_id: ID del cálculo a marcar como crítico
        project_id: ID del proyecto
        element_type: Tipo de elemento (rc_beam, rc_column, steel_beam, etc.)
    """
    # Primero desmarcar todos los elementos del mismo tipo en el proyecto
    supa().table("calc_runs").update({"is_critical": False}).eq("project_id", project_id).eq("element_type", element_type).execute()

    # Luego marcar el elemento seleccionado como crítico
    supa().table("calc_runs").update({"is_critical": True}).eq("id", run_id).execute()

    # Obtener el registro actualizado
    response = supa().table("calc_runs").select("*").eq("id", run_id).single().execute()
    return response.data


def unset_critical_element(run_id: str):
    """
    Desmarca un elemento como crítico.

    Args:
        run_id: ID del cálculo a desmarcar
    """
    # Desmarcar el elemento
    supa().table("calc_runs").update({"is_critical": False}).eq("id", run_id).execute()

    # Obtener el registro actualizado
    response = supa().table("calc_runs").select("*").eq("id", run_id).single().execute()
    return response.data


def get_critical_elements(project_id: str):
    """
    Obtiene todos los elementos críticos de un proyecto, agrupados por tipo.

    Args:
        project_id: ID del proyecto

    Returns:
        Dict con elementos críticos por tipo: {"rc_beam": {...}, "steel_column": {...}, ...}
    """
    response = supa().table("calc_runs").select("*").eq("project_id", project_id).eq("is_critical", True).execute()

    # Agrupar por element_type
    critical_by_type = {}
    for run in response.data:
        critical_by_type[run["element_type"]] = run

    return critical_by_type
