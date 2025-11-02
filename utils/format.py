def clp(n: int|float|None) -> str:
    if n is None: return "—"
    return f"{int(n):,}".replace(",", ".")
