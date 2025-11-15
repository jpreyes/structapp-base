import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AttachmentIcon from "@mui/icons-material/Attachment";
import ScienceIcon from "@mui/icons-material/Science";
import ChecklistIcon from "@mui/icons-material/Checklist";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";
import {
  useProjectInspectionDamages,
  useProjectInspectionDocuments,
  useProjectInspectionTests,
  useProjectInspections,
} from "../hooks/useProjectInspections";
import apiClient from "../api/client";

const conditionOptions = [
  { value: "operativa", label: "Operativa" },
  { value: "observacion", label: "Con observaciones" },
  { value: "critica", label: "Crítica" },
] as const;

type InspectionFormState = {
  structure_name: string;
  location: string;
  inspection_date: string;
  inspector: string;
  overall_condition: (typeof conditionOptions)[number]["value"];
  summary: string;
  photos: string;
};

const ProjectInspectionsPage = () => {
  const sessionProjectId = useSession((state) => state.projectId);
  const setProject = useSession((state) => state.setProject);
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(sessionProjectId);
  const effectiveProjectId = selectedProjectId ?? projects?.[0]?.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (routeProjectId) {
      setSelectedProjectId(routeProjectId);
      setProject(routeProjectId);
    }
  }, [routeProjectId, setProject]);

  const { data: inspections = [] } = useProjectInspections(effectiveProjectId);
  const { data: damages = [] } = useProjectInspectionDamages(effectiveProjectId);
  const { data: tests = [] } = useProjectInspectionTests(effectiveProjectId);
  const { data: documents = [] } = useProjectInspectionDocuments(effectiveProjectId);

  useEffect(() => {
    if (!selectedProjectId && projects?.length) {
      const firstProjectId = sessionProjectId ?? projects[0].id;
      setSelectedProjectId(firstProjectId);
      setProject(firstProjectId);
    }
  }, [projects, selectedProjectId, sessionProjectId, setProject]);

  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [inspectionForm, setInspectionForm] = useState<InspectionFormState>({
    structure_name: "",
    location: "",
    inspection_date: dayjs().format("YYYY-MM-DD"),
    inspector: "",
    overall_condition: "operativa",
    summary: "",
    photos: "",
  });

  const invalidateInspectionQueries = () => {
    if (!effectiveProjectId) return;
    queryClient.invalidateQueries({ queryKey: ["project-inspections", effectiveProjectId] });
    queryClient.invalidateQueries({ queryKey: ["project-inspections-damages", effectiveProjectId] });
    queryClient.invalidateQueries({ queryKey: ["project-inspections-tests", effectiveProjectId] });
    queryClient.invalidateQueries({ queryKey: ["project-inspections-documents", effectiveProjectId] });
  };

  const createInspectionMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveProjectId) throw new Error("No hay proyecto activo");
      const photos = inspectionForm.photos
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);
      const { data } = await apiClient.post("/inspections", {
        project_id: effectiveProjectId,
        structure_name: inspectionForm.structure_name,
        location: inspectionForm.location,
        inspection_date: inspectionForm.inspection_date,
        inspector: inspectionForm.inspector,
        overall_condition: inspectionForm.overall_condition,
        summary: inspectionForm.summary,
        photos,
      });
      return data;
    },
    onSuccess: () => {
      setInspectionDialogOpen(false);
      setInspectionForm({
        structure_name: "",
        location: "",
        inspection_date: dayjs().format("YYYY-MM-DD"),
        inspector: "",
        overall_condition: "operativa",
        summary: "",
        photos: "",
      });
      invalidateInspectionQueries();
    },
  });

  const confirmDeletion = (message: string) => window.confirm(message);

  const deleteInspectionMutation = useMutation({
    mutationFn: async (inspectionId: string) => {
      await apiClient.delete(`/inspections/${inspectionId}`);
    },
    onSuccess: () => {
      invalidateInspectionQueries();
    },
  });

  const summaryCards = useMemo(
    () => [
      { title: "Inspecciones", value: inspections.length, icon: <ChecklistIcon /> },
      { title: "Daños", value: damages.length, icon: <AttachmentIcon /> },
      { title: "Ensayos", value: tests.length, icon: <ScienceIcon /> },
      { title: "Documentos", value: documents.length, icon: <DescriptionIcon /> },
    ],
    [inspections.length, damages.length, tests.length, documents.length]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <Link component={RouterLink} to="/projects" color="inherit">
          Proyectos
        </Link>
        <Typography color="text.primary">Inspecciones y ensayos</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: { md: "center" },
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          Plan de inspecciones
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          select
          label="Proyecto activo"
          size="small"
          sx={{ minWidth: 220 }}
          value={effectiveProjectId ?? ""}
          onChange={(event) => {
            setSelectedProjectId(event.target.value);
            setProject(event.target.value);
          }}
        >
          {(projects ?? []).map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => invalidateInspectionQueries()}
          disabled={!effectiveProjectId}
        >
          Actualizar datos
        </Button>
      </Box>

      <Grid container spacing={2}>
        {summaryCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  {card.icon}
                  <Box>
                    <Typography variant="h6">{card.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Inspecciones de estructuras existentes</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setInspectionDialogOpen(true)}
            disabled={!effectiveProjectId}
          >
            Nueva inspección
          </Button>
        </CardContent>
        <List dense>
          {inspections.length === 0 && (
            <ListItem>
              <ListItemText primary="No hay inspecciones registradas" />
            </ListItem>
          )}
          {inspections.map((inspection) => {
            const detailHref = effectiveProjectId
              ? `/projects/${effectiveProjectId}/inspections/${inspection.id}`
              : "#";
            return (
              <ListItem
                key={inspection.id}
                divider
                alignItems="flex-start"
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label={`Eliminar inspección ${inspection.structure_name}`}
                    onClick={() => {
                      if (!confirmDeletion(`¿Eliminar la inspección de ${inspection.structure_name}?`)) {
                        return;
                      }
                      deleteInspectionMutation.mutate(inspection.id);
                    }}
                    disabled={deleteInspectionMutation.isPending}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemButton component={RouterLink} to={detailHref} disabled={!effectiveProjectId}>
                  <ListItemText
                    primary={
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                        <Typography fontWeight={600}>{inspection.structure_name}</Typography>
                        <Chip
                          label={
                            conditionOptions.find((item) => item.value === inspection.overall_condition)?.label ??
                            "Sin dato"
                          }
                          color={
                            inspection.overall_condition === "operativa"
                              ? "success"
                              : inspection.overall_condition === "critica"
                              ? "error"
                              : "warning"
                          }
                          size="small"
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary" component="div">
                          {inspection.location} · {dayjs(inspection.inspection_date).format("DD/MM/YYYY")} · Inspector: {" "}
                          {inspection.inspector}
                        </Typography>
                        <Typography variant="body2" component="div">
                          {inspection.summary}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {(inspection.photos ?? []).map((url) => (
                            <Chip
                              key={url}
                              label="Foto"
                              component="span"
                              onClick={() => window.open(url, "_blank", "noopener")}
                              clickable
                              variant="outlined"
                              size="small"
                            />
                          ))}
                        </Stack>
                      </Stack>
                    }
                    primaryTypographyProps={{ component: "div" }}
                    secondaryTypographyProps={{ component: "div" }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Card>

      <Dialog open={inspectionDialogOpen} onClose={() => setInspectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva inspección</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Estructura / elemento"
              value={inspectionForm.structure_name}
              onChange={(event) => setInspectionForm((prev) => ({ ...prev, structure_name: event.target.value }))}
            />
            <TextField
              label="Ubicación"
              value={inspectionForm.location}
              onChange={(event) => setInspectionForm((prev) => ({ ...prev, location: event.target.value }))}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                type="date"
                label="Fecha"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={inspectionForm.inspection_date}
                onChange={(event) => setInspectionForm((prev) => ({ ...prev, inspection_date: event.target.value }))}
              />
              <TextField
                label="Inspector"
                fullWidth
                value={inspectionForm.inspector}
                onChange={(event) => setInspectionForm((prev) => ({ ...prev, inspector: event.target.value }))}
              />
            </Stack>
            <TextField
              select
              label="Condición"
              value={inspectionForm.overall_condition}
              onChange={(event) =>
                setInspectionForm((prev) => ({
                  ...prev,
                  overall_condition: event.target.value as InspectionFormState["overall_condition"],
                }))
              }
            >
              {conditionOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Resumen de hallazgos"
              multiline
              minRows={3}
              value={inspectionForm.summary}
              onChange={(event) => setInspectionForm((prev) => ({ ...prev, summary: event.target.value }))}
            />
            <TextField
              label="URLs de fotografías (una por línea)"
              multiline
              minRows={3}
              value={inspectionForm.photos}
              onChange={(event) => setInspectionForm((prev) => ({ ...prev, photos: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInspectionDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => createInspectionMutation.mutate()}
            disabled={!effectiveProjectId || !inspectionForm.structure_name.trim() || createInspectionMutation.isPending}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectInspectionsPage;
