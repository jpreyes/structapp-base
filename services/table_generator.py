"""
Servicio para generar tablas con resúmenes de cálculos estructurales en texto plano formateado.
Usado para placeholders como {{steelBeamsTable}}, {{concreteColumnsTable}}, etc.

Formato de salida:
- Tablas en texto plano con separador " | " entre columnas
- Primera línea: encabezado con nombres de columnas
- Segunda línea: línea separadora con "─" * 80
- Líneas siguientes: filas de datos
"""


def generate_concrete_columns_table(runs: list[dict]) -> str:
    """
    Genera tabla con todos los pilares de hormigón calculados.

    Args:
        runs: Lista de cálculos del tipo rc_column

    Returns:
        String con tabla formateada en texto plano
    """
    if not runs:
        return "No se han calculado pilares de hormigón en este proyecto."

    # Header
    lines = []
    lines.append("ID | Dimensiones (cm) | Refuerzo Long. | Estribos | Pn (kN) | Ratio | Estado")
    lines.append("─" * 80)

    # Rows
    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        # Extraer datos
        width = inputs.get("width", "—")
        depth = inputs.get("depth", "—")
        long_steel = results.get("longitudinalSteel", {})
        trans_steel = results.get("transverseSteel", {})
        pn = results.get("axialCapacity", 0)
        ratio = results.get("axialCapacityRatio", 0)

        # Formatear refuerzo
        long_str = f"{long_steel.get('numBars', '—')}φ{long_steel.get('barDiameter', '—')}"
        trans_str = f"φ{trans_steel.get('diameter', '—')}@{trans_steel.get('spacing', '—')}mm"

        # Determinar estado
        status = "OK" if ratio < 1.0 else "No cumple"

        lines.append(f"C-{idx} | {width}×{depth} | {long_str} | {trans_str} | {pn:.2f} | {ratio*100:.1f}% | {status}")

    return "\n".join(lines)


def generate_concrete_beams_table(runs: list[dict]) -> str:
    """
    Genera tabla con todas las vigas de hormigón calculadas.

    Args:
        runs: Lista de cálculos del tipo rc_beam

    Returns:
        String con tabla formateada en texto plano
    """
    if not runs:
        return "No se han calculado vigas de hormigón en este proyecto."

    # Header
    lines = []
    lines.append("ID | Dimensiones (cm) | Refuerzo Superior | Refuerzo Inferior | Estribos | Deflexión")
    lines.append("─" * 80)

    # Rows
    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        # Extraer datos
        width = inputs.get("width", "—")
        height = inputs.get("height", "—")
        pos_reinf = results.get("positiveReinforcement") or results.get("positiveReinforcemenet", {})
        neg_reinf = results.get("negativeReinforcement", {})
        trans_steel = results.get("transverseSteel", {})
        deflection_check = results.get("deflectionCheck", "—")

        # Formatear refuerzo
        pos_str = f"{pos_reinf.get('numBars', '—')}φ{pos_reinf.get('barDiameter', '—')}"
        neg_str = f"{neg_reinf.get('numBars', '—')}φ{neg_reinf.get('barDiameter', '—')}"
        trans_str = f"φ{trans_steel.get('diameter', '—')}@{trans_steel.get('spacing', '—')}mm"

        lines.append(f"V-{idx} | {width}×{height} | {neg_str} | {pos_str} | {trans_str} | {deflection_check}")

    return "\n".join(lines)


def generate_steel_columns_table(runs: list[dict]) -> str:
    """
    Genera tabla con todos los pilares de acero calculados.

    Args:
        runs: Lista de cálculos del tipo steel_column

    Returns:
        String con tabla formateada en texto plano
    """
    if not runs:
        return "No se han calculado pilares de acero en este proyecto."

    # Header
    lines = []
    lines.append("ID | Perfil | Pn (kN) | Mnx (kN·m) | Mny (kN·m) | Ratio Int. | Estado")
    lines.append("─" * 80)

    # Rows
    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        # Extraer datos
        section = results.get("section", inputs.get("profileName", "—"))
        pn = results.get("pn", 0)
        mnx = results.get("mnX", 0)
        mny = results.get("mnY", 0)
        ratio = results.get("interactionRatio", 0)
        passes = results.get("passes", False)

        # Determinar estado
        status = "OK" if passes else "No cumple"

        lines.append(f"PC-{idx} | {section} | {pn:.2f} | {mnx:.2f} | {mny:.2f} | {ratio*100:.1f}% | {status}")

    return "\n".join(lines)


def generate_steel_beams_table(runs: list[dict]) -> str:
    """
    Genera tabla con todas las vigas de acero calculadas.

    Args:
        runs: Lista de cálculos del tipo steel_beam

    Returns:
        String con tabla formateada en texto plano
    """
    if not runs:
        return "No se han calculado vigas de acero en este proyecto."

    # Header
    lines = []
    lines.append("ID | Perfil | Mn (kN·m) | Vn (kN) | Ratio Flexión | Deflexión (cm) | Estado")
    lines.append("─" * 80)

    # Rows
    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        # Extraer datos
        section = results.get("section", inputs.get("profileName", "—"))
        mn = results.get("mn", 0)
        vn = results.get("vn", 0)
        flex_ratio = results.get("flexureRatio", 0)
        deflection = results.get("deflection", 0)
        passes = results.get("passes", False)

        # Determinar estado
        status = "OK" if passes else "No cumple"

        lines.append(f"VA-{idx} | {section} | {mn:.2f} | {vn:.2f} | {flex_ratio*100:.1f}% | {deflection:.2f} | {status}")

    return "\n".join(lines)


def generate_wood_columns_table(runs: list[dict]) -> str:
    """
    Genera tabla con todos los pilares de madera calculados.

    Args:
        runs: Lista de cálculos del tipo wood_column

    Returns:
        String con tabla formateada en texto plano
    """
    if not runs:
        return "No se han calculado pilares de madera en este proyecto."

    # Header
    lines = []
    lines.append("ID | Tipo de Madera | Sección (cm) | Pn (kN) | Ratio | Esbeltez | Estado")
    lines.append("─" * 80)

    # Rows
    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        # Extraer datos
        wood_type = results.get("woodType", inputs.get("woodType", "—"))
        width = inputs.get("width", "—")
        depth = inputs.get("depth", "—")
        pn = results.get("pn", 0)
        ratio = results.get("utilizationRatio", 0)
        slenderness = max(results.get("slendernessX", 0), results.get("slendernessY", 0))
        status = results.get("checkStatus", "—")

        lines.append(f"PM-{idx} | {wood_type} | {width}×{depth} | {pn:.2f} | {ratio*100:.1f}% | {slenderness:.2f} | {status}")

    return "\n".join(lines)


def generate_wood_beams_table(runs: list[dict]) -> str:
    """
    Genera tabla con todas las vigas de madera calculadas.

    Args:
        runs: Lista de cálculos del tipo wood_beam

    Returns:
        String con tabla formateada en texto plano
    """
    if not runs:
        return "No se han calculado vigas de madera en este proyecto."

    # Header
    lines = []
    lines.append("ID | Tipo de Madera | Sección | Mn (kN·m) | Vn (kN) | Ratio | Estado")
    lines.append("─" * 80)

    # Rows
    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        # Extraer datos
        wood_type = results.get("woodType", inputs.get("woodType", "—"))
        section = results.get("section", f"{inputs.get('width', '—')}×{inputs.get('height', '—')} cm")
        mn = results.get("mn", 0)
        vn = results.get("vn", 0)
        ratio = results.get("utilizationRatio", 0)
        passes = results.get("passes", False)

        # Determinar estado
        status = "OK" if passes else "No cumple"

        lines.append(f"VM-{idx} | {wood_type} | {section} | {mn:.2f} | {vn:.2f} | {ratio*100:.1f}% | {status}")

    return "\n".join(lines)


def generate_footings_table(runs: list[dict]) -> str:
    """
    Genera tabla con todas las zapatas calculadas.

    Args:
        runs: Lista de cálculos del tipo footing

    Returns:
        String con tabla formateada en texto plano
    """
    if not runs:
        return "No se han calculado zapatas en este proyecto."

    # Header
    lines = []
    lines.append("ID | Tipo | Dimensiones (m) | Altura (cm) | Presión Máx (kPa) | Acero (cm²/m) | Estado")
    lines.append("─" * 80)

    # Rows
    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        # Extraer datos
        footing_type = "Aislada" if inputs.get("footingType") == "isolated" else "Corrida"
        length = results.get("length", inputs.get("length", 0))
        width = results.get("width", inputs.get("width", 0))
        depth = results.get("depth", inputs.get("footingDepth", 0))
        pressure_max = results.get("soilPressureMax", 0)
        as_long = results.get("asLongitudinal", 0)
        as_trans = results.get("asTransverse", 0)
        passes = results.get("passes", False)

        # Determinar estado
        status = "OK" if passes else "No cumple"

        lines.append(f"Z-{idx} | {footing_type} | {length:.2f}×{width:.2f} | {depth:.1f} | {pressure_max:.2f} | {as_long:.2f} / {as_trans:.2f} | {status}")

    return "\n".join(lines)


def generate_all_tables(project_id: str, runs: list[dict]) -> dict[str, str]:
    """
    Genera todas las tablas para un proyecto, agrupando los cálculos por tipo.

    Args:
        project_id: ID del proyecto
        runs: Lista de todos los cálculos del proyecto

    Returns:
        Dict con los placeholders de tabla y su contenido en texto plano:
        {
            "concreteColumnsTable": "...",
            "concreteBeamsTable": "...",
            "steelColumnsTable": "...",
            ...
        }
    """
    # Agrupar cálculos por tipo
    grouped = {}
    for run in runs:
        element_type = run.get("element_type")
        if element_type not in grouped:
            grouped[element_type] = []
        grouped[element_type].append(run)

    # Ordenar cada grupo por fecha (más reciente primero)
    for element_type in grouped:
        grouped[element_type].sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Generar tablas
    tables = {
        "concreteColumnsTable": generate_concrete_columns_table(grouped.get("rc_column", [])),
        "concreteBeamsTable": generate_concrete_beams_table(grouped.get("rc_beam", [])),
        "steelColumnsTable": generate_steel_columns_table(grouped.get("steel_column", [])),
        "steelBeamsTable": generate_steel_beams_table(grouped.get("steel_beam", [])),
        "woodColumnsTable": generate_wood_columns_table(grouped.get("wood_column", [])),
        "woodBeamsTable": generate_wood_beams_table(grouped.get("wood_beam", [])),
        "footingsTable": generate_footings_table(grouped.get("footing", [])),
    }

    return tables
