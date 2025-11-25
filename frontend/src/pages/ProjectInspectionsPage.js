import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Breadcrumbs, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Link, List, ListItem, ListItemButton, ListItemText, MenuItem, Stack, TextField, Typography, } from "@mui/material";
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
import { useProjectInspectionDamages, useProjectInspectionDocuments, useProjectInspectionTests, useProjectInspections, } from "../hooks/useProjectInspections";
import apiClient from "../api/client";
const conditionOptions = [
    { value: "operativa", label: "Operativa" },
    { value: "observacion", label: "Con observaciones" },
    { value: "critica", label: "Crítica" },
];
const formatScoreValue = (value) => (value !== undefined && value !== null ? value.toFixed(0) : "—");
const getScoreColor = (value) => {
    if (value === undefined || value === null)
        return "default";
    if (value >= 70)
        return "success";
    if (value >= 40)
        return "warning";
    return "error";
};
const extractLLMScore = (payload, reason, score) => {
    if (score !== undefined && score !== null)
        return score;
    const tryExtract = (text) => {
        if (!text)
            return null;
        const cleaned = text.replace(/```/g, "").replace(/^json\s*/i, "").trim();
        try {
            const parsed = JSON.parse(cleaned);
            const value = parsed?.score;
            if (typeof value === "number")
                return value;
        }
        catch {
            // ignore parse errors
        }
        const match = cleaned.match(/"score"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i) || cleaned.match(/score\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i);
        return match ? Number(match[1]) : null;
    };
    return tryExtract(typeof payload === "string" ? payload : null) ?? tryExtract(reason);
};
const cleanLLMReason = (text) => {
    if (!text)
        return null;
    const trimmed = text.replace(/```/g, "").replace(/^json\s*/i, "").trim();
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && "reason" in parsed && typeof parsed.reason === "string") {
            return parsed.reason;
        }
    }
    catch {
        // ignore
    }
    const match = trimmed.match(/"reason"\s*:\s*"([^"]+)"/i);
    if (match?.[1])
        return match[1];
    // If looks like JSON blob, avoid showing full blob
    if (/^{.*}$/s.test(trimmed))
        return null;
    return trimmed;
};
const ProjectInspectionsPage = () => {
    const sessionProjectId = useSession((state) => state.projectId);
    const setProject = useSession((state) => state.setProject);
    const { projectId: routeProjectId } = useParams();
    const { data: projects } = useProjects();
    const [selectedProjectId, setSelectedProjectId] = useState(sessionProjectId);
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
    const planSummary = useMemo(() => {
        const criticalCount = inspections.filter((i) => i.overall_condition === "critica").length;
        const observationCount = inspections.filter((i) => i.overall_condition === "observacion").length;
        const operationalCount = inspections.filter((i) => i.overall_condition === "operativa").length;
        return { criticalCount, observationCount, operationalCount, total: inspections.length };
    }, [inspections]);
    useEffect(() => {
        if (!selectedProjectId && projects?.length) {
            const firstProjectId = sessionProjectId ?? projects[0].id;
            setSelectedProjectId(firstProjectId);
            setProject(firstProjectId);
        }
    }, [projects, selectedProjectId, sessionProjectId, setProject]);
    const createDraftId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
    const [inspectionForm, setInspectionForm] = useState({
        structure_name: "",
        location: "",
        inspection_date: dayjs().format("YYYY-MM-DD"),
        inspector: "",
        overall_condition: "operativa",
        summary: "",
    });
    const [photoDrafts, setPhotoDrafts] = useState([]);
    const addPhotoFiles = (files) => {
        const nextDrafts = Array.from(files).map((file) => ({
            id: createDraftId(),
            file,
            comment: "",
        }));
        setPhotoDrafts((prev) => [...prev, ...nextDrafts]);
    };
    const updatePhotoDraft = (id, patch) => {
        setPhotoDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
    };
    const removePhotoDraft = (id) => {
        setPhotoDrafts((prev) => prev.filter((draft) => draft.id !== id));
    };
    const invalidateInspectionQueries = () => {
        if (!effectiveProjectId)
            return;
        queryClient.invalidateQueries({ queryKey: ["project-inspections", effectiveProjectId] });
        queryClient.invalidateQueries({ queryKey: ["project-inspections-damages", effectiveProjectId] });
        queryClient.invalidateQueries({ queryKey: ["project-inspections-tests", effectiveProjectId] });
        queryClient.invalidateQueries({ queryKey: ["project-inspections-documents", effectiveProjectId] });
    };
    const createInspectionMutation = useMutation({
        mutationFn: async () => {
            if (!effectiveProjectId)
                throw new Error("No hay proyecto activo");
            const { data: inspection } = await apiClient.post("/inspections", {
                project_id: effectiveProjectId,
                structure_name: inspectionForm.structure_name,
                location: inspectionForm.location,
                inspection_date: inspectionForm.inspection_date,
                inspector: inspectionForm.inspector,
                overall_condition: inspectionForm.overall_condition,
                summary: inspectionForm.summary,
                photos: [],
            });
            for (const draft of photoDrafts) {
                const form = new FormData();
                form.append("file", draft.file);
                if (draft.comment?.trim()) {
                    form.append("comment", draft.comment.trim());
                }
                await apiClient.post(`/inspections/${inspection.id}/photos`, form);
            }
            return inspection;
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
            });
            setPhotoDrafts([]);
            invalidateInspectionQueries();
        },
    });
    const confirmDeletion = (message) => window.confirm(message);
    const deleteInspectionMutation = useMutation({
        mutationFn: async (inspectionId) => {
            await apiClient.delete(`/inspections/${inspectionId}`);
        },
        onSuccess: () => {
            invalidateInspectionQueries();
        },
    });
    const summaryCards = useMemo(() => [
        { title: "Inspecciones", value: inspections.length, icon: _jsx(ChecklistIcon, {}) },
        { title: "Daños", value: damages.length, icon: _jsx(AttachmentIcon, {}) },
        { title: "Ensayos", value: tests.length, icon: _jsx(ScienceIcon, {}) },
        { title: "Documentos", value: documents.length, icon: _jsx(DescriptionIcon, {}) },
    ], [inspections.length, damages.length, tests.length, documents.length]);
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Breadcrumbs, { children: [_jsx(Link, { component: RouterLink, to: "/projects", color: "inherit", children: "Proyectos" }), _jsx(Typography, { color: "text.primary", children: "Inspecciones y ensayos" })] }), _jsxs(Box, { sx: {
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                    alignItems: { md: "center" },
                }, children: [_jsx(Typography, { variant: "h4", fontWeight: 600, children: "Plan de inspecciones" }), _jsx(Box, { sx: { flexGrow: 1 } }), _jsx(TextField, { select: true, label: "Proyecto activo", size: "small", sx: { minWidth: 220 }, value: effectiveProjectId ?? "", onChange: (event) => {
                            setSelectedProjectId(event.target.value);
                            setProject(event.target.value);
                        }, id: "inspection-project-select", name: "inspectionProject", children: (projects ?? []).map((project) => (_jsx(MenuItem, { value: project.id, children: project.name }, project.id))) }), _jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), onClick: () => invalidateInspectionQueries(), disabled: !effectiveProjectId, children: "Actualizar datos" })] }), _jsx(Grid, { container: true, spacing: 2, children: summaryCards.map((card) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", children: [card.icon, _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: card.value }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: card.title })] })] }) }) }) }, card.title))) }), _jsxs(Card, { children: [_jsxs(CardContent, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h6", children: "Inspecciones de estructuras existentes" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), variant: "contained", onClick: () => setInspectionDialogOpen(true), disabled: !effectiveProjectId, children: "Nueva inspecci\u00F3n" })] }), _jsxs(List, { dense: true, children: [inspections.length === 0 && (_jsx(ListItem, { children: _jsx(ListItemText, { primary: "No hay inspecciones registradas" }) })), inspections.map((inspection) => {
                                const detailHref = effectiveProjectId
                                    ? `/projects/${effectiveProjectId}/inspections/${inspection.id}`
                                    : "#";
                                const llmScore = extractLLMScore(inspection.llm_payload, inspection.llm_reason, inspection.llm_score);
                                const llmReason = cleanLLMReason(inspection.llm_reason);
                                return (_jsx(ListItem, { divider: true, alignItems: "flex-start", secondaryAction: _jsx(IconButton, { edge: "end", "aria-label": `Eliminar inspección ${inspection.structure_name}`, onClick: () => {
                                            if (!confirmDeletion(`¿Eliminar la inspección de ${inspection.structure_name}?`)) {
                                                return;
                                            }
                                            deleteInspectionMutation.mutate(inspection.id);
                                        }, disabled: deleteInspectionMutation.isPending, children: _jsx(DeleteIcon, {}) }), children: _jsx(ListItemButton, { component: RouterLink, to: detailHref, disabled: !effectiveProjectId, children: _jsx(ListItemText, { primary: _jsxs(Stack, { direction: { xs: "column", md: "row" }, spacing: 1, alignItems: { md: "center" }, children: [_jsx(Typography, { fontWeight: 600, children: inspection.structure_name }), _jsx(Chip, { label: conditionOptions.find((item) => item.value === inspection.overall_condition)?.label ??
                                                            "Sin dato", color: inspection.overall_condition === "operativa"
                                                            ? "success"
                                                            : inspection.overall_condition === "critica"
                                                                ? "error"
                                                                : "warning", size: "small" }), _jsxs(Stack, { direction: "row", spacing: 0.5, alignItems: "center", children: [_jsx(Chip, { label: `H: ${formatScoreValue(inspection.deterministic_score)}`, color: getScoreColor(inspection.deterministic_score), size: "small", sx: { fontSize: "0.75rem", height: 22 } }), _jsx(Chip, { label: `L: ${formatScoreValue(llmScore)}`, color: getScoreColor(llmScore), size: "small", sx: { fontSize: "0.75rem", height: 22 } })] })] }), secondary: _jsxs(Stack, { spacing: 1, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", component: "div", children: [inspection.location, " \u00B7 ", dayjs(inspection.inspection_date).format("DD/MM/YYYY"), " \u00B7 Inspector:", " ", inspection.inspector] }), _jsx(Typography, { variant: "body2", component: "div", children: inspection.summary }), llmReason && (_jsx(Typography, { variant: "body2", color: "text.secondary", component: "div", sx: { fontStyle: "italic" }, children: llmReason })), _jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: (inspection.photos ?? []).map((photo, index) => {
                                                            const photoUrl = typeof photo === "string" ? photo : photo?.url;
                                                            const label = typeof photo === "string" ? "Foto" : photo?.comment || "Foto";
                                                            const key = typeof photo === "string" ? photo : photo?.id ?? photoUrl ?? `photo-${index}`;
                                                            return (_jsx(Chip, { label: label, component: "span", onClick: () => {
                                                                    if (photoUrl) {
                                                                        window.open(photoUrl, "_blank", "noopener");
                                                                    }
                                                                }, clickable: Boolean(photoUrl), variant: "outlined", size: "small" }, key));
                                                        }) })] }), primaryTypographyProps: { component: "div" }, secondaryTypographyProps: { component: "div" } }) }) }, inspection.id));
                            })] })] }), _jsxs(Dialog, { open: inspectionDialogOpen, onClose: () => setInspectionDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Nueva inspecci\u00F3n" }), _jsx(DialogContent, { dividers: true, children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "Estructura / elemento", value: inspectionForm.structure_name, onChange: (event) => setInspectionForm((prev) => ({ ...prev, structure_name: event.target.value })), id: "inspection-structure", name: "inspectionStructure" }), _jsx(TextField, { label: "Ubicaci\u00F3n", value: inspectionForm.location, onChange: (event) => setInspectionForm((prev) => ({ ...prev, location: event.target.value })), id: "inspection-location", name: "inspectionLocation" }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { type: "date", label: "Fecha", InputLabelProps: { shrink: true }, fullWidth: true, value: inspectionForm.inspection_date, onChange: (event) => setInspectionForm((prev) => ({ ...prev, inspection_date: event.target.value })), id: "inspection-date", name: "inspectionDate" }), _jsx(TextField, { label: "Inspector", fullWidth: true, value: inspectionForm.inspector, onChange: (event) => setInspectionForm((prev) => ({ ...prev, inspector: event.target.value })), id: "inspection-inspector", name: "inspectionInspector" })] }), _jsx(TextField, { select: true, label: "Condici\u00F3n", value: inspectionForm.overall_condition, onChange: (event) => setInspectionForm((prev) => ({
                                        ...prev,
                                        overall_condition: event.target.value,
                                    })), id: "inspection-condition", name: "inspectionCondition", children: conditionOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, option.value))) }), _jsx(TextField, { label: "Resumen de hallazgos", multiline: true, minRows: 3, value: inspectionForm.summary, onChange: (event) => setInspectionForm((prev) => ({ ...prev, summary: event.target.value })), id: "inspection-summary", name: "inspectionSummary" }), _jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "subtitle2", children: "Fotograf\u00EDas" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, alignItems: { sm: "center" }, children: [_jsxs(Button, { component: "label", variant: "outlined", size: "small", children: ["Seleccionar fotos", _jsx("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onChange: (event) => {
                                                                const files = event.target.files;
                                                                if (files?.length) {
                                                                    addPhotoFiles(files);
                                                                    event.target.value = "";
                                                                }
                                                            } })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: photoDrafts.length > 0
                                                        ? `${photoDrafts.length} archivo(s) listo(s) para subir`
                                                        : "Puedes adjuntar fotos ahora o más tarde" })] }), _jsx(Stack, { spacing: 1, children: photoDrafts.length === 0 ? (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "No hay fotos pendientes." })) : (photoDrafts.map((draft) => (_jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1, alignItems: { sm: "center" }, sx: { border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }, children: [_jsxs(Stack, { spacing: 0.5, sx: { flexGrow: 1, minWidth: 0 }, children: [_jsx(Typography, { variant: "body2", fontWeight: 600, noWrap: true, title: draft.file.name, children: draft.file.name }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [Math.round(draft.file.size / 1024), " KB \u00B7 se comprimir\u00E1 a 1080p"] })] }), _jsx(TextField, { size: "small", label: "Comentario", value: draft.comment, onChange: (event) => updatePhotoDraft(draft.id, { comment: event.target.value }), fullWidth: true, sx: { minWidth: { sm: 200 } } }), _jsx(IconButton, { "aria-label": "Eliminar foto", onClick: () => removePhotoDraft(draft.id), size: "small", children: _jsx(DeleteIcon, { fontSize: "small" }) })] }, draft.id)))) })] })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setInspectionDialogOpen(false), children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: () => createInspectionMutation.mutate(), disabled: !effectiveProjectId || !inspectionForm.structure_name.trim() || createInspectionMutation.isPending, children: "Guardar" })] })] })] }));
};
export default ProjectInspectionsPage;
