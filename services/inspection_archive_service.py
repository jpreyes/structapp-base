from __future__ import annotations

import io
import json
import uuid
import zipfile
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from services.inspections_service import (
    get_project_inspection,
    list_project_inspection_damages,
    list_project_inspection_documents,
    list_project_inspection_tests,
)
from services.media_service import INSPECTIONS_DIR


def _ensure_dirs(project_id: str, inspection_id: str) -> Path:
    base = INSPECTIONS_DIR / project_id / inspection_id
    base.mkdir(parents=True, exist_ok=True)
    return base


def generate_inspection_pdf(inspection_id: str) -> Path:
    inspection = get_project_inspection(inspection_id)
    if not inspection:
        raise ValueError("Inspección no encontrada")
    project_id = inspection["project_id"]
    base = _ensure_dirs(project_id, inspection_id)
    report_dir = base / "reports"
    report_dir.mkdir(exist_ok=True)
    pdf_path = report_dir / f"{inspection_id}.pdf"

    damages = list_project_inspection_damages(project_id, inspection_id)
    tests = list_project_inspection_tests(project_id, inspection_id)
    documents = list_project_inspection_documents(project_id, inspection_id)

    c = canvas.Canvas(str(pdf_path), pagesize=letter)
    width, height = letter
    margin = 40
    y = height - margin

    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, y, f"Informe de inspección: {inspection.get('structure_name')}")
    y -= 30

    c.setFont("Helvetica", 10)
    c.drawString(margin, y, f"Proyecto: {inspection.get('project_id')}")
    y -= 15
    c.drawString(margin, y, f"Fecha: {inspection.get('inspection_date')}")
    y -= 15
    c.drawString(margin, y, f"Inspector: {inspection.get('inspector')}")
    y -= 25

    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, "Resumen")
    y -= 15
    c.setFont("Helvetica", 10)
    text = c.beginText(margin, y)
    text.textLines(inspection.get("summary", "Sin resumen"))
    c.drawText(text)
    y = text.getY() - 20

    def _ensure_space(min_space: int = 60):
        nonlocal y
        if y < margin + min_space:
            c.showPage()
            y = height - margin

    def _format_date(value: Any) -> str:
        if isinstance(value, (datetime, date)):
            return value.strftime("%d/%m/%Y")
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value).strftime("%d/%m/%Y")
            except ValueError:
                return value
        return str(value)

    def _draw_damage_section(title: str, items: Iterable[dict[str, Any]]):
        nonlocal y
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin, y, title)
        y -= 15
        c.setFont("Helvetica", 10)
        if not items:
            c.drawString(margin, y, "Sin registros.")
            y -= 15
            return
        for item in items:
            _ensure_space()
            structure = item.get("structure") or "Elemento no indicado"
            location = item.get("location") or "Ubicación no indicada"
            c.drawString(margin, y, f"- Estructura: {structure} · Ubicación: {location}")
            y -= 12
            for field, label in (
                ("damage_type", "Tipo"),
                ("damage_cause", "Causa"),
                ("severity", "Gravedad"),
                ("extent", "Extensión"),
                ("comments", "Comentarios"),
            ):
                value = item.get(field)
                if value:
                    _ensure_space()
                    c.drawString(margin + 20, y, f"{label}: {value}")
                    y -= 12
            damage_date = item.get("damage_date")
            if damage_date:
                _ensure_space()
                c.drawString(margin + 20, y, f"Registrado: {_format_date(damage_date)}")
                y -= 12
            y -= 6

    def _draw_tests_section(title: str, items: Iterable[dict[str, Any]]):
        nonlocal y
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin, y, title)
        y -= 15
        c.setFont("Helvetica", 10)
        if not items:
            c.drawString(margin, y, "Sin registros.")
            y -= 15
            return
        for test in items:
            _ensure_space()
            c.drawString(margin, y, f"- {test.get('test_type', 'Ensayo sin nombre')}")
            y -= 12
            for field, label in (
                ("method", "Método"),
                ("standard", "Norma"),
                ("laboratory", "Laboratorio"),
            ):
                value = test.get(field)
                if value:
                    _ensure_space()
                    c.drawString(margin + 20, y, f"{label}: {value}")
                    y -= 12
            result_summary = test.get("result_summary")
            if result_summary:
                _ensure_space()
                text = c.beginText(margin + 20, y)
                text.textLines(f"Resultados: {result_summary}")
                c.drawText(text)
                y = text.getY()
            executed_at = test.get("executed_at")
            if executed_at:
                _ensure_space()
                c.drawString(margin + 20, y, f"Fecha: {_format_date(executed_at)}")
                y -= 12
            attachment = test.get("attachment_url")
            if attachment:
                _ensure_space()
                c.drawString(margin + 20, y, f"Adjunto: {attachment}")
                y -= 12
            y -= 6

    _draw_damage_section("Daños registrados", damages)
    _draw_tests_section("Ensayos y pruebas", tests)

    def _draw_documents_section(title: str, items: Iterable[dict[str, Any]]):
        nonlocal y
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin, y, title)
        y -= 15
        c.setFont("Helvetica", 10)
        if not items:
            c.drawString(margin, y, "Sin documentos.")
            y -= 15
            return
        for doc in items:
            _ensure_space()
            doc_title = doc.get("title") or "Documento sin título"
            category = doc.get("category") or "Categoría no indicada"
            issued_at = doc.get("issued_at")
            issued_at_label = _format_date(issued_at) if issued_at else "Fecha no indicada"
            issued_by = doc.get("issued_by") or "Autor no indicado"
            c.drawString(margin, y, f"- {doc_title} ({category})")
            y -= 12
            c.drawString(margin + 20, y, f"Emitido por: {issued_by} · Fecha: {issued_at_label}")
            y -= 12
            notes = doc.get("notes")
            if notes:
                _ensure_space()
                text = c.beginText(margin + 20, y)
                text.textLines(f"Notas: {notes}")
                c.drawText(text)
                y = text.getY()
            url = doc.get("url")
            if url:
                _ensure_space()
                c.drawString(margin + 20, y, f"URL: {url}")
                y -= 12
            y -= 6

    _draw_documents_section("Documentación relacionada", documents)

    c.save()
    return pdf_path


def create_inspection_archive(inspection_id: str) -> Path:
    inspection = get_project_inspection(inspection_id)
    if not inspection:
        raise ValueError("Inspección no encontrada")
    project_id = inspection["project_id"]
    base = _ensure_dirs(project_id, inspection_id)
    archives_dir = base / "archives"
    archives_dir.mkdir(exist_ok=True)
    pdf_path = generate_inspection_pdf(inspection_id)
    zip_path = archives_dir / f"{inspection_id}-{uuid.uuid4().hex}.zip"

    def _serialize_record(record: dict[str, Any]) -> dict[str, Any]:
        serialized: dict[str, Any] = {}
        for key, value in record.items():
            if isinstance(value, (datetime, date)):
                serialized[key] = value.isoformat()
            else:
                serialized[key] = value
        return serialized

    metadata = {
        "inspection": _serialize_record(inspection),
        "damages": [_serialize_record(dmg) for dmg in damages],
        "tests": [_serialize_record(test) for test in tests],
        "documents": [_serialize_record(doc) for doc in documents],
        "timestamp": datetime.utcnow().isoformat(),
    }

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.write(pdf_path, arcname="inspection.pdf")
        archive.writestr("metadata.json", json.dumps(metadata, ensure_ascii=False, indent=2))
        for photo_url in inspection.get("photos") or []:
            if not isinstance(photo_url, str):
                continue
            if not photo_url.startswith("/uploads/"):
                continue
            relative = photo_url.lstrip("/")
            photo_path = Path(relative)
            if photo_path.exists():
                archive.write(photo_path, arcname=f"photos/{photo_path.name}")

    return zip_path
