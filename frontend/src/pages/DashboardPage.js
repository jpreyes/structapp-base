import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Card, CardContent, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography, } from "@mui/material";
import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { useSession } from "../store/useSession";
import { useNavigate } from "react-router-dom";
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
        const totalOutstanding = projects?.reduce((acc, project) => acc + (project.payments_saldo ?? 0), 0) ?? 0;
        return { totalProjects, totalBudget, totalTasks, completedTasks, totalPaid, totalOutstanding };
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
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Proyectos" }), _jsx(Typography, { variant: "h5", children: metrics.totalProjects })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Presupuesto total CLP" }), _jsx(Typography, { variant: "h5", children: metrics.totalBudget.toLocaleString("es-CL") })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Tareas" }), _jsx(Typography, { variant: "h5", children: metrics.totalTasks })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Tareas completadas" }), _jsx(Typography, { variant: "h5", children: metrics.completedTasks })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Pagado total CLP" }), _jsx(Typography, { variant: "h5", children: metrics.totalPaid.toLocaleString("es-CL") })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Saldo por cobrar CLP" }), _jsx(Typography, { variant: "h5", children: metrics.totalOutstanding.toLocaleString("es-CL") })] }) }) })] }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Resumen por proyecto" }), _jsx(Box, { sx: { overflowX: "auto" }, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Proyecto" }), _jsx(TableCell, { children: "Estado" }), _jsx(TableCell, { align: "right", children: "Presupuesto (CLP)" }), _jsx(TableCell, { align: "right", children: "Facturado (CLP)" }), _jsx(TableCell, { align: "right", children: "Pagado (CLP)" }), _jsx(TableCell, { align: "right", children: "Saldo (CLP)" })] }) }), _jsxs(TableBody, { children: [(projects ?? []).map((project) => (_jsxs(TableRow, { hover: true, sx: { cursor: "pointer" }, onClick: () => {
                                                    setProject(project.id);
                                                    navigate(`/projects/${project.id}`);
                                                }, children: [_jsx(TableCell, { children: project.name }), _jsx(TableCell, { sx: { textTransform: "capitalize" }, children: project.status?.replace("_", " ") ?? "sin estado" }), _jsx(TableCell, { align: "right", children: formatCurrency(project.budget) }), _jsx(TableCell, { align: "right", children: formatCurrency(project.payments_facturado) }), _jsx(TableCell, { align: "right", children: formatCurrency(project.payments_pagado) }), _jsx(TableCell, { align: "right", children: formatCurrency(project.payments_saldo) })] }, project.id))), (!projects || projects.length === 0) && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 6, children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "A\u00FAn no hay proyectos registrados." }) }) }))] })] }) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Calendario de proyectos" }), _jsx(FullCalendar, { plugins: [dayGridPlugin], initialView: "dayGridMonth", events: events, height: 650, headerToolbar: {
                                left: "prev,next today",
                                center: "title",
                                right: "",
                            } })] }) })] }));
};
export default DashboardPage;
