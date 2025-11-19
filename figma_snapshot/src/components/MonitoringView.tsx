import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Activity, TrendingUp, TrendingDown, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const realTimeData = [
  { time: '00:00', aceleracion: 0.12, desplazamiento: 0.08, vibracion: 0.15 },
  { time: '04:00', aceleracion: 0.14, desplazamiento: 0.09, vibracion: 0.16 },
  { time: '08:00', aceleracion: 0.18, desplazamiento: 0.12, vibracion: 0.20 },
  { time: '12:00', aceleracion: 0.22, desplazamiento: 0.15, vibracion: 0.24 },
  { time: '16:00', aceleracion: 0.19, desplazamiento: 0.13, vibracion: 0.21 },
  { time: '20:00', aceleracion: 0.15, desplazamiento: 0.10, vibracion: 0.17 },
  { time: '24:00', aceleracion: 0.13, desplazamiento: 0.09, vibracion: 0.16 },
];

const historicalData = [
  { date: '1 Mar', max: 0.25, avg: 0.18, min: 0.12 },
  { date: '5 Mar', max: 0.28, avg: 0.19, min: 0.13 },
  { date: '10 Mar', max: 0.24, avg: 0.17, min: 0.11 },
  { date: '15 Mar', max: 0.26, avg: 0.18, min: 0.12 },
  { date: '20 Mar', max: 0.29, avg: 0.20, min: 0.14 },
  { date: '25 Mar', max: 0.27, avg: 0.19, min: 0.13 },
  { date: '30 Mar', max: 0.25, avg: 0.18, min: 0.12 },
];

interface Sensor {
  id: string;
  name: string;
  location: string;
  status: 'Activo' | 'Inactivo' | 'Alerta';
  lastReading: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  battery: number;
}

const mockSensors: Sensor[] = [
  {
    id: '1',
    name: 'Acelerómetro A1',
    location: 'Piso 15 - Norte',
    status: 'Activo',
    lastReading: 0.18,
    unit: 'g',
    trend: 'stable',
    battery: 85,
  },
  {
    id: '2',
    name: 'Inclinómetro I1',
    location: 'Piso 20 - Centro',
    status: 'Activo',
    lastReading: 0.003,
    unit: 'deg',
    trend: 'down',
    battery: 92,
  },
  {
    id: '3',
    name: 'Sensor de Vibración V1',
    location: 'Base - Sur',
    status: 'Alerta',
    lastReading: 0.28,
    unit: 'mm/s',
    trend: 'up',
    battery: 45,
  },
  {
    id: '4',
    name: 'Extensómetro E1',
    location: 'Piso 10 - Este',
    status: 'Activo',
    lastReading: 125,
    unit: 'με',
    trend: 'stable',
    battery: 78,
  },
];

export function MonitoringView() {
  const [sensors] = useState<Sensor[]>(mockSensors);

  const getStatusColor = (status: Sensor['status']) => {
    switch (status) {
      case 'Activo':
        return 'bg-green-100 text-green-700';
      case 'Inactivo':
        return 'bg-gray-100 text-gray-700';
      case 'Alerta':
        return 'bg-red-100 text-red-700';
    }
  };

  const getTrendIcon = (trend: Sensor['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'stable':
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Monitoreo Estructural</h1>
          <p className="text-gray-600">Visualización en tiempo real de sensores y datos históricos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-700">Transmitiendo en vivo</span>
          </div>
          <Button variant="outline">Configurar Alertas</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sensores Activos</p>
                <p className="text-2xl text-gray-900">{sensors.filter(s => s.status === 'Activo').length}</p>
              </div>
              <Wifi className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Alertas</p>
                <p className="text-2xl text-gray-900">{sensors.filter(s => s.status === 'Alerta').length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Desconectados</p>
                <p className="text-2xl text-gray-900">{sensors.filter(s => s.status === 'Inactivo').length}</p>
              </div>
              <WifiOff className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Estructuras</p>
                <p className="text-2xl text-gray-900">3</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {sensors.map((sensor) => (
          <Card key={sensor.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base mb-1">{sensor.name}</CardTitle>
                  <p className="text-sm text-gray-500">{sensor.location}</p>
                </div>
                <Badge className={getStatusColor(sensor.status)}>
                  {sensor.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Última Lectura</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl text-gray-900">{sensor.lastReading}</p>
                      <span className="text-sm text-gray-500">{sensor.unit}</span>
                      {getTrendIcon(sensor.trend)}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Batería</span>
                    <span className="text-gray-900">{sensor.battery}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        sensor.battery > 60 ? 'bg-green-500' : 
                        sensor.battery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${sensor.battery}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList>
          <TabsTrigger value="realtime">Tiempo Real</TabsTrigger>
          <TabsTrigger value="historical">Histórico</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <Card>
            <CardHeader>
              <CardTitle>Monitoreo en Tiempo Real - Últimas 24 horas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={realTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="aceleracion" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Aceleración (g)"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="desplazamiento" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Desplazamiento (mm)"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vibracion" 
                    stroke="#ec4899" 
                    strokeWidth={2}
                    name="Vibración (mm/s)"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historical">
          <Card>
            <CardHeader>
              <CardTitle>Datos Históricos - Último Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="max" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Máximo"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Promedio"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="min" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Mínimo"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Tendencias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 mb-1">Comportamiento Normal</p>
                      <p className="text-sm text-blue-700">
                        Los valores de aceleración y desplazamiento se mantienen dentro de los rangos esperados.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-900 mb-1">Atención Requerida</p>
                      <p className="text-sm text-yellow-700">
                        El sensor V1 ha registrado vibraciones por encima del umbral. Se recomienda inspección.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-900 mb-1">Mejora Detectada</p>
                      <p className="text-sm text-green-700">
                        Los valores del inclinómetro I1 muestran una tendencia descendente positiva.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
