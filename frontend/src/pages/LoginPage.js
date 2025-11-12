import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, Card, CardContent, Stack, TextField, Typography, ToggleButton, ToggleButtonGroup, } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useSession } from "../store/useSession";
const LoginPage = () => {
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);
    const setToken = useSession((state) => state.setToken);
    const setUser = useSession((state) => state.setUser);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from ?? "/";
    const authMutation = useMutation({
        mutationFn: async () => {
            const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
            const { data } = await apiClient.post(endpoint, { email, password });
            return data;
        },
        onSuccess: (data) => {
            setUser({ id: data.id, email: data.email, plan: data.plan });
            if (data.session_token) {
                setToken(data.session_token);
                navigate(from, { replace: true });
            }
            else if (mode === "register") {
                setInfoMessage("Cuenta creada. Revisa tu correo y luego inicia sesión.");
                setMode("login");
            }
        },
        onError: (err) => {
            const detail = err?.response?.data?.detail ?? "Ocurrió un error. Intenta nuevamente.";
            setError(detail);
        },
    });
    const handleSubmit = (event) => {
        event.preventDefault();
        setError(null);
        setInfoMessage(null);
        authMutation.mutate();
    };
    return (_jsx(Box, { sx: { display: "flex", justifyContent: "center", mt: 8 }, children: _jsx(Card, { sx: { width: 420 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: mode === "login" ? "Iniciar sesión" : "Crear cuenta" }), _jsxs(ToggleButtonGroup, { value: mode, exclusive: true, onChange: (_, value) => value && setMode(value), sx: { mb: 3 }, fullWidth: true, children: [_jsx(ToggleButton, { value: "login", children: "Iniciar sesi\u00F3n" }), _jsx(ToggleButton, { value: "register", children: "Registrarme" })] }), _jsx("form", { onSubmit: handleSubmit, children: _jsxs(Stack, { spacing: 2, children: [_jsx(TextField, { type: "email", label: "Email", value: email, onChange: (event) => setEmail(event.target.value), required: true }), _jsx(TextField, { type: "password", label: "Contrase\u00F1a", value: password, onChange: (event) => setPassword(event.target.value), required: true }), error && (_jsx(Typography, { color: "error", variant: "body2", children: error })), infoMessage && (_jsx(Typography, { color: "success.main", variant: "body2", children: infoMessage })), _jsx(Button, { type: "submit", variant: "contained", size: "large", disabled: authMutation.isPending, children: mode === "login" ? "Entrar" : "Registrarme" })] }) })] }) }) }));
};
export default LoginPage;
