from decimal import Decimal
from typing import Any, Optional


def to_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, (float, Decimal)):
        return int(round(value))
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        cleaned = cleaned.replace(".", "").replace(",", "")
        try:
            return int(cleaned)
        except ValueError:
            try:
                return int(float(cleaned))
            except ValueError:
                return None
    return None


def clp(value: Any) -> str:
    number = to_int(value)
    if number is None:
        return "-"
    return f"{number:,}".replace(",", ".")
