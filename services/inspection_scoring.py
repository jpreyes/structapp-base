from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Iterable

try:
    from openai import OpenAI
except ImportError:  # placeholder if package missing
    OpenAI = None



@dataclass
class ScoringWeights:
    severity: dict[str, float]
    cause: dict[str, float]
    damage_type: dict[str, float]


# These weights are based on general industry guidance: severity (leve/media/alta/muy alta),
# causa (estructural vs cosmética vs mantenimiento) y tipo de daño (fisuras, corrosión, asentamiento).
# Update the dictionaries below whenever you need to adjust the scoring model.
DEFAULT_WEIGHTS = ScoringWeights(
    severity={"Leve": 1.0, "Media": 2.0, "Alta": 3.0, "Muy Alta": 4.0},
    cause={
        "estructural": 1.5,
        "deformacion": 1.3,
        "corrosion": 1.4,
        "filtracion": 1.2,
        "electrico": 1.2,
        "estetico": 1.0,
        "mantenimiento": 1.1,
    },
    damage_type={
        "fisura": 1.3,
        "desprendimiento": 1.4,
        "asentamiento": 1.5,
        "corrosion": 1.4,
        "desgaste": 1.1,
        "golpes": 1.0,
        "otro": 1.0,
    },
)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-4o-mini")
_llm_client = OpenAI(api_key=OPENAI_API_KEY) if (OPENAI_API_KEY and OpenAI) else None


def _parse_llm_response(text: str) -> dict[str, Any]:
    try:
        data = json.loads(text)
        score = data.get("score")
        return {
            "llm_score": float(score) if score is not None else None,
            "reason": data.get("reason") or data.get("analysis") or text,
            "raw": data,
        }
    except Exception:
        return {"llm_score": None, "reason": text.strip(), "raw": None}


def _call_llm(messages: list[dict[str, str]]) -> dict[str, Any]:
    if not _llm_client:
        return {"llm_score": None, "reason": "OpenAI key not configured", "raw": None}
    resp = _llm_client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
        temperature=0.2,
    )
    content = resp.choices[0].message.content
    return _parse_llm_response(content)


def _extent_factor(value: Any) -> float:
    try:
        if isinstance(value, str):
            numeric = float(value.strip().replace("%", "")) if value.strip() else 0.0
        elif isinstance(value, (int, float)):
            numeric = float(value)
        else:
            return 0.0
    except ValueError:
        return 0.0
    return min(1.0, max(0.0, numeric / 100))


def _score_damage(damage: dict[str, Any], weights: ScoringWeights) -> float:
    severity = damage.get("severity", "")
    cause = (damage.get("damage_cause") or "").lower()
    damage_type = (damage.get("damage_type") or "").lower()
    severity_weight = weights.severity.get(severity, 1.0)
    cause_factor = next((value for key, value in weights.cause.items() if key in cause), 1.0)
    type_factor = next((value for key, value in weights.damage_type.items() if key in damage_type), 1.0)
    extent_value = _extent_factor(damage.get("extent"))
    return severity_weight * cause_factor * type_factor * (1 + extent_value)


def calculate_inspection_deterministic_score(
    damages: Iterable[dict[str, Any]], weights: ScoringWeights = DEFAULT_WEIGHTS
) -> float:
    damage_list = list(damages)
    if not damage_list:
        return 0.0
    base_scores = [ _score_damage(damage, weights) for damage in damage_list ]
    total_damage_score = sum(base_scores)
    count_multiplier = 1.0 + min(0.5, len(damage_list) / 10)
    raw_score = total_damage_score * count_multiplier
    max_possible_per_damage = max(weights.severity.values()) * max(weights.cause.values()) * max(weights.damage_type.values()) * 2
    max_score = max_possible_per_damage * len(damage_list) * count_multiplier
    normalized = (raw_score / max_score) * 100 if max_score > 0 else 0.0
    return min(100.0, round(normalized, 2))


def _build_damage_payload(damage: dict[str, Any]) -> dict[str, Any]:
    return {
        "structure": damage.get("structure"),
        "location": damage.get("location"),
        "damage_type": damage.get("damage_type"),
        "damage_cause": damage.get("damage_cause"),
        "severity": damage.get("severity"),
        "extent": damage.get("extent"),
        "comments": damage.get("comments"),
    }


def evaluate_damage_with_llm(damage: dict[str, Any]) -> dict[str, Any]:
    payload = _build_damage_payload(damage)
    messages = [
        {
            "role": "system",
            "content": (
                "Eres un asistente que evalúa la crítica estructural de daños y responde con JSON."
                " Mantén el score entre 0 y 100."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Evalúa este daño:\n"
                f"- Estructura: {payload['structure']}\n"
                f"- Ubicación: {payload['location']}\n"
                f"- Tipo: {payload['damage_type']}\n"
                f"- Causa: {payload['damage_cause']}\n"
                f"- Gravedad: {payload['severity']}\n"
                f"- Extensión: {payload['extent']}\n"
                f"- Comentarios: {payload['comments']}\n\n"
                "Devuelve solo JSON con los campos \"score\" (número 0-100) y \"reason\" (explicación corta)."
            ),
        },
    ]
    llm_response = _call_llm(messages)
    return {
        "llm_score": llm_response["llm_score"],
        "reason": llm_response["reason"],
        "payload": payload,
        "raw_output": llm_response.get("raw"),
    }


def score_damage_record(damage: dict[str, Any], weights: ScoringWeights = DEFAULT_WEIGHTS) -> dict[str, Any]:
    deterministic = round(_score_damage(damage, weights), 2)
    llm_result = evaluate_damage_with_llm(damage)
    return {
        "deterministic_score": deterministic,
        "llm_score": llm_result["llm_score"],
        "llm_reason": llm_result["reason"],
        "llm_payload": llm_result["payload"],
    }


def evaluate_inspection_with_llm(
    inspection: dict[str, Any], damages: Iterable[dict[str, Any]]
) -> dict[str, Any]:
    prompt = (
        "Evalúa la inspección en una escala de 0 a 100 considerando cada daño. "
        "Reporta la puntuación y una breve razón en JSON."
    )
    payload = {
        "inspection": {
            "id": inspection.get("id"),
            "structure": inspection.get("structure_name"),
            "summary": inspection.get("summary"),
        },
        "damages": [_build_damage_payload(damage) for damage in damages],
    }
    if not _llm_client:
        return {
            "llm_score": None,
            "reason": "OpenAI key not configured",
            "payload": payload,
        }
    damages_text = "\n".join(
        f"- {dmg['damage_type']} ({dmg['severity']}) en {dmg['location']} · Causa: {dmg['damage_cause']}"
        for dmg in payload["damages"]
    )
    messages = [
        {
            "role": "system",
            "content": (
                "Eres un asistente que analiza inspecciones estructurales y responde con JSON."
                " Devuelve un score entre 0 y 100 y una explicación corta."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Inspección: {payload['inspection']['structure']} ({payload['inspection']['id']})\n"
                f"Resumen: {payload['inspection']['summary']}\n"
                f"Daños:\n{damages_text}\n\n"
                "Responde solo JSON con los campos \"score\" y \"reason\"."
            ),
        },
    ]
    llm_response = _call_llm(messages)
    return {
        "llm_score": llm_response["llm_score"],
        "reason": llm_response["reason"],
        "payload": payload,
    }
