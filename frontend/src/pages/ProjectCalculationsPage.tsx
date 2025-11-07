import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import DownloadIcon from "@mui/icons-material/Download";
import CalculateIcon from "@mui/icons-material/Calculate";
import HistoryIcon from "@mui/icons-material/History";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";
import { useCalculationRuns, CalculationRun } from "../hooks/useCalculationRuns";
import {
  useConcreteColumn,
  useConcreteBeam,
  ConcreteColumnResponse,
  ConcreteBeamResponse,
} from "../hooks/useStructuralCalcs";

type RCBeamForm = {
  positiveMoment: number;
  negativeMoment: number;
  maxShear: number;
  width: number;
  height: number;
  span: number;
  fc: number;
  fy: number;
};

type RCColumnForm = {
  axialLoad: number;
  momentX: number;
  momentY: number;
  shearX: number;
  shearY: number;
  width: number;
  depth: number;
  length: number;
  fc: number;
  fy: number;
};

type CalculationType = {
  value: string;
  label: string;
  description: string;
  implemented: boolean;
};

const calculationTypes: CalculationType[] = [
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
    implemented: false,
  },
  {
    value: "steel_beam",
    label: "Viga de Acero (AISC360)",
    description: "Vigas de acero estructural según perfiles estándar y AISC360.",
    implemented: false,
  },
  {
    value: "wood_column",
    label: "Pilar de Madera (NCh1198)",
    description: "Pilares de madera según normativa chilena NCh1198.",
    implemented: false,
  },
  {
    value: "wood_beam",
    label: "Viga de Madera (NCh1198)",
    description: "Vigas de madera dimensionada y laminada según NCh1198.",
    implemented: false,
  },
  {
    value: "footing",
    label: "Zapatas (ACI318)",
    description: "Zapatas aisladas y corridas de hormigón armado según ACI318.",
    implemented: false,
  },
];

const defaultBeamForm: RCBeamForm = {
  positiveMoment: 150,
  negativeMoment: 180,
  maxShear: 80,
  width: 30,
  height: 50,
  span: 6.0,
  fc: 25,
  fy: 420,
};

const defaultColumnForm: RCColumnForm = {
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

const ProjectCalculationsPage = () => {
  const { data: projects } = useProjects();
  const sessionProjectId = useSession((state) => state.projectId);
  const setProjectInSession = useSession((state) => state.setProject);
  const user = useSession((state) => state.user);

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(sessionProjectId);
  const [selectedType, setSelectedType] = useState<string>("rc_beam");
  const [beamForm, setBeamForm] = useState<RCBeamForm>(defaultBeamForm);
  const [columnForm, setColumnForm] = useState<RCColumnForm>(defaultColumnForm);
  const [result, setResult] = useState<ConcreteBeamResponse | ConcreteColumnResponse | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);

  const queryClient = useQueryClient();

  const projectOptions = useMemo(() => projects ?? [], [projects]);
  const typeMap = useMemo(
    () => Object.fromEntries(calculationTypes.map((item) => [item.value, item])),
    []
  );
  const currentType = typeMap[selectedType] ?? calculationTypes[0];

  const { data: runs = [], isFetching: runsLoading } = useCalculationRuns(selectedProjectId);

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

  const handleSubmitBeam = (event: React.FormEvent) => {
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

  const handleSubmitColumn = (event: React.FormEvent) => {
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

  const handleDownloadReport = () => {
    if (!runId) return;
    const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";
    const url = `${baseURL.replace(/\/$/, "")}/calculations/rc-beam/${runId}/report`;
    window.open(url, "_blank", "noopener");
  };

  const loadRunIntoForm = useCallback(
    (run: CalculationRun) => {
      setSelectedType(run.element_type);
      setRunId(run.id);
      setSelectionModel([run.id]);
      if (run.element_type === "rc_beam") {
        const inputs = run.input_json as any;
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
        setResult(run.result_json as ConcreteBeamResponse);
      } else if (run.element_type === "rc_column") {
        const inputs = run.input_json as any;
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
        setResult(run.result_json as ConcreteColumnResponse);
      } else {
        setResult(null);
      }
    },
    []
  );

  const handleRowClick = useCallback(
    (runId: string) => {
      const run = runs.find((item) => item.id === runId);
      if (run) {
        loadRunIntoForm(run);
      }
    },
    [loadRunIntoForm, runs]
  );

  const calculationRows = useMemo(
    () =>
      (runs ?? []).map((run) => {
        const type = typeMap[run.element_type];
        let summary = "Disponible próximamente";

        // Generar resumen según tipo de cálculo
        if (run.element_type === "rc_column") {
          const result = run.result_json as any;
          const longSteel = result?.longitudinalSteel;
          const transSteel = result?.transverseSteel;

          if (longSteel && transSteel) {
            summary = `${longSteel.numBars}φ${longSteel.barDiameter} (${Math.round(longSteel.totalArea)}mm²), Est φ${transSteel.diameter}@${transSteel.spacing}mm`;
          }
        } else if (run.element_type === "rc_beam") {
          const result = run.result_json as any;
          const posReinf = result?.positiveReinforcemenet || result?.positiveReinforcement;
          const negReinf = result?.negativeReinforcement;
          const transSteel = result?.transverseSteel;

          if (posReinf && negReinf && transSteel) {
            summary = `Sup: ${negReinf.numBars}φ${negReinf.barDiameter}, Inf: ${posReinf.numBars}φ${posReinf.barDiameter}, Est φ${transSteel.diameter}@${transSteel.spacing}mm`;
          }
        }

        return {
          id: run.id,
          created_at: run.created_at ? dayjs(run.created_at).format("DD/MM/YYYY HH:mm") : "—",
          element_type: type?.label ?? run.element_type,
          summary,
        };
      }),
    [runs, typeMap]
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "created_at", headerName: "Fecha", width: 170 },
      { field: "element_type", headerName: "Tipo de cálculo", width: 220 },
      { field: "summary", headerName: "Resumen", flex: 1, minWidth: 280 },
    ],
    []
  );

  const effectiveProjectName =
    projectOptions.find((project) => project.id === selectedProjectId)?.name ?? "Sin proyecto";

  const typeDisabledReason = !currentType.implemented
    ? "Este tipo de cálculo estará disponible en futuras versiones."
    : !selectedProjectId
    ? "Selecciona un proyecto activo para ejecutar cálculos."
    : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5">Cálculos estructurales</Typography>
        <TextField
          select
          label="Proyecto"
          size="small"
          value={selectedProjectId ?? ""}
          onChange={(event) => {
            setSelectedProjectId(event.target.value);
            setProjectInSession(event.target.value);
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
          Debes crear un proyecto para poder guardar los cálculos realizados.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tipo de cálculo
              </Typography>
              <TextField
                select
                fullWidth
                label="Selecciona un cálculo"
                value={selectedType}
                onChange={(event) => {
                  setSelectedType(event.target.value);
                  setResult(null);
                  setRunId(null);
                }}
                sx={{ mb: 2 }}
              >
                {calculationTypes.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label} {item.implemented ? "" : " (próximamente)"}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="body2" color="text.secondary">
                {currentType.description}
              </Typography>
              {!currentType.implemented && (
                <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mt: 2 }}>
                  Estamos preparando este módulo para cubrir casos de diseño habituales. Tu retroalimentación es
                  bienvenida.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Parámetros de diseño
              </Typography>

              {currentType.value === "rc_beam" ? (
                <form onSubmit={handleSubmitBeam}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Momentos y cortante
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Momento positivo (kN·m)"
                        type="number"
                        value={beamForm.positiveMoment}
                        onChange={(event) =>
                          setBeamForm((prev) => ({ ...prev, positiveMoment: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ step: 0.1 }}
                        fullWidth
                      />
                      <TextField
                        label="Momento negativo (kN·m)"
                        type="number"
                        value={beamForm.negativeMoment}
                        onChange={(event) =>
                          setBeamForm((prev) => ({ ...prev, negativeMoment: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ step: 0.1 }}
                        fullWidth
                      />
                      <TextField
                        label="Cortante máximo (kN)"
                        type="number"
                        value={beamForm.maxShear}
                        onChange={(event) =>
                          setBeamForm((prev) => ({ ...prev, maxShear: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ step: 0.1 }}
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Geometría
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Ancho (cm)"
                        type="number"
                        value={beamForm.width}
                        onChange={(event) =>
                          setBeamForm((prev) => ({ ...prev, width: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                      <TextField
                        label="Altura (cm)"
                        type="number"
                        value={beamForm.height}
                        onChange={(event) =>
                          setBeamForm((prev) => ({ ...prev, height: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                      <TextField
                        label="Luz (m)"
                        type="number"
                        value={beamForm.span}
                        onChange={(event) =>
                          setBeamForm((prev) => ({ ...prev, span: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 0.1 }}
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Materiales
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="f'c (MPa)"
                        type="number"
                        value={beamForm.fc}
                        onChange={(event) =>
                          setBeamForm((prev) => ({ ...prev, fc: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                      <TextField
                        label="fy (MPa)"
                        type="number"
                        value={beamForm.fy}
                        onChange={(event) =>
                          setBeamForm((prev) => ({ ...prev, fy: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 10 }}
                        fullWidth
                      />
                    </Stack>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        type="submit"
                        startIcon={<CalculateIcon />}
                        disabled={Boolean(typeDisabledReason) || concreteBeamMutation.isPending}
                      >
                        Calcular
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              ) : currentType.value === "rc_column" ? (
                <form onSubmit={handleSubmitColumn}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Esfuerzos
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Carga axial (kN)"
                        type="number"
                        value={columnForm.axialLoad}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, axialLoad: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ step: 0.1 }}
                        fullWidth
                      />
                      <TextField
                        label="Momento X (kN·m)"
                        type="number"
                        value={columnForm.momentX}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, momentX: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ step: 0.1 }}
                        fullWidth
                      />
                      <TextField
                        label="Momento Y (kN·m)"
                        type="number"
                        value={columnForm.momentY}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, momentY: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ step: 0.1 }}
                        fullWidth
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Cortante X (kN)"
                        type="number"
                        value={columnForm.shearX}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, shearX: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ step: 0.1 }}
                        fullWidth
                      />
                      <TextField
                        label="Cortante Y (kN)"
                        type="number"
                        value={columnForm.shearY}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, shearY: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ step: 0.1 }}
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Geometría
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Ancho (cm)"
                        type="number"
                        value={columnForm.width}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, width: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                      <TextField
                        label="Profundidad (cm)"
                        type="number"
                        value={columnForm.depth}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, depth: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                      <TextField
                        label="Altura (m)"
                        type="number"
                        value={columnForm.length}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, length: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 0.1 }}
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Materiales
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="f'c (MPa)"
                        type="number"
                        value={columnForm.fc}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, fc: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                      <TextField
                        label="fy (MPa)"
                        type="number"
                        value={columnForm.fy}
                        onChange={(event) =>
                          setColumnForm((prev) => ({ ...prev, fy: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 10 }}
                        fullWidth
                      />
                    </Stack>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        type="submit"
                        startIcon={<CalculateIcon />}
                        disabled={Boolean(typeDisabledReason) || concreteColumnMutation.isPending}
                      >
                        Calcular
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              ) : (
                <Alert severity="info">
                  Este cálculo aún no está disponible. Puedes revisar el historial existente o seleccionar otro tipo.
                </Alert>
              )}

              {typeDisabledReason && (currentType.value === "rc_beam" || currentType.value === "rc_column") && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {typeDisabledReason}
                </Alert>
              )}

              {concreteBeamMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(concreteBeamMutation.error as any)?.response?.data?.detail ??
                    (concreteBeamMutation.error as Error)?.message ??
                    "Ocurrió un error al ejecutar el cálculo."}
                </Alert>
              )}

              {concreteColumnMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(concreteColumnMutation.error as any)?.response?.data?.detail ??
                    (concreteColumnMutation.error as Error)?.message ??
                    "Ocurrió un error al ejecutar el cálculo."}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resultados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Proyecto activo: {effectiveProjectName}
              </Typography>
              {result && "positiveReinforcemenet" in result ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                    Resultados del Diseño
                  </Typography>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Refuerzo Longitudinal Superior (Momento -)
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {result.negativeReinforcement.numBars} φ{result.negativeReinforcement.barDiameter} (
                      {result.negativeReinforcement.totalArea.toFixed(0)} mm²)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Refuerzo Longitudinal Inferior (Momento +)
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {result.positiveReinforcemenet.numBars} φ{result.positiveReinforcemenet.barDiameter} (
                      {result.positiveReinforcemenet.totalArea.toFixed(0)} mm²)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Estribos
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      φ{result.transverseSteel.diameter} @ {result.transverseSteel.spacing.toFixed(0)} mm
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Ratio de Corte
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {(result.shearCapacityRatio * 100).toFixed(1)}%
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Verificación de Deflexión
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {result.deflectionCheck}
                    </Typography>
                  </Box>
                </Stack>
              ) : result && "axialCapacity" in result ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                    Resultados del Diseño
                  </Typography>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Capacidad Axial
                    </Typography>
                    <Typography variant="h5">{result.axialCapacity.toFixed(2)} kN</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Ratio de Utilización
                    </Typography>
                    <Typography variant="h5">{(result.axialCapacityRatio * 100).toFixed(1)}%</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Refuerzo Longitudinal
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {result.longitudinalSteel.numBars} φ{result.longitudinalSteel.barDiameter} ({result.longitudinalSteel.totalArea.toFixed(0)} mm²)
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Estribos
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      φ{result.transverseSteel.diameter} @ {result.transverseSteel.spacing.toFixed(0)} mm
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Esbeltez
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {result.slendernessRatio.toFixed(2)} {result.isSlender ? "(Esbelto)" : "(No Esbelto)"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Factor de Magnificación
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {result.magnificationFactor.toFixed(3)}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ejecuta un cálculo o selecciona un registro del historial para visualizar los resultados.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <HistoryIcon color="primary" />
                <Typography variant="h6">Historial de cálculos</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Selecciona un cálculo previo para revisar los valores usados y volver a ejecutarlo con ajustes.
              </Typography>
              <DataGrid
                autoHeight
                rows={calculationRows}
                columns={columns}
                loading={runsLoading}
                hideFooter
                onRowClick={(params) => handleRowClick(params.id as string)}
                rowSelectionModel={selectionModel}
                onRowSelectionModelChange={(model) => {
                  setSelectionModel(model);
                  if (model.length) {
                    handleRowClick(model[0] as string);
                  }
                }}
                sx={{
                  "& .MuiDataGrid-columnHeaders": {
                    fontWeight: 600,
                  },
                  "& .MuiDataGrid-row:hover": {
                    cursor: "pointer",
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectCalculationsPage;
