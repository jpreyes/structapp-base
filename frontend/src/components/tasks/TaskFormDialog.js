import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
const statusOptions = [
    { value: "todo", label: "Por iniciar" },
    { value: "doing", label: "En curso" },
    { value: "blocked", label: "Bloqueada" },
    { value: "done", label: "Completada" },
];
const defaultValues = {
    title: "",
    start_date: dayjs(),
    end_date: dayjs().add(3, "day"),
    status: "todo",
    progress: 0,
    assignee: "",
    notes: "",
};
const TaskFormDialog = ({ open, loading, initialTask, onClose, onSubmit }) => {
    const [values, setValues] = useState(defaultValues);
    useEffect(() => {
        if (!open) {
            setValues(defaultValues);
            return;
        }
        if (initialTask) {
            setValues({
                title: initialTask.title,
                start_date: dayjs(initialTask.start_date),
                end_date: dayjs(initialTask.end_date),
                status: initialTask.status,
                progress: initialTask.progress,
                assignee: initialTask.assignee ?? "",
                notes: initialTask.notes ?? "",
            });
        }
        else {
            setValues(defaultValues);
        }
    }, [open, initialTask]);
    const handleChange = (key, value) => {
        setValues((prev) => {
            const next = { ...prev, [key]: value };
            if (key === "start_date" && dayjs(value).isAfter(next.end_date)) {
                next.end_date = value;
            }
            if (key === "end_date" && dayjs(value).isBefore(next.start_date)) {
                next.start_date = value;
            }
            return next;
        });
    };
    const handleSubmit = () => {
        onSubmit(values);
    };
    return (_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "sm", children: [_jsx(DialogTitle, { children: initialTask ? "Editar tarea" : "Nueva tarea" }), _jsx(DialogContent, { dividers: true, children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "T\u00EDtulo", fullWidth: true, value: values.title, onChange: (event) => handleChange("title", event.target.value), required: true }), _jsxs(Box, { sx: { display: "flex", gap: 2 }, children: [_jsx(TextField, { label: "Inicio", type: "date", fullWidth: true, value: values.start_date.format("YYYY-MM-DD"), onChange: (event) => handleChange("start_date", dayjs(event.target.value)), InputLabelProps: { shrink: true } }), _jsx(TextField, { label: "T\u00E9rmino", type: "date", fullWidth: true, value: values.end_date.format("YYYY-MM-DD"), onChange: (event) => handleChange("end_date", dayjs(event.target.value)), InputLabelProps: { shrink: true } })] }), _jsxs(Box, { sx: { display: "flex", gap: 2 }, children: [_jsx(TextField, { select: true, label: "Estado", value: values.status, onChange: (event) => handleChange("status", event.target.value), fullWidth: true, children: statusOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, option.value))) }), _jsx(TextField, { label: "Progreso (%)", type: "number", inputProps: { min: 0, max: 100 }, value: values.progress, onChange: (event) => {
                                        const numeric = Number(event.target.value);
                                        const bounded = Number.isFinite(numeric)
                                            ? Math.min(100, Math.max(0, numeric))
                                            : 0;
                                        handleChange("progress", bounded);
                                    }, fullWidth: true })] }), _jsx(TextField, { label: "Responsable", value: values.assignee, onChange: (event) => handleChange("assignee", event.target.value), fullWidth: true }), _jsx(TextField, { label: "Notas", value: values.notes, onChange: (event) => handleChange("notes", event.target.value), multiline: true, minRows: 3, fullWidth: true })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: handleSubmit, disabled: loading || !values.title.trim(), children: initialTask ? "Guardar cambios" : "Crear" })] })] }));
};
export default TaskFormDialog;
