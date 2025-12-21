import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, MenuItem, Tab, Tabs, TextField, Typography, } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTasks } from "../hooks/useTasks";
import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";
import apiClient from "../api/client";
import TaskBoard, { STATUS_META } from "../components/tasks/TaskBoard";
import TaskFormDialog from "../components/tasks/TaskFormDialog";
import TaskCalendar from "../components/tasks/TaskCalendar";
import TaskGantt from "../components/tasks/TaskGantt";
const TasksPage = () => {
    const sessionProjectId = useSession((state) => state.projectId);
    const setProjectInSession = useSession((state) => state.setProject);
    const { data: projects } = useProjects();
    const { projectId: routeProjectId } = useParams();
    const isWorkspaceView = Boolean(routeProjectId);
    const [activeTab, setActiveTab] = useState("kanban");
    const [selectedProjectId, setSelectedProjectId] = useState(isWorkspaceView ? routeProjectId : sessionProjectId);
    const allowAllProjects = !isWorkspaceView;
    const isAllProjects = allowAllProjects && selectedProjectId === "all";
    const [formOpen, setFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [taskPendingDelete, setTaskPendingDelete] = useState(null);
    const effectiveProjectId = routeProjectId ?? (isAllProjects ? undefined : selectedProjectId ?? projects?.[0]?.id);
    const { data: projectTasks = [] } = useTasks(effectiveProjectId);
    const { data: allTasks = [], isFetching: isFetchingAll } = useQuery({
        queryKey: ["tasks", "all"],
        enabled: isAllProjects && Boolean(projects?.length),
        queryFn: async () => {
            const responses = await Promise.all((projects ?? []).map((project) => apiClient.get(`/tasks/${project.id}`)));
            return responses.flatMap((res) => res.data);
        },
    });
    const tasks = isAllProjects ? allTasks : projectTasks;
    const queryClient = useQueryClient();
    useEffect(() => {
        if (routeProjectId) {
            setSelectedProjectId(routeProjectId);
            setProjectInSession(routeProjectId);
        }
    }, [routeProjectId, setProjectInSession]);
    useEffect(() => {
        if (isWorkspaceView) {
            return;
        }
        if (!selectedProjectId && projects?.length) {
            const firstProjectId = sessionProjectId ?? projects[0].id;
            setSelectedProjectId(firstProjectId);
            setProjectInSession(firstProjectId);
        }
    }, [isWorkspaceView, projects, selectedProjectId, sessionProjectId, setProjectInSession]);
    useEffect(() => {
        if (isWorkspaceView || selectedProjectId === "all") {
            return;
        }
        if (sessionProjectId && selectedProjectId !== sessionProjectId) {
            setSelectedProjectId(sessionProjectId);
        }
    }, [isWorkspaceView, selectedProjectId, sessionProjectId]);
    const metrics = useMemo(() => {
        if (!tasks.length) {
            return { total: 0, byStatus: { todo: 0, doing: 0, blocked: 0, done: 0 } };
        }
        const byStatus = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] ?? 0) + 1;
            return acc;
        }, { todo: 0, doing: 0, blocked: 0, done: 0 });
        return { total: tasks.length, byStatus };
    }, [tasks]);
    const activeProjectName = useMemo(() => {
        if (!projects?.length || !effectiveProjectId) {
            return "";
        }
        return projects.find((project) => project.id === effectiveProjectId)?.name ?? "";
    }, [projects, effectiveProjectId]);
    const createTaskMutation = useMutation({
        mutationFn: async (payload) => {
            const { data } = await apiClient.post("/tasks", {
                project_id: payload.projectId,
                title: payload.title,
                start_date: payload.start_date.format("YYYY-MM-DD"),
                end_date: payload.end_date.format("YYYY-MM-DD"),
                status: payload.status,
                progress: payload.progress,
                assignee: payload.assignee || null,
                notes: payload.notes || null,
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            setFormOpen(false);
        },
    });
    const updateTaskMutation = useMutation({
        mutationFn: async ({ taskId, patch }) => {
            const { data } = await apiClient.patch(`/tasks/${taskId}`, patch);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            setFormOpen(false);
            setEditingTask(null);
        },
    });
    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId) => {
            await apiClient.delete(`/tasks/${taskId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            setTaskPendingDelete(null);
        },
    });
    const handleCreateClick = () => {
        setEditingTask(null);
        setFormOpen(true);
    };
    const handleEditTask = (task) => {
        setEditingTask(task);
        setFormOpen(true);
    };
    const handleDeleteTask = (task) => {
        setTaskPendingDelete(task);
    };
    const handleStatusChange = (task, status) => {
        if (task.status === status)
            return;
        // En modo "todos" evitamos optimismo cruzado y solo invalidamos luego del patch.
        if (!effectiveProjectId && isAllProjects) {
            updateTaskMutation.mutate({ taskId: task.id, patch: { status } });
            return;
        }
        if (!effectiveProjectId)
            return;
        const queryKey = ["tasks", effectiveProjectId];
        const previous = queryClient.getQueryData(queryKey);
        const updatedTask = { ...task, status };
        queryClient.setQueryData(queryKey, (current = []) => {
            const remaining = current.filter((item) => item.id !== task.id);
            return [updatedTask, ...remaining];
        });
        updateTaskMutation.mutate({
            taskId: task.id,
            patch: { status },
        }, {
            onError: () => {
                queryClient.setQueryData(queryKey, previous);
            },
        });
    };
    const handleSubmitForm = (values) => {
        if (!effectiveProjectId)
            return;
        if (editingTask) {
            updateTaskMutation.mutate({
                taskId: editingTask.id,
                patch: {
                    title: values.title,
                    start_date: values.start_date.format("YYYY-MM-DD"),
                    end_date: values.end_date.format("YYYY-MM-DD"),
                    status: values.status,
                    progress: values.progress,
                    assignee: values.assignee || null,
                    notes: values.notes || null,
                },
            });
        }
        else {
            createTaskMutation.mutate({
                ...values,
                projectId: effectiveProjectId,
            });
        }
    };
    const handleSelectTask = (taskId) => {
        const task = tasks.find((item) => item.id === taskId);
        if (task) {
            handleEditTask(task);
        }
    };
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs(Box, { sx: { display: "flex", gap: 2, alignItems: "center" }, children: [_jsx(Typography, { variant: "h5", children: "Tareas" }), !isWorkspaceView ? (_jsxs(TextField, { select: true, label: "Proyecto activo", size: "small", value: isAllProjects ? "all" : effectiveProjectId ?? "", onChange: (event) => {
                                    const value = event.target.value;
                                    setSelectedProjectId(value);
                                    setProjectInSession(value === "all" ? undefined : value);
                                }, sx: { minWidth: 220 }, children: [_jsx(MenuItem, { value: "all", children: "Todos los proyectos" }), (projects ?? []).map((project) => (_jsx(MenuItem, { value: project.id, children: project.name }, project.id)))] })) : (_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Proyecto: ", activeProjectName || "Sin proyecto"] }))] }), _jsx(Button, { variant: "contained", onClick: handleCreateClick, disabled: !effectiveProjectId || isAllProjects, children: "Nueva tarea" })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Total de tareas" }), _jsx(Typography, { variant: "h5", children: metrics.total })] }) }) }), Object.entries(STATUS_META).map(([status, meta]) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: meta.label }), _jsx(Typography, { variant: "h5", children: metrics.byStatus[status] ?? 0 })] }) }) }, status)))] }), _jsxs(Tabs, { value: activeTab, onChange: (_, value) => setActiveTab(value), sx: { borderBottom: 1, borderColor: "divider" }, children: [_jsx(Tab, { value: "kanban", label: "Kanban" }), _jsx(Tab, { value: "calendar", label: "Calendario" }), _jsx(Tab, { value: "gantt", label: "Gantt" })] }), activeTab === "kanban" && (_jsx(TaskBoard, { tasks: tasks, onEdit: handleEditTask, onDelete: handleDeleteTask, onStatusChange: handleStatusChange })), activeTab === "calendar" && (_jsx(TaskCalendar, { tasks: tasks, onSelectTask: handleSelectTask })), activeTab === "gantt" && _jsx(TaskGantt, { tasks: tasks, onSelectTask: handleSelectTask }), _jsx(TaskFormDialog, { open: formOpen, initialTask: editingTask ?? undefined, onClose: () => {
                    setFormOpen(false);
                    setEditingTask(null);
                }, onSubmit: handleSubmitForm, loading: createTaskMutation.isPending || updateTaskMutation.isPending }), _jsxs(Dialog, { open: Boolean(taskPendingDelete), onClose: () => setTaskPendingDelete(null), children: [_jsx(DialogTitle, { children: "Eliminar tarea" }), _jsx(DialogContent, { children: _jsxs(DialogContentText, { children: ["\u00BFSeguro que deseas eliminar la tarea \"", taskPendingDelete?.title, "\"? Esta acci\u00F3n no se puede deshacer."] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setTaskPendingDelete(null), children: "Cancelar" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => taskPendingDelete && deleteTaskMutation.mutate(taskPendingDelete.id), disabled: deleteTaskMutation.isPending, children: "Eliminar" })] })] })] }));
};
export default TasksPage;
