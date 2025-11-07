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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useQueryClient } from "@tanstack/react-query";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import dayjs from "dayjs";

import { useProjects } from "../hooks/useProjects";
import { useCalculationRuns, CalculationRun } from "../hooks/useCalculationRuns";
import { useSession } from "../store/useSession";
import { useSetCriticalElement, useUnsetCriticalElement } from "../hooks/useStructuralCalcs";
import apiClient from "../api/client";

type CalculationType = {
  id: string;
  label: string;
  description: string;
};

const calculationTypes: CalculationType[] = [
  { id: "building_description", label: "Descripción del Edificio", description: "Información general del proyecto" },
  { id: "live_load", label: "Cargas de Uso", description: "Sobrecargas según tipo de edificio y uso" },
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
  const sessionProjectId = useSession((state) => state.projectId);
  const setProjectInSession = useSession((state) => state.setProject);

  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(sessionProjectId);
  const [selectedCalculations, setSelectedCalculations] = useState<Record<string, string[]>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectOptions = useMemo(() => projects ?? [], [projects]);
  const { data: runs = [], isLoading: runsLoading } = useCalculationRuns(selectedProjectId);
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

  // Agrupar cálculos por tipo
  const groupedCalculations = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    calculationTypes.forEach((type) => {
      grouped[type.id] = runs.filter((run) => run.element_type === type.id);
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

  const totalSelected = useMemo(() => {
    return Object.values(selectedCalculations).reduce((sum, arr) => sum + arr.length, 0);
  }, [selectedCalculations]);

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

      const response = await apiClient.post(
        "/design-bases/runs/generate-from-calculations",
        {
          projectId: selectedProjectId,
          calculationIds: selectedRunIds,
          name: `Memoria de Cálculo - ${dayjs().format("YYYY-MM-DD HH:mm")}`,
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

      // Verificar que el backend devolvió datos
      if (!result?.run) {
        console.error("Backend returned null run data:", result);
        throw new Error("El backend no devolvió datos actualizados");
      }

      console.log("Updated run data:", result.run);

      // Actualizar el caché de React Query manualmente
      queryClient.setQueryData<CalculationRun[]>(
        ["calculation-runs", selectedProjectId],
        (oldData) => {
          if (!oldData) return oldData;

          console.log("Updating cache, old data:", oldData);

          // Si se está marcando como crítico, desmarcar otros del mismo tipo
          const updatedData = oldData.map((run) => {
            if (run.id === runId) {
              // Este es el elemento que se modificó
              return { ...run, is_critical: result.run.is_critical };
            } else if (run.element_type === elementType && !currentIsCritical) {
              // Si estamos marcando uno como crítico, desmarcar los demás del mismo tipo
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
      setError("Error al marcar elemento crítico. Verifica que la base de datos tenga la columna 'is_critical'.");

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
            <StarIcon color="warning" titleAccess="Elemento crítico para reportes" />
          ) : (
            <StarBorderIcon color="action" titleAccess="Marcar como crítico" />
          )}
        </Box>
      ),
    },
    {
      field: "created_at",
      headerName: "Fecha",
      width: 150,
      valueFormatter: (value) => (value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—"),
    },
    { field: "summary", headerName: "Resumen", flex: 1, minWidth: 250 },
  ];

  const getSummary = (run: any): string => {
    const result = run.result_json;
    const inputs = run.input_json;

    switch (run.element_type) {
      case "building_description": {
        const parts = [];
        if (result?.text) parts.push(result.text.substring(0, 50) + (result.text.length > 50 ? "..." : ""));
        if (result?.location) parts.push(`📍 ${result.location}`);
        if (result?.area) parts.push(`📐 ${result.area} m²`);
        if (result?.height) parts.push(`📏 ${result.height} m`);
        return parts.length > 0 ? parts.join(" | ") : "—";
      }

      case "live_load":
        return `${inputs?.buildingType || "—"} | ${inputs?.usage || "—"} | ${result?.uniformLoad || result?.uniformLoadRaw || "—"} kN/m²`;

      case "wind_load":
        return `Ambiente: ${inputs?.environment || "—"} | Altura: ${inputs?.height || "—"}m | q = ${result?.q?.toFixed(2) || "—"} kN/m²`;

      case "snow_load":
        return `Banda ${inputs?.latitudeBand || "—"} | pf = ${result?.pf?.toFixed(2) || "—"} kN/m²`;

      case "seismic":
        return `Zona ${inputs?.zone || "—"} | Qbas,x = ${result?.Qbasx?.toFixed(2) || "—"} kN | Qbas,y = ${result?.Qbasy?.toFixed(2) || "—"} kN`;

      case "rc_column": {
        const longSteel = result?.longitudinalSteel;
        const transSteel = result?.transverseSteel;
        if (longSteel && transSteel) {
          return `${longSteel.numBars}φ${longSteel.barDiameter} (${Math.round(longSteel.totalArea)}mm²), Est φ${transSteel.diameter}@${transSteel.spacing}mm`;
        }
        return "—";
      }

      case "rc_beam": {
        const posReinf = result?.positiveReinforcemenet || result?.positiveReinforcement;
        const negReinf = result?.negativeReinforcement;
        const transSteel = result?.transverseSteel;
        if (posReinf && negReinf && transSteel) {
          return `Sup: ${negReinf.numBars}φ${negReinf.barDiameter}, Inf: ${posReinf.numBars}φ${posReinf.barDiameter}, Est φ${transSteel.diameter}@${transSteel.spacing}mm`;
        }
        return "—";
      }

      case "steel_column":
        return `Perfil: ${inputs?.profileName || "Personalizado"} | Pn = ${result?.pn?.toFixed(1) || "—"} kN | Ratio: ${((result?.interactionRatio || 0) * 100).toFixed(1)}%`;

      case "steel_beam":
        return `Perfil: ${inputs?.profileName || "Personalizado"} | Mn = ${result?.mn?.toFixed(1) || "—"} kN·m | Ratio: ${((result?.flexureRatio || 0) * 100).toFixed(1)}%`;

      case "wood_column":
        return `Sección: ${inputs?.width || "—"}x${inputs?.depth || "—"} cm | Pn = ${result?.pn?.toFixed(1) || "—"} kN | Ratio: ${((result?.utilizationRatio || 0) * 100).toFixed(1)}%`;

      case "wood_beam":
        return `Sección: ${inputs?.width || "—"}x${inputs?.height || "—"} cm | Mn = ${result?.mn?.toFixed(1) || "—"} kN·m | Ratio: ${((result?.utilizationRatio || 0) * 100).toFixed(1)}%`;

      case "footing":
        return `Tipo: ${inputs?.footingType || "—"} | Dimensión: ${inputs?.length || "—"}x${inputs?.width || "—"} m | H = ${inputs?.footingDepth || "—"} cm`;

      default:
        return "—";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5">Documentación del proyecto</Typography>
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
          Selecciona un proyecto para ver los cálculos disponibles y generar la memoria de cálculo.
        </Alert>
      )}

      {selectedProjectId && (
        <>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Generar Memoria de Cálculo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Selecciona los cálculos que deseas incluir en el documento Word. Puedes elegir múltiples cálculos de
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
        </>
      )}
    </Box>
  );
};

export default ProjectDocumentationPage;
