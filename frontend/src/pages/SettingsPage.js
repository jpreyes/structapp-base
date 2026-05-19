import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid, LinearProgress, Stack, TextField, Typography, } from "@mui/material";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useSession } from "../store/useSession";
import { useProjects } from "../hooks/useProjects";
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
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
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
        return (_jsx(Chip, { label: `${profile.plan ?? "Plan"} - ${status}`, color: "primary", variant: "outlined", size: "small", sx: { fontWeight: 600 } }));
    }, [profile]);
    const companyNameLabel = useMemo(() => {
        const value = formState.companyName.trim() || profile?.company_name?.trim() || "";
        return value || "Empresa individual";
    }, [formState.companyName, profile?.company_name]);
    const companyRoleLabel = useMemo(() => {
        const value = formState.companyRole.trim() || profile?.company_role?.trim() || "";
        return value || "Propietario";
    }, [formState.companyRole, profile?.company_role]);
    const applyProfileToForm = (data) => {
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
                const { data } = await apiClient.get("/users/me");
                if (!mounted)
                    return;
                setProfile(data);
                applyProfileToForm(data);
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
            company_name: formState.companyName.trim(),
            company_role: formState.companyRole.trim(),
            avatar_url: formState.avatarUrl.trim(),
        };
        if (password) {
            payload.password = password;
        }
        setSaving(true);
        try {
            const { data } = await apiClient.patch("/users/me", payload);
            setProfile(data);
            applyProfileToForm(data);
            setMessage("Cambios guardados correctamente.");
            setEditing(false);
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
    const handleCancelEdit = () => {
        applyProfileToForm(profile);
        setEditing(false);
        setError(null);
        setMessage(null);
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
    const projectCount = useMemo(() => {
        const fromProfile = profile?.project_count ?? 0;
        const fromList = projects?.length ?? 0;
        return Math.max(fromProfile, fromList);
    }, [profile?.project_count, projects]);
    const formatDate = (value) => {
        if (!value)
            return "Sin fecha";
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime()))
            return "Sin fecha";
        return parsed.toLocaleDateString("es-CL");
    };
    const projectLimit = profile?.project_limit;
    const projectLimitLabel = projectLimit == null ? "Sin límite" : projectLimit.toString();
    const usageRatio = projectLimit && projectLimit > 0 ? Math.min(projectCount / projectLimit, 1) : null;
    if (loading) {
        return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", alignItems: "center", mt: 8, gap: 2 }, children: [_jsx(CircularProgress, {}), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Cargando tu perfil..." })] }));
    }
    return (_jsxs(Stack, { spacing: 3.5, children: [_jsxs(Stack, { direction: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", spacing: 2, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Perfil y preferencias" }), _jsx(Typography, { variant: "body1", color: "text.secondary", children: "Administra tu cuenta, empresa y seguridad desde un solo lugar." })] }), !editing && (_jsx(Button, { variant: "contained", onClick: () => setEditing(true), children: "Editar perfil" }))] }), message && _jsx(Alert, { severity: "success", children: message }), error && _jsx(Alert, { severity: "error", children: error }), editing ? (_jsx(Box, { component: "form", onSubmit: handleSave, noValidate: true, children: _jsxs(Stack, { spacing: 3, children: [_jsx(Card, { sx: sectionCardSx, children: _jsx(CardContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: "Perfil" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Informaci\u00F3n visible en reportes y notificaciones." })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "Email", type: "email", value: formState.email, onChange: (event) => setFormState((prev) => ({ ...prev, email: event.target.value })), required: true, fullWidth: true, autoComplete: "email" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Nombre completo", value: formState.fullName, onChange: (event) => setFormState((prev) => ({ ...prev, fullName: event.target.value })), fullWidth: true, autoComplete: "name" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Profesi\u00F3n", value: formState.profession, onChange: (event) => setFormState((prev) => ({ ...prev, profession: event.target.value })), fullWidth: true, autoComplete: "organization-title" }) }), _jsx(Grid, { item: true, xs: 12, children: _jsx(TextField, { label: "URL del avatar", value: formState.avatarUrl, onChange: (event) => setFormState((prev) => ({ ...prev, avatarUrl: event.target.value })), fullWidth: true, autoComplete: "url" }) })] })] }) }) }), _jsx(Card, { sx: sectionCardSx, children: _jsx(CardContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: "Empresa/Equipo" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Si trabajas de forma individual, usa \"Empresa individual\"." })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 7, children: _jsx(TextField, { label: "Nombre de empresa", value: formState.companyName, onChange: (event) => setFormState((prev) => ({ ...prev, companyName: event.target.value })), placeholder: "Empresa individual", helperText: "Deja vac\u00EDo para usar Empresa individual.", fullWidth: true, autoComplete: "organization" }) }), _jsx(Grid, { item: true, xs: 12, sm: 5, children: _jsx(TextField, { label: "Rol en la empresa", value: formState.companyRole, onChange: (event) => setFormState((prev) => ({ ...prev, companyRole: event.target.value })), placeholder: "Propietario", helperText: "Ej: Propietario, Director t\u00E9cnico.", fullWidth: true, autoComplete: "organization-title" }) })] })] }) }) }), _jsx(Card, { sx: sectionCardSx, children: _jsx(CardContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: "Seguridad" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Cambia tu contrase\u00F1a cuando sea necesario." })] }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Nueva contrase\u00F1a", type: "password", value: password, onChange: (event) => setPassword(event.target.value), fullWidth: true, autoComplete: "new-password" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, children: _jsx(TextField, { label: "Confirmar contrase\u00F1a", type: "password", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), fullWidth: true, autoComplete: "new-password" }) })] })] }) }) }), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, justifyContent: "flex-end", gap: 2, children: [_jsx(Button, { variant: "outlined", onClick: handleCancelEdit, children: "Cancelar" }), _jsx(Button, { type: "submit", variant: "contained", disabled: saving, children: saving ? "Guardando..." : "Guardar cambios" })] })] }) })) : (_jsx(Box, { sx: { maxWidth: 520 }, children: _jsxs(Stack, { spacing: 3, children: [_jsxs(Card, { sx: (theme) => ({
                                ...sectionCardSx,
                                position: "relative",
                                overflow: "hidden",
                                background: theme.palette.mode === "light"
                                    ? "linear-gradient(140deg, rgba(14, 116, 144, 0.12), rgba(59, 130, 246, 0.08))"
                                    : theme.palette.background.paper,
                            }), children: [_jsx(Box, { sx: (theme) => ({
                                        position: "absolute",
                                        inset: 0,
                                        opacity: theme.palette.mode === "light" ? 0.9 : 0,
                                        background: "radial-gradient(600px circle at 10% 10%, rgba(56, 189, 248, 0.25), transparent 45%), radial-gradient(400px circle at 90% 0%, rgba(34, 197, 94, 0.18), transparent 50%)",
                                    }) }), _jsx(CardContent, { sx: { position: "relative" }, children: _jsxs(Stack, { spacing: 2.5, children: [_jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", children: [_jsx(Avatar, { sx: {
                                                            width: 64,
                                                            height: 64,
                                                            bgcolor: "primary.main",
                                                            fontWeight: 700,
                                                            fontSize: "1.2rem",
                                                        }, children: initials }), _jsxs(Box, { sx: { minWidth: 0, flex: 1 }, children: [_jsx(Typography, { variant: "h6", noWrap: true, children: profile?.full_name || "Tu perfil" }), _jsx(Typography, { variant: "body2", color: "text.secondary", noWrap: true, children: formState.email }), formState.profession && (_jsx(Typography, { variant: "body2", color: "text.secondary", noWrap: true, children: formState.profession }))] })] }), _jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: [planBadge, _jsx(Chip, { label: `${projectCount} proyectos`, size: "small", variant: "outlined" })] }), _jsx(Divider, {}), _jsxs(Stack, { direction: { xs: "column", sm: "row" }, spacing: 1.5, children: [_jsxs(Box, { sx: statTileSx, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Empresa" }), _jsx(Typography, { variant: "subtitle1", fontWeight: 600, noWrap: true, children: companyNameLabel })] }), _jsxs(Box, { sx: statTileSx, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Rol" }), _jsx(Typography, { variant: "subtitle1", fontWeight: 600, noWrap: true, children: companyRoleLabel })] })] })] }) })] }), _jsx(Card, { sx: sectionCardSx, children: _jsx(CardContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", children: "Empresa/Equipo" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: profile?.company_name ? "Datos de tu empresa." : "Empresa individual." })] }), _jsx(Divider, {}), _jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Empresa" }), _jsx(Typography, { variant: "body1", fontWeight: 600, children: companyNameLabel })] }), _jsxs(Stack, { spacing: 1, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Rol" }), _jsx(Typography, { variant: "body1", fontWeight: 600, children: companyRoleLabel })] })] }) }) }), _jsx(Card, { sx: sectionCardSx, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Plan y uso" }), _jsx(Typography, { variant: "body2", color: "text.secondary", gutterBottom: true, children: "Estado del plan actual y uso del espacio." }), _jsxs(Stack, { spacing: 1.5, sx: { mt: 1 }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Inicio" }), _jsx(Typography, { variant: "body2", children: formatDate(profile?.plan_started_at) })] }), _jsxs(Stack, { direction: "row", justifyContent: "space-between", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Expira" }), _jsx(Typography, { variant: "body2", children: formatDate(profile?.plan_expires_at) })] }), _jsx(Divider, {}), _jsxs(Stack, { direction: "row", justifyContent: "space-between", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "Proyectos creados" }), _jsx(Typography, { variant: "body1", fontWeight: 700, children: projectCount })] }), _jsxs(Stack, { direction: "row", justifyContent: "space-between", children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "L\u00EDmite de proyectos" }), _jsx(Typography, { variant: "body1", fontWeight: 700, children: projectLimitLabel })] }), projectLimit == null ? (_jsx(Typography, { variant: "caption", color: "text.secondary", children: "Sin l\u00EDmite de proyectos." })) : projectLimit > 0 ? (_jsxs(Box, { children: [_jsx(LinearProgress, { variant: "determinate", value: usageRatio ? usageRatio * 100 : 0, sx: { height: 8, borderRadius: 4, mt: 1 } }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [projectCount, " de ", projectLimit, " proyectos en uso."] })] })) : (_jsx(Typography, { variant: "caption", color: "text.secondary", children: "L\u00EDmite actual: 0 proyectos." }))] }), _jsx(Button, { variant: "outlined", sx: { mt: 2 }, onClick: () => navigate("/subscription"), children: "Administrar plan" })] }) })] }) })), _jsx(Card, { sx: (theme) => ({
                    ...sectionCardSx,
                    borderColor: "error.light",
                    backgroundColor: theme.palette.mode === "light" ? "rgba(239, 68, 68, 0.06)" : "rgba(248, 113, 113, 0.12)",
                }), children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", color: "error", gutterBottom: true, children: "Eliminar cuenta" }), _jsx(Typography, { variant: "body2", color: "text.secondary", paragraph: true, children: "Esta acci\u00F3n borra tu cuenta y todos tus datos. No se puede revertir." }), _jsx(Button, { variant: "outlined", color: "error", onClick: handleDeleteAccount, children: "Eliminar mi cuenta" })] }) })] }));
};
export default SettingsPage;
