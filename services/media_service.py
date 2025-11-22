from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Tuple

from PIL import Image
from fastapi import UploadFile

from core.config import SUPABASE_SERVICE_KEY
from supa.client import supa, supa_service

BASE_UPLOAD_DIR = Path("uploads")
INSPECTIONS_DIR = BASE_UPLOAD_DIR / "inspections"
INSPECTION_BUCKET = os.getenv("SUPABASE_INSPECTION_BUCKET", "inspection-photos")


@dataclass
class StoredPhoto:
    url: str
    path: str


def ensure_upload_dirs() -> None:
    BASE_UPLOAD_DIR.mkdir(exist_ok=True)
    INSPECTIONS_DIR.mkdir(exist_ok=True)


def _compress_image(
    file: UploadFile,
    max_width: int = 1024,
    max_height: int = 768,
    target_max_bytes: int = 1_000_000,
    min_quality: int = 60,
    start_quality: int = 88,
) -> Tuple[BytesIO, str]:
    """
    Reduce el tama��o de la imagen al l��mite indicado y comprime hasta quedar por debajo
    del tama��o objetivo (�?�1MB) sin bajar de la calidad m��nima.
    """
    file_ext = Path(file.filename or "photo").suffix.lower()
    if file_ext not in {".jpg", ".jpeg", ".png"}:
        file_ext = ".jpg"

    file.file.seek(0)
    image = Image.open(file.file)
    image = image.convert("RGB")
    image.thumbnail((max_width, max_height), Image.LANCZOS)

    buffer = BytesIO()
    quality = start_quality
    while quality >= min_quality:
        buffer.seek(0)
        buffer.truncate(0)
        image.save(buffer, format="JPEG", quality=quality, optimize=True)
        if buffer.tell() <= target_max_bytes:
            break
        quality -= 5
    buffer.seek(0)
    return buffer, file_ext if file_ext.startswith(".") else f".{file_ext}"


def _storage_client():
    return supa_service() if SUPABASE_SERVICE_KEY else supa()


def _upload_to_supabase_storage(data: bytes, path: str, content_type: str = "image/jpeg") -> StoredPhoto:
    client = _storage_client()
    bucket = client.storage.from_(INSPECTION_BUCKET)
    bucket.upload(path, data, file_options={"content-type": content_type, "upsert": False})
    # Guardamos el path (no la URL) para buckets privados; se firmará al leer.
    return StoredPhoto(url=path, path=path)


def sign_storage_url(path: str, expires_in: int = 60 * 60 * 24) -> str:
    """
    Genera un signed URL temporal para un objeto privado.
    Si el path ya es una URL absoluta (http/https), la devuelve tal cual.
    """
    if path.startswith("http://") or path.startswith("https://"):
        return path
    client = _storage_client()
    signed = client.storage.from_(INSPECTION_BUCKET).create_signed_url(path, expires_in=expires_in)
    # Supabase python client devuelve dict con signed_url
    return signed.get("signed_url") or path


def compress_and_store_inspection_photo(
    file: UploadFile,
    project_id: str,
    inspection_id: str,
    max_width: int = 1024,
    max_height: int = 768,
    target_max_bytes: int = 1_000_000,
) -> StoredPhoto:
    """
    Comprime una foto de inspecci��n (1024x768 m��ximo, �?�1MB) manteniendo la proporci��n
    y la sube a Supabase Storage (bucket privado). Retorna el path para firmarlo al leer.
    Si el upload falla, se hace fallback a disco local.
    """
    ensure_upload_dirs()
    compressed, file_ext = _compress_image(
        file, max_width=max_width, max_height=max_height, target_max_bytes=target_max_bytes
    )
    target_name = f"{uuid.uuid4().hex}{file_ext}"
    storage_path = f"{project_id}/{inspection_id}/{target_name}"

    try:
        return _upload_to_supabase_storage(compressed.getvalue(), storage_path)
    except Exception:
        # Fallback local para no romper el flujo si Supabase no est�� disponible.
        dest_dir = INSPECTIONS_DIR / project_id / inspection_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        target_path = dest_dir / target_name
        compressed.seek(0)
        with open(target_path, "wb") as fh:
            fh.write(compressed.read())
        return StoredPhoto(
            url=f"/uploads/inspections/{project_id}/{inspection_id}/{target_name}",
            path=str(target_path),
        )


def delete_stored_inspection_photo(path: str) -> None:
    """
    Intenta eliminar la foto de Supabase Storage. Si el path es local se ignora.
    """
    # Solo intentamos si es un path relativo de storage (no URL completa)
    if path.startswith("http://") or path.startswith("https://"):
        return
    try:
        client = _storage_client()
        client.storage.from_(INSPECTION_BUCKET).remove([path])
    except Exception:
        # Silenciar errores para no romper flujos de borrado.
        pass
    try:
        local_path = Path(path)
        if local_path.exists():
            local_path.unlink()
    except Exception:
        pass
