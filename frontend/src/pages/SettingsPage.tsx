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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import apiClient from "../api/client";
import { useSession } from "../store/useSession";
import { useProjects } from "../hooks/useProjects";

type SettingsProfile = {
  email: string;
  full_name?: string | null;
  profession?: string | null;
  avatar_url?: string | null;
  plan: string;
  plan_status?: string | null;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  project_count: number;
  project_limit?: number | null;
  flow_subscription_id?: string | null;
  flow_customer_id?: string | null;
};

const SettingsPage = () => {
  const setUser = useSession((state) => state.setUser);
  const token = useSession((state) => state.token);
  const setToken = useSession((state) => state.setToken);
  const { data: projects } = useProjects();
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    email: "",
    fullName: "",
    profession: "",
    avatarUrl: "",
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
        label={`${profile.plan ?? "Plan"} • ${status}`}
        color="primary"
        variant="outlined"
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  }, [profile]);

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
        setFormState({
          email: data.email,
          fullName: data.full_name ?? "",
          profession: data.profession ?? "",
          avatarUrl: data.avatar_url ?? "",
        });
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
      avatar_url: formState.avatarUrl.trim(),
    };
    if (password) {
      payload.password = password;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.patch<SettingsProfile>("/users/me", payload);
      setProfile(data);
      setFormState({
        email: data.email,
        fullName: data.full_name ?? "",
        profession: data.profession ?? "",
        avatarUrl: data.avatar_url ?? "",
      });
      setPassword("");
      setConfirmPassword("");
      setMessage("Perfil actualizado.");
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

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString("es-CL") : "Sin fecha";

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
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Configuración
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Actualiza tus datos y mantén tu perfil alineado con el equipo.
        </Typography>
      </Box>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
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
                <Box>
                  <Typography variant="h6">
                    {profile?.full_name || "Tu perfil"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formState.email}
                  </Typography>
                  {profile?.full_name && (
                    <Typography variant="body2" color="text.secondary">
                      {profile.full_name}
                    </Typography>
                  )}
                </Box>
                {planBadge}
                <Divider />
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Profesión
                  </Typography>
                  <Typography variant="body1">
                    {formState.profession || "Sin información"}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan y uso
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Estado del plan actual y fechas relevantes.
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
                    {profile?.project_limit ?? "Sin límite"}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack spacing={0.5}>
                <Typography variant="h6">Datos de la cuenta</Typography>
                <Typography variant="body2" color="text.secondary">
                  Información visible en reportes y notificaciones.
                </Typography>
              </Stack>
              <Box component="form" onSubmit={handleSave} noValidate>
                <Grid container spacing={2} sx={{ mt: 1 }}>
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
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Stack spacing={0.5} sx={{ mb: 1 }}>
                  <Typography variant="subtitle1">Seguridad</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cambia la contraseña cuando sea necesario.
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Nueva contraseña"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Confirmar contraseña"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>

                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-end" gap={2} mt={3}>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderColor: "error.light", backgroundColor: "rgba(239,68,68,0.05)" }}>
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
