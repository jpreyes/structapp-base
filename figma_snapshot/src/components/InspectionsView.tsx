import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Calendar, AlertTriangle, CheckCircle, Clock, Camera } from 'lucide-react';
import { Progress } from './ui/progress';

interface Inspection {
  id: string;
  projectName: string;
  date: string;
  status: 'Completada' | 'En Proceso' | 'Programada';
  severity: 'Alta' | 'Media' | 'Baja' | 'Normal';
  inspector: string;
  findings: number;
  progress: number;
}

const mockInspections: Inspection[] = [
  {
    id: '1',
    projectName: 'Edificio Residencial Torre Norte',
    date: '2024-03-15',
    status: 'Completada',
    severity: 'Baja',
    inspector: 'Ing. María González',
    findings: 3,
    progress: 100,
  },
  {
    id: '2',
    projectName: 'Puente Vehicular Av. Principal',
    date: '2024-03-18',
    status: 'En Proceso',
    severity: 'Media',
    inspector: 'Ing. Carlos Ramírez',
    findings: 7,
    progress: 65,
  },
  {
    id: '3',
    projectName: 'Centro Comercial Plaza Sur',
    date: '2024-03-20',
    status: 'Programada',
    severity: 'Normal',
    inspector: 'Ing. Ana Martínez',
    findings: 0,
    progress: 0,
  },
  {
    id: '4',
    projectName: 'Complejo Industrial Zona Norte',
    date: '2024-03-12',
    status: 'Completada',
    severity: 'Alta',
    inspector: 'Ing. Roberto Silva',
    findings: 12,
    progress: 100,
  },
];

export function InspectionsView() {
  const [inspections] = useState<Inspection[]>(mockInspections);

  const getStatusIcon = (status: Inspection['status']) => {
    switch (status) {
      case 'Completada':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'En Proceso':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Programada':
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: Inspection['severity']) => {
    switch (severity) {
      case 'Alta':
        return 'bg-red-100 text-red-700';
      case 'Media':
        return 'bg-orange-100 text-orange-700';
      case 'Baja':
        return 'bg-yellow-100 text-yellow-700';
      case 'Normal':
        return 'bg-green-100 text-green-700';
    }
  };

  const filterByStatus = (status: Inspection['status']) => {
    return inspections.filter(i => i.status === status);
  };

  const InspectionCard = ({ inspection }: { inspection: Inspection }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-2">{inspection.projectName}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(inspection.date).toLocaleDateString('es-ES')}
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(inspection.status)}
                {inspection.status}
              </div>
            </div>
          </div>
          <Badge className={getSeverityColor(inspection.severity)}>
            {inspection.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Inspector:</span>
            <span className="text-gray-900">{inspection.inspector}</span>
          </div>
          {inspection.findings > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-gray-900">{inspection.findings} hallazgos encontrados</span>
            </div>
          )}
          {inspection.status === 'En Proceso' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progreso</span>
                <span className="text-gray-900">{inspection.progress}%</span>
              </div>
              <Progress value={inspection.progress} />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              Ver Detalles
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Camera className="w-4 h-4" />
              Fotos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Inspecciones Estructurales</h1>
          <p className="text-gray-600">Gestiona y realiza seguimiento de inspecciones</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Inspección
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl text-gray-900">{inspections.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completadas</p>
                <p className="text-2xl text-gray-900">{filterByStatus('Completada').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En Proceso</p>
                <p className="text-2xl text-gray-900">{filterByStatus('En Proceso').length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Programadas</p>
                <p className="text-2xl text-gray-900">{filterByStatus('Programada').length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
          <TabsTrigger value="in-progress">En Proceso</TabsTrigger>
          <TabsTrigger value="scheduled">Programadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {inspections.map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterByStatus('Completada').map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterByStatus('En Proceso').map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filterByStatus('Programada').map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
