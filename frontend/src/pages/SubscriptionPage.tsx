import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material";
import apiClient from "../api/client";

const paidPlans = [
  { plan: "monthly", label: "Plan mensual", price: "$12.000 CLP / mes" },
  { plan: "annual", label: "Plan anual", price: "$100.000 CLP / anio" },
];

const SubscriptionPage = () => {
  const handleSubscribe = async (plan: string) => {
    try {
      const { data } = await apiClient.post("/subscription/flow/subscribe", { plan });
      const subscriptionId = data?.subscription?.subscriptionId || data?.subscription?.id || "(sin id)";
      alert(`Suscripcion Flow creada (${subscriptionId}). Revisa tu correo para completar el pago.`);
    } catch (error) {
      console.error(error);
      alert("No pudimos crear la suscripcion con Flow. Intenta nuevamente.");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5">Suscripcion</Typography>
      <Typography variant="body1">
        Disfruta la prueba gratis de 60 dias con todas las funciones y luego confirma tu suscripcion con Flow.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Prueba 60 dias (CLP 0)</Typography>
              <Typography variant="body2" color="text.secondary">
                Acceso completo durante 60 dias. Flow cobrara solo si no cancelas antes del vencimiento.
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={async () => {
                  try {
                    await apiClient.post("/subscription/start-trial");
                    alert("Prueba activada por 60 dias.");
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Comenzar prueba
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Plan Free</Typography>
              <Typography variant="body2" color="text.secondary">
                Tres proyectos activos simultaneos, bases de calculo y vigas HA basicas.
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={async () => {
                  try {
                    await apiClient.post("/subscription/activate-free");
                    alert("Plan Free activado.");
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Usar version Free
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h6">Suscripciones Flow</Typography>
              <Typography variant="body2" color="text.secondary">
                Selecciona el plan y generaremos la suscripcion directamente en Flow (trial de 60 dias incluido).
              </Typography>
              {paidPlans.map(({ plan, label, price }) => (
                <Button key={plan} variant="contained" color="secondary" onClick={() => handleSubscribe(plan)}>
                  {label} - {price}
                </Button>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SubscriptionPage;
