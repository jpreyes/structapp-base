import {
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { useSession } from "../store/useSession";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const projectId = useSession((state) => state.projectId);
  const setProject = useSession((state) => state.setProject);
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks(projectId ?? projects?.[0]?.id);
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    const totalProjects = projects?.length ?? 0;
    const totalBudget = projects?.reduce((acc, project) => acc + (project.budget ?? 0), 0) ?? 0;
    const totalTasks = tasks?.length ?? 0;
    const completedTasks = tasks?.filter((task) => task.status === "done").length ?? 0;
    const totalPaid = projects?.reduce((acc, project) => acc + (project.payments_pagado ?? 0), 0) ?? 0;
    const totalOutstanding = projects?.reduce((acc, project) => acc + (project.payments_saldo ?? 0), 0) ?? 0;
    return { totalProjects, totalBudget, totalTasks, completedTasks, totalPaid, totalOutstanding };
  }, [projects, tasks]);

  const events = useMemo(() => {
    if (!projects) return [];
    return projects
      .filter(
        (project) =>
          project.status !== "delivered" &&
          !project.is_archived &&
          project.start_date
      )
      .map((project) => ({
        id: project.id,
        title: project.name,
        start: project.start_date ?? undefined,
        end: project.end_date ?? project.start_date ?? undefined,
        allDay: true,
        backgroundColor: "#2563eb",
      }));
  }, [projects]);

  const formatCurrency = (value: number | null | undefined) =>
    Number(value ?? 0).toLocaleString("es-CL");

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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Pagado total CLP
              </Typography>
              <Typography variant="h5">
                {metrics.totalPaid.toLocaleString("es-CL")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Saldo por cobrar CLP
              </Typography>
              <Typography variant="h5">
                {metrics.totalOutstanding.toLocaleString("es-CL")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resumen por proyecto
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Presupuesto (CLP)</TableCell>
                  <TableCell align="right">Facturado (CLP)</TableCell>
                  <TableCell align="right">Pagado (CLP)</TableCell>
                  <TableCell align="right">Saldo (CLP)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(projects ?? []).map((project) => (
                  <TableRow
                    key={project.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => {
                      setProject(project.id);
                      navigate(`/projects/${project.id}`);
                    }}
                  >
                    <TableCell>{project.name}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {project.status?.replace("_", " ") ?? "sin estado"}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(project.budget)}</TableCell>
                    <TableCell align="right">{formatCurrency(project.payments_facturado)}</TableCell>
                    <TableCell align="right">{formatCurrency(project.payments_pagado)}</TableCell>
                    <TableCell align="right">{formatCurrency(project.payments_saldo)}</TableCell>
                  </TableRow>
                ))}
                {(!projects || projects.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary">
                        Aún no hay proyectos registrados.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calendario de proyectos
          </Typography>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
            height={650}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
