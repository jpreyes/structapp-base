import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";
import { useMemo } from "react";

import { useTasks } from "../hooks/useTasks";
import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";

const statusLabels: Record<string, string> = {
  todo: "Por iniciar",
  doing: "En curso",
  blocked: "Bloqueada",
  done: "Completada",
};

const statusColors: Record<string, string> = {
  todo: "default",
  doing: "primary",
  blocked: "error",
  done: "success",
};

const TasksPage = () => {
  const projectId = useSession((state) => state.projectId);
  const { data: projects } = useProjects();
  const activeProjectId = projectId ?? projects?.[0]?.id;
  const { data: tasks } = useTasks(activeProjectId);

  const grouped = useMemo(() => {
    const buckets: Record<string, typeof tasks> = { todo: [], doing: [], blocked: [], done: [] };
    (tasks ?? []).forEach((task) => {
      buckets[task.status] = [...(buckets[task.status] ?? []), task];
    });
    return buckets;
  }, [tasks]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h6">Tareas por estado</Typography>
      <Grid container spacing={2}>
        {Object.entries(grouped).map(([status, items]) => (
          <Grid item xs={12} md={3} key={status}>
            <Card sx={{ borderColor: "divider" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle1">{statusLabels[status] ?? status}</Typography>
                  <Chip label={items?.length ?? 0} color={statusColors[status] as any} />
                </Box>
                {(items ?? []).map((task) => (
                  <Box key={task.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
                    <Typography variant="subtitle2">{task.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {task.start_date} → {task.end_date}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Responsable: {task.assignee ?? "-"}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={task.progress}
                        color={status === "done" ? "success" : "primary"}
                      />
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TasksPage;
