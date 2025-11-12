import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, List, ListItem, ListItemButton, ListItemText, MenuItem, Snackbar, Stack, TextField, Typography, } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DescriptionIcon from "@mui/icons-material/Description";
import HistoryIcon from "@mui/icons-material/History";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../api/client";
import { useDesignBaseOptions } from "../hooks/useDesignBaseOptions";
import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";
import { useConcreteColumn } from "../hooks/useStructuralCalcs";
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
const ProjectDesignBasesPage = () => {
    const { data: options, isLoading: optionsLoading, isError } = useDesignBaseOptions();
    const user = useSession((state) => state.user);
    const [buildingType, setBuildingType] = useState("");
    const [usage, setUsage] = useState("");
    const [elementType, setElementType] = useState("");
    const [tributaryArea, setTributaryArea] = useState("20");
    const [manualBaseLoad, setManualBaseLoad] = useState("");
    const [windEnvironment, setWindEnvironment] = useState("");
    const [windHeight, setWindHeight] = useState("10");
    const [latitudeBand, setLatitudeBand] = useState("");
    const [altitudeBand, setAltitudeBand] = useState("");
    const [thermalCondition, setThermalCondition] = useState("");
    const [importanceCategory, setImportanceCategory] = useState("");
    const [exposureCategory, setExposureCategory] = useState("");
    const [exposureCondition, setExposureCondition] = useState("");
    const [surfaceType, setSurfaceType] = useState("");
    const [roofPitch, setRoofPitch] = useState("5");
    const [seismicCategory, setSeismicCategory] = useState("");
    const [seismicZone, setSeismicZone] = useState("");
    const [seismicSoil, setSeismicSoil] = useState("");
    const [rsValue, setRsValue] = useState("3");
    const [psValue, setPsValue] = useState("1000");
    const [txValue, setTxValue] = useState("0.6");
    const [tyValue, setTyValue] = useState("0.5");
    const [r0Value, setR0Value] = useState("8");
    const [stories, setStories] = useState([
        { id: 1, height: "3.0", weight: "300" },
        { id: 2, height: "3.0", weight: "300" },
    ]);
    const handleStoryChange = (id, field, value) => {
        setStories((prev) => prev.map((story) => (story.id === id ? { ...story, [field]: value } : story)));
    };
    const handleAddStory = () => {
        setStories((prev) => {
            const nextId = prev.length ? Math.max(...prev.map((s) => s.id)) + 1 : 1;
            const last = prev[prev.length - 1];
            return [
                ...prev,
                { id: nextId, height: last?.height ?? "3.0", weight: last?.weight ?? "300" },
            ];
        });
    };
    const handleRemoveStory = (id) => {
        setStories((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
    };
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState(null);
    // Estados para descripciÃ³n del edificio
    const [buildingDescription, setBuildingDescription] = useState("");
    const [buildingLocation, setBuildingLocation] = useState("");
    const [buildingArea, setBuildingArea] = useState("");
    const [buildingHeight, setBuildingHeight] = useState("");
    // Estados para pilar de hormigÃ³n armado
    const [ccAxialLoad, setCcAxialLoad] = useState("500");
    const [ccMomentX, setCcMomentX] = useState("50");
    const [ccMomentY, setCcMomentY] = useState("40");
    const [ccShearX, setCcShearX] = useState("30");
    const [ccShearY, setCcShearY] = useState("25");
    const [ccWidth, setCcWidth] = useState("40");
    const [ccDepth, setCcDepth] = useState("40");
    const [ccLength, setCcLength] = useState("3.0");
    const [ccFc, setCcFc] = useState("25");
    const [ccFy, setCcFy] = useState("420");
    // Estado para guardar/cargar bases de cÃ¡lculo
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [projectId, setProjectId] = useState(localStorage.getItem("activeProjectId") || "");
    const [savedBases, setSavedBases] = useState([]);
    // Cargar lista de proyectos
    const { data: projects = [], isLoading: projectsLoading } = useProjects();
    // Estado para generar documento Word y historial
    const [generateDocDialogOpen, setGenerateDocDialogOpen] = useState(false);
    const [docProjectName, setDocProjectName] = useState("");
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [runHistory, setRunHistory] = useState([]);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [autoSaveSnackbar, setAutoSaveSnackbar] = useState(false);
    const liveLoadMutation = useMutation({
        mutationFn: async (payload) => {
            const fullPayload = {
                ...payload,
                projectId: projectId || undefined,
                userId: user?.id || undefined,
            };
            const { data } = await apiClient.post("/design-bases/live-load", fullPayload);
            // Normalizar respuesta: puede ser {results, run_id} o {results}
            return data.results || data;
        },
    });
    const liveLoadReductionMutation = useMutation({
        mutationFn: async (payload) => {
            const fullPayload = {
                ...payload,
                projectId: projectId || undefined,
                userId: user?.id || undefined,
            };
            const { data } = await apiClient.post("/design-bases/live-load/reduction", fullPayload);
            const normalized = data.results ?? data;
            const reducedLoad = normalized?.reducedLoad;
            if (typeof reducedLoad !== "number") {
                throw new Error("Respuesta inválida del servidor: reducedLoad ausente");
            }
            return { reducedLoad, run_id: data.run_id };
        },
    });
    const windMutation = useMutation({
        mutationFn: async (payload) => {
            const fullPayload = {
                ...payload,
                projectId: projectId || undefined,
                userId: user?.id || undefined,
            };
            const { data } = await apiClient.post("/design-bases/wind", fullPayload);
            // Normalizar respuesta
            return data.results || data;
        },
    });
    const snowMutation = useMutation({
        mutationFn: async (payload) => {
            const fullPayload = {
                ...payload,
                projectId: projectId || undefined,
                userId: user?.id || undefined,
            };
            const { data } = await apiClient.post("/design-bases/snow", fullPayload);
            // Normalizar respuesta
            return data.results || data;
        },
    });
    const seismicMutation = useMutation({
        mutationFn: async (payload) => {
            const fullPayload = {
                ...payload,
                projectId: projectId || undefined,
                userId: user?.id || undefined,
            };
            const { data } = await apiClient.post("/design-bases/seismic", fullPayload);
            // Normalizar respuesta
            return data.results || data;
        },
    });
    // Mutation para pilar de hormigÃ³n armado
    const concreteColumnMutation = useConcreteColumn();
    const concreteColumnResult = concreteColumnMutation.data?.results;
    // Mutation para descripciÃ³n del edificio
    const buildingDescriptionMutation = useMutation({
        mutationFn: async () => {
            if (!projectId || !user?.id) {
                throw new Error("Faltan project_id o user_id");
            }
            const payload = {
                projectId,
                userId: user.id,
                text: buildingDescription || undefined,
                location: buildingLocation || undefined,
                area: buildingArea || undefined,
                height: buildingHeight || undefined,
            };
            const { data } = await apiClient.post("/design-bases/building-description", payload);
            return data;
        },
    });
    const usageOptions = useMemo(() => {
        if (!options || !buildingType)
            return [];
        return options.liveLoadCategories[buildingType] ?? [];
    }, [options, buildingType]);
    const altitudeOptions = useMemo(() => {
        if (!options || !latitudeBand)
            return [];
        return Object.keys(options.snowLatitudeBands[latitudeBand] ?? {});
    }, [latitudeBand, options]);
    const exposureConditions = useMemo(() => {
        if (!options || !exposureCategory)
            return [];
        return options.snowExposureCategories[exposureCategory] ?? [];
    }, [exposureCategory, options]);
    const storiesValid = stories.every((story) => Number(story.height) > 0 && Number(story.weight) > 0);
    const seismicErrorMessage = seismicMutation.isError
        ? getErrorMessage(seismicMutation.error)
        : null;
    const hasAnyResult = !!liveLoadMutation.data ||
        !!liveLoadReductionMutation.data ||
        !!windMutation.data ||
        !!snowMutation.data ||
        !!seismicMutation.data;
    const buildExportPayload = () => {
        const payload = {};
        // Agregar descripciÃ³n del edificio si hay al menos un campo lleno
        if (buildingDescription || buildingLocation || buildingArea || buildingHeight) {
            payload.buildingDescription = {
                text: buildingDescription || undefined,
                location: buildingLocation || undefined,
                area: buildingArea || undefined,
                height: buildingHeight || undefined,
            };
        }
        if (liveLoadMutation.data) {
            payload.liveLoad = {
                buildingType,
                usage,
                ...liveLoadMutation.data,
            };
        }
        const areaValue = Number(tributaryArea);
        if (liveLoadReductionMutation.data &&
            elementType &&
            baseLoadValue !== undefined &&
            Number.isFinite(baseLoadValue) &&
            Number.isFinite(areaValue) &&
            areaValue > 0) {
            payload.reduction = {
                elementType,
                tributaryArea: areaValue,
                baseLoad: baseLoadValue,
                reducedLoad: liveLoadReductionMutation.data.reducedLoad,
            };
        }
        const reductionEntry = payload.reduction;
        if (reductionEntry) {
            const reductionIsValid = typeof reductionEntry.elementType === "string" &&
                Number.isFinite(reductionEntry.tributaryArea) &&
                Number.isFinite(reductionEntry.baseLoad) &&
                Number.isFinite(reductionEntry.reducedLoad);
            if (!reductionIsValid) {
                console.warn("Reduction inválida; se excluye del guardado:", reductionEntry);
                delete payload.reduction;
            }
        }
        if (windMutation.data && windEnvironment && windHeight) {
            payload.wind = {
                environment: windEnvironment,
                height: Number(windHeight),
                q: windMutation.data.q,
                message: windMutation.data.message,
            };
        }
        if (snowMutation.data &&
            latitudeBand &&
            altitudeBand &&
            thermalCondition &&
            importanceCategory &&
            exposureCategory &&
            exposureCondition &&
            surfaceType) {
            payload.snow = {
                latitudeBand,
                altitudeBand,
                thermalCondition,
                importanceCategory,
                exposureCategory,
                exposureCondition,
                surfaceType,
                roofPitch: Number(roofPitch),
                ...snowMutation.data,
            };
        }
        if (seismicMutation.data &&
            seismicCategory &&
            seismicZone &&
            seismicSoil &&
            storiesValid) {
            payload.seismic = {
                params: {
                    category: seismicCategory,
                    zone: seismicZone,
                    soil: seismicSoil,
                    rs: Number(rsValue),
                    ps: Number(psValue),
                    tx: Number(txValue),
                    ty: Number(tyValue),
                    r0: Number(r0Value),
                    stories: stories.map((story) => ({
                        height: Number(story.height),
                        weight: Number(story.weight),
                    })),
                },
                result: seismicMutation.data,
            };
        }
        // Agregar cÃ¡lculos estructurales si existen
        const structural = {};
        if (concreteColumnResult) {
            structural.concreteColumn = concreteColumnResult;
        }
        if (Object.keys(structural).length > 0) {
            payload.structural = structural;
        }
        return payload;
    };
    const handleExport = async (format) => {
        setExportError(null);
        const payload = buildExportPayload();
        if (!Object.keys(payload).length) {
            setExportError("Genera al menos un cÃ¡lculo antes de exportar.");
            return;
        }
        setExporting(true);
        try {
            const response = await apiClient.post(`/design-bases/export/${format}`, payload, {
                responseType: "blob",
            });
            const blob = response.data;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download =
                format === "csv"
                    ? "bases_calculo.csv"
                    : format === "docx"
                        ? "bases_calculo.docx"
                        : "bases_calculo.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
        catch (error) {
            setExportError(getErrorMessage(error) ?? "No se pudo generar la exportaciÃ³n.");
        }
        finally {
            setExporting(false);
        }
    };
    const handleSaveDesignBase = async () => {
        if (!saveName.trim() || !projectId) {
            alert("Ingresa un nombre y asegÃºrate de tener un proyecto activo");
            return;
        }
        const payload = buildExportPayload();
        console.log("SAVE payload:", payload);
        if (!Object.keys(payload).length) {
            alert("Genera al menos un cÃ¡lculo antes de guardar.");
            return;
        }
        try {
            await apiClient.post("/design-bases/save", {
                projectId,
                name: saveName,
                data: payload,
            });
            alert("Base de cÃ¡lculo guardada exitosamente");
            setSaveDialogOpen(false);
            setSaveName("");
        }
        catch (error) {
            console.error("SAVE error:", error?.response?.data ?? error);
            alert(getErrorMessage(error) ?? "No se pudo guardar la base de cÃ¡lculo");
        }
    };
    const handleLoadList = async () => {
        if (!projectId) {
            alert("Selecciona un proyecto primero");
            return;
        }
        try {
            const { data } = await apiClient.get(`/design-bases/list/${projectId}`);
            setSavedBases(data);
            setLoadDialogOpen(true);
        }
        catch (error) {
            alert(getErrorMessage(error) ?? "No se pudo cargar la lista");
        }
    };
    const handleLoadDesignBase = async (id) => {
        try {
            const { data } = await apiClient.get(`/design-bases/load/${id}`);
            const loadedData = data.data;
            // Cargar descripciÃ³n del edificio
            if (loadedData.buildingDescription) {
                setBuildingDescription(loadedData.buildingDescription.text || "");
                setBuildingLocation(loadedData.buildingDescription.location || "");
                setBuildingArea(loadedData.buildingDescription.area || "");
                setBuildingHeight(loadedData.buildingDescription.height || "");
            }
            // Cargar live load
            if (loadedData.liveLoad) {
                setBuildingType(loadedData.liveLoad.buildingType);
                setUsage(loadedData.liveLoad.usage);
                liveLoadMutation.mutate({ buildingType: loadedData.liveLoad.buildingType, usage: loadedData.liveLoad.usage });
            }
            // Cargar reduction
            if (loadedData.reduction) {
                setElementType(loadedData.reduction.elementType);
                setTributaryArea(loadedData.reduction.tributaryArea.toString());
                setManualBaseLoad(loadedData.reduction.baseLoad.toString());
            }
            // Cargar wind
            if (loadedData.wind) {
                setWindEnvironment(loadedData.wind.environment);
                setWindHeight(loadedData.wind.height.toString());
            }
            // Cargar snow
            if (loadedData.snow) {
                setLatitudeBand(loadedData.snow.latitudeBand);
                setAltitudeBand(loadedData.snow.altitudeBand);
                setThermalCondition(loadedData.snow.thermalCondition);
                setImportanceCategory(loadedData.snow.importanceCategory);
                setExposureCategory(loadedData.snow.exposureCategory);
                setExposureCondition(loadedData.snow.exposureCondition);
                setSurfaceType(loadedData.snow.surfaceType);
                setRoofPitch(loadedData.snow.roofPitch.toString());
            }
            // Cargar seismic
            if (loadedData.seismic && loadedData.seismic.params) {
                const params = loadedData.seismic.params;
                setSeismicCategory(params.category);
                setSeismicZone(params.zone);
                setSeismicSoil(params.soil);
                setRsValue(params.rs.toString());
                setPsValue(params.ps.toString());
                setTxValue(params.tx.toString());
                setTyValue(params.ty.toString());
                setR0Value(params.r0.toString());
                if (params.stories) {
                    setStories(params.stories.map((s, idx) => ({
                        id: idx + 1,
                        height: s.height.toString(),
                        weight: s.weight.toString(),
                    })));
                }
            }
            setLoadDialogOpen(false);
            alert("Base de cÃ¡lculo cargada exitosamente");
        }
        catch (error) {
            console.error("SAVE error:", error?.response?.data ?? error);
            alert(getErrorMessage(error) ?? "No se pudo cargar la base de cÃ¡lculo");
        }
    };
    const handleGenerateDocument = async () => {
        if (!docProjectName.trim() || !projectId) {
            alert("Ingresa un nombre de proyecto");
            return;
        }
        const payload = buildExportPayload();
        if (!Object.keys(payload).length) {
            alert("Genera al menos un cÃ¡lculo antes de crear el documento.");
            return;
        }
        try {
            await apiClient.post("/design-bases/runs/create", {
                projectId,
                name: docProjectName,
                projectName: docProjectName,
                data: payload,
            });
            alert("Documento generado y guardado en el historial");
            setGenerateDocDialogOpen(false);
            setDocProjectName("");
        }
        catch (error) {
            console.error("SAVE error:", error?.response?.data ?? error);
            alert(getErrorMessage(error) ?? "No se pudo generar el documento");
        }
    };
    const handleViewHistory = async () => {
        if (!projectId) {
            alert("Selecciona un proyecto primero");
            return;
        }
        try {
            const { data } = await apiClient.get(`/design-bases/runs/list/${projectId}`);
            setRunHistory(data);
            setHistoryDialogOpen(true);
        }
        catch (error) {
            console.error("SAVE error:", error?.response?.data ?? error);
            alert(getErrorMessage(error) ?? "No se pudo cargar el historial");
        }
    };
    const handlePreviewDocument = async (runId) => {
        try {
            const { data } = await apiClient.get(`/design-bases/runs/get/${runId}`);
            setPreviewData(data);
            setPreviewDialogOpen(true);
        }
        catch (error) {
            console.error("SAVE error:", error?.response?.data ?? error);
            alert(getErrorMessage(error) ?? "No se pudo cargar el preview");
        }
    };
    const handleDownloadDocument = async (runId) => {
        try {
            const response = await apiClient.get(`/design-bases/runs/download/${runId}`, {
                responseType: "blob",
            });
            const blob = new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "bases_calculo.docx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error("SAVE error:", error?.response?.data ?? error);
            alert(getErrorMessage(error) ?? "No se pudo descargar el documento");
        }
    };
    // FunciÃ³n para guardar automÃ¡ticamente en el historial
    const saveToHistoryAutomatically = async () => {
        if (!projectId)
            return;
        const payload = buildExportPayload();
        if (!Object.keys(payload).length)
            return;
        try {
            const timestamp = new Date().toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
            const autoName = `CÃ¡lculo ${timestamp}`;
            await apiClient.post("/design-bases/runs/create", {
                projectId,
                name: autoName,
                projectName: autoName,
                data: payload,
            });
            console.log("Guardado automÃ¡tico en historial:", autoName);
            setAutoSaveSnackbar(true);
        }
        catch (error) {
            console.error("Error al guardar automÃ¡ticamente:", error);
            // No mostramos alert para no interrumpir el flujo del usuario
        }
    };
    // useEffect para guardar automÃ¡ticamente cuando se completen cÃ¡lculos importantes
    const baseLoadValue = manualBaseLoad !== "" ? Number(manualBaseLoad) : undefined;
    if (optionsLoading) {
        return (_jsx(Box, { sx: { display: "flex", justifyContent: "center", mt: 6 }, children: _jsx(Typography, { children: "Cargando cat\u00C3\u00A1logos..." }) }));
    }
    if (isError || !options) {
        return (_jsx(Alert, { severity: "error", children: "No se pudieron recuperar las opciones base. Verifica la API e int\u00C3\u00A9ntalo nuevamente." }));
    }
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "Bases de c\u00C3\u00A1lculo y cargas de dise\u00C3\u00B1o" }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsx(TextField, { select: true, label: "Proyecto", size: "small", value: projectId, onChange: (e) => {
                                    setProjectId(e.target.value);
                                    localStorage.setItem("activeProjectId", e.target.value);
                                }, disabled: projectsLoading, sx: { width: 300 }, children: projects.map((project) => (_jsx(MenuItem, { value: project.id, children: project.name }, project.id))) }), _jsx(Button, { variant: "outlined", startIcon: _jsx(FolderOpenIcon, {}), onClick: handleLoadList, disabled: !projectId, children: "Cargar" }), _jsx(Button, { variant: "contained", startIcon: _jsx(SaveIcon, {}), onClick: () => setSaveDialogOpen(true), disabled: !hasAnyResult || !projectId, children: "Guardar" }), _jsx(Button, { variant: "contained", color: "success", startIcon: _jsx(DescriptionIcon, {}), onClick: () => setGenerateDocDialogOpen(true), disabled: !hasAnyResult || !projectId, children: "Generar Word" }), _jsx(Button, { variant: "outlined", startIcon: _jsx(HistoryIcon, {}), onClick: handleViewHistory, disabled: !projectId, children: "Historial" })] })] }), _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Descripci\u00C3\u00B3n del Edificio" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "Descripci\u00C3\u00B3n General", value: buildingDescription, onChange: (e) => setBuildingDescription(e.target.value), fullWidth: true, multiline: true, rows: 3, placeholder: "Ej: Edificio de oficinas de 5 pisos con estructura de hormig\u00C3\u00B3n armado..." }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(TextField, { label: "Ubicaci\u00C3\u00B3n", value: buildingLocation, onChange: (e) => setBuildingLocation(e.target.value), fullWidth: true, placeholder: "Ej: Av. Principal 123, Santiago" }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { label: "\u00C3\u0081rea Total (m\u00C2\u00B2)", value: buildingArea, onChange: (e) => setBuildingArea(e.target.value), fullWidth: true, placeholder: "Ej: 1250" }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { label: "Altura Total (m)", value: buildingHeight, onChange: (e) => setBuildingHeight(e.target.value), fullWidth: true, placeholder: "Ej: 18.5" }) }), _jsxs(Grid, { item: true, xs: 12, children: [_jsx(Button, { variant: "contained", startIcon: _jsx(SaveIcon, {}), onClick: () => buildingDescriptionMutation.mutate(), disabled: !projectId ||
                                                !user?.id ||
                                                (!buildingDescription && !buildingLocation && !buildingArea && !buildingHeight) ||
                                                buildingDescriptionMutation.isPending, children: "Guardar descripci\u00F3n" }), buildingDescriptionMutation.isSuccess && (_jsx(Alert, { severity: "success", sx: { mt: 2 }, children: "Descripci\u00F3n guardada en el historial" })), buildingDescriptionMutation.isError && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: buildingDescriptionMutation.error?.response?.data?.detail ||
                                                buildingDescriptionMutation.error?.message ||
                                                "Error al guardar la descripción" }))] })] })] }) }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Cargas vivas por uso" }), _jsx(TextField, { select: true, label: "Tipo de edificio", value: buildingType, onChange: (event) => {
                                            setBuildingType(event.target.value);
                                            setUsage("");
                                            liveLoadMutation.reset();
                                        }, fullWidth: true, children: Object.keys(options.liveLoadCategories).map((category) => (_jsx(MenuItem, { value: category, children: category }, category))) }), _jsx(TextField, { select: true, label: "Uso / recinto", value: usage, onChange: (event) => {
                                            setUsage(event.target.value);
                                            liveLoadMutation.reset();
                                        }, fullWidth: true, disabled: !buildingType, children: usageOptions.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }), _jsx(Button, { variant: "contained", onClick: () => liveLoadMutation.mutate({ buildingType, usage }), disabled: !buildingType || !usage || liveLoadMutation.isPending, children: "Consultar carga viva" }), liveLoadMutation.isError && (_jsx(Alert, { severity: "error", children: "No se encontr\u00F3 la combinaci\u00F3n seleccionada." })), liveLoadMutation.data && (_jsxs(Box, { sx: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }, children: [_jsx(Typography, { color: "text.secondary", children: "Carga uniforme" }), _jsxs(Typography, { children: [liveLoadMutation.data.uniformLoad ?? liveLoadMutation.data.uniformLoadRaw, " kN/m\u00B2"] }), _jsx(Typography, { color: "text.secondary", children: "Carga concentrada" }), _jsxs(Typography, { children: [liveLoadMutation.data.concentratedLoad ?? liveLoadMutation.data.concentratedLoadRaw, " kN"] })] }))] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Reducci\u00F3n por \u00E1rea tributaria (NCh1537)" }), _jsx(TextField, { select: true, label: "Elemento estructural", value: elementType, onChange: (event) => setElementType(event.target.value), fullWidth: true, children: options.liveLoadElementTypes.map((item) => (_jsx(MenuItem, { value: item, children: item }, item))) }), _jsx(TextField, { label: "\u00C1rea tributaria (m\u00B2)", type: "number", value: tributaryArea, onChange: (event) => setTributaryArea(event.target.value), fullWidth: true }), _jsx(TextField, { label: "Carga base (kN/m\u00B2)", type: "number", value: manualBaseLoad, onChange: (event) => setManualBaseLoad(event.target.value), helperText: "Ingresa la carga uniforme que deseas reducir.", fullWidth: true }), _jsx(Button, { variant: "contained", onClick: () => {
                                            const areaValue = Number(tributaryArea);
                                            const baseLoadValue = manualBaseLoad !== "" ? Number(manualBaseLoad) : Number.NaN;
                                            if (!Number.isFinite(areaValue) || !Number.isFinite(baseLoadValue)) {
                                                return;
                                            }
                                            liveLoadReductionMutation.mutate({ elementType, tributaryArea: areaValue, baseLoad: baseLoadValue }, {
                                                onSuccess: async () => {
                                                    if (projectId) {
                                                        try {
                                                            await saveToHistoryAutomatically();
                                                        }
                                                        catch (e) {
                                                            console.error("Auto-guardado falló:", e);
                                                        }
                                                    }
                                                },
                                            });
                                        }, disabled: !projectId ||
                                            !user?.id ||
                                            !elementType ||
                                            !tributaryArea ||
                                            manualBaseLoad === "" ||
                                            liveLoadReductionMutation.isPending ||
                                            Number(tributaryArea) <= 0 ||
                                            Number(manualBaseLoad) <= 0, children: "Calcular carga reducida" }), liveLoadReductionMutation.isSuccess && (_jsxs(Alert, { severity: "success", children: ["Carga reducida: ", typeof liveLoadReductionMutation.data?.reducedLoad === "number" ? `${liveLoadReductionMutation.data.reducedLoad.toFixed(3)} kN/m²` : "N/A"] })), liveLoadReductionMutation.isError && (_jsx(Alert, { severity: "error", children: "No fue posible calcular la reducci\u00F3n." }))] }) }) })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Presi\u00C3\u00B3n de viento (NCh432)" }), _jsx(TextField, { select: true, label: "Entorno", value: windEnvironment, onChange: (event) => setWindEnvironment(event.target.value), fullWidth: true, children: options.windEnvironments.map((env) => (_jsx(MenuItem, { value: env, children: env }, env))) }), _jsx(TextField, { label: "Altura sobre el terreno (m)", type: "number", value: windHeight, onChange: (event) => setWindHeight(event.target.value), fullWidth: true }), _jsx(Button, { variant: "contained", onClick: () => {
                                            const heightValue = Number(windHeight);
                                            if (!Number.isFinite(heightValue) || heightValue <= 0) {
                                                return;
                                            }
                                            windMutation.mutate({ environment: windEnvironment, height: heightValue });
                                        }, disabled: !windEnvironment ||
                                            !windHeight ||
                                            !Number.isFinite(Number(windHeight)) ||
                                            Number(windHeight) <= 0 ||
                                            windMutation.isPending, children: "Calcular q" }), windMutation.data && (_jsx(Alert, { severity: windMutation.data.q ? "success" : "warning", children: windMutation.data.q
                                            ? `q = ${windMutation.data.q.toFixed(3)} kN/mÂ²`
                                            : windMutation.data.message }))] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 8, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Cargas de nieve sobre techumbre" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Latitud (\u00C2\u00B0)", value: latitudeBand, onChange: (event) => {
                                                        setLatitudeBand(event.target.value);
                                                        setAltitudeBand("");
                                                    }, fullWidth: true, children: Object.keys(options.snowLatitudeBands).map((lat) => (_jsx(MenuItem, { value: lat, children: lat }, lat))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Altitud (m.s.n.m.)", value: altitudeBand, onChange: (event) => setAltitudeBand(event.target.value), disabled: !latitudeBand, fullWidth: true, children: altitudeOptions.map((alt) => (_jsx(MenuItem, { value: alt, children: alt }, alt))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Condici\u00C3\u00B3n t\u00C3\u00A9rmica", value: thermalCondition, onChange: (event) => setThermalCondition(event.target.value), fullWidth: true, children: options.snowThermalConditions.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Categor\u00C3\u00ADa de importancia", value: importanceCategory, onChange: (event) => setImportanceCategory(event.target.value), fullWidth: true, children: options.snowImportanceCategories.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Categor\u00C3\u00ADa de exposici\u00C3\u00B3n", value: exposureCategory, onChange: (event) => {
                                                        setExposureCategory(event.target.value);
                                                        setExposureCondition("");
                                                    }, fullWidth: true, children: Object.keys(options.snowExposureCategories).map((categoryKey) => (_jsx(MenuItem, { value: categoryKey, children: categoryKey }, categoryKey))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Condici\u00C3\u00B3n de exposici\u00C3\u00B3n", value: exposureCondition, onChange: (event) => setExposureCondition(event.target.value), disabled: !exposureCategory, fullWidth: true, children: exposureConditions.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { select: true, label: "Tipo de superficie", value: surfaceType, onChange: (event) => setSurfaceType(event.target.value), fullWidth: true, children: options.snowSurfaceTypes.map((option) => (_jsx(MenuItem, { value: option, children: option }, option))) }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Inclinaci\u00C3\u00B3n (\u00C2\u00B0)", type: "number", value: roofPitch, onChange: (event) => setRoofPitch(event.target.value), fullWidth: true }) })] }), _jsx(Button, { variant: "contained", onClick: () => snowMutation.mutate({
                                            latitudeBand,
                                            altitudeBand,
                                            thermalCondition,
                                            importanceCategory,
                                            exposureCategory,
                                            exposureCondition,
                                            surfaceType,
                                            roofPitch: Number(roofPitch),
                                        }), disabled: !latitudeBand ||
                                            !altitudeBand ||
                                            !thermalCondition ||
                                            !importanceCategory ||
                                            !exposureCategory ||
                                            !exposureCondition ||
                                            !surfaceType ||
                                            !roofPitch ||
                                            snowMutation.isPending, children: "Calcular nieve sobre techo" }), snowMutation.isError && (_jsx(Alert, { severity: "error", children: "No hay datos para la combinaci\u00C3\u00B3n seleccionada." })), snowMutation.data && (_jsxs(Box, { sx: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 1 }, children: [_jsx(Typography, { color: "text.secondary", children: "Pg (kN/m\u00C2\u00B2)" }), _jsx(Typography, { children: snowMutation.data.pg?.toFixed(2) ?? 'N/A' }), _jsx(Typography, { color: "text.secondary", children: "ct" }), _jsx(Typography, { children: snowMutation.data.ct?.toFixed(2) ?? 'N/A' }), _jsx(Typography, { color: "text.secondary", children: "ce" }), _jsx(Typography, { children: snowMutation.data.ce?.toFixed(2) ?? 'N/A' }), _jsx(Typography, { color: "text.secondary", children: "I" }), _jsx(Typography, { children: snowMutation.data.I?.toFixed(2) ?? 'N/A' }), _jsx(Typography, { color: "text.secondary", children: "cs" }), _jsx(Typography, { children: snowMutation.data.cs?.toFixed(3) ?? 'N/A' }), _jsx(Typography, { color: "text.secondary", children: "pf (kN/m\u00C2\u00B2)" }), _jsx(Typography, { children: snowMutation.data.pf?.toFixed(3) ?? 'N/A' })] }))] }) }) })] }), _jsx(Card, { children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(Typography, { variant: "h6", children: "An\u00C3\u00A1lisis s\u00C3\u00ADsmico base (NCh433)" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { select: true, label: "Categor\u00C3\u00ADa estructural", value: seismicCategory, onChange: (event) => setSeismicCategory(event.target.value), fullWidth: true, children: options.seismicCategories.map((cat) => (_jsx(MenuItem, { value: cat, children: cat }, cat))) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { select: true, label: "Zona s\u00C3\u00ADsmica", value: seismicZone, onChange: (event) => setSeismicZone(event.target.value), fullWidth: true, children: options.seismicZones.map((zone) => (_jsx(MenuItem, { value: zone, children: zone }, zone))) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { select: true, label: "Tipo de suelo", value: seismicSoil, onChange: (event) => setSeismicSoil(event.target.value), fullWidth: true, children: options.seismicSoils.map((soil) => (_jsx(MenuItem, { value: soil, children: soil }, soil))) }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { label: "Coeficiente R", type: "number", value: rsValue, onChange: (event) => setRsValue(event.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { label: "Peso s\u00C3\u00ADsmico total (kN)", type: "number", value: psValue, onChange: (event) => setPsValue(event.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { label: "Per\u00C3\u00ADodo Tx (s)", type: "number", value: txValue, onChange: (event) => setTxValue(event.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { label: "Per\u00C3\u00ADodo Ty (s)", type: "number", value: tyValue, onChange: (event) => setTyValue(event.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 3, children: _jsx(TextField, { label: "R\u00E2\u201A\u20AC (deriva)", type: "number", value: r0Value, onChange: (event) => setR0Value(event.target.value), fullWidth: true }) })] }), _jsx(Divider, {}), _jsx(Typography, { variant: "subtitle1", children: "Distribuci\u00C3\u00B3n de niveles" }), _jsxs(Stack, { spacing: 1, children: [stories.map((story, index) => (_jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, alignItems: "center", children: [_jsxs(Typography, { variant: "body2", children: ["Nivel ", index + 1] }), _jsx(TextField, { label: "Altura (m)", type: "number", value: story.height, onChange: (event) => handleStoryChange(story.id, "height", event.target.value), sx: { minWidth: 140 } }), _jsx(TextField, { label: "Peso (kN)", type: "number", value: story.weight, onChange: (event) => handleStoryChange(story.id, "weight", event.target.value), sx: { minWidth: 140 } }), _jsx(IconButton, { "aria-label": "Eliminar nivel", onClick: () => handleRemoveStory(story.id), disabled: stories.length <= 1, children: _jsx(DeleteIcon, { fontSize: "small" }) })] }, story.id))), _jsx(Button, { startIcon: _jsx(AddIcon, {}), onClick: handleAddStory, variant: "outlined", sx: { alignSelf: "flex-start" }, children: "Agregar nivel" })] }), _jsx(Button, { variant: "contained", onClick: () => seismicMutation.mutate({
                                category: seismicCategory,
                                zone: seismicZone,
                                soil: seismicSoil,
                                rs: Number(rsValue),
                                ps: Number(psValue),
                                tx: Number(txValue),
                                ty: Number(tyValue),
                                r0: Number(r0Value),
                                stories: stories.map((story) => ({
                                    height: Number(story.height),
                                    weight: Number(story.weight),
                                })),
                            }), disabled: !seismicCategory ||
                                !seismicZone ||
                                !seismicSoil ||
                                !rsValue ||
                                !psValue ||
                                !txValue ||
                                !tyValue ||
                                !r0Value ||
                                !storiesValid ||
                                seismicMutation.isPending, children: "Calcular espectro y fuerzas" }), seismicMutation.isError && (_jsx(Alert, { severity: "error", children: seismicErrorMessage ?? "Verifica los valores ingresados; no se pudo calcular el anÃ¡lisis." })), seismicMutation.data && (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsxs(Box, { sx: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 1 }, children: [_jsxs(Typography, { color: "text.secondary", children: ["I", _jsx("sub", { children: "s" })] }), _jsx(Typography, { children: seismicMutation.data.intensityFactor.toFixed(3) }), _jsxs(Typography, { color: "text.secondary", children: ["A", _jsx("sub", { children: "0" })] }), _jsx(Typography, { children: seismicMutation.data.zoneFactor.toFixed(3) }), _jsxs(Typography, { color: "text.secondary", children: ["Q", _jsx("sub", { children: "bas,x" })] }), _jsxs(Typography, { children: [seismicMutation.data.Qbasx.toFixed(3), " kN"] }), _jsxs(Typography, { color: "text.secondary", children: ["Q", _jsx("sub", { children: "bas,y" })] }), _jsxs(Typography, { children: [seismicMutation.data.Qbasy.toFixed(3), " kN"] }), _jsxs(Typography, { color: "text.secondary", children: ["Q", _jsx("sub", { children: "basal,m\u00C3\u00ADn" })] }), _jsxs(Typography, { children: [seismicMutation.data.Q0Min.toFixed(3), " kN"] }), _jsxs(Typography, { color: "text.secondary", children: ["Q", _jsx("sub", { children: "basal,m\u00C3\u00A1x" })] }), _jsxs(Typography, { children: [seismicMutation.data.Q0Max.toFixed(3), " kN"] })] }), _jsx(Typography, { variant: "subtitle2", children: "Distribuci\u00C3\u00B3n de fuerzas por nivel" }), _jsx(DataGrid, { autoHeight: true, density: "compact", rows: seismicMutation.data.floorForces.map((row) => ({ id: row.level, ...row })), columns: [
                                        { field: "level", headerName: "Nivel", width: 120 },
                                        { field: "Fkx", headerName: "Fkx (kN)", width: 160, valueFormatter: ({ value }) => value.toFixed(2) },
                                        { field: "Fky", headerName: "Fky (kN)", width: 160, valueFormatter: ({ value }) => value.toFixed(2) },
                                    ], hideFooter: true }), _jsx(Typography, { variant: "subtitle2", children: "Espectro de dise\u00C3\u00B1o (Sa)" }), _jsx(DataGrid, { autoHeight: true, density: "compact", rows: seismicMutation.data.spectrum.map((row, index) => ({ id: index, ...row })), columns: [
                                        {
                                            field: "period",
                                            headerName: "T (s)",
                                            width: 120,
                                            valueFormatter: ({ value }) => value.toFixed(2),
                                        },
                                        {
                                            field: "SaX",
                                            headerName: "SaX (g)",
                                            width: 150,
                                            valueFormatter: ({ value }) => value.toFixed(3),
                                        },
                                        {
                                            field: "SaY",
                                            headerName: "SaY (g)",
                                            width: 150,
                                            valueFormatter: ({ value }) => value.toFixed(3),
                                        },
                                    ], initialState: {
                                        pagination: { paginationModel: { pageSize: 10, page: 0 } },
                                    }, pageSizeOptions: [10, 25, 50] })] }))] }) }), _jsx(Card, { sx: { mb: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Pilar de Hormig\u00C3\u00B3n Armado (ACI318)" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Carga Axial (kN)", type: "number", value: ccAxialLoad, onChange: (e) => setCcAxialLoad(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Momento X (kN\u00C2\u00B7m)", type: "number", value: ccMomentX, onChange: (e) => setCcMomentX(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Momento Y (kN\u00C2\u00B7m)", type: "number", value: ccMomentY, onChange: (e) => setCcMomentY(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Corte X (kN)", type: "number", value: ccShearX, onChange: (e) => setCcShearX(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Corte Y (kN)", type: "number", value: ccShearY, onChange: (e) => setCcShearY(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Ancho (cm)", type: "number", value: ccWidth, onChange: (e) => setCcWidth(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Profundidad (cm)", type: "number", value: ccDepth, onChange: (e) => setCcDepth(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "Altura (m)", type: "number", value: ccLength, onChange: (e) => setCcLength(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "f'c (MPa)", type: "number", value: ccFc, onChange: (e) => setCcFc(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(TextField, { label: "fy (MPa)", type: "number", value: ccFy, onChange: (e) => setCcFy(e.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(Button, { variant: "contained", onClick: () => {
                                            if (!projectId || !user?.id) {
                                                return;
                                            }
                                            concreteColumnMutation.mutate({
                                                projectId,
                                                userId: user.id,
                                                axialLoad: Number(ccAxialLoad),
                                                momentX: Number(ccMomentX),
                                                momentY: Number(ccMomentY),
                                                shearX: Number(ccShearX),
                                                shearY: Number(ccShearY),
                                                width: Number(ccWidth),
                                                depth: Number(ccDepth),
                                                length: Number(ccLength),
                                                fc: Number(ccFc),
                                                fy: Number(ccFy),
                                            });
                                        }, disabled: concreteColumnMutation.isPending ||
                                            !projectId ||
                                            !user?.id, children: "Dise\u00C3\u00B1ar Pilar" }) })] }), concreteColumnMutation.isError && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: getErrorMessage(concreteColumnMutation.error) || "Error al calcular el pilar" })), concreteColumnResult && (_jsxs(Box, { sx: { mt: 3 }, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Resultados del Dise\u00C3\u00B1o" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Capacidad Axial" }), _jsxs(Typography, { variant: "body1", children: [concreteColumnResult.axialCapacity?.toFixed(2) ?? 'N/A', " kN"] })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Ratio de Utilizaci\u00C3\u00B3n" }), _jsxs(Typography, { variant: "body1", color: (concreteColumnResult.axialCapacityRatio ?? 0) > 1 ? "error" : "success.main", children: [((concreteColumnResult.axialCapacityRatio ?? 0) * 100).toFixed(1), "%"] })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Refuerzo Longitudinal" }), _jsxs(Typography, { variant: "body1", children: [concreteColumnResult.longitudinalSteel?.numBars ?? 'N/A', " \u00CF\u2020", concreteColumnResult.longitudinalSteel?.barDiameter ?? 'N/A', " (", concreteColumnResult.longitudinalSteel?.totalArea?.toFixed(0) ?? 'N/A', " mm\u00C2\u00B2)"] })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Estribos" }), _jsxs(Typography, { variant: "body1", children: ["\u00CF\u2020", concreteColumnResult.transverseSteel?.diameter ?? 'N/A', " @ ", concreteColumnResult.transverseSteel?.spacing ?? 'N/A', " mm"] })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Esbeltez" }), _jsxs(Typography, { variant: "body1", children: [concreteColumnResult.slendernessRatio?.toFixed(2) ?? 'N/A', " ", concreteColumnResult.isSlender && "(Esbelto)"] })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Factor de Magnificaci\u00C3\u00B3n" }), _jsx(Typography, { variant: "body1", children: concreteColumnResult.magnificationFactor?.toFixed(3) ?? 'N/A' })] })] })] }))] }) }), _jsxs(Dialog, { open: saveDialogOpen, onClose: () => setSaveDialogOpen(false), children: [_jsx(DialogTitle, { children: "Guardar base de c\u00C3\u00A1lculo" }), _jsx(DialogContent, { children: _jsx(TextField, { autoFocus: true, margin: "dense", label: "Nombre", fullWidth: true, value: saveName, onChange: (e) => setSaveName(e.target.value), placeholder: "Ej: Base s\u00C3\u00ADsmica edificio X", helperText: `Se guardarÃ¡ en el proyecto: ${projects.find(p => p.id === projectId)?.name || "No seleccionado"}` }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setSaveDialogOpen(false), children: "Cancelar" }), _jsx(Button, { onClick: handleSaveDesignBase, variant: "contained", children: "Guardar" })] })] }), _jsxs(Dialog, { open: loadDialogOpen, onClose: () => setLoadDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Cargar base de c\u00C3\u00A1lculo" }), _jsx(DialogContent, { children: savedBases.length === 0 ? (_jsx(Typography, { color: "text.secondary", sx: { py: 2 }, children: "No hay bases guardadas para este proyecto" })) : (_jsx(List, { children: savedBases.map((base) => (_jsx(ListItem, { disablePadding: true, children: _jsx(ListItemButton, { onClick: () => handleLoadDesignBase(base.id), children: _jsx(ListItemText, { primary: base.name, secondary: new Date(base.createdAt).toLocaleString() }) }) }, base.id))) })) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setLoadDialogOpen(false), children: "Cerrar" }) })] }), _jsxs(Dialog, { open: generateDocDialogOpen, onClose: () => setGenerateDocDialogOpen(false), children: [_jsx(DialogTitle, { children: "Generar documento Word" }), _jsx(DialogContent, { children: _jsx(TextField, { autoFocus: true, margin: "dense", label: "Nombre del proyecto", fullWidth: true, value: docProjectName, onChange: (e) => setDocProjectName(e.target.value), placeholder: "Ej: Edificio Comercial Centro", helperText: "Este nombre aparecer\u00C3\u00A1 en el documento generado" }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setGenerateDocDialogOpen(false), children: "Cancelar" }), _jsx(Button, { onClick: handleGenerateDocument, variant: "contained", color: "success", children: "Generar" })] })] }), _jsxs(Dialog, { open: historyDialogOpen, onClose: () => setHistoryDialogOpen(false), maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Historial de documentos generados" }), _jsx(DialogContent, { children: runHistory.length === 0 ? (_jsx(Typography, { color: "text.secondary", sx: { py: 2 }, children: "No hay documentos generados para este proyecto" })) : (_jsx(List, { children: runHistory.map((run) => (_jsx(ListItem, { secondaryAction: _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(IconButton, { onClick: () => handlePreviewDocument(run.id), title: "Ver preview", children: _jsx(VisibilityIcon, {}) }), _jsx(IconButton, { onClick: () => handleDownloadDocument(run.id), title: "Descargar", children: _jsx(DownloadIcon, {}) })] }), children: _jsx(ListItemText, { primary: run.name, secondary: new Date(run.createdAt).toLocaleString() }) }, run.id))) })) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setHistoryDialogOpen(false), children: "Cerrar" }) })] }), _jsxs(Dialog, { open: previewDialogOpen, onClose: () => setPreviewDialogOpen(false), maxWidth: "lg", fullWidth: true, children: [_jsxs(DialogTitle, { children: ["Preview: ", previewData?.name, _jsx(IconButton, { onClick: () => handleDownloadDocument(previewData?.id), sx: { position: "absolute", right: 60, top: 8 }, title: "Descargar", children: _jsx(DownloadIcon, {}) })] }), _jsx(DialogContent, { children: previewData && (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Informaci\u00C3\u00B3n del Documento" }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Nombre:" }), " ", previewData.name] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Fecha de creaci\u00C3\u00B3n:" }), " ", new Date(previewData.createdAt).toLocaleString()] })] }) }), previewData.data.buildingDescription && (_jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Descripci\u00C3\u00B3n del Edificio" }), previewData.data.buildingDescription.text && (_jsxs(Typography, { variant: "body2", paragraph: true, children: [_jsx("strong", { children: "Descripci\u00C3\u00B3n:" }), " ", previewData.data.buildingDescription.text] })), previewData.data.buildingDescription.location && (_jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Ubicaci\u00C3\u00B3n:" }), " ", previewData.data.buildingDescription.location] })), previewData.data.buildingDescription.area && (_jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "\u00C3\u0081rea total:" }), " ", previewData.data.buildingDescription.area, " m\u00C2\u00B2"] })), previewData.data.buildingDescription.height && (_jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Altura:" }), " ", previewData.data.buildingDescription.height, " m"] }))] }) })), previewData.data.liveLoad && (_jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Cargas Vivas" }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Tipo de edificio:" }), " ", previewData.data.liveLoad.buildingType] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Uso:" }), " ", previewData.data.liveLoad.usage] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Carga uniforme:" }), " ", previewData.data.liveLoad.uniformLoadRaw] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Carga concentrada:" }), " ", previewData.data.liveLoad.concentratedLoadRaw] })] }) })), previewData.data.wind && (_jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Presi\u00C3\u00B3n de Viento" }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Entorno:" }), " ", previewData.data.wind.environment] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Altura:" }), " ", previewData.data.wind.height, " m"] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Presi\u00C3\u00B3n:" }), " ", previewData.data.wind.q?.toFixed(2), " kgf/m\u00C2\u00B2"] })] }) })), previewData.data.seismic && (_jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "An\u00C3\u00A1lisis S\u00C3\u00ADsmico" }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Categor\u00C3\u00ADa:" }), " ", previewData.data.seismic.params.category] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Zona:" }), " ", previewData.data.seismic.params.zone] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Suelo:" }), " ", previewData.data.seismic.params.soil] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Qbas,x:" }), " ", previewData.data.seismic.result.Qbasx?.toFixed(2), " kN"] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Qbas,y:" }), " ", previewData.data.seismic.result.Qbasy?.toFixed(2), " kN"] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Q0,min:" }), " ", previewData.data.seismic.result.Q0Min?.toFixed(2), " kN"] }), _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Q0,max:" }), " ", previewData.data.seismic.result.Q0Max?.toFixed(2), " kN"] })] }) })), previewData.data.structural && (_jsx(Card, { variant: "outlined", children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "C\u00C3\u00A1lculos Estructurales" }), previewData.data.structural.concreteColumn && (_jsxs(Box, { sx: { mb: 2 }, children: [_jsx(Typography, { variant: "subtitle1", gutterBottom: true, children: "Pilar de Hormig\u00C3\u00B3n Armado (ACI318)" }), _jsxs(Grid, { container: true, spacing: 1, children: [_jsx(Grid, { item: true, xs: 6, children: _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Capacidad Axial:" }), " ", previewData.data.structural.concreteColumn.axialCapacity?.toFixed(2), " kN"] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Ratio de Utilizaci\u00C3\u00B3n:" }), " ", (previewData.data.structural.concreteColumn.axialCapacityRatio * 100)?.toFixed(1), "%"] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Refuerzo Longitudinal:" }), " ", previewData.data.structural.concreteColumn.longitudinalSteel?.numBars, " \u00CF\u2020", previewData.data.structural.concreteColumn.longitudinalSteel?.barDiameter] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Estribos:" }), " \u00CF\u2020", previewData.data.structural.concreteColumn.transverseSteel?.diameter, " @ ", previewData.data.structural.concreteColumn.transverseSteel?.spacing, " mm"] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "Esbeltez:" }), " ", previewData.data.structural.concreteColumn.slendernessRatio?.toFixed(2)] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "\u00C2\u00BFEs Esbelto?:" }), " ", previewData.data.structural.concreteColumn.isSlender ? "SÃ­" : "No"] }) })] })] }))] }) }))] })) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setPreviewDialogOpen(false), children: "Cerrar" }), _jsx(Button, { variant: "contained", startIcon: _jsx(DownloadIcon, {}), onClick: () => handleDownloadDocument(previewData?.id), children: "Descargar Documento" })] })] }), _jsx(Snackbar, { open: autoSaveSnackbar, autoHideDuration: 3000, onClose: () => setAutoSaveSnackbar(false), message: "Guardado autom\u00C3\u00A1ticamente en el historial", anchorOrigin: { vertical: 'bottom', horizontal: 'right' } })] }));
};
export default ProjectDesignBasesPage;
