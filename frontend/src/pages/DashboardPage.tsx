import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useTheme } from "@mui/material/styles";

import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { useSession } from "../store/useSession";
import { useNavigate } from "react-router-dom";

type StatCardProps = {
  title: string;
  value: string;
  helper?: string;
  icon: React.ReactNode;
  color?: string;
};

const StatCard = ({ title, value, helper, icon, color }: StatCardProps) => {
  const theme = useTheme();
  return (
    <Card sx={{ height: "100%", overflow: "hidden" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: color ?? theme.palette.primary.main,
              color: theme.palette.getContrastText(color ?? theme.palette.primary.main),
              width: 44,
              height: 44,
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Stack>
        <Typography variant="h5" sx={{ letterSpacing: "-0.02em" }}>
          {value}
        </Typography>
        {helper && (
          <Typography variant="body2" color="text.secondary">
            {helper}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardPage = () => {
  const projectId = useSession((state) => state.projectId);
  const setProject = useSession((state) => state.setProject);
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks(projectId ?? projects?.[0]?.id);
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    const totalProjects = projects?.length ?? 0;
    const totalBudget = projects?.reduce((acc, project) => acc + (project.budget ?? 0), 0) ?? 0;
    const totalTasks = tasks?.length ?? 0;
    const completedTasks = tasks?.filter((task) => task.status === "done").length ?? 0;
    const totalPaid = projects?.reduce((acc, project) => acc + (project.payments_pagado ?? 0), 0) ?? 0;
    const totalEgresos =
      projects?.reduce((acc, project) => acc + (project.payments_egresos ?? 0), 0) ?? 0;
    const totalOutstanding =
      projects?.reduce((acc, project) => acc + (project.payments_saldo ?? 0), 0) ?? 0;
    const netPaid = totalPaid - totalEgresos;
    const activeProjects =
      projects?.filter((project) => project.status !== "delivered" && !project.is_archived).length ??
      0;
    return {
      totalProjects,
      totalBudget,
      totalTasks,
      completedTasks,
      totalPaid,
      totalEgresos,
      totalOutstanding,
      netPaid,
      activeProjects,
    };
  }, [projects, tasks]);

  const events = useMemo(() => {
    if (!projects) return [];
    return projects
      .filter(
        (project) =>
          project.status !== "delivered" &&
          !project.is_archived &&
          project.start_date
      )
      .map((project) => ({
        id: project.id,
        title: project.name,
        start: project.start_date ?? undefined,
        end: project.end_date ?? project.start_date ?? undefined,
        allDay: true,
        backgroundColor: "#2563eb",
      }));
  }, [projects]);

  const formatCurrency = (value: number | null | undefined) =>
    Number(value ?? 0).toLocaleString("es-CL");

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return "sin fecha";
    }
    return new Date(value).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const statCards: StatCardProps[] = [
    {
      title: "Proyectos activos",
      value: metrics.activeProjects.toString(),
      helper: `${metrics.totalProjects} en total`,
      icon: <FolderIcon fontSize="small" />,
      color: "#2563eb",
    },
    {
      title: "Tareas abiertas",
      value: metrics.totalTasks.toString(),
      helper: `${metrics.completedTasks} completadas`,
      icon: <TaskAltRoundedIcon fontSize="small" />,
      color: "#f97316",
    },
    {
      title: "Presupuesto total (CLP)",
      value: formatCurrency(metrics.totalBudget),
      helper: "Monto comprometido",
      icon: <ChecklistRoundedIcon fontSize="small" />,
      color: "#312e81",
    },
    {
      title: "Pagado neto (CLP)",
      value: formatCurrency(metrics.netPaid),
      helper: `Pagado: ${formatCurrency(metrics.totalPaid)}`,
      icon: <PaidRoundedIcon fontSize="small" />,
      color: "#16a34a",
    },
    {
      title: "Saldo por cobrar (CLP)",
      value: formatCurrency(metrics.totalOutstanding),
      helper: "Facturas pendientes",
      icon: <SavingsRoundedIcon fontSize="small" />,
      color: "#0ea5e9",
    },
    {
      title: "Egresos totales (CLP)",
      value: formatCurrency(metrics.totalEgresos),
      helper: "Gastos pagados",
      icon: <ReceiptLongRoundedIcon fontSize="small" />,
      color: "#f43f5e",
    },
  ];

  const getStatusProps = (status?: string | null) => {
    const normalized = status?.toLowerCase() ?? "";
    if (normalized.includes("progress") || normalized.includes("activo")) {
      return { label: "En progreso", color: "primary" as const };
    }
    if (normalized.includes("done") || normalized.includes("entregado")) {
      return { label: "Completado", color: "success" as const };
    }
    if (normalized.includes("paused") || normalized.includes("pendiente")) {
      return { label: "En pausa", color: "warning" as const };
    }
    return { label: status?.replace("_", " ") ?? "Sin estado", color: "default" as const };
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panel de control general de proyectos, tareas y finanzas.
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6">Resumen por proyecto</Typography>
            <Typography variant="body2" color="text.secondary">
              Seguimiento de presupuesto, pagos y estados.
            </Typography>
          </Box>
          <Chip label={`${projects?.length ?? 0} proyectos`} color="primary" variant="outlined" />
        </CardContent>
        <Divider />
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                      color: "text.secondary",
                      borderBottomColor: "divider",
                    },
                  }}
                >
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha término</TableCell>
                  <TableCell align="right">Presupuesto (CLP)</TableCell>
                  <TableCell align="right">Facturado (CLP)</TableCell>
                  <TableCell align="right">Pagado (CLP)</TableCell>
                  <TableCell align="right">Egresos (CLP)</TableCell>
                  <TableCell align="right">Saldo (CLP)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(projects ?? []).map((project) => {
                  const status = getStatusProps(project.status);
                  return (
                    <TableRow
                      key={project.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => {
                        setProject(project.id);
                        navigate(`/projects/${project.id}`);
                      }}
                    >
                      <TableCell>{project.name}</TableCell>
                      <TableCell>
                        <Chip label={status.label} color={status.color} size="small" variant="filled" />
                      </TableCell>
                      <TableCell>{formatDate(project.end_date)}</TableCell>
                      <TableCell align="right">{formatCurrency(project.budget)}</TableCell>
                      <TableCell align="right">{formatCurrency(project.payments_facturado)}</TableCell>
                      <TableCell align="right">{formatCurrency(project.payments_pagado)}</TableCell>
                      <TableCell align="right">{formatCurrency(project.payments_egresos)}</TableCell>
                      <TableCell align="right">{formatCurrency(project.payments_saldo)}</TableCell>
                    </TableRow>
                  );
                })}
                {(!projects || projects.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography variant="body2" color="text.secondary">
                        Aún no hay proyectos registrados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calendario de proyectos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Vista rápida de inicios y entregas programadas.
          </Typography>
          <Box
            sx={{
              "& .fc .fc-toolbar-title": { fontSize: "1.1rem", fontWeight: 700 },
              "& .fc .fc-button": {
                backgroundColor: "primary.main",
                border: "none",
                borderRadius: 2,
                textTransform: "capitalize",
                minHeight: 36,
              },
              "& .fc .fc-button:disabled": {
                backgroundColor: "action.disabledBackground",
              },
              "& .fc td, & .fc th": {
                borderColor: "divider",
              },
            }}
          >
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              height={650}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default DashboardPage;
