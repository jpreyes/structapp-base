"""
Servicio de cálculo de elementos de acero estructural según AISC360.
Implementa diseño de pilares y vigas de acero.
"""
import math
from typing import Dict, Any, Optional


# Catálogo simplificado de perfiles W (Wide Flange) - valores en mm y mm²/mm⁴
STEEL_PROFILES = {
    "W200x46": {"area": 5890, "Ix": 45.5e6, "Iy": 15.3e6, "Zx": 510e3, "Zy": 196e3, "d": 203, "bf": 203, "tw": 7.2, "tf": 11.0},
    "W250x73": {"area": 9280, "Ix": 104e6, "Iy": 34.4e6, "Zx": 935e3, "Zy": 388e3, "d": 254, "bf": 254, "tw": 8.6, "tf": 14.2},
    "W310x97": {"area": 12300, "Ix": 222e6, "Iy": 76.5e6, "Zx": 1600e3, "Zy": 690e3, "d": 308, "bf": 305, "tw": 9.9, "tf": 15.4},
    "W360x122": {"area": 15500, "Ix": 401e6, "Iy": 133e6, "Zx": 2490e3, "Zy": 1020e3, "d": 363, "bf": 257, "tw": 10.7, "tf": 17.4},
    "W410x149": {"area": 19000, "Ix": 664e6, "Iy": 156e6, "Zx": 3580e3, "Zy": 1230e3, "d": 415, "bf": 260, "tw": 11.6, "tf": 19.0},
}


def calculate_steel_column(
    axial_load: float,
    moment_x: float,
    moment_y: float,
    length: float,
    fy: float,
    E: float = 200000,
    profile: Optional[str] = None,
    custom_area: Optional[float] = None,
    custom_Ix: Optional[float] = None,
    custom_Iy: Optional[float] = None,
    custom_Zx: Optional[float] = None,
    custom_Zy: Optional[float] = None,
    Kx: float = 1.0,
    Ky: float = 1.0,
) -> Dict[str, Any]:
    """
    Diseño de pilar de acero estructural según AISC360.

    Args:
        axial_load: Carga axial (kN)
        moment_x: Momento flector eje X (kN·m)
        moment_y: Momento flector eje Y (kN·m)
        length: Altura del pilar (m)
        fy: Límite de fluencia del acero (MPa)
        E: Módulo de elasticidad (MPa)
        profile: Nombre del perfil estándar (ej: "W310x97")
        custom_area: Área personalizada (mm²)
        custom_Ix: Inercia eje X personalizada (mm⁴)
        custom_Iy: Inercia eje Y personalizada (mm⁴)
        custom_Zx: Módulo plástico eje X personalizado (mm³)
        custom_Zy: Módulo plástico eje Y personalizado (mm³)
        Kx: Factor de longitud efectiva eje X
        Ky: Factor de longitud efectiva eje Y

    Returns:
        Dict con resultados del diseño
    """
    # Obtener propiedades de la sección
    if profile and profile in STEEL_PROFILES:
        props = STEEL_PROFILES[profile]
        A = props["area"]
        Ix = props["Ix"]
        Iy = props["Iy"]
        Zx = props["Zx"]
        Zy = props["Zy"]
        section_name = profile
    elif custom_area and custom_Ix and custom_Iy and custom_Zx and custom_Zy:
        A = custom_area
        Ix = custom_Ix
        Iy = custom_Iy
        Zx = custom_Zx
        Zy = custom_Zy
        section_name = "Sección personalizada"
    else:
        raise ValueError("Debe proporcionar un perfil estándar o propiedades personalizadas completas")

    # Conversiones
    P = axial_load * 1000  # kN -> N
    Mx = moment_x * 1e6  # kN·m -> N·mm
    My = moment_y * 1e6  # kN·m -> N·mm
    L = length * 1000  # m -> mm

    # Factor de reducción
    phi_c = 0.90  # Compresión
    phi_b = 0.90  # Flexión

    # Radios de giro
    rx = math.sqrt(Ix / A)
    ry = math.sqrt(Iy / A)

    # Longitudes efectivas
    Lx = Kx * L
    Ly = Ky * L

    # Esbelteces
    lambda_x = Lx / rx
    lambda_y = Ly / ry
    lambda_max = max(lambda_x, lambda_y)

    # Límite de esbeltez elástica
    lambda_c = math.pi * math.sqrt(E / fy)

    # CAPACIDAD A COMPRESIÓN (AISC360 E3)
    if lambda_max <= lambda_c:
        # Pandeo inelástico
        Fcr = (0.658 ** (fy / ((math.pi**2 * E) / lambda_max**2))) * fy
    else:
        # Pandeo elástico
        Fcr = (0.877 * math.pi**2 * E) / lambda_max**2

    # Resistencia nominal a compresión
    Pn = Fcr * A  # N
    Pc = phi_c * Pn  # Resistencia de diseño

    # CAPACIDAD A FLEXIÓN (AISC360 F2)
    # Momento plástico
    Mpx = Zx * fy  # N·mm
    Mpy = Zy * fy  # N·mm

    # Longitud no arriostrada lateralmente (asumida igual a L para diseño conservador)
    Lb = L

    # Límites para pandeo lateral-torsional (simplificado para W shapes)
    Lp = 1.76 * ry * math.sqrt(E / fy)  # Límite plástico
    Lr = math.pi * ry * math.sqrt(E / (0.7 * fy))  # Límite inelástico

    # Resistencia a flexión eje mayor (X)
    if Lb <= Lp:
        # Zona plástica
        Mnx = Mpx
    elif Lb <= Lr:
        # Zona inelástica
        Cb = 1.0  # Factor de modificación (conservador)
        Mnx = Cb * (Mpx - (Mpx - 0.7 * fy * (Zx * 0.9)) * ((Lb - Lp) / (Lr - Lp)))
        Mnx = min(Mnx, Mpx)
    else:
        # Pandeo elástico lateral-torsional
        Fcr_ltb = (Cb * math.pi**2 * E) / (Lb / ry)**2
        Mnx = Fcr_ltb * (Zx * 0.9)  # Usando Sx ≈ 0.9*Zx aproximadamente
        Mnx = min(Mnx, Mpx)

    # Resistencia a flexión eje menor (Y) - no hay pandeo lateral
    Mny = Mpy

    # Resistencias de diseño
    Mcx = phi_b * Mnx
    Mcy = phi_b * Mny

    # INTERACCIÓN CARGA AXIAL + FLEXIÓN (AISC360 H1)
    if P / Pc >= 0.2:
        # Ecuación H1-1a
        interaction_ratio = (P / Pc) + (8/9) * ((Mx / Mcx) + (My / Mcy))
    else:
        # Ecuación H1-1b
        interaction_ratio = (P / (2 * Pc)) + ((Mx / Mcx) + (My / Mcy))

    # Verificaciones adicionales
    axial_capacity_ratio = P / Pc
    moment_capacity_ratio_x = Mx / Mcx if Mcx > 0 else 0
    moment_capacity_ratio_y = My / Mcy if Mcy > 0 else 0

    return {
        "section": section_name,
        "axialCapacity": round(Pc / 1000, 2),  # kN
        "axialCapacityRatio": round(axial_capacity_ratio, 3),
        "momentCapacityX": round(Mcx / 1e6, 2),  # kN·m
        "momentCapacityY": round(Mcy / 1e6, 2),  # kN·m
        "momentCapacityRatioX": round(moment_capacity_ratio_x, 3),
        "momentCapacityRatioY": round(moment_capacity_ratio_y, 3),
        "slendernessX": round(lambda_x, 2),
        "slendernessY": round(lambda_y, 2),
        "slendernessMax": round(lambda_max, 2),
        "interactionRatio": round(interaction_ratio, 3),
        "checkStatus": "OK" if interaction_ratio <= 1.0 else "No cumple",
    }


def calculate_steel_beam(
    moment: float,
    shear: float,
    span: float,
    fy: float,
    E: float = 200000,
    profile: Optional[str] = None,
    custom_Zx: Optional[float] = None,
    custom_Ix: Optional[float] = None,
    custom_area: Optional[float] = None,
    custom_d: Optional[float] = None,
    custom_tw: Optional[float] = None,
    Lb: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Diseño de viga de acero estructural según AISC360.

    Args:
        moment: Momento máximo (kN·m)
        shear: Cortante máximo (kN)
        span: Luz de la viga (m)
        fy: Límite de fluencia del acero (MPa)
        E: Módulo de elasticidad (MPa)
        profile: Nombre del perfil estándar
        custom_Zx: Módulo plástico personalizado (mm³)
        custom_Ix: Inercia personalizada (mm⁴)
        custom_area: Área personalizada (mm²)
        custom_d: Altura del alma personalizada (mm)
        custom_tw: Espesor del alma personalizado (mm)
        Lb: Longitud sin arriostrar lateral (m), si None usa span

    Returns:
        Dict con resultados del diseño
    """
    # Obtener propiedades de la sección
    if profile and profile in STEEL_PROFILES:
        props = STEEL_PROFILES[profile]
        Zx = props["Zx"]
        Ix = props["Ix"]
        A = props["area"]
        d = props["d"]
        tw = props["tw"]
        bf = props["bf"]
        tf = props["tf"]
        section_name = profile
    elif custom_Zx and custom_Ix and custom_area and custom_d and custom_tw:
        Zx = custom_Zx
        Ix = custom_Ix
        A = custom_area
        d = custom_d
        tw = custom_tw
        section_name = "Sección personalizada"
        bf = 0  # No usado en cálculos sin pandeo local
        tf = 0
    else:
        raise ValueError("Debe proporcionar un perfil estándar o propiedades personalizadas completas")

    # Conversiones
    M = moment * 1e6  # kN·m -> N·mm
    V = shear * 1000  # kN -> N
    L = span * 1000  # m -> mm
    Lb_mm = Lb * 1000 if Lb else L  # m -> mm

    # Factor de reducción
    phi_b = 0.90  # Flexión
    phi_v = 0.90  # Corte

    # Radio de giro (aproximado para eje menor)
    ry = math.sqrt(Ix / A) * 0.25  # Aproximación conservadora

    # CAPACIDAD A FLEXIÓN (AISC360 F2)
    Mp = Zx * fy  # Momento plástico (N·mm)

    # Límites para pandeo lateral-torsional
    Lp = 1.76 * ry * math.sqrt(E / fy)
    Lr = math.pi * ry * math.sqrt(E / (0.7 * fy))

    if Lb_mm <= Lp:
        # Zona plástica - sin pandeo lateral
        Mn = Mp
    elif Lb_mm <= Lr:
        # Zona inelástica
        Cb = 1.0  # Factor de modificación de momento (conservador para momento uniforme)
        Mn = Cb * (Mp - (Mp - 0.7 * fy * Zx) * ((Lb_mm - Lp) / (Lr - Lp)))
        Mn = min(Mn, Mp)
    else:
        # Pandeo elástico lateral-torsional
        Cb = 1.0
        Fcr = (Cb * math.pi**2 * E) / (Lb_mm / ry)**2
        Mn = Fcr * (Zx * 0.9)  # Sx ≈ 0.9*Zx
        Mn = min(Mn, Mp)

    # Resistencia de diseño a flexión
    Mr = phi_b * Mn

    # CAPACIDAD A CORTE (AISC360 G2)
    # Área del alma
    Aw = d * tw  # mm²

    # Coeficiente de corte del alma
    h_tw = d / tw  # Relación altura/espesor del alma
    kv = 5.0  # Para almas sin rigidizadores

    lambda_w = h_tw / math.sqrt(E / fy)
    lambda_pw = 1.10 * math.sqrt(kv * E / fy)
    lambda_rw = 1.37 * math.sqrt(kv * E / fy)

    # Resistencia nominal al corte
    if lambda_w <= lambda_pw:
        Cv = 1.0
    elif lambda_w <= lambda_rw:
        Cv = lambda_pw / lambda_w
    else:
        Cv = (1.51 * kv * E) / (fy * lambda_w**2)

    Vn = 0.6 * fy * Aw * Cv  # N
    Vr = phi_v * Vn  # Resistencia de diseño

    # DEFLEXIÓN (verificación L/360)
    # Deflexión bajo carga de servicio (asumiendo carga uniforme)
    # δ = 5wL⁴/(384EI) para viga simplemente apoyada
    # Estimamos w desde el momento: M = wL²/8 -> w = 8M/L²
    w_service = (8 * M) / (L**2)  # N/mm (momento de servicio ≈ momento último/1.6)
    w_service = w_service / 1.6

    delta_max = (5 * w_service * L**4) / (384 * E * Ix)  # mm
    delta_limit = L / 360  # mm

    # Ratios de utilización
    flexure_ratio = M / Mr
    shear_ratio = V / Vr
    deflection_ratio = delta_max / delta_limit

    return {
        "section": section_name,
        "momentCapacity": round(Mr / 1e6, 2),  # kN·m
        "momentCapacityRatio": round(flexure_ratio, 3),
        "shearCapacity": round(Vr / 1000, 2),  # kN
        "shearCapacityRatio": round(shear_ratio, 3),
        "deflection": round(delta_max, 2),  # mm
        "deflectionLimit": round(delta_limit, 2),  # mm
        "deflectionRatio": round(deflection_ratio, 3),
        "lateralBracingLength": round(Lb_mm if Lb else L, 0),  # mm
        "checkStatus": "OK" if (flexure_ratio <= 1.0 and shear_ratio <= 1.0) else "No cumple",
    }