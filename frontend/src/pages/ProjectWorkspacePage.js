import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from "react";
import { Box, Breadcrumbs, Link, Tab, Tabs, Typography } from "@mui/material";
import { Link as RouterLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../store/useSession";
const tabItems = [
    { value: "overview", label: "Descripción", path: "" },
    { value: "calculations", label: "Cálculos", path: "calculations" },
    { value: "bases", label: "Bases de cálculo", path: "bases" },
    { value: "inspections", label: "Inspecciones", path: "inspections" },
    { value: "documentation", label: "Documentación", path: "documentation" },
];
const ProjectWorkspacePage = () => {
    const { projectId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const setProjectInSession = useSession((state) => state.setProject);
    useEffect(() => {
        if (projectId) {
            setProjectInSession(projectId);
        }
    }, [projectId, setProjectInSession]);
    const currentTab = useMemo(() => {
        if (!projectId) {
            return tabItems[0].value;
        }
        const basePath = `/projects/${projectId}`;
        const match = tabItems.find((tab) => {
            if (!tab.path) {
                return location.pathname === basePath || location.pathname === `${basePath}/` || location.pathname.endsWith("/overview");
            }
            return location.pathname.startsWith(`${basePath}/${tab.path}`);
        });
        return match?.value ?? tabItems[0].value;
    }, [location.pathname, projectId]);
    const handleTabChange = (_, value) => {
        if (!projectId)
            return;
        const target = tabItems.find((tab) => tab.value === value);
        if (!target)
            return;
        const basePath = `/projects/${projectId}`;
        const destination = target.path ? `${basePath}/${target.path}` : basePath;
        navigate(destination);
    };
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Breadcrumbs, { children: [_jsx(Link, { component: RouterLink, to: "/projects", color: "inherit", underline: "hover", children: "Proyectos" }), _jsx(Typography, { color: "text.primary", children: "Workspace" })] }), _jsx(Tabs, { value: currentTab, onChange: handleTabChange, variant: "scrollable", scrollButtons: "auto", sx: { borderBottom: 1, borderColor: "divider" }, children: tabItems.map((tab) => (_jsx(Tab, { value: tab.value, label: tab.label }, tab.value))) }), _jsx(Box, { sx: { mt: 1 }, children: _jsx(Outlet, {}) })] }));
};
export default ProjectWorkspacePage;
