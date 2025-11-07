"""
Servicio para generar tablas HTML con resúmenes de cálculos estructurales.
Usado para placeholders como {{steelBeamsTable}}, {{concreteColumnsTable}}, etc.
"""


def generate_concrete_columns_table(runs: list[dict]) -> str:
    """
    Genera tabla HTML con todos los pilares de hormigón calculados.

    Args:
        runs: Lista de cálculos del tipo rc_column

    Returns:
        String con tabla HTML formateada
    """
    if not runs:
        return "<p>No se han calculado pilares de hormigón en este proyecto.</p>"

    html = """
    <table style="border-collapse: collapse; width: 100%; font-size: 10pt;">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Dimensiones (cm)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Refuerzo Long.</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Estribos</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Pn (kN)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Ratio</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Estado</th>
            </tr>
        </thead>
        <tbody>
    """

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
        status_color = "#4CAF50" if ratio < 1.0 else "#f44336"

        html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">C-{idx}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{width}×{depth}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{long_str}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{trans_str}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{pn:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{ratio*100:.1f}%</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: {status_color}; font-weight: bold;">{status}</td>
            </tr>
        """

    html += """
        </tbody>
    </table>
    """

    return html


def generate_concrete_beams_table(runs: list[dict]) -> str:
    """Genera tabla HTML con todas las vigas de hormigón calculadas."""
    if not runs:
        return "<p>No se han calculado vigas de hormigón en este proyecto.</p>"

    html = """
    <table style="border-collapse: collapse; width: 100%; font-size: 10pt;">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Dimensiones (cm)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Refuerzo Superior</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Refuerzo Inferior</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Estribos</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Deflexión</th>
            </tr>
        </thead>
        <tbody>
    """

    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        width = inputs.get("width", "—")
        height = inputs.get("height", "—")
        pos_reinf = results.get("positiveReinforcement") or results.get("positiveReinforcemenet", {})
        neg_reinf = results.get("negativeReinforcement", {})
        trans_steel = results.get("transverseSteel", {})
        deflection_check = results.get("deflectionCheck", "—")

        pos_str = f"{pos_reinf.get('numBars', '—')}φ{pos_reinf.get('barDiameter', '—')}"
        neg_str = f"{neg_reinf.get('numBars', '—')}φ{neg_reinf.get('barDiameter', '—')}"
        trans_str = f"φ{trans_steel.get('diameter', '—')}@{trans_steel.get('spacing', '—')}mm"

        html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">V-{idx}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{width}×{height}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{neg_str}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{pos_str}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{trans_str}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{deflection_check}</td>
            </tr>
        """

    html += """
        </tbody>
    </table>
    """

    return html


def generate_steel_columns_table(runs: list[dict]) -> str:
    """Genera tabla HTML con todos los pilares de acero calculados."""
    if not runs:
        return "<p>No se han calculado pilares de acero en este proyecto.</p>"

    html = """
    <table style="border-collapse: collapse; width: 100%; font-size: 10pt;">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Perfil</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Pn (kN)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Mnx (kN·m)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Mny (kN·m)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Ratio Int.</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Estado</th>
            </tr>
        </thead>
        <tbody>
    """

    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        section = results.get("section", inputs.get("profileName", "—"))
        pn = results.get("pn", 0)
        mnx = results.get("mnX", 0)
        mny = results.get("mnY", 0)
        ratio = results.get("interactionRatio", 0)
        passes = results.get("passes", False)

        status = "OK" if passes else "No cumple"
        status_color = "#4CAF50" if passes else "#f44336"

        html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">PC-{idx}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{section}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{pn:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{mnx:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{mny:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{ratio*100:.1f}%</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: {status_color}; font-weight: bold;">{status}</td>
            </tr>
        """

    html += """
        </tbody>
    </table>
    """

    return html


def generate_steel_beams_table(runs: list[dict]) -> str:
    """Genera tabla HTML con todas las vigas de acero calculadas."""
    if not runs:
        return "<p>No se han calculado vigas de acero en este proyecto.</p>"

    html = """
    <table style="border-collapse: collapse; width: 100%; font-size: 10pt;">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Perfil</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Mn (kN·m)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Vn (kN)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Ratio Flexión</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Deflexión (cm)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Estado</th>
            </tr>
        </thead>
        <tbody>
    """

    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        section = results.get("section", inputs.get("profileName", "—"))
        mn = results.get("mn", 0)
        vn = results.get("vn", 0)
        flex_ratio = results.get("flexureRatio", 0)
        deflection = results.get("deflection", 0)
        passes = results.get("passes", False)

        status = "OK" if passes else "No cumple"
        status_color = "#4CAF50" if passes else "#f44336"

        html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">VA-{idx}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{section}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{mn:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{vn:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{flex_ratio*100:.1f}%</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{deflection:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: {status_color}; font-weight: bold;">{status}</td>
            </tr>
        """

    html += """
        </tbody>
    </table>
    """

    return html


def generate_wood_columns_table(runs: list[dict]) -> str:
    """Genera tabla HTML con todos los pilares de madera calculados."""
    if not runs:
        return "<p>No se han calculado pilares de madera en este proyecto.</p>"

    html = """
    <table style="border-collapse: collapse; width: 100%; font-size: 10pt;">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Tipo de Madera</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Sección (cm)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Pn (kN)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Ratio</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Esbeltez</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Estado</th>
            </tr>
        </thead>
        <tbody>
    """

    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        wood_type = results.get("woodType", inputs.get("woodType", "—"))
        width = inputs.get("width", "—")
        depth = inputs.get("depth", "—")
        pn = results.get("pn", 0)
        ratio = results.get("utilizationRatio", 0)
        slenderness = max(results.get("slendernessX", 0), results.get("slendernessY", 0))
        status = results.get("checkStatus", "—")

        status_color = "#4CAF50" if status == "OK" else "#f44336"

        html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">PM-{idx}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{wood_type}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{width}×{depth}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{pn:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{ratio*100:.1f}%</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{slenderness:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: {status_color}; font-weight: bold;">{status}</td>
            </tr>
        """

    html += """
        </tbody>
    </table>
    """

    return html


def generate_wood_beams_table(runs: list[dict]) -> str:
    """Genera tabla HTML con todas las vigas de madera calculadas."""
    if not runs:
        return "<p>No se han calculado vigas de madera en este proyecto.</p>"

    html = """
    <table style="border-collapse: collapse; width: 100%; font-size: 10pt;">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Tipo de Madera</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Sección</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Mn (kN·m)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Vn (kN)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Ratio</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Estado</th>
            </tr>
        </thead>
        <tbody>
    """

    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        wood_type = results.get("woodType", inputs.get("woodType", "—"))
        section = results.get("section", f"{inputs.get('width', '—')}×{inputs.get('height', '—')} cm")
        mn = results.get("mn", 0)
        vn = results.get("vn", 0)
        ratio = results.get("utilizationRatio", 0)
        passes = results.get("passes", False)

        status = "OK" if passes else "No cumple"
        status_color = "#4CAF50" if passes else "#f44336"

        html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">VM-{idx}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{wood_type}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{section}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{mn:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{vn:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{ratio*100:.1f}%</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: {status_color}; font-weight: bold;">{status}</td>
            </tr>
        """

    html += """
        </tbody>
    </table>
    """

    return html


def generate_footings_table(runs: list[dict]) -> str:
    """Genera tabla HTML con todas las zapatas calculadas."""
    if not runs:
        return "<p>No se han calculado zapatas en este proyecto.</p>"

    html = """
    <table style="border-collapse: collapse; width: 100%; font-size: 10pt;">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px;">ID</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Tipo</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Dimensiones (m)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Altura (cm)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Presión Máx (kPa)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Acero (cm²/m)</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Estado</th>
            </tr>
        </thead>
        <tbody>
    """

    for idx, run in enumerate(runs, 1):
        inputs = run.get("input_json", {})
        results = run.get("result_json", {})

        footing_type = "Aislada" if inputs.get("footingType") == "isolated" else "Corrida"
        length = results.get("length", inputs.get("length", 0))
        width = results.get("width", inputs.get("width", 0))
        depth = results.get("depth", inputs.get("footingDepth", 0))
        pressure_max = results.get("soilPressureMax", 0)
        as_long = results.get("asLongitudinal", 0)
        as_trans = results.get("asTransverse", 0)
        passes = results.get("passes", False)

        status = "OK" if passes else "No cumple"
        status_color = "#4CAF50" if passes else "#f44336"

        html += f"""
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Z-{idx}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{footing_type}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{length:.2f}×{width:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{depth:.1f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{pressure_max:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{as_long:.2f} / {as_trans:.2f}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: {status_color}; font-weight: bold;">{status}</td>
            </tr>
        """

    html += """
        </tbody>
    </table>
    """

    return html


def generate_all_tables(project_id: str, runs: list[dict]) -> dict[str, str]:
    """
    Genera todas las tablas para un proyecto, agrupando los cálculos por tipo.

    Args:
        project_id: ID del proyecto
        runs: Lista de todos los cálculos del proyecto

    Returns:
        Dict con los placeholders de tabla y su contenido HTML:
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
