import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useSession } from "../store/useSession";
import { useProjects } from "../hooks/useProjects";

type SettingsProfile = {
  email: string;
  full_name?: string | null;
  profession?: string | null;
  avatar_url?: string | null;
  company_name?: string | null;
  company_role?: string | null;
  plan: string;
  plan_status?: string | null;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  project_count: number;
  project_limit?: number | null;
  flow_subscription_id?: string | null;
  flow_customer_id?: string | null;
};

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)",
  backgroundColor: "background.paper",
};

const statTileSx = {
  flex: 1,
  minWidth: 140,
  px: 2,
  py: 1.5,
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.default",
};

const SettingsPage = () => {
  const setUser = useSession((state) => state.setUser);
  const token = useSession((state) => state.token);
  const setToken = useSession((state) => state.setToken);
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    email: "",
    fullName: "",
    profession: "",
    avatarUrl: "",
    companyName: "",
    companyRole: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const planBadge = useMemo(() => {
    if (!profile) {
      return null;
    }
    const status = profile.plan_status?.toLowerCase() ?? "activo";
    return (
      <Chip
        label={`${profile.plan ?? "Plan"} - ${status}`}
        color="primary"
        variant="outlined"
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  }, [profile]);

  const companyNameLabel = useMemo(() => {
    const value = formState.companyName.trim() || profile?.company_name?.trim() || "";
    return value || "Empresa individual";
  }, [formState.companyName, profile?.company_name]);

  const companyRoleLabel = useMemo(() => {
    const value = formState.companyRole.trim() || profile?.company_role?.trim() || "";
    return value || "Propietario";
  }, [formState.companyRole, profile?.company_role]);

  const applyProfileToForm = (data: SettingsProfile | null) => {
    if (!data) {
      return;
    }
    setFormState({
      email: data.email,
      fullName: data.full_name ?? "",
      profession: data.profession ?? "",
      avatarUrl: data.avatar_url ?? "",
      companyName: data.company_name ?? "",
      companyRole: data.company_role ?? "",
    });
    setPassword("");
    setConfirmPassword("");
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    let mounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get<SettingsProfile>("/users/me");
        if (!mounted) return;
        setProfile(data);
        applyProfileToForm(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (password && password !== confirmPassword) {
      setError("Las contraseñas deben coincidir.");
      return;
    }
    if (!profile) {
      return;
    }
    const payload: Record<string, string | undefined> = {
      email: formState.email.trim(),
      full_name: formState.fullName.trim(),
      profession: formState.profession.trim(),
      company_name: formState.companyName.trim(),
      company_role: formState.companyRole.trim(),
      avatar_url: formState.avatarUrl.trim(),
    };
    if (password) {
      payload.password = password;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.patch<SettingsProfile>("/users/me", payload);
      setProfile(data);
      applyProfileToForm(data);
      setMessage("Cambios guardados correctamente.");
      setEditing(false);
      const currentUser = useSession.getState().user;
      if (currentUser) {
        setUser({ ...currentUser, email: data.email, plan: data.plan });
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? "No pudimos actualizar el perfil.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    applyProfileToForm(profile);
    setEditing(false);
    setError(null);
    setMessage(null);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer."
    );
    if (!confirmed) {
      return;
    }
    try {
      await apiClient.delete("/auth/me");
      setToken(null);
      setUser(undefined);
      alert("Cuenta eliminada. Te redirigiremos al login.");
      window.location.replace("/login");
    } catch (err) {
      console.error(err);
      setError("No pudimos eliminar tu cuenta. Intenta nuevamente.");
    }
  };

  const initials = useMemo(() => {
    const fullName = formState.fullName || profile?.full_name || profile?.email || "";
    const parts = fullName.trim().split(" ");
    if (parts.length === 0) return "ST";
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
  }, [formState.fullName, profile]);

  const projectCount = useMemo(() => {
    const fromProfile = profile?.project_count ?? 0;
    const fromList = projects?.length ?? 0;
    return Math.max(fromProfile, fromList);
  }, [profile?.project_count, projects]);

  const formatDate = (value?: string | null) => {
    if (!value) return "Sin fecha";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Sin fecha";
    return parsed.toLocaleDateString("es-CL");
  };

  const projectLimit = profile?.project_limit;
  const projectLimitLabel = projectLimit == null ? "Sin límite" : projectLimit.toString();
  const usageRatio =
    projectLimit && projectLimit > 0 ? Math.min(projectCount / projectLimit, 1) : null;

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 8, gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Cargando tu perfil...
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Perfil y preferencias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra tu cuenta, empresa y seguridad desde un solo lugar.
          </Typography>
        </Box>
        {!editing && (
          <Button variant="contained" onClick={() => setEditing(true)}>
            Editar perfil
          </Button>
        )}
      </Stack>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {editing ? (
        <Box component="form" onSubmit={handleSave} noValidate>
          <Stack spacing={3}>
            <Card sx={sectionCardSx}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6">Perfil</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Información visible en reportes y notificaciones.
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Email"
                        type="email"
                        value={formState.email}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, email: event.target.value }))
                        }
                        required
                        fullWidth
                        autoComplete="email"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nombre completo"
                        value={formState.fullName}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, fullName: event.target.value }))
                        }
                        fullWidth
                        autoComplete="name"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Profesión"
                        value={formState.profession}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, profession: event.target.value }))
                        }
                        fullWidth
                        autoComplete="organization-title"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="URL del avatar"
                        value={formState.avatarUrl}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, avatarUrl: event.target.value }))
                        }
                        fullWidth
                        autoComplete="url"
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={sectionCardSx}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6">Empresa/Equipo</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Si trabajas de forma individual, usa "Empresa individual".
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={7}>
                      <TextField
                        label="Nombre de empresa"
                        value={formState.companyName}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, companyName: event.target.value }))
                        }
                        placeholder="Empresa individual"
                        helperText="Deja vacío para usar Empresa individual."
                        fullWidth
                        autoComplete="organization"
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="Rol en la empresa"
                        value={formState.companyRole}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, companyRole: event.target.value }))
                        }
                        placeholder="Propietario"
                        helperText="Ej: Propietario, Director técnico."
                        fullWidth
                        autoComplete="organization-title"
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={sectionCardSx}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6">Seguridad</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cambia tu contraseña cuando sea necesario.
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nueva contraseña"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        fullWidth
                        autoComplete="new-password"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Confirmar contraseña"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        fullWidth
                        autoComplete="new-password"
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-end" gap={2}>
              <Button variant="outlined" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : (
        <Box sx={{ maxWidth: 520 }}>
          <Stack spacing={3}>
            <Card
              sx={(theme) => ({
                ...sectionCardSx,
                position: "relative",
                overflow: "hidden",
                background:
                  theme.palette.mode === "light"
                    ? "linear-gradient(140deg, rgba(14, 116, 144, 0.12), rgba(59, 130, 246, 0.08))"
                    : theme.palette.background.paper,
              })}
            >
              <Box
                sx={(theme) => ({
                  position: "absolute",
                  inset: 0,
                  opacity: theme.palette.mode === "light" ? 0.9 : 0,
                  background:
                    "radial-gradient(600px circle at 10% 10%, rgba(56, 189, 248, 0.25), transparent 45%), radial-gradient(400px circle at 90% 0%, rgba(34, 197, 94, 0.18), transparent 50%)",
                })}
              />
              <CardContent sx={{ position: "relative" }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: "primary.main",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="h6" noWrap>
                        {profile?.full_name || "Tu perfil"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {formState.email}
                      </Typography>
                      {formState.profession && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {formState.profession}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {planBadge}
                    <Chip label={`${projectCount} proyectos`} size="small" variant="outlined" />
                  </Stack>
                  <Divider />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Box sx={statTileSx}>
                      <Typography variant="caption" color="text.secondary">
                        Empresa
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {companyNameLabel}
                      </Typography>
                    </Box>
                    <Box sx={statTileSx}>
                      <Typography variant="caption" color="text.secondary">
                        Rol
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {companyRoleLabel}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={sectionCardSx}>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6">Empresa/Equipo</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile?.company_name ? "Datos de tu empresa." : "Empresa individual."}
                    </Typography>
                  </Box>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Empresa
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {companyNameLabel}
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Rol
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {companyRoleLabel}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={sectionCardSx}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Plan y uso
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Estado del plan actual y uso del espacio.
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Inicio
                    </Typography>
                    <Typography variant="body2">{formatDate(profile?.plan_started_at)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Expira
                    </Typography>
                    <Typography variant="body2">{formatDate(profile?.plan_expires_at)}</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Proyectos creados
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {projectCount}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Límite de proyectos
                    </Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {projectLimitLabel}
                    </Typography>
                  </Stack>
                  {projectLimit == null ? (
                    <Typography variant="caption" color="text.secondary">
                      Sin límite de proyectos.
                    </Typography>
                  ) : projectLimit > 0 ? (
                    <Box>
                      <LinearProgress
                        variant="determinate"
                        value={usageRatio ? usageRatio * 100 : 0}
                        sx={{ height: 8, borderRadius: 4, mt: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {projectCount} de {projectLimit} proyectos en uso.
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Límite actual: 0 proyectos.
                    </Typography>
                  )}
                </Stack>
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => navigate("/subscription")}
                >
                  Administrar plan
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      )}

      <Card
        sx={(theme) => ({
          ...sectionCardSx,
          borderColor: "error.light",
          backgroundColor:
            theme.palette.mode === "light" ? "rgba(239, 68, 68, 0.06)" : "rgba(248, 113, 113, 0.12)",
        })}
      >
        <CardContent>
          <Typography variant="h6" color="error" gutterBottom>
            Eliminar cuenta
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Esta acción borra tu cuenta y todos tus datos. No se puede revertir.
          </Typography>
          <Button variant="outlined" color="error" onClick={handleDeleteAccount}>
            Eliminar mi cuenta
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default SettingsPage;
