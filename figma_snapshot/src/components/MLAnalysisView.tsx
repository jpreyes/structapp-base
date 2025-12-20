import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Upload, Play, Download } from 'lucide-react';
import { Progress } from './ui/progress';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from 'recharts';

const predictionData = [
  { x: 1, y: 2.3, z: 100, estado: 'Normal' },
  { x: 2, y: 2.5, z: 105, estado: 'Normal' },
  { x: 3, y: 2.8, z: 110, estado: 'Normal' },
  { x: 4, y: 3.2, z: 120, estado: 'Precaución' },
  { x: 5, y: 3.5, z: 125, estado: 'Precaución' },
  { x: 6, y: 2.9, z: 112, estado: 'Normal' },
  { x: 7, y: 3.1, z: 118, estado: 'Normal' },
  { x: 8, y: 3.8, z: 135, estado: 'Alerta' },
];

interface MLModel {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  status: 'Entrenado' | 'Entrenando' | 'Pendiente';
  lastTrained: string;
  predictions: number;
}

const mockModels: MLModel[] = [
  {
    id: '1',
    name: 'Predicción de Fallas Estructurales',
    type: 'Random Forest',
    accuracy: 94.5,
    status: 'Entrenado',
    lastTrained: '2024-03-10',
    predictions: 1247,
  },
  {
    id: '2',
    name: 'Detección de Anomalías',
    type: 'Isolation Forest',
    accuracy: 91.2,
    status: 'Entrenado',
    lastTrained: '2024-03-12',
    predictions: 856,
  },
  {
    id: '3',
    name: 'Predicción de Vida Útil',
    type: 'LSTM Neural Network',
    accuracy: 88.7,
    status: 'Entrenando',
    lastTrained: '2024-03-15',
    predictions: 423,
  },
];

export function MLAnalysisView() {
  const [models] = useState<MLModel[]>(mockModels);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  const getStatusColor = (status: MLModel['status']) => {
    switch (status) {
      case 'Entrenado':
        return 'bg-green-100 text-green-700';
      case 'Entrenando':
        return 'bg-blue-100 text-blue-700';
      case 'Pendiente':
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Análisis con Machine Learning</h1>
          <p className="text-gray-600">Predicción y detección de patrones con IA</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Cargar Datos
          </Button>
          <Button className="gap-2" onClick={handleAnalysis} disabled={isAnalyzing}>
            <Play className="w-4 h-4" />
            {isAnalyzing ? 'Analizando...' : 'Ejecutar Análisis'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Modelos Activos</p>
                <p className="text-2xl text-gray-900">{models.filter(m => m.status === 'Entrenado').length}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Precisión Promedio</p>
                <p className="text-2xl text-gray-900">91.5%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Predicciones</p>
                <p className="text-2xl text-gray-900">2,526</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Anomalías</p>
                <p className="text-2xl text-gray-900">12</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="predictions">Predicciones</TabsTrigger>
          <TabsTrigger value="training">Entrenamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base mb-1">{model.name}</CardTitle>
                      <p className="text-sm text-gray-500">{model.type}</p>
                    </div>
                    <Badge className={getStatusColor(model.status)}>
                      {model.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Precisión</span>
                        <span className="text-gray-900">{model.accuracy}%</span>
                      </div>
                      <Progress value={model.accuracy} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Último Entrenamiento</p>
                        <p className="text-gray-900">
                          {new Date(model.lastTrained).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Predicciones</p>
                        <p className="text-gray-900">{model.predictions.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Ver Detalles
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Re-entrenar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis Predictivo de Comportamiento Estructural</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" name="Tiempo (días)" />
                    <YAxis dataKey="y" name="Desplazamiento (mm)" />
                    <ZAxis dataKey="z" range={[60, 400]} name="Carga (kN)" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter 
                      name="Normal" 
                      data={predictionData.filter(d => d.estado === 'Normal')} 
                      fill="#10b981" 
                    />
                    <Scatter 
                      name="Precaución" 
                      data={predictionData.filter(d => d.estado === 'Precaución')} 
                      fill="#f59e0b" 
                    />
                    <Scatter 
                      name="Alerta" 
                      data={predictionData.filter(d => d.estado === 'Alerta')} 
                      fill="#ef4444" 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Predicción a 7 días</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estado Previsto</p>
                        <p className="text-gray-900">Normal</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Probabilidad de operación normal: <span className="text-green-600">92%</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Anomalías Detectadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Últimas 24h</p>
                        <p className="text-gray-900">3 eventos</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Severidad: <span className="text-orange-600">Baja</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vida Útil Estimada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tiempo Restante</p>
                        <p className="text-gray-900">45 años</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Confianza: <span className="text-blue-600">87%</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Configuración de Entrenamiento</CardTitle>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar Dataset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-sm text-gray-900 mb-3">Dataset Actual</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Registros Totales</p>
                      <p className="text-gray-900">156,842</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Features</p>
                      <p className="text-gray-900">24</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Última Actualización</p>
                      <p className="text-gray-900">Hace 2 horas</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="text-sm text-gray-900 mb-3">Distribución de Datos</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Entrenamiento (70%)</span>
                        <span className="text-gray-900">109,789 registros</span>
                      </div>
                      <Progress value={70} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Validación (20%)</span>
                        <span className="text-gray-900">31,368 registros</span>
                      </div>
                      <Progress value={20} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Prueba (10%)</span>
                        <span className="text-gray-900">15,685 registros</span>
                      </div>
                      <Progress value={10} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1">Iniciar Entrenamiento</Button>
                  <Button variant="outline" className="flex-1">Configurar Parámetros</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
