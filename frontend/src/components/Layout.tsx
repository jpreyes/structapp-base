import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Switch,
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
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, ReactNode } from "react";
import { useTheme } from "@mui/material/styles";

import { useThemeStore } from "../store/useTheme";
import { useSession } from "../store/useSession";

const drawerWidth = 280;

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
  const token = useSession((state) => state.token);
  const setToken = useSession((state) => state.setToken);
  const setUser = useSession((state) => state.setUser);
  const themeMode = useThemeStore((state) => state.mode);

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
      {
        label: "Inspecciones y ensayos",
        icon: <FactCheckIcon />,
        path: "/projects/inspections",
        requiresAuth: true,
        indent: true,
      },
      { label: "Tareas", icon: <AssignmentIcon />, path: "/tasks", requiresAuth: true },
      { label: "Finanzas", icon: <PaymentIcon />, path: "/payments", requiresAuth: true },
      { label: "Configuración", icon: <SettingsIcon />, path: "/settings", requiresAuth: true },
      { label: "Login", icon: <LoginIcon />, path: "/login", showWhenLoggedOut: true },
    ],
    []
  );

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2, gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 1,
          py: 1.5,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === "light" ? "#ffffff" : theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: "#fff",
          }}
        >
          <ArchitectureIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            StructApp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión estructural
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List disablePadding>
        {navItems
          .filter((item) => (item.showWhenLoggedOut ? !token : true))
          .map((item) => {
            if (isSectionItem(item)) {
              return (
                <ListItemText
                  key={`section-${item.label}`}
                  primary={
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ pl: 2, pt: 2, pb: 0.5, display: "block", letterSpacing: 0.4 }}
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
                sx={{
                  px: 1.5,
                  py: 1,
                  gap: 1,
                  alignItems: "center",
                  borderRadius: 2,
                  position: "relative",
                  border: selected ? `1px solid ${theme.palette.divider}` : "1px solid transparent",
                  transition: "all 0.2s ease",
                  pl: item.indent ? 4 : 2,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: selected ? 700 : 600,
                    color: selected ? "primary.main" : undefined,
                  }}
                />
              </ListItemButton>
            );
          })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 1 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Switch
              color="primary"
              onChange={() => useThemeStore.getState().toggle()}
              checked={themeMode === "dark"}
            />
            <Box>
              <Typography variant="body2" fontWeight={700}>
                Tema {themeMode === "light" ? "claro" : "oscuro"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cambia el contraste según la iluminación.
              </Typography>
            </Box>
          </Stack>
          <Button
            variant={token ? "outlined" : "contained"}
            color="primary"
            fullWidth
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
            {token ? "Cerrar sesión" : "Iniciar sesión"}
          </Button>
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="h6" noWrap component="div">
              Panel estructural
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Controla proyectos, tareas y finanzas en un solo espacio.
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" alignItems="center" spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                  onChange={() => useThemeStore.getState().toggle()}
                  checked={themeMode === "dark"}
                />
              }
              label="Tema"
            />
            <Button
              variant="contained"
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
              {token ? "Cerrar sesión" : "Iniciar sesión"}
            </Button>
          </Stack>
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
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
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
