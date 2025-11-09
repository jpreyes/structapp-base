from pathlib import Path
import re
p = Path('services/design_bases_docx_service.py')
text = p.read_text(encoding='utf-8')
orig = text

# Insert woodColumn aliases after its first context.update
wc_block = re.search(r"\n\s*# Pilar de Madera\s*\n\s*if \"woodColumn\" in struct and struct\[\"woodColumn\"\]:\s*\n\s*wc = struct\[\"woodColumn\"\]\s*\n\s*context\.update\(\{[\s\S]*?\}\)\s*\n", text)
if not wc_block:
    raise SystemExit('woodColumn base block not found')
wc_insert = (
    "\n            # Aliases para compatibilidad con plantilla\n"
    "            axial_capacity = _format_value(wc.get(\"axialCapacity\"))\n"
    "            axial_ratio = _format_value(wc.get(\"axialCapacityRatio\"), 3)\n"
    "            passes_str = str(wc.get(\"checkPasses\", wc.get(\"passes\", \"\")))\n"
    "            context.update({\n"
    "                \"wood.column.pn\": axial_capacity,\n"
    "                \"wood.column.utilizationRatio\": axial_ratio,\n"
    "                \"wood.column.checkPasses\": passes_str,\n"
    "                \"wood.column.passes\": passes_str,\n"
    "            })\n"
)
text = text[:wc_block.end()] + wc_insert + text[wc_block.end():]

# Insert woodBeam aliases after its first context.update
wb_block = re.search(r"\n\s*# Viga de Madera\s*\n\s*if \"woodBeam\" in struct and struct\[\"woodBeam\"\]:\s*\n\s*wb = struct\[\"woodBeam\"\]\s*\n\s*context\.update\(\{[\s\S]*?\}\)\s*\n", text)
if not wb_block:
    raise SystemExit('woodBeam base block not found')
wb_insert = (
    "\n            # Aliases para compatibilidad con plantilla\n"
    "            nominal_moment = _format_value(wb.get(\"nominalMomentCapacity\", wb.get(\"momentCapacity\")))\n"
    "            nominal_shear = _format_value(wb.get(\"nominalShearCapacity\", wb.get(\"shearCapacity\")))\n"
    "            utilization = _format_value(wb.get(\"utilization\", wb.get(\"overallUtilization\")), 3)\n"
    "            passes_str = str(wb.get(\"checkPasses\", wb.get(\"passes\", \"\")))\n"
    "            context.update({\n"
    "                \"wood.beam.mn\": nominal_moment,\n"
    "                \"wood.beam.vn\": nominal_shear,\n"
    "                \"wood.beam.utilizationRatio\": utilization,\n"
    "                \"wood.beam.passes\": passes_str,\n"
    "                \"wood.beam.checkPasses\": passes_str,\n"
    "            })\n"
)
text = text[:wb_block.end()] + wb_insert + text[wb_block.end():]

# Insert footing aliases inside footing block before return context
footing_match = re.search(r"\n\s*# Zapata[\s\S]*?if \"footing\" in struct and struct\[\"footing\"\]:[\s\S]*?\n\s*\)\s*\n\s*\)\s*\n", text)
# We'll not rely on this; instead insert right before the first 'return context' after footing section
ret_idx = text.find('\n    return context')
if ret_idx == -1:
    raise SystemExit('return context not found')
# Find the position of the footing block start to ensure we insert after it
footing_start = text.find('\n        # Zapata')
if footing_start == -1:
    raise SystemExit('footing start not found')
insert_pos = ret_idx  # simple and safe: inject just before return context
footing_insert = (
    "\n            # Aliases para compatibilidad con la plantilla existente\n"
    "            dims = ft.get(\"dimensions\", {})\n"
    "            soil = ft.get(\"soilPressures\", {})\n"
    "            punching = ft.get(\"punchingShear\", {})\n"
    "            flex = ft.get(\"flexuralShear\", {})\n"
    "            length = _format_value(dims.get(\"length\"), 2)\n"
    "            width = _format_value(dims.get(\"width\"), 2)\n"
    "            depth = _format_value(dims.get(\"depth\"), 1)\n"
    "            as_long = context.get(\"footing.reinforcement.longitudinalSteel\", \"\")\n"
    "            as_trans = context.get(\"footing.reinforcement.transverseSteel\", \"\")\n"
    "            bar_diam = (\n"
    "                str(ft.get(\"reinforcement\", {}).get(\"xDirection\", {}).get(\"barDiameter\"))\n"
    "                or str(ft.get(\"reinforcement\", {}).get(\"main\", {}).get(\"barDiameter\", \"\"))\n"
    "            )\n"
    "            spacing = (\n"
    "                _format_value(ft.get(\"reinforcement\", {}).get(\"xDirection\", {}).get(\"spacing\"), 1)\n"
    "                or _format_value(ft.get(\"reinforcement\", {}).get(\"main\", {}).get(\"spacing\"), 1)\n"
    "            )\n"
    "            context.update({\n"
    "                \"footing.length\": length,\n"
    "                \"footing.width\": width,\n"
    "                \"footing.depth\": depth,\n"
    "                \"footing.soilPressureMax\": _format_value(soil.get(\"max\"), 2),\n"
    "                \"footing.soilPressureMin\": _format_value(soil.get(\"min\"), 2),\n"
    "                \"footing.punchingShearRatio\": _format_value(punching.get(\"ratio\"), 3),\n"
    "                \"footing.beamShearRatio\": _format_value(flex.get(\"ratio\"), 3),\n"
    "                \"footing.asLongitudinal\": as_long,\n"
    "                \"footing.asTransverse\": as_trans,\n"
    "                \"footing.barDiameter\": bar_diam,\n"
    "                \"footing.spacing\": spacing,\n"
    "                \"footing.passes\": str(ft.get(\"checkPasses\", ft.get(\"passes\", \"\"))),\n"
    "            })\n"
)
text = text[:insert_pos] + footing_insert + text[insert_pos:]

# Inject tables/extras before return context only once
tables_inject = (
    "\n    # Permitir inyección de placeholders de tablas y extras\n"
    "    tables = data.get(\"tables\")\n"
    "    if isinstance(tables, dict):\n"
    "        context.update(tables)\n\n"
    "    extra_placeholders = (\n"
    "        data.get(\"placeholders\")\n"
    "        or data.get(\"extraPlaceholders\")\n"
    "        or data.get(\"additionalPlaceholders\")\n"
    "    )\n"
    "    if isinstance(extra_placeholders, dict):\n"
    "        context.update(extra_placeholders)\n\n"
)
text = text.replace('\n    return context\n', tables_inject + '    return context\n', 1)

# Fix _replace_placeholders_in_text to keep token when missing
text = re.sub(
    r"def _replace_placeholders_in_text\([\s\S]*?def _replace_placeholders_in_runs",
    lambda m: m.group(0).replace(
        'value = context.get(placeholder, f"{{{{placeholder}}}}")  # Mantiene el placeholder si no existe\r\n        return str(value) if value else ""',
        'if placeholder in context:\r\n        value = context[placeholder]\r\n        return "" if value is None else str(value)\r\n        return match.group(0)'
    ),
    text,
    count=1,
    flags=re.S,
)

# Fix _replace_placeholders_in_runs to keep token when missing
text = text.replace(
    '        value = context.get(placeholder, "")\r\n\r\n        # Si no se encuentra el valor, mantener el placeholder para debug\r\n        if not value and placeholder not in context:\r\n            value = f"{{{{placeholder}}}}"\r\n\r\n        # Reemplazar el placeholder con su valor\r\n        new_text = new_text[:match.start()] + str(value) + new_text[match.end():]',
    '        if placeholder in context:\r\n            value = context[placeholder]\r\n            value_str = "" if value is None else str(value)\r\n        else:\r\n            value_str = match.group(0)\r\n\r\n        # Reemplazar el placeholder con su valor\r\n        new_text = new_text[:match.start()] + value_str + new_text[match.end():]'
)

if text != orig:
    p.write_text(text, encoding='utf-8')
    print('Updated file')
else:
    print('No change')
