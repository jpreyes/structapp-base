import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { useTasks, Task } from "../hooks/useTasks";
import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";
import apiClient from "../api/client";
import TaskBoard, { STATUS_META } from "../components/tasks/TaskBoard";
import TaskFormDialog, { TaskFormValues } from "../components/tasks/TaskFormDialog";
import TaskCalendar from "../components/tasks/TaskCalendar";
import TaskGantt from "../components/tasks/TaskGantt";

type TaskTab = "kanban" | "calendar" | "gantt";

const TasksPage = () => {
  const sessionProjectId = useSession((state) => state.projectId);
  const setProjectInSession = useSession((state) => state.setProject);
  const { data: projects } = useProjects();
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const isWorkspaceView = Boolean(routeProjectId);
  const [activeTab, setActiveTab] = useState<TaskTab>("kanban");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    isWorkspaceView ? routeProjectId : sessionProjectId
  );
  const allowAllProjects = !isWorkspaceView;
  const isAllProjects = allowAllProjects && selectedProjectId === "all";
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);

  const effectiveProjectId =
    routeProjectId ?? (isAllProjects ? undefined : selectedProjectId ?? projects?.[0]?.id);
  const { data: projectTasks = [] } = useTasks(effectiveProjectId);
  const { data: allTasks = [], isFetching: isFetchingAll } = useQuery({
    queryKey: ["tasks", "all"],
    enabled: isAllProjects && Boolean(projects?.length),
    queryFn: async () => {
      const responses = await Promise.all(
        (projects ?? []).map((project) => apiClient.get<Task[]>(`/tasks/${project.id}`))
      );
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
    const byStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] ?? 0) + 1;
        return acc;
      },
      { todo: 0, doing: 0, blocked: 0, done: 0 } as Record<string, number>
    );
    return { total: tasks.length, byStatus };
  }, [tasks]);

  const activeProjectName = useMemo(() => {
    if (!projects?.length || !effectiveProjectId) {
      return "";
    }
    return projects.find((project) => project.id === effectiveProjectId)?.name ?? "";
  }, [projects, effectiveProjectId]);

  const createTaskMutation = useMutation({
    mutationFn: async (payload: TaskFormValues & { projectId: string }) => {
      const { data } = await apiClient.post<Task>("/tasks", {
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
    mutationFn: async ({ taskId, patch }: { taskId: string; patch: Partial<Task> }) => {
      const { data } = await apiClient.patch<Task>(`/tasks/${taskId}`, patch);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setFormOpen(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setTaskPendingDelete(task);
  };

  const handleStatusChange = (task: Task, status: string) => {
    if (task.status === status) return;
    // En modo "todos" evitamos optimismo cruzado y solo invalidamos luego del patch.
    if (!effectiveProjectId && isAllProjects) {
      updateTaskMutation.mutate({ taskId: task.id, patch: { status } });
      return;
    }
    if (!effectiveProjectId) return;
    const queryKey = ["tasks", effectiveProjectId] as const;
    const previous = queryClient.getQueryData<Task[]>(queryKey);
    const updatedTask = { ...task, status };

    queryClient.setQueryData<Task[]>(queryKey, (current = []) => {
      const remaining = current.filter((item) => item.id !== task.id);
      return [updatedTask, ...remaining];
    });

    updateTaskMutation.mutate(
      {
        taskId: task.id,
        patch: { status },
      },
      {
        onError: () => {
          queryClient.setQueryData(queryKey, previous);
        },
      }
    );
  };

  const handleSubmitForm = (values: TaskFormValues) => {
    if (!effectiveProjectId) return;
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
    } else {
      createTaskMutation.mutate({
        ...values,
        projectId: effectiveProjectId,
      });
    }
  };

  const handleSelectTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      handleEditTask(task);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography variant="h5">Tareas</Typography>
          {!isWorkspaceView ? (
            <TextField
              select
              label="Proyecto activo"
              size="small"
              value={isAllProjects ? "all" : effectiveProjectId ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedProjectId(value);
                setProjectInSession(value === "all" ? undefined : value);
              }}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="all">Todos los proyectos</MenuItem>
              {(projects ?? []).map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Proyecto: {activeProjectName || "Sin proyecto"}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          onClick={handleCreateClick}
          disabled={!effectiveProjectId || isAllProjects}
        >
          Nueva tarea
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Total de tareas
              </Typography>
              <Typography variant="h5">{metrics.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {Object.entries(STATUS_META).map(([status, meta]) => (
          <Grid item xs={12} sm={6} md={3} key={status}>
            <Card>
              <CardContent>
                <Typography variant="button" color="text.secondary">
                  {meta.label}
                </Typography>
                <Typography variant="h5">{metrics.byStatus[status] ?? 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="kanban" label="Kanban" />
        <Tab value="calendar" label="Calendario" />
        <Tab value="gantt" label="Gantt" />
      </Tabs>

      {activeTab === "kanban" && (
        <TaskBoard
          tasks={tasks}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onStatusChange={handleStatusChange}
        />
      )}

      {activeTab === "calendar" && (
        <TaskCalendar tasks={tasks} onSelectTask={handleSelectTask} />
      )}

      {activeTab === "gantt" && <TaskGantt tasks={tasks} onSelectTask={handleSelectTask} />}

      <TaskFormDialog
        open={formOpen}
        initialTask={editingTask ?? undefined}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmitForm}
        loading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      <Dialog
        open={Boolean(taskPendingDelete)}
        onClose={() => setTaskPendingDelete(null)}
      >
        <DialogTitle>Eliminar tarea</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que deseas eliminar la tarea "{taskPendingDelete?.title}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskPendingDelete(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => taskPendingDelete && deleteTaskMutation.mutate(taskPendingDelete.id)}
            disabled={deleteTaskMutation.isPending}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksPage;
