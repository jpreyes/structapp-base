import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Breadcrumbs, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Link, List, ListItem, ListItemText, MenuItem, Stack, TextField, Typography, } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectDetail } from "../hooks/useProjectDetail";
import { useSession } from "../store/useSession";
import PaymentFormDialog from "../components/payments/PaymentFormDialog";
import TaskFormDialog from "../components/tasks/TaskFormDialog";
import { useProjects } from "../hooks/useProjects";
import apiClient from "../api/client";
const statusOptions = [
    { value: "draft", label: "Planificación" },
    { value: "in_design", label: "Diseño en curso" },
    { value: "in_review", label: "En revisión" },
    { value: "delivered", label: "Entregado" },
];
const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const setProject = useSession((state) => state.setProject);
    const { data, isLoading, isError } = useProjectDetail(projectId);
    const { data: projectList } = useProjects();
    const queryClient = useQueryClient();
    const [editProjectOpen, setEditProjectOpen] = useState(false);
    const [projectForm, setProjectForm] = useState(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
    useEffect(() => {
        if (projectId) {
            setProject(projectId);
        }
    }, [projectId, setProject]);
    useEffect(() => {
        if (isError) {
            navigate("/projects");
        }
    }, [isError, navigate]);
    const invalidateProjectQueries = () => {
        if (!projectId)
            return;
        queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    };
    const projectMutation = useMutation({
        mutationFn: async (payload) => {
            if (!projectId)
                throw new Error("No project selected");
            const { data } = await apiClient.patch(`/projects/${projectId}`, payload);
            return data;
        },
        onSuccess: () => {
            setEditProjectOpen(false);
            setProjectForm(null);
            invalidateProjectQueries();
        },
    });
    const paymentCreateMutation = useMutation({
        mutationFn: async (values) => {
            if (!projectId)
                throw new Error("No project selected");
            const { data } = await apiClient.post("/payments", {
                project_id: projectId,
                event_date: values.event_date.format("YYYY-MM-DD"),
                kind: values.kind,
                amount: values.amount,
                reference: values.reference || null,
                note: values.note || null,
                currency: "CLP",
            });
            return data;
        },
        onSuccess: () => {
            setPaymentDialogOpen(false);
            setEditingPayment(null);
            invalidateProjectQueries();
        },
    });
    const paymentUpdateMutation = useMutation({
        mutationFn: async ({ paymentId, values }) => {
            const { data } = await apiClient.patch(`/payments/${paymentId}`, {
                event_date: values.event_date.format("YYYY-MM-DD"),
                kind: values.kind,
                amount: values.amount,
                reference: values.reference || null,
                note: values.note || null,
            });
            return data;
        },
        onSuccess: () => {
            setPaymentDialogOpen(false);
            setEditingPayment(null);
            invalidateProjectQueries();
        },
    });
    const paymentDeleteMutation = useMutation({
        mutationFn: async (paymentId) => {
            await apiClient.delete(`/payments/${paymentId}`);
        },
        onSuccess: () => {
            setPaymentToDelete(null);
            invalidateProjectQueries();
        },
    });
    const taskCreateMutation = useMutation({
        mutationFn: async (values) => {
            if (!projectId)
                throw new Error("No project selected");
            const { data } = await apiClient.post("/tasks", {
                project_id: projectId,
                title: values.title,
                start_date: values.start_date.format("YYYY-MM-DD"),
                end_date: values.end_date.format("YYYY-MM-DD"),
                status: values.status,
                progress: values.progress,
                assignee: values.assignee || null,
                notes: values.notes || null,
            });
            return data;
        },
        onSuccess: () => {
            setTaskDialogOpen(false);
            setEditingTask(null);
            invalidateProjectQueries();
        },
    });
    const taskUpdateMutation = useMutation({
        mutationFn: async ({ taskId, values }) => {
            const { data } = await apiClient.patch(`/tasks/${taskId}`, {
                title: values.title,
                start_date: values.start_date.format("YYYY-MM-DD"),
                end_date: values.end_date.format("YYYY-MM-DD"),
                status: values.status,
                progress: values.progress,
                assignee: values.assignee || null,
                notes: values.notes || null,
            });
            return data;
        },
        onSuccess: () => {
            setTaskDialogOpen(false);
            setEditingTask(null);
            invalidateProjectQueries();
        },
    });
    const taskDeleteMutation = useMutation({
        mutationFn: async (taskId) => {
            await apiClient.delete(`/tasks/${taskId}`);
        },
        onSuccess: () => {
            setTaskToDelete(null);
            invalidateProjectQueries();
        },
    });
    const deleteProjectMutation = useMutation({
        mutationFn: async () => {
            if (!projectId)
                throw new Error("No project selected");
            await apiClient.delete(`/projects/${projectId}`);
        },
        onSuccess: () => {
            setDeleteProjectOpen(false);
            setProject(undefined);
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            if (projectId) {
                queryClient.removeQueries({ queryKey: ["project-detail", projectId] });
            }
            navigate("/projects", { replace: true });
        },
    });
    if (!projectId) {
        return null;
    }
    if (isLoading || !data) {
        return (_jsx(Box, { sx: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }, children: _jsx(CircularProgress, {}) }));
    }
    const { project, metrics, important_dates, tasks, payments } = data;
    const formatCurrency = (value) => Number(value ?? 0).toLocaleString("es-CL");
    const handleOpenProjectEdit = () => {
        setProjectForm({
            name: project.name,
            mandante: project.mandante ?? "",
            status: project.status ?? "draft",
            budget: Number(project.budget ?? 0),
            start_date: project.start_date ?? dayjs().format("YYYY-MM-DD"),
            end_date: project.end_date ?? dayjs().add(7, "day").format("YYYY-MM-DD"),
        });
        setEditProjectOpen(true);
    };
    const handleCloseProjectEdit = () => {
        setEditProjectOpen(false);
        setProjectForm(null);
    };
    const handleSubmitProject = () => {
        if (!projectForm)
            return;
        projectMutation.mutate({
            name: projectForm.name,
            mandante: projectForm.mandante,
            status: projectForm.status,
            budget: projectForm.budget,
            start_date: projectForm.start_date,
            end_date: projectForm.end_date,
        });
    };
    const openPaymentDialog = (payment) => {
        setEditingPayment(payment ?? null);
        setPaymentDialogOpen(true);
    };
    const handleSubmitPayment = (values) => {
        if (editingPayment) {
            paymentUpdateMutation.mutate({ paymentId: editingPayment.id, values });
        }
        else {
            paymentCreateMutation.mutate(values);
        }
    };
    const openTaskDialog = (task) => {
        setEditingTask(task ?? null);
        setTaskDialogOpen(true);
    };
    const handleSubmitTask = (values) => {
        if (editingTask) {
            taskUpdateMutation.mutate({ taskId: editingTask.id, values });
        }
        else {
            taskCreateMutation.mutate(values);
        }
    };
    const paymentCards = [
        {
            label: "Presupuesto",
            value: `CLP ${formatCurrency(metrics.budget)}`,
            onClick: handleOpenProjectEdit,
        },
        {
            label: "Facturado",
            value: `CLP ${formatCurrency(metrics.payments.facturado)}`,
            onClick: () => openPaymentDialog(),
        },
        {
            label: "Pagado",
            value: `CLP ${formatCurrency(metrics.payments.pagado)}`,
            onClick: () => openPaymentDialog(),
        },
        {
            label: "Saldo por cobrar",
            value: `CLP ${formatCurrency(metrics.payments.saldo)}`,
            onClick: () => openPaymentDialog(),
        },
    ];
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Breadcrumbs, { children: [_jsx(Link, { component: RouterLink, to: "/projects", color: "inherit", children: "Proyectos" }), _jsx(Typography, { color: "text.primary", children: project.name })] }), _jsxs(Box, { sx: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }, children: [_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }, children: [_jsx(Typography, { variant: "h4", fontWeight: 600, children: project.name }), projectList?.length ? (_jsx(TextField, { select: true, size: "small", label: "Cambiar proyecto", value: projectId, onChange: (event) => {
                                            const nextProjectId = event.target.value;
                                            if (nextProjectId && nextProjectId !== projectId) {
                                                setProject(nextProjectId);
                                                navigate(`/projects/${nextProjectId}`);
                                            }
                                        }, sx: { minWidth: 220 }, children: projectList.map((item) => (_jsx(MenuItem, { value: item.id, children: item.name }, item.id))) })) : null] }), _jsxs(Typography, { variant: "body1", color: "text.secondary", children: ["Mandante: ", project.mandante ?? "—"] })] }), _jsxs(Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [_jsx(Chip, { label: project.status?.replace("_", " ") ?? "Sin estado", color: project.status === "delivered"
                                    ? "success"
                                    : project.status === "in_review"
                                        ? "warning"
                                        : project.status === "in_design"
                                            ? "info"
                                            : "default", sx: { textTransform: "capitalize", fontWeight: 600 } }), _jsx(Button, { variant: "outlined", startIcon: _jsx(EditIcon, {}), onClick: handleOpenProjectEdit, children: "Editar proyecto" }), _jsx(Button, { variant: "outlined", color: "error", startIcon: _jsx(DeleteIcon, {}), onClick: () => setDeleteProjectOpen(true), children: "Eliminar" })] })] }), _jsx(Grid, { container: true, spacing: 2, children: paymentCards.map((card) => (_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(Card, { sx: { cursor: "pointer", transition: "all 0.2s ease", "&:hover": { boxShadow: (theme) => theme.shadows[6] } }, onClick: card.onClick, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: card.label }), _jsx(Typography, { variant: "h5", children: card.value })] }) }) }, card.label))) }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Fechas importantes" }), _jsx(Button, { size: "small", onClick: handleOpenProjectEdit, startIcon: _jsx(EditIcon, {}), children: "Editar" })] }), _jsxs(List, { dense: true, children: [_jsx(ListItem, { children: _jsx(ListItemText, { primary: "Inicio del proyecto", secondary: important_dates.start_date ? dayjs(important_dates.start_date).format("DD/MM/YYYY") : "—" }) }), _jsx(ListItem, { children: _jsx(ListItemText, { primary: "Entrega estimada", secondary: important_dates.end_date ? dayjs(important_dates.end_date).format("DD/MM/YYYY") : "—" }) }), _jsx(ListItem, { children: _jsx(ListItemText, { primary: "Pr\u00F3ximo comienzo de tarea", secondary: important_dates.next_task_start
                                                        ? dayjs(important_dates.next_task_start).format("DD/MM/YYYY")
                                                        : "—" }) }), _jsx(ListItem, { children: _jsx(ListItemText, { primary: "Pr\u00F3xima entrega de tarea", secondary: important_dates.next_task_due
                                                        ? dayjs(important_dates.next_task_due).format("DD/MM/YYYY")
                                                        : "—" }) })] })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Estado de tareas" }), _jsxs(List, { dense: true, children: [_jsx(ListItem, { children: _jsx(ListItemText, { primary: "Total de tareas", secondary: metrics.total_tasks }) }), _jsx(ListItem, { children: _jsx(ListItemText, { primary: "Completadas", secondary: metrics.completed_tasks }) }), _jsx(ListItem, { children: _jsx(ListItemText, { primary: "Pendientes", secondary: metrics.total_tasks - metrics.completed_tasks }) })] })] }) }) })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 1 }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h6", children: "Tareas del proyecto" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), onClick: () => openTaskDialog(), children: "Nueva tarea" })] }), tasks.length === 0 ? (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "A\u00FAn no hay tareas registradas." })) : (tasks.map((task) => (_jsxs(Box, { sx: {
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 2,
                                            p: 2,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 0.5,
                                        }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: task.title }), _jsxs(Box, { children: [_jsx(IconButton, { size: "small", onClick: () => openTaskDialog(task), children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", onClick: () => setTaskToDelete(task), children: _jsx(DeleteIcon, { fontSize: "small" }) })] })] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [dayjs(task.start_date).format("DD/MM/YY"), " \u2192 ", dayjs(task.end_date).format("DD/MM/YY")] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Estado: ", task.status] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Responsable: ", task.assignee || "Sin asignar"] })] }, task.id))))] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 1 }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h6", children: "Pagos del proyecto" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), onClick: () => openPaymentDialog(), children: "Nuevo movimiento" })] }), payments.length === 0 ? (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "No hay movimientos registrados." })) : (payments.map((payment) => (_jsxs(Box, { sx: {
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 2,
                                            p: 2,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 0.5,
                                        }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, textTransform: "capitalize", children: payment.kind.replace("_", " ") }), _jsxs(Box, { children: [_jsx(IconButton, { size: "small", onClick: () => openPaymentDialog(payment), children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", onClick: () => setPaymentToDelete(payment), children: _jsx(DeleteIcon, { fontSize: "small" }) })] })] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Fecha: ", dayjs(payment.event_date).format("DD/MM/YY")] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Monto: CLP ", formatCurrency(payment.amount)] }), payment.reference && (_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Referencia: ", payment.reference] })), payment.note && (_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Nota: ", payment.note] }))] }, payment.id))))] }) }) })] }), _jsxs(Dialog, { open: editProjectOpen && !!projectForm, onClose: handleCloseProjectEdit, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Editar proyecto" }), _jsx(DialogContent, { dividers: true, children: projectForm && (_jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "Nombre", value: projectForm.name, onChange: (event) => setProjectForm((prev) => prev && { ...prev, name: event.target.value }) }), _jsx(TextField, { label: "Mandante", value: projectForm.mandante, onChange: (event) => setProjectForm((prev) => prev && { ...prev, mandante: event.target.value }) }), _jsx(TextField, { select: true, label: "Estado", value: projectForm.status, onChange: (event) => setProjectForm((prev) => prev && { ...prev, status: event.target.value }), children: statusOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, option.value))) }), _jsx(TextField, { label: "Presupuesto (CLP)", type: "number", value: projectForm.budget, onChange: (event) => setProjectForm((prev) => prev && { ...prev, budget: Number(event.target.value) }) }), _jsxs(Box, { sx: { display: "flex", gap: 2 }, children: [_jsx(TextField, { label: "Inicio", type: "date", value: projectForm.start_date, onChange: (event) => setProjectForm((prev) => prev && { ...prev, start_date: event.target.value }), InputLabelProps: { shrink: true }, fullWidth: true }), _jsx(TextField, { label: "T\u00E9rmino", type: "date", value: projectForm.end_date, onChange: (event) => setProjectForm((prev) => prev && { ...prev, end_date: event.target.value }), InputLabelProps: { shrink: true }, fullWidth: true })] })] })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleCloseProjectEdit, children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: handleSubmitProject, disabled: projectMutation.isPending || !projectForm?.name.trim(), children: "Guardar" })] })] }), _jsx(PaymentFormDialog, { open: paymentDialogOpen, onClose: () => {
                    setPaymentDialogOpen(false);
                    setEditingPayment(null);
                }, onSubmit: handleSubmitPayment, initialPayment: editingPayment ?? undefined, loading: paymentCreateMutation.isPending || paymentUpdateMutation.isPending }), _jsx(TaskFormDialog, { open: taskDialogOpen, onClose: () => {
                    setTaskDialogOpen(false);
                    setEditingTask(null);
                }, onSubmit: handleSubmitTask, initialTask: editingTask ?? undefined, loading: taskCreateMutation.isPending || taskUpdateMutation.isPending }), _jsxs(Dialog, { open: deleteProjectOpen, onClose: () => setDeleteProjectOpen(false), children: [_jsx(DialogTitle, { children: "Eliminar proyecto" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["\u00BFEst\u00E1 seguro que quiere eliminar el proyecto \"", project.name, "\"? Esta acci\u00F3n no se puede deshacer."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteProjectOpen(false), children: "Cancelar" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => deleteProjectMutation.mutate(), disabled: deleteProjectMutation.isPending, children: "Eliminar" })] })] }), _jsxs(Dialog, { open: Boolean(paymentToDelete), onClose: () => setPaymentToDelete(null), children: [_jsx(DialogTitle, { children: "Eliminar movimiento" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["\u00BFSeguro que deseas eliminar el movimiento \"", paymentToDelete?.reference ?? paymentToDelete?.kind, "\"?"] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setPaymentToDelete(null), children: "Cancelar" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => paymentToDelete && paymentDeleteMutation.mutate(paymentToDelete.id), disabled: paymentDeleteMutation.isPending, children: "Eliminar" })] })] }), _jsxs(Dialog, { open: Boolean(taskToDelete), onClose: () => setTaskToDelete(null), children: [_jsx(DialogTitle, { children: "Eliminar tarea" }), _jsx(DialogContent, { children: _jsxs(Typography, { children: ["\u00BFSeguro que deseas eliminar la tarea \"", taskToDelete?.title, "\"?"] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setTaskToDelete(null), children: "Cancelar" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => taskToDelete && taskDeleteMutation.mutate(taskToDelete.id), disabled: taskDeleteMutation.isPending, children: "Eliminar" })] })] })] }));
};
export default ProjectDetailPage;
