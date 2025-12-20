import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppBar, Box, Breadcrumbs, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Switch, Tooltip, Toolbar, Typography, } from "@mui/material";
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
import { useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { useThemeStore } from "../store/useTheme";
import { useSession } from "../store/useSession";
const expandedDrawerWidth = 280;
const collapsedDrawerWidth = 88;
const isSectionItem = (item) => item.isSection === true;
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
    const navItems = useMemo(() => [
        { label: "Dashboard", icon: _jsx(DashboardIcon, {}), path: "/", requiresAuth: true },
        { label: "Proyectos", isSection: true, requiresAuth: true },
        {
            label: "Listado",
            icon: _jsx(FolderIcon, {}),
            path: "/projects",
            requiresAuth: true,
            indent: true,
        },
        {
            label: "Calculos de proyecto",
            icon: _jsx(CalculateIcon, {}),
            path: "/projects/calculations",
            requiresAuth: true,
            indent: true,
        },
        {
            label: "Bases de calculo",
            icon: _jsx(ArchitectureIcon, {}),
            path: "/projects/bases",
            requiresAuth: true,
            indent: true,
        },
        {
            label: "Documentacion",
            icon: _jsx(DescriptionIcon, {}),
            path: "/projects/documentation",
            requiresAuth: true,
            indent: true,
        },
        {
            label: "Inspecciones y ensayos",
            icon: _jsx(FactCheckIcon, {}),
            path: "/projects/inspections",
            requiresAuth: true,
            indent: true,
        },
        { label: "Tareas", icon: _jsx(AssignmentIcon, {}), path: "/tasks", requiresAuth: true },
        { label: "Finanzas", icon: _jsx(PaymentIcon, {}), path: "/payments", requiresAuth: true },
        // { label: "Perfil", icon: <SettingsIcon />, path: "/settings", requiresAuth: true },
        { label: "Login", icon: _jsx(LoginIcon, {}), path: "/login", showWhenLoggedOut: true },
    ], []);
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
    const drawerContent = (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", height: "100%", p: 2, gap: 2 }, children: [_jsxs(Box, { sx: {
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
                }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: isCollapsed ? 1 : 1.5 }, children: [_jsx(Box, { sx: {
                                    width: isCollapsed ? 40 : 44,
                                    height: isCollapsed ? 40 : 44,
                                    display: "grid",
                                    placeItems: "center",
                                    borderRadius: 2,
                                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    color: "#fff",
                                }, children: _jsx(ArchitectureIcon, { fontSize: "small" }) }), !isCollapsed && (_jsxs(Box, { sx: { minWidth: 0 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 700, children: "M\u00E9trica" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Gesti\u00F3n estructural" })] }))] }), _jsx(Tooltip, { title: isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral", children: _jsx(IconButton, { size: "small", onClick: () => setIsCollapsed((prev) => !prev), sx: {
                                position: "absolute",
                                top: 8,
                                right: 8,
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                border: `1px solid ${theme.palette.divider}`,
                                backgroundColor: theme.palette.mode === "light" ? "#f8fafc" : theme.palette.background.paper,
                            }, children: isCollapsed ? _jsx(ChevronRightIcon, { fontSize: "small" }) : _jsx(ChevronLeftIcon, { fontSize: "small" }) }) })] }), _jsx(Divider, {}), _jsx(List, { disablePadding: true, children: navItems
                    .filter((item) => (item.showWhenLoggedOut ? !token : true))
                    .map((item) => {
                    if (isSectionItem(item)) {
                        return isCollapsed ? (_jsx(Divider, { sx: { my: 1.5 } }, `section-${item.label}`)) : (_jsx(ListItemText, { primary: _jsx(Typography, { variant: "overline", color: "text.secondary", sx: {
                                    pl: 2,
                                    pt: 2,
                                    pb: 0.5,
                                    display: "block",
                                    letterSpacing: 0.6,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                }, children: item.label }) }, `section-${item.label}`));
                    }
                    const selected = location.pathname === item.path ||
                        (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
                    const button = (_jsxs(ListItemButton, { selected: selected, disabled: item.requiresAuth && !token, onClick: () => {
                            if (!item.path) {
                                return;
                            }
                            navigate(item.path);
                            setMobileOpen(false);
                        }, sx: {
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
                        }, children: [_jsx(ListItemIcon, { sx: {
                                    minWidth: isCollapsed ? 0 : 40,
                                    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
                                    justifyContent: "center",
                                }, children: item.icon }), !isCollapsed && (_jsx(ListItemText, { primary: item.label, primaryTypographyProps: {
                                    fontWeight: selected ? 700 : 600,
                                    color: selected ? "primary.main" : undefined,
                                } }))] }, item.path));
                    return isCollapsed ? (_jsx(Tooltip, { title: item.label, placement: "right", children: button }, item.path)) : (button);
                }) }), _jsx(Box, { sx: { flexGrow: 1 } }), _jsx(Divider, {}), _jsx(Box, { sx: { p: 1 }, children: _jsxs(Stack, { spacing: 1.25, alignItems: isCollapsed ? "center" : "flex-start", children: [_jsx(Button, { variant: "outlined", color: "primary", fullWidth: true, startIcon: !isCollapsed ? _jsx(SettingsIcon, {}) : undefined, onClick: () => {
                                navigate("/settings");
                                setMobileOpen(false);
                            }, children: isCollapsed ? _jsx(SettingsIcon, { fontSize: "small" }) : "Perfil" }), _jsxs(Box, { sx: { width: "100%", textAlign: isCollapsed ? "center" : "left" }, children: [_jsx(Typography, { variant: "body2", fontWeight: 700, noWrap: true, children: user?.email ?? "usuario@structapp" }), !isCollapsed && (_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Acceso de solo lectura" }))] })] }) })] }));
    return (_jsxs(Box, { sx: { display: "flex", background: theme.palette.background.default }, children: [_jsx(AppBar, { position: "fixed", sx: {
                    zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
                    width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
                    ml: { sm: `${currentDrawerWidth}px` },
                }, children: _jsxs(Toolbar, { sx: { minHeight: 68 }, children: [_jsx(IconButton, { color: "inherit", edge: "start", onClick: () => setMobileOpen(!mobileOpen), sx: { mr: 2, display: { sm: "none" } }, children: _jsx(MenuIcon, {}) }), _jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }, children: [_jsxs(Breadcrumbs, { "aria-label": "breadcrumb", sx: { color: "text.secondary", fontSize: 12, letterSpacing: 0.4 }, children: [_jsx(Typography, { color: "text.secondary", children: "Inicio" }), _jsx(Typography, { color: "text.primary", children: pageContext.title })] }), _jsx(Typography, { variant: "h6", noWrap: true, component: "div", children: pageContext.title }), _jsx(Typography, { variant: "body2", color: "text.secondary", noWrap: true, children: pageContext.subtitle })] }), _jsx(Box, { sx: { flexGrow: 1 } }), _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [pageContext.ctaLabel && (_jsx(Button, { variant: "contained", color: "primary", onClick: () => {
                                        if (pageContext.ctaPath) {
                                            navigate(pageContext.ctaPath);
                                        }
                                    }, children: pageContext.ctaLabel })), _jsx(Switch, { color: "primary", onChange: () => useThemeStore.getState().toggle(), checked: themeMode === "dark", inputProps: { "aria-label": "Cambiar tema" } }), _jsx(Button, { variant: "outlined", color: "secondary", onClick: () => {
                                        if (token) {
                                            setToken(null);
                                            setUser(undefined);
                                            navigate("/login");
                                        }
                                        else {
                                            navigate("/login");
                                        }
                                    }, children: token ? "Cerrar sesion" : "Iniciar sesion" })] })] }) }), _jsxs(Box, { component: "nav", sx: { width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }, children: [_jsx(Drawer, { variant: "temporary", open: mobileOpen, onClose: () => setMobileOpen(false), ModalProps: { keepMounted: true }, sx: {
                            display: { xs: "block", sm: "none" },
                            "& .MuiDrawer-paper": { boxSizing: "border-box", width: currentDrawerWidth },
                        }, children: drawerContent }), _jsx(Drawer, { variant: "permanent", sx: {
                            display: { xs: "none", sm: "block" },
                            "& .MuiDrawer-paper": { boxSizing: "border-box", width: currentDrawerWidth },
                        }, open: true, children: drawerContent })] }), _jsxs(Box, { component: "main", sx: {
                    flexGrow: 1,
                    p: { xs: 2.5, md: 4 },
                    width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
                    background: theme.palette.mode === "light"
                        ? "linear-gradient(180deg,#f7f9fd 0%,#eef2ff 60%,#f7f9fd 100%)"
                        : "none",
                    minHeight: "100vh",
                }, children: [_jsx(Toolbar, {}), _jsx(Outlet, {})] })] }));
};
export default Layout;
