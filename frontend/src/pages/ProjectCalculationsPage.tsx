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
import { useParams } from "react-router-dom";

import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";
import { useCalculationRuns, CalculationRun } from "../hooks/useCalculationRuns";
import {
  useConcreteColumn,
  useConcreteBeam,
  useSteelColumn,
  useSteelBeam,
  useWoodColumn,
  useWoodBeam,
  useFooting,
  ConcreteColumnResponse,
  ConcreteBeamResponse,
  SteelColumnResponse,
  SteelBeamResponse,
  WoodColumnResponse,
  WoodBeamResponse,
  FootingResponse,
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

type SteelColumnForm = {
  axialLoad: number;
  momentX: number;
  momentY: number;
  length: number;
  fy: number;
  sectionType: string;
  profileName: string;
};

type SteelBeamForm = {
  moment: number;
  shear: number;
  span: number;
  fy: number;
  sectionType: string;
  profileName: string;
  lateralSupport: string;
};

type WoodColumnForm = {
  axialLoad: number;
  width: number;
  depth: number;
  length: number;
  woodType: string;
};

type WoodBeamForm = {
  moment: number;
  shear: number;
  span: number;
  width: number;
  height: number;
  woodType: string;
  lateralSupport: string;
};

type FootingForm = {
  axialLoad: number;
  moment: number;
  shear: number;
  columnWidth: number;
  columnDepth: number;
  soilBearingCapacity: number;
  fc: number;
  fy: number;
  footingType: string;
  length: number;
  width: number;
  footingDepth: number;
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

const defaultSteelColumnForm: SteelColumnForm = {
  axialLoad: 800,
  momentX: 100,
  momentY: 80,
  length: 4.0,
  fy: 345,
  sectionType: "W",
  profileName: "W310x97",
};

const defaultSteelBeamForm: SteelBeamForm = {
  moment: 200,
  shear: 150,
  span: 6.0,
  fy: 345,
  sectionType: "W",
  profileName: "W310x97",
  lateralSupport: "full",
};

const defaultWoodColumnForm: WoodColumnForm = {
  axialLoad: 150,
  width: 15,
  depth: 15,
  length: 3.0,
  woodType: "Pino radiata C24",
};

const defaultWoodBeamForm: WoodBeamForm = {
  moment: 50,
  shear: 30,
  span: 4.0,
  width: 10,
  height: 20,
  woodType: "Pino radiata C24",
  lateralSupport: "full",
};

const defaultFootingForm: FootingForm = {
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
  const { projectId: routeProjectId } = useParams<{ projectId?: string }>();
  const sessionProjectId = useSession((state) => state.projectId);
  const setProjectInSession = useSession((state) => state.setProject);
  const user = useSession((state) => state.user);

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(sessionProjectId);
  const [selectedType, setSelectedType] = useState<string>("rc_beam");
  const [beamForm, setBeamForm] = useState<RCBeamForm>(defaultBeamForm);
  const [columnForm, setColumnForm] = useState<RCColumnForm>(defaultColumnForm);
  const [steelColumnForm, setSteelColumnForm] = useState<SteelColumnForm>(defaultSteelColumnForm);
  const [steelBeamForm, setSteelBeamForm] = useState<SteelBeamForm>(defaultSteelBeamForm);
  const [woodColumnForm, setWoodColumnForm] = useState<WoodColumnForm>(defaultWoodColumnForm);
  const [woodBeamForm, setWoodBeamForm] = useState<WoodBeamForm>(defaultWoodBeamForm);
  const [footingForm, setFootingForm] = useState<FootingForm>(defaultFootingForm);
  const [result, setResult] = useState<
    | ConcreteBeamResponse
    | ConcreteColumnResponse
    | SteelColumnResponse
    | SteelBeamResponse
    | WoodColumnResponse
    | WoodBeamResponse
    | FootingResponse
    | null
  >(null);
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

  const handleSubmitSteelColumn = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId || !user?.id) return;
    setResult(null);
    setRunId(null);
    steelColumnMutation.mutate({
      ...steelColumnForm,
      projectId: selectedProjectId,
      userId: user.id,
    });
  };

  const handleSubmitSteelBeam = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId || !user?.id) return;
    setResult(null);
    setRunId(null);
    steelBeamMutation.mutate({
      ...steelBeamForm,
      projectId: selectedProjectId,
      userId: user.id,
    });
  };

  const handleSubmitWoodColumn = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId || !user?.id) return;
    setResult(null);
    setRunId(null);
    woodColumnMutation.mutate({
      ...woodColumnForm,
      projectId: selectedProjectId,
      userId: user.id,
    });
  };

  const handleSubmitWoodBeam = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId || !user?.id) return;
    setResult(null);
    setRunId(null);
    woodBeamMutation.mutate({
      ...woodBeamForm,
      projectId: selectedProjectId,
      userId: user.id,
    });
  };

  const handleSubmitFooting = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId || !user?.id) return;
    setResult(null);
    setRunId(null);
    footingMutation.mutate({
      ...footingForm,
      footingType: footingForm.footingType as "isolated" | "continuous",
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
      const inputs = run.input_json as any;

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
        setResult(run.result_json as unknown as ConcreteBeamResponse);
      } else if (run.element_type === "rc_column") {
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
        setResult(run.result_json as unknown as ConcreteColumnResponse);
      } else if (run.element_type === "steel_column") {
        setSteelColumnForm({
          axialLoad: Number(inputs.axialLoad ?? defaultSteelColumnForm.axialLoad),
          momentX: Number(inputs.momentX ?? defaultSteelColumnForm.momentX),
          momentY: Number(inputs.momentY ?? defaultSteelColumnForm.momentY),
          length: Number(inputs.length ?? defaultSteelColumnForm.length),
          fy: Number(inputs.fy ?? defaultSteelColumnForm.fy),
          sectionType: inputs.sectionType ?? defaultSteelColumnForm.sectionType,
          profileName: inputs.profileName ?? defaultSteelColumnForm.profileName,
        });
        setResult(run.result_json as unknown as SteelColumnResponse);
      } else if (run.element_type === "steel_beam") {
        setSteelBeamForm({
          moment: Number(inputs.moment ?? defaultSteelBeamForm.moment),
          shear: Number(inputs.shear ?? defaultSteelBeamForm.shear),
          span: Number(inputs.span ?? defaultSteelBeamForm.span),
          fy: Number(inputs.fy ?? defaultSteelBeamForm.fy),
          sectionType: inputs.sectionType ?? defaultSteelBeamForm.sectionType,
          profileName: inputs.profileName ?? defaultSteelBeamForm.profileName,
          lateralSupport: inputs.lateralSupport ?? defaultSteelBeamForm.lateralSupport,
        });
        setResult(run.result_json as unknown as SteelBeamResponse);
      } else if (run.element_type === "wood_column") {
        setWoodColumnForm({
          axialLoad: Number(inputs.axialLoad ?? defaultWoodColumnForm.axialLoad),
          width: Number(inputs.width ?? defaultWoodColumnForm.width),
          depth: Number(inputs.depth ?? defaultWoodColumnForm.depth),
          length: Number(inputs.length ?? defaultWoodColumnForm.length),
          woodType: inputs.woodType ?? defaultWoodColumnForm.woodType,
        });
        setResult(run.result_json as unknown as WoodColumnResponse);
      } else if (run.element_type === "wood_beam") {
        setWoodBeamForm({
          moment: Number(inputs.moment ?? defaultWoodBeamForm.moment),
          shear: Number(inputs.shear ?? defaultWoodBeamForm.shear),
          span: Number(inputs.span ?? defaultWoodBeamForm.span),
          width: Number(inputs.width ?? defaultWoodBeamForm.width),
          height: Number(inputs.height ?? defaultWoodBeamForm.height),
          woodType: inputs.woodType ?? defaultWoodBeamForm.woodType,
          lateralSupport: inputs.lateralSupport ?? defaultWoodBeamForm.lateralSupport,
        });
        setResult(run.result_json as unknown as WoodBeamResponse);
      } else if (run.element_type === "footing") {
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
        setResult(run.result_json as unknown as FootingResponse);
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
        const result = run.result_json as any;
        const inputs = run.input_json as any;

        if (run.element_type === "rc_column") {
          const longSteel = result?.longitudinalSteel;
          const transSteel = result?.transverseSteel;
          if (longSteel && transSteel) {
            summary = `${longSteel.numBars}φ${longSteel.barDiameter} (${Math.round(longSteel.totalArea)}mm²), Est φ${transSteel.diameter}@${transSteel.spacing}mm`;
          }
        } else if (run.element_type === "rc_beam") {
          const posReinf = result?.positiveReinforcemenet || result?.positiveReinforcement;
          const negReinf = result?.negativeReinforcement;
          const transSteel = result?.transverseSteel;
          if (posReinf && negReinf && transSteel) {
            summary = `Sup: ${negReinf.numBars}φ${negReinf.barDiameter}, Inf: ${posReinf.numBars}φ${posReinf.barDiameter}, Est φ${transSteel.diameter}@${transSteel.spacing}mm`;
          }
        } else if (run.element_type === "steel_column") {
          summary = `Perfil: ${inputs?.profileName || "Personalizado"} | Pn = ${result?.pn?.toFixed(1) || "—"} kN | Ratio: ${((result?.interactionRatio || 0) * 100).toFixed(1)}%`;
        } else if (run.element_type === "steel_beam") {
          summary = `Perfil: ${inputs?.profileName || "Personalizado"} | Mn = ${result?.mn?.toFixed(1) || "—"} kN·m | Ratio: ${((result?.flexureRatio || 0) * 100).toFixed(1)}%`;
        } else if (run.element_type === "wood_column") {
          summary = `Sección: ${inputs?.width || "—"}x${inputs?.depth || "—"} cm | Pn = ${result?.pn?.toFixed(1) || "—"} kN | Ratio: ${((result?.utilizationRatio || 0) * 100).toFixed(1)}%`;
        } else if (run.element_type === "wood_beam") {
          summary = `Sección: ${inputs?.width || "—"}x${inputs?.height || "—"} cm | Mn = ${result?.mn?.toFixed(1) || "—"} kN·m | Ratio: ${((result?.utilizationRatio || 0) * 100).toFixed(1)}%`;
        } else if (run.element_type === "footing") {
          summary = `Tipo: ${inputs?.footingType === "isolated" ? "Aislada" : "Corrida"} | Dimensión: ${inputs?.length || "—"}x${inputs?.width || "—"} m | H = ${inputs?.footingDepth || "—"} cm`;
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
              ) : currentType.value === "steel_column" ? (
                <form onSubmit={handleSubmitSteelColumn}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Esfuerzos
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Carga axial (kN)"
                        type="number"
                        value={steelColumnForm.axialLoad}
                        onChange={(e) => setSteelColumnForm((prev) => ({ ...prev, axialLoad: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Momento X (kN·m)"
                        type="number"
                        value={steelColumnForm.momentX}
                        onChange={(e) => setSteelColumnForm((prev) => ({ ...prev, momentX: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Momento Y (kN·m)"
                        type="number"
                        value={steelColumnForm.momentY}
                        onChange={(e) => setSteelColumnForm((prev) => ({ ...prev, momentY: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Geometría y Perfil
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        select
                        label="Tipo de perfil"
                        value={steelColumnForm.sectionType}
                        onChange={(e) => setSteelColumnForm((prev) => ({ ...prev, sectionType: e.target.value }))}
                        required
                        fullWidth
                      >
                        <MenuItem value="W">W - Perfil I</MenuItem>
                        <MenuItem value="HSS">HSS - Perfil hueco</MenuItem>
                        <MenuItem value="Custom">Personalizado</MenuItem>
                      </TextField>
                      <TextField
                        label="Nombre del perfil"
                        value={steelColumnForm.profileName}
                        onChange={(e) => setSteelColumnForm((prev) => ({ ...prev, profileName: e.target.value }))}
                        helperText="Ej: W310x97, HSS200x200x8"
                        fullWidth
                      />
                      <TextField
                        label="Altura (m)"
                        type="number"
                        value={steelColumnForm.length}
                        onChange={(e) => setSteelColumnForm((prev) => ({ ...prev, length: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Material
                    </Typography>
                    <TextField
                      label="fy (MPa)"
                      type="number"
                      value={steelColumnForm.fy}
                      onChange={(e) => setSteelColumnForm((prev) => ({ ...prev, fy: Number(e.target.value) || 0 }))}
                      required
                      fullWidth
                    />

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        type="submit"
                        startIcon={<CalculateIcon />}
                        disabled={Boolean(typeDisabledReason) || steelColumnMutation.isPending}
                      >
                        Calcular
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              ) : currentType.value === "steel_beam" ? (
                <form onSubmit={handleSubmitSteelBeam}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Esfuerzos
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Momento (kN·m)"
                        type="number"
                        value={steelBeamForm.moment}
                        onChange={(e) => setSteelBeamForm((prev) => ({ ...prev, moment: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Cortante (kN)"
                        type="number"
                        value={steelBeamForm.shear}
                        onChange={(e) => setSteelBeamForm((prev) => ({ ...prev, shear: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Luz (m)"
                        type="number"
                        value={steelBeamForm.span}
                        onChange={(e) => setSteelBeamForm((prev) => ({ ...prev, span: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Perfil
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        select
                        label="Tipo de perfil"
                        value={steelBeamForm.sectionType}
                        onChange={(e) => setSteelBeamForm((prev) => ({ ...prev, sectionType: e.target.value }))}
                        required
                        fullWidth
                      >
                        <MenuItem value="W">W - Perfil I</MenuItem>
                        <MenuItem value="Custom">Personalizado</MenuItem>
                      </TextField>
                      <TextField
                        label="Nombre del perfil"
                        value={steelBeamForm.profileName}
                        onChange={(e) => setSteelBeamForm((prev) => ({ ...prev, profileName: e.target.value }))}
                        helperText="Ej: W310x97, W410x149"
                        fullWidth
                      />
                      <TextField
                        select
                        label="Soporte lateral"
                        value={steelBeamForm.lateralSupport}
                        onChange={(e) => setSteelBeamForm((prev) => ({ ...prev, lateralSupport: e.target.value }))}
                        required
                        fullWidth
                      >
                        <MenuItem value="full">Completo</MenuItem>
                        <MenuItem value="partial">Parcial</MenuItem>
                        <MenuItem value="none">Sin soporte</MenuItem>
                      </TextField>
                    </Stack>

                    <TextField
                      label="fy (MPa)"
                      type="number"
                      value={steelBeamForm.fy}
                      onChange={(e) => setSteelBeamForm((prev) => ({ ...prev, fy: Number(e.target.value) || 0 }))}
                      required
                      fullWidth
                    />

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        type="submit"
                        startIcon={<CalculateIcon />}
                        disabled={Boolean(typeDisabledReason) || steelBeamMutation.isPending}
                      >
                        Calcular
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              ) : currentType.value === "wood_column" ? (
                <form onSubmit={handleSubmitWoodColumn}>
                  <Stack spacing={2}>
                    <TextField
                      label="Carga axial (kN)"
                      type="number"
                      value={woodColumnForm.axialLoad}
                      onChange={(e) => setWoodColumnForm((prev) => ({ ...prev, axialLoad: Number(e.target.value) || 0 }))}
                      required
                      fullWidth
                    />

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Geometría
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Ancho (cm)"
                        type="number"
                        value={woodColumnForm.width}
                        onChange={(e) => setWoodColumnForm((prev) => ({ ...prev, width: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Profundidad (cm)"
                        type="number"
                        value={woodColumnForm.depth}
                        onChange={(e) => setWoodColumnForm((prev) => ({ ...prev, depth: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Altura (m)"
                        type="number"
                        value={woodColumnForm.length}
                        onChange={(e) => setWoodColumnForm((prev) => ({ ...prev, length: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                    </Stack>

                    <TextField
                      select
                      label="Tipo de madera"
                      value={woodColumnForm.woodType}
                      onChange={(e) => setWoodColumnForm((prev) => ({ ...prev, woodType: e.target.value }))}
                      required
                      fullWidth
                    >
                      <MenuItem value="Pino radiata">Pino radiata</MenuItem>
                      <MenuItem value="Pino radiata C24">Pino radiata C24</MenuItem>
                      <MenuItem value="Pino radiata C16">Pino radiata C16</MenuItem>
                      <MenuItem value="Coigüe">Coigüe</MenuItem>
                      <MenuItem value="Roble">Roble</MenuItem>
                      <MenuItem value="Lenga">Lenga</MenuItem>
                      <MenuItem value="Alerce">Alerce</MenuItem>
                    </TextField>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        type="submit"
                        startIcon={<CalculateIcon />}
                        disabled={Boolean(typeDisabledReason) || woodColumnMutation.isPending}
                      >
                        Calcular
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              ) : currentType.value === "wood_beam" ? (
                <form onSubmit={handleSubmitWoodBeam}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Esfuerzos
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Momento (kN·m)"
                        type="number"
                        value={woodBeamForm.moment}
                        onChange={(e) => setWoodBeamForm((prev) => ({ ...prev, moment: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Cortante (kN)"
                        type="number"
                        value={woodBeamForm.shear}
                        onChange={(e) => setWoodBeamForm((prev) => ({ ...prev, shear: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Luz (m)"
                        type="number"
                        value={woodBeamForm.span}
                        onChange={(e) => setWoodBeamForm((prev) => ({ ...prev, span: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Sección
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Ancho (cm)"
                        type="number"
                        value={woodBeamForm.width}
                        onChange={(e) => setWoodBeamForm((prev) => ({ ...prev, width: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Altura (cm)"
                        type="number"
                        value={woodBeamForm.height}
                        onChange={(e) => setWoodBeamForm((prev) => ({ ...prev, height: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        select
                        label="Soporte lateral"
                        value={woodBeamForm.lateralSupport}
                        onChange={(e) => setWoodBeamForm((prev) => ({ ...prev, lateralSupport: e.target.value }))}
                        required
                        fullWidth
                      >
                        <MenuItem value="full">Completo</MenuItem>
                        <MenuItem value="partial">Parcial</MenuItem>
                        <MenuItem value="none">Sin soporte</MenuItem>
                      </TextField>
                    </Stack>

                    <TextField
                      select
                      label="Tipo de madera"
                      value={woodBeamForm.woodType}
                      onChange={(e) => setWoodBeamForm((prev) => ({ ...prev, woodType: e.target.value }))}
                      required
                      fullWidth
                    >
                      <MenuItem value="Pino radiata">Pino radiata</MenuItem>
                      <MenuItem value="Pino radiata C24">Pino radiata C24</MenuItem>
                      <MenuItem value="Pino radiata C16">Pino radiata C16</MenuItem>
                      <MenuItem value="Coigüe">Coigüe</MenuItem>
                      <MenuItem value="Roble">Roble</MenuItem>
                      <MenuItem value="Lenga">Lenga</MenuItem>
                      <MenuItem value="Alerce">Alerce</MenuItem>
                    </TextField>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        type="submit"
                        startIcon={<CalculateIcon />}
                        disabled={Boolean(typeDisabledReason) || woodBeamMutation.isPending}
                      >
                        Calcular
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              ) : currentType.value === "footing" ? (
                <form onSubmit={handleSubmitFooting}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Esfuerzos
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Carga axial (kN)"
                        type="number"
                        value={footingForm.axialLoad}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, axialLoad: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Momento (kN·m)"
                        type="number"
                        value={footingForm.moment}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, moment: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Cortante (kN)"
                        type="number"
                        value={footingForm.shear}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, shear: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Pilar
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Ancho pilar (cm)"
                        type="number"
                        value={footingForm.columnWidth}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, columnWidth: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Profundidad pilar (cm)"
                        type="number"
                        value={footingForm.columnDepth}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, columnDepth: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Zapata
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        select
                        label="Tipo de zapata"
                        value={footingForm.footingType}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, footingType: e.target.value }))}
                        required
                        fullWidth
                      >
                        <MenuItem value="isolated">Aislada</MenuItem>
                        <MenuItem value="continuous">Corrida</MenuItem>
                      </TextField>
                      <TextField
                        label="Largo (m)"
                        type="number"
                        value={footingForm.length}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, length: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Ancho (m)"
                        type="number"
                        value={footingForm.width}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, width: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Altura (cm)"
                        type="number"
                        value={footingForm.footingDepth}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, footingDepth: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                    </Stack>

                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                      Materiales y Suelo
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Capacidad portante (kN/m²)"
                        type="number"
                        value={footingForm.soilBearingCapacity}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, soilBearingCapacity: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="f'c (MPa)"
                        type="number"
                        value={footingForm.fc}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, fc: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                      <TextField
                        label="fy (MPa)"
                        type="number"
                        value={footingForm.fy}
                        onChange={(e) => setFootingForm((prev) => ({ ...prev, fy: Number(e.target.value) || 0 }))}
                        required
                        fullWidth
                      />
                    </Stack>

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="contained"
                        type="submit"
                        startIcon={<CalculateIcon />}
                        disabled={Boolean(typeDisabledReason) || footingMutation.isPending}
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
              ) : result && "section" in result && "pn" in result && "mnX" in result ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                    Pilar de Acero - Resultados
                  </Typography>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Perfil
                    </Typography>
                    <Typography variant="h6">{result.section}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Capacidad Axial (Pn)
                    </Typography>
                    <Typography variant="h5">{result.pn.toFixed(2)} kN</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Momento Nominal X (Mn,x)
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>{result.mnX.toFixed(2)} kN·m</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Momento Nominal Y (Mn,y)
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>{result.mnY.toFixed(2)} kN·m</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Ratio de Interacción
                    </Typography>
                    <Typography variant="h5" color={result.interactionRatio > 1 ? "error" : "success.main"}>
                      {(result.interactionRatio * 100).toFixed(1)}%
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Estado de Verificación
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color={result.passes ? "success.main" : "error.main"}>
                      {result.checkStatus}
                    </Typography>
                  </Box>
                </Stack>
              ) : result && "section" in result && "mn" in result && "vn" in result && "flexureRatio" in result ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                    {("woodType" in result) ? "Viga de Madera - Resultados" : "Viga de Acero - Resultados"}
                  </Typography>

                  {("woodType" in result) && (
                    <Box>
                      <Typography variant="overline" color="text.secondary">
                        Tipo de Madera
                      </Typography>
                      <Typography variant="h6">{(result as any).woodType}</Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Sección
                    </Typography>
                    <Typography variant="h6">{result.section}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Momento Nominal (Mn)
                    </Typography>
                    <Typography variant="h5">{result.mn.toFixed(2)} kN·m</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Cortante Nominal (Vn)
                    </Typography>
                    <Typography variant="h5">{result.vn.toFixed(2)} kN</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Ratio de Flexión
                    </Typography>
                    <Typography variant="body1" fontWeight={500} color={result.flexureRatio > 1 ? "error" : "success.main"}>
                      {(result.flexureRatio * 100).toFixed(1)}%
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Ratio de Cortante
                    </Typography>
                    <Typography variant="body1" fontWeight={500} color={result.shearRatio > 1 ? "error" : "success.main"}>
                      {(result.shearRatio * 100).toFixed(1)}%
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Deflexión
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>{result.deflection.toFixed(2)} cm (Ratio: {(result.deflectionRatio * 100).toFixed(1)}%)</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Estado de Verificación
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color={result.passes ? "success.main" : "error.main"}>
                      {result.checkStatus}
                    </Typography>
                  </Box>
                </Stack>
              ) : result && "woodType" in result && "pn" in result && "utilizationRatio" in result ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                    Pilar de Madera - Resultados
                  </Typography>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Tipo de Madera
                    </Typography>
                    <Typography variant="h6">{(result as any).woodType}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Área de la Sección
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>{(result as any).area.toFixed(2)} mm²</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Capacidad Axial (Pn)
                    </Typography>
                    <Typography variant="h5">{(result as any).pn.toFixed(2)} kN</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Ratio de Utilización
                    </Typography>
                    <Typography variant="h5" color={(result as any).utilizationRatio > 1 ? "error" : "success.main"}>
                      {((result as any).utilizationRatio * 100).toFixed(1)}%
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Esbeltez
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      λx: {(result as any).slendernessX.toFixed(2)}, λy: {(result as any).slendernessY.toFixed(2)} {(result as any).isSlender ? "(Esbelto)" : "(No Esbelto)"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Factor de Estabilidad (Cp)
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>{(result as any).stabilityFactor.toFixed(3)}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Estado de Verificación
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color={(result as any).checkStatus === "OK" ? "success.main" : "error.main"}>
                      {(result as any).checkStatus}
                    </Typography>
                  </Box>
                </Stack>
              ) : result && "length" in result && "soilPressureMax" in result ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                    Zapata - Resultados
                  </Typography>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Dimensiones
                    </Typography>
                    <Typography variant="h6">{(result as any).length.toFixed(2)} m × {(result as any).width.toFixed(2)} m × {(result as any).depth.toFixed(1)} cm</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Presión del Suelo
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      Máx: {(result as any).soilPressureMax.toFixed(2)} kPa, Mín: {(result as any).soilPressureMin.toFixed(2)} kPa
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Acero Longitudinal
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>{(result as any).asLongitudinal.toFixed(2)} cm²/m</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Acero Transversal
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>{(result as any).asTransverse.toFixed(2)} cm²/m</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Configuración de Barras
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>φ{(result as any).barDiameter} @ {(result as any).spacing.toFixed(1)} cm</Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Ratio de Punzonamiento
                    </Typography>
                    <Typography variant="body1" fontWeight={500} color={(result as any).punchingShearRatio > 1 ? "error" : "success.main"}>
                      {((result as any).punchingShearRatio * 100).toFixed(1)}%
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Ratio de Cortante Viga
                    </Typography>
                    <Typography variant="body1" fontWeight={500} color={(result as any).beamShearRatio > 1 ? "error" : "success.main"}>
                      {((result as any).beamShearRatio * 100).toFixed(1)}%
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Estado de Verificación
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color={(result as any).passes ? "success.main" : "error.main"}>
                      {(result as any).passes ? "OK - Cumple" : "No cumple"}
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
