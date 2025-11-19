import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Progress } from './ui/progress';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Pendiente' | 'En Progreso' | 'Completada';
  priority: 'Alta' | 'Media' | 'Baja';
  assignedTo: {
    name: string;
    initials: string;
  };
  project: string;
  dueDate: string;
  progress: number;
  tags: string[];
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Revisión de planos estructurales',
    description: 'Revisar y aprobar planos de la Torre Norte',
    status: 'En Progreso',
    priority: 'Alta',
    assignedTo: { name: 'Ing. Juan Pérez', initials: 'JP' },
    project: 'Edificio Residencial Torre Norte',
    dueDate: '2024-03-20',
    progress: 65,
    tags: ['Diseño', 'Urgente'],
  },
  {
    id: '2',
    title: 'Análisis de cargas sísmicas',
    description: 'Calcular cargas sísmicas para estructura principal',
    status: 'Pendiente',
    priority: 'Alta',
    assignedTo: { name: 'Ing. María González', initials: 'MG' },
    project: 'Centro Comercial Plaza Sur',
    dueDate: '2024-03-18',
    progress: 0,
    tags: ['Análisis', 'Sísmico'],
  },
  {
    id: '3',
    title: 'Instalación de sensores',
    description: 'Coordinar instalación de sensores de monitoreo',
    status: 'En Progreso',
    priority: 'Media',
    assignedTo: { name: 'Ing. Carlos Ramírez', initials: 'CR' },
    project: 'Puente Vehicular Av. Principal',
    dueDate: '2024-03-22',
    progress: 40,
    tags: ['Monitoreo', 'Instalación'],
  },
  {
    id: '4',
    title: 'Reporte de inspección',
    description: 'Elaborar reporte detallado de inspección estructural',
    status: 'Completada',
    priority: 'Media',
    assignedTo: { name: 'Ing. Ana Martínez', initials: 'AM' },
    project: 'Estadio Deportivo Municipal',
    dueDate: '2024-03-15',
    progress: 100,
    tags: ['Inspección', 'Documentación'],
  },
  {
    id: '5',
    title: 'Calibración de modelos ML',
    description: 'Ajustar parámetros del modelo predictivo',
    status: 'En Progreso',
    priority: 'Baja',
    assignedTo: { name: 'Ing. Roberto Silva', initials: 'RS' },
    project: 'Centro Comercial Plaza Sur',
    dueDate: '2024-03-25',
    progress: 30,
    tags: ['ML', 'Análisis'],
  },
  {
    id: '6',
    title: 'Revisión de presupuesto',
    description: 'Actualizar presupuesto del proyecto con costos reales',
    status: 'Pendiente',
    priority: 'Alta',
    assignedTo: { name: 'Ing. Juan Pérez', initials: 'JP' },
    project: 'Edificio Residencial Torre Norte',
    dueDate: '2024-03-19',
    progress: 0,
    tags: ['Finanzas', 'Gestión'],
  },
];

export function TasksView() {
  const [tasks] = useState<Task[]>(mockTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-700';
      case 'Media':
        return 'bg-yellow-100 text-yellow-700';
      case 'Baja':
        return 'bg-green-100 text-green-700';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'Completada':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'En Progreso':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Pendiente':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const filterByStatus = (status: Task['status']) => {
    return tasks.filter(t => t.status === status);
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(task.status)}
              <CardTitle className="text-base">{task.title}</CardTitle>
            </div>
            <p className="text-sm text-gray-600">{task.description}</p>
          </div>
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">{task.assignedTo.initials}</AvatarFallback>
            </Avatar>
            <span>{task.assignedTo.name}</span>
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-1">Proyecto: {task.project}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Vence: {new Date(task.dueDate).toLocaleDateString('es-ES')}</span>
          </div>

          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {task.status === 'En Progreso' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progreso</span>
                <span className="text-gray-900">{task.progress}%</span>
              </div>
              <Progress value={task.progress} />
            </div>
          )}

          <Button variant="outline" className="w-full" size="sm">
            Ver Detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Tareas</h1>
          <p className="text-gray-600">Gestión de tareas compartidas entre proyectos</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Tarea</DialogTitle>
                <DialogDescription>
                  Asigna una tarea a un miembro del equipo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-title">Título de la Tarea</Label>
                  <Input id="task-title" placeholder="Ej. Revisión de planos estructurales" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-description">Descripción</Label>
                  <Textarea 
                    id="task-description" 
                    placeholder="Detalles de la tarea..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-project">Proyecto</Label>
                    <Select>
                      <SelectTrigger id="task-project">
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p1">Edificio Residencial Torre Norte</SelectItem>
                        <SelectItem value="p2">Centro Comercial Plaza Sur</SelectItem>
                        <SelectItem value="p3">Puente Vehicular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-assignee">Asignar a</Label>
                    <Select>
                      <SelectTrigger id="task-assignee">
                        <SelectValue placeholder="Seleccionar ingeniero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="u1">Ing. Juan Pérez</SelectItem>
                        <SelectItem value="u2">Ing. María González</SelectItem>
                        <SelectItem value="u3">Ing. Carlos Ramírez</SelectItem>
                        <SelectItem value="u4">Ing. Ana Martínez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-priority">Prioridad</Label>
                    <Select>
                      <SelectTrigger id="task-priority">
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-due-date">Fecha de Vencimiento</Label>
                    <Input id="task-due-date" type="date" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-tags">Etiquetas (separadas por coma)</Label>
                  <Input id="task-tags" placeholder="Ej. Diseño, Urgente, Revisión" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Crear Tarea
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tareas</p>
                <p className="text-2xl text-gray-900">{tasks.length}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-blue-600" />
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
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En Progreso</p>
                <p className="text-2xl text-gray-900">{filterByStatus('En Progreso').length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-2xl text-gray-900">{filterByStatus('Pendiente').length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="my-tasks">Mis Tareas</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="in-progress">En Progreso</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-tasks">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks
              .filter(t => t.assignedTo.initials === 'JP')
              .map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filterByStatus('Pendiente').map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filterByStatus('En Progreso').map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filterByStatus('Completada').map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
