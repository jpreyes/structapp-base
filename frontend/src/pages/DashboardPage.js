import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar, Box, Card, CardContent, Chip, Divider, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, } from "@mui/material";
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
const StatCard = ({ title, value, helper, icon, color }) => {
    const theme = useTheme();
    return (_jsx(Card, { sx: { height: "100%", overflow: "hidden" }, children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 1 }, children: [_jsxs(Stack, { direction: "row", spacing: 1.5, alignItems: "center", children: [_jsx(Avatar, { variant: "rounded", sx: {
                                bgcolor: color ?? theme.palette.primary.main,
                                color: theme.palette.getContrastText(color ?? theme.palette.primary.main),
                                width: 44,
                                height: 44,
                            }, children: icon }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: title })] }), _jsx(Typography, { variant: "h5", sx: { letterSpacing: "-0.02em" }, children: value }), helper && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: helper }))] }) }));
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
        const totalEgresos = projects?.reduce((acc, project) => acc + (project.payments_egresos ?? 0), 0) ?? 0;
        const totalOutstanding = projects?.reduce((acc, project) => acc + (project.payments_saldo ?? 0), 0) ?? 0;
        const netPaid = totalPaid - totalEgresos;
        const activeProjects = projects?.filter((project) => project.status !== "delivered" && !project.is_archived).length ??
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
        if (!projects)
            return [];
        return projects
            .filter((project) => project.status !== "delivered" &&
            !project.is_archived &&
            project.start_date)
            .map((project) => ({
            id: project.id,
            title: project.name,
            start: project.start_date ?? undefined,
            end: project.end_date ?? project.start_date ?? undefined,
            allDay: true,
            backgroundColor: "#2563eb",
        }));
    }, [projects]);
    const formatCurrency = (value) => Number(value ?? 0).toLocaleString("es-CL");
    const formatDate = (value) => {
        if (!value) {
            return "sin fecha";
        }
        return new Date(value).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };
    const statCards = [
        {
            title: "Proyectos activos",
            value: metrics.activeProjects.toString(),
            helper: `${metrics.totalProjects} en total`,
            icon: _jsx(FolderIcon, { fontSize: "small" }),
            color: "#2563eb",
        },
        {
            title: "Tareas abiertas",
            value: metrics.totalTasks.toString(),
            helper: `${metrics.completedTasks} completadas`,
            icon: _jsx(TaskAltRoundedIcon, { fontSize: "small" }),
            color: "#f97316",
        },
        {
            title: "Presupuesto total (CLP)",
            value: formatCurrency(metrics.totalBudget),
            helper: "Monto comprometido",
            icon: _jsx(ChecklistRoundedIcon, { fontSize: "small" }),
            color: "#312e81",
        },
        {
            title: "Pagado neto (CLP)",
            value: formatCurrency(metrics.netPaid),
            helper: `Pagado: ${formatCurrency(metrics.totalPaid)}`,
            icon: _jsx(PaidRoundedIcon, { fontSize: "small" }),
            color: "#16a34a",
        },
        {
            title: "Saldo por cobrar (CLP)",
            value: formatCurrency(metrics.totalOutstanding),
            helper: "Facturas pendientes",
            icon: _jsx(SavingsRoundedIcon, { fontSize: "small" }),
            color: "#0ea5e9",
        },
        {
            title: "Egresos totales (CLP)",
            value: formatCurrency(metrics.totalEgresos),
            helper: "Gastos pagados",
            icon: _jsx(ReceiptLongRoundedIcon, { fontSize: "small" }),
            color: "#f43f5e",
        },
    ];
    const getStatusProps = (status) => {
        const normalized = status?.toLowerCase() ?? "";
        if (normalized.includes("progress") || normalized.includes("activo")) {
            return { label: "En progreso", color: "primary" };
        }
        if (normalized.includes("done") || normalized.includes("entregado")) {
            return { label: "Completado", color: "success" };
        }
        if (normalized.includes("paused") || normalized.includes("pendiente")) {
            return { label: "En pausa", color: "warning" };
        }
        return { label: status?.replace("_", " ") ?? "Sin estado", color: "default" };
    };
    return (_jsxs(Stack, { spacing: 3, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Dashboard" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Panel de control general de proyectos, tareas y finanzas." })] }), _jsx(Grid, { container: true, spacing: { xs: 2, md: 3 }, children: statCards.map((card) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsx(StatCard, { ...card }) }, card.title))) }), _jsxs(Card, { children: [_jsxs(CardContent, { sx: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: "Resumen por proyecto" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Seguimiento de presupuesto, pagos y estados." })] }), _jsx(Chip, { label: `${projects?.length ?? 0} proyectos`, color: "primary", variant: "outlined" })] }), _jsx(Divider, {}), _jsx(CardContent, { sx: { pt: 0 }, children: _jsx(Box, { sx: { overflowX: "auto" }, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: {
                                                "& th": {
                                                    fontSize: 12,
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.6,
                                                    color: "text.secondary",
                                                    borderBottomColor: "divider",
                                                },
                                            }, children: [_jsx(TableCell, { children: "Proyecto" }), _jsx(TableCell, { children: "Estado" }), _jsx(TableCell, { children: "Fecha t\u00E9rmino" }), _jsx(TableCell, { align: "right", children: "Presupuesto (CLP)" }), _jsx(TableCell, { align: "right", children: "Facturado (CLP)" }), _jsx(TableCell, { align: "right", children: "Pagado (CLP)" }), _jsx(TableCell, { align: "right", children: "Egresos (CLP)" }), _jsx(TableCell, { align: "right", children: "Saldo (CLP)" })] }) }), _jsxs(TableBody, { children: [(projects ?? []).map((project) => {
                                                const status = getStatusProps(project.status);
                                                return (_jsxs(TableRow, { hover: true, sx: { cursor: "pointer" }, onClick: () => {
                                                        setProject(project.id);
                                                        navigate(`/projects/${project.id}`);
                                                    }, children: [_jsx(TableCell, { children: project.name }), _jsx(TableCell, { children: _jsx(Chip, { label: status.label, color: status.color, size: "small", variant: "filled" }) }), _jsx(TableCell, { children: formatDate(project.end_date) }), _jsx(TableCell, { align: "right", children: formatCurrency(project.budget) }), _jsx(TableCell, { align: "right", children: formatCurrency(project.payments_facturado) }), _jsx(TableCell, { align: "right", children: formatCurrency(project.payments_pagado) }), _jsx(TableCell, { align: "right", children: formatCurrency(project.payments_egresos) }), _jsx(TableCell, { align: "right", children: formatCurrency(project.payments_saldo) })] }, project.id));
                                            }), (!projects || projects.length === 0) && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 8, children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "A\u00FAn no hay proyectos registrados." }) }) }))] })] }) }) })] }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Calendario de proyectos" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "Vista r\u00E1pida de inicios y entregas programadas." }), _jsx(Box, { sx: {
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
                            }, children: _jsx(FullCalendar, { plugins: [dayGridPlugin], initialView: "dayGridMonth", events: events, height: 650, headerToolbar: {
                                    left: "prev,next today",
                                    center: "title",
                                    right: "",
                                } }) })] }) })] }));
};
export default DashboardPage;
