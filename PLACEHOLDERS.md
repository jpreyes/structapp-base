# Placeholders Disponibles para Plantillas Word

Este documento lista todos los placeholders que puedes usar en tu plantilla Word (`mc-tipo.docx`).

## CÃ³mo usar los placeholders

1. Abre tu plantilla Word (`mc-tipo.docx`)
2. Escribe los placeholders en formato `{{nombreVariable}}`
3. El sistema reemplazarÃ¡ automÃ¡ticamente los placeholders con los datos reales

## Placeholders Disponibles

### InformaciÃ³n del Proyecto

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{projectName}}` | Nombre del proyecto | "Edificio Comercial Centro" |
| `{{currentDate}}` | Fecha actual | "05 de noviembre de 2025" |

### DescripciÃ³n del Edificio

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{buildingDescription}}` | DescripciÃ³n general del edificio | "Edificio de oficinas de 5 pisos..." |
| `{{buildingLocation}}` | UbicaciÃ³n del edificio | "Av. Principal 123, Santiago" |
| `{{buildingArea}}` | Ãrea total construida | "1250 mÂ²" |
| `{{buildingHeight}}` | Altura total del edificio | "18.5 m" |

### Cargas Vivas

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{liveLoad.buildingType}}` | Tipo de edificio | "Edificios de oficinas" |
| `{{liveLoad.usage}}` | Uso especÃ­fico | "Oficinas" |
| `{{liveLoad.uniformLoad}}` | Carga uniforme (nÃºmero) | "250.00" |
| `{{liveLoad.uniformLoadRaw}}` | Carga uniforme (texto normativa) | "250 kgf/mÂ²" |
| `{{liveLoad.concentratedLoad}}` | Carga concentrada (nÃºmero) | "100.00" |
| `{{liveLoad.concentratedLoadRaw}}` | Carga concentrada (texto) | "100 kgf" |

### ReducciÃ³n de Cargas Vivas

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{reduction.elementType}}` | Tipo de elemento | "Viga" |
| `{{reduction.tributaryArea}}` | Área tributaria | "25.50" m² | "25.50" mÂ² |
| `{{reduction.baseLoad}}` | Carga base | "250.00" kgf/m² | "250.00" kgf/mÂ² |


Nota: Estos valores ahora también están disponibles en la página de Documentación para poder incluirse en la memoria.

### Viento

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{wind.environment}}` | Tipo de entorno | "Expuesto" |
| `{{wind.height}}` | Altura de referencia | "12.00" m |
| `{{wind.q}}` | PresiÃ³n de viento | "70.00" kgf/mÂ² |
| `{{wind.message}}` | Mensaje o advertencia | "" |

### Nieve

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{snow.latitudeBand}}` | Banda de latitud | "33Â°-38Â°" |
| `{{snow.altitudeBand}}` | Banda de altitud | "500-1000 m" |
| `{{snow.thermalCondition}}` | CondiciÃ³n tÃ©rmica | "Sin calefacciÃ³n" |
| `{{snow.importanceCategory}}` | CategorÃ­a de importancia | "CategorÃ­a II" |
| `{{snow.exposureCategory}}` | CategorÃ­a de exposiciÃ³n | "Protegido" |
| `{{snow.exposureCondition}}` | CondiciÃ³n de exposiciÃ³n | "Normal" |
| `{{snow.surfaceType}}` | Tipo de superficie | "Lisa" |
| `{{snow.roofPitch}}` | Pendiente del techo | "15.00" grados |
| `{{snow.pg}}` | Carga de nieve del suelo | "0.800" kN/mÂ² |
| `{{snow.ct}}` | Coeficiente tÃ©rmico | "1.000" |
| `{{snow.ce}}` | Coeficiente de exposiciÃ³n | "0.900" |
| `{{snow.I}}` | Factor de importancia | "1.000" |
| `{{snow.cs}}` | Coeficiente de pendiente | "0.980" |
| `{{snow.pf}}` | Carga de nieve en techo | "0.706" kN/mÂ² |

### Sismo - ParÃ¡metros de Entrada

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{seismic.params.category}}` | CategorÃ­a del edificio | "II" |
| `{{seismic.params.zone}}` | Zona sÃ­smica | "Zona 3" |
| `{{seismic.params.soil}}` | Tipo de suelo | "Tipo C" |
| `{{seismic.params.rs}}` | Factor de reducciÃ³n Rs | "3.00" |
| `{{seismic.params.ps}}` | Peso sÃ­smico total | "1000.00" kN |
| `{{seismic.params.tx}}` | PerÃ­odo en direcciÃ³n X | "0.600" s |
| `{{seismic.params.ty}}` | PerÃ­odo en direcciÃ³n Y | "0.500" s |
| `{{seismic.params.r0}}` | Factor de reducciÃ³n R0 | "8.00" |

### Sismo - Resultados

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{seismic.result.intensityFactor}}` | Factor de intensidad Is | "1.000" |
| `{{seismic.result.zoneFactor}}` | Factor de zona A0 | "0.400" g |
| `{{seismic.result.CMax}}` | Coeficiente sÃ­smico mÃ¡ximo | "0.450" |
| `{{seismic.result.CMin}}` | Coeficiente sÃ­smico mÃ­nimo | "0.100" |
| `{{seismic.result.Q0x}}` | Cortante basal estÃ¡tico X | "180.00" kN |
| `{{seismic.result.Q0y}}` | Cortante basal estÃ¡tico Y | "200.00" kN |
| `{{seismic.result.Q0Min}}` | Cortante basal mÃ­nimo | "100.00" kN |
| `{{seismic.result.Q0Max}}` | Cortante basal mÃ¡ximo | "450.00" kN |
| `{{seismic.result.Qbasx}}` | Cortante basal de diseÃ±o X | "180.00" kN |
| `{{seismic.result.Qbasy}}` | Cortante basal de diseÃ±o Y | "200.00" kN |

### GrÃ¡fico de Espectros SÃ­smicos

| Placeholder | DescripciÃ³n |
|------------|-------------|
| `{{spectrumChart}}` | Inserta el grÃ¡fico de espectros de diseÃ±o (Sa vs T) |

**Nota:** El grÃ¡fico `{{spectrumChart}}` debe estar en su propia lÃ­nea/pÃ¡rrafo para que se inserte correctamente.

---

## CÃ¡lculos Estructurales

### Pilares de HormigÃ³n Armado (ACI318)

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{concrete.column.axialCapacity}}` | Capacidad axial de diseÃ±o | "850.50" kN |
| `{{concrete.column.axialCapacityRatio}}` | Ratio de utilizaciÃ³n axial | "0.750" |
| `{{concrete.column.longitudinalSteel.numBars}}` | NÃºmero de barras longitudinales | "8" |
| `{{concrete.column.longitudinalSteel.barDiameter}}` | DiÃ¡metro de barras | "20" mm |
| `{{concrete.column.longitudinalSteel.totalArea}}` | Ãrea total de acero | "2513.27" mmÂ² |
| `{{concrete.column.longitudinalSteel.ratio}}` | CuantÃ­a de acero | "0.0250" |
| `{{concrete.column.transverseSteel.diameter}}` | DiÃ¡metro de estribos | "10" mm |
| `{{concrete.column.transverseSteel.spacing}}` | Espaciamiento de estribos | "150" mm |
| `{{concrete.column.shearCapacityRatioX}}` | Ratio capacidad corte X | "0.650" |
| `{{concrete.column.shearCapacityRatioY}}` | Ratio capacidad corte Y | "0.620" |
| `{{concrete.column.slendernessRatio}}` | RelaciÃ³n de esbeltez | "35.50" |
| `{{concrete.column.magnificationFactor}}` | Factor de magnificaciÃ³n | "1.150" |
| `{{concrete.column.isSlender}}` | Â¿Es esbelto? | "true" o "false" |

### Vigas de HormigÃ³n Armado (ACI318)

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{concrete.beam.positiveReinforcement.numBars}}` | Barras momento positivo | "4" |
| `{{concrete.beam.positiveReinforcement.barDiameter}}` | DiÃ¡metro barras positivas | "20" mm |
| `{{concrete.beam.positiveReinforcement.totalArea}}` | Ãrea acero positivo | "1256.64" mmÂ² |
| `{{concrete.beam.positiveReinforcement.ratio}}` | CuantÃ­a momento positivo | "0.0180" |
| `{{concrete.beam.negativeReinforcement.numBars}}` | Barras momento negativo | "5" |
| `{{concrete.beam.negativeReinforcement.barDiameter}}` | DiÃ¡metro barras negativas | "20" mm |
| `{{concrete.beam.negativeReinforcement.totalArea}}` | Ãrea acero negativo | "1570.80" mmÂ² |
| `{{concrete.beam.negativeReinforcement.ratio}}` | CuantÃ­a momento negativo | "0.0225" |
| `{{concrete.beam.transverseSteel.diameter}}` | DiÃ¡metro de estribos | "10" mm |
| `{{concrete.beam.transverseSteel.spacing}}` | Espaciamiento estribos | "200" mm |
| `{{concrete.beam.shearCapacityRatio}}` | Ratio capacidad corte | "0.720" |
| `{{concrete.beam.deflectionCheck}}` | VerificaciÃ³n deflexiÃ³n | "OK" |
| `{{concrete.beam.effectiveDepth}}` | Peralte efectivo | "450.00" mm |

### Pilares de Acero (AISC360)

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{steel.column.section}}` | Perfil utilizado | "W310x97" |
| `{{steel.column.pn}}` | Capacidad axial de diseÃ±o | "1250.00" kN |
| `{{steel.column.axialRatio}}` | Ratio utilizaciÃ³n axial | "0.680" |
| `{{steel.column.mnX}}` | Capacidad momento X (alias de `momentCapacityX`) | "180.50" kNÂ·m |
| `{{steel.column.mnY}}` | Capacidad momento Y (alias de `momentCapacityY`) | "95.30" kNÂ·m |
| `{{steel.column.flexureRatioX}}` | Ratio momento X (alias de `momentCapacityRatioX`) | "0.550" |
| `{{steel.column.flexureRatioY}}` | Ratio momento Y (alias de `momentCapacityRatioY`) | "0.480" |
| `{{steel.column.slendernessX}}` | Esbeltez en X | "65.50" |
| `{{steel.column.slendernessY}}` | Esbeltez en Y | "85.20" |
| `{{steel.column.lambdaC}}` | ParÃ¡metro de esbeltez | "85.20" |
| `{{steel.column.interactionRatio}}` | Ratio de interacciÃ³n | "0.850" |
| `{{steel.column.passes}}` | Â¿Cumple el diseÃ±o? | "true" o "false" |
| `{{steel.column.checkStatus}}` | Estado verificaciÃ³n | "OK" |

### Vigas de Acero (AISC360)

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{steel.beam.section}}` | Perfil utilizado | "W410x149" |
| `{{steel.beam.mn}}` | Capacidad a momento (alias de `momentCapacity`) | "350.80" kNÂ·m |
| `{{steel.beam.vn}}` | Capacidad a corte (alias de `shearCapacity`) | "450.00" kN |
| `{{steel.beam.flexureRatio}}` | Ratio utilizaciÃ³n momento | "0.720" |
| `{{steel.beam.shearRatio}}` | Ratio utilizaciÃ³n corte | "0.580" |
| `{{steel.beam.deflection}}` | DeflexiÃ³n calculada | "25.50" cm |
| `{{steel.beam.deflectionRatio}}` | Ratio deflexiÃ³n | "0.765" |
| `{{steel.beam.passes}}` | Â¿Cumple el diseÃ±o? | "true" o "false" |
| `{{steel.beam.checkStatus}}` | Estado verificaciÃ³n | "OK" |

### Pilares de Madera (NCh1198)

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{wood.column.woodType}}` | Tipo de madera | "Pino radiata" |
| `{{wood.column.area}}` | Ãrea de la secciÃ³n | "14400.00" mmÂ² |
| `{{wood.column.pn}}` | Capacidad axial (alias de `axialCapacity`) | "95.50" kN |
| `{{wood.column.utilizationRatio}}` | Ratio utilizaciÃ³n | "0.780" |
| `{{wood.column.slendernessX}}` | Esbeltez en X | "42.50" |
| `{{wood.column.slendernessY}}` | Esbeltez en Y | "42.50" |
| `{{wood.column.stabilityFactor}}` | Factor de estabilidad Cp | "0.850" |
| `{{wood.column.isSlender}}` | Â¿Es esbelto? | "true" o "false" |
| `{{wood.column.allowableStress}}` | Esfuerzo admisible | "3.25" MPa |
| `{{wood.column.checkStatus}}` | Estado verificaciÃ³n | "OK" |

### Vigas de Madera (NCh1198)

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{wood.beam.woodType}}` | Tipo de madera | "CoigÃ¼e" |
| `{{wood.beam.section}}` | SecciÃ³n de la viga | "16x24 cm" |
| `{{wood.beam.mn}}` | Momento nominal (alias de `nominalMomentCapacity`) | "28.50" kNÂ·m |
| `{{wood.beam.vn}}` | Cortante nominal (alias de `nominalShearCapacity`) | "45.30" kN |
| `{{wood.beam.utilizationRatio}}` | Ratio de utilizaciÃ³n global | "0.895" |
| `{{wood.beam.flexureRatio}}` | Ratio utilizaciÃ³n flexiÃ³n | "0.813" |
| `{{wood.beam.shearRatio}}` | Ratio utilizaciÃ³n corte | "0.895" |
| `{{wood.beam.deflection}}` | DeflexiÃ³n calculada | "18.50" cm |
| `{{wood.beam.deflectionRatio}}` | Ratio deflexiÃ³n | "0.925" |
| `{{wood.beam.passes}}` | Â¿Cumple el diseÃ±o? | "true" o "false" |
| `{{wood.beam.checkStatus}}` | Estado verificaciÃ³n | "OK" |

### Zapatas (ACI318)

| Placeholder | DescripciÃ³n | Ejemplo |
|------------|-------------|---------|
| `{{footing.length}}` | Longitud de la zapata (alias de `footing.dimensions.length`) | "2.50" m |
| `{{footing.width}}` | Ancho de la zapata (alias de `footing.dimensions.width`) | "2.50" m |
| `{{footing.depth}}` | Altura de la zapata (alias de `footing.dimensions.depth`) | "60.0" cm |
| `{{footing.soilPressureMax}}` | PresiÃ³n mÃ¡xima del suelo | "185.50" kPa |
| `{{footing.soilPressureMin}}` | PresiÃ³n mÃ­nima del suelo | "115.30" kPa |
| `{{footing.asLongitudinal}}` | Acero longitudinal (alias de `footing.reinforcement.longitudinalSteel`) | "12.50" cmÂ²/m |
| `{{footing.asTransverse}}` | Acero transversal (alias de `footing.reinforcement.transverseSteel`) | "12.50" cmÂ²/m |
| `{{footing.barDiameter}}` | Diámetro de barras (x/y o principal) | "16" mm |
| `{{footing.spacing}}` | Espaciamiento de barras (x/y o principal) | "20.0" cm |
| `{{footing.punchingShearRatio}}` | Ratio punzonamiento | "0.731" |
| `{{footing.beamShearRatio}}` | Ratio corte por flexiÃ³n | "0.633" |
| `{{footing.passes}}` | Â¿Cumple el diseÃ±o? | "true" o "false" |

## Ejemplo de Uso en Word

```
MEMORIA DE CÃLCULO
Proyecto: {{projectName}}
Fecha: {{currentDate}}

1. DESCRIPCIÃ“N DEL PROYECTO

{{buildingDescription}}

UbicaciÃ³n: {{buildingLocation}}
Ãrea total: {{buildingArea}}
Altura: {{buildingHeight}}

2. CARGAS DE DISEÃ‘O

2.1 Cargas Vivas
Tipo de edificio: {{liveLoad.buildingType}}
Uso: {{liveLoad.usage}}
Carga uniforme: {{liveLoad.uniformLoadRaw}}

2.2 Viento
Altura: {{wind.height}} m
PresiÃ³n de diseÃ±o: {{wind.q}} kgf/mÂ²

3. ANÃLISIS SÃSMICO

CategorÃ­a: {{seismic.params.category}}
Zona: {{seismic.params.zone}}
Tipo de suelo: {{seismic.params.soil}}

Cortante basal X: {{seismic.result.Qbasx}} kN
Cortante basal Y: {{seismic.result.Qbasy}} kN

3.1 Espectros de DiseÃ±o

{{spectrumChart}}
```

## Manejo de MÃºltiples Elementos del Mismo Tipo

Si calculas varios elementos del mismo tipo (por ejemplo, 3 vigas de acero, 5 columnas de hormigÃ³n, etc.), usa esta estrategia:

### Estrategia HÃ­brida Recomendada

1. **En el cuerpo del documento**: Usa los placeholders individuales para el elemento **mÃ¡s crÃ­tico o representativo**:
   ```
   3.1 Vigas de Acero

   La viga crÃ­tica es la ubicada en el eje A entre columnas 1-2:
   Perfil: {{steel.beam.section}}
   Ratio de utilizaciÃ³n: {{steel.beam.flexureRatio}}
   Estado: {{steel.beam.checkStatus}}
   ```

2. **En los anexos (al final)**: Usa placeholders de tabla para mostrar **todos los cÃ¡lculos**:
   ```
   ANEXO A: RESUMEN DE CÃLCULOS

   A.1 Todas las Vigas de Acero Calculadas

   {{steelBeamsTable}}

   A.2 Todas las Columnas de HormigÃ³n Calculadas

   {{concreteColumnsTable}}
   ```

### Placeholders de Tablas Disponibles

| Placeholder | DescripciÃ³n |
|------------|-------------|
| `{{concreteColumnsTable}}` | Tabla con todas las columnas de hormigÃ³n calculadas |
| `{{concreteBeamsTable}}` | Tabla con todas las vigas de hormigÃ³n calculadas |
| `{{steelColumnsTable}}` | Tabla con todas las columnas de acero calculadas |
| `{{steelBeamsTable}}` | Tabla con todas las vigas de acero calculadas (se inserta como tabla nativa de Word) |
| `{{woodColumnsTable}}` | Tabla con todas las columnas de madera calculadas |
| `{{woodBeamsTable}}` | Tabla con todas las vigas de madera calculadas |
| `{{footingsTable}}` | Tabla con todas las zapatas calculadas |

### Ejemplo de Estructura Completa

```
MEMORIA DE CÃLCULO ESTRUCTURAL

1. INTRODUCCIÃ“N
Proyecto: {{projectName}}
Fecha: {{currentDate}}

2. DESCRIPCIÃ“N
{{buildingDescription}}

3. ANÃLISIS SÃSMICO
Cortante basal X: {{seismic.result.Qbasx}} kN
Cortante basal Y: {{seismic.result.Qbasy}} kN

4. DISEÃ‘O DE ELEMENTOS

4.1 Vigas de Acero
Se diseÃ±aron 5 vigas de acero. La viga crÃ­tica presenta:
- Perfil: {{steel.beam.section}}
- Ratio: {{steel.beam.flexureRatio}}
- Estado: {{steel.beam.checkStatus}}

Ver Anexo A.1 para resumen completo.

---

ANEXO A: TABLAS DE RESUMEN

A.1 VIGAS DE ACERO

{{steelBeamsTable}}

A.2 COLUMNAS DE HORMIGÃ“N

{{concreteColumnsTable}}
```

## Notas Importantes

1. **Formato de nÃºmeros**: Los nÃºmeros se formatean automÃ¡ticamente con 2 decimales por defecto (excepto valores especÃ­ficos como perÃ­odos sÃ­smicos que usan 3 decimales)

2. **Valores opcionales**: Si un placeholder no tiene valor, se mostrarÃ¡ como texto vacÃ­o en el documento

3. **Tablas**: Los placeholders funcionan tanto en pÃ¡rrafos normales como dentro de celdas de tablas

4. **Case sensitive**: Los placeholders distinguen entre mayÃºsculas y minÃºsculas: `{{projectName}}` â‰  `{{projectname}}`

5. **Espacios**: Se ignoran los espacios dentro de los placeholders: `{{ projectName }}` = `{{projectName}}`

6. **Elemento crÃ­tico**: Los placeholders individuales (ej: `{{steel.beam.section}}`) se llenan con el elemento que tenga el **mayor ratio de utilizaciÃ³n** de ese tipo
