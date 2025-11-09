import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
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
import { useCalculationRuns, CalculationRun } from "../hooks/useCalculationRuns";
import { useDesignBaseOptions } from "../hooks/useDesignBaseOptions";
type EditableRun = CalculationRun & { calc_run_id?: string; isDraft?: boolean };
import { useSession } from "../store/useSession";
import { useSetCriticalElement, useUnsetCriticalElement } from "../hooks/useStructuralCalcs";
import apiClient from "../api/client";

type CalculationType = {
  id: string;
  label: string;
  description: string;
};

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

const creationRoutes: Record<string, string> = {
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

const buildDefaultEditingValues = (typeId: string): Record<string, string> => {
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

const buildDefaultStoriesForType = (typeId: string) => (typeId === "seismic" ? defaultSeismicStories() : []);

const calculationTypes: CalculationType[] = [
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

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(sessionProjectId);
  const [selectedCalculations, setSelectedCalculations] = useState<Record<string, string[]>>(() => {
  const key = selectedProjectId ? `docSelection:${selectedProjectId}` : null;
  if (key) {
    try { const saved = localStorage.getItem(key); if (saved) return JSON.parse(saved); } catch {}
  }
  return {};
});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRun, setEditingRun] = useState<EditableRun | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [editingStories, setEditingStories] = useState<Array<{ id: number; height: string; weight: string }>>([]);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [editingLoading, setEditingLoading] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

  const projectOptions = useMemo(() => projects ?? [], [projects]);
  const typeLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    calculationTypes.forEach((type) => {
      map[type.id] = type.label;
    });
    return map;
  }, []);

  const normalizeElementType = (typeId: string) => (typeId === "live_load_reduction" ? "reduction" : typeId);
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
        buildingType: (editingRun.input_json?.buildingType as string) ?? "",
        usage: (editingRun.input_json?.usage as string) ?? "",
      });
      setEditingStories([]);
    } else if (normalized === "reduction") {
      const tributary = editingRun.input_json?.tributaryArea ?? editingRun.input_json?.tributary_area ?? "";
      const base = editingRun.input_json?.baseLoad ?? editingRun.input_json?.base_load ?? "";
      setEditingValues({
        elementType: (editingRun.input_json?.elementType as string) ?? "",
        tributaryArea: tributary !== undefined && tributary !== null ? String(tributary) : "",
        baseLoad: base !== undefined && base !== null ? String(base) : "",
      });
      setEditingStories([]);
    } else if (normalized === "building_description") {
      const areaValue = editingRun.input_json?.area as string | number | undefined;
      const heightValue = editingRun.input_json?.height as string | number | undefined;
      setEditingValues({
        text: (editingRun.input_json?.text as string) ?? "",
        location: (editingRun.input_json?.location as string) ?? "",
        area: areaValue !== undefined && areaValue !== null ? String(areaValue) : "",
        height: heightValue !== undefined && heightValue !== null ? String(heightValue) : "",
      });
      setEditingStories([]);
    } else if (normalized === "wind_load") {
      const heightValue = editingRun.input_json?.height as number | undefined;
      setEditingValues({
        environment: (editingRun.input_json?.environment as string) ?? "",
        height: heightValue !== undefined && heightValue !== null ? String(heightValue) : "",
      });
      setEditingStories([]);
    } else if (normalized === "snow_load") {
      const roofValue = editingRun.input_json?.roofPitch as number | undefined;
      setEditingValues({
        latitudeBand: (editingRun.input_json?.latitudeBand as string) ?? "",
        altitudeBand: (editingRun.input_json?.altitudeBand as string) ?? "",
        thermalCondition: (editingRun.input_json?.thermalCondition as string) ?? "",
        importanceCategory: (editingRun.input_json?.importanceCategory as string) ?? "",
        exposureCategory: (editingRun.input_json?.exposureCategory as string) ?? "",
        exposureCondition: (editingRun.input_json?.exposureCondition as string) ?? "",
        surfaceType: (editingRun.input_json?.surfaceType as string) ?? "",
        roofPitch: roofValue !== undefined && roofValue !== null ? String(roofValue) : "",
      });
      setEditingStories([]);
    } else if (normalized === "seismic") {
      const rsValue = editingRun.input_json?.rs as number | undefined;
      const psValue = editingRun.input_json?.ps as number | undefined;
      const txValue = editingRun.input_json?.tx as number | undefined;
      const tyValue = editingRun.input_json?.ty as number | undefined;
      const r0Value = editingRun.input_json?.r0 as number | undefined;
      setEditingValues({
        category: (editingRun.input_json?.category as string) ?? "",
        zone: (editingRun.input_json?.zone as string) ?? "",
        soil: (editingRun.input_json?.soil as string) ?? "",
        rs: rsValue !== undefined && rsValue !== null ? String(rsValue) : "",
        ps: psValue !== undefined && psValue !== null ? String(psValue) : "",
        tx: txValue !== undefined && txValue !== null ? String(txValue) : "",
        ty: tyValue !== undefined && tyValue !== null ? String(tyValue) : "",
        r0: r0Value !== undefined && r0Value !== null ? String(r0Value) : "",
      });
      const storiesInput = Array.isArray(editingRun.input_json?.stories)
        ? (editingRun.input_json?.stories as Array<{ height?: number; weight?: number }>)
        : [];
      if (storiesInput.length) {
        setEditingStories(
          storiesInput.map((story, index) => ({
            id: index + 1,
            height: story.height !== undefined && story.height !== null ? String(story.height) : "",
            weight: story.weight !== undefined && story.weight !== null ? String(story.weight) : "",
          }))
        );
      } else {
        setEditingStories(defaultSeismicStories());
      }
    } else {
      setEditingValues({});
      setEditingStories([]);
    }
    setEditingError(null);
  }, [editingRun]);

  // Agrupar cÃ¡lculos por tipo
  const groupedCalculations = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    calculationTypes.forEach((type) => {
      grouped[type.id] = runs.filter((run) => normalizeElementType(run.element_type) === type.id);
    });
    return grouped;
  }, [runs]);

  const handleToggleCalculation = (typeId: string, runId: string) => {
    setSelectedCalculations((prev) => {
      const current = prev[typeId] || [];
      const isSelected = current.includes(runId);

      return {
        ...prev,
        [typeId]: isSelected ? current.filter((id) => id !== runId) : [...current, runId],
      };
    });
  };

  const handleToggleAllType = (typeId: string, checked: boolean) => {
    setSelectedCalculations((prev) => ({
      ...prev,
      [typeId]: checked ? groupedCalculations[typeId].map((run) => run.id) : [],
    }));
  };

  const handleCreateCalculation = (typeId: string) => {
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
      const draft: EditableRun = {
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

  const removeRunFromSelections = (runId: string) => {
    setSelectedCalculations((prev) => {
      const next: Record<string, string[]> = {};
      Object.entries(prev).forEach(([key, ids]) => {
        const filtered = ids.filter((id) => id !== runId);
        if (filtered.length) {
          next[key] = filtered;
        }
      });
      return next;
    });
  };

  const handleStartEditing = (run: EditableRun) => {
    setEditingRun(run);
    setEditingError(null);
  };

  const handleCloseEditor = () => {
    setEditingRun(null);
    setEditingValues({});
    setEditingStories([]);
    setEditingError(null);
  };

  const isDraftRun = (run?: EditableRun | null) => Boolean(run?.isDraft);

  const handleEditingValueChange = (field: string, value: string) => {
    setEditingValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditingStoryChange = (id: number, field: "height" | "weight", value: string) => {
    setEditingStories((prev) => prev.map((story) => (story.id === id ? { ...story, [field]: value } : story)));
  };

  const handleAddEditingStory = () => {
    setEditingStories((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((story) => story.id)) + 1 : 1;
      const last = prev[prev.length - 1];
      return [...prev, { id: nextId, height: last?.height ?? "3.0", weight: last?.weight ?? "300" }];
    });
  };

  const handleRemoveEditingStory = (id: number) => {
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
      if (
        !editingValues.latitudeBand ||
        !editingValues.altitudeBand ||
        !editingValues.thermalCondition ||
        !editingValues.importanceCategory ||
        !editingValues.exposureCategory ||
        !editingValues.exposureCondition ||
        !editingValues.surfaceType
      ) {
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
      if (
        !Number.isFinite(rsValue) ||
        !Number.isFinite(psValue) ||
        !Number.isFinite(txValue) ||
        !Number.isFinite(tyValue) ||
        !Number.isFinite(r0Value) ||
        rsValue <= 0 ||
        psValue <= 0 ||
        txValue <= 0 ||
        tyValue <= 0 ||
        r0Value <= 0
      ) {
        return null;
      }
      if (!editingStories.length) {
        return null;
      }
      const storiesPayload = editingStories.map((story) => ({
        height: Number(story.height),
        weight: Number(story.weight),
      }));
      if (
        storiesPayload.some(
          (story) =>
            !Number.isFinite(story.height) || story.height <= 0 || !Number.isFinite(story.weight) || story.weight <= 0
        )
      ) {
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

  const createDraftCalculation = async (normalizedType: string, payload: Record<string, unknown>) => {
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
      } else {
        const targetId = editingRun.calc_run_id ?? editingRun.id;
        await apiClient.put(`/calculations/runs/${targetId}`, payload);
      }
      await queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId], exact: true });
      handleCloseEditor();
    } catch (err) {
      setEditingError(getErrorMessage(err) ?? defaultMessage);
    } finally {
      setEditingLoading(false);
    }
  };

  const handleDeleteRun = async (run: EditableRun | null) => {
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
    } catch (err) {
      const message = getErrorMessage(err) ?? "No se pudo eliminar el cálculo";
      if (editingRun?.id === run.id) {
        setEditingError(message);
      } else {
        setError(message);
      }
    } finally {
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
        return <Alert severity="info" sx={{ mt: 2 }}>Cargando cat�logos...</Alert>;
      }
      const buildingTypes = Object.keys(designOptions.liveLoadCategories || {});
      const usageOptionsForEdit = editingValues.buildingType
        ? designOptions.liveLoadCategories[editingValues.buildingType] || []
        : [];
      return (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            select
            label="Tipo de edificio"
            value={editingValues.buildingType ?? ""}
            onChange={(event) => handleEditingValueChange("buildingType", event.target.value)}
            fullWidth
          >
            {buildingTypes.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Uso / recinto"
            value={editingValues.usage ?? ""}
            onChange={(event) => handleEditingValueChange("usage", event.target.value)}
            fullWidth
            disabled={!editingValues.buildingType}
          >
            {usageOptionsForEdit.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      );
    }
    if (normalized === "building_description") {
      return (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Descripci�n del edificio"
            value={editingValues.text ?? ""}
            onChange={(event) => handleEditingValueChange("text", event.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            label="Ubicaci�n"
            value={editingValues.location ?? ""}
            onChange={(event) => handleEditingValueChange("location", event.target.value)}
            fullWidth
          />
          <TextField
            label="�rea total (m�)"
            type="number"
            value={editingValues.area ?? ""}
            onChange={(event) => handleEditingValueChange("area", event.target.value)}
            fullWidth
          />
          <TextField
            label="Altura (m)"
            type="number"
            value={editingValues.height ?? ""}
            onChange={(event) => handleEditingValueChange("height", event.target.value)}
            fullWidth
          />
        </Stack>
      );
    }
    if (normalized === "wind_load") {
      if (!designOptions) {
        return <Alert severity="info" sx={{ mt: 2 }}>Cargando cat�logos...</Alert>;
      }
      return (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            select
            label="Ambiente"
            value={editingValues.environment ?? ""}
            onChange={(event) => handleEditingValueChange("environment", event.target.value)}
            fullWidth
          >
            {designOptions.windEnvironments.map((env) => (
              <MenuItem key={env} value={env}>
                {env}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Altura sobre el terreno (m)"
            type="number"
            value={editingValues.height ?? ""}
            onChange={(event) => handleEditingValueChange("height", event.target.value)}
            fullWidth
          />
        </Stack>
      );
    }
    if (normalized === "snow_load") {
      if (!designOptions) {
        return <Alert severity="info" sx={{ mt: 2 }}>Cargando cat�logos...</Alert>;
      }
      const latitudeBand = editingValues.latitudeBand ?? "";
      const exposureCategory = editingValues.exposureCategory ?? "";
      const altitudeOptionsForLat = latitudeBand
        ? Object.keys(designOptions.snowLatitudeBands[latitudeBand] || {})
        : [];
      const exposureConditions = exposureCategory
        ? designOptions.snowExposureCategories[exposureCategory] || []
        : [];
      return (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Latitud"
                value={latitudeBand}
                onChange={(event) => {
                  handleEditingValueChange("latitudeBand", event.target.value);
                  handleEditingValueChange("altitudeBand", "");
                }}
                fullWidth
              >
                {Object.keys(designOptions.snowLatitudeBands || {}).map((lat) => (
                  <MenuItem key={lat} value={lat}>
                    {lat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Altitud"
                value={editingValues.altitudeBand ?? ""}
                onChange={(event) => handleEditingValueChange("altitudeBand", event.target.value)}
                fullWidth
                disabled={!latitudeBand}
              >
                {altitudeOptionsForLat.map((alt) => (
                  <MenuItem key={alt} value={alt}>
                    {alt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Condici�n t�rmica"
                value={editingValues.thermalCondition ?? ""}
                onChange={(event) => handleEditingValueChange("thermalCondition", event.target.value)}
                fullWidth
              >
                {designOptions.snowThermalConditions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Categor�a de importancia"
                value={editingValues.importanceCategory ?? ""}
                onChange={(event) => handleEditingValueChange("importanceCategory", event.target.value)}
                fullWidth
              >
                {designOptions.snowImportanceCategories.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Categor�a de exposici�n"
                value={exposureCategory}
                onChange={(event) => {
                  handleEditingValueChange("exposureCategory", event.target.value);
                  handleEditingValueChange("exposureCondition", "");
                }}
                fullWidth
              >
                {Object.keys(designOptions.snowExposureCategories || {}).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Condici�n de exposici�n"
                value={editingValues.exposureCondition ?? ""}
                onChange={(event) => handleEditingValueChange("exposureCondition", event.target.value)}
                fullWidth
                disabled={!exposureCategory}
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
                value={editingValues.surfaceType ?? ""}
                onChange={(event) => handleEditingValueChange("surfaceType", event.target.value)}
                fullWidth
              >
                {designOptions.snowSurfaceTypes.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Inclinaci�n (�)"
                type="number"
                value={editingValues.roofPitch ?? ""}
                onChange={(event) => handleEditingValueChange("roofPitch", event.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        </Stack>
      );
    }
    if (normalized === "seismic") {
      if (!designOptions) {
        return <Alert severity="info" sx={{ mt: 2 }}>Cargando cat�logos...</Alert>;
      }
      return (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Categor�a estructural"
                value={editingValues.category ?? ""}
                onChange={(event) => handleEditingValueChange("category", event.target.value)}
                fullWidth
              >
                {designOptions.seismicCategories.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Zona s�smica"
                value={editingValues.zone ?? ""}
                onChange={(event) => handleEditingValueChange("zone", event.target.value)}
                fullWidth
              >
                {designOptions.seismicZones.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Tipo de suelo"
                value={editingValues.soil ?? ""}
                onChange={(event) => handleEditingValueChange("soil", event.target.value)}
                fullWidth
              >
                {designOptions.seismicSoils.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Coeficiente R"
                type="number"
                value={editingValues.rs ?? ""}
                onChange={(event) => handleEditingValueChange("rs", event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Peso s�smico total (kN)"
                type="number"
                value={editingValues.ps ?? ""}
                onChange={(event) => handleEditingValueChange("ps", event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Periodo Tx (s)"
                type="number"
                value={editingValues.tx ?? ""}
                onChange={(event) => handleEditingValueChange("tx", event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Periodo Ty (s)"
                type="number"
                value={editingValues.ty ?? ""}
                onChange={(event) => handleEditingValueChange("ty", event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="R�'0 (deriva)"
                type="number"
                value={editingValues.r0 ?? ""}
                onChange={(event) => handleEditingValueChange("r0", event.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
          <Divider />
          <Typography variant="subtitle2">Distribuci�n de niveles</Typography>
          <Stack spacing={1}>
            {editingStories.map((story, index) => (
              <Stack key={story.id} direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Typography variant="body2">Nivel {index + 1}</Typography>
                <TextField
                  label="Altura (m)"
                  type="number"
                  value={story.height}
                  onChange={(event) => handleEditingStoryChange(story.id, "height", event.target.value)}
                  sx={{ minWidth: 140 }}
                />
                <TextField
                  label="Peso (kN)"
                  type="number"
                  value={story.weight}
                  onChange={(event) => handleEditingStoryChange(story.id, "weight", event.target.value)}
                  sx={{ minWidth: 140 }}
                />
                <IconButton onClick={() => handleRemoveEditingStory(story.id)} disabled={editingStories.length <= 1}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button startIcon={<AddIcon />} onClick={handleAddEditingStory} variant="outlined" sx={{ alignSelf: "flex-start" }}>
              Agregar nivel
            </Button>
          </Stack>
        </Stack>
      );
    }
    if (normalized === "reduction") {
      const elementOptions = designOptions?.liveLoadElementTypes || [];
      return (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            select
            label="Elemento estructural"
            value={editingValues.elementType ?? ""}
            onChange={(event) => handleEditingValueChange("elementType", event.target.value)}
            fullWidth
          >
            {elementOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="�rea tributaria (m�)"
            type="number"
            value={editingValues.tributaryArea ?? ""}
            onChange={(event) => handleEditingValueChange("tributaryArea", event.target.value)}
            fullWidth
          />
          <TextField
            label="Carga base (kN/m�)"
            type="number"
            value={editingValues.baseLoad ?? ""}
            onChange={(event) => handleEditingValueChange("baseLoad", event.target.value)}
            fullWidth
          />
        </Stack>
      );
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

      const response = await apiClient.post(
        "/design-bases/runs/generate-from-calculations",
        {
          projectId: selectedProjectId,
          calculationIds: selectedRunIds,
          name: currentProjectName,
        },
        { responseType: "blob" }
      );

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
    } catch (err: any) {
      console.error("Error generando documento:", err);
      setError(err?.response?.data?.detail || "Error al generar el documento");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleCritical = async (runId: string, elementType: string, currentIsCritical: boolean) => {
    try {
      console.log("Toggling critical element:", { runId, elementType, currentIsCritical });

      let result;
      if (currentIsCritical) {
        result = await unsetCriticalMutation.mutateAsync(runId);
        console.log("Unset critical result:", result);
      } else {
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
      queryClient.setQueryData<CalculationRun[]>(
        ["calculation-runs", selectedProjectId],
        (oldData) => {
          if (!oldData) return oldData;

          console.log("Updating cache, old data:", oldData);

          // Si se estÃ¡ marcando como crÃ­tico, desmarcar otros del mismo tipo
          const updatedData = oldData.map((run) => {
            if (run.id === runId) {
              // Este es el elemento que se modificÃ³
              return { ...run, is_critical: result.run.is_critical };
            } else if (run.element_type === elementType && !currentIsCritical) {
              // Si estamos marcando uno como crÃ­tico, desmarcar los demÃ¡s del mismo tipo
              return { ...run, is_critical: false };
            }
            return run;
          });

          console.log("Cache updated, new data:", updatedData);
          return updatedData;
        }
      );

      console.log("Cache manually updated");
    } catch (error) {
      console.error("Error toggling critical element:", error);
      setError("Error al marcar elemento crÃ­tico. Verifica que la base de datos tenga la columna 'is_critical'.");

      // Refrescar desde el servidor en caso de error
      await queryClient.refetchQueries({
        queryKey: ["calculation-runs", selectedProjectId],
        exact: true
      });
    }
  };

  const effectiveProjectName =
    projectOptions.find((project) => project.id === selectedProjectId)?.name ?? "Sin proyecto";

  const getColumns = (typeId: string): GridColDef[] => [
    {
      field: "selected",
      headerName: "",
      width: 50,
      renderCell: (params) => (
        <Checkbox
          checked={selectedCalculations[typeId]?.includes(params.row.id) || false}
          onChange={() => handleToggleCalculation(typeId, params.row.id)}
        />
      ),
    },
    {
      field: "is_critical",
      headerName: "",
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Box
          onClick={(e) => {
            e.stopPropagation();
            handleToggleCritical(params.row.id, typeId, params.row.is_critical || false);
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            "&:hover": {
              transform: "scale(1.1)",
            },
            transition: "transform 0.2s",
          }}
        >
          {params.row.is_critical ? (
            <StarIcon color="warning" titleAccess="Elemento crÃ­tico para reportes" />
          ) : (
            <StarBorderIcon color="action" titleAccess="Marcar como crÃ­tico" />
          )}
        </Box>
      ),
    },
    {
      field: "created_at",
      headerName: "Fecha",
      width: 150,
      valueFormatter: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "â€”"),
    },
    { field: "summary", headerName: "Resumen", flex: 1, minWidth: 250 },
    {
      field: "actions",
      headerName: "",
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleStartEditing(params.row as EditableRun);
            }}
          >
            <EditIcon fontSize="inherit" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRun(params.row as CalculationRun);
            }}
            disabled={deletingRunId === params.row.id}
          >
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const getSummary = (run: any): string => {
    const result = run.result_json;
    const inputs = run.input_json;

    switch (run.element_type) {
      case "building_description": {
        const parts = [];
        if (result?.text) parts.push(result.text.substring(0, 50) + (result.text.length > 50 ? "..." : ""));
        if (result?.location) parts.push(`ðŸ“ ${result.location}`);
        if (result?.area) parts.push(`ðŸ“ ${result.area} mÂ²`);
        if (result?.height) parts.push(`ðŸ“ ${result.height} m`);
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5">DocumentaciÃ³n del proyecto</Typography>
        <TextField
          select
          label="Proyecto"
          size="small"
          value={selectedProjectId ?? ""}
          onChange={(event) => {
            setSelectedProjectId(event.target.value);
            setProjectInSession(event.target.value);
            setSelectedCalculations({});
          }}
          sx={{ minWidth: 220 }}
        >
          {projectOptions.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {!selectedProjectId && (
        <Alert severity="info">
          Selecciona un proyecto para ver los cÃ¡lculos disponibles y generar la memoria de cÃ¡lculo.
        </Alert>
      )}

      {selectedProjectId && (
        <>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Generar Memoria de CÃ¡lculo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Selecciona los cÃ¡lculos que deseas incluir en el documento Word. Puedes elegir mÃºltiples cÃ¡lculos de
                    cada tipo.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleGenerateDocument}
                  disabled={generating || totalSelected === 0}
                >
                  {generating ? "Generando..." : `Generar Word (${totalSelected})`}
                </Button>
              </Stack>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>

          {calculationTypes.map((type) => {
        const calculations = groupedCalculations[type.id] || [];
        const selectedCount = selectedCalculations[type.id]?.length || 0;
        const allSelected = calculations.length > 0 && selectedCount === calculations.length;
        const someSelected = selectedCount > 0 && selectedCount < calculations.length;
        const creationRoute = creationRoutes[type.id];

        return (
          <Card key={type.id}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <DescriptionIcon color="primary" />
                <Box flex={1}>
                  <Typography variant="h6">{type.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleCreateCalculation(type.id)}
                  disabled={!creationRoute}
                  title="Agregar cálculo"
                >
                  <AddIcon fontSize="inherit" />
                </IconButton>
                {calculations.length > 0 && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={(e) => handleToggleAllType(type.id, e.target.checked)}
                      />
                    }
                    label={`Seleccionar todos (${calculations.length})`}
                  />
                )}
              </Stack>

              {calculations.length === 0 ? (
                <Alert severity="info">
                  No hay cálculos de este tipo en el proyecto actual. Ve a las páginas correspondientes para crear
                  cálculos.
                </Alert>
              ) : (
                <DataGrid
                  autoHeight
                  rows={calculations.map((run) => ({
                    ...run,
                    calc_run_id: run.id,
                    summary: getSummary(run),
                    is_critical: run.is_critical ?? false,
                  }))}
                  columns={getColumns(type.id)}
                  loading={runsLoading}
                  hideFooter
                  disableRowSelectionOnClick
                  sx={{
                    "& .MuiDataGrid-columnHeaders": {
                      fontWeight: 600,
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        );
      })}

      {editingRun && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1300,
            width: { xs: "calc(100% - 32px)", sm: 420 },
            maxWidth: "100%",
          }}
        >
          <Card elevation={6}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">
                    {isDraftEditing ? "Nuevo cálculo" : "Editar cálculo"}: {typeLabelMap[normalizeElementType(editingRun.element_type)] || editingRun.element_type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isDraftEditing ? "Completa los datos y crea un nuevo registro." : "Actualiza los datos del cálculo seleccionado o elimínalo del historial."}
                  </Typography>
                </Box>
                <IconButton onClick={handleCloseEditor}>
                  <CloseIcon />
                </IconButton>
              </Stack>
              {["live_load", "reduction", "building_description"].includes(normalizeElementType(editingRun.element_type)) ? (
                <>
                  {renderEditingFields()}
                  {editingError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {editingError}
                    </Alert>
                  )}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleSaveEditing}
                      disabled={!canSaveEditing() || editingLoading}
                    >
                      {editingLoading
                        ? isDraftEditing
                          ? "Creando..."
                          : "Guardando..."
                        : isDraftEditing
                          ? "Crear cálculo"
                          : "Guardar cambios"}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteRun(editingRun)}
                      disabled={isDraftEditing || deletingRunId === editingRun?.id}
                    >
                      {deletingRunId === editingRun?.id ? "Eliminando..." : "Eliminar cálculo"}
                    </Button>
                  </Stack>
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Este tipo de cálculo aún no se puede editar desde esta pantalla.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
        </>
      )}
    </Box>
  );
};

export default ProjectDocumentationPage;








