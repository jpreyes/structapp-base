import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
const kindOptions = [
    { value: "invoice", label: "Factura" },
    { value: "advance", label: "Anticipo" },
    { value: "payment", label: "Pago" },
    { value: "credit_note", label: "Nota de crédito" },
    { value: "refund", label: "Reembolso" },
];
const defaultValues = {
    event_date: dayjs(),
    kind: "invoice",
    amount: 0,
    reference: "",
    note: "",
};
const PaymentFormDialog = ({ open, loading, initialPayment, onClose, onSubmit }) => {
    const [values, setValues] = useState(defaultValues);
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
        }
        else {
            setValues(defaultValues);
        }
    }, [open, initialPayment]);
    const handleSubmit = () => {
        onSubmit(values);
    };
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: initialPayment ? "Editar movimiento" : "Nuevo movimiento" }), _jsx(DialogContent, { dividers: true, children: _jsxs(Stack, { spacing: 2, sx: { mt: 1 }, children: [_jsx(TextField, { label: "Fecha", type: "date", value: values.event_date.format("YYYY-MM-DD"), onChange: (event) => setValues((prev) => ({ ...prev, event_date: dayjs(event.target.value) })), InputLabelProps: { shrink: true }, fullWidth: true }), _jsx(TextField, { select: true, label: "Tipo", value: values.kind, onChange: (event) => setValues((prev) => ({ ...prev, kind: event.target.value })), fullWidth: true, children: kindOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, option.value))) }), _jsx(TextField, { label: "Monto (CLP)", type: "number", value: values.amount, onChange: (event) => setValues((prev) => ({
                                ...prev,
                                amount: Number(event.target.value),
                            })) }), _jsx(TextField, { label: "Referencia", value: values.reference, onChange: (event) => setValues((prev) => ({ ...prev, reference: event.target.value })) }), _jsx(TextField, { label: "Nota", value: values.note, onChange: (event) => setValues((prev) => ({ ...prev, note: event.target.value })), multiline: true, minRows: 3 })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: handleSubmit, disabled: loading ||
                            !values.event_date.isValid() ||
                            !values.kind ||
                            values.amount <= 0, children: "Guardar" })] })] }));
};
export default PaymentFormDialog;
