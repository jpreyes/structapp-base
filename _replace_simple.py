from pathlib import Path
path = Path('frontend/src/pages/ProjectDesignBasesPage.tsx')
text = path.read_text(encoding='utf-8')
text = text.replace('manualBaseLoad === ""', 'baseLoadValue === undefined')
text = text.replace('Number(manualBaseLoad)', 'baseLoadValue ?? 0')
text = text.replace('Number.isFinite(baseLoadValue)', 'Number.isFinite(baseLoadValue ?? NaN)')
text = text.replace('baseLoadValue =\n                    manualBaseLoad !== "" ? Number(manualBaseLoad) : baseUniformLoad ?? Number.NaN;', 'baseLoad = baseLoadValue;')
path.write_text(text, encoding='utf-8')
