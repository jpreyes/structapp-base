import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useMutation } from "@tanstack/react-query";

import apiClient from "../api/client";
import { useDesignBaseOptions } from "../hooks/useDesignBaseOptions";

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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const liveLoadMutation = useMutation({
    mutationFn: async (payload: { buildingType: string; usage: string }) => {
      const { data } = await apiClient.post<LiveLoadResponse>("/design-bases/live-load", payload);
      return data;
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
      const { data } = await apiClient.post<WindResponse>("/design-bases/wind", payload);
      return data;
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
      const { data } = await apiClient.post<SnowResponse>("/design-bases/snow", payload);
      return data;
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
      const { data } = await apiClient.post<SeismicResponse>("/design-bases/seismic", payload);
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
    return payload;
  };

  const handleExport = async (format: "csv" | "docx" | "pdf") => {
    setExportError(null);
    const payload = buildExportPayload();
    if (!Object.keys(payload).length) {
      setExportError("Genera al menos un cálculo antes de exportar.");
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
      setExportError(getErrorMessage(error) ?? "No se pudo generar la exportación.");
    } finally {
      setExporting(false);
    }
  };

  const handleAddStory = () => {
    const nextId = stories.length ? Math.max(...stories.map((s) => s.id)) + 1 : 1;
    setStories([...stories, { id: nextId, height: "3.0", weight: "300" }]);
  };

  const handleRemoveStory = (id: number) => {
    if (stories.length <= 1) return;
    setStories(stories.filter((story) => story.id != id));
  };

  const handleStoryChange = (id: number, field: "height" | "weight", value: string) => {
    setStories((prev) => prev.map((story) => (story.id === id ? { ...story, [field]: value } : story)));
  };

  useEffect(() => {
    if (!liveLoadMutation.data) {
      return;
    }
    const candidate =
      liveLoadMutation.data.uniformLoad ??
      (liveLoadMutation.data.uniformLoadRaw && Number(liveLoadMutation.data.uniformLoadRaw));
    if (candidate != null && !Number.isNaN(candidate)) {
      setManualBaseLoad(candidate.toString());
    }
  }, [liveLoadMutation.data]);

  const baseUniformLoad =
    liveLoadMutation.data?.uniformLoad ??
    (liveLoadMutation.data?.uniformLoadRaw ? Number(liveLoadMutation.data.uniformLoadRaw) : undefined);
  const baseLoadValue = manualBaseLoad !== "" ? Number(manualBaseLoad) : undefined;

  if (optionsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <Typography>Cargando catálogos...</Typography>
      </Box>
    );
  }

  if (isError || !options) {
    return (
      <Alert severity="error">
        No se pudieron recuperar las opciones base. Verifica la API e inténtalo nuevamente.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" gutterBottom>
        Bases de cálculo y cargas de diseño
      </Typography>

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
                <Alert severity="error">No se encontró la combinación seleccionada.</Alert>
              )}
              {liveLoadMutation.data && (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                  <Typography color="text.secondary">Carga uniforme</Typography>
                  <Typography>
                    {liveLoadMutation.data.uniformLoad ?? liveLoadMutation.data.uniformLoadRaw} kN/m²
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
              <Typography variant="h6">Reducción por área tributaria (NCh1537)</Typography>
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
                label="Área tributaria (m²)"
                type="number"
                value={tributaryArea}
                onChange={(event) => setTributaryArea(event.target.value)}
                fullWidth
              />
              <TextField
                label="Carga base (kN/m²)"
                type="number"
                value={manualBaseLoad}
                onChange={(event) => setManualBaseLoad(event.target.value)}
                helperText={
                  baseUniformLoad
                    ? `Valor sugerido según catálogo: ${baseUniformLoad.toFixed(2)}`
                    : "Ingresa la carga uniforme que deseas reducir."
                }
                fullWidth
              />
              <Button
                variant="contained"
                onClick={() => {
                  const areaValue = Number(tributaryArea);
                  const baseLoadValue =
                    manualBaseLoad !== "" ? Number(manualBaseLoad) : baseUniformLoad ?? Number.NaN;
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
                  Carga reducida: {liveLoadReductionMutation.data.reducedLoad.toFixed(3)} kN/m²
                </Alert>
              )}
              {liveLoadReductionMutation.isError && (
                <Alert severity="error">No fue posible calcular la reducción.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h6">Presión de viento (NCh432)</Typography>
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
                    ? `q = ${windMutation.data.q.toFixed(3)} kN/m²`
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
                    label="Latitud (°)"
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
                    label="Condición térmica"
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
                    label="Categoría de importancia"
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
                    label="Categoría de exposición"
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
                    label="Condición de exposición"
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
                    label="Inclinación (°)"
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
                <Alert severity="error">No hay datos para la combinación seleccionada.</Alert>
              )}
              {snowMutation.data && (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 1 }}>
                  <Typography color="text.secondary">Pg (kN/m²)</Typography>
                  <Typography>{snowMutation.data.pg.toFixed(2)}</Typography>
                  <Typography color="text.secondary">ct</Typography>
                  <Typography>{snowMutation.data.ct.toFixed(2)}</Typography>
                  <Typography color="text.secondary">ce</Typography>
                  <Typography>{snowMutation.data.ce.toFixed(2)}</Typography>
                  <Typography color="text.secondary">I</Typography>
                  <Typography>{snowMutation.data.I.toFixed(2)}</Typography>
                  <Typography color="text.secondary">cs</Typography>
                  <Typography>{snowMutation.data.cs.toFixed(3)}</Typography>
                  <Typography color="text.secondary">pf (kN/m²)</Typography>
                  <Typography>{snowMutation.data.pf.toFixed(3)}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h6">Análisis sísmico base (NCh433)</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Categoría estructural"
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
                label="Zona sísmica"
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
                label="Peso sísmico total (kN)"
                type="number"
                value={psValue}
                onChange={(event) => setPsValue(event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Período Tx (s)"
                type="number"
                value={txValue}
                onChange={(event) => setTxValue(event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Período Ty (s)"
                type="number"
                value={tyValue}
                onChange={(event) => setTyValue(event.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="R₀ (deriva)"
                type="number"
                value={r0Value}
                onChange={(event) => setR0Value(event.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography variant="subtitle1">Distribución de niveles</Typography>
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
              {seismicErrorMessage ?? "Verifica los valores ingresados; no se pudo calcular el análisis."}
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
              </Box>
              <Typography variant="subtitle2">Distribución de fuerzas por nivel</Typography>
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
              <Typography variant="subtitle2">Espectro de diseño (Sa)</Typography>
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
    </Box>
  );
};

export default ProjectDesignBasesPage;
