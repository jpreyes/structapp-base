"""
Endpoints para cálculos de elementos estructurales.
Incluye pilares y vigas de hormigón, acero y madera, así como zapatas.
"""
from fastapi import APIRouter, HTTPException, status

from api.schemas.structural_calcs import (
    ConcreteBeamRequest,
    ConcreteBeamResponse,
    ConcreteColumnRequest,
    ConcreteColumnResponse,
    FootingRequest,
    FootingResponse,
    SteelBeamRequest,
    SteelBeamResponse,
    SteelColumnRequest,
    SteelColumnResponse,
    WoodBeamRequest,
    WoodBeamResponse,
    WoodColumnRequest,
    WoodColumnResponse,
)
from services.structural_concrete import calculate_concrete_beam, calculate_concrete_column
from services.structural_footings import calculate_footing
from services.structural_steel import calculate_steel_beam, calculate_steel_column
from services.structural_wood import calculate_wood_beam, calculate_wood_column
from services.runs_service import save_run

router = APIRouter()


# HORMIGÓN ARMADO (ACI318)


@router.post("/concrete/column")
async def concrete_column_design(payload: ConcreteColumnRequest):
    """Diseña un pilar de hormigón armado según ACI318 y guarda en historial."""
    inputs = {
        "axialLoad": payload.axial_load,
        "momentX": payload.moment_x,
        "momentY": payload.moment_y,
        "shearX": payload.shear_x,
        "shearY": payload.shear_y,
        "width": payload.width,
        "depth": payload.depth,
        "length": payload.length,
        "fc": payload.fc,
        "fy": payload.fy,
        "cover": payload.cover,
        "unsupportedLength": payload.unsupported_length,
    }
    try:
        result = calculate_concrete_column(
            axial_load=payload.axial_load,
            moment_x=payload.moment_x,
            moment_y=payload.moment_y,
            shear_x=payload.shear_x,
            shear_y=payload.shear_y,
            width=payload.width,
            depth=payload.depth,
            length=payload.length,
            fc=payload.fc,
            fy=payload.fy,
            cover=payload.cover,
            unsupported_length=payload.unsupported_length,
        )
        record = save_run(payload.project_id, payload.user_id, "rc_column", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/concrete/beam")
async def concrete_beam_design(payload: ConcreteBeamRequest):
    """Diseña una viga de hormigón armado según ACI318 y guarda en historial."""
    inputs = {
        "positiveMoment": payload.positive_moment,
        "negativeMoment": payload.negative_moment,
        "maxShear": payload.max_shear,
        "width": payload.width,
        "height": payload.height,
        "span": payload.span,
        "fc": payload.fc,
        "fy": payload.fy,
        "cover": payload.cover,
    }
    try:
        result = calculate_concrete_beam(
            positive_moment=payload.positive_moment,
            negative_moment=payload.negative_moment,
            max_shear=payload.max_shear,
            width=payload.width,
            height=payload.height,
            span=payload.span,
            fc=payload.fc,
            fy=payload.fy,
            cover=payload.cover,
        )
        record = save_run(payload.project_id, payload.user_id, "rc_beam", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# ACERO ESTRUCTURAL (AISC360)


@router.post("/steel/column")
async def steel_column_design(payload: SteelColumnRequest):
    """Diseña un pilar de acero estructural según AISC360 y guarda en historial."""
    inputs = {
        "axialLoad": payload.axial_load,
        "momentX": payload.moment_x,
        "momentY": payload.moment_y,
        "length": payload.length,
        "fy": payload.fy,
        "sectionType": payload.section_type,
        "profileName": payload.profile_name,
    }

    try:
        result = calculate_steel_column(
            axial_load=payload.axial_load,
            moment_x=payload.moment_x,
            moment_y=payload.moment_y,
            length=payload.length,
            fy=payload.fy,
            E=payload.E,
            profile=payload.profile_name,
            custom_area=payload.area,
            custom_Ix=payload.ix,
            custom_Iy=payload.iy,
            custom_Zx=payload.zx,
            custom_Zy=payload.zy,
            Kx=payload.kx,
            Ky=payload.ky,
        )

        record = save_run(payload.project_id, payload.user_id, "steel_column", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/steel/beam")
async def steel_beam_design(payload: SteelBeamRequest):
    """Diseña una viga de acero estructural según AISC360 y guarda en historial."""
    inputs = {
        "moment": payload.moment,
        "shear": payload.shear,
        "span": payload.span,
        "fy": payload.fy,
        "sectionType": payload.section_type,
        "profileName": payload.profile_name,
        "lateralSupport": payload.lateral_support,
    }

    try:
        result = calculate_steel_beam(
            moment=payload.moment,
            shear=payload.shear,
            span=payload.span,
            fy=payload.fy,
            E=payload.E,
            profile=payload.profile_name,
            custom_Zx=payload.zx,
            custom_Ix=payload.ix,
            custom_area=payload.area,
            custom_d=None,
            custom_tw=None,
            Lb=payload.lb or payload.span,
        )

        record = save_run(payload.project_id, payload.user_id, "steel_beam", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# MADERA (NCh1198)


@router.post("/wood/column")
async def wood_column_design(payload: WoodColumnRequest):
    """Diseña un pilar de madera según NCh1198 y guarda en historial."""
    inputs = {
        "axialLoad": payload.axial_load,
        "width": payload.width,
        "depth": payload.depth,
        "length": payload.length,
        "woodType": payload.wood_type,
    }

    try:
        result = calculate_wood_column(
            axial_load=payload.axial_load,
            width=payload.width,
            depth=payload.depth,
            length=payload.length,
            wood_type=payload.wood_type,
            custom_fc=payload.fc,
            custom_E=payload.E,
            moisture_factor=payload.moisture_factor,
            duration_factor=payload.duration_factor,
            Kx=payload.k_factor,
            Ky=payload.k_factor,
        )

        record = save_run(payload.project_id, payload.user_id, "wood_column", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/wood/beam")
async def wood_beam_design(payload: WoodBeamRequest):
    """Diseña una viga de madera según NCh1198 y guarda en historial."""
    inputs = {
        "moment": payload.moment,
        "shear": payload.shear,
        "width": payload.width,
        "height": payload.height,
        "span": payload.span,
        "woodType": payload.wood_type,
        "lateralSupport": payload.lateral_support,
    }

    try:
        result = calculate_wood_beam(
            moment=payload.moment,
            shear=payload.shear,
            width=payload.width,
            height=payload.height,
            span=payload.span,
            wood_type=payload.wood_type,
            custom_fm=payload.fm,
            custom_fv=payload.fv,
            custom_E=payload.E,
            moisture_factor=payload.moisture_factor,
            duration_factor=payload.duration_factor,
        )

        record = save_run(payload.project_id, payload.user_id, "wood_beam", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# ZAPATAS (ACI318)


@router.post("/footing")
async def footing_design(payload: FootingRequest):
    """Diseña una zapata de hormigón armado según ACI318 y guarda en historial."""
    inputs = {
        "axialLoad": payload.axial_load,
        "moment": payload.moment,
        "shear": payload.shear,
        "columnWidth": payload.column_width,
        "columnDepth": payload.column_depth,
        "soilBearingCapacity": payload.soil_bearing_capacity,
        "fc": payload.fc,
        "fy": payload.fy,
        "footingType": payload.footing_type,
        "length": payload.length,
        "width": payload.width,
        "footingDepth": payload.footing_depth,
    }

    try:
        result = calculate_footing(
            axial_load=payload.axial_load,
            moment=payload.moment,
            shear=payload.shear,
            column_width=payload.column_width,
            column_depth=payload.column_depth,
            soil_bearing_capacity=payload.soil_bearing_capacity,
            fc=payload.fc,
            fy=payload.fy,
            footing_type=payload.footing_type,
            static_pressure=payload.static_pressure,
            dynamic_pressure=payload.dynamic_pressure,
            seismic_pressure=payload.seismic_pressure,
            footing_depth=payload.footing_depth,
            cover=payload.cover,
        )

        record = save_run(payload.project_id, payload.user_id, "footing", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


