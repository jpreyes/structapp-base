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
    useEffect(() => {
        if (!selectedProjectId && projects?.length) {
            const firstProjectId = sessionProjectId ?? projects[0].id;
            setSelectedProjectId(firstProjectId);
            setProject(firstProjectId);
        }
    }, [projects, selectedProjectId, sessionProjectId, setProject]);
    const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
    const [inspectionForm, setInspectionForm] = useState({
        structure_name: "",
        location: "",
        inspection_date: dayjs().format("YYYY-MM-DD"),
        inspector: "",
        overall_condition: "operativa",
        summary: "",
        photos: "",
    });
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
                        }, children: (projects ?? []).map((project) => (_jsx(MenuItem, { value: project.id, children: project.name }, project.id))) }), _jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), onClick: () => invalidateInspectionQueries(), disabled: !effectiveProjectId, children: "Actualizar datos" })] }), _jsx(Grid, { container: true, spacing: 2, children: summaryCards.map((card) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", children: [card.icon, _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: card.value }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: card.title })] })] }) }) }) }, card.title))) }), _jsxs(Card, { children: [_jsxs(CardContent, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h6", children: "Inspecciones de estructuras existentes" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), variant: "contained", onClick: () => setInspectionDialogOpen(true), disabled: !effectiveProjectId, children: "Nueva inspecci\u00F3n" })] }), _jsxs(List, { dense: true, children: [inspections.length === 0 && (_jsx(ListItem, { children: _jsx(ListItemText, { primary: "No hay inspecciones registradas" }) })), inspections.map((inspection) => {
                                const detailHref = effectiveProjectId
                                    ? `/projects/${effectiveProjectId}/inspections/${inspection.id}`
                                    : "#";
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
                                                                : "warning", size: "small" })] }), secondary: _jsxs(Stack, { spacing: 1, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: [inspection.location, " \u00B7 ", dayjs(inspection.inspection_date).format("DD/MM/YYYY"), " \u00B7 Inspector: ", " ", inspection.inspector] }), _jsx(Typography, { variant: "body2", children: inspection.summary }), _jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: (inspection.photos ?? []).map((url) => (_jsx(Chip, { label: "Foto", component: "a", href: url, target: "_blank", rel: "noreferrer", clickable: true, variant: "outlined", size: "small" }, url))) })] }) }) }) }, inspection.id));
                            })] })] }), _jsxs(Dialog, { open: inspectionDialogOpen, onClose: () => setInspectionDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Nueva inspecci\u00F3n" }), _jsx(DialogContent, { dividers: true, children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "Estructura / elemento", value: inspectionForm.structure_name, onChange: (event) => setInspectionForm((prev) => ({ ...prev, structure_name: event.target.value })) }), _jsx(TextField, { label: "Ubicaci\u00F3n", value: inspectionForm.location, onChange: (event) => setInspectionForm((prev) => ({ ...prev, location: event.target.value })) }), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(TextField, { type: "date", label: "Fecha", InputLabelProps: { shrink: true }, fullWidth: true, value: inspectionForm.inspection_date, onChange: (event) => setInspectionForm((prev) => ({ ...prev, inspection_date: event.target.value })) }), _jsx(TextField, { label: "Inspector", fullWidth: true, value: inspectionForm.inspector, onChange: (event) => setInspectionForm((prev) => ({ ...prev, inspector: event.target.value })) })] }), _jsx(TextField, { select: true, label: "Condici\u00F3n", value: inspectionForm.overall_condition, onChange: (event) => setInspectionForm((prev) => ({
                                        ...prev,
                                        overall_condition: event.target.value,
                                    })), children: conditionOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, option.value))) }), _jsx(TextField, { label: "Resumen de hallazgos", multiline: true, minRows: 3, value: inspectionForm.summary, onChange: (event) => setInspectionForm((prev) => ({ ...prev, summary: event.target.value })) }), _jsx(TextField, { label: "URLs de fotograf\u00EDas (una por l\u00EDnea)", multiline: true, minRows: 3, value: inspectionForm.photos, onChange: (event) => setInspectionForm((prev) => ({ ...prev, photos: event.target.value })) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setInspectionDialogOpen(false), children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: () => createInspectionMutation.mutate(), disabled: !effectiveProjectId || !inspectionForm.structure_name.trim() || createInspectionMutation.isPending, children: "Guardar" })] })] })] }));
};
export default ProjectInspectionsPage;
