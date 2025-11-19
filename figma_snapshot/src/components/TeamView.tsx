import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone,
  Building2,
  Settings,
  Crown,
  Shield,
  User,
  MoreVertical,
  Briefcase
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Administrador' | 'Ingeniero Senior' | 'Ingeniero' | 'Técnico';
  specialization: string;
  status: 'Activo' | 'Inactivo';
  initials: string;
  projectsCount: number;
  tasksCount: number;
  joinDate: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Ing. Juan Pérez',
    email: 'juan.perez@structureflow.com',
    phone: '+52 55 1234 5678',
    role: 'Administrador',
    specialization: 'Diseño Estructural',
    status: 'Activo',
    initials: 'JP',
    projectsCount: 8,
    tasksCount: 12,
    joinDate: '2023-01-15',
  },
  {
    id: '2',
    name: 'Ing. María González',
    email: 'maria.gonzalez@structureflow.com',
    phone: '+52 55 2345 6789',
    role: 'Ingeniero Senior',
    specialization: 'Análisis Sísmico',
    status: 'Activo',
    initials: 'MG',
    projectsCount: 6,
    tasksCount: 9,
    joinDate: '2023-03-20',
  },
  {
    id: '3',
    name: 'Ing. Carlos Ramírez',
    email: 'carlos.ramirez@structureflow.com',
    phone: '+52 55 3456 7890',
    role: 'Ingeniero',
    specialization: 'Monitoreo Estructural',
    status: 'Activo',
    initials: 'CR',
    projectsCount: 5,
    tasksCount: 8,
    joinDate: '2023-05-10',
  },
  {
    id: '4',
    name: 'Ing. Ana Martínez',
    email: 'ana.martinez@structureflow.com',
    phone: '+52 55 4567 8901',
    role: 'Ingeniero',
    specialization: 'Inspecciones',
    status: 'Activo',
    initials: 'AM',
    projectsCount: 7,
    tasksCount: 11,
    joinDate: '2023-06-01',
  },
  {
    id: '5',
    name: 'Ing. Roberto Silva',
    email: 'roberto.silva@structureflow.com',
    phone: '+52 55 5678 9012',
    role: 'Ingeniero Senior',
    specialization: 'Machine Learning',
    status: 'Activo',
    initials: 'RS',
    projectsCount: 4,
    tasksCount: 6,
    joinDate: '2023-07-15',
  },
  {
    id: '6',
    name: 'Tec. Laura Hernández',
    email: 'laura.hernandez@structureflow.com',
    phone: '+52 55 6789 0123',
    role: 'Técnico',
    specialization: 'Soporte de Campo',
    status: 'Activo',
    initials: 'LH',
    projectsCount: 3,
    tasksCount: 5,
    joinDate: '2023-08-01',
  },
];

const organizationInfo = {
  name: 'StructureFlow México',
  type: 'Consultoría de Ingeniería Estructural',
  members: 6,
  activeProjects: 12,
  plan: 'Professional',
  location: 'Ciudad de México, México',
};

export function TeamView() {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'Administrador':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'Ingeniero Senior':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'Ingeniero':
        return <User className="w-4 h-4 text-green-600" />;
      case 'Técnico':
        return <Briefcase className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'Administrador':
        return 'bg-yellow-100 text-yellow-700';
      case 'Ingeniero Senior':
        return 'bg-blue-100 text-blue-700';
      case 'Ingeniero':
        return 'bg-green-100 text-green-700';
      case 'Técnico':
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Equipo y Organización</h1>
          <p className="text-gray-600">Gestión de miembros del equipo multitenant</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Invitar Miembro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                <DialogDescription>
                  Agrega un nuevo ingeniero o técnico a tu organización
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="member-name">Nombre Completo</Label>
                    <Input id="member-name" placeholder="Ing. Nombre Apellido" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="member-email">Email</Label>
                    <Input id="member-email" type="email" placeholder="nombre@ejemplo.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="member-phone">Teléfono</Label>
                    <Input id="member-phone" type="tel" placeholder="+52 55 1234 5678" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="member-role">Rol</Label>
                    <Select>
                      <SelectTrigger id="member-role">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="senior">Ingeniero Senior</SelectItem>
                        <SelectItem value="engineer">Ingeniero</SelectItem>
                        <SelectItem value="tech">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="member-specialization">Especialización</Label>
                  <Input id="member-specialization" placeholder="Ej. Diseño Estructural, Análisis Sísmico" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Enviar Invitación
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Información de la Organización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nombre</p>
              <p className="text-gray-900">{organizationInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tipo</p>
              <p className="text-gray-900">{organizationInfo.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Ubicación</p>
              <p className="text-gray-900">{organizationInfo.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Miembros del Equipo</p>
              <p className="text-gray-900">{organizationInfo.members} ingenieros</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Proyectos Activos</p>
              <p className="text-gray-900">{organizationInfo.activeProjects} proyectos</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Plan</p>
              <Badge className="bg-purple-100 text-purple-700">{organizationInfo.plan}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Miembros</p>
                <p className="text-2xl text-gray-900">{teamMembers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Administradores</p>
                <p className="text-2xl text-gray-900">
                  {teamMembers.filter(m => m.role === 'Administrador').length}
                </p>
              </div>
              <Crown className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ingenieros</p>
                <p className="text-2xl text-gray-900">
                  {teamMembers.filter(m => m.role === 'Ingeniero' || m.role === 'Ingeniero Senior').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Técnicos</p>
                <p className="text-2xl text-gray-900">
                  {teamMembers.filter(m => m.role === 'Técnico').length}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
          <TabsTrigger value="engineers">Ingenieros</TabsTrigger>
          <TabsTrigger value="technicians">Técnicos</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{member.name}</CardTitle>
                          {getRoleIcon(member.role)}
                        </div>
                        <Badge className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Especialización</p>
                      <p className="text-sm text-gray-900">{member.specialization}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Proyectos</p>
                        <p className="text-gray-900">{member.projectsCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Tareas</p>
                        <p className="text-gray-900">{member.tasksCount}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 pt-2">
                      Miembro desde {new Date(member.joinDate).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="admins">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamMembers
              .filter(m => m.role === 'Administrador')
              .map((member) => (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <p className="text-sm text-gray-500">{member.specialization}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="engineers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamMembers
              .filter(m => m.role === 'Ingeniero' || m.role === 'Ingeniero Senior')
              .map((member) => (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{member.name}</CardTitle>
                          <Badge className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{member.specialization}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="text-gray-600 mb-1">Proyectos</p>
                          <p className="text-gray-900">{member.projectsCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Tareas</p>
                          <p className="text-gray-900">{member.tasksCount}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="technicians">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamMembers
              .filter(m => m.role === 'Técnico')
              .map((member) => (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <p className="text-sm text-gray-500">{member.specialization}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
