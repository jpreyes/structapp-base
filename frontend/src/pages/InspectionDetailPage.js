import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Box, Breadcrumbs, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Link, List, ListItem, ListItemText, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AttachmentIcon from "@mui/icons-material/Attachment";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link as RouterLink, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectInspectionDamages, useProjectInspectionDocuments, useProjectInspectionTests, useProjectInspections, } from "../hooks/useProjectInspections";
import { DAMAGE_CAUSES, DAMAGE_SEVERITIES, DAMAGE_TYPES } from "../constants/inspectionCatalog";
import apiClient from "../api/client";
const defaultDamageForm = {
    structure: "",
    location: "",
    damage_type: DAMAGE_TYPES[0],
    damage_cause: DAMAGE_CAUSES[0],
    severity: "Media",
    extent: "",
    comments: "",
    damage_photo_url: "",
};
const defaultTestForm = {
    test_type: "",
    method: "",
    standard: "",
    executed_at: dayjs().format("YYYY-MM-DD"),
    laboratory: "",
    sample_location: "",
    result_summary: "",
    attachment_url: "",
};
const defaultDocumentForm = {
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
];
const severityColor = (severity) => {
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
const confirmDeletion = (message) => window.confirm(message);
const formatScoreValue = (value) => value !== undefined && value !== null ? value.toFixed(2) : "—";
const formatLLMScoreValue = (value, hasReason) => {
    if (value !== undefined && value !== null) {
        return value.toFixed(2);
    }
    return hasReason ? "—" : "Pendiente";
};
const cleanLLMReason = (text) => {
    if (!text)
        return null;
    const trimmed = text.replace(/```/g, "").replace(/^json\s*/i, "").trim();
    const tryParse = (value) => {
        try {
            const parsed = JSON.parse(value);
            return typeof parsed.reason === "string" ? parsed.reason : null;
        }
        catch {
            return null;
        }
    };
    const parsedReason = tryParse(trimmed);
    if (parsedReason) {
        return parsedReason;
    }
    // Extraer "reason": "..." si viene como JSON mal formateado
    const match = trimmed.match(/"reason"\s*:\s*"([^"]+)"/i);
    if (match?.[1]) {
        return match[1];
    }
    return trimmed.replace(/^{|}$/g, "");
};
const parseScoreFromText = (text) => {
    if (!text)
        return null;
    const match = text.match(/"score"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i) || text.match(/score\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i);
    return match ? Number(match[1]) : null;
};
const parseLLMPayload = (payload) => {
    if (!payload)
        return null;
    if (typeof payload === "string") {
        const cleaned = payload.replace(/```/g, "").replace(/^json\s*/i, "").trim();
        try {
            return JSON.parse(cleaned);
        }
        catch {
            // intentar extraer score de forma liberal
            const match = cleaned.match(/"score"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
            const reasonMatch = cleaned.match(/"reason"\s*:\s*"([^"]+)"/i);
            if (match || reasonMatch) {
                return {
                    score: match ? Number(match[1]) : undefined,
                    reason: reasonMatch ? reasonMatch[1] : undefined,
                    raw: payload,
                };
            }
            return { raw: payload };
        }
    }
    return payload;
};
const extractLLMDetails = ({ payload, reason, score, }) => {
    const parsed = parseLLMPayload(payload);
    const parsedScore = score ??
        (parsed && typeof parsed === "object" && "score" in parsed && parsed.score !== undefined
            ? Number(parsed.score)
            : parseScoreFromText(reason) ?? parseScoreFromText(typeof payload === "string" ? payload : null));
    const parsedReason = cleanLLMReason(reason) ||
        cleanLLMReason(parsed && typeof parsed === "object" && "reason" in parsed ? String(parsed.reason) : null);
    return { score: parsedScore, reason: parsedReason, payload: parsed };
};
const formatScoreTimestamp = (value) => value ? dayjs(value).format("DD/MM/YYYY HH:mm") : null;
const LLMPayloadViewer = ({ payload, reason, score, title, }) => {
    const [open, setOpen] = useState(false);
    if (!payload) {
        return null;
    }
    const parsedPayload = parseLLMPayload(payload);
    const { score: primaryScore, reason: cleanReason } = extractLLMDetails({ payload, reason, score });
    return (_jsxs(_Fragment, { children: [_jsx(Button, { size: "small", variant: "text", onClick: () => setOpen(true), children: "Ver detalles del modelo" }), _jsxs(Dialog, { open: open, onClose: () => setOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: title ?? "Detalle del modelo" }), _jsxs(DialogContent, { children: [primaryScore !== undefined && primaryScore !== null && (_jsxs(Typography, { variant: "h6", sx: { mb: 1 }, children: ["Score LLM: ", formatLLMScoreValue(primaryScore)] })), cleanReason && (_jsx(Typography, { variant: "body1", color: "text.secondary", sx: { mb: 2 }, children: cleanReason })), parsedPayload &&
                                typeof parsedPayload === "object" &&
                                Object.entries(parsedPayload)
                                    .filter(([key]) => !["score", "reason"].includes(key))
                                    .map(([key, value]) => (_jsxs(Box, { sx: { mb: 0.5 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", sx: { textTransform: "capitalize" }, children: key.replace(/_/g, " ") }), _jsx(Typography, { variant: "body2", children: typeof value === "object" ? JSON.stringify(value, null, 2) : String(value) })] }, key))), (!parsedPayload || typeof parsedPayload !== "object") && !cleanReason && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "No hay detalles adicionales del modelo." }))] }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setOpen(false), children: "Cerrar" }) })] })] }));
};
const InspectionDetailPage = () => {
    const { projectId, inspectionId } = useParams();
    const queryClient = useQueryClient();
    const canMutate = Boolean(projectId && inspectionId);
    const uploadInspectionPhoto = async (file) => {
        if (!projectId || !inspectionId) {
            throw new Error("Proyecto o inspección no definida");
        }
        const form = new FormData();
        form.append("project_id", projectId);
        form.append("inspection_id", inspectionId);
        form.append("file", file);
        const { data } = await apiClient.post("/inspection-photos", form);
        return data.url;
    };
    const { data: inspections = [], isLoading: inspectionsLoading } = useProjectInspections(projectId);
    const inspection = useMemo(() => inspections.find((item) => item.id === inspectionId), [inspections, inspectionId]);
    const inspectionLLM = useMemo(() => extractLLMDetails({
        payload: inspection?.llm_payload,
        reason: inspection?.llm_reason,
        score: inspection?.llm_score,
    }), [inspection]);
    const inspectionPhotos = inspection?.photos ?? [];
    const { data: damages = [] } = useProjectInspectionDamages(projectId, inspectionId);
    const { data: tests = [] } = useProjectInspectionTests(projectId, inspectionId);
    const { data: documents = [] } = useProjectInspectionDocuments(projectId, inspectionId);
    const invalidateDetailQueries = () => {
        if (!projectId)
            return;
        queryClient.invalidateQueries({ queryKey: ["project-inspections", projectId] });
        if (inspectionId) {
            queryClient.invalidateQueries({ queryKey: ["project-inspections-damages", projectId, inspectionId] });
            queryClient.invalidateQueries({ queryKey: ["project-inspections-tests", projectId, inspectionId] });
            queryClient.invalidateQueries({ queryKey: ["project-inspections-documents", projectId, inspectionId] });
        }
    };
    const [damageDialogOpen, setDamageDialogOpen] = useState(false);
    const [damageForm, setDamageForm] = useState(defaultDamageForm);
    const [editingDamage, setEditingDamage] = useState(null);
    const [damagePhotoFile, setDamagePhotoFile] = useState(null);
    const [damagePhotoPreview, setDamagePhotoPreview] = useState("");
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [damageModalOpen, setDamageModalOpen] = useState(false);
    const [modalDamage, setModalDamage] = useState(null);
    const [damageModalFiles, setDamageModalFiles] = useState([]);
    const [damageModalUploading, setDamageModalUploading] = useState(false);
    const [damageDialogFiles, setDamageDialogFiles] = useState([]);
    const [damageDialogUploading, setDamageDialogUploading] = useState(false);
    const [photoCommentValues, setPhotoCommentValues] = useState({});
    const [inspectionPhotoDrafts, setInspectionPhotoDrafts] = useState([]);
    const [inspectionPhotosUploading, setInspectionPhotosUploading] = useState(false);
    const [inspectionPhotoComments, setInspectionPhotoComments] = useState({});
    const [testModalOpen, setTestModalOpen] = useState(false);
    const [modalTest, setModalTest] = useState(null);
    const [documentModalOpen, setDocumentModalOpen] = useState(false);
    const [modalDocument, setModalDocument] = useState(null);
    useEffect(() => {
        return () => {
            if (damagePhotoPreview) {
                URL.revokeObjectURL(damagePhotoPreview);
            }
        };
    }, [damagePhotoPreview]);
    useEffect(() => {
        setDamageDialogFiles([]);
    }, [editingDamage?.id]);
    useEffect(() => {
        setPhotoCommentValues({});
    }, [modalDamage?.id, editingDamage?.id]);
    useEffect(() => {
        setInspectionPhotoComments({});
        setInspectionPhotoDrafts([]);
    }, [inspection?.id]);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [testForm, setTestForm] = useState(defaultTestForm);
    const [editingTest, setEditingTest] = useState(null);
    const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
    const [documentForm, setDocumentForm] = useState(defaultDocumentForm);
    const [editingDocument, setEditingDocument] = useState(null);
    const editingDamageWithPhotos = editingDamage
        ? damages.find((damage) => damage.id === editingDamage.id) ?? editingDamage
        : null;
    const modalDamageWithPhotos = modalDamage
        ? damages.find((damage) => damage.id === modalDamage.id) ?? modalDamage
        : null;
    const createInspectionPhotoDraftId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const addInspectionPhotoFiles = (files) => {
        const drafts = Array.from(files).map((file) => ({
            id: createInspectionPhotoDraftId(),
            file,
            comment: "",
        }));
        setInspectionPhotoDrafts((prev) => [...prev, ...drafts]);
    };
    const updateInspectionPhotoDraft = (id, patch) => {
        setInspectionPhotoDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
    };
    const removeInspectionPhotoDraft = (id) => {
        setInspectionPhotoDrafts((prev) => prev.filter((draft) => draft.id !== id));
    };
    const handleUploadInspectionPhotoDrafts = async () => {
        if (!inspectionId || !inspectionPhotoDrafts.length || !canMutate)
            return;
        setInspectionPhotosUploading(true);
        try {
            for (const draft of inspectionPhotoDrafts) {
                const form = new FormData();
                form.append("file", draft.file);
                if (draft.comment.trim()) {
                    form.append("comment", draft.comment.trim());
                }
                await apiClient.post(`/inspections/${inspectionId}/photos`, form);
            }
            setInspectionPhotoDrafts([]);
            invalidateDetailQueries();
        }
        finally {
            setInspectionPhotosUploading(false);
        }
    };
    const handleInspectionPhotoDelete = async (photoId) => {
        if (!inspectionId || !photoId || !canMutate)
            return;
        await apiClient.delete(`/inspections/${inspectionId}/photos/${photoId}`);
        invalidateDetailQueries();
    };
    const handleInspectionPhotoCommentChange = async (photoId, comment) => {
        if (!inspectionId || !photoId || !canMutate)
            return;
        await apiClient.patch(`/inspections/${inspectionId}/photos/${photoId}`, { comment: comment ?? "" });
        setInspectionPhotoComments((prev) => ({ ...prev, [photoId]: comment ?? "" }));
        invalidateDetailQueries();
    };
    const createDamageMutation = useMutation({
        mutationFn: async (payload) => {
            if (!projectId || !inspectionId)
                throw new Error("Proyecto o inspección no definido");
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
        mutationFn: async (payload) => {
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
        mutationFn: async (damageId) => {
            await apiClient.delete(`/inspection-damages/${damageId}`);
        },
        onSuccess: () => {
            invalidateDetailQueries();
        },
    });
    const createTestMutation = useMutation({
        mutationFn: async (payload) => {
            if (!projectId || !inspectionId)
                throw new Error("Proyecto o inspección no definido");
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
        mutationFn: async (payload) => {
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
        mutationFn: async (testId) => {
            await apiClient.delete(`/inspection-tests/${testId}`);
        },
        onSuccess: () => invalidateDetailQueries(),
    });
    const createDocumentMutation = useMutation({
        mutationFn: async (payload) => {
            if (!projectId || !inspectionId)
                throw new Error("Proyecto o inspección no definido");
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
        mutationFn: async (payload) => {
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
        mutationFn: async (documentId) => {
            await apiClient.delete(`/inspection-documents/${documentId}`);
        },
        onSuccess: () => invalidateDetailQueries(),
    });
    const openDamageDialog = (damage) => {
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
        }
        else {
            setDamageForm(defaultDamageForm);
            setEditingDamage(null);
            setDamagePhotoPreview("");
            setDamagePhotoFile(null);
        }
        setDamageDialogOpen(true);
    };
    const openDamageModal = (damage) => {
        setModalDamage(damage);
        setDamageModalFiles([]);
        setDamageModalOpen(true);
    };
    const openTestModal = (test) => {
        setModalTest(test);
        setTestModalOpen(true);
    };
    const closeTestModal = () => {
        setTestModalOpen(false);
        setModalTest(null);
    };
    const openDocumentModal = (doc) => {
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
        }
        finally {
            setDamageModalUploading(false);
            setDamageModalFiles([]);
            invalidateDetailQueries();
        }
    };
    const handleDamageDialogUpload = async () => {
        if (!editingDamage || !damageDialogFiles.length)
            return;
        setDamageDialogUploading(true);
        try {
            for (const file of damageDialogFiles) {
                await uploadDamagePhoto(editingDamage.id, file);
            }
        }
        finally {
            setDamageDialogUploading(false);
            setDamageDialogFiles([]);
            invalidateDetailQueries();
        }
    };
    const handleDamagePhotoDelete = async (damageId, photoId) => {
        if (!damageId || !photoId)
            return;
        await deleteDamagePhoto(damageId, photoId);
        invalidateDetailQueries();
    };
    const updatePhotoCommentLocalState = (damageId, photoId, comment) => {
        const applyUpdate = (photos) => photos?.map((photo) => (photo.id === photoId ? { ...photo, comments: comment } : photo));
        setEditingDamage((prev) => prev && prev.id === damageId ? { ...prev, photos: applyUpdate(prev.photos) ?? prev.photos } : prev);
        setModalDamage((prev) => prev && prev.id === damageId ? { ...prev, photos: applyUpdate(prev.photos) ?? prev.photos } : prev);
    };
    const handleDamagePhotoCommentChange = async (damageId, photoId, comment) => {
        if (!damageId || !photoId)
            return;
        await updateDamagePhotoComment(damageId, photoId, comment ?? "");
        updatePhotoCommentLocalState(damageId, photoId, comment ?? "");
        setPhotoCommentValues((prev) => ({ ...prev, [photoId]: comment ?? "" }));
        invalidateDetailQueries();
    };
    const renderDamagePhotos = (damage, options) => {
        if (!damage)
            return null;
        const photos = damage.photos ?? [];
        return (_jsxs(Stack, { spacing: 1, sx: { width: 1 }, children: [_jsx(Typography, { variant: "subtitle1", component: "div", children: options?.label ?? "Fotos registradas" }), _jsx(Stack, { spacing: 1, children: photos.length === 0 ? (_jsx(Typography, { variant: "body2", component: "div", color: "text.secondary", children: "Sin fotograf\u00EDas anexas." })) : (_jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: photos.map((photo) => {
                            const photoId = photo.id;
                            const commentValue = photoId && photoCommentValues[photoId] !== undefined
                                ? photoCommentValues[photoId]
                                : photo.comments ?? "";
                            return (_jsxs(Stack, { spacing: 1, sx: { width: 150 }, children: [_jsxs(Box, { sx: {
                                            position: "relative",
                                            width: "100%",
                                            height: 90,
                                            borderRadius: 1,
                                            overflow: "hidden",
                                            border: "1px solid",
                                            borderColor: "divider",
                                        }, children: [_jsx(Box, { component: "img", src: photo.photo_url ?? "", alt: "Foto de da\u00F1o", sx: { width: "100%", height: "100%", objectFit: "cover" } }), options?.showDelete && photoId && (_jsx(IconButton, { size: "small", sx: {
                                                    position: "absolute",
                                                    top: 4,
                                                    right: 4,
                                                    backgroundColor: "rgba(255,255,255,0.85)",
                                                }, onClick: () => handleDamagePhotoDelete(damage.id, photoId), children: _jsx(DeleteIcon, { fontSize: "small" }) }))] }), _jsx(TextField, { size: "small", label: "Comentario", value: commentValue, id: photoId ? `damage-photo-comment-${photoId}` : undefined, name: "damagePhotoComment", onChange: (event) => {
                                            if (photoId) {
                                                setPhotoCommentValues((prev) => ({
                                                    ...prev,
                                                    [photoId]: event.target.value,
                                                }));
                                            }
                                        }, onBlur: (event) => {
                                            if (photoId) {
                                                handleDamagePhotoCommentChange(damage.id, photoId, event.target.value);
                                            }
                                        } }), photo.photo_url && (_jsx(Button, { size: "small", component: "a", href: photo.photo_url, target: "_blank", rel: "noreferrer", startIcon: _jsx(AttachmentIcon, {}), children: "Ver" }))] }, photoId ?? photo.photo_url));
                        }) })) })] }));
    };
    const openTestDialog = (test) => {
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
        }
        else {
            setEditingTest(null);
            setTestForm(defaultTestForm);
        }
        setTestDialogOpen(true);
    };
    const openDocumentDialog = (doc) => {
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
        }
        else {
            setEditingDocument(null);
            setDocumentForm(defaultDocumentForm);
        }
        setDocumentDialogOpen(true);
    };
    const handleSaveDamage = async () => {
        if (!canMutate)
            return;
        let payload = { ...damageForm };
        if (damagePhotoFile) {
            setIsUploadingPhoto(true);
            try {
                const uploadedUrl = await uploadInspectionPhoto(damagePhotoFile);
                payload = { ...payload, damage_photo_url: uploadedUrl };
                setDamagePhotoFile(null);
                setDamagePhotoPreview("");
            }
            finally {
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
        return (_jsx(Box, { sx: { py: 4 }, children: _jsx(Typography, { color: "text.secondary", children: "Selecciona un proyecto antes de ver una inspecci\u00F3n." }) }));
    }
    if (!inspection) {
        return (_jsx(Box, { sx: { py: 4 }, children: _jsx(Typography, { color: "text.secondary", children: inspectionsLoading ? "Cargando inspección..." : "Inspección no encontrada." }) }));
    }
    const conditionLabel = conditionOptions.find((option) => option.value === inspection.overall_condition)?.label ?? "Sin dato";
    const reportUrl = inspectionId ? `/inspections/${inspectionId}/report` : "#";
    const archiveUrl = inspectionId ? `/inspections/${inspectionId}/archive` : "#";
    const [downloadingReport, setDownloadingReport] = useState(false);
    const [downloadingArchive, setDownloadingArchive] = useState(false);
    const downloadFile = async (url, filename, mimeType) => {
        const isReport = url.includes("report");
        const isArchive = url.includes("archive");
        if (isReport)
            setDownloadingReport(true);
        if (isArchive)
            setDownloadingArchive(true);
        try {
            const response = await apiClient.get(url, {
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
        }
        finally {
            if (isReport)
                setDownloadingReport(false);
            if (isArchive)
                setDownloadingArchive(false);
        }
    };
    const uploadDamagePhoto = async (damageId, file) => {
        const form = new FormData();
        form.append("file", file);
        const { data } = await apiClient.post(`/inspection-damages/${damageId}/photos`, form);
        return data;
    };
    const deleteDamagePhoto = async (damageId, photoId) => {
        await apiClient.delete(`/inspection-damages/${damageId}/photos/${photoId}`);
    };
    const updateDamagePhotoComment = async (damageId, photoId, comment) => {
        await apiClient.patch(`/inspection-damages/${damageId}/photos/${photoId}`, {
            comments: comment,
        });
    };
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Breadcrumbs, { children: [_jsx(Link, { component: RouterLink, to: "/projects", color: "inherit", children: "Proyectos" }), _jsx(Link, { component: RouterLink, to: `/projects/${projectId}/inspections`, color: "inherit", children: "Inspecciones" }), _jsx(Typography, { color: "text.primary", children: inspection.structure_name })] }), _jsxs(Stack, { direction: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", spacing: 2, children: [_jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "h4", fontWeight: 600, children: inspection.structure_name }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(Chip, { label: conditionLabel, color: inspection.overall_condition === "operativa"
                                            ? "success"
                                            : inspection.overall_condition === "critica"
                                                ? "error"
                                                : "warning", size: "small" }), _jsxs(Typography, { color: "text.secondary", children: [inspection.location, " \u00B7 ", dayjs(inspection.inspection_date).format("DD/MM/YYYY"), " \u00B7 Inspector:", " ", inspection.inspector] })] })] }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, children: [_jsx(Button, { component: RouterLink, to: `/projects/${projectId}/inspections`, variant: "outlined", children: "Volver al plan" }), _jsx(Button, { variant: "outlined", onClick: () => downloadFile(reportUrl, `${inspectionId}-report.pdf`, "application/pdf"), disabled: !inspectionId || downloadingReport, children: downloadingReport ? "Descargando..." : "Descargar informe" }), _jsx(Button, { variant: "outlined", onClick: () => downloadFile(archiveUrl, `${inspectionId}-archive.zip`, "application/zip"), disabled: !inspectionId || downloadingArchive, children: downloadingArchive ? "Descargando..." : "Descargar ZIP" })] })] }), _jsx(Card, { variant: "outlined", children: _jsx(CardContent, { sx: { pt: 1, pb: 1 }, children: _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 3, alignItems: "center", justifyContent: "space-between", children: [_jsxs(Stack, { spacing: 0.5, children: [_jsx(Typography, { variant: "subtitle2", children: "Calificaci\u00F3n t\u00E9cnica" }), _jsx(Typography, { variant: "h5", children: formatScoreValue(inspection.deterministic_score) }), inspection.score_updated_at && (_jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Actualizado ", formatScoreTimestamp(inspection.score_updated_at)] }))] }), _jsxs(Stack, { spacing: 0.5, children: [_jsx(Typography, { variant: "subtitle2", children: "LLM" }), _jsx(Typography, { variant: "h5", children: formatLLMScoreValue(inspectionLLM.score, Boolean(inspectionLLM.reason)) }), inspectionLLM.reason && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: inspectionLLM.reason })), _jsx(LLMPayloadViewer, { payload: inspectionLLM.payload, reason: inspectionLLM.reason, score: inspectionLLM.score, title: "Detalle del modelo LLM para la inspecci\u00F3n" })] })] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle1", children: "Resumen de hallazgos" }), _jsx(Typography, { variant: "body1", sx: { mt: 1, mb: 2 }, children: inspection.summary || "No se registraron comentarios adicionales." })] }) }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, alignItems: { sm: "center" }, justifyContent: "space-between", children: [_jsx(Typography, { variant: "h6", children: "Fotograf\u00EDas de la inspecci\u00F3n" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, children: [_jsxs(Button, { component: "label", variant: "outlined", size: "small", disabled: !canMutate, children: ["Seleccionar fotos", _jsx("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onChange: (event) => {
                                                            const files = event.target.files;
                                                            if (files?.length) {
                                                                addInspectionPhotoFiles(files);
                                                                event.target.value = "";
                                                            }
                                                        } })] }), _jsx(Button, { variant: "contained", size: "small", onClick: handleUploadInspectionPhotoDrafts, disabled: !canMutate || !inspectionPhotoDrafts.length || inspectionPhotosUploading, children: inspectionPhotosUploading ? "Subiendo..." : "Subir fotos" })] })] }), inspectionPhotoDrafts.length > 0 && (_jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "subtitle2", children: "Fotos listas para subir" }), inspectionPhotoDrafts.map((draft) => (_jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, alignItems: { sm: "center" }, sx: { border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }, children: [_jsxs(Stack, { spacing: 0.25, sx: { flexGrow: 1 }, children: [_jsx(Typography, { variant: "body2", fontWeight: 600, noWrap: true, title: draft.file.name, children: draft.file.name }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [Math.round(draft.file.size / 1024), " KB \u00B7 se comprimir\u00E1 a 1080p"] })] }), _jsx(TextField, { size: "small", label: "Comentario", value: draft.comment, onChange: (event) => updateInspectionPhotoDraft(draft.id, { comment: event.target.value }), fullWidth: true, sx: { minWidth: { sm: 200 } } }), _jsx(IconButton, { "aria-label": "Quitar foto", onClick: () => removeInspectionPhotoDraft(draft.id), size: "small", children: _jsx(DeleteIcon, { fontSize: "small" }) })] }, draft.id)))] })), _jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "subtitle2", children: "Fotos guardadas" }), inspectionPhotos.length === 0 ? (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Sin fotograf\u00EDas anexas." })) : (_jsx(Stack, { direction: "row", spacing: 2, flexWrap: "wrap", children: inspectionPhotos.map((photo, index) => {
                                            const photoId = typeof photo === "string" ? null : photo?.id ?? null;
                                            const photoUrl = typeof photo === "string" ? photo : photo?.url ?? null;
                                            const baseComment = typeof photo === "string" ? "" : photo?.comment ?? "";
                                            const commentValue = photoId && inspectionPhotoComments[photoId] !== undefined
                                                ? inspectionPhotoComments[photoId]
                                                : baseComment;
                                            const key = photoId ?? photoUrl ?? `inspection-photo-${index}`;
                                            return (_jsxs(Stack, { spacing: 1, sx: { width: 180 }, children: [_jsx(Box, { component: "img", src: photoUrl ?? "", alt: "Foto de inspecci\u00F3n", sx: { width: "100%", height: 120, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: "divider" } }), _jsx(TextField, { size: "small", label: "Comentario", value: commentValue, onChange: (event) => {
                                                            if (photoId) {
                                                                setInspectionPhotoComments((prev) => ({ ...prev, [photoId]: event.target.value }));
                                                            }
                                                        }, onBlur: (event) => {
                                                            if (photoId) {
                                                                handleInspectionPhotoCommentChange(photoId, event.target.value);
                                                            }
                                                        }, disabled: !photoId }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(Button, { size: "small", component: "a", href: photoUrl ?? undefined, target: "_blank", rel: "noreferrer", startIcon: _jsx(AttachmentIcon, {}), disabled: !photoUrl, children: "Ver" }), photoId && canMutate && (_jsx(IconButton, { "aria-label": "Eliminar foto de inspecci\u00F3n", size: "small", onClick: () => handleInspectionPhotoDelete(photoId), children: _jsx(DeleteIcon, { fontSize: "small" }) }))] })] }, key));
                                        }) }))] })] }) }) }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsxs(Card, { children: [_jsxs(CardContent, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h6", children: "Da\u00F1os registrados" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), variant: "contained", onClick: () => openDamageDialog(), disabled: !canMutate, children: "Registrar da\u00F1o" })] }), _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "Estructura" }), _jsx(TableCell, { children: "Da\u00F1o" }), _jsx(TableCell, { children: "Causa" }), _jsx(TableCell, { children: "Gravedad" }), _jsx(TableCell, { children: "Extensi\u00F3n" }), _jsx(TableCell, { children: "Score \u00B7 Fotos" }), _jsx(TableCell, { align: "right", children: "Acciones" })] }) }), _jsxs(TableBody, { children: [damages.length === 0 && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 7, align: "center", children: _jsx(Typography, { color: "text.secondary", children: "A\u00FAn no se registran da\u00F1os vinculados." }) }) })), damages.map((damage) => (_jsxs(TableRow, { hover: true, children: [_jsxs(TableCell, { children: [_jsx(Typography, { fontWeight: 600, children: damage.structure || "Sin dato" }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: damage.location || "Ubicación no indicada" })] }), _jsx(TableCell, { children: damage.damage_type }), _jsx(TableCell, { children: damage.damage_cause }), _jsx(TableCell, { children: _jsx(Chip, { label: damage.severity, color: severityColor(damage.severity), size: "small", variant: damage.severity === "Leve" ? "outlined" : "filled" }) }), _jsx(TableCell, { children: damage.extent || "Sin dato" }), _jsx(TableCell, { children: _jsxs(Stack, { spacing: 0.5, children: [_jsxs(Typography, { variant: "body2", children: ["Score: ", formatScoreValue(damage.deterministic_score)] }), (() => {
                                                                        const details = extractLLMDetails({
                                                                            payload: damage.llm_payload,
                                                                            reason: damage.llm_reason,
                                                                            score: damage.llm_score,
                                                                        });
                                                                        return (_jsxs(Stack, { spacing: 0.3, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["LLM: ", formatLLMScoreValue(details.score, Boolean(details.reason))] }), details.reason && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: details.reason }))] }));
                                                                    })(), damage.score_updated_at && (_jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Actualizado ", formatScoreTimestamp(damage.score_updated_at)] })), _jsx(LLMPayloadViewer, { payload: damage.llm_payload, reason: damage.llm_reason, score: damage.llm_score, title: `Detalle LLM de ${damage.structure || "daño"}` }), (damage.photos ?? []).length > 0 ? (_jsx(Button, { component: "a", href: damage.photos[0]?.photo_url, target: "_blank", rel: "noreferrer", size: "small", startIcon: _jsx(AttachmentIcon, {}), children: "Ver" })) : ("—")] }) }), _jsxs(TableCell, { align: "right", children: [_jsx(IconButton, { size: "small", "aria-label": "Ver detalles del da\u00F1o", onClick: () => openDamageModal(damage), children: _jsx(VisibilityIcon, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", "aria-label": "Editar da\u00F1o", onClick: () => openDamageDialog(damage), children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", "aria-label": "Eliminar da\u00F1o", onClick: () => {
                                                                        if (confirmDeletion(`¿Eliminar el daño "${damage.damage_type}"?`)) {
                                                                            deleteDamageMutation.mutate(damage.id);
                                                                        }
                                                                    }, disabled: deleteDamageMutation.isPending, children: _jsx(DeleteIcon, { fontSize: "small" }) })] })] }, damage.id)))] })] })] }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Card, { children: [_jsxs(CardContent, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h6", children: "Ensayos y pruebas" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), variant: "contained", onClick: () => openTestDialog(), disabled: !canMutate, children: "Nuevo ensayo" })] }), _jsxs(List, { dense: true, children: [tests.length === 0 && (_jsx(ListItem, { children: _jsx(ListItemText, { primary: "Sin ensayos registrados" }) })), tests.map((test) => (_jsx(ListItem, { divider: true, secondaryAction: _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(IconButton, { edge: "end", size: "small", "aria-label": "Ver ensayo", onClick: () => openTestModal(test), children: _jsx(VisibilityIcon, { fontSize: "small" }) }), _jsx(IconButton, { edge: "end", size: "small", "aria-label": "Editar ensayo", onClick: () => openTestDialog(test), children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(IconButton, { edge: "end", size: "small", "aria-label": "Eliminar ensayo", onClick: () => {
                                                            if (confirmDeletion(`¿Eliminar el ensayo "${test.test_type}"?`)) {
                                                                deleteTestMutation.mutate(test.id);
                                                            }
                                                        }, disabled: deleteTestMutation.isPending, children: _jsx(DeleteIcon, { fontSize: "small" }) })] }), children: _jsx(ListItemText, { primary: _jsxs(Typography, { fontWeight: 600, children: [test.test_type, " \u00B7 ", dayjs(test.executed_at).format("DD/MM/YYYY")] }), primaryTypographyProps: { component: "div" }, secondaryTypographyProps: { component: "div" }, secondary: _jsxs(Stack, { spacing: 0.5, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["M\u00E9todo: ", test.method || "—", " \u00B7 Norma: ", test.standard || "—", " \u00B7 Laboratorio: ", test.laboratory || "—"] }), _jsx(Typography, { variant: "body2", children: test.result_summary }), test.attachment_url && (_jsx(Button, { component: "a", href: test.attachment_url, target: "_blank", rel: "noreferrer", size: "small", startIcon: _jsx(AttachmentIcon, {}), children: "Informe" }))] }) }) }, test.id)))] })] }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsxs(Card, { children: [_jsxs(CardContent, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h6", children: "Documentaci\u00F3n" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), variant: "contained", onClick: () => openDocumentDialog(), disabled: !canMutate, children: "Agregar documento" })] }), _jsxs(List, { dense: true, children: [documents.length === 0 && (_jsx(ListItem, { children: _jsx(ListItemText, { primary: "Sin documentaci\u00F3n vinculada" }) })), documents.map((doc) => (_jsx(ListItem, { divider: true, secondaryAction: _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(IconButton, { edge: "end", size: "small", "aria-label": "Ver documento", onClick: () => openDocumentModal(doc), children: _jsx(VisibilityIcon, { fontSize: "small" }) }), _jsx(IconButton, { edge: "end", size: "small", "aria-label": "Editar documento", onClick: () => openDocumentDialog(doc), children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(IconButton, { edge: "end", size: "small", "aria-label": "Eliminar documento", onClick: () => {
                                                            if (confirmDeletion(`¿Eliminar el documento "${doc.title}"?`)) {
                                                                deleteDocumentMutation.mutate(doc.id);
                                                            }
                                                        }, disabled: deleteDocumentMutation.isPending, children: _jsx(DeleteIcon, { fontSize: "small" }) })] }), children: _jsx(ListItemText, { primary: _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(Typography, { fontWeight: 600, children: doc.title }), _jsx(Chip, { label: doc.category, size: "small", variant: "outlined" })] }), primaryTypographyProps: { component: "div" }, secondaryTypographyProps: { component: "div" }, secondary: _jsxs(Stack, { spacing: 0.5, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: [doc.issued_by || "Autor no indicado", " \u00B7 ", doc.issued_at ? dayjs(doc.issued_at).format("DD/MM/YYYY") : "Fecha no indicada"] }), doc.notes && _jsx(Typography, { variant: "body2", children: doc.notes }), doc.url && (_jsx(Button, { component: "a", href: doc.url, target: "_blank", rel: "noreferrer", size: "small", startIcon: _jsx(AttachmentIcon, {}), children: "Abrir" }))] }) }) }, doc.id)))] })] }) })] }), _jsxs(Dialog, { open: damageDialogOpen, onClose: () => setDamageDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: editingDamage ? "Editar daño" : "Registrar daño" }), _jsx(DialogContent, { dividers: true, children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "Estructura / elemento", value: damageForm.structure, onChange: (event) => setDamageForm((prev) => ({ ...prev, structure: event.target.value })), id: "damage-structure", name: "damageStructure" }), _jsx(TextField, { label: "Ubicaci\u00F3n", value: damageForm.location, onChange: (event) => setDamageForm((prev) => ({ ...prev, location: event.target.value })), id: "damage-location", name: "damageLocation" }), _jsx(TextField, { select: true, label: "Tipo de da\u00F1o", value: damageForm.damage_type, onChange: (event) => setDamageForm((prev) => ({ ...prev, damage_type: event.target.value })), id: "damage-type", name: "damageType", children: DAMAGE_TYPES.map((type) => (_jsx(MenuItem, { value: type, children: type }, type))) }), _jsx(TextField, { select: true, label: "Causa probable", value: damageForm.damage_cause, onChange: (event) => setDamageForm((prev) => ({ ...prev, damage_cause: event.target.value })), id: "damage-cause", name: "damageCause", children: DAMAGE_CAUSES.map((cause) => (_jsx(MenuItem, { value: cause, children: cause }, cause))) }), _jsx(TextField, { select: true, label: "Gravedad", value: damageForm.severity, onChange: (event) => setDamageForm((prev) => ({ ...prev, severity: event.target.value })), id: "damage-severity", name: "damageSeverity", children: DAMAGE_SEVERITIES.map((severity) => (_jsx(MenuItem, { value: severity, children: severity }, severity))) }), _jsxs(Button, { component: "label", variant: "outlined", size: "small", children: ["Seleccionar fotograf\u00EDa", _jsx("input", { type: "file", accept: "image/*", hidden: true, onChange: (event) => {
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
                                            } })] }), (damagePhotoPreview || damageForm.damage_photo_url) && (_jsx(Box, { component: "img", src: damagePhotoPreview || damageForm.damage_photo_url, alt: "Fotograf\u00EDa", sx: { width: 1, mt: 1, borderRadius: 1, border: "1px solid", borderColor: "divider" } })), _jsx(TextField, { label: "Extensi\u00F3n / magnitud", value: damageForm.extent, onChange: (event) => setDamageForm((prev) => ({ ...prev, extent: event.target.value })), id: "damage-extent", name: "damageExtent" }), _jsx(TextField, { label: "Comentarios", multiline: true, minRows: 2, value: damageForm.comments, onChange: (event) => setDamageForm((prev) => ({ ...prev, comments: event.target.value })), id: "damage-comments", name: "damageComments" }), editingDamage ? (_jsx(Stack, { spacing: 1, children: _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", flexWrap: "wrap", children: [_jsxs(Button, { component: "label", variant: "outlined", size: "small", children: ["Seleccionar fotos", _jsx("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onChange: (event) => {
                                                            const files = event.target.files;
                                                            if (!files?.length)
                                                                return;
                                                            setDamageDialogFiles(Array.from(files));
                                                        } })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: damageDialogFiles.length
                                                    ? `${damageDialogFiles.length} archivo(s) listo(s) para subir`
                                                    : "Selecciona imágenes para añadir" }), _jsx(Button, { variant: "contained", size: "small", onClick: handleDamageDialogUpload, disabled: !damageDialogFiles.length || damageDialogUploading, children: damageDialogUploading ? "Subiendo..." : "Subir fotos" })] }) })) : (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Guarda el da\u00F1o para poder adjuntar fotograf\u00EDas adicionales." })), editingDamageWithPhotos && renderDamagePhotos(editingDamageWithPhotos), _jsx(TextField, { label: "URL de fotograf\u00EDa", value: damageForm.damage_photo_url, onChange: (event) => setDamageForm((prev) => ({ ...prev, damage_photo_url: event.target.value })), id: "damage-photo-url", name: "damagePhotoUrl" })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDamageDialogOpen(false), children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: handleSaveDamage, disabled: !canMutate ||
                                    !damageForm.structure.trim() ||
                                    isUploadingPhoto ||
                                    updateDamageMutation.isPending ||
                                    createDamageMutation.isPending, children: "Guardar" })] })] }), _jsxs(Dialog, { open: testModalOpen, onClose: closeTestModal, maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Detalle de ensayo" }), _jsx(DialogContent, { dividers: true, children: modalTest ? (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h6", component: "div", children: modalTest.test_type }), _jsxs(Typography, { variant: "body2", component: "div", children: ["M\u00E9todo: ", modalTest.method || "—", " \u00B7 Norma: ", modalTest.standard || "—"] }), _jsxs(Typography, { variant: "body2", component: "div", children: ["Laboratorio: ", modalTest.laboratory || "—", " \u00B7 Fecha: ", dayjs(modalTest.executed_at).format("DD/MM/YYYY")] }), _jsxs(Typography, { variant: "body2", component: "div", children: ["Muestra: ", modalTest.sample_location || "—"] }), _jsxs(Typography, { variant: "body2", component: "div", children: ["Resultados: ", modalTest.result_summary] }), modalTest.attachment_url && (_jsx(Button, { component: "a", href: modalTest.attachment_url, target: "_blank", rel: "noreferrer", startIcon: _jsx(AttachmentIcon, {}), children: "Informe" }))] })) : (_jsx(Typography, { children: "No hay ensayo seleccionado." })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: closeTestModal, children: "Cerrar" }), _jsx(Button, { variant: "outlined", onClick: () => {
                                    if (modalTest) {
                                        openTestDialog(modalTest);
                                        closeTestModal();
                                    }
                                }, children: "Editar" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => {
                                    if (modalTest) {
                                        deleteTestMutation.mutate(modalTest.id);
                                        closeTestModal();
                                    }
                                }, disabled: !modalTest, children: "Eliminar" })] })] }), _jsxs(Dialog, { open: documentModalOpen, onClose: closeDocumentModal, maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Detalle de documentaci\u00F3n" }), _jsx(DialogContent, { dividers: true, children: modalDocument ? (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "h6", component: "div", children: modalDocument.title }), _jsxs(Typography, { variant: "body2", component: "div", children: ["Categor\u00EDa: ", modalDocument.category] }), _jsxs(Typography, { variant: "body2", component: "div", children: ["Fecha de emisi\u00F3n:", " ", modalDocument.issued_at ? dayjs(modalDocument.issued_at).format("DD/MM/YYYY") : "No indicada"] }), _jsxs(Typography, { variant: "body2", component: "div", children: ["Emitido por: ", modalDocument.issued_by || "No indicado"] }), modalDocument.notes && (_jsxs(Typography, { variant: "body2", component: "div", children: ["Notas: ", modalDocument.notes] })), modalDocument.url && (_jsx(Button, { component: "a", href: modalDocument.url, target: "_blank", rel: "noreferrer", startIcon: _jsx(AttachmentIcon, {}), children: "Abrir documento" }))] })) : (_jsx(Typography, { children: "No hay documentaci\u00F3n seleccionada." })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: closeDocumentModal, children: "Cerrar" }), _jsx(Button, { variant: "outlined", onClick: () => {
                                    if (modalDocument) {
                                        openDocumentDialog(modalDocument);
                                        closeDocumentModal();
                                    }
                                }, children: "Editar" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => {
                                    if (modalDocument) {
                                        deleteDocumentMutation.mutate(modalDocument.id);
                                        closeDocumentModal();
                                    }
                                }, disabled: !modalDocument, children: "Eliminar" })] })] }), _jsxs(Dialog, { open: damageModalOpen, onClose: closeDamageModal, maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Detalle de da\u00F1o" }), _jsx(DialogContent, { dividers: true, children: modalDamage ? (_jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", spacing: 2, flexWrap: "wrap", alignItems: "center", children: [_jsx(Typography, { variant: "h6", component: "div", children: modalDamage.structure || "Daño sin estructura" }), _jsx(Chip, { label: modalDamage.severity, color: severityColor(modalDamage.severity), size: "small" })] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", component: "div", children: ["Tipo: ", modalDamage.damage_type, " \u00B7 Causa: ", modalDamage.damage_cause] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", component: "div", children: ["Ubicaci\u00F3n: ", modalDamage.location || "No indicada", " \u00B7 Extensi\u00F3n: ", modalDamage.extent || "No indicada"] }), _jsxs(Typography, { variant: "body2", component: "div", children: ["Comentarios: ", modalDamage.comments || "Sin comentarios"] }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsxs(Button, { component: "label", variant: "outlined", size: "small", children: ["Seleccionar fotos", _jsx("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onChange: (event) => {
                                                        const files = event.target.files;
                                                        if (!files?.length)
                                                            return;
                                                        setDamageModalFiles(Array.from(files));
                                                    } })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", component: "div", children: damageModalFiles.length
                                                ? `${damageModalFiles.length} archivo(s) listo(s) para subir`
                                                : "Selecciona imágenes para subir" }), _jsx(Button, { variant: "contained", size: "small", onClick: handleDamageModalUpload, disabled: !damageModalFiles.length || damageModalUploading, children: damageModalUploading ? "Subiendo..." : "Subir fotos" })] }), renderDamagePhotos(modalDamageWithPhotos, { label: "Fotos guardadas", showDelete: true })] })) : (_jsx(Typography, { children: "No se encontr\u00F3 el da\u00F1o seleccionado." })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: closeDamageModal, children: "Cerrar" }), _jsx(Button, { variant: "outlined", onClick: () => {
                                    if (modalDamage) {
                                        openDamageDialog(modalDamage);
                                        closeDamageModal();
                                    }
                                }, children: "Editar" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => {
                                    if (modalDamage) {
                                        deleteDamageMutation.mutate(modalDamage.id);
                                        closeDamageModal();
                                    }
                                }, disabled: !modalDamage, children: "Eliminar" })] })] }), _jsxs(Dialog, { open: testDialogOpen, onClose: () => setTestDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: editingTest ? "Editar ensayo" : "Registrar ensayo" }), _jsx(DialogContent, { dividers: true, children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "Tipo de ensayo", value: testForm.test_type, id: "test-type", name: "testType", onChange: (event) => setTestForm((prev) => ({ ...prev, test_type: event.target.value })) }), _jsx(TextField, { label: "M\u00E9todo / t\u00E9cnica", value: testForm.method, id: "test-method", name: "testMethod", onChange: (event) => setTestForm((prev) => ({ ...prev, method: event.target.value })) }), _jsx(TextField, { label: "Norma aplicada", value: testForm.standard, id: "test-standard", name: "testStandard", onChange: (event) => setTestForm((prev) => ({ ...prev, standard: event.target.value })) }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { type: "date", label: "Fecha", InputLabelProps: { shrink: true }, fullWidth: true, value: testForm.executed_at, id: "test-date", name: "testDate", onChange: (event) => setTestForm((prev) => ({ ...prev, executed_at: event.target.value })) }), _jsx(TextField, { label: "Laboratorio", fullWidth: true, value: testForm.laboratory, id: "test-laboratory", name: "testLaboratory", onChange: (event) => setTestForm((prev) => ({ ...prev, laboratory: event.target.value })) })] }), _jsx(TextField, { label: "Ubicaci\u00F3n / muestra", value: testForm.sample_location, id: "test-sample", name: "testSample", onChange: (event) => setTestForm((prev) => ({ ...prev, sample_location: event.target.value })) }), _jsx(TextField, { label: "Resumen de resultados", multiline: true, minRows: 3, value: testForm.result_summary, id: "test-summary", name: "testSummary", onChange: (event) => setTestForm((prev) => ({ ...prev, result_summary: event.target.value })) }), _jsx(TextField, { label: "URL de informe", value: testForm.attachment_url, id: "test-attachment", name: "testAttachment", onChange: (event) => setTestForm((prev) => ({ ...prev, attachment_url: event.target.value })) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setTestDialogOpen(false), children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: () => {
                                    if (!canMutate)
                                        return;
                                    if (editingTest) {
                                        updateTestMutation.mutate({ id: editingTest.id, ...testForm });
                                        return;
                                    }
                                    createTestMutation.mutate(testForm);
                                }, disabled: !canMutate || !testForm.test_type.trim(), children: "Guardar" })] })] }), _jsxs(Dialog, { open: documentDialogOpen, onClose: () => setDocumentDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: editingDocument ? "Editar documento" : "Documento de inspección" }), _jsx(DialogContent, { dividers: true, children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "T\u00EDtulo", value: documentForm.title, id: "document-title", name: "documentTitle", onChange: (event) => setDocumentForm((prev) => ({ ...prev, title: event.target.value })) }), _jsxs(TextField, { select: true, label: "Categor\u00EDa", value: documentForm.category, id: "document-category", name: "documentCategory", onChange: (event) => setDocumentForm((prev) => ({
                                        ...prev,
                                        category: event.target.value,
                                    })), children: [_jsx(MenuItem, { value: "informe", children: "Informe" }), _jsx(MenuItem, { value: "fotografia", children: "Fotograf\u00EDa" }), _jsx(MenuItem, { value: "ensayo", children: "Ensayo" }), _jsx(MenuItem, { value: "otro", children: "Otro" })] }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { type: "date", label: "Fecha", InputLabelProps: { shrink: true }, fullWidth: true, value: documentForm.issued_at, id: "document-date", name: "documentDate", onChange: (event) => setDocumentForm((prev) => ({ ...prev, issued_at: event.target.value })) }), _jsx(TextField, { label: "Emitido por", fullWidth: true, value: documentForm.issued_by, id: "document-issued-by", name: "documentIssuedBy", onChange: (event) => setDocumentForm((prev) => ({ ...prev, issued_by: event.target.value })) })] }), _jsx(TextField, { label: "URL", value: documentForm.url, id: "document-url", name: "documentUrl", onChange: (event) => setDocumentForm((prev) => ({ ...prev, url: event.target.value })) }), _jsx(TextField, { label: "Notas", multiline: true, minRows: 2, value: documentForm.notes, id: "document-notes", name: "documentNotes", onChange: (event) => setDocumentForm((prev) => ({ ...prev, notes: event.target.value })) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDocumentDialogOpen(false), children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: () => {
                                    if (!canMutate)
                                        return;
                                    if (editingDocument) {
                                        updateDocumentMutation.mutate({ id: editingDocument.id, ...documentForm });
                                        return;
                                    }
                                    createDocumentMutation.mutate(documentForm);
                                }, disabled: !canMutate || !documentForm.title.trim(), children: "Guardar" })] })] })] }));
};
export default InspectionDetailPage;
