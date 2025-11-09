"""
Schemas para cálculos estructurales de elementos:
- Pilares y vigas de hormigón armado (ACI318)
- Pilares y vigas de acero (AISC360)
- Pilares y vigas de madera (NCh1198)
- Zapatas de hormigón (ACI318)
"""
from typing import Optional
from pydantic import BaseModel, Field


# ============================================================================
# PILARES DE HORMIGÓN ARMADO (ACI318)
# ============================================================================

class ConcreteColumnRequest(BaseModel):
    """Parámetros para diseño de pilar de hormigón armado."""
    model_config = {"populate_by_name": True}

    # Metadata para historial
    project_id: str = Field(..., alias="projectId", description="ID del proyecto")
    user_id: str = Field(..., alias="userId", description="ID del usuario")

    # Esfuerzos
    axial_load: float = Field(..., alias="axialLoad", description="Carga axial (kN)")
    moment_x: float = Field(..., alias="momentX", description="Momento flector eje X (kN·m)")
    moment_y: float = Field(..., alias="momentY", description="Momento flector eje Y (kN·m)")
    shear_x: float = Field(..., alias="shearX", description="Cortante eje X (kN)")
    shear_y: float = Field(..., alias="shearY", description="Cortante eje Y (kN)")

    # Geometría
    width: float = Field(..., gt=0, description="Ancho de la sección (cm)")
    depth: float = Field(..., gt=0, description="Largo de la sección (cm)")
    length: float = Field(..., gt=0, description="Altura del pilar (m)")

    # Materiales
    fc: float = Field(..., alias="fc", gt=0, description="Resistencia del hormigón (MPa)")
    fy: float = Field(..., alias="fy", gt=0, description="Límite de fluencia del acero (MPa)")

    # Parámetros adicionales
    cover: float = Field(4.0, gt=0, description="Recubrimiento (cm)")
    unsupported_length: Optional[float] = Field(None, alias="unsupportedLength", gt=0, description="Longitud sin apoyo lateral (m)")


class LongitudinalSteel(BaseModel):
    """Refuerzo longitudinal."""
    num_bars: int = Field(..., alias="numBars", description="Número de barras")
    bar_diameter: float = Field(..., alias="barDiameter", description="Diámetro de barras (mm)")
    total_area: float = Field(..., alias="totalArea", description="Área total (mm²)")
    ratio: float = Field(..., description="Cuantía de acero")


class TransverseSteel(BaseModel):
    """Refuerzo transversal."""
    diameter: float = Field(..., description="Diámetro de estribos (mm)")
    spacing: float = Field(..., description="Espaciamiento (mm)")


class ConcreteColumnResponse(BaseModel):
    """Resultados del diseño de pilar de hormigón."""
    # Capacidad
    axial_capacity: float = Field(..., alias="axialCapacity", description="Capacidad axial (kN)")
    axial_capacity_ratio: float = Field(..., alias="axialCapacityRatio", description="Ratio de capacidad axial")

    # Diseño de refuerzo
    longitudinal_steel: LongitudinalSteel = Field(..., alias="longitudinalSteel")
    transverse_steel: TransverseSteel = Field(..., alias="transverseSteel")

    # Verificaciones de corte
    shear_capacity_ratio_x: float = Field(..., alias="shearCapacityRatioX", description="Ratio corte X")
    shear_capacity_ratio_y: float = Field(..., alias="shearCapacityRatioY", description="Ratio corte Y")

    # Esbeltez
    slenderness_ratio: float = Field(..., alias="slendernessRatio", description="Esbeltez")
    magnification_factor: float = Field(..., alias="magnificationFactor", description="Factor de magnificación")
    is_slender: bool = Field(..., alias="isSlender", description="¿Es columna esbelta?")


# ============================================================================
# VIGAS DE HORMIGÓN ARMADO (ACI318)
# ============================================================================

class ConcreteBeamRequest(BaseModel):
    """Parámetros para diseño de viga de hormigón armado."""
    model_config = {"populate_by_name": True}

    # Metadata para historial
    project_id: str = Field(..., alias="projectId", description="ID del proyecto")
    user_id: str = Field(..., alias="userId", description="ID del usuario")

    # Esfuerzos
    positive_moment: float = Field(..., alias="positiveMoment", description="Momento positivo máximo (kN·m)")
    negative_moment: float = Field(..., alias="negativeMoment", description="Momento negativo máximo (kN·m)")
    max_shear: float = Field(..., alias="maxShear", description="Cortante máximo (kN)")

    # Geometría
    width: float = Field(..., gt=0, description="Ancho de la viga (cm)")
    height: float = Field(..., gt=0, description="Altura de la viga (cm)")
    span: float = Field(..., gt=0, description="Luz de la viga (m)")

    # Materiales
    fc: float = Field(..., alias="fc", gt=0, description="Resistencia del hormigón (MPa)")
    fy: float = Field(..., alias="fy", gt=0, description="Límite de fluencia del acero (MPa)")

    # Parámetros adicionales
    cover: float = Field(4.0, gt=0, description="Recubrimiento (cm)")


class PositiveReinforcement(BaseModel):
    """Refuerzo longitudinal positivo (inferior)."""
    num_bars: int = Field(..., alias="numBars", description="Número de barras")
    bar_diameter: float = Field(..., alias="barDiameter", description="Diámetro de barras (mm)")
    total_area: float = Field(..., alias="totalArea", description="Área total (mm²)")
    ratio: float = Field(..., description="Cuantía de acero")


class NegativeReinforcement(BaseModel):
    """Refuerzo longitudinal negativo (superior)."""
    num_bars: int = Field(..., alias="numBars", description="Número de barras")
    bar_diameter: float = Field(..., alias="barDiameter", description="Diámetro de barras (mm)")
    total_area: float = Field(..., alias="totalArea", description="Área total (mm²)")
    ratio: float = Field(..., description="Cuantía de acero")


class ConcreteBeamResponse(BaseModel):
    """Resultados del diseño de viga de hormigón."""
    # Refuerzo longitudinal (note: typo in service 'positiveReinforcemenet')
    positive_reinforcement: PositiveReinforcement = Field(..., alias="positiveReinforcemenet")
    negative_reinforcement: NegativeReinforcement = Field(..., alias="negativeReinforcement")

    # Refuerzo transversal
    transverse_steel: TransverseSteel = Field(..., alias="transverseSteel")

    # Verificaciones
    shear_capacity_ratio: float = Field(..., alias="shearCapacityRatio", description="Ratio corte")
    deflection_check: str = Field(..., alias="deflectionCheck", description="Estado deflexión")
    effective_depth: float = Field(..., alias="effectiveDepth", description="Peralte efectivo (mm)")


# ============================================================================
# PILARES DE ACERO (AISC360)
# ============================================================================

class SteelColumnRequest(BaseModel):
    """Parámetros para diseño de pilar de acero."""
    model_config = {"populate_by_name": True}

    # Metadata para historial
    project_id: str = Field(..., alias="projectId", description="ID del proyecto")
    user_id: str = Field(..., alias="userId", description="ID del usuario")

    # Esfuerzos
    axial_load: float = Field(..., alias="axialLoad", description="Carga axial (kN)")
    moment_x: float = Field(..., alias="momentX", description="Momento flector X (kN·m)")
    moment_y: float = Field(..., alias="momentY", description="Momento flector Y (kN·m)")

    # Geometría del perfil
    section_type: str = Field(..., alias="sectionType", description="Tipo de perfil (W, HSS, etc.)")

    # Opción 1: Perfil estándar
    profile_name: Optional[str] = Field(None, alias="profileName", description="Nombre del perfil (ej: W14x90)")

    # Opción 2: Propiedades personalizadas
    area: Optional[float] = Field(None, description="Área de la sección (cm²)")
    ix: Optional[float] = Field(None, description="Inercia eje X (cm⁴)")
    iy: Optional[float] = Field(None, description="Inercia eje Y (cm⁴)")
    rx: Optional[float] = Field(None, description="Radio de giro X (cm)")
    ry: Optional[float] = Field(None, description="Radio de giro Y (cm)")
    zx: Optional[float] = Field(None, description="Módulo plástico X (cm³)")
    zy: Optional[float] = Field(None, description="Módulo plástico Y (cm³)")

    # Longitudes
    length: float = Field(..., gt=0, description="Altura del pilar (m)")
    kx: float = Field(1.0, ge=0.5, le=2.0, description="Factor K eje X")
    ky: float = Field(1.0, ge=0.5, le=2.0, description="Factor K eje Y")

    # Material
    fy: float = Field(250.0, alias="fy", gt=0, description="Límite de fluencia (MPa)")
    fu: float = Field(400.0, alias="fu", gt=0, description="Resistencia última (MPa)")
    E: float = Field(200000.0, gt=0, description="Módulo de elasticidad (MPa)")


class SteelColumnResponse(BaseModel):
    """Resultados del diseño de pilar de acero."""
    section: str = Field(..., description="Nombre de la sección")

    # Capacidad
    pn: float = Field(..., description="Capacidad axial nominal (kN)")
    mn_x: float = Field(..., alias="mnX", description="Momento nominal X (kN·m)")
    mn_y: float = Field(..., alias="mnY", description="Momento nominal Y (kN·m)")

    # Verificaciones
    slenderness_x: float = Field(..., alias="slendernessX", description="Esbeltez X")
    slenderness_y: float = Field(..., alias="slendernessY", description="Esbeltez Y")
    lambda_c: float = Field(..., alias="lambdaC", description="Parámetro de esbeltez")

    # Ratios de utilización
    axial_ratio: float = Field(..., alias="axialRatio", description="Ratio axial")
    flexure_ratio_x: float = Field(..., alias="flexureRatioX", description="Ratio flexión X")
    flexure_ratio_y: float = Field(..., alias="flexureRatioY", description="Ratio flexión Y")
    interaction_ratio: float = Field(..., alias="interactionRatio", description="Ratio de interacción")

    passes: bool = Field(..., description="¿Cumple el diseño?")
    check_status: str = Field(..., alias="checkStatus", description="Estado de verificación")


# ============================================================================
# VIGAS DE ACERO (AISC360)
# ============================================================================

class SteelBeamRequest(BaseModel):
    """Parámetros para diseño de viga de acero."""
    model_config = {"populate_by_name": True}

    # Metadata para historial
    project_id: str = Field(..., alias="projectId", description="ID del proyecto")
    user_id: str = Field(..., alias="userId", description="ID del usuario")

    # Esfuerzos
    moment: float = Field(..., description="Momento máximo (kN·m)")
    shear: float = Field(..., description="Cortante máximo (kN)")

    # Geometría
    section_type: str = Field(..., alias="sectionType", description="Tipo de perfil")
    profile_name: Optional[str] = Field(None, alias="profileName", description="Nombre del perfil")
    lateral_support: Optional[str] = Field(None, alias="lateralSupport", description="Soporte lateral")

    # Propiedades personalizadas
    area: Optional[float] = Field(None, description="Área (cm²)")
    ix: Optional[float] = Field(None, description="Inercia X (cm⁴)")
    sx: Optional[float] = Field(None, description="Módulo elástico X (cm³)")
    zx: Optional[float] = Field(None, description="Módulo plástico X (cm³)")

    # Longitudes
    span: float = Field(..., gt=0, description="Luz de la viga (m)")
    lb: Optional[float] = Field(None, alias="Lb", description="Longitud no arriostrada (m)")

    # Material
    fy: float = Field(250.0, alias="fy", gt=0, description="Límite de fluencia (MPa)")
    E: float = Field(200000.0, gt=0, description="Módulo de elasticidad (MPa)")


class SteelBeamResponse(BaseModel):
    """Resultados del diseño de viga de acero."""
    section: str = Field(..., description="Nombre de la sección")

    # Capacidad
    mn: float = Field(..., description="Momento nominal (kN·m)")
    vn: float = Field(..., description="Cortante nominal (kN)")

    # Verificaciones
    flexure_ratio: float = Field(..., alias="flexureRatio", description="Ratio flexión")
    shear_ratio: float = Field(..., alias="shearRatio", description="Ratio cortante")
    deflection: float = Field(..., description="Deflexión (cm)")
    deflection_ratio: float = Field(..., alias="deflectionRatio", description="Ratio deflexión")

    passes: bool = Field(..., description="¿Cumple el diseño?")
    check_status: str = Field(..., alias="checkStatus", description="Estado de verificación")


# ============================================================================
# PILARES DE MADERA (NCh1198)
# ============================================================================

class WoodColumnRequest(BaseModel):
    """Parámetros para diseño de pilar de madera."""
    model_config = {"populate_by_name": True}

    # Metadata para historial
    project_id: str = Field(..., alias="projectId", description="ID del proyecto")
    user_id: str = Field(..., alias="userId", description="ID del usuario")

    # Esfuerzos
    axial_load: float = Field(..., alias="axialLoad", description="Carga axial (kN)")
    moment: float = Field(0.0, description="Momento flector (kN·m)")

    # Geometría
    width: float = Field(..., gt=0, description="Ancho (cm)")
    depth: float = Field(..., gt=0, description="Profundidad (cm)")
    length: float = Field(..., gt=0, description="Altura (m)")

    # Material
    wood_type: Optional[str] = Field(None, alias="woodType", description="Tipo de madera (Pino, Roble, etc.)")
    fc: Optional[float] = Field(None, description="Resistencia a compresión paralela (MPa)")
    fm: Optional[float] = Field(None, description="Resistencia a flexión (MPa)")
    E: Optional[float] = Field(None, description="Módulo de elasticidad (MPa)")

    # Factores de modificación
    moisture_factor: float = Field(1.0, alias="moistureFactor", ge=0.5, le=1.0, description="Factor de humedad")
    duration_factor: float = Field(1.0, alias="durationFactor", ge=0.5, le=1.5, description="Factor de duración")

    # Parámetros de pandeo
    k_factor: float = Field(1.0, alias="kFactor", ge=0.5, le=2.0, description="Factor de longitud efectiva")


class WoodColumnResponse(BaseModel):
    """Resultados del diseño de pilar de madera."""
    wood_type: str = Field(..., alias="woodType", description="Tipo de madera")
    area: float = Field(..., description="Área de la sección (mm²)")

    # Capacidad
    pn: float = Field(..., description="Capacidad axial (kN)")

    # Verificaciones
    utilization_ratio: float = Field(..., alias="utilizationRatio", description="Ratio de utilización")
    slenderness_x: float = Field(..., alias="slendernessX", description="Esbeltez eje X")
    slenderness_y: float = Field(..., alias="slendernessY", description="Esbeltez eje Y")
    stability_factor: float = Field(..., alias="stabilityFactor", description="Factor de estabilidad Cp")
    is_slender: bool = Field(..., alias="isSlender", description="¿Es columna esbelta?")
    allowable_stress: float = Field(..., alias="allowableStress", description="Esfuerzo admisible (MPa)")

    check_status: str = Field(..., alias="checkStatus", description="Estado de verificación")


# ============================================================================
# VIGAS DE MADERA (NCh1198)
# ============================================================================

class WoodBeamRequest(BaseModel):
    """Parámetros para diseño de viga de madera."""
    model_config = {"populate_by_name": True}

    # Metadata para historial
    project_id: str = Field(..., alias="projectId", description="ID del proyecto")
    user_id: str = Field(..., alias="userId", description="ID del usuario")

    # Esfuerzos
    moment: float = Field(..., description="Momento máximo (kN·m)")
    shear: float = Field(..., description="Cortante máximo (kN)")

    # Geometría
    width: float = Field(..., gt=0, description="Ancho (cm)")
    height: float = Field(..., gt=0, description="Altura (cm)")
    span: float = Field(..., gt=0, description="Luz (m)")

    # Material
    wood_type: Optional[str] = Field(None, alias="woodType", description="Tipo de madera")
    lateral_support: Optional[str] = Field(None, alias="lateralSupport", description="Soporte lateral")
    fm: Optional[float] = Field(None, description="Resistencia a flexión (MPa)")
    fv: Optional[float] = Field(None, description="Resistencia al corte (MPa)")
    E: Optional[float] = Field(None, description="Módulo de elasticidad (MPa)")

    # Factores
    moisture_factor: float = Field(1.0, alias="moistureFactor", ge=0.5, le=1.0)
    duration_factor: float = Field(1.0, alias="durationFactor", ge=0.5, le=1.5)


class WoodBeamResponse(BaseModel):
    """Resultados del diseño de viga de madera."""
    wood_type: str = Field(..., alias="woodType", description="Tipo de madera")
    section: str = Field(..., description="Sección de la viga")

    # Capacidad
    mn: float = Field(..., description="Momento nominal (kN·m)")
    vn: float = Field(..., description="Cortante nominal (kN)")

    # Verificaciones
    utilization_ratio: float = Field(..., alias="utilizationRatio", description="Ratio de utilización")
    flexure_ratio: float = Field(..., alias="flexureRatio", description="Ratio flexión")
    shear_ratio: float = Field(..., alias="shearRatio", description="Ratio cortante")
    deflection: float = Field(..., description="Deflexión (cm)")
    deflection_ratio: float = Field(..., alias="deflectionRatio", description="Ratio deflexión")

    passes: bool = Field(..., description="¿Cumple el diseño?")
    check_status: str = Field(..., alias="checkStatus", description="Estado de verificación")


# ============================================================================
# ZAPATAS DE HORMIGÓN (ACI318)
# ============================================================================

class FootingRequest(BaseModel):
    """Parámetros para diseño de zapata de hormigón."""
    model_config = {"populate_by_name": True}

    # Metadata para historial
    project_id: str = Field(..., alias="projectId", description="ID del proyecto")
    user_id: str = Field(..., alias="userId", description="ID del usuario")

    # Tipo de zapata
    footing_type: str = Field(..., alias="footingType", description="Tipo: isolated o continuous")

    # Cargas
    axial_load: float = Field(..., alias="axialLoad", description="Carga axial (kN)")
    moment: float = Field(0.0, description="Momento (kN·m)")
    shear: float = Field(0.0, description="Cortante (kN)")

    # Dimensiones propuestas (optional para cálculo automático)
    length: Optional[float] = Field(None, gt=0, description="Largo propuesto (m)")
    width: Optional[float] = Field(None, gt=0, description="Ancho propuesto (m)")
    footing_depth: Optional[float] = Field(None, alias="footingDepth", gt=0, description="Altura zapata propuesta (cm)")

    # Cargas dinámicas y sísmicas
    static_pressure: float = Field(0.0, alias="staticPressure", description="Empuje estático (kPa)")
    dynamic_pressure: float = Field(0.0, alias="dynamicPressure", description="Empuje dinámico (kPa)")
    seismic_pressure: float = Field(0.0, alias="seismicPressure", description="Empuje sísmico (kPa)")

    # Suelo
    soil_bearing_capacity: float = Field(..., alias="soilBearingCapacity", gt=0, description="Capacidad portante (kPa)")

    # Geometría de columna/muro
    column_width: float = Field(..., alias="columnWidth", gt=0, description="Ancho columna/muro (cm)")
    column_depth: float = Field(..., alias="columnDepth", gt=0, description="Profundidad columna/muro (cm)")

    # Materiales
    fc: float = Field(..., gt=0, description="Resistencia hormigón (MPa)")
    fy: float = Field(..., gt=0, description="Fluencia acero (MPa)")

    # Parámetros adicionales
    cover: float = Field(7.5, gt=0, description="Recubrimiento (cm)")


class FootingResponse(BaseModel):
    """Resultados del diseño de zapata."""
    # Geometría resultante
    length: float = Field(..., description="Largo de zapata (m)")
    width: float = Field(..., description="Ancho de zapata (m)")
    depth: float = Field(..., description="Altura de zapata (cm)")

    # Verificación de capacidad portante
    soil_pressure_max: float = Field(..., alias="soilPressureMax", description="Presión máxima (kPa)")
    soil_pressure_min: float = Field(..., alias="soilPressureMin", description="Presión mínima (kPa)")

    # Refuerzo
    as_longitudinal: float = Field(..., alias="asLongitudinal", description="Acero longitudinal (cm²/m)")
    as_transverse: float = Field(..., alias="asTransverse", description="Acero transversal (cm²/m)")
    bar_diameter: float = Field(..., alias="barDiameter", description="Diámetro barras (mm)")
    spacing: float = Field(..., description="Espaciamiento (cm)")

    # Verificaciones
    punching_shear_ratio: float = Field(..., alias="punchingShearRatio", description="Ratio punzonamiento")
    beam_shear_ratio: float = Field(..., alias="beamShearRatio", description="Ratio cortante viga")

    passes: bool = Field(..., description="¿Cumple el diseño?")