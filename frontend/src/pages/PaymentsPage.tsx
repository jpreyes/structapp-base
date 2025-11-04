import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";

import { usePayments } from "../hooks/usePayments";
import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";

const columns: GridColDef[] = [
  { field: "event_date", headerName: "Fecha", flex: 1 },
  {
    field: "kind",
    headerName: "Tipo",
    flex: 1,
    valueFormatter: ({ value }) =>
      ({ invoice: "Factura", payment: "Pago", advance: "Anticipo", credit_note: "NC", refund: "Reembolso" } as const)[
        value as string
      ] ?? value,
  },
  {
    field: "amount",
    headerName: "Monto (CLP)",
    flex: 1,
    valueFormatter: ({ value }) => Number(value).toLocaleString("es-CL"),
  },
  { field: "reference", headerName: "Referencia", flex: 1 },
  { field: "note", headerName: "Nota", flex: 1 },
];

const PaymentsPage = () => {
  const projectId = useSession((state) => state.projectId);
  const { data: projects } = useProjects();
  const activeProjectId = projectId ?? projects?.[0]?.id;
  const { data: payments } = usePayments(activeProjectId);

  const metrics = useMemo(() => {
    const invoice = payments?.filter((p) => p.kind === "invoice").reduce((acc, p) => acc + p.amount, 0) ?? 0;
    const advance = payments?.filter((p) => p.kind === "advance").reduce((acc, p) => acc + p.amount, 0) ?? 0;
    const payment = payments?.filter((p) => p.kind === "payment").reduce((acc, p) => acc + p.amount, 0) ?? 0;
    const credit = payments?.filter((p) => p.kind === "credit_note").reduce((acc, p) => acc + p.amount, 0) ?? 0;
    const refund = payments?.filter((p) => p.kind === "refund").reduce((acc, p) => acc + p.amount, 0) ?? 0;
    const facturado = Math.max(invoice - credit, 0);
    const pagado = Math.max(payment + advance - refund, 0);
    const saldo = Math.max(facturado - pagado, 0);
    return { facturado, pagado, saldo };
  }, [payments]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Facturado
              </Typography>
              <Typography variant="h5">{metrics.facturado.toLocaleString("es-CL")}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Pagado
              </Typography>
              <Typography variant="h5">{metrics.pagado.toLocaleString("es-CL")}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="button" color="text.secondary">
                Saldo por cobrar
              </Typography>
              <Typography variant="h5">{metrics.saldo.toLocaleString("es-CL")}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Movimientos
          </Typography>
          <div style={{ height: 520, width: "100%" }}>
            <DataGrid
              rows={payments ?? []}
              columns={columns}
              disableSelectionOnClick
              getRowId={(row) => row.id}
            />
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentsPage;
