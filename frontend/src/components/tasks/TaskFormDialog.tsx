import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import { Task } from "../../hooks/useTasks";

const statusOptions = [
  { value: "todo", label: "Por iniciar" },
  { value: "doing", label: "En curso" },
  { value: "blocked", label: "Bloqueada" },
  { value: "done", label: "Completada" },
];

export type TaskFormValues = {
  title: string;
  start_date: Dayjs;
  end_date: Dayjs;
  status: string;
  progress: number;
  assignee: string;
  notes: string;
};

const defaultValues: TaskFormValues = {
  title: "",
  start_date: dayjs(),
  end_date: dayjs().add(3, "day"),
  status: "todo",
  progress: 0,
  assignee: "",
  notes: "",
};

interface TaskFormDialogProps {
  open: boolean;
  loading?: boolean;
  initialTask?: Task | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

const TaskFormDialog = ({ open, loading, initialTask, onClose, onSubmit }: TaskFormDialogProps) => {
  const [values, setValues] = useState<TaskFormValues>(defaultValues);

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
    } else {
      setValues(defaultValues);
    }
  }, [open, initialTask]);

  const handleChange = (key: keyof TaskFormValues, value: TaskFormValues[typeof key]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "start_date" && dayjs(value as Dayjs).isAfter(next.end_date)) {
        next.end_date = value as Dayjs;
      }
      if (key === "end_date" && dayjs(value as Dayjs).isBefore(next.start_date)) {
        next.start_date = value as Dayjs;
      }
      return next;
    });
  };

  const handleSubmit = () => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialTask ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Título"
            fullWidth
            value={values.title}
            onChange={(event) => handleChange("title", event.target.value)}
            required
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Inicio"
              type="date"
              fullWidth
              value={values.start_date.format("YYYY-MM-DD")}
              onChange={(event) => handleChange("start_date", dayjs(event.target.value))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Término"
              type="date"
              fullWidth
              value={values.end_date.format("YYYY-MM-DD")}
              onChange={(event) => handleChange("end_date", dayjs(event.target.value))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              select
              label="Estado"
              value={values.status}
              onChange={(event) => handleChange("status", event.target.value)}
              fullWidth
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Progreso (%)"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              value={values.progress}
              onChange={(event) => {
                const numeric = Number(event.target.value);
                const bounded = Number.isFinite(numeric)
                  ? Math.min(100, Math.max(0, numeric))
                  : 0;
                handleChange("progress", bounded);
              }}
              fullWidth
            />
          </Box>
          <TextField
            label="Responsable"
            value={values.assignee}
            onChange={(event) => handleChange("assignee", event.target.value)}
            fullWidth
          />
          <TextField
            label="Notas"
            value={values.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !values.title.trim()}
        >
          {initialTask ? "Guardar cambios" : "Crear"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskFormDialog;
