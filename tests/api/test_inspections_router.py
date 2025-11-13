import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.dependencies import get_user_id

client = TestClient(app)


@pytest.fixture(autouse=True)
def override_user_dependency():
    app.dependency_overrides[get_user_id] = lambda: "test-user"
    yield
    app.dependency_overrides.pop(get_user_id, None)


def _auth_headers():
    return {"Authorization": "Bearer test-token"}


def test_get_project_inspections_returns_payload(monkeypatch):
    sample = [
        {
            "id": "insp-1",
            "project_id": "proj-1",
            "structure_name": "Nave principal",
            "location": "Nivel 1",
            "inspection_date": "2024-11-11",
            "inspector": "Jane Doe",
            "overall_condition": "operativa",
            "summary": "Sin hallazgos críticos",
            "photos": [],
            "created_at": None,
            "updated_at": None,
        }
    ]
    monkeypatch.setattr("api.routers.inspections.list_project_inspections", lambda project_id: sample)

    response = client.get("/projects/proj-1/inspections", headers=_auth_headers())

    assert response.status_code == 200
    assert response.json() == sample


def test_create_inspection_returns_created(monkeypatch):
    payload = {
        "project_id": "proj-1",
        "structure_name": "Nave principal",
        "location": "Nivel 1",
        "inspection_date": "2024-11-11",
        "inspector": "Jane Doe",
        "overall_condition": "operativa",
        "summary": "Sin hallazgos críticos",
        "photos": ["https://example/foto.jpg"],
    }
    expected = {"id": "insp-1", **payload}
    monkeypatch.setattr("api.routers.inspections.create_project_inspection", lambda data: expected)

    response = client.post("/inspections", json=payload, headers=_auth_headers())

    assert response.status_code == 201
    assert response.json()["id"] == "insp-1"


def test_get_damages(monkeypatch):
    sample = [
        {
            "id": "dmg-1",
            "project_id": "proj-1",
            "structure": "Columna C1",
            "location": "Eje 1-A",
            "damage_type": "Fisura longitudinal en vigas",
            "damage_cause": "Sobrecarga gravitacional sostenida",
            "severity": "Media",
            "extent": "15 cm",
            "comments": "",
            "damage_photo_url": None,
            "created_at": None,
        }
    ]
    monkeypatch.setattr("api.routers.inspections.list_project_inspection_damages", lambda project_id: sample)

    response = client.get("/projects/proj-1/inspection-damages", headers=_auth_headers())

    assert response.status_code == 200
    assert response.json() == sample


def test_get_tests(monkeypatch):
    sample = [
        {
            "id": "test-1",
            "project_id": "proj-1",
            "test_type": "Esclerometría",
            "method": "ASTM C805",
            "standard": "ASTM C805",
            "executed_at": "2024-11-10",
            "laboratory": "Lab-01",
            "sample_location": "Columna C1",
            "result_summary": "f'c estimada 28 MPa",
            "attachment_url": None,
            "created_at": None,
        }
    ]
    monkeypatch.setattr("api.routers.inspections.list_project_inspection_tests", lambda project_id: sample)

    response = client.get("/projects/proj-1/inspection-tests", headers=_auth_headers())

    assert response.status_code == 200
    assert response.json() == sample


def test_create_document(monkeypatch):
    payload = {
        "project_id": "proj-1",
        "title": "Informe de ensayos",
        "category": "informe",
        "issued_at": "2024-11-01",
        "issued_by": "Lab-01",
        "url": "https://example.com/doc.pdf",
        "notes": "Resultados dentro de norma",
    }
    expected = {"id": "doc-1", **payload}
    monkeypatch.setattr("api.routers.inspections.create_project_inspection_document", lambda data: expected)

    response = client.post("/inspection-documents", json=payload, headers=_auth_headers())

    assert response.status_code == 201
    assert response.json()["title"] == payload["title"]
