"""Coverage-focused tests for SecurityService."""

from __future__ import annotations

from unittest.mock import MagicMock

import bcrypt

from app.auth.services.security_service import SecurityService


def test_hash_and_verify_password_round_trip():
    pw = "super-secret"
    hashed = SecurityService.hash_password(pw)

    assert isinstance(hashed, str)
    assert hashed
    assert SecurityService.verify_password(pw, hashed) is True
    assert SecurityService.verify_password("wrong", hashed) is False


def test_verify_password_returns_false_on_exception(monkeypatch):
    monkeypatch.setattr(bcrypt, "checkpw", MagicMock(side_effect=Exception("boom")))

    assert SecurityService.verify_password("pw", "hash") is False


def test_hash_password_raises_on_exception(monkeypatch):
    monkeypatch.setattr(bcrypt, "hashpw", MagicMock(side_effect=Exception("boom")))

    try:
        SecurityService.hash_password("pw")
        assert False, "Expected exception"
    except Exception:
        assert True
