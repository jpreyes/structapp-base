import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, MenuItem, TextField, Typography, } from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePayments } from "../hooks/usePayments";
import { useProjects } from "../hooks/useProjects";
import { useSession } from "../store/useSession";
import apiClient from "../api/client";
const paymentKindOptions = [
    { value: "invoice", label: "Factura" },
    { value: "advance", label: "Anticipo" },
    { value: "payment", label: "Pago" },
    { value: "credit_note", label: "Nota de crédito" },
    { value: "refund", label: "Reembolso" },
];
const emptyForm = {
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
    const [selectedProjectId, setSelectedProjectId] = useState(sessionProjectId);
    const [formOpen, setFormOpen] = useState(false);
    const [formValues, setFormValues] = useState(emptyForm);
    const [editingPayment, setEditingPayment] = useState(null);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
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
        const sum = (kind) => payments
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
        mutationFn: async (payload) => {
            const { data } = await apiClient.post("/payments", {
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
            }
            else {
                queryClient.invalidateQueries({ queryKey: ["payments"] });
            }
            closeForm();
        },
    });
    const updatePaymentMutation = useMutation({
        mutationFn: async ({ paymentId, patch }) => {
            const { data } = await apiClient.patch(`/payments/${paymentId}`, patch);
            return data;
        },
        onSuccess: () => {
            if (effectiveProjectId) {
                queryClient.invalidateQueries({ queryKey: ["payments", effectiveProjectId] });
            }
            else {
                queryClient.invalidateQueries({ queryKey: ["payments"] });
            }
            closeForm();
            setEditingPayment(null);
        },
    });
    const deletePaymentMutation = useMutation({
        mutationFn: async (paymentId) => {
            await apiClient.delete(`/payments/${paymentId}`);
        },
        onSuccess: () => {
            if (effectiveProjectId) {
                queryClient.invalidateQueries({ queryKey: ["payments", effectiveProjectId] });
            }
            else {
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
    const handleEditPayment = (payment) => {
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
        if (!effectiveProjectId)
            return;
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
        }
        else {
            createPaymentMutation.mutate({
                ...formValues,
                projectId: effectiveProjectId,
            });
        }
    };
    const columns = useMemo(() => [
        {
            field: "event_date",
            headerName: "Fecha",
            flex: 1,
            valueFormatter: ({ value }) => new Date(value).toLocaleDateString("es-CL"),
        },
        {
            field: "kind",
            headerName: "Tipo",
            flex: 1,
            valueFormatter: ({ value }) => paymentKindOptions.find((option) => option.value === value)?.label ?? value,
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
            getActions: (params) => [
                _jsx(GridActionsCellItem, { icon: _jsx(EditIcon, { fontSize: "small" }), label: "Editar", onClick: () => handleEditPayment(params.row), showInMenu: false }, "edit"),
                _jsx(GridActionsCellItem, { icon: _jsx(DeleteIcon, { fontSize: "small" }), label: "Eliminar", onClick: () => setPaymentToDelete(params.row), showInMenu: false }, "delete"),
            ],
        },
    ], [handleEditPayment]);
    return (_jsxs(Box, { sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsxs(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx(Typography, { variant: "h5", children: "Estados de pago" }), _jsx(Button, { variant: "contained", onClick: openForm, disabled: !effectiveProjectId, children: "Nuevo movimiento" })] }), _jsx(TextField, { select: true, label: "Proyecto activo", value: effectiveProjectId ?? "", onChange: (event) => {
                    setSelectedProjectId(event.target.value);
                    setProjectInSession(event.target.value);
                }, sx: { maxWidth: 320 }, size: "small", children: (projects ?? []).map((project) => (_jsx(MenuItem, { value: project.id, children: project.name }, project.id))) }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Facturado" }), _jsx(Typography, { variant: "h5", children: metrics.facturado.toLocaleString("es-CL") })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Pagado" }), _jsx(Typography, { variant: "h5", children: metrics.pagado.toLocaleString("es-CL") })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "button", color: "text.secondary", children: "Saldo por cobrar" }), _jsx(Typography, { variant: "h5", children: metrics.saldo.toLocaleString("es-CL") })] }) }) })] }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Movimientos" }), _jsx("div", { style: { height: 520, width: "100%" }, children: _jsx(DataGrid, { rows: payments, columns: columns, disableRowSelectionOnClick: true, getRowId: (row) => row.id, density: "comfortable", localeText: {
                                    noRowsLabel: "Sin movimientos registrados",
                                } }) })] }) }), _jsxs(Dialog, { open: formOpen, onClose: closeForm, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: editingPayment ? "Editar movimiento" : "Nuevo movimiento" }), _jsxs(DialogContent, { dividers: true, sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [_jsx(TextField, { label: "Fecha", type: "date", value: formValues.event_date, onChange: (event) => setFormValues((prev) => ({ ...prev, event_date: event.target.value })), InputLabelProps: { shrink: true } }), _jsx(TextField, { select: true, label: "Tipo", value: formValues.kind, onChange: (event) => setFormValues((prev) => ({ ...prev, kind: event.target.value })), children: paymentKindOptions.map((option) => (_jsx(MenuItem, { value: option.value, children: option.label }, option.value))) }), _jsx(TextField, { label: "Monto (CLP)", type: "number", value: formValues.amount, onChange: (event) => setFormValues((prev) => ({ ...prev, amount: Number(event.target.value) })) }), _jsx(TextField, { label: "Referencia", value: formValues.reference, onChange: (event) => setFormValues((prev) => ({ ...prev, reference: event.target.value })) }), _jsx(TextField, { label: "Nota", value: formValues.note, onChange: (event) => setFormValues((prev) => ({ ...prev, note: event.target.value })), multiline: true, minRows: 3 })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: closeForm, children: "Cancelar" }), _jsx(Button, { variant: "contained", onClick: handleSubmit, disabled: createPaymentMutation.isPending ||
                                    updatePaymentMutation.isPending ||
                                    !effectiveProjectId ||
                                    !formValues.event_date ||
                                    !formValues.kind ||
                                    formValues.amount <= 0, children: "Guardar" })] })] }), _jsxs(Dialog, { open: Boolean(paymentToDelete), onClose: () => setPaymentToDelete(null), children: [_jsx(DialogTitle, { children: "Eliminar movimiento" }), _jsx(DialogContent, { children: _jsxs(DialogContentText, { children: ["\u00BFSeguro que deseas eliminar el movimiento \"", paymentToDelete?.reference ?? paymentToDelete?.kind, "\"?"] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setPaymentToDelete(null), children: "Cancelar" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => paymentToDelete && deletePaymentMutation.mutate(paymentToDelete.id), disabled: deletePaymentMutation.isPending, children: "Eliminar" })] })] })] }));
};
export default PaymentsPage;
