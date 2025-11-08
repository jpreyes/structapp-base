import io

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from api.dependencies import UserIdDep
from api.schemas.design_bases import (
    BuildingDescriptionRequest,
    CreateDesignBaseRunRequest,
    DesignBaseDetail,
    DesignBaseExportPayload,
    DesignBaseRunDetail,
    DesignBaseRunSummary,
    DesignBaseSummary,
    LiveLoadCatalogResponse,
    LiveLoadReductionRequest,
    LiveLoadReductionResponse,
    LiveLoadRequest,
    LiveLoadResponse,
    SaveDesignBaseRequest,
    SeismicRequest,
    SeismicResponse,
    SnowRequest,
    SnowResponse,
    WindRequest,
    WindResponse,
)
from services.design_bases_service import (
    calculate_live_load_reduction,
    calculate_roof_snow_load,
    calculate_seismic_base,
    calculate_wind_pressure,
    get_live_load,
    get_design_base_options,
    export_design_bases,
    list_live_load_categories,
)
from services.runs_service import save_run
from services.design_bases_docx_service import generate_design_base_document
from services.design_bases_storage_service import (
    delete_design_base,
    get_design_base,
    list_design_bases,
    save_design_base,
)
from services.design_base_runs_service import (
    create_design_base_run,
    delete_design_base_run,
    get_design_base_run,
    list_design_base_runs,
)
from services.runs_service import fetch_run

router = APIRouter()


@router.get("/live-loads", response_model=LiveLoadCatalogResponse)
async def live_load_catalog():
    return {"categories": list_live_load_categories()}


@router.get("/options")
async def design_base_options():
    return get_design_base_options()


@router.post("/live-load")
async def live_load_lookup(payload: LiveLoadRequest):
    try:
        data = get_live_load(payload.building_type, payload.usage)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    result = {
        "buildingType": payload.building_type,
        "usage": payload.usage,
        "uniformLoad": data["uniform_load"],
        "uniformLoadRaw": data["uniform_load_raw"],
        "concentratedLoad": data["concentrated_load"],
        "concentratedLoadRaw": data["concentrated_load_raw"],
    }

    # Guardar en historial si se proporcionaron project_id y user_id
    if payload.project_id and payload.user_id:
        inputs = {
            "buildingType": payload.building_type,
            "usage": payload.usage,
        }
        record = save_run(payload.project_id, payload.user_id, "live_load", inputs, result)
        return {"results": result, "run_id": record["id"]}

    return {"results": result}


@router.post("/live-load/reduction")
async def live_load_reduction(payload: LiveLoadReductionRequest):
    try:
        reduced = calculate_live_load_reduction(payload.element_type, payload.tributary_area, payload.base_load)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    result = {"reducedLoad": reduced}

    # Guardar en historial si se proporcionaron project_id y user_id
    if payload.project_id and payload.user_id:
        inputs = {
            "elementType": payload.element_type,
            "tributaryArea": payload.tributary_area,
            "baseLoad": payload.base_load,
        }
        record = save_run(payload.project_id, payload.user_id, "live_load_reduction", inputs, result)
        return {"results": result, "run_id": record["id"]}

    return {"results": result}


@router.post("/wind")
async def wind_pressure(payload: WindRequest):
    try:
        result = calculate_wind_pressure(payload.environment, payload.height)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    # Guardar en historial si se proporcionaron project_id y user_id
    if payload.project_id and payload.user_id:
        inputs = {
            "environment": payload.environment,
            "height": payload.height,
        }
        record = save_run(payload.project_id, payload.user_id, "wind_load", inputs, result)
        return {"results": result, "run_id": record["id"]}

    return {"results": result}


@router.post("/snow")
async def snow_load(payload: SnowRequest):
    try:
        result = calculate_roof_snow_load(
            latitude_band=payload.latitude_band,
            altitude_band=payload.altitude_band,
            thermal_condition=payload.thermal_condition,
            importance_category=payload.importance_category,
            exposure_category=payload.exposure_category,
            exposure_condition=payload.exposure_condition,
            surface_type=payload.surface_type,
            roof_pitch_deg=payload.roof_pitch,
        )
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    # Guardar en historial si se proporcionaron project_id y user_id
    if payload.project_id and payload.user_id:
        inputs = {
            "latitudeBand": payload.latitude_band,
            "altitudeBand": payload.altitude_band,
            "thermalCondition": payload.thermal_condition,
            "importanceCategory": payload.importance_category,
            "exposureCategory": payload.exposure_category,
            "exposureCondition": payload.exposure_condition,
            "surfaceType": payload.surface_type,
            "roofPitch": payload.roof_pitch,
        }
        record = save_run(payload.project_id, payload.user_id, "snow_load", inputs, result)
        return {"results": result, "run_id": record["id"]}

    return {"results": result}


@router.post("/seismic")
async def seismic_base(payload: SeismicRequest):
    try:
        result = calculate_seismic_base(
            category=payload.category,
            zone=payload.zone,
            soil=payload.soil,
            rs_value=payload.rs,
            ps_value=payload.ps,
            tx=payload.tx,
            ty=payload.ty,
            r0=payload.r0,
            story_heights=[story.height for story in payload.stories],
            story_weights=[story.weight for story in payload.stories],
        )
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    # Guardar en historial si se proporcionaron project_id y user_id
    if payload.project_id and payload.user_id:
        inputs = {
            "category": payload.category,
            "zone": payload.zone,
            "soil": payload.soil,
            "rs": payload.rs,
            "ps": payload.ps,
            "tx": payload.tx,
            "ty": payload.ty,
            "r0": payload.r0,
            "stories": [{"height": s.height, "weight": s.weight} for s in payload.stories],
        }
        record = save_run(payload.project_id, payload.user_id, "seismic", inputs, result)
        return {"results": result, "run_id": record["id"]}

    return {"results": result}


@router.post("/building-description")
async def save_building_description(payload: BuildingDescriptionRequest):
    """Guarda una descripción de edificio en el historial."""
    inputs = {
        "text": payload.text,
        "location": payload.location,
        "area": payload.area,
        "height": payload.height,
    }

    # Usar los mismos datos como resultado (es solo información descriptiva)
    result = inputs.copy()

    # Guardar en historial
    record = save_run(payload.project_id, payload.user_id, "building_description", inputs, result)
    return {"results": result, "run_id": record["id"]}


@router.post("/export/{file_format}")
async def export_design_base(file_format: str, payload: DesignBaseExportPayload):
    try:
        content, content_type, filename = export_design_bases(payload, file_format)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return StreamingResponse(io.BytesIO(content), media_type=content_type, headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.post("/save", response_model=DesignBaseSummary)
async def save_design_base_endpoint(payload: SaveDesignBaseRequest, user_id: UserIdDep):
    """Guarda una base de cálculo en Supabase."""
    try:
        result = save_design_base(
            project_id=payload.project_id,
            user_id=user_id,
            name=payload.name,
            data=payload.data.dict(by_alias=True, exclude_none=True),
            design_base_id=payload.design_base_id,
        )
        return DesignBaseSummary(
            id=result["id"],
            projectId=result["project_id"],
            name=result["name"],
            createdAt=result["created_at"],
            updatedAt=result["updated_at"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/list/{project_id}", response_model=list[DesignBaseSummary])
async def list_design_bases_endpoint(project_id: str, user_id: UserIdDep):
    """Lista todas las bases de cálculo de un proyecto."""
    bases = list_design_bases(project_id=project_id, user_id=user_id)
    return [
        DesignBaseSummary(
            id=base["id"],
            projectId=base["project_id"],
            name=base["name"],
            createdAt=base["created_at"],
            updatedAt=base["updated_at"],
        )
        for base in bases
    ]


@router.get("/load/{design_base_id}", response_model=DesignBaseDetail)
async def load_design_base_endpoint(design_base_id: str, user_id: UserIdDep):
    """Carga una base de cálculo específica."""
    try:
        base = get_design_base(design_base_id=design_base_id, user_id=user_id)
        return DesignBaseDetail(
            id=base["id"],
            projectId=base["project_id"],
            name=base["name"],
            data=base["data"],
            createdAt=base["created_at"],
            updatedAt=base["updated_at"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/delete/{design_base_id}")
async def delete_design_base_endpoint(design_base_id: str, user_id: UserIdDep):
    """Elimina una base de cálculo."""
    success = delete_design_base(design_base_id=design_base_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Base de cálculo no encontrada")
    return {"success": True}


# Endpoints para design_base_runs (historial con documentos)


@router.post("/runs/create", response_model=DesignBaseRunSummary)
async def create_design_base_run_endpoint(payload: CreateDesignBaseRunRequest, user_id: UserIdDep):
    """
    Crea una nueva ejecución de base de cálculo y genera el documento Word.
    Guarda el registro en la base de datos para historial.
    """
    try:
        # Convertir datos a dict para guardar
        data_dict = payload.data.dict(by_alias=True, exclude_none=True)

        # Generar documento Word
        project_name = payload.project_name or "Proyecto"
        docx_bytes = generate_design_base_document(data_dict, project_name)

        # Por ahora, no guardamos el documento en almacenamiento (Supabase Storage)
        # Solo guardamos el registro con los datos
        # En el futuro, se puede subir a Supabase Storage y guardar la URL

        # Crear registro en la base de datos
        result = create_design_base_run(
            project_id=payload.project_id,
            user_id=user_id,
            name=payload.name,
            data=data_dict,
            design_base_id=payload.design_base_id,
            document_url=None,  # Por ahora None, se puede agregar Supabase Storage después
        )

        return DesignBaseRunSummary(
            id=result["id"],
            projectId=result["project_id"],
            designBaseId=result.get("design_base_id"),
            name=result["name"],
            documentUrl=result.get("document_url"),
            createdAt=result["created_at"],
        )
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/runs/list/{project_id}", response_model=list[DesignBaseRunSummary])
async def list_design_base_runs_endpoint(project_id: str, user_id: UserIdDep):
    """Lista todas las ejecuciones de bases de cálculo de un proyecto."""
    runs = list_design_base_runs(project_id=project_id, user_id=user_id)
    return [
        DesignBaseRunSummary(
            id=run["id"],
            projectId=run["project_id"],
            designBaseId=run.get("design_base_id"),
            name=run["name"],
            documentUrl=run.get("document_url"),
            createdAt=run["created_at"],
        )
        for run in runs
    ]


@router.get("/runs/get/{run_id}", response_model=DesignBaseRunDetail)
async def get_design_base_run_endpoint(run_id: str, user_id: UserIdDep):
    """Obtiene una ejecución específica con todos sus datos."""
    try:
        run = get_design_base_run(run_id=run_id, user_id=user_id)
        return DesignBaseRunDetail(
            id=run["id"],
            projectId=run["project_id"],
            designBaseId=run.get("design_base_id"),
            name=run["name"],
            data=run["data"],
            documentUrl=run.get("document_url"),
            createdAt=run["created_at"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/runs/download/{run_id}")
async def download_design_base_run_document(run_id: str, user_id: UserIdDep):
    """Descarga el documento Word de una ejecución."""
    try:
        # Obtener la ejecución
        run = get_design_base_run(run_id=run_id, user_id=user_id)

        # Regenerar el documento desde los datos guardados
        data = run["data"]
        project_name = run["name"]

        docx_bytes = generate_design_base_document(data, project_name)

        # Retornar como descarga
        filename = f"{project_name.replace(' ', '_')}_bases_calculo.docx"
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/runs/generate-from-calculations")
async def generate_document_from_calculations(
    payload: dict,
    user_id: UserIdDep,
):
    """
    Genera un documento Word con los cálculos seleccionados.
    Recibe una lista de IDs de cálculos y los agrupa en un documento.
    """
    try:
        project_id = payload.get("projectId")
        calculation_ids = payload.get("calculationIds", [])
        name = payload.get("name", "Memoria de Cálculo")

        if not project_id or not calculation_ids:
            raise ValueError("Faltan project_id o calculation_ids")

        print(f"Generating document for project {project_id}")
        print(f"Received {len(calculation_ids)} calculation IDs: {calculation_ids}")

        # Obtener todos los cálculos seleccionados
        calculations = []
        for calc_id in calculation_ids:
            run = fetch_run(calc_id)
            if run:
                calculations.append(run)
            else:
                print(f"Warning: Calculation {calc_id} not found in database")

        if not calculations:
            raise ValueError("No se encontraron cálculos válidos para generar el documento")

        # Construir el payload para el generador de documentos
        # Agrupar por tipo
        document_data: dict = {}

        for calc in calculations:
            element_type = calc["element_type"]
            result_json = calc["result_json"]
            input_json = calc["input_json"]

            # Mapear element_type a estructura esperada por el generador
            if element_type == "building_description":
                if "buildingDescription" not in document_data:
                    document_data["buildingDescription"] = {
                        "text": result_json.get("text"),
                        "location": result_json.get("location"),
                        "area": result_json.get("area"),
                        "height": result_json.get("height"),
                    }

            elif element_type == "live_load":
                if "liveLoad" not in document_data:
                    document_data["liveLoad"] = {
                        "buildingType": input_json.get("buildingType", ""),
                        "usage": input_json.get("usage", ""),
                        **result_json,
                    }

            elif element_type == "live_load_reduction":
                if "reduction" not in document_data:
                    document_data["reduction"] = {
                        "elementType": input_json.get("elementType", ""),
                        "tributaryArea": input_json.get("tributaryArea", 0),
                        "baseLoad": input_json.get("baseLoad", 0),
                        **result_json,
                    }

            elif element_type == "wind_load":
                if "wind" not in document_data:
                    document_data["wind"] = {
                        "environment": input_json.get("environment", ""),
                        "height": input_json.get("height", 0),
                        **result_json,
                    }

            elif element_type == "snow_load":
                if "snow" not in document_data:
                    document_data["snow"] = {
                        **input_json,
                        **result_json,
                    }

            elif element_type == "seismic":
                if "seismic" not in document_data:
                    document_data["seismic"] = {
                        "params": input_json,
                        "result": result_json,
                    }

            elif element_type == "rc_column":
                if "structural" not in document_data:
                    document_data["structural"] = {}
                if "concreteColumn" not in document_data["structural"]:
                    document_data["structural"]["concreteColumn"] = result_json

            elif element_type == "rc_beam":
                if "structural" not in document_data:
                    document_data["structural"] = {}
                if "concreteBeam" not in document_data["structural"]:
                    document_data["structural"]["concreteBeam"] = result_json

            elif element_type == "steel_column":
                if "structural" not in document_data:
                    document_data["structural"] = {}
                if "steelColumn" not in document_data["structural"]:
                    document_data["structural"]["steelColumn"] = result_json

            elif element_type == "steel_beam":
                if "structural" not in document_data:
                    document_data["structural"] = {}
                if "steelBeam" not in document_data["structural"]:
                    document_data["structural"]["steelBeam"] = result_json

            elif element_type == "wood_column":
                if "structural" not in document_data:
                    document_data["structural"] = {}
                if "woodColumn" not in document_data["structural"]:
                    document_data["structural"]["woodColumn"] = result_json

            elif element_type == "wood_beam":
                if "structural" not in document_data:
                    document_data["structural"] = {}
                if "woodBeam" not in document_data["structural"]:
                    document_data["structural"]["woodBeam"] = result_json

            elif element_type == "footing":
                print(f"Processing footing calculation: run_id={run.get('id')}")
                print(f"Footing input_json keys: {list(input_json.keys()) if input_json else 'None'}")
                print(f"Footing result_json keys: {list(result_json.keys()) if result_json else 'None'}")
                print(f"Footing result_json: {result_json}")

                if "structural" not in document_data:
                    document_data["structural"] = {}
                if "footing" not in document_data["structural"]:
                    document_data["structural"]["footing"] = result_json
                    print(f"Stored FIRST footing data in document_data")
                else:
                    print(f"Skipping footing - already have one stored")

        # Generar tablas de resumen e inyectarlas al contexto de documento (si hay cálculos)
        from services.table_generator import generate_all_tables
        tables = generate_all_tables(project_id, calculations)
        if isinstance(document_data, dict):
            document_data.setdefault("tables", {}).update(tables)

        # Generar documento Word
        project_name = name
        docx_bytes = generate_design_base_document(document_data, project_name)

        # Retornar como descarga
        filename = f"{name.replace(' ', '_')}.docx"
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        import traceback
        error_details = f"Error generando documento: {str(exc)}\n{traceback.format_exc()}"
        print(error_details)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar el documento: {str(exc)}"
        ) from exc


@router.delete("/runs/delete/{run_id}")
async def delete_design_base_run_endpoint(run_id: str, user_id: UserIdDep):
    """Elimina una ejecución de base de cálculo."""
    success = delete_design_base_run(run_id=run_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ejecución no encontrada")
    return {"success": True}
