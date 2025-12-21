import { Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import TasksPage from "./pages/TasksPage";
import PaymentsPage from "./pages/PaymentsPage";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectCalculationsPage from "./pages/ProjectCalculationsPage";
import ProjectDocumentationPage from "./pages/ProjectDocumentationPage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import ProjectDesignBasesPage from "./pages/ProjectDesignBasesPage";
import ProjectInspectionsPage from "./pages/ProjectInspectionsPage";
import ProjectWorkspacePage from "./pages/ProjectWorkspacePage";
import InspectionDetailPage from "./pages/InspectionDetailPage";
import { useSession } from "./store/useSession";

const ProjectModuleRedirect = ({ module }: { module: string }) => {
  const projectId = useSession((state) => state.projectId);
  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }
  return <Navigate to={`/projects/${projectId}/${module}`} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/*" element={<ProjectWorkspacePage />}>
            <Route index element={<ProjectDetailPage />} />
            <Route path="overview" element={<ProjectDetailPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="calculations" element={<ProjectCalculationsPage />} />
            <Route path="bases" element={<ProjectDesignBasesPage />} />
            <Route path="inspections" element={<ProjectInspectionsPage />} />
            <Route path="inspections/:inspectionId" element={<InspectionDetailPage />} />
            <Route path="documentation" element={<ProjectDocumentationPage />} />
          </Route>
          <Route
            path="/projects/calculations"
            element={<ProjectModuleRedirect module="calculations" />}
          />
          <Route path="/projects/bases" element={<ProjectModuleRedirect module="bases" />} />
          <Route
            path="/projects/documentation"
            element={<ProjectModuleRedirect module="documentation" />}
          />
          <Route
            path="/projects/inspections"
            element={<ProjectModuleRedirect module="inspections" />}
          />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

