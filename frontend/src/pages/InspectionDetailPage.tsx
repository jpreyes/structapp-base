import { useEffect, useMemo, useState } from "react";
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
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link as RouterLink, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  useProjectInspectionDamages,
  useProjectInspectionDocuments,
  useProjectInspectionTests,
  useProjectInspections,
  ProjectInspectionDamage,
  ProjectInspectionTest,
  InspectionDocument,
} from "../hooks/useProjectInspections";
import { DAMAGE_CAUSES, DAMAGE_SEVERITIES, DAMAGE_TYPES } from "../constants/inspectionCatalog";
import apiClient from "../api/client";

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

type DamagePhoto = {
  id?: string | null;
  photo_url?: string | null;
  comments?: string | null;
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

const defaultDamageForm: DamageFormState = {
  structure: "",
  location: "",
  damage_type: DAMAGE_TYPES[0],
  damage_cause: DAMAGE_CAUSES[0],
  severity: "Media",
  extent: "",
  comments: "",
  damage_photo_url: "",
};

const defaultTestForm: TestFormState = {
  test_type: "",
  method: "",
  standard: "",
  executed_at: dayjs().format("YYYY-MM-DD"),
  laboratory: "",
  sample_location: "",
  result_summary: "",
  attachment_url: "",
};

const defaultDocumentForm: DocumentFormState = {
  title: "",
  category: "informe",
  issued_at: dayjs().format("YYYY-MM-DD"),
  issued_by: "",
  url: "",
  notes: "",
};

const conditionOptions = [
  { value: "operativa", label: "Operativa" },
  { value: "observacion", label: "Con observaciones" },
  { value: "critica", label: "Crítica" },
] as const;

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

const confirmDeletion = (message: string) => window.confirm(message);

const InspectionDetailPage = () => {
  const { projectId, inspectionId } = useParams<{ projectId?: string; inspectionId?: string }>();
  const queryClient = useQueryClient();
  const canMutate = Boolean(projectId && inspectionId);

  const uploadInspectionPhoto = async (file: File) => {
    if (!projectId || !inspectionId) {
      throw new Error("Proyecto o inspección no definida");
    }
    const form = new FormData();
    form.append("project_id", projectId);
    form.append("inspection_id", inspectionId);
    form.append("file", file);
    const { data } = await apiClient.post<{ url: string }>("/inspection-photos", form);
    return data.url;
  };

  const { data: inspections = [], isLoading: inspectionsLoading } = useProjectInspections(projectId);
  const inspection = useMemo(
    () => inspections.find((item) => item.id === inspectionId),
    [inspections, inspectionId]
  );

  const { data: damages = [] } = useProjectInspectionDamages(projectId, inspectionId);
  const { data: tests = [] } = useProjectInspectionTests(projectId, inspectionId);
  const { data: documents = [] } = useProjectInspectionDocuments(projectId, inspectionId);

  const invalidateDetailQueries = () => {
    if (!projectId) return;
    queryClient.invalidateQueries({ queryKey: ["project-inspections", projectId] });
    if (inspectionId) {
      queryClient.invalidateQueries({ queryKey: ["project-inspections-damages", projectId, inspectionId] });
      queryClient.invalidateQueries({ queryKey: ["project-inspections-tests", projectId, inspectionId] });
      queryClient.invalidateQueries({ queryKey: ["project-inspections-documents", projectId, inspectionId] });
    }
  };

  const [damageDialogOpen, setDamageDialogOpen] = useState(false);
  const [damageForm, setDamageForm] = useState<DamageFormState>(defaultDamageForm);
  const [editingDamage, setEditingDamage] = useState<ProjectInspectionDamage | null>(null);
  const [damagePhotoFile, setDamagePhotoFile] = useState<File | null>(null);
  const [damagePhotoPreview, setDamagePhotoPreview] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [modalDamage, setModalDamage] = useState<ProjectInspectionDamage | null>(null);
  const [damageModalFiles, setDamageModalFiles] = useState<File[]>([]);
  const [damageModalUploading, setDamageModalUploading] = useState(false);
  const [photoCommentValues, setPhotoCommentValues] = useState<Record<string, string>>({});
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [modalTest, setModalTest] = useState<ProjectInspectionTest | null>(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [modalDocument, setModalDocument] = useState<InspectionDocument | null>(null);

  useEffect(() => {
    return () => {
      if (damagePhotoPreview) {
        URL.revokeObjectURL(damagePhotoPreview);
      }
    };
  }, [damagePhotoPreview]);

  useEffect(() => {
    setPhotoCommentValues({});
  }, [modalDamage?.id, editingDamage?.id]);

  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testForm, setTestForm] = useState<TestFormState>(defaultTestForm);
  const [editingTest, setEditingTest] = useState<ProjectInspectionTest | null>(null);

  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState<DocumentFormState>(defaultDocumentForm);
  const [editingDocument, setEditingDocument] = useState<InspectionDocument | null>(null);

  const editingDamageWithPhotos = editingDamage
    ? damages.find((damage) => damage.id === editingDamage.id) ?? editingDamage
    : null;
  const modalDamageWithPhotos = modalDamage
    ? damages.find((damage) => damage.id === modalDamage.id) ?? modalDamage
    : null;

  const createDamageMutation = useMutation({
    mutationFn: async (payload: DamageFormState) => {
      if (!projectId || !inspectionId) throw new Error("Proyecto o inspección no definido");
      const { data } = await apiClient.post("/inspection-damages", {
        project_id: projectId,
        inspection_id: inspectionId,
        ...payload,
        damage_photo_url: payload.damage_photo_url || null,
      });
      return data;
    },
    onSuccess: () => {
      setDamageDialogOpen(false);
      setDamageForm(defaultDamageForm);
      invalidateDetailQueries();
    },
  });

  const updateDamageMutation = useMutation({
    mutationFn: async (payload: { id: string } & DamageFormState) => {
      const { id, ...rest } = payload;
      const { data } = await apiClient.patch(`/inspection-damages/${id}`, {
        ...rest,
        damage_photo_url: payload.damage_photo_url || null,
      });
      return data;
    },
    onSuccess: () => {
      setDamageDialogOpen(false);
      setDamageForm(defaultDamageForm);
      setEditingDamage(null);
      invalidateDetailQueries();
    },
  });

  const deleteDamageMutation = useMutation({
    mutationFn: async (damageId: string) => {
      await apiClient.delete(`/inspection-damages/${damageId}`);
    },
    onSuccess: () => {
      invalidateDetailQueries();
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (payload: TestFormState) => {
      if (!projectId || !inspectionId) throw new Error("Proyecto o inspección no definido");
      const { data } = await apiClient.post("/inspection-tests", {
        project_id: projectId,
        inspection_id: inspectionId,
        ...payload,
        attachment_url: payload.attachment_url || null,
      });
      return data;
    },
    onSuccess: () => {
      setTestDialogOpen(false);
      setTestForm(defaultTestForm);
      invalidateDetailQueries();
    },
  });

  const updateTestMutation = useMutation({
    mutationFn: async (payload: { id: string } & TestFormState) => {
      const { id, ...rest } = payload;
      const { data } = await apiClient.patch(`/inspection-tests/${id}`, {
        ...rest,
        attachment_url: payload.attachment_url || null,
      });
      return data;
    },
    onSuccess: () => {
      setTestDialogOpen(false);
      setTestForm(defaultTestForm);
      setEditingTest(null);
      invalidateDetailQueries();
    },
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      await apiClient.delete(`/inspection-tests/${testId}`);
    },
    onSuccess: () => invalidateDetailQueries(),
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (payload: DocumentFormState) => {
      if (!projectId || !inspectionId) throw new Error("Proyecto o inspección no definido");
      const { data } = await apiClient.post("/inspection-documents", {
        project_id: projectId,
        inspection_id: inspectionId,
        ...payload,
        issued_by: payload.issued_by || null,
        url: payload.url || null,
        notes: payload.notes || null,
      });
      return data;
    },
    onSuccess: () => {
      setDocumentDialogOpen(false);
      setDocumentForm(defaultDocumentForm);
      invalidateDetailQueries();
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (payload: { id: string } & DocumentFormState) => {
      const { id, ...rest } = payload;
      const { data } = await apiClient.patch(`/inspection-documents/${id}`, {
        ...rest,
        issued_by: rest.issued_by || null,
        url: rest.url || null,
        notes: rest.notes || null,
      });
      return data;
    },
    onSuccess: () => {
      setDocumentDialogOpen(false);
      setDocumentForm(defaultDocumentForm);
      setEditingDocument(null);
      invalidateDetailQueries();
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient.delete(`/inspection-documents/${documentId}`);
    },
    onSuccess: () => invalidateDetailQueries(),
  });

  const openDamageDialog = (damage?: ProjectInspectionDamage) => {
    if (damage) {
      setDamageForm({
        structure: damage.structure ?? "",
        location: damage.location ?? "",
        damage_type: damage.damage_type,
        damage_cause: damage.damage_cause,
        severity: damage.severity,
        extent: damage.extent ?? "",
        comments: damage.comments ?? "",
        damage_photo_url: damage.damage_photo_url ?? "",
      });
      setEditingDamage(damage);
      setDamagePhotoPreview(damage.damage_photo_url ?? "");
      setDamagePhotoFile(null);
    } else {
      setDamageForm(defaultDamageForm);
      setEditingDamage(null);
      setDamagePhotoPreview("");
      setDamagePhotoFile(null);
    }
    setDamageDialogOpen(true);
  };

  const openDamageModal = (damage: ProjectInspectionDamage) => {
    setModalDamage(damage);
    setDamageModalFiles([]);
    setDamageModalOpen(true);
  };

  const openTestModal = (test: ProjectInspectionTest) => {
    setModalTest(test);
    setTestModalOpen(true);
  };

  const closeTestModal = () => {
    setTestModalOpen(false);
    setModalTest(null);
  };

  const openDocumentModal = (doc: InspectionDocument) => {
    setModalDocument(doc);
    setDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setModalDocument(null);
  };
  const closeDamageModal = () => {
    setDamageModalOpen(false);
    setModalDamage(null);
    setDamageModalFiles([]);
  };

  const handleDamageModalUpload = async () => {
    if (!modalDamage || !damageModalFiles.length) {
      return;
    }
    setDamageModalUploading(true);
    try {
      for (const file of damageModalFiles) {
        await uploadDamagePhoto(modalDamage.id, file);
      }
    } finally {
      setDamageModalUploading(false);
      setDamageModalFiles([]);
      invalidateDetailQueries();
    }
  };

  const handleDamagePhotoDelete = async (damageId?: string, photoId?: string) => {
    if (!damageId || !photoId) return;
    await deleteDamagePhoto(damageId, photoId);
    invalidateDetailQueries();
  };

  const updatePhotoCommentLocalState = (damageId: string, photoId: string, comment: string | null) => {
    const applyUpdate = (photos?: DamagePhoto[]) =>
      photos?.map((photo) => (photo.id === photoId ? { ...photo, comments: comment } : photo));
    setEditingDamage((prev) =>
      prev && prev.id === damageId ? { ...prev, photos: applyUpdate(prev.photos) ?? prev.photos } : prev
    );
    setModalDamage((prev) =>
      prev && prev.id === damageId ? { ...prev, photos: applyUpdate(prev.photos) ?? prev.photos } : prev
    );
  };

  const handleDamagePhotoCommentChange = async (damageId?: string, photoId?: string, comment?: string) => {
    if (!damageId || !photoId) return;
    await updateDamagePhotoComment(damageId, photoId, comment ?? "");
    updatePhotoCommentLocalState(damageId, photoId, comment ?? "");
    setPhotoCommentValues((prev) => ({ ...prev, [photoId]: comment ?? "" }));
    invalidateDetailQueries();
  };

  const renderDamagePhotos = (
    damage: ProjectInspectionDamage | null,
    options?: { label?: string; showDelete?: boolean }
  ) => {
    if (!damage) return null;
    const photos = damage.photos ?? [];
    return (
      <Stack spacing={1} sx={{ width: 1 }}>
        <Typography variant="subtitle1" component="div">
          {options?.label ?? "Fotos registradas"}
        </Typography>
        <Stack spacing={1}>
          {photos.length === 0 ? (
            <Typography variant="body2" component="div" color="text.secondary">
              Sin fotografías anexas.
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {photos.map((photo) => {
                const photoId = photo.id;
                const commentValue =
                  photoId && photoCommentValues[photoId] !== undefined
                    ? photoCommentValues[photoId]
                    : photo.comments ?? "";
                return (
                  <Stack key={photoId ?? photo.photo_url} spacing={1} sx={{ width: 150 }}>
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: 90,
                        borderRadius: 1,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        component="img"
                        src={photo.photo_url ?? ""}
                        alt="Foto de daño"
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {options?.showDelete && photoId && (
                        <IconButton
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            backgroundColor: "rgba(255,255,255,0.85)",
                          }}
                          onClick={() => handleDamagePhotoDelete(damage.id, photoId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                      <TextField
                        size="small"
                        label="Comentario"
                        value={commentValue}
                        onChange={(event) => {
                          if (photoId) {
                            setPhotoCommentValues((prev) => ({
                              ...prev,
                              [photoId]: event.target.value,
                            }));
                          }
                        }}
                        onBlur={(event) => {
                          if (photoId) {
                            handleDamagePhotoCommentChange(damage.id, photoId, event.target.value);
                          }
                        }}
                      />
                    {photo.photo_url && (
                      <Button
                        size="small"
                        component="a"
                        href={photo.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        startIcon={<AttachmentIcon />}
                      >
                        Ver
                      </Button>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Stack>
    );
  };

  const openTestDialog = (test?: ProjectInspectionTest) => {
    if (test) {
      setEditingTest(test);
      setTestForm({
        test_type: test.test_type,
        method: test.method ?? "",
        standard: test.standard ?? "",
        executed_at: test.executed_at,
        laboratory: test.laboratory ?? "",
        sample_location: test.sample_location ?? "",
        result_summary: test.result_summary,
        attachment_url: test.attachment_url ?? "",
      });
    } else {
      setEditingTest(null);
      setTestForm(defaultTestForm);
    }
    setTestDialogOpen(true);
  };

  const openDocumentDialog = (doc?: InspectionDocument) => {
    if (doc) {
      setEditingDocument(doc);
      setDocumentForm({
        title: doc.title,
        category: doc.category,
        issued_at: doc.issued_at ?? dayjs().format("YYYY-MM-DD"),
        issued_by: doc.issued_by ?? "",
        url: doc.url ?? "",
        notes: doc.notes ?? "",
      });
    } else {
      setEditingDocument(null);
      setDocumentForm(defaultDocumentForm);
    }
    setDocumentDialogOpen(true);
  };

  const handleSaveDamage = async () => {
    if (!canMutate) return;
    let payload: DamageFormState = { ...damageForm };
    if (damagePhotoFile) {
      setIsUploadingPhoto(true);
      try {
        const uploadedUrl = await uploadInspectionPhoto(damagePhotoFile);
        payload = { ...payload, damage_photo_url: uploadedUrl };
        setDamagePhotoFile(null);
        setDamagePhotoPreview("");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
    if (editingDamage) {
      updateDamageMutation.mutate({ id: editingDamage.id, ...payload });
      return;
    }
    createDamageMutation.mutate(payload);
  };

  if (!projectId) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">Selecciona un proyecto antes de ver una inspección.</Typography>
      </Box>
    );
  }

  if (!inspection) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">
          {inspectionsLoading ? "Cargando inspección..." : "Inspección no encontrada."}
        </Typography>
      </Box>
    );
  }

  const conditionLabel =
    conditionOptions.find((option) => option.value === inspection.overall_condition)?.label ?? "Sin dato";
  const reportUrl = inspectionId ? `/inspections/${inspectionId}/report` : "#";
  const archiveUrl = inspectionId ? `/inspections/${inspectionId}/archive` : "#";

  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadingArchive, setDownloadingArchive] = useState(false);

  const downloadFile = async (url: string, filename: string, mimeType: string) => {
    const isReport = url.includes("report");
    const isArchive = url.includes("archive");
    if (isReport) setDownloadingReport(true);
    if (isArchive) setDownloadingArchive(true);
    try {
      const response = await apiClient.get<ArrayBuffer>(url, {
        responseType: "arraybuffer",
      });
      const blob = new Blob([response.data], { type: mimeType });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } finally {
      if (isReport) setDownloadingReport(false);
      if (isArchive) setDownloadingArchive(false);
    }
  };

  const uploadDamagePhoto = async (damageId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<DamagePhoto>(`/inspection-damages/${damageId}/photos`, form);
    return data;
  };

  const deleteDamagePhoto = async (damageId: string, photoId: string) => {
    await apiClient.delete(`/inspection-damages/${damageId}/photos/${photoId}`);
  };

  const updateDamagePhotoComment = async (damageId: string, photoId: string, comment: string) => {
    await apiClient.patch<DamagePhoto>(`/inspection-damages/${damageId}/photos/${photoId}`, {
      comments: comment,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Breadcrumbs>
        <Link component={RouterLink} to="/projects" color="inherit">
          Proyectos
        </Link>
        <Link component={RouterLink} to={`/projects/${projectId}/inspections`} color="inherit">
          Inspecciones
        </Link>
        <Typography color="text.primary">{inspection.structure_name}</Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ md: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={600}>
            {inspection.structure_name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={conditionLabel}
              color={
                inspection.overall_condition === "operativa"
                  ? "success"
                  : inspection.overall_condition === "critica"
                  ? "error"
                  : "warning"
              }
              size="small"
            />
            <Typography color="text.secondary">
              {inspection.location} · {dayjs(inspection.inspection_date).format("DD/MM/YYYY")} · Inspector:{" "}
              {inspection.inspector}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button component={RouterLink} to={`/projects/${projectId}/inspections`} variant="outlined">
            Volver al plan
          </Button>
          <Button
            variant="outlined"
            onClick={() => downloadFile(reportUrl, `${inspectionId}-report.pdf`, "application/pdf")}
            disabled={!inspectionId || downloadingReport}
          >
            {downloadingReport ? "Descargando..." : "Descargar informe"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => downloadFile(archiveUrl, `${inspectionId}-archive.zip`, "application/zip")}
            disabled={!inspectionId || downloadingArchive}
          >
            {downloadingArchive ? "Descargando..." : "Descargar ZIP"}
          </Button>
        </Stack>
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="subtitle1">Resumen de hallazgos</Typography>
          <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
            {inspection.summary || "No se registraron comentarios adicionales."}
          </Typography>
          {(inspection.photos ?? []).length > 0 && (
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
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">Daños registrados</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => openDamageDialog()}
                disabled={!canMutate}
              >
                Registrar daño
              </Button>
            </CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Estructura</TableCell>
                  <TableCell>Daño</TableCell>
                  <TableCell>Causa</TableCell>
                  <TableCell>Gravedad</TableCell>
                  <TableCell>Extensión</TableCell>
                  <TableCell>Foto</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {damages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">Aún no se registran daños vinculados.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {damages.map((damage) => (
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
                    {(damage.photos ?? []).length > 0 ? (
                      <Button
                        component="a"
                        href={damage.photos[0]?.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        startIcon={<AttachmentIcon />}
                      >
                        Ver
                      </Button>
                    ) : (
                      "—"
                    )}
                    </TableCell>
                    <TableCell align="right">
                    <IconButton
                      size="small"
                      aria-label="Ver detalles del daño"
                      onClick={() => openDamageModal(damage)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Editar daño"
                      onClick={() => openDamageDialog(damage)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Eliminar daño"
                        onClick={() => {
                          if (confirmDeletion(`¿Eliminar el daño "${damage.damage_type}"?`)) {
                            deleteDamageMutation.mutate(damage.id);
                          }
                        }}
                        disabled={deleteDamageMutation.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">Ensayos y pruebas</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => openTestDialog()}
                disabled={!canMutate}
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
                <ListItem
                  key={test.id}
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton edge="end" size="small" aria-label="Ver ensayo" onClick={() => openTestModal(test)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" size="small" aria-label="Editar ensayo" onClick={() => openTestDialog(test)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label="Eliminar ensayo"
                        onClick={() => {
                          if (confirmDeletion(`¿Eliminar el ensayo "${test.test_type}"?`)) {
                            deleteTestMutation.mutate(test.id);
                          }
                        }}
                        disabled={deleteTestMutation.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                <ListItemText
                  primary={
                    <Typography fontWeight={600}>
                      {test.test_type} · {dayjs(test.executed_at).format("DD/MM/YYYY")}
                    </Typography>
                  }
                  primaryTypographyProps={{ component: "div" }}
                  secondaryTypographyProps={{ component: "div" }}
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
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">Documentación</Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => openDocumentDialog()}
                disabled={!canMutate}
              >
                Agregar documento
              </Button>
            </CardContent>
            <List dense>
              {documents.length === 0 && (
                <ListItem>
                  <ListItemText primary="Sin documentación vinculada" />
                </ListItem>
              )}
              {documents.map((doc) => (
                <ListItem
                  key={doc.id}
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label="Ver documento"
                        onClick={() => openDocumentModal(doc)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label="Editar documento"
                        onClick={() => openDocumentDialog(doc)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label="Eliminar documento"
                        onClick={() => {
                          if (confirmDeletion(`¿Eliminar el documento "${doc.title}"?`)) {
                            deleteDocumentMutation.mutate(doc.id);
                          }
                        }}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={600}>{doc.title}</Typography>
                      <Chip label={doc.category} size="small" variant="outlined" />
                    </Stack>
                  }
                  primaryTypographyProps={{ component: "div" }}
                  secondaryTypographyProps={{ component: "div" }}
                  secondary={
                    <Stack spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {doc.issued_by || "Autor no indicado"} · {doc.issued_at ? dayjs(doc.issued_at).format("DD/MM/YYYY") : "Fecha no indicada"}
                      </Typography>
                      {doc.notes && <Typography variant="body2">{doc.notes}</Typography>}
                      {doc.url && (
                        <Button
                          component="a"
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          size="small"
                          startIcon={<AttachmentIcon />}
                        >
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
        </Grid>
      </Grid>

      <Dialog open={damageDialogOpen} onClose={() => setDamageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDamage ? "Editar daño" : "Registrar daño"}</DialogTitle>
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
            <Button component="label" variant="outlined" size="small">
              Seleccionar fotografía
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  if (damagePhotoPreview) {
                    URL.revokeObjectURL(damagePhotoPreview);
                  }
                  const previewUrl = URL.createObjectURL(file);
                  setDamagePhotoFile(file);
                  setDamagePhotoPreview(previewUrl);
                }}
              />
            </Button>
            {(damagePhotoPreview || damageForm.damage_photo_url) && (
              <Box component="img" src={damagePhotoPreview || damageForm.damage_photo_url} alt="Fotografía" sx={{ width: 1, mt: 1, borderRadius: 1, border: "1px solid", borderColor: "divider" }} />
            )}
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
            {editingDamageWithPhotos && renderDamagePhotos(editingDamageWithPhotos)}
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
              onClick={handleSaveDamage}
              disabled={
                !canMutate ||
                !damageForm.structure.trim() ||
                isUploadingPhoto ||
                updateDamageMutation.isPending ||
                createDamageMutation.isPending
              }
            >
              Guardar
            </Button>
          </DialogActions>
      </Dialog>

      <Dialog open={testModalOpen} onClose={closeTestModal} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de ensayo</DialogTitle>
        <DialogContent dividers>
          {modalTest ? (
            <Stack spacing={2}>
              <Typography variant="h6" component="div">
                {modalTest.test_type}
              </Typography>
              <Typography variant="body2" component="div">
                Método: {modalTest.method || "—"} · Norma: {modalTest.standard || "—"}
              </Typography>
              <Typography variant="body2" component="div">
                Laboratorio: {modalTest.laboratory || "—"} · Fecha: {dayjs(modalTest.executed_at).format("DD/MM/YYYY")}
              </Typography>
              <Typography variant="body2" component="div">
                Muestra: {modalTest.sample_location || "—"}
              </Typography>
              <Typography variant="body2" component="div">
                Resultados: {modalTest.result_summary}
              </Typography>
              {modalTest.attachment_url && (
                <Button
                  component="a"
                  href={modalTest.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<AttachmentIcon />}
                >
                  Informe
                </Button>
              )}
            </Stack>
          ) : (
            <Typography>No hay ensayo seleccionado.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTestModal}>Cerrar</Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (modalTest) {
                openTestDialog(modalTest);
                closeTestModal();
              }
            }}
          >
            Editar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (modalTest) {
                deleteTestMutation.mutate(modalTest.id);
                closeTestModal();
              }
            }}
            disabled={!modalTest}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={documentModalOpen} onClose={closeDocumentModal} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de documentación</DialogTitle>
        <DialogContent dividers>
          {modalDocument ? (
            <Stack spacing={2}>
              <Typography variant="h6" component="div">
                {modalDocument.title}
              </Typography>
              <Typography variant="body2" component="div">
                Categoría: {modalDocument.category}
              </Typography>
              <Typography variant="body2" component="div">
                Fecha de emisión:{" "}
                {modalDocument.issued_at ? dayjs(modalDocument.issued_at).format("DD/MM/YYYY") : "No indicada"}
              </Typography>
              <Typography variant="body2" component="div">
                Emitido por: {modalDocument.issued_by || "No indicado"}
              </Typography>
              {modalDocument.notes && (
                <Typography variant="body2" component="div">
                  Notas: {modalDocument.notes}
                </Typography>
              )}
              {modalDocument.url && (
                <Button
                  component="a"
                  href={modalDocument.url}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<AttachmentIcon />}
                >
                  Abrir documento
                </Button>
              )}
            </Stack>
          ) : (
            <Typography>No hay documentación seleccionada.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDocumentModal}>Cerrar</Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (modalDocument) {
                openDocumentDialog(modalDocument);
                closeDocumentModal();
              }
            }}
          >
            Editar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (modalDocument) {
                deleteDocumentMutation.mutate(modalDocument.id);
                closeDocumentModal();
              }
            }}
            disabled={!modalDocument}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={damageModalOpen}
        onClose={closeDamageModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalle de daño</DialogTitle>
        <DialogContent dividers>
          {modalDamage ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                <Typography variant="h6" component="div">
                  {modalDamage.structure || "Daño sin estructura"}
                </Typography>
                <Chip label={modalDamage.severity} color={severityColor(modalDamage.severity)} size="small" />
              </Stack>
              <Typography variant="body2" color="text.secondary" component="div">
                Tipo: {modalDamage.damage_type} · Causa: {modalDamage.damage_cause}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                Ubicación: {modalDamage.location || "No indicada"} · Extensión: {modalDamage.extent || "No indicada"}
              </Typography>
              <Typography variant="body2" component="div">
                Comentarios: {modalDamage.comments || "Sin comentarios"}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button component="label" variant="outlined" size="small">
                  Seleccionar fotos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(event) => {
                      const files = event.target.files;
                      if (!files?.length) return;
                      setDamageModalFiles(Array.from(files));
                    }}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary" component="div">
                  {damageModalFiles.length
                    ? `${damageModalFiles.length} archivo(s) listo(s) para subir`
                    : "Selecciona imágenes para subir"}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleDamageModalUpload}
                  disabled={!damageModalFiles.length || damageModalUploading}
                >
                  {damageModalUploading ? "Subiendo..." : "Subir fotos"}
                </Button>
              </Stack>
              {renderDamagePhotos(modalDamageWithPhotos, { label: "Fotos guardadas", showDelete: true })}
            </Stack>
          ) : (
            <Typography>No se encontró el daño seleccionado.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDamageModal}>Cerrar</Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (modalDamage) {
                openDamageDialog(modalDamage);
                closeDamageModal();
              }
            }}
          >
            Editar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (modalDamage) {
                deleteDamageMutation.mutate(modalDamage.id);
                closeDamageModal();
              }
            }}
            disabled={!modalDamage}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTest ? "Editar ensayo" : "Registrar ensayo"}</DialogTitle>
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
            onClick={() => {
              if (!canMutate) return;
              if (editingTest) {
                updateTestMutation.mutate({ id: editingTest.id, ...testForm });
                return;
              }
              createTestMutation.mutate(testForm);
            }}
            disabled={!canMutate || !testForm.test_type.trim()}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={documentDialogOpen} onClose={() => setDocumentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDocument ? "Editar documento" : "Documento de inspección"}</DialogTitle>
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
            onClick={() => {
              if (!canMutate) return;
              if (editingDocument) {
                updateDocumentMutation.mutate({ id: editingDocument.id, ...documentForm });
                return;
              }
              createDocumentMutation.mutate(documentForm);
            }}
            disabled={!canMutate || !documentForm.title.trim()}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InspectionDetailPage;
