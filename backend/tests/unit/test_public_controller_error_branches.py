"""Extra tests to cover PublicController validation + exception branches."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from app.public.controllers.public_controller import PublicController


def test_public_get_chefs_rejects_invalid_pagination(client):
    res1 = client.get("/public/chefs?page=0")
    assert res1.status_code == 400

    res2 = client.get("/public/chefs?per_page=0")
    assert res2.status_code == 400

    res3 = client.get("/public/chefs?per_page=101")
    assert res3.status_code == 400


def test_public_get_chefs_exception_returns_500(client, monkeypatch):
    # Call controller directly to avoid the route-level cache decorator.
    monkeypatch.setattr(
        PublicController,
        "_get_service",
        staticmethod(lambda: (_ for _ in ()).throw(Exception("boom"))),
    )

    from app import create_app

    app = create_app()
    app.config.update({"TESTING": True})

    with app.test_request_context("/public/chefs", method="GET"):
        resp, status = PublicController.get_chefs()

    assert status == 500


def test_public_search_exception_returns_500(client, monkeypatch):
    class _Svc:
        def search_chefs(self, query, page, per_page):
            raise Exception("boom")

    monkeypatch.setattr(PublicController, "_get_service", staticmethod(lambda: _Svc()))

    res = client.get("/public/search?q=italian")
    assert res.status_code == 500
