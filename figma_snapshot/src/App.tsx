import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectsView } from './components/ProjectsView';
import { InspectionsView } from './components/InspectionsView';
import { MonitoringView } from './components/MonitoringView';
import { MLAnalysisView } from './components/MLAnalysisView';
import { StructuralDesignView } from './components/StructuralDesignView';
import { FinancesView } from './components/FinancesView';
import { TasksView } from './components/TasksView';
import { TeamView } from './components/TeamView';

export type ViewType = 'dashboard' | 'projects' | 'inspections' | 'monitoring' | 'ml-analysis' | 'structural-design' | 'finances' | 'tasks' | 'team';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <ProjectsView />;
      case 'inspections':
        return <InspectionsView />;
      case 'monitoring':
        return <MonitoringView />;
      case 'ml-analysis':
        return <MLAnalysisView />;
      case 'structural-design':
        return <StructuralDesignView />;
      case 'finances':
        return <FinancesView />;
      case 'tasks':
        return <TasksView />;
      case 'team':
        return <TeamView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
}