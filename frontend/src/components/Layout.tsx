import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  FormControlLabel,
  Switch
} from "@mui/material";
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
import { useMemo, useState, ReactNode } from "react";

import { useSession } from "../store/useSession";

const drawerWidth = 240;

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const token = useSession((state) => state.token);

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
        label: "Cálculos de proyecto",
        icon: <CalculateIcon />,
        path: "/projects/calculations",
        requiresAuth: true,
        indent: true,
      },
      {
        label: "Bases de cálculo",
        icon: <ArchitectureIcon />,
        path: "/projects/bases",
        requiresAuth: true,
        indent: true,
      },
      {
        label: "Documentación",
        icon: <DescriptionIcon />,
        path: "/projects/documentation",
        requiresAuth: true,
        indent: true,
      },
      { label: "Tareas", icon: <AssignmentIcon />, path: "/tasks", requiresAuth: true },
      { label: "Finanzas", icon: <PaymentIcon />, path: "/payments", requiresAuth: true },
      { label: "Login", icon: <LoginIcon />, path: "/login", showWhenLoggedOut: true },
    ],
    []
  );

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          StructApp
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestion estructural
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems
          .filter((item) => (item.showWhenLoggedOut ? !token : true))
          .map((item) => {
            if (isSectionItem(item)) {
              if (item.requiresAuth && !token) {
                return null;
              }
              return (
                <ListItemText
                  key={`section-${item.label}`}
                  primary={
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ pl: 2, pt: 2, pb: 0.5, display: "block" }}
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
            return (
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
                sx={{ pl: item.indent ? 4 : 2 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <List>
        <ListItemButton
          selected={location.pathname === "/subscribe"}
          onClick={() => {
            navigate("/subscribe");
            setMobileOpen(false);
          }}
          sx={{ mt: 1 }}
        >
          <ListItemIcon>
            <PaymentIcon />
          </ListItemIcon>
          <ListItemText primary="Suscripción" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            StructApp
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <FormControlLabel
            control={
              <Switch
                color="default"
                onChange={() => useThemeStore.getState().toggle()}
              />
            }
            label="Tema"
          />
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
