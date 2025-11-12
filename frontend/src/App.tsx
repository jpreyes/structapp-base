import { Route, Routes } from "react-router-dom";

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
import SubscriptionPage from "./pages/SubscriptionPage";
import ProjectDesignBasesPage from "./pages/ProjectDesignBasesPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projects/calculations" element={<ProjectCalculationsPage />} />
          <Route path="/projects/bases" element={<ProjectDesignBasesPage />} />
          <Route path="/projects/documentation" element={<ProjectDocumentationPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
        </Route>
        <Route path="/subscribe" element={<SubscriptionPage />} />
      </Route>
    </Routes>
  );
}

export default App;

