"""
Servicio de cálculo de elementos de hormigón armado según ACI318.
Implementa diseño de pilares y vigas de hormigón armado.
"""
import math
from typing import Dict, Any


def calculate_concrete_column(
    axial_load: float,
    moment_x: float,
    moment_y: float,
    shear_x: float,
    shear_y: float,
    width: float,
    depth: float,
    length: float,
    fc: float,
    fy: float,
    cover: float = 4.0,
    unsupported_length: float = None,
) -> Dict[str, Any]:
    """
    Diseño de pilar de hormigón armado según ACI318.

    Args:
        axial_load: Carga axial (kN)
        moment_x: Momento flector eje X (kN·m)
        moment_y: Momento flector eje Y (kN·m)
        shear_x: Cortante eje X (kN)
        shear_y: Cortante eje Y (kN)
        width: Ancho de la sección (cm)
        depth: Largo de la sección (cm)
        length: Altura del pilar (m)
        fc: Resistencia del hormigón (MPa)
        fy: Límite de fluencia del acero (MPa)
        cover: Recubrimiento (cm)
        unsupported_length: Longitud sin apoyo lateral (m), si None usa length

    Returns:
        Dict con resultados del diseño
    """
    # Usar longitud no arriostrada si no se especifica
    if unsupported_length is None:
        unsupported_length = length

    # Conversiones de unidades
    P = axial_load * 1000  # kN -> N
    Mx = moment_x * 1e6  # kN·m -> N·mm
    My = moment_y * 1e6  # kN·m -> N·mm
    Vx = shear_x * 1000  # kN -> N
    Vy = shear_y * 1000  # kN -> N
    b = width * 10  # cm -> mm
    h = depth * 10  # cm -> mm
    Lu = unsupported_length * 1000  # m -> mm

    # Área de la sección
    Ag = b * h  # mm²

    # Factor de reducción de resistencia
    phi_compression = 0.65  # Para compresión con estribos
    phi_flexure = 0.90  # Para flexión
    phi_shear = 0.75  # Para corte

    # Esbeltez del pilar
    r = min(b, h) / (2 * math.sqrt(3))  # Radio de giro aproximado para sección rectangular
    slenderness_ratio = Lu / r

    # Verificar si el pilar es esbelto (slenderness > 22)
    is_slender = slenderness_ratio > 22

    # Factor de magnificación de momentos (simplificado)
    if is_slender:
        # Carga crítica de Euler
        E_modulus = 4700 * math.sqrt(fc)  # MPa
        Ig = (b * h**3) / 12  # mm⁴ para momento en X
        EI = 0.4 * E_modulus * Ig  # Rigidez efectiva (ACI318)
        Pc = (math.pi**2 * EI) / (Lu**2)  # N

        # Factor de magnificación
        delta = 1 / (1 - P / (0.75 * Pc))
        delta = max(1.0, min(delta, 2.5))  # Limitar entre 1.0 y 2.5

        # Magnificar momentos
        Mx_design = Mx * delta
        My_design = My * delta
    else:
        Mx_design = Mx
        My_design = My
        delta = 1.0

    # Momento mínimo según ACI318
    e_min = max(15.0 + 0.03 * h, 20.0)  # mm
    M_min = P * e_min  # N·mm
    Mx_design = max(Mx_design, M_min)
    My_design = max(My_design, M_min)

    # Cálculo simplificado de refuerzo longitudinal
    # Excentricidad resultante
    e_total = math.sqrt((Mx_design / P)**2 + (My_design / P)**2) if P > 0 else h / 2

    # Cuantía de refuerzo (estimación basada en carga axial y momento)
    rho_min = 0.01  # 1% mínimo
    rho_max = 0.08  # 8% máximo

    # Estimación de cuantía requerida
    # Basado en la relación P/Ag y excentricidad
    axial_ratio = P / (Ag * fc)
    if axial_ratio < 0.10:
        rho_required = rho_min
    elif axial_ratio > 0.50:
        rho_required = 0.04
    else:
        rho_required = 0.01 + (axial_ratio - 0.10) * 0.075

    # Ajustar por excentricidad
    if e_total > h / 6:
        rho_required = min(rho_required * 1.3, rho_max)

    rho_required = max(rho_min, min(rho_required, rho_max))

    # Área de acero requerida
    As_required = rho_required * Ag  # mm²

    # Número de barras (asumiendo φ20mm como base)
    bar_diameter = 20  # mm
    bar_area = math.pi * (bar_diameter / 2)**2
    num_bars = math.ceil(As_required / bar_area)
    num_bars = max(4, num_bars)  # Mínimo 4 barras

    As_provided = num_bars * bar_area
    rho_provided = As_provided / Ag

    # Capacidad axial nominal (simplificado)
    # P0 = 0.85*fc*(Ag - As) + fy*As
    P0 = 0.85 * fc * (Ag - As_provided) + fy * As_provided  # N

    # Capacidad de diseño a compresión pura
    Pn_max = 0.80 * P0  # Para columnas con estribos
    Pn_design = phi_compression * Pn_max

    # Ratio de utilización
    axial_capacity_ratio = P / Pn_design if Pn_design > 0 else 999

    # Diseño de estribos (corte)
    d = h - cover * 10 - bar_diameter / 2  # Peralte efectivo (mm)

    # Resistencia al corte del hormigón
    Vc_x = 0.17 * math.sqrt(fc) * b * d  # N (ACI318 22.5.5.1)
    Vc_y = 0.17 * math.sqrt(fc) * h * (b - cover * 10)  # N

    # Corte requerido por estribos
    Vs_x_required = max(0, (Vx / phi_shear) - Vc_x)
    Vs_y_required = max(0, (Vy / phi_shear) - Vc_y)
    Vs_required = math.sqrt(Vs_x_required**2 + Vs_y_required**2)

    # Espaciamiento de estribos
    stirrup_diameter = 10  # mm
    stirrup_area = math.pi * (stirrup_diameter / 2)**2
    Av = 2 * stirrup_area  # 2 ramas

    if Vs_required > 0:
        s_required = (Av * fy * d) / Vs_required  # mm
        # Espaciamiento máximo
        s_max = min(d / 2, 600, 16 * bar_diameter, 48 * stirrup_diameter)
        s_provided = min(s_required, s_max)
        s_provided = math.floor(s_provided / 50) * 50  # Redondear a 50mm
        s_provided = max(50, min(s_provided, 300))  # Entre 50 y 300mm
    else:
        s_max = min(d / 2, 600)
        s_provided = min(s_max, 300)

    # Verificación de corte
    shear_capacity_ratio_x = Vx / (phi_shear * (Vc_x + (Av * fy * d) / s_provided)) if s_provided > 0 else 999
    shear_capacity_ratio_y = Vy / (phi_shear * (Vc_y + (Av * fy * d) / s_provided)) if s_provided > 0 else 999

    return {
        "axialCapacity": round(Pn_design / 1000, 2),  # kN
        "axialCapacityRatio": round(axial_capacity_ratio, 3),
        "longitudinalSteel": {
            "numBars": num_bars,
            "barDiameter": bar_diameter,
            "totalArea": round(As_provided, 2),
            "ratio": round(rho_provided, 4),
        },
        "transverseSteel": {
            "diameter": stirrup_diameter,
            "spacing": round(s_provided, 0),
        },
        "shearCapacityRatioX": round(shear_capacity_ratio_x, 3),
        "shearCapacityRatioY": round(shear_capacity_ratio_y, 3),
        "slendernessRatio": round(slenderness_ratio, 2),
        "magnificationFactor": round(delta, 3),
        "isSlender": is_slender,
    }


def calculate_concrete_beam(
    positive_moment: float,
    negative_moment: float,
    max_shear: float,
    width: float,
    height: float,
    span: float,
    fc: float,
    fy: float,
    cover: float = 4.0,
) -> Dict[str, Any]:
    """
    Diseño de viga de hormigón armado según ACI318.

    Args:
        positive_moment: Momento positivo máximo (kN·m)
        negative_moment: Momento negativo máximo (kN·m)
        max_shear: Cortante máximo (kN)
        width: Ancho de la viga (cm)
        height: Altura de la viga (cm)
        span: Luz de la viga (m)
        fc: Resistencia del hormigón (MPa)
        fy: Límite de fluencia del acero (MPa)
        cover: Recubrimiento (cm)

    Returns:
        Dict con resultados del diseño
    """
    # Conversiones
    M_pos = abs(positive_moment) * 1e6  # kN·m -> N·mm
    M_neg = abs(negative_moment) * 1e6  # kN·m -> N·mm
    V = max_shear * 1000  # kN -> N
    b = width * 10  # cm -> mm
    h = height * 10  # cm -> mm
    L = span * 1000  # m -> mm

    # Factores de reducción
    phi_flexure = 0.90
    phi_shear = 0.75

    # Peralte efectivo
    bar_diameter_main = 20  # mm (estimado)
    stirrup_diameter = 10  # mm
    d = h - cover * 10 - stirrup_diameter - bar_diameter_main / 2

    # REFUERZO LONGITUDINAL PARA MOMENTO POSITIVO
    if M_pos > 0:
        # Factor de resistencia
        Ru_pos = M_pos / (phi_flexure * b * d**2)

        # Cuantía requerida
        omega_pos = (0.85 * fc / fy) * (1 - math.sqrt(1 - (2 * Ru_pos) / (0.85 * fc)))
        rho_pos = omega_pos * fc / fy

        # Cuantías límite
        rho_min = max(1.4 / fy, math.sqrt(fc) / (4 * fy))
        beta1 = 0.85 if fc <= 28 else max(0.65, 0.85 - 0.05 * (fc - 28) / 7)
        epsilon_t = 0.005  # Deformación de tensión controlada
        rho_max = 0.85 * beta1 * fc / fy * (0.003 / (0.003 + epsilon_t))

        rho_pos = max(rho_min, min(rho_pos, rho_max))

        # Área de acero
        As_pos = rho_pos * b * d
        num_bars_pos = math.ceil(As_pos / (math.pi * (bar_diameter_main / 2)**2))
        num_bars_pos = max(2, num_bars_pos)
        As_pos_provided = num_bars_pos * math.pi * (bar_diameter_main / 2)**2
    else:
        num_bars_pos = 2  # Mínimo constructivo
        As_pos_provided = num_bars_pos * math.pi * (bar_diameter_main / 2)**2
        rho_pos = As_pos_provided / (b * d)

    # REFUERZO LONGITUDINAL PARA MOMENTO NEGATIVO
    if M_neg > 0:
        Ru_neg = M_neg / (phi_flexure * b * d**2)
        omega_neg = (0.85 * fc / fy) * (1 - math.sqrt(1 - (2 * Ru_neg) / (0.85 * fc)))
        rho_neg = omega_neg * fc / fy

        rho_min = max(1.4 / fy, math.sqrt(fc) / (4 * fy))
        rho_neg = max(rho_min, min(rho_neg, rho_max))

        As_neg = rho_neg * b * d
        num_bars_neg = math.ceil(As_neg / (math.pi * (bar_diameter_main / 2)**2))
        num_bars_neg = max(2, num_bars_neg)
        As_neg_provided = num_bars_neg * math.pi * (bar_diameter_main / 2)**2
    else:
        num_bars_neg = 2  # Mínimo constructivo
        As_neg_provided = num_bars_neg * math.pi * (bar_diameter_main / 2)**2
        rho_neg = As_neg_provided / (b * d)

    # REFUERZO TRANSVERSAL (ESTRIBOS)
    # Resistencia al corte del hormigón
    Vc = 0.17 * math.sqrt(fc) * b * d  # N

    # Corte requerido por estribos
    Vs_required = max(0, (V / phi_shear) - Vc)

    # Área de estribos
    Av = 2 * math.pi * (stirrup_diameter / 2)**2  # 2 ramas

    if Vs_required > 0:
        s_required = (Av * fy * d) / Vs_required
        # Espaciamiento máximo
        if Vs_required > 0.33 * math.sqrt(fc) * b * d:
            s_max = min(d / 4, 300)
        else:
            s_max = min(d / 2, 600)

        s_provided = min(s_required, s_max)
        s_provided = math.floor(s_provided / 50) * 50  # Redondear a 50mm
        s_provided = max(50, min(s_provided, 300))
    else:
        s_provided = min(d / 2, 300)

    # Verificación de capacidad a corte
    Vn = Vc + (Av * fy * d) / s_provided
    shear_capacity_ratio = V / (phi_shear * Vn)

    # DEFLEXIÓN (verificación simplificada)
    # Relación luz/peralte mínima
    support_condition = "continuous"  # Asumiendo viga continua
    if support_condition == "simple":
        ld_min = 16
    elif support_condition == "continuous":
        ld_min = 21
    else:
        ld_min = 18.5

    # Ajuste por cuantía de acero
    rho_avg = (rho_pos + rho_neg) / 2
    ld_actual = L / d

    # Modificación según ACI
    ld_limit = ld_min * (0.4 + fy / 700)
    deflection_check = "OK" if ld_actual <= ld_limit else "Revisar"

    return {
        "positiveReinforcemenet": {
            "numBars": num_bars_pos,
            "barDiameter": bar_diameter_main,
            "totalArea": round(As_pos_provided, 2),
            "ratio": round(rho_pos, 4),
        },
        "negativeReinforcement": {
            "numBars": num_bars_neg,
            "barDiameter": bar_diameter_main,
            "totalArea": round(As_neg_provided, 2),
            "ratio": round(rho_neg, 4),
        },
        "transverseSteel": {
            "diameter": stirrup_diameter,
            "spacing": round(s_provided, 0),
        },
        "shearCapacityRatio": round(shear_capacity_ratio, 3),
        "deflectionCheck": deflection_check,
        "effectiveDepth": round(d, 2),
    }