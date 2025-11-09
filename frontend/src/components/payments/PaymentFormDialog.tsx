import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import { Payment } from "../../hooks/usePayments";

const kindOptions = [
  { value: "invoice", label: "Factura" },
  { value: "advance", label: "Anticipo" },
  { value: "payment", label: "Pago" },
  { value: "credit_note", label: "Nota de crédito" },
  { value: "refund", label: "Reembolso" },
];

export type PaymentFormValues = {
  event_date: Dayjs;
  kind: string;
  amount: number;
  reference: string;
  note: string;
};

const defaultValues: PaymentFormValues = {
  event_date: dayjs(),
  kind: "invoice",
  amount: 0,
  reference: "",
  note: "",
};

interface PaymentFormDialogProps {
  open: boolean;
  loading?: boolean;
  initialPayment?: Payment | null;
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => void;
}

const PaymentFormDialog = ({ open, loading, initialPayment, onClose, onSubmit }: PaymentFormDialogProps) => {
  const [values, setValues] = useState<PaymentFormValues>(defaultValues);

  useEffect(() => {
    if (!open) {
      setValues(defaultValues);
      return;
    }
    if (initialPayment) {
      setValues({
        event_date: dayjs(initialPayment.event_date),
        kind: initialPayment.kind,
        amount: Number(initialPayment.amount ?? 0),
        reference: initialPayment.reference ?? "",
        note: initialPayment.note ?? "",
      });
    } else {
      setValues(defaultValues);
    }
  }, [open, initialPayment]);

  const handleSubmit = () => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialPayment ? "Editar movimiento" : "Nuevo movimiento"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Fecha"
            type="date"
            value={values.event_date.format("YYYY-MM-DD")}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, event_date: dayjs(event.target.value) }))
            }
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            select
            label="Tipo"
            value={values.kind}
            onChange={(event) => setValues((prev) => ({ ...prev, kind: event.target.value }))}
            fullWidth
          >
            {kindOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Monto (CLP)"
            type="number"
            value={values.amount}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                amount: Number(event.target.value),
              }))
            }
          />
          <TextField
            label="Referencia"
            value={values.reference}
            onChange={(event) => setValues((prev) => ({ ...prev, reference: event.target.value }))}
          />
          <TextField
            label="Nota"
            value={values.note}
            onChange={(event) => setValues((prev) => ({ ...prev, note: event.target.value }))}
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            loading ||
            !values.event_date.isValid() ||
            !values.kind ||
            values.amount <= 0
          }
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentFormDialog;
