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
import apiClient from "../api/client";

type RCBeamForm = {
  b_mm: number;
  h_mm: number;
  L_m: number;
  wl_kN_m: number;
};

type RCBeamResult = {
  Mu_kNm: number;
  As_req_mm2: number;
  ok: boolean;
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
    label: "RC Beam",
    description: "Vigas de hormigón armado: cálculo de momento flector y acero mínimo requerido.",
    implemented: true,
  },
  {
    value: "rc_slab",
    label: "RC Slab",
    description: "Losas de hormigón armado: diseño de secciones y cuantía de refuerzo.",
    implemented: false,
  },
  {
    value: "rc_column",
    label: "RC Column",
    description: "Columnas de hormigón armado para carga axial y flexocompresión.",
    implemented: false,
  },
  {
    value: "foundation",
    label: "Fundaciones",
    description: "Zapatas aisladas, corridas y losas de fundación.",
    implemented: false,
  },
  {
    value: "steel_beam",
    label: "Steel Beam",
    description: "Vigas de acero estructural según perfiles estándar.",
    implemented: false,
  },
  {
    value: "steel_column",
    label: "Steel Column",
    description: "Columnas de acero para cargas de compresión y flexión.",
    implemented: false,
  },
  {
    value: "wood_beam",
    label: "Wood Beam",
    description: "Vigas de madera dimensionada y laminada.",
    implemented: false,
  },
];

const defaultForm: RCBeamForm = {
  b_mm: 300,
  h_mm: 500,
  L_m: 5,
  wl_kN_m: 12,
};

const ProjectCalculationsPage = () => {
  const { data: projects } = useProjects();
  const sessionProjectId = useSession((state) => state.projectId);
  const setProjectInSession = useSession((state) => state.setProject);
  const user = useSession((state) => state.user);

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(sessionProjectId);
  const [selectedType, setSelectedType] = useState<string>("rc_beam");
  const [form, setForm] = useState<RCBeamForm>(defaultForm);
  const [result, setResult] = useState<RCBeamResult | null>(null);
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

  const rcBeamMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) {
        throw new Error("Selecciona un proyecto para continuar.");
      }
      if (!user?.id) {
        throw new Error("No se pudo obtener el usuario. Vuelve a iniciar sesión.");
      }
      const payload = {
        project_id: selectedProjectId,
        user_id: user.id,
        b_mm: form.b_mm,
        h_mm: form.h_mm,
        L_m: form.L_m,
        wl_kN_m: form.wl_kN_m,
      };
      const { data } = await apiClient.post<{ results: RCBeamResult; run_id: string }>(
        "/calculations/rc-beam",
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      setResult(data.results);
      setRunId(data.run_id);
      setSelectionModel([data.run_id]);
      queryClient.invalidateQueries({ queryKey: ["calculation-runs", selectedProjectId] });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setResult(null);
    setRunId(null);
    rcBeamMutation.mutate();
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
        const inputs = run.input_json as Partial<RCBeamForm>;
        setForm({
          b_mm: Number(inputs.b_mm ?? defaultForm.b_mm),
          h_mm: Number(inputs.h_mm ?? defaultForm.h_mm),
          L_m: Number(inputs.L_m ?? defaultForm.L_m),
          wl_kN_m: Number(inputs.wl_kN_m ?? defaultForm.wl_kN_m),
        });
        const res = run.result_json as Partial<RCBeamResult>;
        setResult({
          Mu_kNm: Number(res.Mu_kNm ?? 0),
          As_req_mm2: Number(res.As_req_mm2 ?? 0),
          ok: Boolean(res.ok ?? true),
        });
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
        const summary =
          run.element_type === "rc_beam"
            ? `Mu = ${Number((run.result_json as any)?.Mu_kNm ?? 0).toFixed(2)} kN·m | As = ${Number(
                (run.result_json as any)?.As_req_mm2 ?? 0
              ).toFixed(1)} mm²`
            : "Disponible próximamente";
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
                <form onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Ancho b (mm)"
                        type="number"
                        value={form.b_mm}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, b_mm: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0 }}
                        fullWidth
                      />
                      <TextField
                        label="Altura h (mm)"
                        type="number"
                        value={form.h_mm}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, h_mm: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0 }}
                        fullWidth
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Luz L (m)"
                        type="number"
                        value={form.L_m}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, L_m: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 0.1 }}
                        fullWidth
                      />
                      <TextField
                        label="Carga distribuida w (kN/m)"
                        type="number"
                        value={form.wl_kN_m}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, wl_kN_m: Number(event.target.value) || 0 }))
                        }
                        required
                        inputProps={{ min: 0, step: 0.1 }}
                        fullWidth
                      />
                    </Stack>
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        type="submit"
                        startIcon={<CalculateIcon />}
                        disabled={Boolean(typeDisabledReason) || rcBeamMutation.isPending}
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

              {typeDisabledReason && currentType.value === "rc_beam" && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {typeDisabledReason}
                </Alert>
              )}

              {rcBeamMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(rcBeamMutation.error as any)?.response?.data?.detail ??
                    (rcBeamMutation.error as Error)?.message ??
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
              {result ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Momento máximo
                    </Typography>
                    <Typography variant="h5">{result.Mu_kNm.toFixed(2)} kN·m</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Acero mínimo requerido
                    </Typography>
                    <Typography variant="h5">{result.As_req_mm2.toFixed(1)} mm²</Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadReport}
                    disabled={!runId}
                  >
                    Descargar reporte PDF
                  </Button>
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
