import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid, Stack, TextField, Typography, } from "@mui/material";
import apiClient from "../api/client";
import { useSession } from "../store/useSession";
const SettingsPage = () => {
    const setUser = useSession((state) => state.setUser);
    const token = useSession((state) => state.token);
    const setToken = useSession((state) => state.setToken);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
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
        return (_jsx(Chip, { label: `${profile.plan ?? "Plan"} • ${status}`, color: "primary", variant: "outlined", size: "small", sx: { fontWeight: 600 } }));
    }, [profile]);
    useEffect(() => {
        if (!token) {
            return;
        }
        let mounted = true;
        const loadProfile = async () => {
            setLoading(true);
            try {
                const { data } = await apiClient.get("/users/me");
                if (!mounted)
                    return;
                setProfile(data);
                setFormState({
                    email: data.email,
                    fullName: data.full_name ?? "",
                    profession: data.profession ?? "",
                    avatarUrl: data.avatar_url ?? "",
                });
            }
            catch (err) {
                console.error(err);
            }
            finally {
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
    const handleSave = async (event) => {
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
        const payload = {
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
            const { data } = await apiClient.patch("/users/me", payload);
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
        }
        catch (err) {
            const detail = err?.response?.data?.detail ?? "No pudimos actualizar el perfil.";
            setError(detail);
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteAccount = async () => {
        const confirmed = window.confirm("¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.");
        if (!confirmed) {
            return;
        }
        try {
            await apiClient.delete("/auth/me");
            setToken(null);
            setUser(undefined);
            alert("Cuenta eliminada. Te redirigiremos al login.");
            window.location.replace("/login");
        }
        catch (err) {
            console.error(err);
            setError("No pudimos eliminar tu cuenta. Intenta nuevamente.");
        }
    };
    const initials = useMemo(() => {
        const fullName = formState.fullName || profile?.full_name || profile?.email || "";
        const parts = fullName.trim().split(" ");
        if (parts.length === 0)
            return "ST";
        const first = parts[0]?.[0] ?? "";
        const second = parts[1]?.[0] ?? "";
        return (first + second).toUpperCase();
    }, [formState.fullName, profile]);
    const formatDate = (value) => value ? new Date(value).toLocaleDateString("es-CL") : "Sin fecha";
    if (loading) {
        return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", alignItems: "center", mt: 8, gap: 2 }, children: [_jsx(CircularProgress, {}), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Cargando tu perfil..." })] }));
    }
    return (_jsxs(Stack, { spacing: 3, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Configuraci\u00F3n" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Actualiza tus datos y mant\u00E9n tu perfil alineado con el equipo." })] }), message && _jsx(Alert, { severity: "success", children: message }), error && _jsx(Alert, { severity: "error", children: error }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsxs(Grid, { item: true, xs: 12, md: 4, children: [_jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsx(Avatar, { sx: {
                                                    width: 64,
                                                    height: 64,
                                                    bgcolor: "primary.main",
                                                    fontWeight: 700,
                                                    fontSize: "1.2rem",
                                                }, children: initials }), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: profile?.full_name || "Tu perfil" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: formState.email })] }), planBadge, _jsx(Divider, {}), _jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Profesi\u00F3n" }), _jsx(Typography, { variant: "body1", children: formState.profession || "Sin información" })] })] }) }) }), _jsx(Card, { sx: { mt: 3 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Plan y uso" }), _jsx(Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: "Estado del plan actual y fechas relevantes." }), _jsxs(Stack, { spacing: 1.5, sx: { mt: 1 }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Inicio" }), _jsx(Typography, { variant: "body2", children: formatDate(profile?.plan_started_at) })] }), _jsxs(Stack, { direction: "row", justifyContent: "space-between", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Expira" }), _jsx(Typography, { variant: "body2", children: formatDate(profile?.plan_expires_at) })] }), _jsx(Divider, {}), _jsxs(Stack, { direction: "row", justifyContent: "space-between", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Proyectos creados" }), _jsx(Typography, { variant: "body1", fontWeight: 700, children: profile?.project_count ?? 0 })] }), _jsxs(Stack, { direction: "row", justifyContent: "space-between", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "L\u00EDmite de proyectos" }), _jsx(Typography, { variant: "body1", fontWeight: 700, children: profile?.project_limit ?? "Sin límite" })] })] })] }) })] }), _jsx(Grid, { item: true, xs: 12, md: 8, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsxs(Stack, { spacing: 0.5, children: [_jsx(Typography, { variant: "h6", children: "Datos de la cuenta" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Informaci\u00F3n visible en reportes y notificaciones." })] }), _jsxs(Box, { component: "form", onSubmit: handleSave, noValidate: true, children: [_jsxs(Grid, { container: true, spacing: 2, sx: { mt: 1 }, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "Email", type: "email", value: formState.email, onChange: (event) => setFormState((prev) => ({ ...prev, email: event.target.value })), required: true, fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Nombre completo", value: formState.fullName, onChange: (event) => setFormState((prev) => ({ ...prev, fullName: event.target.value })), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Profesi\u00F3n", value: formState.profession, onChange: (event) => setFormState((prev) => ({ ...prev, profession: event.target.value })), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "URL del avatar", value: formState.avatarUrl, onChange: (event) => setFormState((prev) => ({ ...prev, avatarUrl: event.target.value })), fullWidth: true }) })] }), _jsx(Divider, { sx: { my: 3 } }), _jsxs(Stack, { spacing: 0.5, sx: { mb: 1 }, children: [_jsx(Typography, { variant: "subtitle1", children: "Seguridad" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Cambia la contrase\u00F1a cuando sea necesario." })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Nueva contrase\u00F1a", type: "password", value: password, onChange: (event) => setPassword(event.target.value), fullWidth: true }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Confirmar contrase\u00F1a", type: "password", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), fullWidth: true }) })] }), _jsx(Stack, { direction: { xs: "column", sm: "row" }, justifyContent: "flex-end", gap: 2, mt: 3, children: _jsx(Button, { type: "submit", variant: "contained", disabled: saving, children: saving ? "Guardando..." : "Guardar cambios" }) })] })] }) }) })] }), _jsx(Card, { sx: { borderColor: "error.light", backgroundColor: "rgba(239,68,68,0.05)" }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", color: "error", gutterBottom: true, children: "Eliminar cuenta" }), _jsx(Typography, { variant: "body2", color: "text.secondary", paragraph: true, children: "Esta acci\u00F3n borra tu cuenta y todos tus datos. No se puede revertir." }), _jsx(Button, { variant: "outlined", color: "error", onClick: handleDeleteAccount, children: "Eliminar mi cuenta" })] }) })] }));
};
export default SettingsPage;
