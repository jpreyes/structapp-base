import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useSession } from "../store/useSession";

type Mode = "login" | "register";

const LoginPage = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const setToken = useSession((state) => state.setToken);
  const setUser = useSession((state) => state.setUser);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const authMutation = useMutation({
    mutationFn: async () => {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await apiClient.post(endpoint, { email, password });
      return data as { id: string; email: string; plan: string; session_token?: string | null };
    },
    onSuccess: (data) => {
      setUser({ id: data.id, email: data.email, plan: data.plan });
      if (data.session_token) {
        setToken(data.session_token);
        navigate(from, { replace: true });
      } else if (mode === "register") {
        setInfoMessage("Cuenta creada. Revisa tu correo y luego inicia sesión.");
        setMode("login");
      }
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail ?? "Ocurrió un error. Intenta nuevamente.";
      setError(detail);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfoMessage(null);
    authMutation.mutate();
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
      <Card sx={{ width: 420 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </Typography>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, value) => value && setMode(value as Mode)}
            sx={{ mb: 3 }}
            fullWidth
          >
            <ToggleButton value="login">Iniciar sesión</ToggleButton>
            <ToggleButton value="register">Registrarme</ToggleButton>
          </ToggleButtonGroup>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                type="email"
                label="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <TextField
                type="password"
                label="Contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
              {infoMessage && (
                <Typography color="success.main" variant="body2">
                  {infoMessage}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={authMutation.isLoading}
              >
                {mode === "login" ? "Entrar" : "Registrarme"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
