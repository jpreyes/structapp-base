PLANS = {
  "basic": {"max_projects": 5, "modules": {"rc_beam"}, "export_word": False},
  "pro": {"max_projects": 20, "modules": {"rc_beam","rc_column","wall_rc","foundation","steel_beam"}, "export_word": True},
  "enterprise": {"max_projects": None, "modules": "all", "export_word": True},
}
def can_module(plan: str, module: str) -> bool:
    mods = PLANS.get(plan, PLANS["basic"])["modules"]
    return mods == "all" or module in mods
def max_projects(plan: str):
    return PLANS.get(plan, PLANS["basic"])["max_projects"]
