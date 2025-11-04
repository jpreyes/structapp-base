import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { useSession } from "../store/useSession";

const DashboardPage = () => {
  const projectId = useSession((state) => state.projectId);
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks(projectId ?? projects?.[0]?.id);

  const metrics = useMemo(() => {
    const totalProjects = projects?.length ?? 0;
    const totalBudget = projects?.reduce((acc, project) => acc + (project.budget ?? 0), 0) ?? 0;
    const totalTasks = tasks?.length ?? 0;
    const completedTasks = tasks?.filter((task) => task.status === "done").length ?? 0;
    return { totalProjects, totalBudget, totalTasks, completedTasks };
  }, [projects, tasks]);

  const events = useMemo(() => {
    if (!tasks) return [];
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      start: task.start_date,
      end: task.end_date,
      backgroundColor:
        task.status === "done"
          ? "#22c55e"
          : task.status === "doing"
          ? "#0ea5e9"
          : task.status === "blocked"
          ? "#f97316"
          : "#64748b",
    }));
  }, [tasks]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Proyectos
              </Typography>
              <Typography variant="h5">{metrics.totalProjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Presupuesto total CLP
              </Typography>
              <Typography variant="h5">
                {metrics.totalBudget.toLocaleString("es-CL")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Tareas
              </Typography>
              <Typography variant="h5">{metrics.totalTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Tareas completadas
              </Typography>
              <Typography variant="h5">{metrics.completedTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calendario de tareas
          </Typography>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            events={events}
            height={650}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,listWeek",
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
