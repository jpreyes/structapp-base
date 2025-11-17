import { SyntheticEvent, useEffect, useMemo } from "react";
import { Box, Breadcrumbs, Link, Tab, Tabs, Typography } from "@mui/material";
import { Link as RouterLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";

import { useSession } from "../store/useSession";

const tabItems = [
  { value: "overview", label: "Descripción", path: "" },
  { value: "calculations", label: "Cálculos", path: "calculations" },
  { value: "bases", label: "Bases de cálculo", path: "bases" },
  { value: "inspections", label: "Inspecciones", path: "inspections" },
  { value: "documentation", label: "Documentación", path: "documentation" },
] as const;

const ProjectWorkspacePage = () => {
  const { projectId } = useParams<{ projectId: string }>();
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

  const handleTabChange = (_: SyntheticEvent, value: string) => {
    if (!projectId) return;
    const target = tabItems.find((tab) => tab.value === value);
    if (!target) return;
    const basePath = `/projects/${projectId}`;
    const destination = target.path ? `${basePath}/${target.path}` : basePath;
    navigate(destination);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <Link component={RouterLink} to="/projects" color="inherit" underline="hover">
          Proyectos
        </Link>
        <Typography color="text.primary">Workspace</Typography>
      </Breadcrumbs>

      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {tabItems.map((tab) => (
          <Tab key={tab.value} value={tab.value} label={tab.label} />
        ))}
      </Tabs>

      <Box sx={{ mt: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default ProjectWorkspacePage;
