import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

import { useProjects } from "../hooks/useProjects";
import apiClient from "../api/client";
import { useSession } from "../store/useSession";

type ProjectForm = {
  name: string;
  mandante: string;
  status: string;
  budget: number;
  start_date: Dayjs | null;
  end_date: Dayjs | null;
};

const statusOptions = [
  { value: "draft", label: "Planificacion" },
  { value: "in_design", label: "Diseno en curso" },
  { value: "in_review", label: "En revision" },
  { value: "delivered", label: "Entregado" },
];

const defaultForm: ProjectForm = {
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
  const [form, setForm] = useState<ProjectForm>(defaultForm);
  const setProject = useSession((state) => state.setProject);
  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: async (payload: ProjectForm) => {
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Proyectos totales
              </Typography>
              <Typography variant="h5">{projectMetrics.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Entregados
              </Typography>
              <Typography variant="h5">{projectMetrics.delivered}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Presupuesto total CLP
              </Typography>
              <Typography variant="h5">
                {projectMetrics.budget.toLocaleString("es-CL")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Proyectos</Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Nuevo proyecto
        </Button>
      </Box>

      <Grid container spacing={2}>
        {(projects ?? []).map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card
              variant="outlined"
              onClick={() => setProject(project.id)}
              sx={{ cursor: "pointer", borderColor: "divider" }}
            >
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="h6">{project.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Estado: {statusOptions.find((opt) => opt.value === project.status)?.label ?? project.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Mandante: {project.mandante ?? "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Presupuesto: CLP {(project.budget ?? 0).toLocaleString("es-CL")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {project.start_date ?? "-"} → {project.end_date ?? "-"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo proyecto</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nombre"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Mandante"
            value={form.mandante}
            onChange={(event) => setForm((prev) => ({ ...prev, mandante: event.target.value }))}
            fullWidth
          />
          <TextField
            label="Estado"
            select
            value={form.status}
            onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            fullWidth
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Presupuesto (CLP)"
            type="number"
            value={form.budget}
            onChange={(event) => setForm((prev) => ({ ...prev, budget: Number(event.target.value) }))}
            fullWidth
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Inicio"
              type="date"
              fullWidth
              value={form.start_date?.format("YYYY-MM-DD")}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  start_date: dayjs(event.target.value),
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Termino"
              type="date"
              fullWidth
              value={form.end_date?.format("YYYY-MM-DD")}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  end_date: dayjs(event.target.value),
                }))
              }
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => createProjectMutation.mutate(form)}
            disabled={!form.name.trim()}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsPage;
