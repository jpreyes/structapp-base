import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Plus, Search, Building2, Calendar, User, MoreVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface Project {
  id: string;
  name: string;
  type: string;
  status: 'En Progreso' | 'Completado' | 'Pendiente';
  client: string;
  startDate: string;
  location: string;
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Edificio Residencial Torre Norte',
    type: 'Diseño Estructural',
    status: 'En Progreso',
    client: 'Constructora ABC',
    startDate: '2024-01-15',
    location: 'Ciudad de México',
  },
  {
    id: '2',
    name: 'Puente Vehicular Av. Principal',
    type: 'Inspección Estructural',
    status: 'Completado',
    client: 'Gobierno Municipal',
    startDate: '2023-11-20',
    location: 'Monterrey',
  },
  {
    id: '3',
    name: 'Centro Comercial Plaza Sur',
    type: 'Monitoreo Estructural',
    status: 'En Progreso',
    client: 'Inmobiliaria XYZ',
    startDate: '2024-02-01',
    location: 'Guadalajara',
  },
  {
    id: '4',
    name: 'Estadio Deportivo Municipal',
    type: 'Análisis Sísmico',
    status: 'Pendiente',
    client: 'Gobierno Estatal',
    startDate: '2024-03-10',
    location: 'Puebla',
  },
];

export function ProjectsView() {
  const [projects] = useState<Project[]>(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'En Progreso':
        return 'bg-blue-100 text-blue-700';
      case 'Completado':
        return 'bg-green-100 text-green-700';
      case 'Pendiente':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Proyectos</h1>
          <p className="text-gray-600">Gestiona todos tus proyectos estructurales</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
              <DialogDescription>
                Ingresa los detalles del proyecto estructural
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Nombre del Proyecto</Label>
                <Input id="project-name" placeholder="Ej. Edificio Torre Central" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="project-type">Tipo de Proyecto</Label>
                  <Select>
                    <SelectTrigger id="project-type">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">Diseño Estructural</SelectItem>
                      <SelectItem value="inspection">Inspección Estructural</SelectItem>
                      <SelectItem value="monitoring">Monitoreo Estructural</SelectItem>
                      <SelectItem value="analysis">Análisis Sísmico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Input id="client" placeholder="Nombre del cliente" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" placeholder="Ciudad, Estado" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Fecha de Inicio</Label>
                  <Input id="start-date" type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  placeholder="Detalles del proyecto..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Crear Proyecto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar proyectos por nombre o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-1 line-clamp-2">
                      {project.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{project.type}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{project.client}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.startDate).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{project.location}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" className="w-full" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
