import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CSS } from "@dnd-kit/utilities";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { Box, IconButton, LinearProgress, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
export const STATUS_META = {
    todo: { label: "Por iniciar", color: "default" },
    doing: { label: "En curso", color: "primary" },
    blocked: { label: "Bloqueada", color: "error" },
    done: { label: "Completada", color: "success" },
};
const KanbanColumn = ({ status, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    return (_jsx(Box, { ref: setNodeRef, sx: {
            flex: 1,
            minHeight: 500,
            position: "relative",
            border: "1px solid",
            borderColor: isOver ? "primary.main" : "divider",
            borderRadius: 2,
            backgroundColor: "background.paper",
            display: "flex",
            flexDirection: "column",
            overflow: "visible",
            boxShadow: isOver ? 6 : "none",
            zIndex: isOver ? 20 : 1,
        }, children: children }));
};
const KanbanTaskCard = ({ task, onEdit, onDelete, }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: task,
    });
    const style = transform
        ? {
            transform: CSS.Translate.toString(transform),
            boxShadow: "0 12px 20px rgba(0,0,0,0.25)",
            opacity: 0.95,
            zIndex: 1400,
        }
        : undefined;
    return (_jsx(Box, { ref: setNodeRef, ...listeners, ...attributes, sx: {
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.default",
            p: 2,
            mb: 2,
            cursor: "grab",
            position: "relative",
            opacity: isDragging ? 0.85 : 1,
            zIndex: isDragging ? 1200 : 10,
            backgroundClip: "padding-box",
            touchAction: "none",
            ...style,
        }, children: _jsxs(Stack, { spacing: 1, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: task.title }), _jsxs(Box, { children: [_jsx(IconButton, { size: "small", onClick: () => onEdit(task), children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", onClick: () => onDelete(task), children: _jsx(DeleteIcon, { fontSize: "small" }) })] })] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [dayjs(task.start_date).format("DD/MM/YY"), " \u2192 ", dayjs(task.end_date).format("DD/MM/YY")] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Responsable: ", task.assignee || "Sin asignar"] }), _jsx(LinearProgress, { variant: "determinate", value: task.progress, color: task.status === "done" ? "success" : "primary" })] }) }));
};
const TaskBoard = ({ tasks, onEdit, onDelete, onStatusChange }) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const handleDragEnd = (event) => {
        const task = event.active.data.current;
        if (!task || !event.over)
            return;
        const targetStatus = event.over.id;
        if (task.status !== targetStatus) {
            onStatusChange(task, targetStatus);
        }
    };
    return (_jsx(DndContext, { sensors: sensors, onDragEnd: handleDragEnd, children: _jsx(Box, { sx: { display: "flex", gap: 2, alignItems: "flex-start" }, children: Object.entries(STATUS_META).map(([status, meta]) => (_jsxs(KanbanColumn, { status: status, children: [_jsxs(Box, { sx: {
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            p: 2,
                            backgroundColor: "background.paper",
                        }, children: [_jsx(Typography, { variant: "subtitle1", children: meta.label }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [(tasks ?? []).filter((task) => task.status === status).length, " tareas"] })] }), _jsx(Box, { sx: { flex: 1, p: 2, overflowY: "auto", position: "relative", zIndex: 5 }, children: (tasks ?? [])
                            .filter((task) => task.status === status)
                            .map((task) => (_jsx(KanbanTaskCard, { task: task, onEdit: onEdit, onDelete: onDelete }, task.id))) })] }, status))) }) }));
};
export default TaskBoard;
