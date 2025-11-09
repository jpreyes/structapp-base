"""
Servicio de cálculo de zapatas de hormigón armado según ACI318.
Implementa diseño de zapatas aisladas y corridas.
"""
import math
from typing import Dict, Any


def calculate_footing(
    axial_load: float,
    moment: float,
    shear: float,
    column_width: float,
    column_depth: float,
    soil_bearing_capacity: float,
    fc: float,
    fy: float,
    footing_type: str = "isolated",
    static_pressure: float = 0.0,
    dynamic_pressure: float = 0.0,
    seismic_pressure: float = 0.0,
    footing_depth: float = 60.0,
    cover: float = 7.5,
) -> Dict[str, Any]:
    """
    Diseño de zapata de hormigón armado según ACI318.

    Args:
        axial_load: Carga axial de servicio (kN)
        moment: Momento de servicio (kN·m)
        shear: Cortante de servicio (kN)
        column_width: Ancho de columna (cm)
        column_depth: Profundidad de columna (cm)
        soil_bearing_capacity: Capacidad portante del suelo (kPa)
        fc: Resistencia del hormigón (MPa)
        fy: Límite de fluencia del acero (MPa)
        footing_type: Tipo de zapata ("isolated" o "continuous")
        static_pressure: Empuje estático del suelo (kPa)
        dynamic_pressure: Empuje dinámico del suelo (kPa)
        seismic_pressure: Empuje sísmico del suelo (kPa)
        footing_depth: Altura de la zapata (cm)
        cover: Recubrimiento (cm)

    Returns:
        Dict con resultados del diseño
    """
    # Conversiones
    P = axial_load  # kN (carga de servicio)
    M = moment  # kN·m
    V_applied = shear  # kN
    c1 = column_width * 10  # cm -> mm
    c2 = column_depth * 10  # cm -> mm
    qa = soil_bearing_capacity  # kPa
    h = footing_depth * 10  # cm -> mm
    d = h - cover * 10 - 10  # Peralte efectivo (mm), asumiendo φ20mm

    # Factor de carga (LRFD)
    load_factor = 1.6  # Para diseño
    Pu = P * load_factor  # kN
    Mu = M * load_factor  # kN·m

    # DIMENSIONAMIENTO EN PLANTA
    if footing_type == "isolated":
        # Zapata aislada cuadrada
        # Área requerida considerando momento (excentricidad)
        e = M / P if P > 0 else 0  # m (excentricidad)

        # Para distribución trapezoidal: q = P/A ± M*y/I
        # Simplificado: requerimos A tal que q_max <= qa
        # Para zapata cuadrada: A = B²
        # Con excentricidad: q_max = P/A * (1 + 6e/B)

        # Iteración para encontrar B
        B_required = math.sqrt(P / qa)  # Estimación inicial sin momento

        for _ in range(10):  # Iteraciones
            A = B_required ** 2
            q_max = (P / A) * (1 + 6 * e / B_required) if B_required > 0 else 999
            if q_max <= qa:
                break
            B_required *= 1.1  # Incrementar 10%

        # Redondear hacia arriba a múltiplos de 5cm
        B = math.ceil(B_required * 20) / 20  # m, múltiplos de 5cm
        L = B  # Zapata cuadrada

        A_footing = B * L  # m²

    else:  # continuous
        # Zapata corrida
        # Ancho requerido por carga axial
        # Asumiendo carga lineal por metro
        L = 1.0  # m (por metro lineal)

        # Considerar excentricidad
        e = M / P if P > 0 else 0  # m

        # Ancho requerido
        B_required = P / (qa * L) if qa > 0 else 1.0

        # Ajustar por excentricidad
        if e > 0:
            B_required = B_required * (1 + 6 * e / B_required)

        # Redondear hacia arriba
        B = math.ceil(B_required * 20) / 20  # m

        A_footing = B * L  # m²/m

    # VERIFICACIÓN DE PRESIONES EN EL SUELO
    # Presión actuante (servicio)
    q_service = P / A_footing  # kPa

    # Presión por excentricidad
    if footing_type == "isolated":
        # Zapata cuadrada: I = B*L³/12, y_max = L/2
        I = B * L**3 / 12
        y_max = L / 2
        q_moment = (M * y_max) / I if I > 0 else 0  # kPa
    else:
        # Zapata corrida: por metro lineal
        I = L * B**3 / 12
        y_max = B / 2
        q_moment = (M * y_max) / I if I > 0 else 0  # kPa

    q_max = q_service + q_moment  # kPa
    q_min = q_service - q_moment  # kPa

    # Asegurar que no hay levantamiento
    if q_min < 0:
        q_min = 0
        # Redistribuir presión
        # El área efectiva se reduce

    soil_pressure_ratio = q_max / qa if qa > 0 else 999

    # PRESIONES DE DISEÑO (FACTORIZADAS)
    qu_max = q_max * load_factor  # kPa

    # DISEÑO A FLEXIÓN
    # Momento crítico en la cara de la columna
    if footing_type == "isolated":
        # Distancia desde borde a cara de columna
        cantilever = (B - c1/1000) / 2  # m
        # Momento último por flexión
        Mu_design = qu_max * B * cantilever**2 / 2  # kN·m/m
        width_design = B * 1000  # mm (ancho efectivo)
    else:
        # Zapata corrida
        cantilever = (B - c1/1000) / 2  # m
        Mu_design = qu_max * 1.0 * cantilever**2 / 2  # kN·m/m
        width_design = 1000  # mm (por metro)

    # Convertir momento a N·mm
    Mu_design_nmm = Mu_design * 1e6  # N·mm

    # Factor de reducción
    phi = 0.90

    # Diseño de refuerzo
    Ru = Mu_design_nmm / (phi * width_design * d**2)

    # Cuantía requerida
    omega = (0.85 * fc / fy) * (1 - math.sqrt(1 - (2 * Ru) / (0.85 * fc)))
    rho = omega * fc / fy

    # Cuantías límite
    rho_min = max(1.4 / fy, 0.0018)  # ACI318 para losas
    rho = max(rho, rho_min)

    # Área de acero requerida
    As_required = rho * width_design * d  # mm²/m

    # Espaciamiento de barras (asumiendo φ16mm)
    bar_diameter = 16  # mm
    bar_area = math.pi * (bar_diameter / 2)**2  # mm²

    spacing = (bar_area * width_design) / As_required if As_required > 0 else 300
    spacing = min(spacing, 300)  # Máximo 300mm
    spacing = max(spacing, 150)  # Mínimo 150mm
    spacing = math.floor(spacing / 50) * 50  # Redondear a 50mm

    # Refuerzo en ambas direcciones para zapata aislada
    if footing_type == "isolated":
        reinforcement_x = {
            "barDiameter": bar_diameter,
            "spacing": spacing,
            "direction": "X (longitudinal)",
        }
        reinforcement_y = {
            "barDiameter": bar_diameter,
            "spacing": spacing,
            "direction": "Y (transversal)",
        }
    else:
        reinforcement_main = {
            "barDiameter": bar_diameter,
            "spacing": spacing,
            "direction": "Principal (transversal)",
        }
        # Refuerzo de repartición (20% del principal)
        spacing_dist = min(300, spacing * 5)
        reinforcement_distribution = {
            "barDiameter": 12,
            "spacing": spacing_dist,
            "direction": "Repartición (longitudinal)",
        }

    # VERIFICACIÓN AL PUNZONAMIENTO
    # Perímetro crítico a d/2 de la cara de la columna
    bo = 2 * (c1 + d) + 2 * (c2 + d)  # mm

    # Área efectiva en punzonamiento
    Av_punch = A_footing - ((c1 + d) * (c2 + d)) / 1e6  # m²

    # Fuerza de punzonamiento
    Vu_punch = qu_max * Av_punch  # kN
    Vu_punch_N = Vu_punch * 1000  # N

    # Resistencia al punzonamiento (ACI318 22.6.5)
    phi_v = 0.75

    # La menor de:
    vc1 = 0.33 * math.sqrt(fc) * bo * d  # N
    vc2 = (0.17 * (1 + 2 / 1) * math.sqrt(fc)) * bo * d  # N (asumiendo β=1 para columna cuadrada)
    vc3 = (0.083 * (2 + 4/1) * math.sqrt(fc)) * bo * d  # N

    Vc = min(vc1, vc2, vc3)
    Vn_punch = phi_v * Vc

    punching_ratio = Vu_punch_N / Vn_punch if Vn_punch > 0 else 999

    # VERIFICACIÓN AL CORTE POR FLEXIÓN
    # Corte crítico a distancia d de la cara de la columna
    d_m = d / 1000  # mm -> m

    if footing_type == "isolated":
        shear_critical_distance = (B - c1/1000) / 2 - d_m  # m
        Vu_shear = qu_max * B * shear_critical_distance  # kN
    else:
        shear_critical_distance = (B - c1/1000) / 2 - d_m  # m
        Vu_shear = qu_max * 1.0 * shear_critical_distance  # kN

    Vu_shear_N = Vu_shear * 1000  # N

    # Resistencia al corte (ACI318)
    if footing_type == "isolated":
        width_shear = B * 1000  # mm
    else:
        width_shear = 1000  # mm

    Vc_shear = 0.17 * math.sqrt(fc) * width_shear * d  # N
    Vn_shear = phi_v * Vc_shear

    shear_ratio = Vu_shear_N / Vn_shear if Vn_shear > 0 else 999

    # Determinar si cumple todos los criterios
    passes = (soil_pressure_ratio <= 1.0 and punching_ratio <= 1.0 and shear_ratio <= 1.0)

    # Calcular acero en cm²/m para el schema
    as_longitudinal = (As_required / 10000)  # mm²/m -> cm²/m
    as_transverse = as_longitudinal  # Para zapata aislada, igual en ambas direcciones

    # Resultados según FootingResponse schema
    result = {
        "length": round(L, 3),  # m
        "width": round(B, 3),  # m
        "depth": round(h / 10, 1),  # cm
        "soilPressureMax": round(q_max, 2),  # kPa
        "soilPressureMin": round(q_min, 2),  # kPa
        "asLongitudinal": round(as_longitudinal, 2),  # cm²/m
        "asTransverse": round(as_transverse, 2),  # cm²/m
        "barDiameter": float(bar_diameter),  # mm
        "spacing": float(spacing / 10),  # mm -> cm
        "punchingShearRatio": round(punching_ratio, 3),
        "beamShearRatio": round(shear_ratio, 3),
        "passes": passes,
    }

    return result