import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography, } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import CalculateIcon from "@mui/icons-material/Calculate";
import HistoryIcon from "@mui/icons-material/History";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useParams } from "react-router-dom";
import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";
import { useCalculationRuns } from "../hooks/useCalculationRuns";
import { useConcreteColumn, useConcreteBeam, useSteelColumn, useSteelBeam, useWoodColumn, useWoodBeam, useFooting, } from "../hooks/useStructuralCalcs";
const calculationTypes = [
    {
        value: "rc_beam",
        label: "Viga de Hormigón",
        description: "Vigas de hormigón armado: cálculo de momento flector y acero mínimo requerido.",
        implemented: true,
    },
    {
        value: "rc_column",
        label: "Pilar de Hormigón (ACI318)",
        description: "Pilares de hormigón armado para carga axial y flexocompresión según ACI318.",
        implemented: true,
    },
    {
        value: "rc_slab",
        label: "Losa de Hormigón",
        description: "Losas de hormigón armado: diseño de secciones y cuantía de refuerzo.",
        implemented: false,
    },
    {
        value: "steel_column",
        label: "Pilar de Acero (AISC360)",
        description: "Pilares de acero estructural para cargas de compresión y flexión según AISC360.",
        implemented: true,
    },
    {
        value: "steel_beam",
        label: "Viga de Acero (AISC360)",
        description: "Vigas de acero estructural según perfiles estándar y AISC360.",
        implemented: true,
    },
    {
        value: "wood_column",
        label: "Pilar de Madera (NCh1198)",
        description: "Pilares de madera según normativa chilena NCh1198.",
        implemented: true,
    },
    {
        value: "wood_beam",
        label: "Viga de Madera (NCh1198)",
        description: "Vigas de madera dimensionada y laminada según NCh1198.",
        implemented: true,
    },
    {
        value: "footing",
        label: "Zapatas (ACI318)",
        description: "Zapatas aisladas y corridas de hormigón armado según ACI318.",
        implemented: true,
    },
];
const defaultBeamForm = {
    positiveMoment: 150,
    negativeMoment: 180,
    maxShear: 80,
    width: 30,
    height: 50,
    span: 6.0,
    fc: 25,
    fy: 420,
};
const defaultColumnForm = {
    axialLoad: 500,
    momentX: 50,
    momentY: 40,
    shearX: 30,
    shearY: 25,
    width: 40,
    depth: 40,
    length: 3.0,
    fc: 25,
    fy: 420,
};
const defaultSteelColumnForm = {
    axialLoad: 800,
    momentX: 100,
    momentY: 80,
    length: 4.0,
    fy: 345,
    sectionType: "W",
    profileName: "W310x97",
};
const defaultSteelBeamForm = {
    moment: 200,
    shear: 150,
    span: 6.0,
    fy: 345,
    sectionType: "W",
    profileName: "W310x97",
    lateralSupport: "full",
};
const defaultWoodColumnForm = {
    axialLoad: 150,
    width: 15,
    depth: 15,
    length: 3.0,
    woodType: "Pino radiata C24",
};
const defaultWoodBeamForm = {
    moment: 50,
    shear: 30,
    span: 4.0,
    width: 10,
    height: 20,
    woodType: "Pino radiata C24",
    lateralSupport: "full",
};
const defaultFootingForm = {
    axialLoad: 600,
    moment: 50,
    shear: 40,
    columnWidth: 40,
    columnDepth: 40,
    soilBearingCapacity: 200,
    fc: 25,
    fy: 420,
    footingType: "isolated",
    length: 2.0,
    width: 2.0,
    footingDepth: 50,
};
const ProjectCalculationsPage = () => {
    const { data: projects } = useProjects();
    const { projectId: routeProjectId } = useParams();
    const sessionProjectId = useSession((state) => state.projectId);
    const setProjectInSession = useSession((state) => state.setProject);
    const user = useSession((state) => state.user);
    const [selectedProjectId, setSelectedProjectId] = useState(sessionProjectId);
    const [selectedType, setSelectedType] = useState("rc_beam");
    const [beamForm, setBeamForm] = useState(defaultBeamForm);
    const [columnForm, setColumnForm] = useState(defaultColumnForm);
    const [steelColumnForm, setSteelColumnForm] = useState(defaultSteelColumnForm);
    const [steelBeamForm, setSteelBeamForm] = useState(defaultSteelBeamForm);
    const [woodColumnForm, setWoodColumnForm] = useState(defaultWoodColumnForm);
    const [woodBeamForm, setWoodBeamForm] = useState(defaultWoodBeamForm);
    const [footingForm, setFootingForm] = useState(defaultFootingForm);
    const [result, setResult] = useState(null);
    const [runId, setRunId] = useState(null);
    const [selectionModel, setSelectionModel] = useState([]);
    const queryClient = useQueryClient();
    const projectOptions = useMemo(() => projects ?? [], [projects]);
    const typeMap = useMemo(() => Object.fromEntries(calculationTypes.map((item) => [item.value, item])), []);
    const currentType = typeMap[selectedType] ?? calculationTypes[0];
    const { data: runs = [], isFetching: runsLoading } = useCalculationRuns(selectedProjectId);
    useEffect(() => {
        if (routeProjectId) {
            setSelectedProjectId(routeProjectId);
            setProjectInSession(routeProjectId);
        }
    }, [routeProjectId, setProjectInSession]);
    useEffect(() => {
        if (!selectedProjectId && projectOptions.length) {
            const initial = sessionProjectId ?? projectOptions[0].id;
            setSelectedProjectId(initial);
            setProjectInSession(initial);
        }
    }, [projectOptions, selectedProjectId, sessionProjectId, setProjectInSession]);
    useEffect(() => {
        setResult(null);
        setRunId(null);
        setSelectionModel([]);
    }, [selectedProjectId]);
    const concreteColumnMutation = useConcreteColumn();
    const concreteBeamMutation = useConcreteBeam();
    const steelColumnMutation = useSteelColumn();
    const steelBeamMutation = useSteelBeam();
    const woodColumnMutation = useWoodColumn();
    const woodBeamMutation = useWoodBeam();
    const footingMutation = useFooting();
    useEffect(() => {
        if (concreteColumnMutation.isSuccess && concreteColumnMutation.data) {
            setResult(concreteColumnMutation.data.results);
            setRunId(concreteColumnMutation.data.run_id);
            setSelectionModel([concreteColumnMutation.data.run_id]);
            queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId] });
        }
    }, [concreteColumnMutation.isSuccess, concreteColumnMutation.data, selectedProjectId, queryClient]);
    useEffect(() => {
        if (concreteBeamMutation.isSuccess && concreteBeamMutation.data) {
            setResult(concreteBeamMutation.data.results);
            setRunId(concreteBeamMutation.data.run_id);
            setSelectionModel([concreteBeamMutation.data.run_id]);
            queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId] });
        }
    }, [concreteBeamMutation.isSuccess, concreteBeamMutation.data, selectedProjectId, queryClient]);
    useEffect(() => {
        if (steelColumnMutation.isSuccess && steelColumnMutation.data) {
            setResult(steelColumnMutation.data.results);
            setRunId(steelColumnMutation.data.run_id);
            setSelectionModel([steelColumnMutation.data.run_id]);
            queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId] });
        }
    }, [steelColumnMutation.isSuccess, steelColumnMutation.data, selectedProjectId, queryClient]);
    useEffect(() => {
        if (steelBeamMutation.isSuccess && steelBeamMutation.data) {
            setResult(steelBeamMutation.data.results);
            setRunId(steelBeamMutation.data.run_id);
            setSelectionModel([steelBeamMutation.data.run_id]);
            queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId] });
        }
    }, [steelBeamMutation.isSuccess, steelBeamMutation.data, selectedProjectId, queryClient]);
    useEffect(() => {
        if (woodColumnMutation.isSuccess && woodColumnMutation.data) {
            setResult(woodColumnMutation.data.results);
            setRunId(woodColumnMutation.data.run_id);
            setSelectionModel([woodColumnMutation.data.run_id]);
            queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId] });
        }
    }, [woodColumnMutation.isSuccess, woodColumnMutation.data, selectedProjectId, queryClient]);
    useEffect(() => {
        if (woodBeamMutation.isSuccess && woodBeamMutation.data) {
            setResult(woodBeamMutation.data.results);
            setRunId(woodBeamMutation.data.run_id);
            setSelectionModel([woodBeamMutation.data.run_id]);
            queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId] });
        }
    }, [woodBeamMutation.isSuccess, woodBeamMutation.data, selectedProjectId, queryClient]);
    useEffect(() => {
        if (footingMutation.isSuccess && footingMutation.data) {
            setResult(footingMutation.data.results);
            setRunId(footingMutation.data.run_id);
            setSelectionModel([footingMutation.data.run_id]);
            queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId] });
        }
    }, [footingMutation.isSuccess, footingMutation.data, selectedProjectId, queryClient]);
    const handleSubmitBeam = (event) => {
        event.preventDefault();
        if (!selectedProjectId) {
            return;
        }
        if (!user?.id) {
            return;
        }
        setResult(null);
        setRunId(null);
        concreteBeamMutation.mutate({
            ...beamForm,
            projectId: selectedProjectId,
            userId: user.id,
        });
    };
    const handleSubmitColumn = (event) => {
        event.preventDefault();
        if (!selectedProjectId) {
            return;
        }
        if (!user?.id) {
            return;
        }
        setResult(null);
        setRunId(null);
        concreteColumnMutation.mutate({
            ...columnForm,
            projectId: selectedProjectId,
            userId: user.id,
        });
    };
    const handleSubmitSteelColumn = (event) => {
        event.preventDefault();
        if (!selectedProjectId || !user?.id)
            return;
        setResult(null);
        setRunId(null);
        steelColumnMutation.mutate({
            ...steelColumnForm,
            projectId: selectedProjectId,
            userId: user.id,
        });
    };
    const handleSubmitSteelBeam = (event) => {
        event.preventDefault();
        if (!selectedProjectId || !user?.id)
            return;
        setResult(null);
        setRunId(null);
        steelBeamMutation.mutate({
            ...steelBeamForm,
            projectId: selectedProjectId,
            userId: user.id,
        });
    };
    const handleSubmitWoodColumn = (event) => {
        event.preventDefault();
        if (!selectedProjectId || !user?.id)
            return;
        setResult(null);
        setRunId(null);
        woodColumnMutation.mutate({
            ...woodColumnForm,
            projectId: selectedProjectId,
            userId: user.id,
        });
    };
    const handleSubmitWoodBeam = (event) => {
        event.preventDefault();
        if (!selectedProjectId || !user?.id)
            return;
        setResult(null);
        setRunId(null);
        woodBeamMutation.mutate({
            ...woodBeamForm,
            projectId: selectedProjectId,
            userId: user.id,
        });
    };
    const handleSubmitFooting = (event) => {
        event.preventDefault();
        if (!selectedProjectId || !user?.id)
            return;
        setResult(null);
        setRunId(null);
        footingMutation.mutate({
            ...footingForm,
            footingType: footingForm.footingType,
            projectId: selectedProjectId,
            userId: user.id,
        });
    };
    const handleDownloadReport = () => {
        if (!runId)
            return;
        const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";
        const url = `${baseURL.replace(/\/$/, "")}/calculations/rc-beam/${runId}/report`;
        window.open(url, "_blank", "noopener");
    };
    const loadRunIntoForm = useCallback((run) => {
        setSelectedType(run.element_type);
        setRunId(run.id);
        setSelectionModel([run.id]);
        const inputs = run.input_json;
        if (run.element_type === "rc_beam") {
            setBeamForm({
                positiveMoment: Number(inputs.positiveMoment ?? defaultBeamForm.positiveMoment),
                negativeMoment: Number(inputs.negativeMoment ?? defaultBeamForm.negativeMoment),
                maxShear: Number(inputs.maxShear ?? defaultBeamForm.maxShear),
                width: Number(inputs.width ?? defaultBeamForm.width),
                height: Number(inputs.height ?? defaultBeamForm.height),
                span: Number(inputs.span ?? defaultBeamForm.span),
                fc: Number(inputs.fc ?? defaultBeamForm.fc),
                fy: Number(inputs.fy ?? defaultBeamForm.fy),
            });
            setResult(run.result_json);
        }
        else if (run.element_type === "rc_column") {
            setColumnForm({
                axialLoad: Number(inputs.axialLoad ?? defaultColumnForm.axialLoad),
                momentX: Number(inputs.momentX ?? defaultColumnForm.momentX),
                momentY: Number(inputs.momentY ?? defaultColumnForm.momentY),
                shearX: Number(inputs.shearX ?? defaultColumnForm.shearX),
                shearY: Number(inputs.shearY ?? defaultColumnForm.shearY),
                width: Number(inputs.width ?? defaultColumnForm.width),
                depth: Number(inputs.depth ?? defaultColumnForm.depth),
                length: Number(inputs.length ?? defaultColumnForm.length),
                fc: Number(inputs.fc ?? defaultColumnForm.fc),
                fy: Number(inputs.fy ?? defaultColumnForm.fy),
            });
            setResult(run.result_json);
        }
        else if (run.element_type === "steel_column") {
            setSteelColumnForm({
                axialLoad: Number(inputs.axialLoad ?? defaultSteelColumnForm.axialLoad),
                momentX: Number(inputs.momentX ?? defaultSteelColumnForm.momentX),
                momentY: Number(inputs.momentY ?? defaultSteelColumnForm.momentY),
                length: Number(inputs.length ?? defaultSteelColumnForm.length),
                fy: Number(inputs.fy ?? defaultSteelColumnForm.fy),
                sectionType: inputs.sectionType ?? defaultSteelColumnForm.sectionType,
                profileName: inputs.profileName ?? defaultSteelColumnForm.profileName,
            });
            setResult(run.result_json);
        }
        else if (run.element_type === "steel_beam") {
            setSteelBeamForm({
                moment: Number(inputs.moment ?? defaultSteelBeamForm.moment),
                shear: Number(inputs.shear ?? defaultSteelBeamForm.shear),
                span: Number(inputs.span ?? defaultSteelBeamForm.span),
                fy: Number(inputs.fy ?? defaultSteelBeamForm.fy),
                sectionType: inputs.sectionType ?? defaultSteelBeamForm.sectionType,
                profileName: inputs.profileName ?? defaultSteelBeamForm.profileName,
                lateralSupport: inputs.lateralSupport ?? defaultSteelBeamForm.lateralSupport,
            });
            setResult(run.result_json);
        }
        else if (run.element_type === "wood_column") {
            setWoodColumnForm({
                axialLoad: Number(inputs.axialLoad ?? defaultWoodColumnForm.axialLoad),
                width: Number(inputs.width ?? defaultWoodColumnForm.width),
                depth: Number(inputs.depth ?? defaultWoodColumnForm.depth),
                length: Number(inputs.length ?? defaultWoodColumnForm.length),
                woodType: inputs.woodType ?? defaultWoodColumnForm.woodType,
            });
            setResult(run.result_json);
        }
        else if (run.element_type === "wood_beam") {
            setWoodBeamForm({
                moment: Number(inputs.moment ?? defaultWoodBeamForm.moment),
                shear: Number(inputs.shear ?? defaultWoodBeamForm.shear),
                span: Number(inputs.span ?? defaultWoodBeamForm.span),
                width: Number(inputs.width ?? defaultWoodBeamForm.width),
                height: Number(inputs.height ?? defaultWoodBeamForm.height),
                woodType: inputs.woodType ?? defaultWoodBeamForm.woodType,
                lateralSupport: inputs.lateralSupport ?? defaultWoodBeamForm.lateralSupport,
            });
            setResult(run.result_json);
        }
        else if (run.element_type === "footing") {
            setFootingForm({
                axialLoad: Number(inputs.axialLoad ?? defaultFootingForm.axialLoad),
                moment: Number(inputs.moment ?? defaultFootingForm.moment),
                shear: Number(inputs.shear ?? defaultFootingForm.shear),
                columnWidth: Number(inputs.columnWidth ?? defaultFootingForm.columnWidth),
                columnDepth: Number(inputs.columnDepth ?? defaultFootingForm.columnDepth),
                soilBearingCapacity: Number(inputs.soilBearingCapacity ?? defaultFootingForm.soilBearingCapacity),
                fc: Number(inputs.fc ?? defaultFootingForm.fc),
                fy: Number(inputs.fy ?? defaultFootingForm.fy),
                footingType: inputs.footingType ?? defaultFootingForm.footingType,
                length: Number(inputs.length ?? defaultFootingForm.length),
                width: Number(inputs.width ?? defaultFootingForm.width),
                footingDepth: Number(inputs.footingDepth ?? defaultFootingForm.footingDepth),
            });
            setResult(run.result_json);
        }
        else {
            setResult(null);
        }
    }, []);
    const handleRowClick = useCallback((runId) => {
        const run = runs.find((item) => item.id === runId);
        if (run) {
            loadRunIntoForm(run);
        }
    }, [loadRunIntoForm, runs]);
    const calculationRows = useMemo(() => (runs ?? []).map((run) => {
        const type = typeMap[run.element_type];
        let summary = "Disponible próximamente";
        // Generar resumen según tipo de cálculo
        const result = run.result_json;
        const inputs = run.input_json;
        if (run.element_type === "rc_column") {
            const longSteel = result?.longitudinalSteel;
            const transSteel = result?.transverseSteel;
            if (longSteel && transSteel) {
                summary = `${longSteel.numBars}φ${longSteel.barDiameter} (${Math.round(longSteel.totalArea)}mm²), Est φ${transSteel.diameter}@${transSteel.spacing}mm`;
            }
        }
        else if (run.element_type === "rc_beam") {
            const posReinf = result?.positiveReinforcemenet || result?.positiveReinforcement;
            const negReinf = result?.negativeReinforcement;
            const transSteel = result?.transverseSteel;
            if (posReinf && negReinf && transSteel) {
                summary = `Sup: ${negReinf.numBars}φ${negReinf.barDiameter}, Inf: ${posReinf.numBars}φ${posReinf.barDiameter}, Est φ${transSteel.diameter}@${transSteel.spacing}mm`;
            }
        }
        else if (run.element_type === "steel_column") {
            summary = `Perfil: ${inputs?.profileName || "Personalizado"} | Pn = ${result?.pn?.toFixed(1) || "—"} kN | Ratio: ${((result?.interactionRatio || 0) * 100).toFixed(1)}%`;
        }
        else if (run.element_type === "steel_beam") {
            summary = `Perfil: ${inputs?.profileName || "Personalizado"} | Mn = ${result?.mn?.toFixed(1) || "—"} kN·m | Ratio: ${((result?.flexureRatio || 0) * 100).toFixed(1)}%`;
        }
        else if (run.element_type === "wood_column") {
            summary = `Sección: ${inputs?.width || "—"}x${inputs?.depth || "—"} cm | Pn = ${result?.pn?.toFixed(1) || "—"} kN | Ratio: ${((result?.utilizationRatio || 0) * 100).toFixed(1)}%`;
        }
        else if (run.element_type === "wood_beam") {
            summary = `Sección: ${inputs?.width || "—"}x${inputs?.height || "—"} cm | Mn = ${result?.mn?.toFixed(1) || "—"} kN·m | Ratio: ${((result?.utilizationRatio || 0) * 100).toFixed(1)}%`;
        }
        else if (run.element_type === "footing") {
            summary = `Tipo: ${inputs?.footingType === "isolated" ? "Aislada" : "Corrida"} | Dimensión: ${inputs?.length || "—"}x${inputs?.width || "—"} m | H = ${inputs?.footingDepth || "—"} cm`;
        }
        return {
            id: run.id,
            created_at: run.created_at ? dayjs(run.created_at).format("DD/MM/YYYY HH:mm") : "—",
            element_type: type?.label ?? run.element_type,
            summary,
        };
    }), [runs, typeMap]);
    const columns = useMemo(() => [
        { field: "created_at", headerName: "Fecha", width: 170 },
        { field: "element_type", headerName: "Tipo de cálculo", width: 220 },
        { field: "summary", headerName: "Resumen", flex: 1, minWidth: 280 },
    ], []);
    const effectiveProjectName = projectOptions.find((project) => project.id === selectedProjectId)?.name ?? "Sin proyecto";
    const typeDisabledReason = !currentType.implemented
        ? "Este tipo de cálculo estará disponible en futuras versiones."
        : !selectedProjectId
            ? "Selecciona un proyecto activo para ejecutar cálculos."
            : null;
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Box, { sx: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }, children: [_jsx(Typography, { variant: "h5", children: "C\u00E1lculos estructurales" }), _jsx(TextField, { select: true, label: "Proyecto", size: "small", value: selectedProjectId ?? "", onChange: (event) => {
                            setSelectedProjectId(event.target.value);
                            setProjectInSession(event.target.value);
                        }, sx: { minWidth: 220 }, children: projectOptions.map((project) => (_jsx(MenuItem, { value: project.id, children: project.name }, project.id))) })] }), !selectedProjectId && (_jsx(Alert, { severity: "info", children: "Debes crear un proyecto para poder guardar los c\u00E1lculos realizados." })), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Tipo de c\u00E1lculo" }), _jsx(TextField, { select: true, fullWidth: true, label: "Selecciona un c\u00E1lculo", value: selectedType, onChange: (event) => {
                                            setSelectedType(event.target.value);
                                            setResult(null);
                                            setRunId(null);
                                        }, sx: { mb: 2 }, children: calculationTypes.map((item) => (_jsxs(MenuItem, { value: item.value, children: [item.label, " ", item.implemented ? "" : " (próximamente)"] }, item.value))) }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: currentType.description }), !currentType.implemented && (_jsx(Alert, { severity: "info", icon: _jsx(InfoOutlinedIcon, {}), sx: { mt: 2 }, children: "Estamos preparando este m\u00F3dulo para cubrir casos de dise\u00F1o habituales. Tu retroalimentaci\u00F3n es bienvenida." }))] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 8, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Par\u00E1metros de dise\u00F1o" }), currentType.value === "rc_beam" ? (_jsx("form", { onSubmit: handleSubmitBeam, children: _jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Momentos y cortante" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Momento positivo (kN\u00B7m)", type: "number", value: beamForm.positiveMoment, onChange: (event) => setBeamForm((prev) => ({ ...prev, positiveMoment: Number(event.target.value) || 0 })), required: true, inputProps: { step: 0.1 }, fullWidth: true }), _jsx(TextField, { label: "Momento negativo (kN\u00B7m)", type: "number", value: beamForm.negativeMoment, onChange: (event) => setBeamForm((prev) => ({ ...prev, negativeMoment: Number(event.target.value) || 0 })), required: true, inputProps: { step: 0.1 }, fullWidth: true }), _jsx(TextField, { label: "Cortante m\u00E1ximo (kN)", type: "number", value: beamForm.maxShear, onChange: (event) => setBeamForm((prev) => ({ ...prev, maxShear: Number(event.target.value) || 0 })), required: true, inputProps: { step: 0.1 }, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Geometr\u00EDa" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Ancho (cm)", type: "number", value: beamForm.width, onChange: (event) => setBeamForm((prev) => ({ ...prev, width: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 1 }, fullWidth: true }), _jsx(TextField, { label: "Altura (cm)", type: "number", value: beamForm.height, onChange: (event) => setBeamForm((prev) => ({ ...prev, height: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 1 }, fullWidth: true }), _jsx(TextField, { label: "Luz (m)", type: "number", value: beamForm.span, onChange: (event) => setBeamForm((prev) => ({ ...prev, span: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 0.1 }, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Materiales" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "f'c (MPa)", type: "number", value: beamForm.fc, onChange: (event) => setBeamForm((prev) => ({ ...prev, fc: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 1 }, fullWidth: true }), _jsx(TextField, { label: "fy (MPa)", type: "number", value: beamForm.fy, onChange: (event) => setBeamForm((prev) => ({ ...prev, fy: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 10 }, fullWidth: true })] }), _jsx(Stack, { direction: "row", spacing: 2, justifyContent: "flex-end", children: _jsx(Button, { variant: "contained", type: "submit", startIcon: _jsx(CalculateIcon, {}), disabled: Boolean(typeDisabledReason) || concreteBeamMutation.isPending, children: "Calcular" }) })] }) })) : currentType.value === "rc_column" ? (_jsx("form", { onSubmit: handleSubmitColumn, children: _jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Esfuerzos" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Carga axial (kN)", type: "number", value: columnForm.axialLoad, onChange: (event) => setColumnForm((prev) => ({ ...prev, axialLoad: Number(event.target.value) || 0 })), required: true, inputProps: { step: 0.1 }, fullWidth: true }), _jsx(TextField, { label: "Momento X (kN\u00B7m)", type: "number", value: columnForm.momentX, onChange: (event) => setColumnForm((prev) => ({ ...prev, momentX: Number(event.target.value) || 0 })), required: true, inputProps: { step: 0.1 }, fullWidth: true }), _jsx(TextField, { label: "Momento Y (kN\u00B7m)", type: "number", value: columnForm.momentY, onChange: (event) => setColumnForm((prev) => ({ ...prev, momentY: Number(event.target.value) || 0 })), required: true, inputProps: { step: 0.1 }, fullWidth: true })] }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Cortante X (kN)", type: "number", value: columnForm.shearX, onChange: (event) => setColumnForm((prev) => ({ ...prev, shearX: Number(event.target.value) || 0 })), required: true, inputProps: { step: 0.1 }, fullWidth: true }), _jsx(TextField, { label: "Cortante Y (kN)", type: "number", value: columnForm.shearY, onChange: (event) => setColumnForm((prev) => ({ ...prev, shearY: Number(event.target.value) || 0 })), required: true, inputProps: { step: 0.1 }, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Geometr\u00EDa" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Ancho (cm)", type: "number", value: columnForm.width, onChange: (event) => setColumnForm((prev) => ({ ...prev, width: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 1 }, fullWidth: true }), _jsx(TextField, { label: "Profundidad (cm)", type: "number", value: columnForm.depth, onChange: (event) => setColumnForm((prev) => ({ ...prev, depth: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 1 }, fullWidth: true }), _jsx(TextField, { label: "Altura (m)", type: "number", value: columnForm.length, onChange: (event) => setColumnForm((prev) => ({ ...prev, length: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 0.1 }, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Materiales" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "f'c (MPa)", type: "number", value: columnForm.fc, onChange: (event) => setColumnForm((prev) => ({ ...prev, fc: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 1 }, fullWidth: true }), _jsx(TextField, { label: "fy (MPa)", type: "number", value: columnForm.fy, onChange: (event) => setColumnForm((prev) => ({ ...prev, fy: Number(event.target.value) || 0 })), required: true, inputProps: { min: 0, step: 10 }, fullWidth: true })] }), _jsx(Stack, { direction: "row", spacing: 2, justifyContent: "flex-end", children: _jsx(Button, { variant: "contained", type: "submit", startIcon: _jsx(CalculateIcon, {}), disabled: Boolean(typeDisabledReason) || concreteColumnMutation.isPending, children: "Calcular" }) })] }) })) : currentType.value === "steel_column" ? (_jsx("form", { onSubmit: handleSubmitSteelColumn, children: _jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Esfuerzos" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Carga axial (kN)", type: "number", value: steelColumnForm.axialLoad, onChange: (e) => setSteelColumnForm((prev) => ({ ...prev, axialLoad: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Momento X (kN\u00B7m)", type: "number", value: steelColumnForm.momentX, onChange: (e) => setSteelColumnForm((prev) => ({ ...prev, momentX: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Momento Y (kN\u00B7m)", type: "number", value: steelColumnForm.momentY, onChange: (e) => setSteelColumnForm((prev) => ({ ...prev, momentY: Number(e.target.value) || 0 })), required: true, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Geometr\u00EDa y Perfil" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsxs(TextField, { select: true, label: "Tipo de perfil", value: steelColumnForm.sectionType, onChange: (e) => setSteelColumnForm((prev) => ({ ...prev, sectionType: e.target.value })), required: true, fullWidth: true, children: [_jsx(MenuItem, { value: "W", children: "W - Perfil I" }), _jsx(MenuItem, { value: "HSS", children: "HSS - Perfil hueco" }), _jsx(MenuItem, { value: "Custom", children: "Personalizado" })] }), _jsx(TextField, { label: "Nombre del perfil", value: steelColumnForm.profileName, onChange: (e) => setSteelColumnForm((prev) => ({ ...prev, profileName: e.target.value })), helperText: "Ej: W310x97, HSS200x200x8", fullWidth: true }), _jsx(TextField, { label: "Altura (m)", type: "number", value: steelColumnForm.length, onChange: (e) => setSteelColumnForm((prev) => ({ ...prev, length: Number(e.target.value) || 0 })), required: true, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Material" }), _jsx(TextField, { label: "fy (MPa)", type: "number", value: steelColumnForm.fy, onChange: (e) => setSteelColumnForm((prev) => ({ ...prev, fy: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(Stack, { direction: "row", spacing: 2, justifyContent: "flex-end", children: _jsx(Button, { variant: "contained", type: "submit", startIcon: _jsx(CalculateIcon, {}), disabled: Boolean(typeDisabledReason) || steelColumnMutation.isPending, children: "Calcular" }) })] }) })) : currentType.value === "steel_beam" ? (_jsx("form", { onSubmit: handleSubmitSteelBeam, children: _jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Esfuerzos" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Momento (kN\u00B7m)", type: "number", value: steelBeamForm.moment, onChange: (e) => setSteelBeamForm((prev) => ({ ...prev, moment: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Cortante (kN)", type: "number", value: steelBeamForm.shear, onChange: (e) => setSteelBeamForm((prev) => ({ ...prev, shear: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Luz (m)", type: "number", value: steelBeamForm.span, onChange: (e) => setSteelBeamForm((prev) => ({ ...prev, span: Number(e.target.value) || 0 })), required: true, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Perfil" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsxs(TextField, { select: true, label: "Tipo de perfil", value: steelBeamForm.sectionType, onChange: (e) => setSteelBeamForm((prev) => ({ ...prev, sectionType: e.target.value })), required: true, fullWidth: true, children: [_jsx(MenuItem, { value: "W", children: "W - Perfil I" }), _jsx(MenuItem, { value: "Custom", children: "Personalizado" })] }), _jsx(TextField, { label: "Nombre del perfil", value: steelBeamForm.profileName, onChange: (e) => setSteelBeamForm((prev) => ({ ...prev, profileName: e.target.value })), helperText: "Ej: W310x97, W410x149", fullWidth: true }), _jsxs(TextField, { select: true, label: "Soporte lateral", value: steelBeamForm.lateralSupport, onChange: (e) => setSteelBeamForm((prev) => ({ ...prev, lateralSupport: e.target.value })), required: true, fullWidth: true, children: [_jsx(MenuItem, { value: "full", children: "Completo" }), _jsx(MenuItem, { value: "partial", children: "Parcial" }), _jsx(MenuItem, { value: "none", children: "Sin soporte" })] })] }), _jsx(TextField, { label: "fy (MPa)", type: "number", value: steelBeamForm.fy, onChange: (e) => setSteelBeamForm((prev) => ({ ...prev, fy: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(Stack, { direction: "row", spacing: 2, justifyContent: "flex-end", children: _jsx(Button, { variant: "contained", type: "submit", startIcon: _jsx(CalculateIcon, {}), disabled: Boolean(typeDisabledReason) || steelBeamMutation.isPending, children: "Calcular" }) })] }) })) : currentType.value === "wood_column" ? (_jsx("form", { onSubmit: handleSubmitWoodColumn, children: _jsxs(Stack, { spacing: 2, children: [_jsx(TextField, { label: "Carga axial (kN)", type: "number", value: woodColumnForm.axialLoad, onChange: (e) => setWoodColumnForm((prev) => ({ ...prev, axialLoad: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Geometr\u00EDa" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Ancho (cm)", type: "number", value: woodColumnForm.width, onChange: (e) => setWoodColumnForm((prev) => ({ ...prev, width: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Profundidad (cm)", type: "number", value: woodColumnForm.depth, onChange: (e) => setWoodColumnForm((prev) => ({ ...prev, depth: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Altura (m)", type: "number", value: woodColumnForm.length, onChange: (e) => setWoodColumnForm((prev) => ({ ...prev, length: Number(e.target.value) || 0 })), required: true, fullWidth: true })] }), _jsxs(TextField, { select: true, label: "Tipo de madera", value: woodColumnForm.woodType, onChange: (e) => setWoodColumnForm((prev) => ({ ...prev, woodType: e.target.value })), required: true, fullWidth: true, children: [_jsx(MenuItem, { value: "Pino radiata", children: "Pino radiata" }), _jsx(MenuItem, { value: "Pino radiata C24", children: "Pino radiata C24" }), _jsx(MenuItem, { value: "Pino radiata C16", children: "Pino radiata C16" }), _jsx(MenuItem, { value: "Coig\u00FCe", children: "Coig\u00FCe" }), _jsx(MenuItem, { value: "Roble", children: "Roble" }), _jsx(MenuItem, { value: "Lenga", children: "Lenga" }), _jsx(MenuItem, { value: "Alerce", children: "Alerce" })] }), _jsx(Stack, { direction: "row", spacing: 2, justifyContent: "flex-end", children: _jsx(Button, { variant: "contained", type: "submit", startIcon: _jsx(CalculateIcon, {}), disabled: Boolean(typeDisabledReason) || woodColumnMutation.isPending, children: "Calcular" }) })] }) })) : currentType.value === "wood_beam" ? (_jsx("form", { onSubmit: handleSubmitWoodBeam, children: _jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Esfuerzos" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Momento (kN\u00B7m)", type: "number", value: woodBeamForm.moment, onChange: (e) => setWoodBeamForm((prev) => ({ ...prev, moment: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Cortante (kN)", type: "number", value: woodBeamForm.shear, onChange: (e) => setWoodBeamForm((prev) => ({ ...prev, shear: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Luz (m)", type: "number", value: woodBeamForm.span, onChange: (e) => setWoodBeamForm((prev) => ({ ...prev, span: Number(e.target.value) || 0 })), required: true, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Secci\u00F3n" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Ancho (cm)", type: "number", value: woodBeamForm.width, onChange: (e) => setWoodBeamForm((prev) => ({ ...prev, width: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Altura (cm)", type: "number", value: woodBeamForm.height, onChange: (e) => setWoodBeamForm((prev) => ({ ...prev, height: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsxs(TextField, { select: true, label: "Soporte lateral", value: woodBeamForm.lateralSupport, onChange: (e) => setWoodBeamForm((prev) => ({ ...prev, lateralSupport: e.target.value })), required: true, fullWidth: true, children: [_jsx(MenuItem, { value: "full", children: "Completo" }), _jsx(MenuItem, { value: "partial", children: "Parcial" }), _jsx(MenuItem, { value: "none", children: "Sin soporte" })] })] }), _jsxs(TextField, { select: true, label: "Tipo de madera", value: woodBeamForm.woodType, onChange: (e) => setWoodBeamForm((prev) => ({ ...prev, woodType: e.target.value })), required: true, fullWidth: true, children: [_jsx(MenuItem, { value: "Pino radiata", children: "Pino radiata" }), _jsx(MenuItem, { value: "Pino radiata C24", children: "Pino radiata C24" }), _jsx(MenuItem, { value: "Pino radiata C16", children: "Pino radiata C16" }), _jsx(MenuItem, { value: "Coig\u00FCe", children: "Coig\u00FCe" }), _jsx(MenuItem, { value: "Roble", children: "Roble" }), _jsx(MenuItem, { value: "Lenga", children: "Lenga" }), _jsx(MenuItem, { value: "Alerce", children: "Alerce" })] }), _jsx(Stack, { direction: "row", spacing: 2, justifyContent: "flex-end", children: _jsx(Button, { variant: "contained", type: "submit", startIcon: _jsx(CalculateIcon, {}), disabled: Boolean(typeDisabledReason) || woodBeamMutation.isPending, children: "Calcular" }) })] }) })) : currentType.value === "footing" ? (_jsx("form", { onSubmit: handleSubmitFooting, children: _jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", color: "text.secondary", children: "Esfuerzos" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Carga axial (kN)", type: "number", value: footingForm.axialLoad, onChange: (e) => setFootingForm((prev) => ({ ...prev, axialLoad: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Momento (kN\u00B7m)", type: "number", value: footingForm.moment, onChange: (e) => setFootingForm((prev) => ({ ...prev, moment: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Cortante (kN)", type: "number", value: footingForm.shear, onChange: (e) => setFootingForm((prev) => ({ ...prev, shear: Number(e.target.value) || 0 })), required: true, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Pilar" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Ancho pilar (cm)", type: "number", value: footingForm.columnWidth, onChange: (e) => setFootingForm((prev) => ({ ...prev, columnWidth: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Profundidad pilar (cm)", type: "number", value: footingForm.columnDepth, onChange: (e) => setFootingForm((prev) => ({ ...prev, columnDepth: Number(e.target.value) || 0 })), required: true, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Zapata" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsxs(TextField, { select: true, label: "Tipo de zapata", value: footingForm.footingType, onChange: (e) => setFootingForm((prev) => ({ ...prev, footingType: e.target.value })), required: true, fullWidth: true, children: [_jsx(MenuItem, { value: "isolated", children: "Aislada" }), _jsx(MenuItem, { value: "continuous", children: "Corrida" })] }), _jsx(TextField, { label: "Largo (m)", type: "number", value: footingForm.length, onChange: (e) => setFootingForm((prev) => ({ ...prev, length: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Ancho (m)", type: "number", value: footingForm.width, onChange: (e) => setFootingForm((prev) => ({ ...prev, width: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "Altura (cm)", type: "number", value: footingForm.footingDepth, onChange: (e) => setFootingForm((prev) => ({ ...prev, footingDepth: Number(e.target.value) || 0 })), required: true, fullWidth: true })] }), _jsx(Typography, { variant: "subtitle2", color: "text.secondary", sx: { mt: 2 }, children: "Materiales y Suelo" }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 2, children: [_jsx(TextField, { label: "Capacidad portante (kN/m\u00B2)", type: "number", value: footingForm.soilBearingCapacity, onChange: (e) => setFootingForm((prev) => ({ ...prev, soilBearingCapacity: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "f'c (MPa)", type: "number", value: footingForm.fc, onChange: (e) => setFootingForm((prev) => ({ ...prev, fc: Number(e.target.value) || 0 })), required: true, fullWidth: true }), _jsx(TextField, { label: "fy (MPa)", type: "number", value: footingForm.fy, onChange: (e) => setFootingForm((prev) => ({ ...prev, fy: Number(e.target.value) || 0 })), required: true, fullWidth: true })] }), _jsx(Stack, { direction: "row", spacing: 2, justifyContent: "flex-end", children: _jsx(Button, { variant: "contained", type: "submit", startIcon: _jsx(CalculateIcon, {}), disabled: Boolean(typeDisabledReason) || footingMutation.isPending, children: "Calcular" }) })] }) })) : (_jsx(Alert, { severity: "info", children: "Este c\u00E1lculo a\u00FAn no est\u00E1 disponible. Puedes revisar el historial existente o seleccionar otro tipo." })), typeDisabledReason && (currentType.value === "rc_beam" || currentType.value === "rc_column") && (_jsx(Alert, { severity: "warning", sx: { mt: 2 }, children: typeDisabledReason })), concreteBeamMutation.isError && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: concreteBeamMutation.error?.response?.data?.detail ??
                                            concreteBeamMutation.error?.message ??
                                            "Ocurrió un error al ejecutar el cálculo." })), concreteColumnMutation.isError && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: concreteColumnMutation.error?.response?.data?.detail ??
                                            concreteColumnMutation.error?.message ??
                                            "Ocurrió un error al ejecutar el cálculo." }))] }) }) })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Resultados" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: ["Proyecto activo: ", effectiveProjectName] }), result && "positiveReinforcemenet" in result ? (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, color: "primary.main", children: "Resultados del Dise\u00F1o" }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Refuerzo Longitudinal Superior (Momento -)" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.negativeReinforcement.numBars, " \u03C6", result.negativeReinforcement.barDiameter, " (", result.negativeReinforcement.totalArea.toFixed(0), " mm\u00B2)"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Refuerzo Longitudinal Inferior (Momento +)" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.positiveReinforcemenet.numBars, " \u03C6", result.positiveReinforcemenet.barDiameter, " (", result.positiveReinforcemenet.totalArea.toFixed(0), " mm\u00B2)"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Estribos" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: ["\u03C6", result.transverseSteel.diameter, " @ ", result.transverseSteel.spacing.toFixed(0), " mm"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Ratio de Corte" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [(result.shearCapacityRatio * 100).toFixed(1), "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Verificaci\u00F3n de Deflexi\u00F3n" }), _jsx(Typography, { variant: "body1", fontWeight: 500, children: result.deflectionCheck })] })] })) : result && "axialCapacity" in result ? (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, color: "primary.main", children: "Resultados del Dise\u00F1o" }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Capacidad Axial" }), _jsxs(Typography, { variant: "h5", children: [result.axialCapacity.toFixed(2), " kN"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Ratio de Utilizaci\u00F3n" }), _jsxs(Typography, { variant: "h5", children: [(result.axialCapacityRatio * 100).toFixed(1), "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Refuerzo Longitudinal" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.longitudinalSteel.numBars, " \u03C6", result.longitudinalSteel.barDiameter, " (", result.longitudinalSteel.totalArea.toFixed(0), " mm\u00B2)"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Estribos" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: ["\u03C6", result.transverseSteel.diameter, " @ ", result.transverseSteel.spacing.toFixed(0), " mm"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Esbeltez" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.slendernessRatio.toFixed(2), " ", result.isSlender ? "(Esbelto)" : "(No Esbelto)"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Factor de Magnificaci\u00F3n" }), _jsx(Typography, { variant: "body1", fontWeight: 500, children: result.magnificationFactor.toFixed(3) })] })] })) : result && "section" in result && "pn" in result && "mnX" in result ? (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, color: "primary.main", children: "Pilar de Acero - Resultados" }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Perfil" }), _jsx(Typography, { variant: "h6", children: result.section })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Capacidad Axial (Pn)" }), _jsxs(Typography, { variant: "h5", children: [result.pn.toFixed(2), " kN"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Momento Nominal X (Mn,x)" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.mnX.toFixed(2), " kN\u00B7m"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Momento Nominal Y (Mn,y)" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.mnY.toFixed(2), " kN\u00B7m"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Ratio de Interacci\u00F3n" }), _jsxs(Typography, { variant: "h5", color: result.interactionRatio > 1 ? "error" : "success.main", children: [(result.interactionRatio * 100).toFixed(1), "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Estado de Verificaci\u00F3n" }), _jsx(Typography, { variant: "body1", fontWeight: 600, color: result.passes ? "success.main" : "error.main", children: result.checkStatus })] })] })) : result && "section" in result && "mn" in result && "vn" in result && "flexureRatio" in result ? (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, color: "primary.main", children: ("woodType" in result) ? "Viga de Madera - Resultados" : "Viga de Acero - Resultados" }), ("woodType" in result) && (_jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Tipo de Madera" }), _jsx(Typography, { variant: "h6", children: result.woodType })] })), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Secci\u00F3n" }), _jsx(Typography, { variant: "h6", children: result.section })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Momento Nominal (Mn)" }), _jsxs(Typography, { variant: "h5", children: [result.mn.toFixed(2), " kN\u00B7m"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Cortante Nominal (Vn)" }), _jsxs(Typography, { variant: "h5", children: [result.vn.toFixed(2), " kN"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Ratio de Flexi\u00F3n" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, color: result.flexureRatio > 1 ? "error" : "success.main", children: [(result.flexureRatio * 100).toFixed(1), "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Ratio de Cortante" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, color: result.shearRatio > 1 ? "error" : "success.main", children: [(result.shearRatio * 100).toFixed(1), "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Deflexi\u00F3n" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.deflection.toFixed(2), " cm (Ratio: ", (result.deflectionRatio * 100).toFixed(1), "%)"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Estado de Verificaci\u00F3n" }), _jsx(Typography, { variant: "body1", fontWeight: 600, color: result.passes ? "success.main" : "error.main", children: result.checkStatus })] })] })) : result && "woodType" in result && "pn" in result && "utilizationRatio" in result ? (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, color: "primary.main", children: "Pilar de Madera - Resultados" }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Tipo de Madera" }), _jsx(Typography, { variant: "h6", children: result.woodType })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "\u00C1rea de la Secci\u00F3n" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.area.toFixed(2), " mm\u00B2"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Capacidad Axial (Pn)" }), _jsxs(Typography, { variant: "h5", children: [result.pn.toFixed(2), " kN"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Ratio de Utilizaci\u00F3n" }), _jsxs(Typography, { variant: "h5", color: result.utilizationRatio > 1 ? "error" : "success.main", children: [(result.utilizationRatio * 100).toFixed(1), "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Esbeltez" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: ["\u03BBx: ", result.slendernessX.toFixed(2), ", \u03BBy: ", result.slendernessY.toFixed(2), " ", result.isSlender ? "(Esbelto)" : "(No Esbelto)"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Factor de Estabilidad (Cp)" }), _jsx(Typography, { variant: "body1", fontWeight: 500, children: result.stabilityFactor.toFixed(3) })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Estado de Verificaci\u00F3n" }), _jsx(Typography, { variant: "body1", fontWeight: 600, color: result.checkStatus === "OK" ? "success.main" : "error.main", children: result.checkStatus })] })] })) : result && "length" in result && "soilPressureMax" in result ? (_jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, color: "primary.main", children: "Zapata - Resultados" }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Dimensiones" }), _jsxs(Typography, { variant: "h6", children: [result.length.toFixed(2), " m \u00D7 ", result.width.toFixed(2), " m \u00D7 ", result.depth.toFixed(1), " cm"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Presi\u00F3n del Suelo" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: ["M\u00E1x: ", result.soilPressureMax.toFixed(2), " kPa, M\u00EDn: ", result.soilPressureMin.toFixed(2), " kPa"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Acero Longitudinal" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.asLongitudinal.toFixed(2), " cm\u00B2/m"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Acero Transversal" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: [result.asTransverse.toFixed(2), " cm\u00B2/m"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Configuraci\u00F3n de Barras" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, children: ["\u03C6", result.barDiameter, " @ ", result.spacing.toFixed(1), " cm"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Ratio de Punzonamiento" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, color: result.punchingShearRatio > 1 ? "error" : "success.main", children: [(result.punchingShearRatio * 100).toFixed(1), "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Ratio de Cortante Viga" }), _jsxs(Typography, { variant: "body1", fontWeight: 500, color: result.beamShearRatio > 1 ? "error" : "success.main", children: [(result.beamShearRatio * 100).toFixed(1), "%"] })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "overline", color: "text.secondary", children: "Estado de Verificaci\u00F3n" }), _jsx(Typography, { variant: "body1", fontWeight: 600, color: result.passes ? "success.main" : "error.main", children: result.passes ? "OK - Cumple" : "No cumple" })] })] })) : (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Ejecuta un c\u00E1lculo o selecciona un registro del historial para visualizar los resultados." }))] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(HistoryIcon, { color: "primary" }), _jsx(Typography, { variant: "h6", children: "Historial de c\u00E1lculos" })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Selecciona un c\u00E1lculo previo para revisar los valores usados y volver a ejecutarlo con ajustes." }), _jsx(DataGrid, { autoHeight: true, rows: calculationRows, columns: columns, loading: runsLoading, hideFooter: true, onRowClick: (params) => handleRowClick(params.id), rowSelectionModel: selectionModel, onRowSelectionModelChange: (model) => {
                                            setSelectionModel(model);
                                            if (model.length) {
                                                handleRowClick(model[0]);
                                            }
                                        }, sx: {
                                            "& .MuiDataGrid-columnHeaders": {
                                                fontWeight: 600,
                                            },
                                            "& .MuiDataGrid-row:hover": {
                                                cursor: "pointer",
                                            },
                                        } })] }) }) })] })] }));
};
export default ProjectCalculationsPage;
