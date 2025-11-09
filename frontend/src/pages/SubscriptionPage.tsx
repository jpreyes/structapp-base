import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material";
import apiClient from "../api/client";

const SubscriptionPage = () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5">Suscripción</Typography>
      <Typography variant="body1">Para registrarte necesitas una suscripción activa o puedes optar por:</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Prueba 7 días (CLP 0)</Typography>
              <Typography variant="body2" color="text.secondary">Acceso completo por 7 días.</Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={async () => {
                  try {
                    await apiClient.post("/subscription/start-trial");
                    alert("Prueba activada por 7 días.");
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
              <Typography variant="body2" color="text.secondary">Incluye: Tres proyectos activos simultáneos, Bases de cálculo, Vigas HA.</Typography>
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
                Usar versión Free
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Suscripción</Typography>
              <Typography variant="body2" color="text.secondary">$9.990 CLP mensual · $100.000 CLP anual.</Typography>
              <Button
                variant="contained"
                color="secondary"
                sx={{ mt: 2 }}
                onClick={async () => {
                  try {
                    const { data } = await apiClient.post("/subscription/flow/checkout", { plan: "annual" });
                    window.open(data.checkoutUrl, "_blank");
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Pagar con Flow
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SubscriptionPage;
