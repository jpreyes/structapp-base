import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField, Typography, } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import apiClient from "../api/client";
import { useSession } from "../store/useSession";
const statusOptions = [
    { value: "draft", label: "Planificacion" },
    { value: "in_design", label: "Diseno en curso" },
    { value: "in_review", label: "En revision" },
    { value: "delivered", label: "Entregado" },
];
const defaultForm = {
    name: "",
    mandante: "",
    status: "draft",
    budget: 0,
    start_date: dayjs(),
    end_date: dayjs().add(7, "day"),
};
const ProjectsPage = () => {
    const { data: projects } = useProjects();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const setProject = useSession((state) => state.setProject);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const createProjectMutation = useMutation({
        mutationFn: async (payload) => {
            const { data } = await apiClient.post("/projects", {
                name: payload.name,
                mandante: payload.mandante,
                status: payload.status,
                budget: payload.budget,
                start_date: payload.start_date?.format("YYYY-MM-DD"),
                end_date: payload.end_date?.format("YYYY-MM-DD"),
            });
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setDialogOpen(false);
            setForm(defaultForm);
            setProject(data.id);
            navigate(`/projects/${data.id}`);
        },
    });
    const projectMetrics = useMemo(() => {
        if (!projects?.length) {
            return { total: 0, delivered: 0, budget: 0 };
        }
        const total = projects.length;
        const delivered = projects.filter((project) => project.status === "delivered").length;
        const budget = projects.reduce((acc, project) => acc + (project.budget ?? 0), 0);
        return { total, delivered, budget };
    }, [projects]);
    const paymentTotals = useMemo(() => {
        if (!projects?.length) {
            return { facturado: 0, pagado: 0, saldo: 0 };
        }
        return projects.reduce((acc, project) => ({
            facturado: acc.facturado + (project.payments_facturado ?? 0),
            pagado: acc.pagado + (project.payments_pagado ?? 0),
            saldo: acc.saldo + (project.payments_saldo ?? 0),
        }), { facturado: 0, pagado: 0, saldo: 0 });
    }, [projects]);
    const formatCurrency = (value) => value.toLocaleString("es-CL");
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Proyectos totales" }), _jsx(Typography, { variant: "h5", children: projectMetrics.total })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Entregados" }), _jsx(Typography, { variant: "h5", children: projectMetrics.delivered })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Presupuesto total CLP" }), _jsx(Typography, { variant: "h5", children: projectMetrics.budget.toLocaleString("es-CL") })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Facturado total" }), _jsx(Typography, { variant: "h5", children: formatCurrency(paymentTotals.facturado) })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Pagado total" }), _jsx(Typography, { variant: "h5", children: formatCurrency(paymentTotals.pagado) })] }) }) }), _jsx(Grid, { item: true, xs: 12, sm: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Saldo por cobrar" }), _jsx(Typography, { variant: "h5", children: formatCurrency(paymentTotals.saldo) })] }) }) })] }), _jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h6", children: "Proyectos" }), _jsx(Button, { variant: "contained", onClick: () => setDialogOpen(true), children: "Nuevo proyecto" })] }), _jsx(Grid, { container: true, spacing: 2, children: (projects ?? []).map((project) => (_jsx(Grid, { item: true, xs: 12, md: 6, lg: 4, children: _jsx(Card, { variant: "outlined", onClick: () => {
                            setProject(project.id);
                            navigate(`/projects/${project.id}`);
                        }, sx: {
                            cursor: "pointer",
                            borderColor: "divider",
                            "&:hover": { borderColor: "primary.main", boxShadow: (theme) => theme.shadows[4] },
                        }, children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 1 }, children: [_jsx(Typography, { variant: "h6", children: project.name }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Estado: ", statusOptions.find((opt) => opt.value === project.status)?.label ?? project.status] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Mandante: ", project.mandante ?? "-"] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Presupuesto: CLP ", (project.budget ?? 0).toLocaleString("es-CL")] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [project.start_date ?? "-", " \u2192 ", project.end_date ?? "-"] }), _jsxs(Box, { sx: { mt: 1, pt: 1, borderTop: "1px solid", borderColor: "divider", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Facturado" }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: formatCurrency(project.payments_facturado) })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Pagado" }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: formatCurrency(project.payments_pagado) })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Saldo" }), _jsx(Typography, { variant: "body2", fontWeight: 600, children: formatCurrency(project.payments_saldo) })] })] })] }) }) }, project.id))) }), _jsxs(Dialog, { open: dialogOpen, onClose: () => setDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Nuevo proyecto" }), _jsxs(DialogContent, { dividers: true, sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(TextField, { label: "Nombre", value: form.name, onChange: (event) => setForm((prev) => ({ ...prev, name: event.target.value })), fullWidth: true }), _jsx(TextField, { label: "Mandante", value: form.mandante, onChange: (event) => setForm((prev) => ({ ...prev, mandante: event.target.value })), fullWidth: true }), _jsx(TextField, { label: "Estado", select: true, value: form.status, onChange: (event) => setForm((prev) => ({ ...prev, status: event.target.value })), fullWidth: true, children: statusOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, option.value))) }), _jsx(TextField, { label: "Presupuesto (CLP)", type: "number", value: form.budget, onChange: (event) => setForm((prev) => ({ ...prev, budget: Number(event.target.value) })), fullWidth: true }), _jsxs(Box, { sx: { display: "flex", gap: 2 }, children: [_jsx(TextField, { label: "Inicio", type: "date", fullWidth: true, value: form.start_date?.format("YYYY-MM-DD"), onChange: (event) => setForm((prev) => ({
                                            ...prev,
                                            start_date: dayjs(event.target.value),
                                        })), InputLabelProps: { shrink: true } }), _jsx(TextField, { label: "Termino", type: "date", fullWidth: true, value: form.end_date?.format("YYYY-MM-DD"), onChange: (event) => setForm((prev) => ({
                                            ...prev,
                                            end_date: dayjs(event.target.value),
                                        })), InputLabelProps: { shrink: true } })] })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDialogOpen(false), children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: () => createProjectMutation.mutate(form), disabled: !form.name.trim(), children: "Guardar" })] })] })] }));
};
export default ProjectsPage;
