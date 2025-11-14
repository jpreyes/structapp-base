from __future__ import annotations

import os
import uuid
from pathlib import Path

from PIL import Image
from fastapi import UploadFile

BASE_UPLOAD_DIR = Path("uploads")
INSPECTIONS_DIR = BASE_UPLOAD_DIR / "inspections"

def ensure_upload_dirs() -> None:
    BASE_UPLOAD_DIR.mkdir(exist_ok=True)
    INSPECTIONS_DIR.mkdir(exist_ok=True)

def compress_and_store_inspection_photo(
    file: UploadFile,
    project_id: str,
    inspection_id: str,
    max_width: int = 1024,
    max_height: int = 768,
    quality: int = 78,
) -> str:
    ensure_upload_dirs()
    dest_dir = INSPECTIONS_DIR / project_id / inspection_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    file_ext = Path(file.filename or "photo").suffix.lower()
    if file_ext not in {".jpg", ".jpeg", ".png"}:
        file_ext = ".jpg"
    target_name = f"{uuid.uuid4().hex}{file_ext}"
    target_path = dest_dir / target_name

    file.file.seek(0)
    image = Image.open(file.file)
    image = image.convert("RGB")
    image.thumbnail((max_width, max_height), Image.LANCZOS)
    image.save(target_path, format="JPEG", quality=quality, optimize=True)

    return f"/uploads/inspections/{project_id}/{inspection_id}/{target_name}"
