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


@router.post("/steel/column", response_model=SteelColumnResponse)
async def steel_column_design(payload: SteelColumnRequest):
    """Diseña un pilar de acero estructural según AISC360."""
    try:
        result = calculate_steel_column(
            axial_load=payload.axial_load,
            moment_x=payload.moment_x,
            moment_y=payload.moment_y,
            length=payload.length,
            fy=payload.fy,
            E=payload.E,
            profile=payload.profile,
            custom_area=payload.custom_area,
            custom_Ix=payload.custom_Ix,
            custom_Iy=payload.custom_Iy,
            custom_Zx=payload.custom_Zx,
            custom_Zy=payload.custom_Zy,
            Kx=payload.Kx,
            Ky=payload.Ky,
        )
        return SteelColumnResponse(**result)
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/steel/beam", response_model=SteelBeamResponse)
async def steel_beam_design(payload: SteelBeamRequest):
    """Diseña una viga de acero estructural según AISC360."""
    try:
        result = calculate_steel_beam(
            moment=payload.moment,
            shear=payload.shear,
            span=payload.span,
            fy=payload.fy,
            E=payload.E,
            profile=payload.profile,
            custom_Zx=payload.custom_Zx,
            custom_Ix=payload.custom_Ix,
            custom_area=payload.custom_area,
            custom_d=payload.custom_d,
            custom_tw=payload.custom_tw,
            Lb=payload.Lb,
        )
        return SteelBeamResponse(**result)
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# MADERA (NCh1198)


@router.post("/wood/column", response_model=WoodColumnResponse)
async def wood_column_design(payload: WoodColumnRequest):
    """Diseña un pilar de madera según NCh1198."""
    try:
        result = calculate_wood_column(
            axial_load=payload.axial_load,
            width=payload.width,
            depth=payload.depth,
            length=payload.length,
            wood_type=payload.wood_type,
            custom_fc=payload.custom_fc,
            custom_E=payload.custom_E,
            moisture_factor=payload.moisture_factor,
            duration_factor=payload.duration_factor,
            Kx=payload.Kx,
            Ky=payload.Ky,
        )
        return WoodColumnResponse(**result)
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/wood/beam", response_model=WoodBeamResponse)
async def wood_beam_design(payload: WoodBeamRequest):
    """Diseña una viga de madera según NCh1198."""
    try:
        result = calculate_wood_beam(
            moment=payload.moment,
            shear=payload.shear,
            width=payload.width,
            height=payload.height,
            span=payload.span,
            wood_type=payload.wood_type,
            custom_fm=payload.custom_fm,
            custom_fv=payload.custom_fv,
            custom_E=payload.custom_E,
            moisture_factor=payload.moisture_factor,
            duration_factor=payload.duration_factor,
        )
        return WoodBeamResponse(**result)
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# ZAPATAS (ACI318)


@router.post("/footing", response_model=FootingResponse)
async def footing_design(payload: FootingRequest):
    """Diseña una zapata de hormigón armado según ACI318."""
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
        return FootingResponse(**result)
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# ACERO ESTRUCTURAL (AISC360)


@router.post("/steel/column")
async def steel_column_design(payload: SteelColumnRequest):
    """Diseña un pilar de acero según AISC360 y guarda en historial."""
    inputs = {
        "axialLoad": payload.axial_load,
        "momentX": payload.moment_x,
        "momentY": payload.moment_y,
        "sectionType": payload.section_type,
        "profileName": payload.profile_name,
        "area": payload.area,
        "ix": payload.ix,
        "iy": payload.iy,
        "rx": payload.rx,
        "ry": payload.ry,
        "zx": payload.zx,
        "zy": payload.zy,
        "length": payload.length,
        "kx": payload.kx,
        "ky": payload.ky,
        "fy": payload.fy,
        "fu": payload.fu,
        "E": payload.E,
    }
    try:
        # Convertir propiedades personalizadas de cm a mm si se proporcionan
        custom_area = payload.area * 100 if payload.area else None  # cm² -> mm²
        custom_Ix = payload.ix * 10000 if payload.ix else None  # cm⁴ -> mm⁴
        custom_Iy = payload.iy * 10000 if payload.iy else None
        custom_Zx = payload.zx * 1000 if payload.zx else None  # cm³ -> mm³
        custom_Zy = payload.zy * 1000 if payload.zy else None

        result = calculate_steel_column(
            axial_load=payload.axial_load,
            moment_x=payload.moment_x,
            moment_y=payload.moment_y,
            length=payload.length,
            fy=payload.fy,
            E=payload.E,
            profile=payload.profile_name,
            custom_area=custom_area,
            custom_Ix=custom_Ix,
            custom_Iy=custom_Iy,
            custom_Zx=custom_Zx,
            custom_Zy=custom_Zy,
            Kx=payload.kx,
            Ky=payload.ky,
        )
        record = save_run(payload.project_id, payload.user_id, "steel_column", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/steel/beam")
async def steel_beam_design(payload: SteelBeamRequest):
    """Diseña una viga de acero según AISC360 y guarda en historial."""
    inputs = {
        "momentMax": payload.moment_max,
        "shearMax": payload.shear_max,
        "sectionType": payload.section_type,
        "profileName": payload.profile_name,
        "area": payload.area,
        "ix": payload.ix,
        "sx": payload.sx,
        "zx": payload.zx,
        "span": payload.span,
        "lb": payload.lb,
        "fy": payload.fy,
        "E": payload.E,
    }
    try:
        # Convertir propiedades personalizadas de cm a mm si se proporcionan
        custom_area = payload.area * 100 if payload.area else None
        custom_Ix = payload.ix * 10000 if payload.ix else None
        custom_Sx = payload.sx * 1000 if payload.sx else None
        custom_Zx = payload.zx * 1000 if payload.zx else None

        result = calculate_steel_beam(
            moment_max=payload.moment_max,
            shear_max=payload.shear_max,
            span=payload.span,
            lb=payload.lb,
            fy=payload.fy,
            E=payload.E,
            profile=payload.profile_name,
            custom_area=custom_area,
            custom_Ix=custom_Ix,
            custom_Sx=custom_Sx,
            custom_Zx=custom_Zx,
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
        "moment": payload.moment,
        "width": payload.width,
        "depth": payload.depth,
        "length": payload.length,
        "woodType": payload.wood_type,
        "fc": payload.fc,
        "fm": payload.fm,
        "E": payload.E,
    }
    try:
        result = calculate_wood_column(
            axial_load=payload.axial_load,
            moment=payload.moment,
            width=payload.width,
            depth=payload.depth,
            length=payload.length,
            fc=payload.fc,
            fm=payload.fm,
            E=payload.E,
        )
        record = save_run(payload.project_id, payload.user_id, "wood_column", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/wood/beam")
async def wood_beam_design(payload: WoodBeamRequest):
    """Diseña una viga de madera según NCh1198 y guarda en historial."""
    inputs = {
        "momentMax": payload.moment_max,
        "shearMax": payload.shear_max,
        "width": payload.width,
        "depth": payload.depth,
        "span": payload.span,
        "woodType": payload.wood_type,
        "fm": payload.fm,
        "fv": payload.fv,
        "E": payload.E,
    }
    try:
        result = calculate_wood_beam(
            moment_max=payload.moment_max,
            shear_max=payload.shear_max,
            width=payload.width,
            depth=payload.depth,
            span=payload.span,
            fm=payload.fm,
            fv=payload.fv,
            E=payload.E,
        )
        record = save_run(payload.project_id, payload.user_id, "wood_beam", inputs, result)
        return {"results": result, "run_id": record["id"]}
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


# ZAPATAS (ACI318)


@router.post("/footing")
async def footing_design(payload: FootingRequest):
    """Diseña una zapata de hormigón según ACI318 y guarda en historial."""
    inputs = {
        "footingType": payload.footing_type,
        "axialLoad": payload.axial_load,
        "moment": payload.moment,
        "shear": payload.shear,
        "staticPressure": payload.static_pressure,
        "dynamicPressure": payload.dynamic_pressure,
        "seismicPressure": payload.seismic_pressure,
        "length": payload.length,
        "width": payload.width,
        "footingDepth": payload.footing_depth,
        "cover": payload.cover,
        "fc": payload.fc,
        "fy": payload.fy,
    }
    try:
        result = calculate_footing(
            axial_load=payload.axial_load,
            moment=payload.moment,
            shear=payload.shear,
            length=payload.length,
            width=payload.width,
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
