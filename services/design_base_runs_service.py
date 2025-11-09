"""
Servicio para gestionar el historial de ejecuciones de bases de cálculo (design_base_runs).
Similar a calc_runs pero para bases de cálculo con generación de documentos.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from supa.client import supa


def create_design_base_run(
    project_id: str,
    user_id: str,
    name: str,
    data: Dict[str, Any],
    design_base_id: Optional[str] = None,
    document_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Crea un nuevo registro de ejecución de base de cálculo.

    Args:
        project_id: ID del proyecto
        user_id: ID del usuario
        name: Nombre descriptivo de la ejecución
        data: Datos de la base de cálculo (live_load, reduction, wind, snow, seismic)
        design_base_id: ID de la base de cálculo guardada (opcional)
        document_url: URL del documento generado (opcional)

    Returns:
        Registro creado
    """
    client = supa()

    result = (
        client.table("design_base_runs")
        .insert(
            {
                "project_id": project_id,
                "created_by": user_id,
                "design_base_id": design_base_id,
                "name": name,
                "data": data,
                "document_url": document_url,
            }
        )
        .execute()
    )

    if not result.data:
        raise ValueError("No se pudo crear el registro de ejecución")

    return result.data[0]


def list_design_base_runs(project_id: str, user_id: str) -> List[Dict[str, Any]]:
    """
    Lista todas las ejecuciones de bases de cálculo de un proyecto.

    Args:
        project_id: ID del proyecto
        user_id: ID del usuario

    Returns:
        Lista de ejecuciones
    """
    client = supa()
    result = (
        client.table("design_base_runs")
        .select("id, project_id, design_base_id, name, document_url, created_at")
        .eq("project_id", project_id)
        .eq("created_by", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return result.data or []


def get_design_base_run(run_id: str, user_id: str) -> Dict[str, Any]:
    """
    Obtiene una ejecución específica con todos sus datos.

    Args:
        run_id: ID de la ejecución
        user_id: ID del usuario

    Returns:
        Ejecución completa con todos los datos
    """
    client = supa()
    result = (
        client.table("design_base_runs")
        .select("*")
        .eq("id", run_id)
        .eq("created_by", user_id)
        .execute()
    )

    if not result.data:
        raise ValueError("Ejecución no encontrada")

    return result.data[0]


def delete_design_base_run(run_id: str, user_id: str) -> bool:
    """
    Elimina una ejecución de base de cálculo.

    Args:
        run_id: ID de la ejecución
        user_id: ID del usuario

    Returns:
        True si se eliminó correctamente
    """
    client = supa()
    result = (
        client.table("design_base_runs")
        .delete()
        .eq("id", run_id)
        .eq("created_by", user_id)
        .execute()
    )

    return bool(result.data)


def update_document_url(run_id: str, user_id: str, document_url: str) -> Dict[str, Any]:
    """
    Actualiza la URL del documento de una ejecución.

    Args:
        run_id: ID de la ejecución
        user_id: ID del usuario
        document_url: Nueva URL del documento

    Returns:
        Registro actualizado
    """
    client = supa()
    result = (
        client.table("design_base_runs")
        .update({"document_url": document_url})
        .eq("id", run_id)
        .eq("created_by", user_id)
        .execute()
    )

    if not result.data:
        raise ValueError("No se pudo actualizar la URL del documento")

    return result.data[0]