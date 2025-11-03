from collections import defaultdict
from datetime import date
from typing import List

import pandas as pd
import streamlit as st

from supa.client import supa
from utils.format import clp, to_int

PAYMENT_LABELS = {
    "invoice": "Factura emitida",
    "advance": "Anticipo",
    "payment": "Pago recibido",
    "credit_note": "Nota de credito",
    "refund": "Reembolso",
}


@st.cache_data(ttl=30)
def _load_payments(project_id: str, version: int) -> List[dict]:
    return (
        supa()
        .table("project_payments")
        .select("*")
        .eq("project_id", project_id)
        .order("event_date", desc=True)
        .execute()
        .data
    )


def _increment_payments_version() -> None:
    st.session_state["payments_version"] = st.session_state.get("payments_version", 0) + 1


def render():
    st.header("Estados de pago")
    project = st.session_state.get("project")
    if not project:
        st.info("Selecciona un proyecto primero (desde Proyectos).")
        st.stop()

    st.caption(f"Proyecto: **{project['name']}**")

    with st.form("payform"):
        st.subheader("Registrar movimiento")
        c1, c2, c3 = st.columns([1, 1, 1])
        kind = c1.selectbox(
            "Tipo", options=list(PAYMENT_LABELS.keys()), format_func=lambda k: PAYMENT_LABELS[k]
        )
        amount = c2.number_input("Monto (CLP)", min_value=0, step=100000, value=500000, format="%i")
        event_date = c3.date_input("Fecha", value=date.today())
        reference = st.text_input("Referencia (factura, OC, etc.)")
        note = st.text_area("Nota", height=80)
        submitted = st.form_submit_button("Agregar", type="primary", use_container_width=True)
        if submitted:
            supa().table("project_payments").insert(
                {
                    "project_id": project["id"],
                    "kind": kind,
                    "amount": int(amount),
                    "event_date": str(event_date),
                    "reference": reference.strip() or None,
                    "note": note.strip() or None,
                    "currency": "CLP",
                }
            ).execute()
            _increment_payments_version()
            st.success("Movimiento registrado.")
            st.rerun()

    version = st.session_state.get("payments_version", 0)
    data = _load_payments(project["id"], version)

    if st.button("Actualizar lista", use_container_width=False):
        _increment_payments_version()
        st.rerun()

    budget = to_int(project.get("budget")) or 0
    totals = defaultdict(int)
    for row in data:
        totals[row["kind"]] += to_int(row.get("amount")) or 0

    invoice_total = totals["invoice"]
    credit_notes_total = totals["credit_note"]
    advance_total = totals["advance"]
    payments_total = totals["payment"]
    refunds_total = totals["refund"]

    total_invoiced = max(invoice_total - credit_notes_total, 0)
    total_paid = max(payments_total + advance_total - refunds_total, 0)
    to_invoice = max(budget - total_invoiced, 0)
    to_collect = max(total_invoiced - total_paid, 0)

    metrics = st.columns(4)
    metrics[0].metric("Presupuesto CLP", f"CLP {clp(budget)}")
    metrics[1].metric("Facturado", f"CLP {clp(total_invoiced)}")
    metrics[2].metric("Pagado", f"CLP {clp(total_paid)}")
    metrics[3].metric("Saldo por cobrar", f"CLP {clp(to_collect)}")

    st.caption(
        f"Por facturar: CLP {clp(to_invoice)} · Anticipos aplicados: CLP {clp(advance_total)}"
    )

    st.divider()

    if not data:
        st.info("Aun no hay movimientos para este proyecto.")
    else:
        table = pd.DataFrame(
            [
                {
                    "Fecha": row["event_date"],
                    "Tipo": PAYMENT_LABELS.get(row["kind"], row["kind"]),
                    "Monto CLP": clp(row.get("amount")),
                    "Referencia": row.get("reference") or "-",
                    "Nota": row.get("note") or "-",
                }
                for row in data
            ]
        )
        st.dataframe(table, use_container_width=True, hide_index=True)

        st.subheader("Detalle")
        for row in data:
            label = PAYMENT_LABELS.get(row["kind"], row["kind"])
            title = f"{row['event_date']} - {label} - CLP {clp(row.get('amount'))}"
            with st.expander(title):
                st.write(f"Referencia: {row.get('reference') or '-'}")
                st.write(f"Nota: {row.get('note') or '-'}")
                st.write(f"Registrado: {row.get('created_at') or '-'}")
                actions = st.columns([1, 1])
                if actions[0].button("Eliminar", key=f"delete_{row['id']}"):
                    supa().table("project_payments").delete().eq("id", row["id"]).execute()
                    _increment_payments_version()
                    st.success("Movimiento eliminado.")
                    st.rerun()


render()
