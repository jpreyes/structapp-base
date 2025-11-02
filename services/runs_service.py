from supa.client import supa
def save_run(project_id: str, user_id: str, element_type: str, inputs: dict, results: dict):
    payload = {"project_id": project_id, "created_by": user_id, "element_type": element_type,
               "input_json": inputs, "result_json": results}
    return supa().table("calc_runs").insert(payload).execute().data[0]
def list_runs(project_id: str):
    return supa().table("calc_runs").select("*").eq("project_id", project_id).order("created_at", desc=True).execute().data
