# Placeholders Disponibles para Plantillas Word

Este documento lista todos los placeholders que puedes usar en tu plantilla Word (`mc-tipo.docx`).

## Cómo usar los placeholders

1. Abre tu plantilla Word (`mc-tipo.docx`)
2. Escribe los placeholders en formato `{{nombreVariable}}`
3. El sistema reemplazará automáticamente los placeholders con los datos reales

## Placeholders Disponibles

### Información del Proyecto

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{projectName}}` | Nombre del proyecto | "Edificio Comercial Centro" |
| `{{currentDate}}` | Fecha actual | "05 de noviembre de 2025" |

### Descripción del Edificio

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{buildingDescription}}` | Descripción general del edificio | "Edificio de oficinas de 5 pisos..." |
| `{{buildingLocation}}` | Ubicación del edificio | "Av. Principal 123, Santiago" |
| `{{buildingArea}}` | Área total construida | "1250 m²" |
| `{{buildingHeight}}` | Altura total del edificio | "18.5 m" |

### Cargas Vivas

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{liveLoad.buildingType}}` | Tipo de edificio | "Edificios de oficinas" |
| `{{liveLoad.usage}}` | Uso específico | "Oficinas" |
| `{{liveLoad.uniformLoad}}` | Carga uniforme (número) | "250.00" |
| `{{liveLoad.uniformLoadRaw}}` | Carga uniforme (texto normativa) | "250 kgf/m²" |
| `{{liveLoad.concentratedLoad}}` | Carga concentrada (número) | "100.00" |
| `{{liveLoad.concentratedLoadRaw}}` | Carga concentrada (texto) | "100 kgf" |

### Reducción de Cargas Vivas

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{reduction.elementType}}` | Tipo de elemento | "Viga" |
| `{{reduction.tributaryArea}}` | Área tributaria | "25.50" m² |
| `{{reduction.baseLoad}}` | Carga base | "250.00" kgf/m² |
| `{{reduction.reducedLoad}}` | Carga reducida | "200.00" kgf/m² |

### Viento

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{wind.environment}}` | Tipo de entorno | "Expuesto" |
| `{{wind.height}}` | Altura de referencia | "12.00" m |
| `{{wind.q}}` | Presión de viento | "70.00" kgf/m² |
| `{{wind.message}}` | Mensaje o advertencia | "" |

### Nieve

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{snow.latitudeBand}}` | Banda de latitud | "33°-38°" |
| `{{snow.altitudeBand}}` | Banda de altitud | "500-1000 m" |
| `{{snow.thermalCondition}}` | Condición térmica | "Sin calefacción" |
| `{{snow.importanceCategory}}` | Categoría de importancia | "Categoría II" |
| `{{snow.exposureCategory}}` | Categoría de exposición | "Protegido" |
| `{{snow.exposureCondition}}` | Condición de exposición | "Normal" |
| `{{snow.surfaceType}}` | Tipo de superficie | "Lisa" |
| `{{snow.roofPitch}}` | Pendiente del techo | "15.00" grados |
| `{{snow.pg}}` | Carga de nieve del suelo | "0.800" kN/m² |
| `{{snow.ct}}` | Coeficiente térmico | "1.000" |
| `{{snow.ce}}` | Coeficiente de exposición | "0.900" |
| `{{snow.I}}` | Factor de importancia | "1.000" |
| `{{snow.cs}}` | Coeficiente de pendiente | "0.980" |
| `{{snow.pf}}` | Carga de nieve en techo | "0.706" kN/m² |

### Sismo - Parámetros de Entrada

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{seismic.params.category}}` | Categoría del edificio | "II" |
| `{{seismic.params.zone}}` | Zona sísmica | "Zona 3" |
| `{{seismic.params.soil}}` | Tipo de suelo | "Tipo C" |
| `{{seismic.params.rs}}` | Factor de reducción Rs | "3.00" |
| `{{seismic.params.ps}}` | Peso sísmico total | "1000.00" kN |
| `{{seismic.params.tx}}` | Período en dirección X | "0.600" s |
| `{{seismic.params.ty}}` | Período en dirección Y | "0.500" s |
| `{{seismic.params.r0}}` | Factor de reducción R0 | "8.00" |

### Sismo - Resultados

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{seismic.result.intensityFactor}}` | Factor de intensidad Is | "1.000" |
| `{{seismic.result.zoneFactor}}` | Factor de zona A0 | "0.400" g |
| `{{seismic.result.CMax}}` | Coeficiente sísmico máximo | "0.450" |
| `{{seismic.result.CMin}}` | Coeficiente sísmico mínimo | "0.100" |
| `{{seismic.result.Q0x}}` | Cortante basal estático X | "180.00" kN |
| `{{seismic.result.Q0y}}` | Cortante basal estático Y | "200.00" kN |
| `{{seismic.result.Q0Min}}` | Cortante basal mínimo | "100.00" kN |
| `{{seismic.result.Q0Max}}` | Cortante basal máximo | "450.00" kN |
| `{{seismic.result.Qbasx}}` | Cortante basal de diseño X | "180.00" kN |
| `{{seismic.result.Qbasy}}` | Cortante basal de diseño Y | "200.00" kN |

### Gráfico de Espectros Sísmicos

| Placeholder | Descripción |
|------------|-------------|
| `{{spectrumChart}}` | Inserta el gráfico de espectros de diseño (Sa vs T) |

**Nota:** El gráfico `{{spectrumChart}}` debe estar en su propia línea/párrafo para que se inserte correctamente.

---

## Cálculos Estructurales

### Pilares de Hormigón Armado (ACI318)

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{concrete.column.axialCapacity}}` | Capacidad axial de diseño | "850.50" kN |
| `{{concrete.column.axialCapacityRatio}}` | Ratio de utilización axial | "0.750" |
| `{{concrete.column.longitudinalSteel.numBars}}` | Número de barras longitudinales | "8" |
| `{{concrete.column.longitudinalSteel.barDiameter}}` | Diámetro de barras | "20" mm |
| `{{concrete.column.longitudinalSteel.totalArea}}` | Área total de acero | "2513.27" mm² |
| `{{concrete.column.longitudinalSteel.ratio}}` | Cuantía de acero | "0.0250" |
| `{{concrete.column.transverseSteel.diameter}}` | Diámetro de estribos | "10" mm |
| `{{concrete.column.transverseSteel.spacing}}` | Espaciamiento de estribos | "150" mm |
| `{{concrete.column.shearCapacityRatioX}}` | Ratio capacidad corte X | "0.650" |
| `{{concrete.column.shearCapacityRatioY}}` | Ratio capacidad corte Y | "0.620" |
| `{{concrete.column.slendernessRatio}}` | Relación de esbeltez | "35.50" |
| `{{concrete.column.magnificationFactor}}` | Factor de magnificación | "1.150" |
| `{{concrete.column.isSlender}}` | ¿Es esbelto? | "true" o "false" |

### Vigas de Hormigón Armado (ACI318)

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{concrete.beam.positiveReinforcement.numBars}}` | Barras momento positivo | "4" |
| `{{concrete.beam.positiveReinforcement.barDiameter}}` | Diámetro barras positivas | "20" mm |
| `{{concrete.beam.positiveReinforcement.totalArea}}` | Área acero positivo | "1256.64" mm² |
| `{{concrete.beam.positiveReinforcement.ratio}}` | Cuantía momento positivo | "0.0180" |
| `{{concrete.beam.negativeReinforcement.numBars}}` | Barras momento negativo | "5" |
| `{{concrete.beam.negativeReinforcement.barDiameter}}` | Diámetro barras negativas | "20" mm |
| `{{concrete.beam.negativeReinforcement.totalArea}}` | Área acero negativo | "1570.80" mm² |
| `{{concrete.beam.negativeReinforcement.ratio}}` | Cuantía momento negativo | "0.0225" |
| `{{concrete.beam.transverseSteel.diameter}}` | Diámetro de estribos | "10" mm |
| `{{concrete.beam.transverseSteel.spacing}}` | Espaciamiento estribos | "200" mm |
| `{{concrete.beam.shearCapacityRatio}}` | Ratio capacidad corte | "0.720" |
| `{{concrete.beam.deflectionCheck}}` | Verificación deflexión | "OK" |
| `{{concrete.beam.effectiveDepth}}` | Peralte efectivo | "450.00" mm |

### Pilares de Acero (AISC360)

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{steel.column.section}}` | Perfil utilizado | "W310x97" |
| `{{steel.column.axialCapacity}}` | Capacidad axial | "1250.00" kN |
| `{{steel.column.axialCapacityRatio}}` | Ratio utilización axial | "0.680" |
| `{{steel.column.momentCapacityX}}` | Capacidad momento X | "180.50" kN·m |
| `{{steel.column.momentCapacityY}}` | Capacidad momento Y | "95.30" kN·m |
| `{{steel.column.momentCapacityRatioX}}` | Ratio momento X | "0.550" |
| `{{steel.column.momentCapacityRatioY}}` | Ratio momento Y | "0.480" |
| `{{steel.column.slendernessX}}` | Esbeltez en X | "65.50" |
| `{{steel.column.slendernessY}}` | Esbeltez en Y | "85.20" |
| `{{steel.column.slendernessMax}}` | Esbeltez máxima | "85.20" |
| `{{steel.column.interactionRatio}}` | Ratio de interacción | "0.850" |
| `{{steel.column.checkStatus}}` | Estado verificación | "OK" |

### Vigas de Acero (AISC360)

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{steel.beam.section}}` | Perfil utilizado | "W410x149" |
| `{{steel.beam.momentCapacity}}` | Capacidad a momento | "350.80" kN·m |
| `{{steel.beam.momentCapacityRatio}}` | Ratio utilización momento | "0.720" |
| `{{steel.beam.shearCapacity}}` | Capacidad a corte | "450.00" kN |
| `{{steel.beam.shearCapacityRatio}}` | Ratio utilización corte | "0.580" |
| `{{steel.beam.deflection}}` | Deflexión calculada | "25.50" mm |
| `{{steel.beam.deflectionLimit}}` | Deflexión límite | "33.33" mm |
| `{{steel.beam.deflectionRatio}}` | Ratio deflexión | "0.765" |
| `{{steel.beam.lateralBracingLength}}` | Longitud arriostramiento | "6000" mm |
| `{{steel.beam.checkStatus}}` | Estado verificación | "OK" |

### Pilares de Madera (NCh1198)

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{wood.column.woodType}}` | Tipo de madera | "Pino radiata" |
| `{{wood.column.area}}` | Área de la sección | "14400.00" mm² |
| `{{wood.column.axialCapacity}}` | Capacidad axial | "95.50" kN |
| `{{wood.column.axialCapacityRatio}}` | Ratio utilización | "0.780" |
| `{{wood.column.slendernessX}}` | Esbeltez en X | "42.50" |
| `{{wood.column.slendernessY}}` | Esbeltez en Y | "42.50" |
| `{{wood.column.slendernessMax}}` | Esbeltez máxima | "42.50" |
| `{{wood.column.stabilityFactor}}` | Factor de estabilidad Cp | "0.850" |
| `{{wood.column.isSlender}}` | ¿Es esbelto? | "true" o "false" |
| `{{wood.column.allowableStress}}` | Esfuerzo admisible | "3.25" MPa |
| `{{wood.column.checkStatus}}` | Estado verificación | "OK" |

### Vigas de Madera (NCh1198)

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{wood.beam.woodType}}` | Tipo de madera | "Coigüe" |
| `{{wood.beam.area}}` | Área de la sección | "19200.00" mm² |
| `{{wood.beam.sectionModulus}}` | Módulo de sección | "768000.00" mm³ |
| `{{wood.beam.momentOfInertia}}` | Momento de inercia | "138240000.00" mm⁴ |
| `{{wood.beam.flexureStress}}` | Esfuerzo de flexión | "6.50" MPa |
| `{{wood.beam.allowableFlexureStress}}` | Esfuerzo admisible flexión | "8.00" MPa |
| `{{wood.beam.flexureRatio}}` | Ratio utilización flexión | "0.813" |
| `{{wood.beam.shearStress}}` | Esfuerzo cortante | "0.85" MPa |
| `{{wood.beam.allowableShearStress}}` | Esfuerzo admisible corte | "0.95" MPa |
| `{{wood.beam.shearRatio}}` | Ratio utilización corte | "0.895" |
| `{{wood.beam.deflection}}` | Deflexión calculada | "18.50" mm |
| `{{wood.beam.deflectionLimit}}` | Deflexión límite | "20.00" mm |
| `{{wood.beam.deflectionRatio}}` | Ratio deflexión | "0.925" |
| `{{wood.beam.lateralStabilityFactor}}` | Factor estabilidad lateral | "1.000" |
| `{{wood.beam.checkStatus}}` | Estado verificación | "OK" |

### Zapatas (ACI318)

| Placeholder | Descripción | Ejemplo |
|------------|-------------|---------|
| `{{footing.footingType}}` | Tipo de zapata | "Aislada" o "Corrida" |
| `{{footing.dimensions.length}}` | Longitud | "250.0" cm |
| `{{footing.dimensions.width}}` | Ancho | "250.0" cm |
| `{{footing.dimensions.depth}}` | Altura | "60.0" cm |
| `{{footing.dimensions.area}}` | Área en planta | "6.250" m² |
| `{{footing.soilPressures.max}}` | Presión máxima del suelo | "185.50" kPa |
| `{{footing.soilPressures.min}}` | Presión mínima del suelo | "115.30" kPa |
| `{{footing.soilPressures.average}}` | Presión promedio | "150.40" kPa |
| `{{footing.soilPressures.ratio}}` | Ratio presión/capacidad | "0.775" |
| `{{footing.lateralPressures.static}}` | Empuje estático | "25.00" kPa |
| `{{footing.lateralPressures.dynamic}}` | Empuje dinámico | "15.00" kPa |
| `{{footing.lateralPressures.seismic}}` | Empuje sísmico | "35.00" kPa |
| `{{footing.lateralPressures.total}}` | Empuje total | "75.00" kPa |
| `{{footing.punchingShear.appliedForce}}` | Fuerza punzonamiento | "380.00" kN |
| `{{footing.punchingShear.capacity}}` | Capacidad punzonamiento | "520.00" kN |
| `{{footing.punchingShear.ratio}}` | Ratio punzonamiento | "0.731" |
| `{{footing.punchingShear.criticalPerimeter}}` | Perímetro crítico | "2400" mm |
| `{{footing.flexuralShear.appliedForce}}` | Fuerza corte flexión | "95.00" kN |
| `{{footing.flexuralShear.capacity}}` | Capacidad corte flexión | "150.00" kN |
| `{{footing.flexuralShear.ratio}}` | Ratio corte flexión | "0.633" |
| `{{footing.reinforcement.xDirection.barDiameter}}` | Diámetro barras X | "16" mm |
| `{{footing.reinforcement.xDirection.spacing}}` | Espaciamiento barras X | "200" mm |
| `{{footing.reinforcement.yDirection.barDiameter}}` | Diámetro barras Y | "16" mm |
| `{{footing.reinforcement.yDirection.spacing}}` | Espaciamiento barras Y | "200" mm |
| `{{footing.checkStatus}}` | Estado verificación | "OK" |

**Nota para zapatas corridas:** Los placeholders de refuerzo cambian a:
- `{{footing.reinforcement.main.barDiameter}}`, `{{footing.reinforcement.main.spacing}}`, `{{footing.reinforcement.main.direction}}`
- `{{footing.reinforcement.distribution.barDiameter}}`, `{{footing.reinforcement.distribution.spacing}}`, `{{footing.reinforcement.distribution.direction}}`

## Ejemplo de Uso en Word

```
MEMORIA DE CÁLCULO
Proyecto: {{projectName}}
Fecha: {{currentDate}}

1. DESCRIPCIÓN DEL PROYECTO

{{buildingDescription}}

Ubicación: {{buildingLocation}}
Área total: {{buildingArea}}
Altura: {{buildingHeight}}

2. CARGAS DE DISEÑO

2.1 Cargas Vivas
Tipo de edificio: {{liveLoad.buildingType}}
Uso: {{liveLoad.usage}}
Carga uniforme: {{liveLoad.uniformLoadRaw}}

2.2 Viento
Altura: {{wind.height}} m
Presión de diseño: {{wind.q}} kgf/m²

3. ANÁLISIS SÍSMICO

Categoría: {{seismic.params.category}}
Zona: {{seismic.params.zone}}
Tipo de suelo: {{seismic.params.soil}}

Cortante basal X: {{seismic.result.Qbasx}} kN
Cortante basal Y: {{seismic.result.Qbasy}} kN

3.1 Espectros de Diseño

{{spectrumChart}}
```

## Notas Importantes

1. **Formato de números**: Los números se formatean automáticamente con 2 decimales por defecto (excepto valores específicos como períodos sísmicos que usan 3 decimales)

2. **Valores opcionales**: Si un placeholder no tiene valor, se mostrará como texto vacío en el documento

3. **Tablas**: Los placeholders funcionan tanto en párrafos normales como dentro de celdas de tablas

4. **Case sensitive**: Los placeholders distinguen entre mayúsculas y minúsculas: `{{projectName}}` ≠ `{{projectname}}`

5. **Espacios**: Se ignoran los espacios dentro de los placeholders: `{{ projectName }}` = `{{projectName}}`