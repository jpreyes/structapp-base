import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useProjectDetail } from "../hooks/useProjectDetail";
import { useSession } from "../store/useSession";
import PaymentFormDialog, { PaymentFormValues } from "../components/payments/PaymentFormDialog";
import TaskFormDialog, { TaskFormValues } from "../components/tasks/TaskFormDialog";
import { useProjects } from "../hooks/useProjects";
import { Payment } from "../hooks/usePayments";
import { Task } from "../hooks/useTasks";
import apiClient from "../api/client";

const statusOptions = [
  { value: "draft", label: "Planificación" },
  { value: "in_design", label: "Diseño en curso" },
  { value: "in_review", label: "En revisión" },
  { value: "delivered", label: "Entregado" },
];

type ProjectFormState = {
  name: string;
  mandante: string;
  status: string;
  budget: number;
  start_date: string;
  end_date: string;
};

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const setProject = useSession((state) => state.setProject);
  const { data, isLoading, isError } = useProjectDetail(projectId);
  const { data: projectList } = useProjects();
  const queryClient = useQueryClient();

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectFormState | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
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
    if (!projectId) return;
    queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
    queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
  };

  const projectMutation = useMutation({
    mutationFn: async (payload: Partial<ProjectFormState>) => {
      if (!projectId) throw new Error("No project selected");
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
    mutationFn: async (values: PaymentFormValues) => {
      if (!projectId) throw new Error("No project selected");
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
    mutationFn: async ({ paymentId, values }: { paymentId: string; values: PaymentFormValues }) => {
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
    mutationFn: async (paymentId: string) => {
      await apiClient.delete(`/payments/${paymentId}`);
    },
    onSuccess: () => {
      setPaymentToDelete(null);
      invalidateProjectQueries();
    },
  });

  const taskCreateMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      if (!projectId) throw new Error("No project selected");
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
    mutationFn: async ({ taskId, values }: { taskId: string; values: TaskFormValues }) => {
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
    mutationFn: async (taskId: string) => {
      await apiClient.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      setTaskToDelete(null);
      invalidateProjectQueries();
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("No project selected");
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
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { project, metrics, important_dates, tasks, payments } = data;
  const formatCurrency = (value: number | null | undefined) => Number(value ?? 0).toLocaleString("es-CL");

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
    if (!projectForm) return;
    projectMutation.mutate({
      name: projectForm.name,
      mandante: projectForm.mandante,
      status: projectForm.status,
      budget: projectForm.budget,
      start_date: projectForm.start_date,
      end_date: projectForm.end_date,
    });
  };

  const openPaymentDialog = (payment?: Payment) => {
    setEditingPayment(payment ?? null);
    setPaymentDialogOpen(true);
  };

  const handleSubmitPayment = (values: PaymentFormValues) => {
    if (editingPayment) {
      paymentUpdateMutation.mutate({ paymentId: editingPayment.id, values });
    } else {
      paymentCreateMutation.mutate(values);
    }
  };

  const openTaskDialog = (task?: Task) => {
    setEditingTask(task ?? null);
    setTaskDialogOpen(true);
  };

  const handleSubmitTask = (values: TaskFormValues) => {
    if (editingTask) {
      taskUpdateMutation.mutate({ taskId: editingTask.id, values });
    } else {
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <Link component={RouterLink} to="/projects" color="inherit">
          Proyectos
        </Link>
        <Typography color="text.primary">{project.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography variant="h4" fontWeight={600}>
              {project.name}
            </Typography>
            {projectList?.length ? (
              <TextField
                select
                size="small"
                label="Cambiar proyecto"
                value={projectId}
                onChange={(event) => {
                  const nextProjectId = event.target.value;
                  if (nextProjectId && nextProjectId !== projectId) {
                    setProject(nextProjectId);
                    navigate(`/projects/${nextProjectId}`);
                  }
                }}
                sx={{ minWidth: 220 }}
              >
                {projectList.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </Box>
          <Typography variant="body1" color="text.secondary">
            Mandante: {project.mandante ?? "—"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={project.status?.replace("_", " ") ?? "Sin estado"}
            color={
              project.status === "delivered"
                ? "success"
                : project.status === "in_review"
                ? "warning"
                : project.status === "in_design"
                ? "info"
                : "default"
            }
            sx={{ textTransform: "capitalize", fontWeight: 600 }}
          />
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOpenProjectEdit}>
            Editar proyecto
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteProjectOpen(true)}
          >
            Eliminar
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {paymentCards.map((card) => (
          <Grid item xs={12} md={3} key={card.label}>
            <Card
              sx={{ cursor: "pointer", transition: "all 0.2s ease", "&:hover": { boxShadow: (theme) => theme.shadows[6] } }}
              onClick={card.onClick}
            >
              <CardContent>
                <Typography variant="button" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h5">{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Fechas importantes</Typography>
                <Button size="small" onClick={handleOpenProjectEdit} startIcon={<EditIcon />}>
                  Editar
                </Button>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Inicio del proyecto"
                    secondary={important_dates.start_date ? dayjs(important_dates.start_date).format("DD/MM/YYYY") : "—"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Entrega estimada"
                    secondary={important_dates.end_date ? dayjs(important_dates.end_date).format("DD/MM/YYYY") : "—"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Próximo comienzo de tarea"
                    secondary={
                      important_dates.next_task_start
                        ? dayjs(important_dates.next_task_start).format("DD/MM/YYYY")
                        : "—"
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Próxima entrega de tarea"
                    secondary={
                      important_dates.next_task_due
                        ? dayjs(important_dates.next_task_due).format("DD/MM/YYYY")
                        : "—"
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado de tareas
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Total de tareas" secondary={metrics.total_tasks} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Completadas" secondary={metrics.completed_tasks} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Pendientes"
                    secondary={metrics.total_tasks - metrics.completed_tasks}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">Tareas del proyecto</Typography>
                <Button startIcon={<AddIcon />} onClick={() => openTaskDialog()}>
                  Nueva tarea
                </Button>
              </Box>
              {tasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay tareas registradas.
                </Typography>
              ) : (
                tasks.map((task) => (
                  <Box
                    key={task.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {task.title}
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => openTaskDialog(task)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setTaskToDelete(task)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(task.start_date).format("DD/MM/YY")} → {dayjs(task.end_date).format("DD/MM/YY")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Estado: {task.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Responsable: {task.assignee || "Sin asignar"}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">Pagos del proyecto</Typography>
                <Button startIcon={<AddIcon />} onClick={() => openPaymentDialog()}>
                  Nuevo movimiento
                </Button>
              </Box>
              {payments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay movimientos registrados.
                </Typography>
              ) : (
                payments.map((payment) => (
                  <Box
                    key={payment.id}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography variant="subtitle1" fontWeight={600} textTransform="capitalize">
                        {payment.kind.replace("_", " ")}
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => openPaymentDialog(payment)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setPaymentToDelete(payment)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Fecha: {dayjs(payment.event_date).format("DD/MM/YY")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monto: CLP {formatCurrency(payment.amount)}
                    </Typography>
                    {payment.reference && (
                      <Typography variant="body2" color="text.secondary">
                        Referencia: {payment.reference}
                      </Typography>
                    )}
                    {payment.note && (
                      <Typography variant="body2" color="text.secondary">
                        Nota: {payment.note}
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={editProjectOpen && !!projectForm} onClose={handleCloseProjectEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar proyecto</DialogTitle>
        <DialogContent dividers>
          {projectForm && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nombre"
                value={projectForm.name}
                onChange={(event) =>
                  setProjectForm((prev) => prev && { ...prev, name: event.target.value })
                }
              />
              <TextField
                label="Mandante"
                value={projectForm.mandante}
                onChange={(event) =>
                  setProjectForm((prev) => prev && { ...prev, mandante: event.target.value })
                }
              />
              <TextField
                select
                label="Estado"
                value={projectForm.status}
                onChange={(event) =>
                  setProjectForm((prev) => prev && { ...prev, status: event.target.value })
                }
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
                value={projectForm.budget}
                onChange={(event) =>
                  setProjectForm((prev) => prev && { ...prev, budget: Number(event.target.value) })
                }
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Inicio"
                  type="date"
                  value={projectForm.start_date}
                  onChange={(event) =>
                    setProjectForm((prev) => prev && { ...prev, start_date: event.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Término"
                  type="date"
                  value={projectForm.end_date}
                  onChange={(event) =>
                    setProjectForm((prev) => prev && { ...prev, end_date: event.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProjectEdit}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmitProject}
            disabled={projectMutation.isPending || !projectForm?.name.trim()}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <PaymentFormDialog
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setEditingPayment(null);
        }}
        onSubmit={handleSubmitPayment}
        initialPayment={editingPayment ?? undefined}
        loading={paymentCreateMutation.isPending || paymentUpdateMutation.isPending}
      />

      <TaskFormDialog
        open={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmitTask}
        initialTask={editingTask ?? undefined}
        loading={taskCreateMutation.isPending || taskUpdateMutation.isPending}
      />

      <Dialog open={deleteProjectOpen} onClose={() => setDeleteProjectOpen(false)}>
        <DialogTitle>Eliminar proyecto</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que quiere eliminar el proyecto "{project.name}"? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProjectOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteProjectMutation.mutate()}
            disabled={deleteProjectMutation.isPending}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(paymentToDelete)} onClose={() => setPaymentToDelete(null)}>
        <DialogTitle>Eliminar movimiento</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Seguro que deseas eliminar el movimiento "
            {paymentToDelete?.reference ?? paymentToDelete?.kind}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentToDelete(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => paymentToDelete && paymentDeleteMutation.mutate(paymentToDelete.id)}
            disabled={paymentDeleteMutation.isPending}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(taskToDelete)} onClose={() => setTaskToDelete(null)}>
        <DialogTitle>Eliminar tarea</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Seguro que deseas eliminar la tarea "{taskToDelete?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskToDelete(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => taskToDelete && taskDeleteMutation.mutate(taskToDelete.id)}
            disabled={taskDeleteMutation.isPending}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetailPage;
