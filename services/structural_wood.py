"""
Servicio de cálculo de elementos de madera según NCh1198.
Implementa diseño de pilares y vigas de madera.
"""
import math
from typing import Dict, Any, Optional


# Catálogo de propiedades de maderas chilenas según NCh1198
WOOD_TYPES = {
    "Pino radiata": {
        "fc": 8.5,  # MPa - Compresión paralela a la fibra
        "fm": 12.5,  # MPa - Flexión
        "fv": 1.2,  # MPa - Corte paralelo
        "E": 9000,  # MPa - Módulo de elasticidad
        "density": 450,  # kg/m³
    },
    "Pino radiata C24": {
        "fc": 11.0,  # MPa - Compresión paralela (grado C24)
        "fm": 15.0,  # MPa - Flexión (grado C24)
        "fv": 1.4,  # MPa - Corte paralelo (grado C24)
        "E": 11000,  # MPa - Módulo de elasticidad (grado C24)
        "density": 450,  # kg/m³
    },
    "Pino radiata C16": {
        "fc": 7.5,  # MPa - Compresión paralela (grado C16)
        "fm": 10.0,  # MPa - Flexión (grado C16)
        "fv": 1.0,  # MPa - Corte paralelo (grado C16)
        "E": 8000,  # MPa - Módulo de elasticidad (grado C16)
        "density": 450,  # kg/m³
    },
    "Coigüe": {
        "fc": 13.0,
        "fm": 18.0,
        "fv": 1.8,
        "E": 11000,
        "density": 550,
    },
    "Roble": {
        "fc": 12.5,
        "fm": 17.5,
        "fv": 1.7,
        "E": 10500,
        "density": 530,
    },
    "Lenga": {
        "fc": 11.5,
        "fm": 16.0,
        "fv": 1.6,
        "E": 10000,
        "density": 520,
    },
    "Alerce": {
        "fc": 10.0,
        "fm": 14.0,
        "fv": 1.4,
        "E": 9500,
        "density": 480,
    },
}


def calculate_wood_column(
    axial_load: float,
    width: float,
    depth: float,
    length: float,
    wood_type: Optional[str] = None,
    custom_fc: Optional[float] = None,
    custom_E: Optional[float] = None,
    moisture_factor: float = 1.0,
    duration_factor: float = 1.0,
    Kx: float = 1.0,
    Ky: float = 1.0,
) -> Dict[str, Any]:
    """
    Diseño de pilar de madera según NCh1198.

    Args:
        axial_load: Carga axial (kN)
        width: Ancho de la sección (cm)
        depth: Profundidad de la sección (cm)
        length: Altura del pilar (m)
        wood_type: Tipo de madera (ej: "Pino radiata")
        custom_fc: Resistencia a compresión personalizada (MPa)
        custom_E: Módulo de elasticidad personalizado (MPa)
        moisture_factor: Factor por contenido de humedad (0.67-1.0)
        duration_factor: Factor por duración de carga (0.9-1.15)
        Kx: Factor de longitud efectiva eje X
        Ky: Factor de longitud efectiva eje Y

    Returns:
        Dict con resultados del diseño
    """
    # Obtener propiedades de la madera
    if wood_type and wood_type in WOOD_TYPES:
        props = WOOD_TYPES[wood_type]
        fc = props["fc"]
        E = props["E"]
        wood_name = wood_type
    elif custom_fc and custom_E:
        fc = custom_fc
        E = custom_E
        wood_name = "Madera personalizada"
    else:
        raise ValueError("Debe proporcionar un tipo de madera o propiedades personalizadas")

    # Conversiones
    P = axial_load * 1000  # kN -> N
    b = width * 10  # cm -> mm
    d = depth * 10  # cm -> mm
    L = length * 1000  # m -> mm

    # Área de la sección
    A = b * d  # mm²

    # Momentos de inercia
    Ix = (b * d**3) / 12  # mm⁴ (eje fuerte)
    Iy = (d * b**3) / 12  # mm⁴ (eje débil)

    # Radios de giro
    rx = math.sqrt(Ix / A)  # = d / sqrt(12)
    ry = math.sqrt(Iy / A)  # = b / sqrt(12)

    # Longitudes efectivas
    Lx = Kx * L
    Ly = Ky * L

    # Esbelteces
    lambda_x = Lx / rx
    lambda_y = Ly / ry
    lambda_max = max(lambda_x, lambda_y)

    # Resistencia de diseño a compresión
    # Aplicar factores de modificación
    fc_adjusted = fc * moisture_factor * duration_factor

    # Factor de seguridad según NCh1198
    FS = 2.25  # Para compresión

    # Resistencia admisible base
    fc_adm_base = fc_adjusted / FS

    # Límite de esbeltez (NCh1198)
    lambda_limit = 50  # Límite recomendado
    if lambda_max > lambda_limit:
        is_slender = True
    else:
        is_slender = False

    # Carga crítica de Euler
    # Usar el eje más desfavorable (menor I)
    I_min = min(Ix, Iy)
    Pe = (math.pi**2 * E * I_min) / (max(Lx, Ly)**2)  # N

    # Factor de reducción por esbeltez según NCh1198
    # Para columnas de madera: Cp
    Fe = Pe / A  # Esfuerzo crítico de Euler (MPa)

    # Relación de esbeltez modificada
    c = 0.8  # Factor para madera aserrada (NCh1198)
    FcE = (c * math.pi**2 * E) / lambda_max**2  # Esfuerzo crítico modificado

    # Factor de estabilidad de columna Cp (NCh1198 5.3.6)
    ratio = FcE / fc_adm_base
    if ratio >= 10:
        Cp = 1.0
    else:
        # Ecuación de estabilidad
        Cp = (1 + ratio) / (2 * c) - math.sqrt(((1 + ratio) / (2 * c))**2 - (ratio / c))
        Cp = max(0, min(1.0, Cp))

    # Resistencia admisible a compresión con factor de estabilidad
    fc_adm = fc_adm_base * Cp

    # Capacidad del pilar
    Pc = fc_adm * A  # N

    # Ratio de utilización
    capacity_ratio = P / Pc if Pc > 0 else 999

    return {
        "woodType": wood_name,
        "area": round(A, 2),  # mm²
        "pn": round(Pc / 1000, 2),  # kN
        "utilizationRatio": round(capacity_ratio, 3),
        "slendernessX": round(lambda_x, 2),
        "slendernessY": round(lambda_y, 2),
        "stabilityFactor": round(Cp, 3),
        "isSlender": is_slender,
        "allowableStress": round(fc_adm, 2),  # MPa
        "checkStatus": "OK" if capacity_ratio <= 1.0 else "No cumple",
    }


def calculate_wood_beam(
    moment: float,
    shear: float,
    width: float,
    height: float,
    span: float,
    wood_type: Optional[str] = None,
    custom_fm: Optional[float] = None,
    custom_fv: Optional[float] = None,
    custom_E: Optional[float] = None,
    moisture_factor: float = 1.0,
    duration_factor: float = 1.0,
) -> Dict[str, Any]:
    """
    Diseño de viga de madera según NCh1198.

    Args:
        moment: Momento máximo (kN·m)
        shear: Cortante máximo (kN)
        width: Ancho de la viga (cm)
        height: Altura de la viga (cm)
        span: Luz de la viga (m)
        wood_type: Tipo de madera
        custom_fm: Resistencia a flexión personalizada (MPa)
        custom_fv: Resistencia a corte personalizada (MPa)
        custom_E: Módulo de elasticidad personalizado (MPa)
        moisture_factor: Factor por contenido de humedad
        duration_factor: Factor por duración de carga

    Returns:
        Dict con resultados del diseño
    """
    # Obtener propiedades de la madera
    if wood_type and wood_type in WOOD_TYPES:
        props = WOOD_TYPES[wood_type]
        fm = props["fm"]
        fv = props["fv"]
        E = props["E"]
        wood_name = wood_type
    elif custom_fm and custom_fv and custom_E:
        fm = custom_fm
        fv = custom_fv
        E = custom_E
        wood_name = "Madera personalizada"
    else:
        raise ValueError("Debe proporcionar un tipo de madera o propiedades personalizadas")

    # Conversiones
    M = moment * 1e6  # kN·m -> N·mm
    V = shear * 1000  # kN -> N
    b = width * 10  # cm -> mm
    h = height * 10  # cm -> mm
    L = span * 1000  # m -> mm

    # Propiedades de la sección
    A = b * h  # mm²
    I = (b * h**3) / 12  # mm⁴
    W = (b * h**2) / 6  # mm³ (módulo de sección)

    # Resistencias ajustadas
    fm_adjusted = fm * moisture_factor * duration_factor
    fv_adjusted = fv * moisture_factor * duration_factor

    # Factores de seguridad NCh1198
    FS_flexure = 2.25
    FS_shear = 2.25

    # VERIFICACIÓN A FLEXIÓN
    # Esfuerzo de flexión actuante
    fb = M / W  # MPa

    # Resistencia admisible a flexión
    fm_adm = fm_adjusted / FS_flexure

    # Factor de forma (para sección rectangular)
    Cf = 1.0

    # Factor de estabilidad lateral (asumiendo viga arriostrada)
    CL = 1.0  # Si está completamente arriostrada

    # Si no está arriostrada, verificar pandeo lateral
    # Relación esbeltez lateral
    lu = L  # Longitud sin arriostramiento (asumida igual a L para ser conservadores)
    rb = math.sqrt(I / A)  # Radio de giro respecto eje débil
    lambda_b = lu / b  # Esbeltez lateral simplificada

    if lambda_b > 50:
        # Reducción por pandeo lateral
        CL = max(0.5, 1.0 - 0.01 * (lambda_b - 50))
    else:
        CL = 1.0

    # Resistencia admisible final
    fm_adm_final = fm_adm * Cf * CL

    # Ratio de flexión
    flexure_ratio = fb / fm_adm_final

    # VERIFICACIÓN A CORTE
    # Esfuerzo cortante actuante (NCh1198 - 1.5V/A para sección rectangular)
    fv_act = (1.5 * V) / A  # MPa

    # Resistencia admisible a corte
    fv_adm = fv_adjusted / FS_shear

    # Ratio de corte
    shear_ratio = fv_act / fv_adm

    # VERIFICACIÓN A DEFLEXIÓN
    # Deflexión bajo carga de servicio (asumiendo carga uniforme)
    # δ = 5wL⁴/(384EI)
    # Estimamos w desde el momento: M = wL²/8
    w = (8 * M) / (L**2)  # N/mm (asumiendo momento de servicio)
    # Reducir momento último a servicio (factor ≈ 1.6)
    w_service = w / 1.6

    delta = (5 * w_service * L**4) / (384 * E * I)  # mm

    # Límite de deflexión L/300 para vigas (NCh1198)
    delta_limit = L / 300  # mm

    deflection_ratio = delta / delta_limit

    # Capacidades nominales
    Mn = fm_adm_final * W / 1e6  # kN·m
    Vn = fv_adm * A / 1000  # kN

    return {
        "woodType": wood_name,
        "section": f"{width}x{height} cm",
        "mn": round(Mn, 2),  # kN·m
        "vn": round(Vn, 2),  # kN
        "utilizationRatio": round(max(flexure_ratio, shear_ratio), 3),
        "flexureRatio": round(flexure_ratio, 3),
        "shearRatio": round(shear_ratio, 3),
        "deflection": round(delta / 10, 2),  # cm
        "deflectionRatio": round(deflection_ratio, 3),
        "passes": flexure_ratio <= 1.0 and shear_ratio <= 1.0 and deflection_ratio <= 1.0,
        "checkStatus": "OK" if (flexure_ratio <= 1.0 and shear_ratio <= 1.0 and deflection_ratio <= 1.0) else "No cumple",
    }