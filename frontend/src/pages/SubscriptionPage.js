import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material";
import apiClient from "../api/client";
const paidPlans = [
    { plan: "monthly", label: "Plan mensual", price: "$12.000 CLP / mes" },
    { plan: "annual", label: "Plan anual", price: "$100.000 CLP / año" },
];
const SubscriptionPage = () => {
    const handleSubscribe = async (plan) => {
        try {
            const { data } = await apiClient.post("/subscription/flow/subscribe", { plan });
            const subscriptionId = data?.subscription?.subscriptionId || data?.subscription?.id || "(sin id)";
            alert(`Suscripción Flow creada (${subscriptionId}). Revisa tu correo para completar el pago.`);
        }
        catch (error) {
            console.error(error);
            alert("No pudimos crear la suscripción con Flow. Intenta nuevamente.");
        }
    };
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(Typography, { variant: "h5", children: "Suscripci\u00F3n" }), _jsx(Typography, { variant: "body1", children: "Disfruta la prueba gratis de 60 d\u00EDas con todas las funciones y luego confirma tu suscripci\u00F3n con Flow." }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", children: "Prueba de 60 d\u00EDas (CLP 0)" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Acceso completo durante 60 d\u00EDas. Flow cobrar\u00E1 solo si no cancelas antes del vencimiento." }), _jsx(Button, { variant: "contained", sx: { mt: 2 }, onClick: async () => {
                                            try {
                                                await apiClient.post("/subscription/start-trial");
                                                alert("Prueba activada por 60 días.");
                                            }
                                            catch (e) {
                                                console.error(e);
                                            }
                                        }, children: "Comenzar prueba" })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", children: "Plan Free" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Hasta tres proyectos activos, bases de c\u00E1lculo y vigas HA b\u00E1sicas." }), _jsx(Button, { variant: "outlined", sx: { mt: 2 }, onClick: async () => {
                                            try {
                                                await apiClient.post("/subscription/activate-free");
                                                alert("Plan Free activado.");
                                            }
                                            catch (e) {
                                                console.error(e);
                                            }
                                        }, children: "Activar plan Free" })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(Typography, { variant: "h6", children: "Suscripciones Flow" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Selecciona el plan y generaremos la suscripci\u00F3n directamente en Flow (60 d\u00EDas de prueba incluidos)." }), paidPlans.map(({ plan, label, price }) => (_jsxs(Button, { variant: "contained", color: "secondary", onClick: () => handleSubscribe(plan), children: [label, " - ", price] }, plan)))] }) }) })] })] }));
};
export default SubscriptionPage;
