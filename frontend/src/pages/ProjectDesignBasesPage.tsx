import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
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
import { useConcreteColumn, ConcreteColumnResponse } from "../hooks/useStructuralCalcs";

interface LiveLoadResponse {
  buildingType: string;
  usage: string;
  uniformLoad: number | null;
  uniformLoadRaw: string;
  concentratedLoad: number | null;
  concentratedLoadRaw: string;
}

interface LiveLoadReductionResponse {
  reducedLoad: number;
}

interface WindResponse {
  q: number | null;
  message: string | null;
}

interface SnowResponse {
  pg: number;
  ct: number;
  ce: number;
  I: number;
  cs: number;
  pf: number;
}

interface SeismicSpectrumPoint {
  period: number;
  SaX: number;
  SaY: number;
}

interface SeismicFloorForce {
  level: number;
  Fkx: number;
  Fky: number;
}

interface SeismicResponse {
  intensityFactor: number;
  zoneFactor: number;
  soil: Record<string, number>;
  CMax: number;
  CMin: number;
  Q0x: number;
  Q0y: number;
  Q0Min: number;
  Q0Max: number;
  Qbasx: number;
  Qbasy: number;
  spectrum: SeismicSpectrumPoint[];
  floorForces: SeismicFloorForce[];
}

type StoryInput = { id: number; height: string; weight: string };

const getErrorMessage = (error: unknown): string | null => {
  const maybeAxios = error as { response?: { data?: { detail?: string } } };
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

  const [buildingType, setBuildingType] = useState<string>("");
  const [usage, setUsage] = useState<string>("");
  const [elementType, setElementType] = useState<string>("");
  const [tributaryArea, setTributaryArea] = useState<string>("20");
  const [manualBaseLoad, setManualBaseLoad] = useState<string>("");

  const [windEnvironment, setWindEnvironment] = useState<string>("");
  const [windHeight, setWindHeight] = useState<string>("10");

  const [latitudeBand, setLatitudeBand] = useState<string>("");
  const [altitudeBand, setAltitudeBand] = useState<string>("");
  const [thermalCondition, setThermalCondition] = useState<string>("");
  const [importanceCategory, setImportanceCategory] = useState<string>("");
  const [exposureCategory, setExposureCategory] = useState<string>("");
  const [exposureCondition, setExposureCondition] = useState<string>("");
  const [surfaceType, setSurfaceType] = useState<string>("");
  const [roofPitch, setRoofPitch] = useState<string>("5");

  const [seismicCategory, setSeismicCategory] = useState<string>("");
  const [seismicZone, setSeismicZone] = useState<string>("");
  const [seismicSoil, setSeismicSoil] = useState<string>("");
  const [rsValue, setRsValue] = useState<string>("3");
  const [psValue, setPsValue] = useState<string>("1000");
  const [txValue, setTxValue] = useState<string>("0.6");
  const [tyValue, setTyValue] = useState<string>("0.5");
  const [r0Value, setR0Value] = useState<string>("8");
  const [stories, setStories] = useState<StoryInput[]>([
    { id: 1, height: "3.0", weight: "300" },
    { id: 2, height: "3.0", weight: "300" },
  ]);

  const handleStoryChange = (id: number, field: "height" | "weight", value: string) => {
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

  const handleRemoveStory = (id: number) => {
    setStories((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  };
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Estados para descripciÃ³n del edificio
  const [buildingDescription, setBuildingDescription] = useState<string>("");
  const [buildingLocation, setBuildingLocation] = useState<string>("");
  const [buildingArea, setBuildingArea] = useState<string>("");
  const [buildingHeight, setBuildingHeight] = useState<string>("");

  // Estados para pilar de hormigÃ³n armado
  const [ccAxialLoad, setCcAxialLoad] = useState<string>("500");
  const [ccMomentX, setCcMomentX] = useState<string>("50");
  const [ccMomentY, setCcMomentY] = useState<string>("40");
  const [ccShearX, setCcShearX] = useState<string>("30");
  const [ccShearY, setCcShearY] = useState<string>("25");
  const [ccWidth, setCcWidth] = useState<string>("40");
  const [ccDepth, setCcDepth] = useState<string>("40");
  const [ccLength, setCcLength] = useState<string>("3.0");
  const [ccFc, setCcFc] = useState<string>("25");
  const [ccFy, setCcFy] = useState<string>("420");

  // Estado para guardar/cargar bases de cÃ¡lculo
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [projectId, setProjectId] = useState(localStorage.getItem("activeProjectId") || "");
  const [savedBases, setSavedBases] = useState<Array<{ id: string; name: string; createdAt: string }>>([]);

  // Cargar lista de proyectos
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  // Estado para generar documento Word y historial
  const [generateDocDialogOpen, setGenerateDocDialogOpen] = useState(false);
  const [docProjectName, setDocProjectName] = useState("");
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [runHistory, setRunHistory] = useState<Array<{ id: string; name: string; createdAt: string }>>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [autoSaveSnackbar, setAutoSaveSnackbar] = useState(false);

  const liveLoadMutation = useMutation({
    mutationFn: async (payload: { buildingType: string; usage: string }) => {
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
    mutationFn: async (payload: { elementType: string; tributaryArea: number; baseLoad: number }) => {
      const { data } = await apiClient.post<LiveLoadReductionResponse>("/design-bases/live-load/reduction", payload);
      return data;
    },
  });

  const windMutation = useMutation({
    mutationFn: async (payload: { environment: string; height: number }) => {
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
    mutationFn: async (payload: {
      latitudeBand: string;
      altitudeBand: string;
      thermalCondition: string;
      importanceCategory: string;
      exposureCategory: string;
      exposureCondition: string;
      surfaceType: string;
      roofPitch: number;
    }) => {
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
    mutationFn: async (payload: {
      category: string;
      zone: string;
      soil: string;
      rs: number;
      ps: number;
      tx: number;
      ty: number;
      r0: number;
      stories: { height: number; weight: number }[];
    }) => {
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
    if (!options || !buildingType) return [];
    return options.liveLoadCategories[buildingType] ?? [];
  }, [options, buildingType]);

  const altitudeOptions = useMemo(() => {
    if (!options || !latitudeBand) return [];
    return Object.keys(options.snowLatitudeBands[latitudeBand] ?? {});
  }, [latitudeBand, options]);

  const exposureConditions = useMemo(() => {
    if (!options || !exposureCategory) return [];
    return options.snowExposureCategories[exposureCategory] ?? [];
  }, [exposureCategory, options]);

  const storiesValid = stories.every((story) => Number(story.height) > 0 && Number(story.weight) > 0);

  const seismicErrorMessage = seismicMutation.isError
    ? getErrorMessage(seismicMutation.error)
    : null;

  const hasAnyResult =
    !!liveLoadMutation.data ||
    !!liveLoadReductionMutation.data ||
    !!windMutation.data ||
    !!snowMutation.data ||
    !!seismicMutation.data;

  const buildExportPayload = () => {
    const payload: Record<string, unknown> = {};

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
    if (
      liveLoadReductionMutation.data &&
      elementType &&
      baseLoadValue !== undefined &&
      Number.isFinite(baseLoadValue) &&
      Number.isFinite(areaValue) &&
      areaValue > 0
    ) {
      payload.reduction = {
        elementType,
        tributaryArea: areaValue,
        baseLoad: baseLoadValue,
        reducedLoad: liveLoadReductionMutation.data.reducedLoad,
      };
    }
    if (windMutation.data && windEnvironment && windHeight) {
      payload.wind = {
        environment: windEnvironment,
        height: Number(windHeight),
        q: windMutation.data.q,
        message: windMutation.data.message,
      };
    }
    if (
      snowMutation.data &&
      latitudeBand &&
      altitudeBand &&
      thermalCondition &&
      importanceCategory &&
      exposureCategory &&
      exposureCondition &&
      surfaceType
    ) {
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
    if (
      seismicMutation.data &&
      seismicCategory &&
      seismicZone &&
      seismicSoil &&
      storiesValid
    ) {
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
    const structural: Record<string, unknown> = {};
    if (concreteColumnMutation.data) {
      structural.concreteColumn = concreteColumnMutation.data;
    }
    if (Object.keys(structural).length > 0) {
      payload.structural = structural;
    }

    return payload;
  };

  const handleExport = async (format: "csv" | "docx" | "pdf") => {
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
      const blob: Blob = response.data;
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
    } catch (error) {
      setExportError(getErrorMessage(error) ?? "No se pudo generar la exportaciÃ³n.");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveDesignBase = async () => {
    if (!saveName.trim() || !projectId) {
      alert("Ingresa un nombre y asegÃºrate de tener un proyecto activo");
      return;
    }
    const payload = buildExportPayload();
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
    } catch (error) {
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
    } catch (error) {
      alert(getErrorMessage(error) ?? "No se pudo cargar la lista");
    }
  };

  const handleLoadDesignBase = async (id: string) => {
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
          setStories(params.stories.map((s: any, idx: number) => ({
            id: idx + 1,
            height: s.height.toString(),
            weight: s.weight.toString(),
          })));
        }
      }

      setLoadDialogOpen(false);
      alert("Base de cÃ¡lculo cargada exitosamente");
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      alert(getErrorMessage(error) ?? "No se pudo cargar el historial");
    }
  };

  const handlePreviewDocument = async (runId: string) => {
    try {
      const { data } = await apiClient.get(`/design-bases/runs/get/${runId}`);
      setPreviewData(data);
      setPreviewDialogOpen(true);
    } catch (error) {
      alert(getErrorMessage(error) ?? "No se pudo cargar el preview");
    }
  };

  const handleDownloadDocument = async (runId: string) => {
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
    } catch (error) {
      alert(getErrorMessage(error) ?? "No se pudo descargar el documento");
    }
  };

  // FunciÃ³n para guardar automÃ¡ticamente en el historial
  const saveToHistoryAutomatically = async () => {
    if (!projectId) return;

    const payload = buildExportPayload();
    if (!Object.keys(payload).length) return;

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
    } catch (error) {
      console.error("Error al guardar automÃ¡ticamente:", error);
      // No mostramos alert para no interrumpir el flujo del usuario
    }
  };

  // useEffect para guardar automÃ¡ticamente cuando se completen cÃ¡lculos importantes
  

    const baseLoadValue = manualBaseLoad !== "" ? Number(manualBaseLoad) : undefined;

  if (optionsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <Typography>Cargando catÃ¡logos...</Typography>
      </Box>
    );
  }

  if (isError || !options) {
    return (
      <Alert severity="error">
        No se pudieron recuperar las opciones base. Verifica la API e intÃ©ntalo nuevamente.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" gutterBottom>
          Bases de cÃ¡lculo y cargas de diseÃ±o
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            label="Proyecto"
            size="small"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              localStorage.setItem("activeProjectId", e.target.value);
            }}
            disabled={projectsLoading}
            sx={{ width: 300 }}
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={handleLoadList}
            disabled={!projectId}
          >
            Cargar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
            disabled={!hasAnyResult || !projectId}
          >
            Guardar
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<DescriptionIcon />}
            onClick={() => setGenerateDocDialogOpen(true)}
            disabled={!hasAnyResult || !projectId}
          >
            Generar Word
          </Button>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={handleViewHistory}
            disabled={!projectId}
          >
            Historial
          </Button>
        </Stack>
      </Box>

      {/* Card de DescripciÃ³n del Edificio */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            DescripciÃ³n del Edificio
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="DescripciÃ³n General"
                value={buildingDescription}
                onChange={(e) => setBuildingDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Ej: Edificio de oficinas de 5 pisos con estructura de hormigÃ³n armado..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="UbicaciÃ³n"
                value={buildingLocation}
                onChange={(e) => setBuildingLocation(e.target.value)}
                fullWidth
                placeholder="Ej: Av. Principal 123, Santiago"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Ãrea Total (mÂ²)"
                value={buildingArea}
                onChange={(e) => setBuildingArea(e.target.value)}
                fullWidth
                placeholder="Ej: 1250"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Altura Total (m)"
                value={buildingHeight}
                onChange={(e) => setBuildingHeight(e.target.value)}
                fullWidth
                placeholder="Ej: 18.5"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => buildingDescriptionMutation.mutate()}
                disabled={
                  !projectId ||
                  buildingDescriptionMutation.isPending ||
                  (!buildingDescription && !buildingLocation && !buildingArea && !buildingHeight)
                }
              >
                Guardar DescripciÃ³n
              </Button>
              {buildingDescriptionMutation.isSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  DescripciÃ³n guardada en el historial
                </Alert>
              )}
              {buildingDescriptionMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(buildingDescriptionMutation.error as any)?.response?.data?.detail ||
                    (buildingDescriptionMutation.error as Error)?.message ||
                    "Error al guardar la descripciÃ³n"}
                </Alert>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h6">Cargas vivas por uso</Typography>
              <TextField
                select
                label="Tipo de edificio"
                value={buildingType}
                onChange={(event) => {
                  setBuildingType(event.target.value);
                  setUsage("");
                  liveLoadMutation.reset();
                }}
                fullWidth
              >
                {Object.keys(options.liveLoadCategories).map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Uso / recinto"
                value={usage}
                onChange={(event) => {
                  setUsage(event.target.value);
                  liveLoadMutation.reset();
                }}
                fullWidth
                disabled={!buildingType}
              >
                {usageOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                onClick={() => liveLoadMutation.mutate({ buildingType, usage })}
                disabled={!buildingType || !usage || liveLoadMutation.isPending}
              >
                Consultar carga viva
              </Button>
              {liveLoadMutation.isError && (
                <Alert severity="error">No se encontrÃ³ la combinaciÃ³n seleccionada.</Alert>
              )}
              {liveLoadMutation.data && (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                  <Typography color="text.secondary">Carga uniforme</Typography>
                  <Typography>
                    {liveLoadMutation.data.uniformLoad ?? liveLoadMutation.data.uniformLoadRaw} kN/mÂ²
                  </Typography>
                  <Typography color="text.secondary">Carga concentrada</Typography>
                  <Typography>
                    {liveLoadMutation.data.concentratedLoad ??
                      liveLoadMutation.data.concentratedLoadRaw}{" "}
                    kN
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h6">ReducciÃ³n por Ã¡rea tributaria (NCh1537)</Typography>
              <TextField
                select
                label="Elemento estructural"
                value={elementType}
                onChange={(event) => setElementType(event.target.value)}
                fullWidth
              >
                {options.liveLoadElementTypes.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Ãrea tributaria (mÂ²)"
                type="number"
                value={tributaryArea}
                onChange={(event) => setTributaryArea(event.target.value)}
                fullWidth
              />
              <TextField
                label="Carga base (kN/mÂ²)"
                type="number"
                value={manualBaseLoad}
                onChange={(event) => setManualBaseLoad(event.target.value)}
                helperText="Ingresa la carga uniforme que deseas reducir."
                fullWidth
              />
              <Button
                variant="contained"
                onClick={() => {
                  const areaValue = Number(tributaryArea);
                  const baseLoadValue = manualBaseLoad !== "" ? Number(manualBaseLoad) : Number.NaN;
                  if (!Number.isFinite(areaValue) || !Number.isFinite(baseLoadValue)) {
                    return;
                  }
                  liveLoadReductionMutation.mutate({
                    elementType,
                    tributaryArea: areaValue,
                    baseLoad: baseLoadValue,
                  });
                }}
                disabled={
                  !elementType ||
                  !tributaryArea ||
                  manualBaseLoad === "" ||
                  liveLoadReductionMutation.isPending ||
                  Number(tributaryArea) <= 0 ||
                  Number(manualBaseLoad) <= 0
                }
              >
                Calcular carga reducida
              </Button>
              {liveLoadReductionMutation.isSuccess && (
                <Alert severity="success">
                  Carga reducida: {typeof liveLoadReductionMutation.data?.reducedLoad === "number" ? `${liveLoadReductionMutation.data.reducedLoad.toFixed(3)} kN/m2` : "N/A"}
                </Alert>
              )}
              {liveLoadReductionMutation.isError && (
                <Alert severity="error">No fue posible calcular la reducciÃ³n.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h6">PresiÃ³n de viento (NCh432)</Typography>
              <TextField
                select
                label="Entorno"
                value={windEnvironment}
                onChange={(event) => setWindEnvironment(event.target.value)}
                fullWidth
              >
                {options.windEnvironments.map((env) => (
                  <MenuItem key={env} value={env}>
                    {env}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Altura sobre el terreno (m)"
                type="number"
                value={windHeight}
                onChange={(event) => setWindHeight(event.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={() => {
                  const heightValue = Number(windHeight);
                  if (!Number.isFinite(heightValue) || heightValue <= 0) {
                    return;
                  }
                  windMutation.mutate({ environment: windEnvironment, height: heightValue });
                }}
                disabled={
                  !windEnvironment ||
                  !windHeight ||
                  !Number.isFinite(Number(windHeight)) ||
                  Number(windHeight) <= 0 ||
                  windMutation.isPending
                }
              >
                Calcular q
              </Button>
              {windMutation.data && (
                <Alert severity={windMutation.data.q ? "success" : "warning"}>
                  {windMutation.data.q
                    ? `q = ${windMutation.data.q.toFixed(3)} kN/mÂ²`
                    : windMutation.data.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h6">Cargas de nieve sobre techumbre</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Latitud (Â°)"
                    value={latitudeBand}
                    onChange={(event) => {
                      setLatitudeBand(event.target.value);
                      setAltitudeBand("");
                    }}
                fullWidth
                  >
                    {Object.keys(options.snowLatitudeBands).map((lat) => (
                      <MenuItem key={lat} value={lat}>
                        {lat}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Altitud (m.s.n.m.)"
                    value={altitudeBand}
                    onChange={(event) => setAltitudeBand(event.target.value)}
                    disabled={!latitudeBand}
                fullWidth
                  >
                    {altitudeOptions.map((alt) => (
                      <MenuItem key={alt} value={alt}>
                        {alt}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="CondiciÃ³n tÃ©rmica"
                    value={thermalCondition}
                    onChange={(event) => setThermalCondition(event.target.value)}
                fullWidth
                  >
                    {options.snowThermalConditions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="CategorÃ­a de importancia"
                    value={importanceCategory}
                    onChange={(event) => setImportanceCategory(event.target.value)}
                fullWidth
                  >
                    {options.snowImportanceCategories.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="CategorÃ­a de exposiciÃ³n"
                    value={exposureCategory}
                    onChange={(event) => {
                      setExposureCategory(event.target.value);
                      setExposureCondition("");
                    }}
                fullWidth
                  >
                    {Object.keys(options.snowExposureCategories).map((categoryKey) => (
                      <MenuItem key={categoryKey} value={categoryKey}>
                        {categoryKey}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="CondiciÃ³n de exposiciÃ³n"
                    value={exposureCondition}
                    onChange={(event) => setExposureCondition(event.target.value)}
                    disabled={!exposureCategory}
                fullWidth
                  >
                    {exposureConditions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Tipo de superficie"
                    value={surfaceType}
                    onChange={(event) => setSurfaceType(event.target.value)}
                fullWidth
                  >
                    {options.snowSurfaceTypes.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="InclinaciÃ³n (Â°)"
                    type="number"
                    value={roofPitch}
                    onChange={(event) => setRoofPitch(event.target.value)}
                fullWidth
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                onClick={() =>
                  snowMutation.mutate({
                    latitudeBand,
                    altitudeBand,
                    thermalCondition,
                    importanceCategory,
                    exposureCategory,
                    exposureCondition,
                    surfaceType,
                    roofPitch: Number(roofPitch),
                  })
                }
                disabled={
                  !latitudeBand ||
                  !altitudeBand ||
                  !thermalCondition ||
                  !importanceCategory ||
                  !exposureCategory ||
                  !exposureCondition ||
                  !surfaceType ||
                  !roofPitch ||
                  snowMutation.isPending
                }
              >
                Calcular nieve sobre techo
              </Button>
              {snowMutation.isError && (
                <Alert severity="error">No hay datos para la combinaciÃ³n seleccionada.</Alert>
              )}
              {snowMutation.data && (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 1 }}>
                  <Typography color="text.secondary">Pg (kN/mÂ²)</Typography>
                  <Typography>{snowMutation.data.pg?.toFixed(2) ?? 'N/A'}</Typography>
                  <Typography color="text.secondary">ct</Typography>
                  <Typography>{snowMutation.data.ct?.toFixed(2) ?? 'N/A'}</Typography>
                  <Typography color="text.secondary">ce</Typography>
                  <Typography>{snowMutation.data.ce?.toFixed(2) ?? 'N/A'}</Typography>
                  <Typography color="text.secondary">I</Typography>
                  <Typography>{snowMutation.data.I?.toFixed(2) ?? 'N/A'}</Typography>
                  <Typography color="text.secondary">cs</Typography>
                  <Typography>{snowMutation.data.cs?.toFixed(3) ?? 'N/A'}</Typography>
                  <Typography color="text.secondary">pf (kN/mÂ²)</Typography>
                  <Typography>{snowMutation.data.pf?.toFixed(3) ?? 'N/A'}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6">AnÃ¡lisis sÃ­smico base (NCh433)</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="CategorÃ­a estructural"
                value={seismicCategory}
                onChange={(event) => setSeismicCategory(event.target.value)}
                fullWidth
              >
                {options.seismicCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Zona sÃ­smica"
                value={seismicZone}
                onChange={(event) => setSeismicZone(event.target.value)}
                fullWidth
              >
                {options.seismicZones.map((zone) => (
                  <MenuItem key={zone} value={zone}>
                    {zone}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Tipo de suelo"
                value={seismicSoil}
                onChange={(event) => setSeismicSoil(event.target.value)}
                fullWidth
              >
                {options.seismicSoils.map((soil) => (
                  <MenuItem key={soil} value={soil}>
                    {soil}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Coeficiente R"
                type="number"
                value={rsValue}
                onChange={(event) => setRsValue(event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Peso sÃ­smico total (kN)"
                type="number"
                value={psValue}
                onChange={(event) => setPsValue(event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="PerÃ­odo Tx (s)"
                type="number"
                value={txValue}
                onChange={(event) => setTxValue(event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="PerÃ­odo Ty (s)"
                type="number"
                value={tyValue}
                onChange={(event) => setTyValue(event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Râ‚€ (deriva)"
                type="number"
                value={r0Value}
                onChange={(event) => setR0Value(event.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle1">DistribuciÃ³n de niveles</Typography>
          <Stack spacing={1}>
            {stories.map((story, index) => (
              <Stack key={story.id} direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Typography variant="body2">Nivel {index + 1}</Typography>
                <TextField
                  label="Altura (m)"
                  type="number"
                  value={story.height}
                  onChange={(event) => handleStoryChange(story.id, "height", event.target.value)}
                  sx={{ minWidth: 140 }}
                />
                <TextField
                  label="Peso (kN)"
                  type="number"
                  value={story.weight}
                  onChange={(event) => handleStoryChange(story.id, "weight", event.target.value)}
                  sx={{ minWidth: 140 }}
                />
                <IconButton
                  aria-label="Eliminar nivel"
                  onClick={() => handleRemoveStory(story.id)}
                  disabled={stories.length <= 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddStory}
              variant="outlined"
              sx={{ alignSelf: "flex-start" }}
            >
              Agregar nivel
            </Button>
          </Stack>

          <Button
            variant="contained"
            onClick={() =>
              seismicMutation.mutate({
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
              })
            }
            disabled={
              !seismicCategory ||
              !seismicZone ||
              !seismicSoil ||
              !rsValue ||
              !psValue ||
              !txValue ||
              !tyValue ||
              !r0Value ||
              !storiesValid ||
              seismicMutation.isPending
            }
          >
            Calcular espectro y fuerzas
          </Button>

          {seismicMutation.isError && (
            <Alert severity="error">
              {seismicErrorMessage ?? "Verifica los valores ingresados; no se pudo calcular el anÃ¡lisis."}
            </Alert>
          )}

          {seismicMutation.data && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 1 }}>
                <Typography color="text.secondary">I<sub>s</sub></Typography>
                <Typography>{seismicMutation.data.intensityFactor.toFixed(3)}</Typography>
                <Typography color="text.secondary">A<sub>0</sub></Typography>
                <Typography>{seismicMutation.data.zoneFactor.toFixed(3)}</Typography>
                <Typography color="text.secondary">Q<sub>bas,x</sub></Typography>
                <Typography>{seismicMutation.data.Qbasx.toFixed(3)} kN</Typography>
                <Typography color="text.secondary">Q<sub>bas,y</sub></Typography>
                <Typography>{seismicMutation.data.Qbasy.toFixed(3)} kN</Typography>
                <Typography color="text.secondary">Q<sub>basal,mÃ­n</sub></Typography>
                <Typography>{seismicMutation.data.Q0Min.toFixed(3)} kN</Typography>
                <Typography color="text.secondary">Q<sub>basal,mÃ¡x</sub></Typography>
                <Typography>{seismicMutation.data.Q0Max.toFixed(3)} kN</Typography>
              </Box>
              <Typography variant="subtitle2">DistribuciÃ³n de fuerzas por nivel</Typography>
              <DataGrid
                autoHeight
                density="compact"
                rows={seismicMutation.data.floorForces.map((row) => ({ id: row.level, ...row }))}
                columns={[
                  { field: "level", headerName: "Nivel", width: 120 },
                  { field: "Fkx", headerName: "Fkx (kN)", width: 160, valueFormatter: ({ value }) => value.toFixed(2) },
                  { field: "Fky", headerName: "Fky (kN)", width: 160, valueFormatter: ({ value }) => value.toFixed(2) },
                ]}
                hideFooter
              />
              <Typography variant="subtitle2">Espectro de diseÃ±o (Sa)</Typography>
              <DataGrid
                autoHeight
                density="compact"
                rows={seismicMutation.data.spectrum.map((row, index) => ({ id: index, ...row }))}
                columns={[
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
                ]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10, page: 0 } },
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Card para Pilar de HormigÃ³n Armado (ACI318) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pilar de HormigÃ³n Armado (ACI318)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Carga Axial (kN)"
                type="number"
                value={ccAxialLoad}
                onChange={(e) => setCcAxialLoad(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Momento X (kNÂ·m)"
                type="number"
                value={ccMomentX}
                onChange={(e) => setCcMomentX(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Momento Y (kNÂ·m)"
                type="number"
                value={ccMomentY}
                onChange={(e) => setCcMomentY(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Corte X (kN)"
                type="number"
                value={ccShearX}
                onChange={(e) => setCcShearX(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Corte Y (kN)"
                type="number"
                value={ccShearY}
                onChange={(e) => setCcShearY(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Ancho (cm)"
                type="number"
                value={ccWidth}
                onChange={(e) => setCcWidth(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Profundidad (cm)"
                type="number"
                value={ccDepth}
                onChange={(e) => setCcDepth(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Altura (m)"
                type="number"
                value={ccLength}
                onChange={(e) => setCcLength(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="f'c (MPa)"
                type="number"
                value={ccFc}
                onChange={(e) => setCcFc(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="fy (MPa)"
                type="number"
                value={ccFy}
                onChange={(e) => setCcFy(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={() =>
                  concreteColumnMutation.mutate({
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
                  })
                }
                disabled={concreteColumnMutation.isPending}
              >
                DiseÃ±ar Pilar
              </Button>
            </Grid>
          </Grid>

          {concreteColumnMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {getErrorMessage(concreteColumnMutation.error) || "Error al calcular el pilar"}
            </Alert>
          )}

          {concreteColumnMutation.data && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Resultados del DiseÃ±o
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Capacidad Axial
                  </Typography>
                  <Typography variant="body1">
                    {concreteColumnMutation.data.axialCapacity?.toFixed(2) ?? 'N/A'} kN
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ratio de UtilizaciÃ³n
                  </Typography>
                  <Typography variant="body1" color={(concreteColumnMutation.data.axialCapacityRatio ?? 0) > 1 ? "error" : "success.main"}>
                    {((concreteColumnMutation.data.axialCapacityRatio ?? 0) * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Refuerzo Longitudinal
                  </Typography>
                  <Typography variant="body1">
                    {concreteColumnMutation.data.longitudinalSteel?.numBars ?? 'N/A'} Ï†{concreteColumnMutation.data.longitudinalSteel?.barDiameter ?? 'N/A'} ({concreteColumnMutation.data.longitudinalSteel?.totalArea?.toFixed(0) ?? 'N/A'} mmÂ²)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Estribos
                  </Typography>
                  <Typography variant="body1">
                    Ï†{concreteColumnMutation.data.transverseSteel?.diameter ?? 'N/A'} @ {concreteColumnMutation.data.transverseSteel?.spacing ?? 'N/A'} mm
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Esbeltez
                  </Typography>
                  <Typography variant="body1">
                    {concreteColumnMutation.data.slendernessRatio?.toFixed(2) ?? 'N/A'} {concreteColumnMutation.data.isSlender && "(Esbelto)"}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Factor de MagnificaciÃ³n
                  </Typography>
                  <Typography variant="body1">
                    {concreteColumnMutation.data.magnificationFactor?.toFixed(3) ?? 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* DiÃ¡logo para guardar */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Guardar base de cÃ¡lculo</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
                fullWidth
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Ej: Base sÃ­smica edificio X"
            helperText={`Se guardarÃ¡ en el proyecto: ${projects.find(p => p.id === projectId)?.name || "No seleccionado"}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveDesignBase} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DiÃ¡logo para cargar */}
      <Dialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cargar base de cÃ¡lculo</DialogTitle>
        <DialogContent>
          {savedBases.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No hay bases guardadas para este proyecto
            </Typography>
          ) : (
            <List>
              {savedBases.map((base) => (
                <ListItem key={base.id} disablePadding>
                  <ListItemButton onClick={() => handleLoadDesignBase(base.id)}>
                    <ListItemText
                      primary={base.name}
                      secondary={new Date(base.createdAt).toLocaleString()}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoadDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* DiÃ¡logo para generar documento Word */}
      <Dialog open={generateDocDialogOpen} onClose={() => setGenerateDocDialogOpen(false)}>
        <DialogTitle>Generar documento Word</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del proyecto"
                fullWidth
            value={docProjectName}
            onChange={(e) => setDocProjectName(e.target.value)}
            placeholder="Ej: Edificio Comercial Centro"
            helperText="Este nombre aparecerÃ¡ en el documento generado"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDocDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleGenerateDocument} variant="contained" color="success">
            Generar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DiÃ¡logo para historial de documentos */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial de documentos generados</DialogTitle>
        <DialogContent>
          {runHistory.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No hay documentos generados para este proyecto
            </Typography>
          ) : (
            <List>
              {runHistory.map((run) => (
                <ListItem
                  key={run.id}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton onClick={() => handlePreviewDocument(run.id)} title="Ver preview">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDownloadDocument(run.id)} title="Descargar">
                        <DownloadIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={run.name}
                    secondary={new Date(run.createdAt).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* DiÃ¡logo para preview del documento */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Preview: {previewData?.name}
          <IconButton
            onClick={() => handleDownloadDocument(previewData?.id)}
            sx={{ position: "absolute", right: 60, top: 8 }}
            title="Descargar"
          >
            <DownloadIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewData && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* InformaciÃ³n general */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    InformaciÃ³n del Documento
                  </Typography>
                  <Typography variant="body2">
                    <strong>Nombre:</strong> {previewData.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Fecha de creaciÃ³n:</strong> {new Date(previewData.createdAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>

              {/* DescripciÃ³n del edificio */}
              {previewData.data.buildingDescription && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      DescripciÃ³n del Edificio
                    </Typography>
                    {previewData.data.buildingDescription.text && (
                      <Typography variant="body2" paragraph>
                        <strong>DescripciÃ³n:</strong> {previewData.data.buildingDescription.text}
                      </Typography>
                    )}
                    {previewData.data.buildingDescription.location && (
                      <Typography variant="body2">
                        <strong>UbicaciÃ³n:</strong> {previewData.data.buildingDescription.location}
                      </Typography>
                    )}
                    {previewData.data.buildingDescription.area && (
                      <Typography variant="body2">
                        <strong>Ãrea total:</strong> {previewData.data.buildingDescription.area} mÂ²
                      </Typography>
                    )}
                    {previewData.data.buildingDescription.height && (
                      <Typography variant="body2">
                        <strong>Altura:</strong> {previewData.data.buildingDescription.height} m
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Cargas vivas */}
              {previewData.data.liveLoad && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Cargas Vivas
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tipo de edificio:</strong> {previewData.data.liveLoad.buildingType}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Uso:</strong> {previewData.data.liveLoad.usage}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Carga uniforme:</strong> {previewData.data.liveLoad.uniformLoadRaw}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Carga concentrada:</strong> {previewData.data.liveLoad.concentratedLoadRaw}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Viento */}
              {previewData.data.wind && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      PresiÃ³n de Viento
                    </Typography>
                    <Typography variant="body2">
                      <strong>Entorno:</strong> {previewData.data.wind.environment}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Altura:</strong> {previewData.data.wind.height} m
                    </Typography>
                    <Typography variant="body2">
                      <strong>PresiÃ³n:</strong> {previewData.data.wind.q?.toFixed(2)} kgf/mÂ²
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Sismo */}
              {previewData.data.seismic && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      AnÃ¡lisis SÃ­smico
                    </Typography>
                    <Typography variant="body2">
                      <strong>CategorÃ­a:</strong> {previewData.data.seismic.params.category}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Zona:</strong> {previewData.data.seismic.params.zone}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Suelo:</strong> {previewData.data.seismic.params.soil}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Qbas,x:</strong> {previewData.data.seismic.result.Qbasx?.toFixed(2)} kN
                    </Typography>
                    <Typography variant="body2">
                      <strong>Qbas,y:</strong> {previewData.data.seismic.result.Qbasy?.toFixed(2)} kN
                    </Typography>
                    <Typography variant="body2">
                      <strong>Q0,min:</strong> {previewData.data.seismic.result.Q0Min?.toFixed(2)} kN
                    </Typography>
                    <Typography variant="body2">
                      <strong>Q0,max:</strong> {previewData.data.seismic.result.Q0Max?.toFixed(2)} kN
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* CÃ¡lculos Estructurales */}
              {previewData.data.structural && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      CÃ¡lculos Estructurales
                    </Typography>

                    {/* Pilar de HormigÃ³n Armado */}
                    {previewData.data.structural.concreteColumn && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Pilar de HormigÃ³n Armado (ACI318)
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Capacidad Axial:</strong> {previewData.data.structural.concreteColumn.axialCapacity?.toFixed(2)} kN
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Ratio de UtilizaciÃ³n:</strong> {(previewData.data.structural.concreteColumn.axialCapacityRatio * 100)?.toFixed(1)}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Refuerzo Longitudinal:</strong> {previewData.data.structural.concreteColumn.longitudinalSteel?.numBars} Ï†{previewData.data.structural.concreteColumn.longitudinalSteel?.barDiameter}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Estribos:</strong> Ï†{previewData.data.structural.concreteColumn.transverseSteel?.diameter} @ {previewData.data.structural.concreteColumn.transverseSteel?.spacing} mm
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Esbeltez:</strong> {previewData.data.structural.concreteColumn.slendernessRatio?.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              <strong>Â¿Es Esbelto?:</strong> {previewData.data.structural.concreteColumn.isSlender ? "SÃ­" : "No"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadDocument(previewData?.id)}
          >
            Descargar Documento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para guardado automÃ¡tico */}
      <Snackbar
        open={autoSaveSnackbar}
        autoHideDuration={3000}
        onClose={() => setAutoSaveSnackbar(false)}
        message="Guardado automÃ¡ticamente en el historial"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  );
};

export default ProjectDesignBasesPage;



