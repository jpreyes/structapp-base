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
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AttachmentIcon from "@mui/icons-material/Attachment";
import ScienceIcon from "@mui/icons-material/Science";
import ChecklistIcon from "@mui/icons-material/Checklist";
import DescriptionIcon from "@mui/icons-material/Description";
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
import { DAMAGE_CAUSES, DAMAGE_SEVERITIES, DAMAGE_TYPES } from "../constants/inspectionCatalog";

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

type DamageFormState = {
  structure: string;
  location: string;
  damage_type: string;
  damage_cause: string;
  severity: (typeof DAMAGE_SEVERITIES)[number];
  extent: string;
  comments: string;
  damage_photo_url: string;
};

type TestFormState = {
  test_type: string;
  method: string;
  standard: string;
  executed_at: string;
  laboratory: string;
  sample_location: string;
  result_summary: string;
  attachment_url: string;
};

type DocumentFormState = {
  title: string;
  category: "informe" | "fotografia" | "ensayo" | "otro";
  issued_at: string;
  issued_by: string;
  url: string;
  notes: string;
};

const severityColor = (severity: string) => {
  switch (severity) {
    case "Media":
      return "warning";
    case "Alta":
    case "Muy Alta":
      return "error";
    default:
      return "default";
  }
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

  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);

  const [inspectionForm, setInspectionForm] = useState<InspectionFormState>({
    structure_name: "",
    location: "",
    inspection_date: dayjs().format("YYYY-MM-DD"),
    inspector: "",
    overall_condition: "operativa",
    summary: "",
    photos: "",
  });

  const [damageForm, setDamageForm] = useState<DamageFormState>({
    structure: "",
    location: "",
    damage_type: DAMAGE_TYPES[0],
    damage_cause: DAMAGE_CAUSES[0],
    severity: "Media",
    extent: "",
    comments: "",
    damage_photo_url: "",
  });

  const [testForm, setTestForm] = useState<TestFormState>({
    test_type: "",
    method: "",
    standard: "",
    executed_at: dayjs().format("YYYY-MM-DD"),
    laboratory: "",
    sample_location: "",
    result_summary: "",
    attachment_url: "",
  });

  const [documentForm, setDocumentForm] = useState<DocumentFormState>({
    title: "",
    category: "informe",
    issued_at: dayjs().format("YYYY-MM-DD"),
    issued_by: "",
    url: "",
    notes: "",
  });

  const [damageFilter, setDamageFilter] = useState({
    severity: "",
    damage_type: "",
    damage_cause: "",
  });

  const filteredDamages = useMemo(() => {
    return damages.filter((damage) => {
      if (damageFilter.severity && damage.severity !== damageFilter.severity) return false;
      if (damageFilter.damage_type && damage.damage_type !== damageFilter.damage_type) return false;
      if (damageFilter.damage_cause && damage.damage_cause !== damageFilter.damage_cause) return false;
      return true;
    });
  }, [damages, damageFilter]);

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

  const createDamageMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveProjectId) throw new Error("No hay proyecto activo");
      const { data } = await apiClient.post("/inspection-damages", {
        project_id: effectiveProjectId,
        structure: damageForm.structure,
        location: damageForm.location,
        damage_type: damageForm.damage_type,
        damage_cause: damageForm.damage_cause,
        severity: damageForm.severity,
        extent: damageForm.extent,
        comments: damageForm.comments,
        damage_photo_url: damageForm.damage_photo_url || null,
      });
      return data;
    },
    onSuccess: () => {
      setDamageDialogOpen(false);
      setDamageForm({
        structure: "",
        location: "",
        damage_type: DAMAGE_TYPES[0],
        damage_cause: DAMAGE_CAUSES[0],
        severity: "Media",
        extent: "",
        comments: "",
        damage_photo_url: "",
      });
      invalidateInspectionQueries();
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveProjectId) throw new Error("No hay proyecto activo");
      const { data } = await apiClient.post("/inspection-tests", {
        project_id: effectiveProjectId,
        test_type: testForm.test_type,
        method: testForm.method || null,
        standard: testForm.standard || null,
        executed_at: testForm.executed_at,
        laboratory: testForm.laboratory || null,
        sample_location: testForm.sample_location || null,
        result_summary: testForm.result_summary,
        attachment_url: testForm.attachment_url || null,
      });
      return data;
    },
    onSuccess: () => {
      setTestDialogOpen(false);
      setTestForm({
        test_type: "",
        method: "",
        standard: "",
        executed_at: dayjs().format("YYYY-MM-DD"),
        laboratory: "",
        sample_location: "",
        result_summary: "",
        attachment_url: "",
      });
      invalidateInspectionQueries();
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveProjectId) throw new Error("No hay proyecto activo");
      const { data } = await apiClient.post("/inspection-documents", {
        project_id: effectiveProjectId,
        title: documentForm.title,
        category: documentForm.category,
        issued_at: documentForm.issued_at,
        issued_by: documentForm.issued_by || null,
        url: documentForm.url || null,
        notes: documentForm.notes || null,
      });
      return data;
    },
    onSuccess: () => {
      setDocumentDialogOpen(false);
      setDocumentForm({
        title: "",
        category: "informe",
        issued_at: dayjs().format("YYYY-MM-DD"),
        issued_by: "",
        url: "",
        notes: "",
      });
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
          {inspections.map((inspection) => (
            <ListItem key={inspection.id} divider alignItems="flex-start">
              <ListItemText
                primary={
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                    <Typography fontWeight={600}>{inspection.structure_name}</Typography>
                    <Chip
                      label={conditionOptions.find((item) => item.value === inspection.overall_condition)?.label ?? "Sin dato"}
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
                    <Typography variant="body2" color="text.secondary">
                      {inspection.location} · {dayjs(inspection.inspection_date).format("DD/MM/YYYY")} · Inspector:{" "}
                      {inspection.inspector}
                    </Typography>
                    <Typography variant="body2">{inspection.summary}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {(inspection.photos ?? []).map((url) => (
                        <Chip
                          key={url}
                          label="Foto"
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          clickable
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      </Card>

      <Card>
        <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Registro de daños</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setDamageDialogOpen(true)}
            disabled={!effectiveProjectId}
          >
            Registrar daño
          </Button>
        </CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ px: 3, pb: 2 }}>
          <TextField
            select
            label="Gravedad"
            value={damageFilter.severity}
            onChange={(event) => setDamageFilter((prev) => ({ ...prev, severity: event.target.value }))}
          >
            <MenuItem value="">Todas</MenuItem>
            {DAMAGE_SEVERITIES.map((severity) => (
              <MenuItem key={severity} value={severity}>
                {severity}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Daño"
            value={damageFilter.damage_type}
            onChange={(event) => setDamageFilter((prev) => ({ ...prev, damage_type: event.target.value }))}
          >
            <MenuItem value="">Todos</MenuItem>
            {DAMAGE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Causa"
            value={damageFilter.damage_cause}
            onChange={(event) => setDamageFilter((prev) => ({ ...prev, damage_cause: event.target.value }))}
          >
            <MenuItem value="">Todas</MenuItem>
            {DAMAGE_CAUSES.map((cause) => (
              <MenuItem key={cause} value={cause}>
                {cause}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Estructura</TableCell>
              <TableCell>Daño</TableCell>
              <TableCell>Causa</TableCell>
              <TableCell>Gravedad</TableCell>
              <TableCell>Extensión</TableCell>
              <TableCell>Foto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDamages.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">Sin registros con los filtros actuales.</Typography>
                </TableCell>
              </TableRow>
            )}
            {filteredDamages.map((damage) => (
              <TableRow key={damage.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{damage.structure || "Sin dato"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {damage.location || "Ubicación no indicada"}
                  </Typography>
                </TableCell>
                <TableCell>{damage.damage_type}</TableCell>
                <TableCell>{damage.damage_cause}</TableCell>
                <TableCell>
                  <Chip
                    label={damage.severity}
                    color={severityColor(damage.severity)}
                    size="small"
                    variant={damage.severity === "Leve" ? "outlined" : "filled"}
                  />
                </TableCell>
                <TableCell>{damage.extent || "Sin dato"}</TableCell>
                <TableCell>
                  {damage.damage_photo_url ? (
                    <Button component="a" href={damage.damage_photo_url} target="_blank" rel="noreferrer" size="small" startIcon={<AttachmentIcon />}>
                      Ver
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Ensayos y pruebas</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setTestDialogOpen(true)}
            disabled={!effectiveProjectId}
          >
            Nuevo ensayo
          </Button>
        </CardContent>
        <List dense>
          {tests.length === 0 && (
            <ListItem>
              <ListItemText primary="Sin ensayos registrados" />
            </ListItem>
          )}
          {tests.map((test) => (
            <ListItem key={test.id} divider alignItems="flex-start">
              <ListItemText
                primary={
                  <Typography fontWeight={600}>
                    {test.test_type} · {dayjs(test.executed_at).format("DD/MM/YYYY")}
                  </Typography>
                }
                secondary={
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      Método: {test.method || "—"} · Norma: {test.standard || "—"} · Laboratorio: {test.laboratory || "—"}
                    </Typography>
                    <Typography variant="body2">{test.result_summary}</Typography>
                    {test.attachment_url && (
                      <Button
                        component="a"
                        href={test.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        startIcon={<AttachmentIcon />}
                      >
                        Informe
                      </Button>
                    )}
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      </Card>

      <Card>
        <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Documentación de respaldo</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => setDocumentDialogOpen(true)}
            disabled={!effectiveProjectId}
          >
            Agregar documento
          </Button>
        </CardContent>
        <List dense>
          {documents.length === 0 && (
            <ListItem>
              <ListItemText primary="No hay documentación vinculada" />
            </ListItem>
          )}
          {documents.map((doc) => (
            <ListItem key={doc.id} divider>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={600}>{doc.title}</Typography>
                    <Chip label={doc.category} size="small" variant="outlined" />
                  </Stack>
                }
                secondary={
                  <Stack spacing={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      {doc.issued_by || "Autor no indicado"} · {doc.issued_at ? dayjs(doc.issued_at).format("DD/MM/YYYY") : "Fecha no indicada"}
                    </Typography>
                    {doc.notes && <Typography variant="body2">{doc.notes}</Typography>}
                    {doc.url && (
                      <Button component="a" href={doc.url} target="_blank" rel="noreferrer" size="small" startIcon={<AttachmentIcon />}>
                        Abrir
                      </Button>
                    )}
                  </Stack>
                }
              />
            </ListItem>
          ))}
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

      <Dialog open={damageDialogOpen} onClose={() => setDamageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar daño</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Estructura / elemento"
              value={damageForm.structure}
              onChange={(event) => setDamageForm((prev) => ({ ...prev, structure: event.target.value }))}
            />
            <TextField
              label="Ubicación"
              value={damageForm.location}
              onChange={(event) => setDamageForm((prev) => ({ ...prev, location: event.target.value }))}
            />
            <TextField
              select
              label="Tipo de daño"
              value={damageForm.damage_type}
              onChange={(event) => setDamageForm((prev) => ({ ...prev, damage_type: event.target.value }))}
            >
              {DAMAGE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Causa probable"
              value={damageForm.damage_cause}
              onChange={(event) => setDamageForm((prev) => ({ ...prev, damage_cause: event.target.value }))}
            >
              {DAMAGE_CAUSES.map((cause) => (
                <MenuItem key={cause} value={cause}>
                  {cause}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Gravedad"
              value={damageForm.severity}
              onChange={(event) =>
                setDamageForm((prev) => ({ ...prev, severity: event.target.value as DamageFormState["severity"] }))
              }
            >
              {DAMAGE_SEVERITIES.map((severity) => (
                <MenuItem key={severity} value={severity}>
                  {severity}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Extensión / magnitud"
              value={damageForm.extent}
              onChange={(event) => setDamageForm((prev) => ({ ...prev, extent: event.target.value }))}
            />
            <TextField
              label="Comentarios"
              multiline
              minRows={2}
              value={damageForm.comments}
              onChange={(event) => setDamageForm((prev) => ({ ...prev, comments: event.target.value }))}
            />
            <TextField
              label="URL de fotografía"
              value={damageForm.damage_photo_url}
              onChange={(event) => setDamageForm((prev) => ({ ...prev, damage_photo_url: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDamageDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => createDamageMutation.mutate()}
            disabled={!effectiveProjectId || !damageForm.structure.trim() || createDamageMutation.isPending}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar ensayo</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tipo de ensayo"
              value={testForm.test_type}
              onChange={(event) => setTestForm((prev) => ({ ...prev, test_type: event.target.value }))}
            />
            <TextField
              label="Método / técnica"
              value={testForm.method}
              onChange={(event) => setTestForm((prev) => ({ ...prev, method: event.target.value }))}
            />
            <TextField
              label="Norma aplicada"
              value={testForm.standard}
              onChange={(event) => setTestForm((prev) => ({ ...prev, standard: event.target.value }))}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                type="date"
                label="Fecha"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={testForm.executed_at}
                onChange={(event) => setTestForm((prev) => ({ ...prev, executed_at: event.target.value }))}
              />
              <TextField
                label="Laboratorio"
                fullWidth
                value={testForm.laboratory}
                onChange={(event) => setTestForm((prev) => ({ ...prev, laboratory: event.target.value }))}
              />
            </Stack>
            <TextField
              label="Ubicación / muestra"
              value={testForm.sample_location}
              onChange={(event) => setTestForm((prev) => ({ ...prev, sample_location: event.target.value }))}
            />
            <TextField
              label="Resumen de resultados"
              multiline
              minRows={3}
              value={testForm.result_summary}
              onChange={(event) => setTestForm((prev) => ({ ...prev, result_summary: event.target.value }))}
            />
            <TextField
              label="URL de informe"
              value={testForm.attachment_url}
              onChange={(event) => setTestForm((prev) => ({ ...prev, attachment_url: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => createTestMutation.mutate()}
            disabled={!effectiveProjectId || !testForm.test_type.trim() || createTestMutation.isPending}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={documentDialogOpen} onClose={() => setDocumentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Documento de inspección</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              value={documentForm.title}
              onChange={(event) => setDocumentForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <TextField
              select
              label="Categoría"
              value={documentForm.category}
              onChange={(event) =>
                setDocumentForm((prev) => ({
                  ...prev,
                  category: event.target.value as DocumentFormState["category"],
                }))
              }
            >
              <MenuItem value="informe">Informe</MenuItem>
              <MenuItem value="fotografia">Fotografía</MenuItem>
              <MenuItem value="ensayo">Ensayo</MenuItem>
              <MenuItem value="otro">Otro</MenuItem>
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                type="date"
                label="Fecha"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={documentForm.issued_at}
                onChange={(event) => setDocumentForm((prev) => ({ ...prev, issued_at: event.target.value }))}
              />
              <TextField
                label="Emitido por"
                fullWidth
                value={documentForm.issued_by}
                onChange={(event) => setDocumentForm((prev) => ({ ...prev, issued_by: event.target.value }))}
              />
            </Stack>
            <TextField
              label="URL"
              value={documentForm.url}
              onChange={(event) => setDocumentForm((prev) => ({ ...prev, url: event.target.value }))}
            />
            <TextField
              label="Notas"
              multiline
              minRows={2}
              value={documentForm.notes}
              onChange={(event) => setDocumentForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => createDocumentMutation.mutate()}
            disabled={!effectiveProjectId || !documentForm.title.trim() || createDocumentMutation.isPending}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectInspectionsPage;
