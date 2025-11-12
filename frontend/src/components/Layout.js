import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, FormControlLabel, Switch } from "@mui/material";
import DashboardIcon from "@mui/icons-material/SpaceDashboardRounded";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";
import PaymentIcon from "@mui/icons-material/Payments";
import MenuIcon from "@mui/icons-material/Menu";
import CalculateIcon from "@mui/icons-material/Calculate";
import DescriptionIcon from "@mui/icons-material/Description";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import LoginIcon from "@mui/icons-material/Login";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/useTheme";
import { useMemo, useState } from "react";
import { useSession } from "../store/useSession";
const drawerWidth = 240;
const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const token = useSession((state) => state.token);
    const navItems = useMemo(() => [
        { label: "Dashboard", icon: _jsx(DashboardIcon, {}), path: "/", requiresAuth: true },
        { label: "Proyectos", icon: _jsx(FolderIcon, {}), path: "/projects", requiresAuth: true },
        {
            label: "Cálculos de proyecto",
            icon: _jsx(CalculateIcon, {}),
            path: "/projects/calculations",
            requiresAuth: true,
            indent: true,
        },
        {
            label: "Bases de cálculo",
            icon: _jsx(ArchitectureIcon, {}),
            path: "/projects/bases",
            requiresAuth: true,
            indent: true,
        },
        {
            label: "Documentación",
            icon: _jsx(DescriptionIcon, {}),
            path: "/projects/documentation",
            requiresAuth: true,
            indent: true,
        },
        { label: "Tareas", icon: _jsx(AssignmentIcon, {}), path: "/tasks", requiresAuth: true },
        { label: "Finanzas", icon: _jsx(PaymentIcon, {}), path: "/payments", requiresAuth: true },
        { label: "Login", icon: _jsx(LoginIcon, {}), path: "/login", showWhenLoggedOut: true },
    ], []);
    const drawerContent = (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", height: "100%" }, children: [_jsxs(Box, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 600, children: "StructApp" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Gestion estructural" })] }), _jsx(Divider, {}), _jsxs(List, { children: [_jsxs(ListItemButton, { selected: location.pathname === "/subscribe", onClick: () => navigate("/subscribe"), sx: { mt: 1 }, children: [_jsx(ListItemIcon, { children: _jsx(PaymentIcon, {}) }), _jsx(ListItemText, { primary: "Suscripci\u00F3n" })] }), navItems
                        .filter((item) => (item.showWhenLoggedOut ? !token : true))
                        .map((item) => {
                        const selected = location.pathname === item.path ||
                            (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
                        return (_jsxs(ListItemButton, { selected: selected, disabled: item.requiresAuth && !token, onClick: () => {
                                if (!item.path) {
                                    return;
                                }
                                navigate(item.path);
                                setMobileOpen(false);
                            }, sx: { pl: item.indent ? 4 : 2 }, children: [_jsx(ListItemIcon, { children: item.icon }), _jsx(ListItemText, { primary: item.label })] }, item.path));
                    })] }), _jsx(Box, { sx: { flexGrow: 1 } })] }));
    return (_jsxs(Box, { sx: { display: "flex" }, children: [_jsx(AppBar, { position: "fixed", sx: { zIndex: (theme) => theme.zIndex.drawer + 1 }, children: _jsxs(Toolbar, { children: [_jsx(IconButton, { color: "inherit", edge: "start", onClick: () => setMobileOpen(!mobileOpen), sx: { mr: 2, display: { sm: "none" } }, children: _jsx(MenuIcon, {}) }), _jsx(Typography, { variant: "h6", noWrap: true, component: "div", children: "StructApp" }), _jsx(Box, { sx: { flexGrow: 1 } }), _jsx(FormControlLabel, { control: _jsx(Switch, { color: "default", onChange: () => useThemeStore.getState().toggle() }), label: "Tema" })] }) }), _jsxs(Box, { component: "nav", sx: { width: { sm: drawerWidth }, flexShrink: { sm: 0 } }, children: [_jsx(Drawer, { variant: "temporary", open: mobileOpen, onClose: () => setMobileOpen(false), ModalProps: { keepMounted: true }, sx: {
                            display: { xs: "block", sm: "none" },
                            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
                        }, children: drawerContent }), _jsx(Drawer, { variant: "permanent", sx: {
                            display: { xs: "none", sm: "block" },
                            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
                        }, open: true, children: drawerContent })] }), _jsxs(Box, { component: "main", sx: { flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }, children: [_jsx(Toolbar, {}), _jsx(Outlet, {})] })] }));
};
export default Layout;
