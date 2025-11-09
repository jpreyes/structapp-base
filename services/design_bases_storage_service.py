from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from supa.client import supa


def save_design_base(
    project_id: str,
    user_id: str,
    name: str,
    data: Dict[str, Any],
    design_base_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Guarda o actualiza una base de cálculo en Supabase.

    Args:
        project_id: ID del proyecto
        user_id: ID del usuario
        name: Nombre descriptivo de la base de cálculo
        data: Datos de la base de cálculo (live_load, reduction, wind, snow, seismic)
        design_base_id: ID de la base de cálculo (opcional, para actualizar)

    Returns:
        Registro guardado
    """
    client = supa()

    if design_base_id:
        # Actualizar existente
        result = (
            client.table("design_bases")
            .update({
                "name": name,
                "data": data,
                "updated_at": datetime.now().isoformat(),
            })
            .eq("id", design_base_id)
            .eq("created_by", user_id)
            .execute()
        )
    else:
        # Crear nuevo
        result = (
            client.table("design_bases")
            .insert({
                "project_id": project_id,
                "created_by": user_id,
                "name": name,
                "data": data,
            })
            .execute()
        )

    if not result.data:
        raise ValueError("No se pudo guardar la base de cálculo")

    return result.data[0]


def list_design_bases(project_id: str, user_id: str) -> List[Dict[str, Any]]:
    """
    Lista todas las bases de cálculo de un proyecto.

    Args:
        project_id: ID del proyecto
        user_id: ID del usuario

    Returns:
        Lista de bases de cálculo
    """
    client = supa()
    result = (
        client.table("design_bases")
        .select("id, project_id, name, created_at, updated_at")
        .eq("project_id", project_id)
        .eq("created_by", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return result.data or []


def get_design_base(design_base_id: str, user_id: str) -> Dict[str, Any]:
    """
    Obtiene una base de cálculo específica.

    Args:
        design_base_id: ID de la base de cálculo
        user_id: ID del usuario

    Returns:
        Base de cálculo completa con todos los datos
    """
    client = supa()
    result = (
        client.table("design_bases")
        .select("*")
        .eq("id", design_base_id)
        .eq("created_by", user_id)
        .execute()
    )

    if not result.data:
        raise ValueError("Base de cálculo no encontrada")

    return result.data[0]


def delete_design_base(design_base_id: str, user_id: str) -> bool:
    """
    Elimina una base de cálculo.

    Args:
        design_base_id: ID de la base de cálculo
        user_id: ID del usuario

    Returns:
        True si se eliminó correctamente
    """
    client = supa()
    result = (
        client.table("design_bases")
        .delete()
        .eq("id", design_base_id)
        .eq("created_by", user_id)
        .execute()
    )

    return bool(result.data)
