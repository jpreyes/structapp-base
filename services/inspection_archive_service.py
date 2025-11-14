from __future__ import annotations

import io
import json
import uuid
import zipfile
from pathlib import Path

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

    def _draw_section(title: str, items: list[dict[str, str]]):
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
            if y < margin + 60:
                c.showPage()
                y = height - margin
            c.drawString(margin, y, "- " + ", ".join(f"{k}: {item.get(k, '')}" for k in ("structure", "location")))
            y -= 12
            for field in ("damage_type", "damage_cause", "severity", "extent"):
                value = item.get(field)
                if value:
                    c.drawString(margin + 20, y, f"{field.capitalize()}: {value}")
                    y -= 12
            y -= 6

    _draw_section("Daños registrados", damages)
    _draw_section("Ensayos y pruebas", tests)

    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, "Documentación relacionada")
    y -= 15
    c.setFont("Helvetica", 10)
    if not documents:
        c.drawString(margin, y, "Sin documentos.")
        y -= 15
    else:
        for doc in documents:
            if y < margin + 40:
                c.showPage()
                y = height - margin
            c.drawString(margin, y, f"- {doc.get('title')} ({doc.get('category')})")
            y -= 12
            if doc.get("notes"):
                c.drawString(margin + 10, y, doc["notes"])
                y -= 12
            y -= 6

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

    metadata = {
        "inspection": inspection,
        "timestamp": uuid.uuid1().hex,
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
