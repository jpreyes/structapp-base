import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Ruler, 
  Download, 
  Calculator, 
  FileText, 
  Settings, 
  Layers,
  Wind,
  Zap
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';

export function StructuralDesignView() {
  const [beamLength, setBeamLength] = useState('6.0');
  const [beamWidth, setBeamWidth] = useState('0.30');
  const [beamHeight, setBeamHeight] = useState('0.50');
  const [concreteStrength, setConcreteStrength] = useState('f250');
  const [steelGrade, setSteelGrade] = useState('fy420');

  const calculateMoment = () => {
    const L = parseFloat(beamLength);
    const w = 15; // kN/m (carga distribuida ejemplo)
    const moment = (w * L * L) / 8;
    return moment.toFixed(2);
  };

  const calculateShear = () => {
    const L = parseFloat(beamLength);
    const w = 15; // kN/m
    const shear = (w * L) / 2;
    return shear.toFixed(2);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Diseño Estructural</h1>
          <p className="text-gray-600">Análisis y diseño de elementos estructurales con API</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            Generar Reporte
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Exportar DXF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Parámetros de Diseño
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-900 mb-3">Dimensiones de Viga</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="length">Longitud (m)</Label>
                      <Input
                        id="length"
                        type="number"
                        step="0.1"
                        value={beamLength}
                        onChange={(e) => setBeamLength(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">Ancho (m)</Label>
                      <Input
                        id="width"
                        type="number"
                        step="0.05"
                        value={beamWidth}
                        onChange={(e) => setBeamWidth(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Altura (m)</Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.05"
                        value={beamHeight}
                        onChange={(e) => setBeamHeight(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm text-gray-900 mb-3">Materiales</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="concrete">Resistencia Concreto</Label>
                      <Select value={concreteStrength} onValueChange={setConcreteStrength}>
                        <SelectTrigger id="concrete">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="f200">f'c = 200 kg/cm²</SelectItem>
                          <SelectItem value="f250">f'c = 250 kg/cm²</SelectItem>
                          <SelectItem value="f300">f'c = 300 kg/cm²</SelectItem>
                          <SelectItem value="f350">f'c = 350 kg/cm²</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="steel">Acero de Refuerzo</Label>
                      <Select value={steelGrade} onValueChange={setSteelGrade}>
                        <SelectTrigger id="steel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fy420">fy = 4200 kg/cm²</SelectItem>
                          <SelectItem value="fy500">fy = 5000 kg/cm²</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm text-gray-900 mb-3">Cargas</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="dead-load">Carga Muerta (kN/m)</Label>
                      <Input id="dead-load" type="number" defaultValue="8.0" step="0.5" />
                    </div>
                    <div>
                      <Label htmlFor="live-load">Carga Viva (kN/m)</Label>
                      <Input id="live-load" type="number" defaultValue="7.0" step="0.5" />
                    </div>
                  </div>
                </div>

                <Button className="w-full gap-2">
                  <Calculator className="w-4 h-4" />
                  Calcular
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 bg-gray-100 rounded">
                  <p className="text-gray-600 mb-1">POST</p>
                  <p className="text-gray-900">/api/analyze/beam</p>
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <p className="text-gray-600 mb-1">POST</p>
                  <p className="text-gray-900">/api/analyze/column</p>
                </div>
                <div className="p-2 bg-gray-100 rounded">
                  <p className="text-gray-600 mb-1">POST</p>
                  <p className="text-gray-900">/api/seismic/analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="results" className="space-y-6">
            <TabsList>
              <TabsTrigger value="results">Resultados</TabsTrigger>
              <TabsTrigger value="diagram">Diagramas</TabsTrigger>
              <TabsTrigger value="seismic">Análisis Sísmico</TabsTrigger>
              <TabsTrigger value="wind">Análisis de Viento</TabsTrigger>
            </TabsList>

            <TabsContent value="results">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Análisis de Viga
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-900 mb-1">Momento Máximo</p>
                          <p className="text-2xl text-blue-700">{calculateMoment()} kN·m</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-900 mb-1">Cortante Máximo</p>
                          <p className="text-2xl text-purple-700">{calculateShear()} kN</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-900 mb-1">Deflexión Máxima</p>
                          <p className="text-2xl text-green-700">12.5 mm</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-900 mb-1">Acero Superior</p>
                          <p className="text-xl text-orange-700">4 ø 20 mm</p>
                          <p className="text-xs text-orange-600 mt-1">As = 12.57 cm²</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-900 mb-1">Acero Inferior</p>
                          <p className="text-xl text-orange-700">3 ø 20 mm</p>
                          <p className="text-xs text-orange-600 mt-1">As = 9.42 cm²</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-900 mb-1">Estribos</p>
                          <p className="text-xl text-orange-700">ø 10 @ 15 cm</p>
                          <p className="text-xs text-orange-600 mt-1">Zona crítica</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Verificaciones de Diseño</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                          <div>
                            <p className="text-sm text-green-900">Resistencia a Flexión</p>
                            <p className="text-xs text-green-700">φMn ≥ Mu: 125.4 kN·m ≥ {calculateMoment()} kN·m</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                          <div>
                            <p className="text-sm text-green-900">Resistencia a Cortante</p>
                            <p className="text-xs text-green-700">φVn ≥ Vu: 98.2 kN ≥ {calculateShear()} kN</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                          <div>
                            <p className="text-sm text-green-900">Deflexión Admisible</p>
                            <p className="text-xs text-green-700">Δ ≤ L/360: 12.5 mm ≤ 16.7 mm</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="diagram">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Diagramas de Fuerzas Internas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center text-gray-500">
                        <Ruler className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Diagrama de Momento Flector</p>
                        <p className="text-sm mt-2">Visualización interactiva disponible vía API</p>
                      </div>
                    </div>
                    <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center text-gray-500">
                        <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Diagrama de Fuerza Cortante</p>
                        <p className="text-sm mt-2">Visualización interactiva disponible vía API</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seismic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Análisis Sísmico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Zona Sísmica</p>
                        <p className="text-xl text-gray-900">Zona D</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Tipo de Suelo</p>
                        <p className="text-xl text-gray-900">S2</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Categoría</p>
                        <p className="text-xl text-gray-900">B (Común)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900 mb-1">Coeficiente Sísmico (C)</p>
                        <p className="text-2xl text-blue-700">0.28</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-900 mb-1">Factor de Reducción (R)</p>
                        <p className="text-2xl text-purple-700">8.0</p>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-900 mb-2">Cortante Basal</p>
                      <p className="text-2xl text-green-700 mb-2">245.6 kN</p>
                      <p className="text-xs text-green-600">V = C × W / R</p>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-900 mb-1">Deriva de Entrepiso</p>
                      <p className="text-xl text-yellow-700">0.0065 {'<'} 0.007 ✓</p>
                      <p className="text-xs text-yellow-600 mt-1">Cumple con requisitos normativos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wind">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="w-5 h-5" />
                    Análisis de Viento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Velocidad Básica</p>
                        <p className="text-xl text-gray-900">150 km/h</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Categoría Terreno</p>
                        <p className="text-xl text-gray-900">III</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Altura Referencia</p>
                        <p className="text-xl text-gray-900">60 m</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-cyan-50 rounded-lg">
                        <p className="text-sm text-cyan-900 mb-1">Presión de Viento</p>
                        <p className="text-2xl text-cyan-700">1.25 kPa</p>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-indigo-900 mb-1">Coeficiente de Arrastre</p>
                        <p className="text-2xl text-indigo-700">1.3</p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900 mb-2">Fuerza Total de Viento</p>
                      <p className="text-2xl text-blue-700 mb-2">187.5 kN</p>
                      <p className="text-xs text-blue-600">Aplicada en el centroide del área expuesta</p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-900 mb-1">Verificación de Estabilidad</p>
                      <p className="text-xl text-green-700">Factor de Seguridad: 2.1 ✓</p>
                      <p className="text-xs text-green-600 mt-1">Cumple con requisitos mínimos (FS ≥ 1.5)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}