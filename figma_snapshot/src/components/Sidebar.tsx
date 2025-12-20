import { Building2, LayoutDashboard, FolderKanban, ClipboardCheck, Activity, Brain, Ruler, DollarSign, CheckSquare, Users } from 'lucide-react';
import type { ViewType } from '../App';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as ViewType, label: 'Proyectos', icon: FolderKanban },
    { id: 'tasks' as ViewType, label: 'Tareas', icon: CheckSquare },
    { id: 'inspections' as ViewType, label: 'Inspecciones', icon: ClipboardCheck },
    { id: 'monitoring' as ViewType, label: 'Monitoreo', icon: Activity },
    { id: 'ml-analysis' as ViewType, label: 'Análisis ML', icon: Brain },
    { id: 'structural-design' as ViewType, label: 'Diseño Estructural', icon: Ruler },
    { id: 'finances' as ViewType, label: 'Finanzas', icon: DollarSign },
    { id: 'team' as ViewType, label: 'Equipo', icon: Users },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-gray-900">StructureFlow</h1>
            <p className="text-xs text-gray-500">Ingeniería Estructural</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-700">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">Ing. Juan Pérez</p>
            <p className="text-xs text-gray-500 truncate">ingeniero@ejemplo.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}