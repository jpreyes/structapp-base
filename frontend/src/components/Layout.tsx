import {
  AppBar,
  Box,
  Breadcrumbs,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Switch,
  Tooltip,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/SpaceDashboardRounded";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";
import PaymentIcon from "@mui/icons-material/Payments";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import CalculateIcon from "@mui/icons-material/Calculate";
import DescriptionIcon from "@mui/icons-material/Description";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LoginIcon from "@mui/icons-material/Login";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, ReactNode } from "react";
import { useTheme } from "@mui/material/styles";

import { useThemeStore } from "../store/useTheme";
import { useSession } from "../store/useSession";

const expandedDrawerWidth = 280;
const collapsedDrawerWidth = 88;

type NavItem =
  | {
      label: string;
      path?: string;
      icon?: ReactNode;
      requiresAuth?: boolean;
      indent?: boolean;
      showWhenLoggedOut?: boolean;
      isSection?: false;
    }
  | {
      label: string;
      requiresAuth?: boolean;
      showWhenLoggedOut?: boolean;
      isSection: true;
    };

const isSectionItem = (item: NavItem): item is Extract<NavItem, { isSection: true }> =>
  item.isSection === true;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const token = useSession((state) => state.token);
  const setToken = useSession((state) => state.setToken);
  const setUser = useSession((state) => state.setUser);
  const user = useSession((state) => state.user);
  const themeMode = useThemeStore((state) => state.mode);
  const currentDrawerWidth = isCollapsed ? collapsedDrawerWidth : expandedDrawerWidth;

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Dashboard", icon: <DashboardIcon />, path: "/", requiresAuth: true },
      { label: "Proyectos", isSection: true, requiresAuth: true },
      {
        label: "Listado",
        icon: <FolderIcon />,
        path: "/projects",
        requiresAuth: true,
        indent: true,
      },
      {
        label: "Calculos de proyecto",
        icon: <CalculateIcon />,
        path: "/projects/calculations",
        requiresAuth: true,
        indent: true,
      },
      {
        label: "Bases de calculo",
        icon: <ArchitectureIcon />,
        path: "/projects/bases",
        requiresAuth: true,
        indent: true,
      },
      {
        label: "Documentacion",
        icon: <DescriptionIcon />,
        path: "/projects/documentation",
        requiresAuth: true,
        indent: true,
      },
      {
        label: "Inspecciones y ensayos",
        icon: <FactCheckIcon />,
        path: "/projects/inspections",
        requiresAuth: true,
        indent: true,
      },
      { label: "Tareas", icon: <AssignmentIcon />, path: "/tasks", requiresAuth: true },
      { label: "Finanzas", icon: <PaymentIcon />, path: "/payments", requiresAuth: true },
      // { label: "Perfil", icon: <SettingsIcon />, path: "/settings", requiresAuth: true },
      { label: "Login", icon: <LoginIcon />, path: "/login", showWhenLoggedOut: true },
    ],
    []
  );

  const pageContext = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/projects")) {
      return {
        title: "Proyectos",
        subtitle: "Planifica, calcula y documenta los proyectos activos.",
        ctaLabel: "Nuevo proyecto",
        ctaPath: "/projects",
      };
    }
    if (path.startsWith("/tasks")) {
      return {
        title: "Tareas",
        subtitle: "Seguimiento de pendientes y asignaciones del equipo.",
        ctaLabel: "Nueva tarea",
        ctaPath: "/tasks",
      };
    }
    if (path.startsWith("/payments")) {
      return {
        title: "Finanzas",
        subtitle: "Flujo de caja, pagos y cobranzas al dia.",
        ctaLabel: "Nuevo pago",
        ctaPath: "/payments",
      };
    }
    if (path.startsWith("/settings")) {
      return {
        title: "Configuracion",
        subtitle: "Preferencias de cuenta, equipo y accesos.",
      };
    }
    return {
      title: "Dashboard",
      subtitle: "Controla proyectos, tareas y finanzas en un solo espacio.",
      ctaLabel: "Nuevo proyecto",
      ctaPath: "/projects",
    };
  }, [location.pathname]);

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2, gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          position: "relative",
          justifyContent: isCollapsed ? "center" : "flex-start",
          gap: isCollapsed ? 1 : 1.5,
          px: isCollapsed ? 0.75 : 1,
          py: 1.25,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === "light" ? "#ffffff" : theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: isCollapsed ? 1 : 1.5 }}>
          <Box
            sx={{
              width: isCollapsed ? 40 : 44,
              height: isCollapsed ? 40 : 44,
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              color: "#fff",
            }}
          >
            <ArchitectureIcon fontSize="small" />
          </Box>
          {!isCollapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700}>
                Métrica
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestión estructural
              </Typography>
            </Box>
          )}
        </Box>
        <Tooltip title={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}>
          <IconButton
            size="small"
            onClick={() => setIsCollapsed((prev) => !prev)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor:
                theme.palette.mode === "light" ? "#f8fafc" : theme.palette.background.paper,
            }}
          >
            {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <List disablePadding>
        {navItems
          .filter((item) => (item.showWhenLoggedOut ? !token : true))
          .map((item) => {
            if (isSectionItem(item)) {
              return isCollapsed ? (
                <Divider key={`section-${item.label}`} sx={{ my: 1.5 }} />
              ) : (
                <ListItemText
                  key={`section-${item.label}`}
                  primary={
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{
                        pl: 2,
                        pt: 2,
                        pb: 0.5,
                        display: "block",
                        letterSpacing: 0.6,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                />
              );
            }
            const selected =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
            const button = (
              <ListItemButton
                key={item.path}
                selected={selected}
                disabled={item.requiresAuth && !token}
                onClick={() => {
                  if (!item.path) {
                    return;
                  }
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  px: isCollapsed ? 1 : 1.5,
                  py: 1.1,
                  gap: isCollapsed ? 0 : 1,
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  borderRadius: 2,
                  position: "relative",
                  border: selected ? `1px solid ${theme.palette.divider}` : "1px solid transparent",
                  transition: "all 0.2s ease",
                  pl: isCollapsed ? 1 : item.indent ? 4 : 2,
                  backgroundColor: selected
                    ? theme.palette.mode === "light"
                      ? "rgba(37,99,235,0.08)"
                      : "rgba(37,99,235,0.16)"
                    : "transparent",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: isCollapsed ? 0 : 40,
                    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: selected ? 700 : 600,
                      color: selected ? "primary.main" : undefined,
                    }}
                  />
                )}
              </ListItemButton>
            );
            return isCollapsed ? (
              <Tooltip key={item.path} title={item.label} placement="right">
                {button}
              </Tooltip>
            ) : (
              button
            );
          })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 1 }}>
        <Stack spacing={1.25} alignItems={isCollapsed ? "center" : "flex-start"}>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={!isCollapsed ? <SettingsIcon /> : undefined}
            onClick={() => {
              navigate("/settings");
              setMobileOpen(false);
            }}
          >
            {isCollapsed ? <SettingsIcon fontSize="small" /> : "Perfil"}
          </Button>
          <Box sx={{ width: "100%", textAlign: isCollapsed ? "center" : "left" }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {user?.email ?? "usuario@structapp"}
            </Typography>
            {!isCollapsed && (
              <Typography variant="caption" color="text.secondary">
                Acceso de solo lectura
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", background: theme.palette.background.default }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: 68 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
            <Breadcrumbs
              aria-label="breadcrumb"
              sx={{ color: "text.secondary", fontSize: 12, letterSpacing: 0.4 }}
            >
              <Typography color="text.secondary">Inicio</Typography>
              <Typography color="text.primary">{pageContext.title}</Typography>
            </Breadcrumbs>
            <Typography variant="h6" noWrap component="div">
              {pageContext.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {pageContext.subtitle}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" alignItems="center" spacing={2}>
            {pageContext.ctaLabel && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  if (pageContext.ctaPath) {
                    navigate(pageContext.ctaPath);
                  }
                }}
              >
                {pageContext.ctaLabel}
              </Button>
            )}
            <Switch
              color="primary"
              onChange={() => useThemeStore.getState().toggle()}
              checked={themeMode === "dark"}
              inputProps={{ "aria-label": "Cambiar tema" }}
            />
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                if (token) {
                  setToken(null);
                  setUser(undefined);
                  navigate("/login");
                } else {
                  navigate("/login");
                }
              }}
            >
              {token ? "Cerrar sesion" : "Iniciar sesion"}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: currentDrawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: currentDrawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 4 },
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(180deg,#f7f9fd 0%,#eef2ff 60%,#f7f9fd 100%)"
              : "none",
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
