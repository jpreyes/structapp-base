import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridColDef, GridRowParams } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usePayments, Payment } from "../hooks/usePayments";
import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";
import apiClient from "../api/client";

type PaymentFormValues = {
  event_date: string;
  kind: string;
  amount: number;
  reference: string;
  note: string;
};

const paymentKindOptions = [
  { value: "invoice", label: "Factura" },
  { value: "advance", label: "Anticipo" },
  { value: "payment", label: "Pago" },
  { value: "credit_note", label: "Nota de crédito" },
  { value: "refund", label: "Reembolso" },
];

const emptyForm: PaymentFormValues = {
  event_date: new Date().toISOString().slice(0, 10),
  kind: "invoice",
  amount: 0,
  reference: "",
  note: "",
};

const PaymentsPage = () => {
  const sessionProjectId = useSession((state) => state.projectId);
  const setProjectInSession = useSession((state) => state.setProject);
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(sessionProjectId);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<PaymentFormValues>(emptyForm);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const effectiveProjectId = selectedProjectId ?? projects?.[0]?.id;
  const { data: payments = [] } = usePayments(effectiveProjectId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!selectedProjectId && projects?.length) {
      const firstProjectId = sessionProjectId ?? projects[0].id;
      setSelectedProjectId(firstProjectId);
      setProjectInSession(firstProjectId);
    }
  }, [projects, selectedProjectId, sessionProjectId, setProjectInSession]);

  const metrics = useMemo(() => {
    if (!payments.length) {
      return { facturado: 0, pagado: 0, saldo: 0 };
    }
    const sum = (kind: string) =>
      payments
        .filter((payment) => payment.kind === kind)
        .reduce((acc, item) => acc + Number(item.amount ?? 0), 0);
    const invoice = sum("invoice");
    const advance = sum("advance");
    const payment = sum("payment");
    const credit = sum("credit_note");
    const refund = sum("refund");
    const facturado = Math.max(invoice - credit, 0);
    const pagado = Math.max(payment + advance - refund, 0);
    const saldo = Math.max(facturado - pagado, 0);
    return { facturado, pagado, saldo };
  }, [payments]);

  const createPaymentMutation = useMutation({
    mutationFn: async (payload: PaymentFormValues & { projectId: string }) => {
      const { data } = await apiClient.post<Payment>("/payments", {
        project_id: payload.projectId,
        event_date: payload.event_date,
        kind: payload.kind,
        amount: payload.amount,
        reference: payload.reference || null,
        note: payload.note || null,
        currency: "CLP",
      });
      return data;
    },
    onSuccess: () => {
      if (effectiveProjectId) {
        queryClient.invalidateQueries({ queryKey: ["payments", effectiveProjectId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["payments"] });
      }
      closeForm();
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, patch }: { paymentId: string; patch: Partial<Payment> }) => {
      const { data } = await apiClient.patch<Payment>(`/payments/${paymentId}`, patch);
      return data;
    },
    onSuccess: () => {
      if (effectiveProjectId) {
        queryClient.invalidateQueries({ queryKey: ["payments", effectiveProjectId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["payments"] });
      }
      closeForm();
      setEditingPayment(null);
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await apiClient.delete(`/payments/${paymentId}`);
    },
    onSuccess: () => {
      if (effectiveProjectId) {
        queryClient.invalidateQueries({ queryKey: ["payments", effectiveProjectId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["payments"] });
      }
      setPaymentToDelete(null);
    },
  });

  const openForm = () => {
    setFormValues(emptyForm);
    setEditingPayment(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormValues(emptyForm);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setFormValues({
      event_date: payment.event_date,
      kind: payment.kind,
      amount: Number(payment.amount ?? 0),
      reference: payment.reference ?? "",
      note: payment.note ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!effectiveProjectId) return;
    if (editingPayment) {
      updatePaymentMutation.mutate({
        paymentId: editingPayment.id,
        patch: {
          event_date: formValues.event_date,
          kind: formValues.kind,
          amount: formValues.amount,
          reference: formValues.reference || null,
          note: formValues.note || null,
        },
      });
    } else {
      createPaymentMutation.mutate({
        ...formValues,
        projectId: effectiveProjectId,
      });
    }
  };

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "event_date",
        headerName: "Fecha",
        flex: 1,
        valueFormatter: ({ value }) => new Date(value as string).toLocaleDateString("es-CL"),
      },
      {
        field: "kind",
        headerName: "Tipo",
        flex: 1,
        valueFormatter: ({ value }) =>
          paymentKindOptions.find((option) => option.value === value)?.label ?? (value as string),
      },
      {
        field: "amount",
        headerName: "Monto (CLP)",
        flex: 1,
        type: "number",
        valueFormatter: ({ value }) => Number(value).toLocaleString("es-CL"),
      },
      { field: "reference", headerName: "Referencia", flex: 1 },
      { field: "note", headerName: "Nota", flex: 1 },
      {
        field: "actions",
        type: "actions",
        headerName: "",
        width: 120,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon fontSize="small" />}
            label="Editar"
            onClick={() => handleEditPayment(params.row as Payment)}
            showInMenu={false}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon fontSize="small" />}
            label="Eliminar"
            onClick={() => setPaymentToDelete(params.row as Payment)}
            showInMenu={false}
          />,
        ],
      },
    ],
    [handleEditPayment]
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">Estados de pago</Typography>
        <Button variant="contained" onClick={openForm} disabled={!effectiveProjectId}>
          Nuevo movimiento
        </Button>
      </Box>

      <TextField
        select
        label="Proyecto activo"
        value={effectiveProjectId ?? ""}
        onChange={(event) => {
          setSelectedProjectId(event.target.value);
          setProjectInSession(event.target.value);
        }}
        sx={{ maxWidth: 320 }}
        size="small"
      >
        {(projects ?? []).map((project) => (
          <MenuItem key={project.id} value={project.id}>
            {project.name}
          </MenuItem>
        ))}
      </TextField>

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
              rows={payments}
              columns={columns}
              disableRowSelectionOnClick
              getRowId={(row) => row.id}
              density="comfortable"
              localeText={{
                noRowsLabel: "Sin movimientos registrados",
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onClose={closeForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPayment ? "Editar movimiento" : "Nuevo movimiento"}</DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Fecha"
            type="date"
            value={formValues.event_date}
            onChange={(event) => setFormValues((prev) => ({ ...prev, event_date: event.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label="Tipo"
            value={formValues.kind}
            onChange={(event) => setFormValues((prev) => ({ ...prev, kind: event.target.value }))}
          >
            {paymentKindOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Monto (CLP)"
            type="number"
            value={formValues.amount}
            onChange={(event) =>
              setFormValues((prev) => ({ ...prev, amount: Number(event.target.value) }))
            }
          />
          <TextField
            label="Referencia"
            value={formValues.reference}
            onChange={(event) => setFormValues((prev) => ({ ...prev, reference: event.target.value }))}
          />
          <TextField
            label="Nota"
            value={formValues.note}
            onChange={(event) => setFormValues((prev) => ({ ...prev, note: event.target.value }))}
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              createPaymentMutation.isPending ||
              updatePaymentMutation.isPending ||
              !effectiveProjectId ||
              !formValues.event_date ||
              !formValues.kind ||
              formValues.amount <= 0
            }
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(paymentToDelete)}
        onClose={() => setPaymentToDelete(null)}
      >
        <DialogTitle>Eliminar movimiento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que deseas eliminar el movimiento "{paymentToDelete?.reference ?? paymentToDelete?.kind}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentToDelete(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => paymentToDelete && deletePaymentMutation.mutate(paymentToDelete.id)}
            disabled={deletePaymentMutation.isPending}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsPage;
