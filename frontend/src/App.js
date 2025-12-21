import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const ProjectModuleRedirect = ({ module }) => {
    const projectId = useSession((state) => state.projectId);
    if (!projectId) {
        return _jsx(Navigate, { to: "/projects", replace: true });
    }
    return _jsx(Navigate, { to: `/projects/${projectId}/${module}`, replace: true });
};
function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { element: _jsx(Layout, {}), children: _jsxs(Route, { element: _jsx(RequireAuth, {}), children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "/projects", element: _jsx(ProjectsPage, {}) }), _jsxs(Route, { path: "/projects/:projectId/*", element: _jsx(ProjectWorkspacePage, {}), children: [_jsx(Route, { index: true, element: _jsx(ProjectDetailPage, {}) }), _jsx(Route, { path: "overview", element: _jsx(ProjectDetailPage, {}) }), _jsx(Route, { path: "tasks", element: _jsx(TasksPage, {}) }), _jsx(Route, { path: "calculations", element: _jsx(ProjectCalculationsPage, {}) }), _jsx(Route, { path: "bases", element: _jsx(ProjectDesignBasesPage, {}) }), _jsx(Route, { path: "inspections", element: _jsx(ProjectInspectionsPage, {}) }), _jsx(Route, { path: "inspections/:inspectionId", element: _jsx(InspectionDetailPage, {}) }), _jsx(Route, { path: "documentation", element: _jsx(ProjectDocumentationPage, {}) })] }), _jsx(Route, { path: "/projects/calculations", element: _jsx(ProjectModuleRedirect, { module: "calculations" }) }), _jsx(Route, { path: "/projects/bases", element: _jsx(ProjectModuleRedirect, { module: "bases" }) }), _jsx(Route, { path: "/projects/documentation", element: _jsx(ProjectModuleRedirect, { module: "documentation" }) }), _jsx(Route, { path: "/projects/inspections", element: _jsx(ProjectModuleRedirect, { module: "inspections" }) }), _jsx(Route, { path: "/tasks", element: _jsx(TasksPage, {}) }), _jsx(Route, { path: "/payments", element: _jsx(PaymentsPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "/subscription", element: _jsx(SubscriptionPage, {}) })] }) })] }));
}
export default App;
