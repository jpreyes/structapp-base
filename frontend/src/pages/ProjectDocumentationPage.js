import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Checkbox, Divider, FormControlLabel, Grid, IconButton, MenuItem, Stack, TextField, Typography, } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useQueryClient } from "@tanstack/react-query";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { useCalculationRuns } from "../hooks/useCalculationRuns";
import { useDesignBaseOptions } from "../hooks/useDesignBaseOptions";
import { useSession } from "../store/useSession";
import { useSetCriticalElement, useUnsetCriticalElement } from "../hooks/useStructuralCalcs";
import apiClient from "../api/client";
const getErrorMessage = (error) => {
    const maybeAxios = error;
    if (maybeAxios?.response?.data?.detail) {
        return maybeAxios.response.data.detail;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return null;
};
const creationRoutes = {
    building_description: "/projects/calculations",
    live_load: "/projects/calculations",
    reduction: "/projects/calculations",
    wind_load: "/projects/calculations",
    snow_load: "/projects/calculations",
    seismic: "/projects/calculations",
    rc_beam: "/projects/calculations",
    rc_column: "/projects/calculations",
    steel_beam: "/projects/calculations",
    steel_column: "/projects/calculations",
    wood_beam: "/projects/calculations",
    wood_column: "/projects/calculations",
    footing: "/projects/calculations",
};
const inlineEditorTypes = new Set(["building_description", "live_load", "reduction", "wind_load", "snow_load", "seismic"]);
const defaultSeismicStories = () => [
    { id: 1, height: "3.0", weight: "300" },
    { id: 2, height: "3.0", weight: "300" },
];
const buildDefaultEditingValues = (typeId) => {
    switch (typeId) {
        case "live_load":
            return { buildingType: "", usage: "" };
        case "reduction":
            return { elementType: "", tributaryArea: "", baseLoad: "" };
        case "building_description":
            return { text: "", location: "", area: "", height: "" };
        case "wind_load":
            return { environment: "", height: "" };
        case "snow_load":
            return {
                latitudeBand: "",
                altitudeBand: "",
                thermalCondition: "",
                importanceCategory: "",
                exposureCategory: "",
                exposureCondition: "",
                surfaceType: "",
                roofPitch: "",
            };
        case "seismic":
            return { category: "", zone: "", soil: "", rs: "", ps: "", tx: "", ty: "", r0: "" };
        default:
            return {};
    }
};
const buildDefaultStoriesForType = (typeId) => (typeId === "seismic" ? defaultSeismicStories() : []);
const calculationTypes = [
    { id: "building_description", label: "Descripción del Edificio", description: "Información general del proyecto" },
    { id: "live_load", label: "Cargas de Uso", description: "Sobrecargas según tipo de edificio y uso" },
    { id: "reduction", label: "Reducción de Cargas", description: "Reducción de sobrecargas por área tributaria" },
    { id: "wind_load", label: "Cargas de Viento", description: "Presión de viento según ambiente y altura" },
    { id: "snow_load", label: "Cargas de Nieve", description: "Carga de nieve en techo según ubicación" },
    { id: "seismic", label: "Análisis Sísmico", description: "Espectro y fuerzas sísmicas según NCh433" },
    { id: "rc_beam", label: "Vigas de Hormigón", description: "Diseño de vigas de hormigón armado (ACI318)" },
    { id: "rc_column", label: "Pilares de Hormigón", description: "Diseño de pilares de hormigón armado (ACI318)" },
    { id: "steel_beam", label: "Vigas de Acero", description: "Diseño de vigas de acero estructural (AISC360)" },
    { id: "steel_column", label: "Pilares de Acero", description: "Diseño de pilares de acero estructural (AISC360)" },
    { id: "wood_beam", label: "Vigas de Madera", description: "Diseño de vigas de madera (NCh1198)" },
    { id: "wood_column", label: "Pilares de Madera", description: "Diseño de pilares de madera (NCh1198)" },
    { id: "footing", label: "Zapatas", description: "Diseño de zapatas de fundación (ACI318)" },
];
const ProjectDocumentationPage = () => {
    const { data: projects } = useProjects();
    const { data: designOptions } = useDesignBaseOptions();
    const sessionProjectId = useSession((state) => state.projectId);
    const sessionUserId = useSession((state) => state.user?.id);
    const setProjectInSession = useSession((state) => state.setProject);
    const [selectedProjectId, setSelectedProjectId] = useState(sessionProjectId);
    const [selectedCalculations, setSelectedCalculations] = useState(() => {
        const key = selectedProjectId ? `docSelection:${selectedProjectId}` : null;
        if (key) {
            try {
                const saved = localStorage.getItem(key);
                if (saved)
                    return JSON.parse(saved);
            }
            catch { }
        }
        return {};
    });
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [editingRun, setEditingRun] = useState(null);
    const [editingValues, setEditingValues] = useState({});
    const [editingStories, setEditingStories] = useState([]);
    const [editingError, setEditingError] = useState(null);
    const [editingLoading, setEditingLoading] = useState(false);
    const [deletingRunId, setDeletingRunId] = useState(null);
    const projectOptions = useMemo(() => projects ?? [], [projects]);
    const typeLabelMap = useMemo(() => {
        const map = {};
        calculationTypes.forEach((type) => {
            map[type.id] = type.label;
        });
        return map;
    }, []);
    const normalizeElementType = (typeId) => (typeId === "live_load_reduction" ? "reduction" : typeId);
    const { data: runs = [], isLoading: runsLoading } = useCalculationRuns(selectedProjectId);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setCriticalMutation = useSetCriticalElement();
    const unsetCriticalMutation = useUnsetCriticalElement();
    useEffect(() => {
        if (!selectedProjectId && projectOptions.length) {
            const initial = sessionProjectId ?? projectOptions[0].id;
            setSelectedProjectId(initial);
            setProjectInSession(initial);
        }
    }, [projectOptions, selectedProjectId, sessionProjectId, setProjectInSession]);
    useEffect(() => {
        if (!editingRun) {
            setEditingValues({});
            setEditingStories([]);
            setEditingError(null);
            return;
        }
        const normalized = normalizeElementType(editingRun.element_type);
        if (normalized === "live_load") {
            setEditingValues({
                buildingType: editingRun.input_json?.buildingType ?? "",
                usage: editingRun.input_json?.usage ?? "",
            });
            setEditingStories([]);
        }
        else if (normalized === "reduction") {
            const tributary = editingRun.input_json?.tributaryArea ?? editingRun.input_json?.tributary_area ?? "";
            const base = editingRun.input_json?.baseLoad ?? editingRun.input_json?.base_load ?? "";
            setEditingValues({
                elementType: editingRun.input_json?.elementType ?? "",
                tributaryArea: tributary !== undefined && tributary !== null ? String(tributary) : "",
                baseLoad: base !== undefined && base !== null ? String(base) : "",
            });
            setEditingStories([]);
        }
        else if (normalized === "building_description") {
            const areaValue = editingRun.input_json?.area;
            const heightValue = editingRun.input_json?.height;
            setEditingValues({
                text: editingRun.input_json?.text ?? "",
                location: editingRun.input_json?.location ?? "",
                area: areaValue !== undefined && areaValue !== null ? String(areaValue) : "",
                height: heightValue !== undefined && heightValue !== null ? String(heightValue) : "",
            });
            setEditingStories([]);
        }
        else if (normalized === "wind_load") {
            const heightValue = editingRun.input_json?.height;
            setEditingValues({
                environment: editingRun.input_json?.environment ?? "",
                height: heightValue !== undefined && heightValue !== null ? String(heightValue) : "",
            });
            setEditingStories([]);
        }
        else if (normalized === "snow_load") {
            const roofValue = editingRun.input_json?.roofPitch;
            setEditingValues({
                latitudeBand: editingRun.input_json?.latitudeBand ?? "",
                altitudeBand: editingRun.input_json?.altitudeBand ?? "",
                thermalCondition: editingRun.input_json?.thermalCondition ?? "",
                importanceCategory: editingRun.input_json?.importanceCategory ?? "",
                exposureCategory: editingRun.input_json?.exposureCategory ?? "",
                exposureCondition: editingRun.input_json?.exposureCondition ?? "",
                surfaceType: editingRun.input_json?.surfaceType ?? "",
                roofPitch: roofValue !== undefined && roofValue !== null ? String(roofValue) : "",
            });
            setEditingStories([]);
        }
        else if (normalized === "seismic") {
            const rsValue = editingRun.input_json?.rs;
            const psValue = editingRun.input_json?.ps;
            const txValue = editingRun.input_json?.tx;
            const tyValue = editingRun.input_json?.ty;
            const r0Value = editingRun.input_json?.r0;
            setEditingValues({
                category: editingRun.input_json?.category ?? "",
                zone: editingRun.input_json?.zone ?? "",
                soil: editingRun.input_json?.soil ?? "",
                rs: rsValue !== undefined && rsValue !== null ? String(rsValue) : "",
                ps: psValue !== undefined && psValue !== null ? String(psValue) : "",
                tx: txValue !== undefined && txValue !== null ? String(txValue) : "",
                ty: tyValue !== undefined && tyValue !== null ? String(tyValue) : "",
                r0: r0Value !== undefined && r0Value !== null ? String(r0Value) : "",
            });
            const storiesInput = Array.isArray(editingRun.input_json?.stories)
                ? editingRun.input_json?.stories
                : [];
            if (storiesInput.length) {
                setEditingStories(storiesInput.map((story, index) => ({
                    id: index + 1,
                    height: story.height !== undefined && story.height !== null ? String(story.height) : "",
                    weight: story.weight !== undefined && story.weight !== null ? String(story.weight) : "",
                })));
            }
            else {
                setEditingStories(defaultSeismicStories());
            }
        }
        else {
            setEditingValues({});
            setEditingStories([]);
        }
        setEditingError(null);
    }, [editingRun]);
    // Agrupar cÃ¡lculos por tipo
    const groupedCalculations = useMemo(() => {
        const grouped = {};
        calculationTypes.forEach((type) => {
            grouped[type.id] = runs.filter((run) => normalizeElementType(run.element_type) === type.id);
        });
        return grouped;
    }, [runs]);
    const handleToggleCalculation = (typeId, runId) => {
        setSelectedCalculations((prev) => {
            const current = prev[typeId] || [];
            const isSelected = current.includes(runId);
            return {
                ...prev,
                [typeId]: isSelected ? current.filter((id) => id !== runId) : [...current, runId],
            };
        });
    };
    const handleToggleAllType = (typeId, checked) => {
        setSelectedCalculations((prev) => ({
            ...prev,
            [typeId]: checked ? groupedCalculations[typeId].map((run) => run.id) : [],
        }));
    };
    const handleCreateCalculation = (typeId) => {
        if (inlineEditorTypes.has(typeId)) {
            if (!selectedProjectId) {
                setError("Selecciona un proyecto para crear un c�lculo");
                return;
            }
            if (!sessionUserId) {
                setError("No se pudo identificar al usuario para crear el c�lculo");
                return;
            }
            if (["wind_load", "snow_load", "seismic"].includes(typeId) && !designOptions) {
                setError("Las opciones de dise�o a�n no est�n disponibles. Intenta nuevamente en unos segundos");
                return;
            }
            const draft = {
                id: `draft-${typeId}-${Date.now()}`,
                project_id: selectedProjectId,
                element_type: typeId,
                created_at: new Date().toISOString(),
                input_json: {},
                result_json: {},
                isDraft: true,
            };
            setEditingRun(draft);
            setEditingValues(buildDefaultEditingValues(typeId));
            setEditingStories(buildDefaultStoriesForType(typeId));
            setEditingError(null);
            return;
        }
        const route = creationRoutes[typeId];
        if (!route) {
            return;
        }
        navigate(route);
    };
    const totalSelected = useMemo(() => {
        return Object.values(selectedCalculations).reduce((sum, arr) => sum + arr.length, 0);
    }, [selectedCalculations]);
    const removeRunFromSelections = (runId) => {
        setSelectedCalculations((prev) => {
            const next = {};
            Object.entries(prev).forEach(([key, ids]) => {
                const filtered = ids.filter((id) => id !== runId);
                if (filtered.length) {
                    next[key] = filtered;
                }
            });
            return next;
        });
    };
    const handleStartEditing = (run) => {
        setEditingRun(run);
        setEditingError(null);
    };
    const handleCloseEditor = () => {
        setEditingRun(null);
        setEditingValues({});
        setEditingStories([]);
        setEditingError(null);
    };
    const isDraftRun = (run) => Boolean(run?.isDraft);
    const handleEditingValueChange = (field, value) => {
        setEditingValues((prev) => ({ ...prev, [field]: value }));
    };
    const handleEditingStoryChange = (id, field, value) => {
        setEditingStories((prev) => prev.map((story) => (story.id === id ? { ...story, [field]: value } : story)));
    };
    const handleAddEditingStory = () => {
        setEditingStories((prev) => {
            const nextId = prev.length ? Math.max(...prev.map((story) => story.id)) + 1 : 1;
            const last = prev[prev.length - 1];
            return [...prev, { id: nextId, height: last?.height ?? "3.0", weight: last?.weight ?? "300" }];
        });
    };
    const handleRemoveEditingStory = (id) => {
        setEditingStories((prev) => (prev.length > 1 ? prev.filter((story) => story.id !== id) : prev));
    };
    const buildUpdatePayload = () => {
        if (!editingRun) {
            return null;
        }
        const normalized = normalizeElementType(editingRun.element_type);
        if (normalized === "live_load") {
            if (!editingValues.buildingType || !editingValues.usage) {
                return null;
            }
            return {
                buildingType: editingValues.buildingType,
                usage: editingValues.usage,
            };
        }
        if (normalized === "building_description") {
            const textValue = editingValues.text?.trim() ?? "";
            const locationValue = editingValues.location?.trim() ?? "";
            const areaValue = editingValues.area?.trim() ?? "";
            const heightValue = editingValues.height?.trim() ?? "";
            if (![textValue, locationValue, areaValue, heightValue].some(Boolean)) {
                return null;
            }
            return {
                text: textValue || undefined,
                location: locationValue || undefined,
                area: areaValue || undefined,
                height: heightValue || undefined,
            };
        }
        if (normalized === "wind_load") {
            if (!editingValues.environment) {
                return null;
            }
            const heightValue = Number(editingValues.height);
            if (!Number.isFinite(heightValue) || heightValue <= 0) {
                return null;
            }
            return {
                environment: editingValues.environment,
                height: heightValue,
            };
        }
        if (normalized === "snow_load") {
            if (!editingValues.latitudeBand ||
                !editingValues.altitudeBand ||
                !editingValues.thermalCondition ||
                !editingValues.importanceCategory ||
                !editingValues.exposureCategory ||
                !editingValues.exposureCondition ||
                !editingValues.surfaceType) {
                return null;
            }
            const roofPitchValue = Number(editingValues.roofPitch);
            if (!Number.isFinite(roofPitchValue) || roofPitchValue < 0 || roofPitchValue > 90) {
                return null;
            }
            return {
                latitudeBand: editingValues.latitudeBand,
                altitudeBand: editingValues.altitudeBand,
                thermalCondition: editingValues.thermalCondition,
                importanceCategory: editingValues.importanceCategory,
                exposureCategory: editingValues.exposureCategory,
                exposureCondition: editingValues.exposureCondition,
                surfaceType: editingValues.surfaceType,
                roofPitch: roofPitchValue,
            };
        }
        if (normalized === "seismic") {
            if (!editingValues.category || !editingValues.zone || !editingValues.soil) {
                return null;
            }
            const rsValue = Number(editingValues.rs);
            const psValue = Number(editingValues.ps);
            const txValue = Number(editingValues.tx);
            const tyValue = Number(editingValues.ty);
            const r0Value = Number(editingValues.r0);
            if (!Number.isFinite(rsValue) ||
                !Number.isFinite(psValue) ||
                !Number.isFinite(txValue) ||
                !Number.isFinite(tyValue) ||
                !Number.isFinite(r0Value) ||
                rsValue <= 0 ||
                psValue <= 0 ||
                txValue <= 0 ||
                tyValue <= 0 ||
                r0Value <= 0) {
                return null;
            }
            if (!editingStories.length) {
                return null;
            }
            const storiesPayload = editingStories.map((story) => ({
                height: Number(story.height),
                weight: Number(story.weight),
            }));
            if (storiesPayload.some((story) => !Number.isFinite(story.height) || story.height <= 0 || !Number.isFinite(story.weight) || story.weight <= 0)) {
                return null;
            }
            return {
                category: editingValues.category,
                zone: editingValues.zone,
                soil: editingValues.soil,
                rs: rsValue,
                ps: psValue,
                tx: txValue,
                ty: tyValue,
                r0: r0Value,
                stories: storiesPayload,
            };
        }
        if (normalized === "reduction") {
            const tributary = Number(editingValues.tributaryArea);
            const base = Number(editingValues.baseLoad);
            if (!editingValues.elementType || !Number.isFinite(tributary) || tributary <= 0 || !Number.isFinite(base) || base <= 0) {
                return null;
            }
            return {
                elementType: editingValues.elementType,
                tributaryArea: tributary,
                baseLoad: base,
            };
        }
        return null;
    };
    const canSaveEditing = () => Boolean(buildUpdatePayload());
    const createDraftCalculation = async (normalizedType, payload) => {
        if (!selectedProjectId) {
            throw new Error("Selecciona un proyecto antes de crear un c�lculo");
        }
        if (!sessionUserId) {
            throw new Error("No se pudo identificar al usuario para crear el c�lculo");
        }
        const body = {
            ...payload,
            projectId: selectedProjectId,
            userId: sessionUserId,
        };
        if (normalizedType === "live_load") {
            await apiClient.post("/design-bases/live-load", body);
            return;
        }
        if (normalizedType === "reduction") {
            await apiClient.post("/design-bases/live-load/reduction", body);
            return;
        }
        if (normalizedType === "building_description") {
            await apiClient.post("/design-bases/building-description", body);
            return;
        }
        if (normalizedType === "wind_load") {
            await apiClient.post("/design-bases/wind", body);
            return;
        }
        if (normalizedType === "snow_load") {
            await apiClient.post("/design-bases/snow", body);
            return;
        }
        if (normalizedType === "seismic") {
            await apiClient.post("/design-bases/seismic", body);
            return;
        }
        throw new Error("Este tipo de c�lculo no se puede crear desde esta pantalla");
    };
    const handleSaveEditing = async () => {
        if (!editingRun) {
            return;
        }
        const payload = buildUpdatePayload();
        if (!payload) {
            return;
        }
        setEditingLoading(true);
        setEditingError(null);
        const normalized = normalizeElementType(editingRun.element_type);
        const isDraft = isDraftRun(editingRun);
        const defaultMessage = isDraft ? "No se pudo crear el cálculo" : "No se pudo actualizar el cálculo";
        try {
            if (isDraft) {
                await createDraftCalculation(normalized, payload);
            }
            else {
                const targetId = editingRun.calc_run_id ?? editingRun.id;
                await apiClient.put(`/calculations/runs/${targetId}`, payload);
            }
            await queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId], exact: true });
            handleCloseEditor();
        }
        catch (err) {
            setEditingError(getErrorMessage(err) ?? defaultMessage);
        }
        finally {
            setEditingLoading(false);
        }
    };
    const handleDeleteRun = async (run) => {
        if (!run) {
            return;
        }
        if (isDraftRun(run)) {
            handleCloseEditor();
            return;
        }
        if (!window.confirm("¿Eliminar este cálculo?")) {
            return;
        }
        setDeletingRunId(run.id);
        setEditingError(null);
        try {
            const targetId = run.calc_run_id ?? run.id;
            await apiClient.delete(`/calculations/runs/${targetId}`);
            removeRunFromSelections(run.id);
            await queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId], exact: true });
            if (editingRun?.id === run.id) {
                handleCloseEditor();
            }
        }
        catch (err) {
            const message = getErrorMessage(err) ?? "No se pudo eliminar el cálculo";
            if (editingRun?.id === run.id) {
                setEditingError(message);
            }
            else {
                setError(message);
            }
        }
        finally {
            setDeletingRunId(null);
        }
    };
    const renderEditingFields = () => {
        if (!editingRun) {
            return null;
        }
        const normalized = normalizeElementType(editingRun.element_type);
        if (normalized === "live_load") {
            if (!designOptions) {
                return _jsx(Alert, { severity: "info", sx: { mt: 2 }, children: "Cargando cat\uFFFDlogos..." });
            }
            const buildingTypes = Object.keys(designOptions.liveLoadCategories || {});
            const usageOptionsForEdit = editingValues.buildingType
                ? designOptions.liveLoadCategories[editingValues.buildingType] || []
                : [];
            return (_jsxs(Stack, { spacing: 2, sx: { mt: 2 }, children: [_jsx(TextField, { select: true, label: "Tipo de edificio", value: editingValues.buildingType ?? "", onChange: (event) => handleEditingValueChange("buildingType", event.target.value), fullWidth: true, children: buildingTypes.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }), _jsx(TextField, { select: true, label: "Uso / recinto", value: editingValues.usage ?? "", onChange: (event) => handleEditingValueChange("usage", event.target.value), fullWidth: true, disabled: !editingValues.buildingType, children: usageOptionsForEdit.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) })] }));
        }
        if (normalized === "building_description") {
            return (_jsxs(Stack, { spacing: 2, sx: { mt: 2 }, children: [_jsx(TextField, { label: "Descripci\uFFFDn del edificio", value: editingValues.text ?? "", onChange: (event) => handleEditingValueChange("text", event.target.value), fullWidth: true, multiline: true, minRows: 3 }), _jsx(TextField, { label: "Ubicaci\uFFFDn", value: editingValues.location ?? "", onChange: (event) => handleEditingValueChange("location", event.target.value), fullWidth: true }), _jsx(TextField, { label: "\uFFFDrea total (m\uFFFD)", type: "number", value: editingValues.area ?? "", onChange: (event) => handleEditingValueChange("area", event.target.value), fullWidth: true }), _jsx(TextField, { label: "Altura (m)", type: "number", value: editingValues.height ?? "", onChange: (event) => handleEditingValueChange("height", event.target.value), fullWidth: true })] }));
        }
        if (normalized === "wind_load") {
            if (!designOptions) {
                return _jsx(Alert, { severity: "info", sx: { mt: 2 }, children: "Cargando cat\uFFFDlogos..." });
            }
            return (_jsxs(Stack, { spacing: 2, sx: { mt: 2 }, children: [_jsx(TextField, { select: true, label: "Ambiente", value: editingValues.environment ?? "", onChange: (event) => handleEditingValueChange("environment", event.target.value), fullWidth: true, children: designOptions.windEnvironments.map((env) => (_jsx(MenuItem, { value: env, children: env }, env))) }), _jsx(TextField, { label: "Altura sobre el terreno (m)", type: "number", value: editingValues.height ?? "", onChange: (event) => handleEditingValueChange("height", event.target.value), fullWidth: true })] }));
        }
        if (normalized === "snow_load") {
            if (!designOptions) {
                return _jsx(Alert, { severity: "info", sx: { mt: 2 }, children: "Cargando cat\uFFFDlogos..." });
            }
            const latitudeBand = editingValues.latitudeBand ?? "";
            const exposureCategory = editingValues.exposureCategory ?? "";
            const altitudeOptionsForLat = latitudeBand
                ? Object.keys(designOptions.snowLatitudeBands[latitudeBand] || {})
                : [];
            const exposureConditions = exposureCategory
                ? designOptions.snowExposureCategories[exposureCategory] || []
                : [];
            return (_jsx(Stack, { spacing: 2, sx: { mt: 2 }, children: _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Latitud", value: latitudeBand, onChange: (event) => {
                                    handleEditingValueChange("latitudeBand", event.target.value);
                                    handleEditingValueChange("altitudeBand", "");
                                }, fullWidth: true, children: Object.keys(designOptions.snowLatitudeBands || {}).map((lat) => (_jsx(MenuItem, { value: lat, children: lat }, lat))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Altitud", value: editingValues.altitudeBand ?? "", onChange: (event) => handleEditingValueChange("altitudeBand", event.target.value), fullWidth: true, disabled: !latitudeBand, children: altitudeOptionsForLat.map((alt) => (_jsx(MenuItem, { value: alt, children: alt }, alt))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Condici\uFFFDn t\uFFFDrmica", value: editingValues.thermalCondition ?? "", onChange: (event) => handleEditingValueChange("thermalCondition", event.target.value), fullWidth: true, children: designOptions.snowThermalConditions.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Categor\uFFFDa de importancia", value: editingValues.importanceCategory ?? "", onChange: (event) => handleEditingValueChange("importanceCategory", event.target.value), fullWidth: true, children: designOptions.snowImportanceCategories.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Categor\uFFFDa de exposici\uFFFDn", value: exposureCategory, onChange: (event) => {
                                    handleEditingValueChange("exposureCategory", event.target.value);
                                    handleEditingValueChange("exposureCondition", "");
                                }, fullWidth: true, children: Object.keys(designOptions.snowExposureCategories || {}).map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Condici\uFFFDn de exposici\uFFFDn", value: editingValues.exposureCondition ?? "", onChange: (event) => handleEditingValueChange("exposureCondition", event.target.value), fullWidth: true, disabled: !exposureCategory, children: exposureConditions.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Tipo de superficie", value: editingValues.surfaceType ?? "", onChange: (event) => handleEditingValueChange("surfaceType", event.target.value), fullWidth: true, children: designOptions.snowSurfaceTypes.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Inclinaci\uFFFDn (\uFFFD)", type: "number", value: editingValues.roofPitch ?? "", onChange: (event) => handleEditingValueChange("roofPitch", event.target.value), fullWidth: true }) })] }) }));
        }
        if (normalized === "seismic") {
            if (!designOptions) {
                return _jsx(Alert, { severity: "info", sx: { mt: 2 }, children: "Cargando cat\uFFFDlogos..." });
            }
            return (_jsxs(Stack, { spacing: 2, sx: { mt: 2 }, children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { select: true, label: "Categor\uFFFDa estructural", value: editingValues.category ?? "", onChange: (event) => handleEditingValueChange("category", event.target.value), fullWidth: true, children: designOptions.seismicCategories.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { select: true, label: "Zona s\uFFFDsmica", value: editingValues.zone ?? "", onChange: (event) => handleEditingValueChange("zone", event.target.value), fullWidth: true, children: designOptions.seismicZones.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { select: true, label: "Tipo de suelo", value: editingValues.soil ?? "", onChange: (event) => handleEditingValueChange("soil", event.target.value), fullWidth: true, children: designOptions.seismicSoils.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Coeficiente R", type: "number", value: editingValues.rs ?? "", onChange: (event) => handleEditingValueChange("rs", event.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Peso s\uFFFDsmico total (kN)", type: "number", value: editingValues.ps ?? "", onChange: (event) => handleEditingValueChange("ps", event.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Periodo Tx (s)", type: "number", value: editingValues.tx ?? "", onChange: (event) => handleEditingValueChange("tx", event.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Periodo Ty (s)", type: "number", value: editingValues.ty ?? "", onChange: (event) => handleEditingValueChange("ty", event.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "R\uFFFD'0 (deriva)", type: "number", value: editingValues.r0 ?? "", onChange: (event) => handleEditingValueChange("r0", event.target.value), fullWidth: true }) })] }), _jsx(Divider, {}), _jsx(Typography, { variant: "subtitle2", children: "Distribuci\uFFFDn de niveles" }), _jsxs(Stack, { spacing: 1, children: [editingStories.map((story, index) => (_jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, alignItems: "center", children: [_jsxs(Typography, { variant: "body2", children: ["Nivel ", index + 1] }), _jsx(TextField, { label: "Altura (m)", type: "number", value: story.height, onChange: (event) => handleEditingStoryChange(story.id, "height", event.target.value), sx: { minWidth: 140 } }), _jsx(TextField, { label: "Peso (kN)", type: "number", value: story.weight, onChange: (event) => handleEditingStoryChange(story.id, "weight", event.target.value), sx: { minWidth: 140 } }), _jsx(IconButton, { onClick: () => handleRemoveEditingStory(story.id), disabled: editingStories.length <= 1, children: _jsx(DeleteIcon, { fontSize: "small" }) })] }, story.id))), _jsx(Button, { startIcon: _jsx(AddIcon, {}), onClick: handleAddEditingStory, variant: "outlined", sx: { alignSelf: "flex-start" }, children: "Agregar nivel" })] })] }));
        }
        if (normalized === "reduction") {
            const elementOptions = designOptions?.liveLoadElementTypes || [];
            return (_jsxs(Stack, { spacing: 2, sx: { mt: 2 }, children: [_jsx(TextField, { select: true, label: "Elemento estructural", value: editingValues.elementType ?? "", onChange: (event) => handleEditingValueChange("elementType", event.target.value), fullWidth: true, children: elementOptions.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }), _jsx(TextField, { label: "\uFFFDrea tributaria (m\uFFFD)", type: "number", value: editingValues.tributaryArea ?? "", onChange: (event) => handleEditingValueChange("tributaryArea", event.target.value), fullWidth: true }), _jsx(TextField, { label: "Carga base (kN/m\uFFFD)", type: "number", value: editingValues.baseLoad ?? "", onChange: (event) => handleEditingValueChange("baseLoad", event.target.value), fullWidth: true })] }));
        }
        return null;
    };
    const isDraftEditing = isDraftRun(editingRun);
    const handleGenerateDocument = async () => {
        if (!selectedProjectId || totalSelected === 0) {
            setError("Selecciona al menos un cálculo para generar el documento");
            return;
        }
        setGenerating(true);
        setError(null);
        try {
            // Recopilar los IDs seleccionados
            const selectedRunIds = Object.values(selectedCalculations).flat();
            // Obtener el nombre real del proyecto
            const currentProjectName = projectOptions.find((project) => project.id === selectedProjectId)?.name ?? "Proyecto";
            const response = await apiClient.post("/design-bases/runs/generate-from-calculations", {
                projectId: selectedProjectId,
                calculationIds: selectedRunIds,
                name: currentProjectName,
            }, { responseType: "blob" });
            // Descargar el archivo
            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Memoria_Calculo_${dayjs().format("YYYY-MM-DD")}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (err) {
            console.error("Error generando documento:", err);
            setError(err?.response?.data?.detail || "Error al generar el documento");
        }
        finally {
            setGenerating(false);
        }
    };
    const handleToggleCritical = async (runId, elementType, currentIsCritical) => {
        try {
            console.log("Toggling critical element:", { runId, elementType, currentIsCritical });
            let result;
            if (currentIsCritical) {
                result = await unsetCriticalMutation.mutateAsync(runId);
                console.log("Unset critical result:", result);
            }
            else {
                result = await setCriticalMutation.mutateAsync(runId);
                console.log("Set critical result:", result);
            }
            // Verificar que el backend devolviÃ³ datos
            if (!result?.run) {
                console.error("Backend returned null run data:", result);
                throw new Error("El backend no devolviÃ³ datos actualizados");
            }
            console.log("Updated run data:", result.run);
            // Actualizar el cachÃ© de React Query manualmente
            queryClient.setQueryData(["calculation-runs", selectedProjectId], (oldData) => {
                if (!oldData)
                    return oldData;
                console.log("Updating cache, old data:", oldData);
                // Si se estÃ¡ marcando como crÃ­tico, desmarcar otros del mismo tipo
                const updatedData = oldData.map((run) => {
                    if (run.id === runId) {
                        // Este es el elemento que se modificÃ³
                        return { ...run, is_critical: result.run.is_critical };
                    }
                    else if (run.element_type === elementType && !currentIsCritical) {
                        // Si estamos marcando uno como crÃ­tico, desmarcar los demÃ¡s del mismo tipo
                        return { ...run, is_critical: false };
                    }
                    return run;
                });
                console.log("Cache updated, new data:", updatedData);
                return updatedData;
            });
            console.log("Cache manually updated");
        }
        catch (error) {
            console.error("Error toggling critical element:", error);
            setError("Error al marcar elemento crÃ­tico. Verifica que la base de datos tenga la columna 'is_critical'.");
            // Refrescar desde el servidor en caso de error
            await queryClient.refetchQueries({
                queryKey: ["calculation-runs", selectedProjectId],
                exact: true
            });
        }
    };
    const effectiveProjectName = projectOptions.find((project) => project.id === selectedProjectId)?.name ?? "Sin proyecto";
    const getColumns = (typeId) => [
        {
            field: "selected",
            headerName: "",
            width: 50,
            renderCell: (params) => (_jsx(Checkbox, { checked: selectedCalculations[typeId]?.includes(params.row.id) || false, onChange: () => handleToggleCalculation(typeId, params.row.id) })),
        },
        {
            field: "is_critical",
            headerName: "",
            width: 60,
            sortable: false,
            renderCell: (params) => (_jsx(Box, { onClick: (e) => {
                    e.stopPropagation();
                    handleToggleCritical(params.row.id, typeId, params.row.is_critical || false);
                }, sx: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    "&:hover": {
                        transform: "scale(1.1)",
                    },
                    transition: "transform 0.2s",
                }, children: params.row.is_critical ? (_jsx(StarIcon, { color: "warning", titleAccess: "Elemento cr\u00C3\u00ADtico para reportes" })) : (_jsx(StarBorderIcon, { color: "action", titleAccess: "Marcar como cr\u00C3\u00ADtico" })) })),
        },
        {
            field: "created_at",
            headerName: "Fecha",
            width: 150,
            valueFormatter: (params) => (params.value ? dayjs(params.value).format("DD/MM/YYYY HH:mm") : "â€”"),
        },
        { field: "summary", headerName: "Resumen", flex: 1, minWidth: 250 },
        {
            field: "actions",
            headerName: "",
            width: 110,
            sortable: false,
            renderCell: (params) => (_jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(IconButton, { size: "small", onClick: (e) => {
                            e.stopPropagation();
                            handleStartEditing(params.row);
                        }, children: _jsx(EditIcon, { fontSize: "inherit" }) }), _jsx(IconButton, { size: "small", color: "error", onClick: (e) => {
                            e.stopPropagation();
                            handleDeleteRun(params.row);
                        }, disabled: deletingRunId === params.row.id, children: _jsx(DeleteIcon, { fontSize: "inherit" }) })] })),
        },
    ];
    const getSummary = (run) => {
        const result = run.result_json;
        const inputs = run.input_json;
        switch (run.element_type) {
            case "building_description": {
                const parts = [];
                if (result?.text)
                    parts.push(result.text.substring(0, 50) + (result.text.length > 50 ? "..." : ""));
                if (result?.location)
                    parts.push(`ðŸ“ ${result.location}`);
                if (result?.area)
                    parts.push(`ðŸ“ ${result.area} mÂ²`);
                if (result?.height)
                    parts.push(`ðŸ“ ${result.height} m`);
                return parts.length > 0 ? parts.join(" | ") : "â€”";
            }
            case "live_load":
                return `${inputs?.buildingType || "â€”"} | ${inputs?.usage || "â€”"} | ${result?.uniformLoad || result?.uniformLoadRaw || "â€”"} kN/mÂ²`;
            case "reduction":
            case "live_load_reduction":
                return `Elemento: ${inputs?.elementType || "â€”"} | Área: ${inputs?.tributaryArea || inputs?.tributary_area || "â€”"} m² | Carga reducida: ${typeof result?.reducedLoad === "number" ? result.reducedLoad.toFixed(3) : result?.reducedLoad || "â€”"} kN/m²`;
            case "wind_load":
                return `Ambiente: ${inputs?.environment || "â€”"} | Altura: ${inputs?.height || "â€”"}m | q = ${result?.q?.toFixed(2) || "â€”"} kN/mÂ²`;
            case "snow_load":
                return `Banda ${inputs?.latitudeBand || "â€”"} | pf = ${result?.pf?.toFixed(2) || "â€”"} kN/mÂ²`;
            case "seismic":
                return `Zona ${inputs?.zone || "â€”"} | Qbas,x = ${result?.Qbasx?.toFixed(2) || "â€”"} kN | Qbas,y = ${result?.Qbasy?.toFixed(2) || "â€”"} kN`;
            case "rc_column": {
                const longSteel = result?.longitudinalSteel;
                const transSteel = result?.transverseSteel;
                if (longSteel && transSteel) {
                    return `${longSteel.numBars}Ï†${longSteel.barDiameter} (${Math.round(longSteel.totalArea)}mmÂ²), Est Ï†${transSteel.diameter}@${transSteel.spacing}mm`;
                }
                return "â€”";
            }
            case "rc_beam": {
                const posReinf = result?.positiveReinforcemenet || result?.positiveReinforcement;
                const negReinf = result?.negativeReinforcement;
                const transSteel = result?.transverseSteel;
                if (posReinf && negReinf && transSteel) {
                    return `Sup: ${negReinf.numBars}Ï†${negReinf.barDiameter}, Inf: ${posReinf.numBars}Ï†${posReinf.barDiameter}, Est Ï†${transSteel.diameter}@${transSteel.spacing}mm`;
                }
                return "â€”";
            }
            case "steel_column":
                return `Perfil: ${inputs?.profileName || "Personalizado"} | Pn = ${result?.pn?.toFixed(1) || "â€”"} kN | Ratio: ${((result?.interactionRatio || 0) * 100).toFixed(1)}%`;
            case "steel_beam":
                return `Perfil: ${inputs?.profileName || "Personalizado"} | Mn = ${result?.mn?.toFixed(1) || "â€”"} kNÂ·m | Ratio: ${((result?.flexureRatio || 0) * 100).toFixed(1)}%`;
            case "wood_column":
                return `SecciÃ³n: ${inputs?.width || "â€”"}x${inputs?.depth || "â€”"} cm | Pn = ${result?.pn?.toFixed(1) || "â€”"} kN | Ratio: ${((result?.utilizationRatio || 0) * 100).toFixed(1)}%`;
            case "wood_beam":
                return `SecciÃ³n: ${inputs?.width || "â€”"}x${inputs?.height || "â€”"} cm | Mn = ${result?.mn?.toFixed(1) || "â€”"} kNÂ·m | Ratio: ${((result?.utilizationRatio || 0) * 100).toFixed(1)}%`;
            case "footing":
                return `Tipo: ${inputs?.footingType || "â€”"} | DimensiÃ³n: ${inputs?.length || "â€”"}x${inputs?.width || "â€”"} m | H = ${inputs?.footingDepth || "â€”"} cm`;
            default:
                return "â€”";
        }
    };
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }, children: [_jsx(Typography, { variant: "h5", children: "Documentaci\u00C3\u00B3n del proyecto" }), _jsx(TextField, { select: true, label: "Proyecto", size: "small", value: selectedProjectId ?? "", onChange: (event) => {
                            setSelectedProjectId(event.target.value);
                            setProjectInSession(event.target.value);
                            setSelectedCalculations({});
                        }, sx: { minWidth: 220 }, children: projectOptions.map((project) => (_jsx(MenuItem, { value: project.id, children: project.name }, project.id))) })] }), !selectedProjectId && (_jsx(Alert, { severity: "info", children: "Selecciona un proyecto para ver los c\u00C3\u00A1lculos disponibles y generar la memoria de c\u00C3\u00A1lculo." })), selectedProjectId && (_jsxs(_Fragment, { children: [_jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Generar Memoria de C\u00C3\u00A1lculo" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Selecciona los c\u00C3\u00A1lculos que deseas incluir en el documento Word. Puedes elegir m\u00C3\u00BAltiples c\u00C3\u00A1lculos de cada tipo." })] }), _jsx(Button, { variant: "contained", startIcon: _jsx(DownloadIcon, {}), onClick: handleGenerateDocument, disabled: generating || totalSelected === 0, children: generating ? "Generando..." : `Generar Word (${totalSelected})` })] }), error && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: error }))] }) }), calculationTypes.map((type) => {
                        const calculations = groupedCalculations[type.id] || [];
                        const selectedCount = selectedCalculations[type.id]?.length || 0;
                        const allSelected = calculations.length > 0 && selectedCount === calculations.length;
                        const someSelected = selectedCount > 0 && selectedCount < calculations.length;
                        const creationRoute = creationRoutes[type.id];
                        return (_jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", sx: { mb: 2 }, children: [_jsx(DescriptionIcon, { color: "primary" }), _jsxs(Box, { flex: 1, children: [_jsx(Typography, { variant: "h6", children: type.label }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: type.description })] }), _jsx(IconButton, { size: "small", onClick: () => handleCreateCalculation(type.id), disabled: !creationRoute, title: "Agregar c\u00E1lculo", children: _jsx(AddIcon, { fontSize: "inherit" }) }), calculations.length > 0 && (_jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: allSelected, indeterminate: someSelected, onChange: (e) => handleToggleAllType(type.id, e.target.checked) }), label: `Seleccionar todos (${calculations.length})` }))] }), calculations.length === 0 ? (_jsx(Alert, { severity: "info", children: "No hay c\u00E1lculos de este tipo en el proyecto actual. Ve a las p\u00E1ginas correspondientes para crear c\u00E1lculos." })) : (_jsx(DataGrid, { autoHeight: true, rows: calculations.map((run) => ({
                                            ...run,
                                            calc_run_id: run.id,
                                            summary: getSummary(run),
                                            is_critical: run.is_critical ?? false,
                                        })), columns: getColumns(type.id), loading: runsLoading, hideFooter: true, disableRowSelectionOnClick: true, sx: {
                                            "& .MuiDataGrid-columnHeaders": {
                                                fontWeight: 600,
                                            },
                                        } }))] }) }, type.id));
                    }), editingRun && (_jsx(Box, { sx: {
                            position: "fixed",
                            bottom: 24,
                            right: 24,
                            zIndex: 1300,
                            width: { xs: "calc(100% - 32px)", sm: 420 },
                            maxWidth: "100%",
                        }, children: _jsx(Card, { elevation: 6, children: _jsxs(CardContent, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { children: [_jsxs(Typography, { variant: "h6", children: [isDraftEditing ? "Nuevo cálculo" : "Editar cálculo", ": ", typeLabelMap[normalizeElementType(editingRun.element_type)] || editingRun.element_type] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: isDraftEditing ? "Completa los datos y crea un nuevo registro." : "Actualiza los datos del cálculo seleccionado o elimínalo del historial." })] }), _jsx(IconButton, { onClick: handleCloseEditor, children: _jsx(CloseIcon, {}) })] }), ["live_load", "reduction", "building_description", "wind_load", "snow_load", "seismic"].includes(normalizeElementType(editingRun.element_type)) ? (_jsxs(_Fragment, { children: [renderEditingFields(), editingError && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: editingError })), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, sx: { mt: 2 }, children: [_jsx(Button, { variant: "contained", onClick: handleSaveEditing, disabled: !canSaveEditing() || editingLoading, children: editingLoading
                                                            ? isDraftEditing
                                                                ? "Creando..."
                                                                : "Guardando..."
                                                            : isDraftEditing
                                                                ? "Crear cálculo"
                                                                : "Guardar cambios" }), _jsx(Button, { variant: "outlined", color: "error", onClick: () => handleDeleteRun(editingRun), disabled: isDraftEditing || deletingRunId === editingRun?.id, children: deletingRunId === editingRun?.id ? "Eliminando..." : "Eliminar cálculo" })] })] })) : (_jsx(Alert, { severity: "info", sx: { mt: 2 }, children: "Este tipo de c\u00E1lculo a\u00FAn no se puede editar desde esta pantalla." }))] }) }) }))] }))] }));
};
export default ProjectDocumentationPage;
