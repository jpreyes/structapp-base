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