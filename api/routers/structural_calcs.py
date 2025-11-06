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

router = APIRouter()


# HORMIGÓN ARMADO (ACI318)


@router.post("/concrete/column", response_model=ConcreteColumnResponse)
async def concrete_column_design(payload: ConcreteColumnRequest):
    """Diseña un pilar de hormigón armado según ACI318."""
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
        return ConcreteColumnResponse(**result)
    except (ValueError, ZeroDivisionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/concrete/beam", response_model=ConcreteBeamResponse)
async def concrete_beam_design(payload: ConcreteBeamRequest):
    """Diseña una viga de hormigón armado según ACI318."""
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
        return ConcreteBeamResponse(**result)
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