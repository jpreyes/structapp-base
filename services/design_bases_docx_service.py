"""
Servicio para generar documentos Word (DOCX) a partir de plantillas con sistema de placeholders.
Soporta placeholders en formato {{variable}} que se reemplazan automáticamente con los datos.
"""
import io
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
import matplotlib
matplotlib.use('Agg')  # Backend sin interfaz gráfica
import matplotlib.pyplot as plt

TEMPLATE_PATH = Path(__file__).parent.parent / "mc-tipo.docx"


def _get_nested_value(data: Dict[str, Any], path: str) -> Optional[Any]:
    """
    Obtiene un valor anidado de un diccionario usando notación de puntos.

    Ejemplo: _get_nested_value(data, "seismic.result.Qbasx")
    retorna data["seismic"]["result"]["Qbasx"]
    """
    keys = path.split(".")
    value = data

    for key in keys:
        if isinstance(value, dict):
            value = value.get(key)
            if value is None:
                return None
        else:
            return None

    return value


def _format_value(value: Any, decimal_places: int = 2) -> str:
    """Formatea un valor para mostrar en el documento."""
    if value is None:
        return ""

    if isinstance(value, (int, float)):
        return f"{value:.{decimal_places}f}"

    return str(value)


def _build_context(data: Dict[str, Any], project_name: str) -> Dict[str, Any]:
    """
    Construye el contexto con todas las variables disponibles para reemplazo.
    Este es el diccionario completo de placeholders disponibles.
    """
    context = {
        # Información del proyecto
        "projectName": project_name,
        "currentDate": datetime.now().strftime("%d de %B de %Y"),

        # Descripción del edificio (si existe)
        "buildingDescription": data.get("buildingDescription", {}).get("text", ""),
        "buildingLocation": data.get("buildingDescription", {}).get("location", ""),
        "buildingArea": data.get("buildingDescription", {}).get("area", ""),
        "buildingHeight": data.get("buildingDescription", {}).get("height", ""),
    }

    # CARGAS VIVAS
    if "liveLoad" in data and data["liveLoad"]:
        ll = data["liveLoad"]
        context.update({
            "liveLoad.buildingType": ll.get("buildingType", ""),
            "liveLoad.usage": ll.get("usage", ""),
            "liveLoad.uniformLoad": _format_value(ll.get("uniformLoad")),
            "liveLoad.uniformLoadRaw": ll.get("uniformLoadRaw", ""),
            "liveLoad.concentratedLoad": _format_value(ll.get("concentratedLoad")),
            "liveLoad.concentratedLoadRaw": ll.get("concentratedLoadRaw", ""),
        })

    # REDUCCIÓN DE CARGAS VIVAS
    if "reduction" in data and data["reduction"]:
        red = data["reduction"]
        context.update({
            "reduction.elementType": red.get("elementType", ""),
            "reduction.tributaryArea": _format_value(red.get("tributaryArea")),
            "reduction.baseLoad": _format_value(red.get("baseLoad")),
            "reduction.reducedLoad": _format_value(red.get("reducedLoad")),
        })

    # VIENTO
    if "wind" in data and data["wind"]:
        wind = data["wind"]
        context.update({
            "wind.environment": wind.get("environment", ""),
            "wind.height": _format_value(wind.get("height")),
            "wind.q": _format_value(wind.get("q")),
            "wind.message": wind.get("message", ""),
        })

    # NIEVE
    if "snow" in data and data["snow"]:
        snow = data["snow"]
        context.update({
            "snow.latitudeBand": snow.get("latitudeBand", ""),
            "snow.altitudeBand": snow.get("altitudeBand", ""),
            "snow.thermalCondition": snow.get("thermalCondition", ""),
            "snow.importanceCategory": snow.get("importanceCategory", ""),
            "snow.exposureCategory": snow.get("exposureCategory", ""),
            "snow.exposureCondition": snow.get("exposureCondition", ""),
            "snow.surfaceType": snow.get("surfaceType", ""),
            "snow.roofPitch": _format_value(snow.get("roofPitch")),
            "snow.pg": _format_value(snow.get("pg"), 3),
            "snow.ct": _format_value(snow.get("ct"), 3),
            "snow.ce": _format_value(snow.get("ce"), 3),
            "snow.I": _format_value(snow.get("I"), 3),
            "snow.cs": _format_value(snow.get("cs"), 3),
            "snow.pf": _format_value(snow.get("pf"), 3),
        })

    # SISMO
    if "seismic" in data and data["seismic"]:
        params = data["seismic"].get("params", {})
        result = data["seismic"].get("result", {})

        context.update({
            # Parámetros de entrada
            "seismic.params.category": params.get("category", ""),
            "seismic.params.zone": params.get("zone", ""),
            "seismic.params.soil": params.get("soil", ""),
            "seismic.params.rs": _format_value(params.get("rs")),
            "seismic.params.ps": _format_value(params.get("ps")),
            "seismic.params.tx": _format_value(params.get("tx"), 3),
            "seismic.params.ty": _format_value(params.get("ty"), 3),
            "seismic.params.r0": _format_value(params.get("r0")),

            # Resultados
            "seismic.result.intensityFactor": _format_value(result.get("intensityFactor"), 3),
            "seismic.result.zoneFactor": _format_value(result.get("zoneFactor"), 3),
            "seismic.result.CMax": _format_value(result.get("CMax", result.get("C_max")), 3),
            "seismic.result.CMin": _format_value(result.get("CMin", result.get("C_min")), 3),
            "seismic.result.Q0x": _format_value(result.get("Q0x")),
            "seismic.result.Q0y": _format_value(result.get("Q0y")),
            "seismic.result.Q0Min": _format_value(result.get("Q0Min", result.get("Q0_min"))),
            "seismic.result.Q0Max": _format_value(result.get("Q0Max", result.get("Q0_max"))),
            "seismic.result.Qbasx": _format_value(result.get("Qbasx")),
            "seismic.result.Qbasy": _format_value(result.get("Qbasy")),
        })

    # CÁLCULOS ESTRUCTURALES
    if "structural" in data and data["structural"]:
        struct = data["structural"]

        # Pilar de Hormigón Armado
        if "concreteColumn" in struct and struct["concreteColumn"]:
            cc = struct["concreteColumn"]
            context.update({
                "concrete.column.axialCapacity": _format_value(cc.get("axialCapacity")),
                "concrete.column.axialCapacityRatio": _format_value(cc.get("axialCapacityRatio"), 3),
                "concrete.column.longitudinalSteel.numBars": str(cc.get("longitudinalSteel", {}).get("numBars", "")),
                "concrete.column.longitudinalSteel.barDiameter": str(cc.get("longitudinalSteel", {}).get("barDiameter", "")),
                "concrete.column.longitudinalSteel.totalArea": _format_value(cc.get("longitudinalSteel", {}).get("totalArea")),
                "concrete.column.longitudinalSteel.ratio": _format_value(cc.get("longitudinalSteel", {}).get("ratio"), 4),
                "concrete.column.transverseSteel.diameter": str(cc.get("transverseSteel", {}).get("diameter", "")),
                "concrete.column.transverseSteel.spacing": _format_value(cc.get("transverseSteel", {}).get("spacing"), 0),
                "concrete.column.shearCapacityRatioX": _format_value(cc.get("shearCapacityRatioX"), 3),
                "concrete.column.shearCapacityRatioY": _format_value(cc.get("shearCapacityRatioY"), 3),
                "concrete.column.slendernessRatio": _format_value(cc.get("slendernessRatio")),
                "concrete.column.magnificationFactor": _format_value(cc.get("magnificationFactor"), 3),
                "concrete.column.isSlender": str(cc.get("isSlender", "")),
            })

        # Viga de Hormigón Armado
        if "concreteBeam" in struct and struct["concreteBeam"]:
            cb = struct["concreteBeam"]
            context.update({
                "concrete.beam.positiveReinforcement.numBars": str(cb.get("positiveReinforcement", {}).get("numBars", "")),
                "concrete.beam.positiveReinforcement.barDiameter": str(cb.get("positiveReinforcement", {}).get("barDiameter", "")),
                "concrete.beam.positiveReinforcement.totalArea": _format_value(cb.get("positiveReinforcement", {}).get("totalArea")),
                "concrete.beam.positiveReinforcement.ratio": _format_value(cb.get("positiveReinforcement", {}).get("ratio"), 4),
                "concrete.beam.negativeReinforcement.numBars": str(cb.get("negativeReinforcement", {}).get("numBars", "")),
                "concrete.beam.negativeReinforcement.barDiameter": str(cb.get("negativeReinforcement", {}).get("barDiameter", "")),
                "concrete.beam.negativeReinforcement.totalArea": _format_value(cb.get("negativeReinforcement", {}).get("totalArea")),
                "concrete.beam.negativeReinforcement.ratio": _format_value(cb.get("negativeReinforcement", {}).get("ratio"), 4),
                "concrete.beam.transverseSteel.diameter": str(cb.get("transverseSteel", {}).get("diameter", "")),
                "concrete.beam.transverseSteel.spacing": _format_value(cb.get("transverseSteel", {}).get("spacing"), 0),
                "concrete.beam.shearCapacityRatio": _format_value(cb.get("shearCapacityRatio"), 3),
                "concrete.beam.deflectionCheck": cb.get("deflectionCheck", ""),
                "concrete.beam.effectiveDepth": _format_value(cb.get("effectiveDepth")),
            })

        # Pilar de Acero
        if "steelColumn" in struct and struct["steelColumn"]:
            sc = struct["steelColumn"]
            context.update({
                "steel.column.section": sc.get("section", ""),
                "steel.column.axialCapacity": _format_value(sc.get("axialCapacity")),
                "steel.column.axialCapacityRatio": _format_value(sc.get("axialCapacityRatio"), 3),
                "steel.column.momentCapacityX": _format_value(sc.get("momentCapacityX")),
                "steel.column.momentCapacityY": _format_value(sc.get("momentCapacityY")),
                "steel.column.momentCapacityRatioX": _format_value(sc.get("momentCapacityRatioX"), 3),
                "steel.column.momentCapacityRatioY": _format_value(sc.get("momentCapacityRatioY"), 3),
                "steel.column.slendernessX": _format_value(sc.get("slendernessX")),
                "steel.column.slendernessY": _format_value(sc.get("slendernessY")),
                "steel.column.slendernessMax": _format_value(sc.get("slendernessMax")),
                "steel.column.interactionRatio": _format_value(sc.get("interactionRatio"), 3),
                "steel.column.checkStatus": sc.get("checkStatus", ""),
            })

        # Viga de Acero
        if "steelBeam" in struct and struct["steelBeam"]:
            sb = struct["steelBeam"]
            context.update({
                "steel.beam.section": sb.get("section", ""),
                "steel.beam.momentCapacity": _format_value(sb.get("momentCapacity")),
                "steel.beam.momentCapacityRatio": _format_value(sb.get("momentCapacityRatio"), 3),
                "steel.beam.shearCapacity": _format_value(sb.get("shearCapacity")),
                "steel.beam.shearCapacityRatio": _format_value(sb.get("shearCapacityRatio"), 3),
                "steel.beam.deflection": _format_value(sb.get("deflection")),
                "steel.beam.deflectionLimit": _format_value(sb.get("deflectionLimit")),
                "steel.beam.deflectionRatio": _format_value(sb.get("deflectionRatio"), 3),
                "steel.beam.lateralBracingLength": _format_value(sb.get("lateralBracingLength"), 0),
                "steel.beam.checkStatus": sb.get("checkStatus", ""),
            })

        # Pilar de Madera
        if "woodColumn" in struct and struct["woodColumn"]:
            wc = struct["woodColumn"]
            context.update({
                "wood.column.woodType": wc.get("woodType", ""),
                "wood.column.area": _format_value(wc.get("area")),
                "wood.column.axialCapacity": _format_value(wc.get("axialCapacity")),
                "wood.column.axialCapacityRatio": _format_value(wc.get("axialCapacityRatio"), 3),
                "wood.column.slendernessX": _format_value(wc.get("slendernessX")),
                "wood.column.slendernessY": _format_value(wc.get("slendernessY")),
                "wood.column.slendernessMax": _format_value(wc.get("slendernessMax")),
                "wood.column.stabilityFactor": _format_value(wc.get("stabilityFactor"), 3),
                "wood.column.isSlender": str(wc.get("isSlender", "")),
                "wood.column.allowableStress": _format_value(wc.get("allowableStress")),
                "wood.column.checkStatus": wc.get("checkStatus", ""),
            })

        # Viga de Madera
        if "woodBeam" in struct and struct["woodBeam"]:
            wb = struct["woodBeam"]
            context.update({
                "wood.beam.woodType": wb.get("woodType", ""),
                "wood.beam.area": _format_value(wb.get("area")),
                "wood.beam.sectionModulus": _format_value(wb.get("sectionModulus")),
                "wood.beam.momentOfInertia": _format_value(wb.get("momentOfInertia")),
                "wood.beam.flexureStress": _format_value(wb.get("flexureStress")),
                "wood.beam.allowableFlexureStress": _format_value(wb.get("allowableFlexureStress")),
                "wood.beam.flexureRatio": _format_value(wb.get("flexureRatio"), 3),
                "wood.beam.shearStress": _format_value(wb.get("shearStress")),
                "wood.beam.allowableShearStress": _format_value(wb.get("allowableShearStress")),
                "wood.beam.shearRatio": _format_value(wb.get("shearRatio"), 3),
                "wood.beam.deflection": _format_value(wb.get("deflection")),
                "wood.beam.deflectionLimit": _format_value(wb.get("deflectionLimit")),
                "wood.beam.deflectionRatio": _format_value(wb.get("deflectionRatio"), 3),
                "wood.beam.lateralStabilityFactor": _format_value(wb.get("lateralStabilityFactor"), 3),
                "wood.beam.checkStatus": wb.get("checkStatus", ""),
            })

        # Zapata
        if "footing" in struct and struct["footing"]:
            ft = struct["footing"]
            context.update({
                "footing.footingType": ft.get("footingType", ""),
                "footing.dimensions.length": _format_value(ft.get("dimensions", {}).get("length"), 1),
                "footing.dimensions.width": _format_value(ft.get("dimensions", {}).get("width"), 1),
                "footing.dimensions.depth": _format_value(ft.get("dimensions", {}).get("depth"), 1),
                "footing.dimensions.area": _format_value(ft.get("dimensions", {}).get("area"), 3),
                "footing.soilPressures.max": _format_value(ft.get("soilPressures", {}).get("max")),
                "footing.soilPressures.min": _format_value(ft.get("soilPressures", {}).get("min")),
                "footing.soilPressures.average": _format_value(ft.get("soilPressures", {}).get("average")),
                "footing.soilPressures.ratio": _format_value(ft.get("soilPressures", {}).get("ratio"), 3),
                "footing.lateralPressures.static": _format_value(ft.get("lateralPressures", {}).get("static")),
                "footing.lateralPressures.dynamic": _format_value(ft.get("lateralPressures", {}).get("dynamic")),
                "footing.lateralPressures.seismic": _format_value(ft.get("lateralPressures", {}).get("seismic")),
                "footing.lateralPressures.total": _format_value(ft.get("lateralPressures", {}).get("total")),
                "footing.punchingShear.appliedForce": _format_value(ft.get("punchingShear", {}).get("appliedForce")),
                "footing.punchingShear.capacity": _format_value(ft.get("punchingShear", {}).get("capacity")),
                "footing.punchingShear.ratio": _format_value(ft.get("punchingShear", {}).get("ratio"), 3),
                "footing.punchingShear.criticalPerimeter": _format_value(ft.get("punchingShear", {}).get("criticalPerimeter"), 0),
                "footing.flexuralShear.appliedForce": _format_value(ft.get("flexuralShear", {}).get("appliedForce")),
                "footing.flexuralShear.capacity": _format_value(ft.get("flexuralShear", {}).get("capacity")),
                "footing.flexuralShear.ratio": _format_value(ft.get("flexuralShear", {}).get("ratio"), 3),
                "footing.checkStatus": ft.get("checkStatus", ""),
            })

            # Refuerzo (varía según el tipo)
            reinforcement = ft.get("reinforcement", {})
            if "xDirection" in reinforcement:  # Zapata aislada
                context.update({
                    "footing.reinforcement.xDirection.barDiameter": str(reinforcement.get("xDirection", {}).get("barDiameter", "")),
                    "footing.reinforcement.xDirection.spacing": _format_value(reinforcement.get("xDirection", {}).get("spacing"), 0),
                    "footing.reinforcement.yDirection.barDiameter": str(reinforcement.get("yDirection", {}).get("barDiameter", "")),
                    "footing.reinforcement.yDirection.spacing": _format_value(reinforcement.get("yDirection", {}).get("spacing"), 0),
                })
            elif "main" in reinforcement:  # Zapata corrida
                context.update({
                    "footing.reinforcement.main.barDiameter": str(reinforcement.get("main", {}).get("barDiameter", "")),
                    "footing.reinforcement.main.spacing": _format_value(reinforcement.get("main", {}).get("spacing"), 0),
                    "footing.reinforcement.main.direction": reinforcement.get("main", {}).get("direction", ""),
                    "footing.reinforcement.distribution.barDiameter": str(reinforcement.get("distribution", {}).get("barDiameter", "")),
                    "footing.reinforcement.distribution.spacing": _format_value(reinforcement.get("distribution", {}).get("spacing"), 0),
                    "footing.reinforcement.distribution.direction": reinforcement.get("distribution", {}).get("direction", ""),
                })

    return context


def _replace_placeholders_in_text(text: str, context: Dict[str, Any]) -> str:
    """
    Reemplaza todos los placeholders {{variable}} en un texto con sus valores del contexto.
    """
    def replacer(match):
        placeholder = match.group(1).strip()
        value = context.get(placeholder, f"{{{{placeholder}}}}")  # Mantiene el placeholder si no existe
        return str(value) if value else ""

    # Patrón para encontrar {{variable}}
    pattern = r'\{\{([^}]+)\}\}'
    return re.sub(pattern, replacer, text)


def _replace_placeholders_in_paragraphs(doc: Document, context: Dict[str, Any]):
    """Reemplaza placeholders en todos los párrafos del documento."""
    for para in doc.paragraphs:
        if '{{' in para.text and '}}' in para.text:
            para.text = _replace_placeholders_in_text(para.text, context)


def _replace_placeholders_in_tables(doc: Document, context: Dict[str, Any]):
    """Reemplaza placeholders en todas las tablas del documento."""
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    if '{{' in para.text and '}}' in para.text:
                        para.text = _replace_placeholders_in_text(para.text, context)


def _generate_seismic_spectrum_chart(data: Dict[str, Any]) -> Optional[io.BytesIO]:
    """
    Genera un gráfico de espectros sísmicos (Aceleración vs Período).

    Returns:
        BytesIO con la imagen del gráfico en formato PNG, o None si no hay datos
    """
    if "seismic" not in data or "seismic" not in data:
        return None

    seismic_data = data["seismic"]
    if "result" not in seismic_data or "spectrum" not in seismic_data["result"]:
        return None

    spectrum = seismic_data["result"]["spectrum"]
    if not spectrum:
        return None

    # Extraer datos para el gráfico
    periods = [point["period"] for point in spectrum]
    sa_x = [point.get("SaX", point.get("Sa_x", 0)) for point in spectrum]
    sa_y = [point.get("SaY", point.get("Sa_y", 0)) for point in spectrum]

    # Crear el gráfico
    plt.figure(figsize=(10, 6))
    plt.plot(periods, sa_x, 'b-', linewidth=2, label='Espectro X')
    plt.plot(periods, sa_y, 'r--', linewidth=2, label='Espectro Y')
    plt.xlabel('Período T (s)', fontsize=12)
    plt.ylabel('Aceleración espectral Sa (g)', fontsize=12)
    plt.title('Espectros de Diseño Sísmico', fontsize=14, fontweight='bold')
    plt.grid(True, alpha=0.3)
    plt.legend(fontsize=10)
    plt.tight_layout()

    # Guardar en buffer
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    plt.close()
    buffer.seek(0)

    return buffer


def _insert_spectrum_chart(doc: Document, data: Dict[str, Any]):
    """
    Inserta el gráfico de espectros sísmicos en el documento donde encuentre {{spectrumChart}}.
    """
    chart_buffer = _generate_seismic_spectrum_chart(data)
    if not chart_buffer:
        return

    # Buscar el placeholder {{spectrumChart}} en párrafos
    for para in doc.paragraphs:
        if '{{spectrumChart}}' in para.text:
            # Limpiar el texto del párrafo
            para.text = para.text.replace('{{spectrumChart}}', '')
            # Insertar la imagen
            run = para.add_run()
            run.add_picture(chart_buffer, width=Inches(6))
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            break


def generate_design_base_document(data: Dict[str, Any], project_name: str = "Proyecto") -> bytes:
    """
    Genera un documento Word a partir de la plantilla usando sistema de placeholders.

    Los placeholders se escriben en el Word como {{variable}} y se reemplazan automáticamente.

    Args:
        data: Diccionario con los datos de bases de cálculo
        project_name: Nombre del proyecto

    Returns:
        Bytes del documento Word generado
    """
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"Plantilla no encontrada: {TEMPLATE_PATH}")

    # Cargar plantilla
    doc = Document(str(TEMPLATE_PATH))

    # Construir contexto con todas las variables
    context = _build_context(data, project_name)

    # Reemplazar placeholders en todo el documento
    _replace_placeholders_in_paragraphs(doc, context)
    _replace_placeholders_in_tables(doc, context)

    # Insertar gráfico de espectros si existe el placeholder
    _insert_spectrum_chart(doc, data)

    # Guardar en buffer
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    return buffer.getvalue()