import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import apiClient from "../api/client";
import { useSession } from "../store/useSession";

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
    const status = profile.plan_status || "activo";
    return (
      <Chip label={`${profile.plan ?? "plan"} · ${status}`} color="secondary" size="small" />
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

  const handleSave = async (event: React.FormEvent) => {
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
      "¿Estás seguro de eliminar tu cuenta? Esta acción no se puede revertir."
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h4">Configuración</Typography>
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Datos de la cuenta
          </Typography>
          <form onSubmit={handleSave}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <TextField
                label="Nombre completo"
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, fullName: event.target.value }))
                }
              />
              <TextField
                label="Profesión"
                value={formState.profession}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, profession: event.target.value }))
                }
              />
              <TextField
                label="URL del avatar"
                value={formState.avatarUrl}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, avatarUrl: event.target.value }))
                }
              />
              <TextField
                label="Nueva contraseña"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <Button type="submit" variant="contained" disabled={saving}>
                Guardar cambios
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Plan actual</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                {planBadge}
                <Typography variant="body2" color="text.secondary">
                  {profile?.plan_started_at ? `Desde ${new Date(profile.plan_started_at).toLocaleDateString()}` : "Sin fecha de inicio"}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {profile?.plan_expires_at
                  ? `Expira el ${new Date(profile.plan_expires_at).toLocaleDateString()}`
                  : "Sin fecha de expiración"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Proyectos</Typography>
              <Typography variant="body1">
                Ya tienes {profile?.project_count ?? 0} proyectos creados.
              </Typography>
              {profile?.project_limit && (
                <Typography variant="body2" color="text.secondary">
                  Límite de proyectos: {profile.project_limit}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderColor: "error.main" }}>
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
    </Box>
  );
};

export default SettingsPage;
