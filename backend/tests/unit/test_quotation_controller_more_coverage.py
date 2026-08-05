"""Additional coverage tests for QuotationController error/edge branches."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

import pytest

from app.quotations.controllers.quotation_controller import QuotationController
from app.quotations.services.quotation_pdf_service import QuotationPdfService


@dataclass
class _PdfResult:
    ok: bool
    pdf_bytes: bytes | None
    error: str | None = None


def test_update_quotation_value_error_not_found_maps_to_404(client, chef_headers, monkeypatch):
    class _Svc:
        def update_quotation(self, quotation_id, user_id, update_data):
            raise ValueError("Quotation not found")

    monkeypatch.setattr(QuotationController, "_get_service", lambda self: _Svc())

    res = client.put("/quotations/99999", json={"notes": "x"}, headers=chef_headers)
    assert res.status_code == 404


def test_update_status_value_error_other_maps_to_400(client, chef_headers, monkeypatch):
    class _Svc:
        def update_quotation_status(self, quotation_id, user_id, status):
            raise ValueError("invalid transition")

    monkeypatch.setattr(QuotationController, "_get_service", lambda self: _Svc())

    res = client.patch("/quotations/1/status", json={"status": "sent"}, headers=chef_headers)
    assert res.status_code == 400


def test_delete_value_error_not_found_maps_to_404(client, chef_headers, monkeypatch):
    class _Svc:
        def delete_quotation(self, quotation_id, user_id):
            raise ValueError("not found")

    monkeypatch.setattr(QuotationController, "_get_service", lambda self: _Svc())

    res = client.delete("/quotations/99999", headers=chef_headers)
    assert res.status_code == 404


def test_download_pdf_returns_501_when_pdf_generation_unavailable(client, chef_headers, test_quotation, monkeypatch):
    class _Svc:
        def get_quotation_by_id(self, quotation_id, user_id):
            return test_quotation

    monkeypatch.setattr(QuotationController, "_get_service", lambda self: _Svc())
    monkeypatch.setattr(QuotationPdfService, "render_pdf", staticmethod(lambda quotation: _PdfResult(ok=False, pdf_bytes=None, error="no pdf")))

    res = client.get(f"/quotations/{test_quotation.id}/pdf", headers=chef_headers)
    assert res.status_code == 501


def test_send_email_converts_datetime_to_isoformat(client, chef_headers, monkeypatch):
    sent_at = datetime(2025, 1, 1, 12, 0, 0)

    class _Svc:
        def send_quotation_email(self, **kwargs):
            return {"sent_to": "x@example.com", "sent_at": sent_at}

    monkeypatch.setattr(QuotationController, "_get_service", lambda self: _Svc())

    res = client.post("/quotations/1/send", json={}, headers=chef_headers)
    assert res.status_code == 200
    body = res.get_json()
    assert body["success"] is True
    assert body["data"]["sent_at"] == sent_at.isoformat()
