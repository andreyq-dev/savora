"""Additional coverage tests for ChefController error branches.

These call controller methods directly to exercise exception handling and the
(public) helper methods that are no longer routed.
"""

from __future__ import annotations

from flask import request

import pytest

from app.chefs.controllers.chef_controller import ChefController


def test_create_profile_value_error_branch(app, monkeypatch):
    controller = ChefController()

    class _Svc:
        def create_profile(self, user_id, profile_data):
            raise ValueError("duplicate")

    monkeypatch.setattr(controller, "_get_service", lambda: _Svc())

    with app.test_request_context("/chefs/profile", method="POST", json={"bio": "b", "specialty": "s", "phone": "p", "location": "l"}):
        request.validated_data = {"bio": "b", "specialty": "s", "phone": "p", "location": "l"}
        resp, status = controller.create_profile.__wrapped__(controller, {"id": 1})

    assert status == 400


def test_create_profile_exception_branch(app, monkeypatch):
    controller = ChefController()

    class _Svc:
        def create_profile(self, user_id, profile_data):
            raise Exception("boom")

    monkeypatch.setattr(controller, "_get_service", lambda: _Svc())

    with app.test_request_context("/chefs/profile", method="POST", json={"bio": "b", "specialty": "s", "phone": "p", "location": "l"}):
        request.validated_data = {"bio": "b", "specialty": "s", "phone": "p", "location": "l"}
        resp, status = controller.create_profile.__wrapped__(controller, {"id": 1})

    assert status == 500


def test_get_my_profile_exception_branch(app, monkeypatch):
    controller = ChefController()

    class _Svc:
        def get_profile_by_user_id_cached(self, user_id):
            raise Exception("boom")

    monkeypatch.setattr(controller, "_get_service", lambda: _Svc())

    with app.test_request_context("/chefs/profile", method="GET"):
        resp, status = controller.get_my_profile({"id": 1})

    assert status == 500


def test_get_all_chefs_include_inactive_branch(app, test_chef, monkeypatch):
    controller = ChefController()

    class _Svc:
        def __init__(self):
            self.active_only_seen = None

        def get_all_profiles(self, active_only: bool):
            self.active_only_seen = active_only
            return [test_chef]

    svc = _Svc()
    monkeypatch.setattr(controller, "_get_service", lambda: svc)

    with app.test_request_context("/chefs?include_inactive=true", method="GET"):
        resp, status = controller.get_all_chefs()

    assert status == 200
    assert svc.active_only_seen is False


def test_get_chef_by_id_inactive_returns_404(app, test_chef, monkeypatch):
    controller = ChefController()
    test_chef.is_active = False

    class _Svc:
        def get_profile_by_id(self, chef_id):
            return test_chef

    monkeypatch.setattr(controller, "_get_service", lambda: _Svc())

    with app.test_request_context(f"/chefs/{test_chef.id}", method="GET"):
        resp, status = controller.get_chef_by_id(test_chef.id)

    assert status == 404
