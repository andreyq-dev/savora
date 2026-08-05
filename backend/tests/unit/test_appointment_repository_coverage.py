"""Coverage-focused tests for AppointmentRepository.

Goal: exercise filtering/branching logic using the real test DB session.
"""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest

from app.appointments.models.appointment_model import Appointment
from app.appointments.repositories.appointment_repository import AppointmentRepository
import app.appointments.repositories.appointment_repository as appointment_repository_module


def _naive(dt: datetime) -> datetime:
    """Ensure a naive datetime for DB comparisons."""

    return dt.replace(tzinfo=None)


def test_get_by_chef_id_applies_status_and_date_filters(db_session, test_chef, test_client_profile):
    base = _naive(datetime(2025, 1, 1, 12, 0, 0))

    appt1 = Appointment(
        chef_id=test_chef.id,
        client_id=test_client_profile.id,
        title="A1",
        description="",
        scheduled_at=base + timedelta(days=1),
        duration_minutes=30,
        location="",
        status="scheduled",
        notes="",
        created_at=base,
    )
    appt2 = Appointment(
        chef_id=test_chef.id,
        client_id=test_client_profile.id,
        title="A2",
        description="",
        scheduled_at=base + timedelta(days=2),
        duration_minutes=30,
        location="",
        status="completed",
        notes="",
        created_at=base,
    )
    appt3 = Appointment(
        chef_id=test_chef.id,
        client_id=test_client_profile.id,
        title="A3",
        description="",
        scheduled_at=base + timedelta(days=3),
        duration_minutes=30,
        location="",
        status="scheduled",
        notes="",
        created_at=base,
    )

    db_session.add_all([appt1, appt2, appt3])
    db_session.commit()

    repo = AppointmentRepository(db_session)
    out = repo.get_by_chef_id(
        test_chef.id,
        status="scheduled",
        start_date=base + timedelta(days=2),
        end_date=base + timedelta(days=3),
    )

    assert [a.id for a in out] == [appt3.id]
    assert out[0].client is not None


def test_get_upcoming_appointments_filters_by_date_and_status(db_session, test_chef, test_client_profile, monkeypatch):
    now = _naive(datetime(2025, 1, 10, 9, 0, 0))
    monkeypatch.setattr(appointment_repository_module, "utcnow_naive", lambda: now)

    # Past (should be excluded)
    past = Appointment(
        chef_id=test_chef.id,
        client_id=test_client_profile.id,
        title="past",
        description="",
        scheduled_at=now - timedelta(days=1),
        duration_minutes=30,
        location="",
        status="scheduled",
        notes="",
        created_at=now,
    )

    # Inside range and included statuses
    upcoming1 = Appointment(
        chef_id=test_chef.id,
        client_id=test_client_profile.id,
        title="upcoming1",
        description="",
        scheduled_at=now + timedelta(days=1),
        duration_minutes=30,
        location="",
        status="scheduled",
        notes="",
        created_at=now,
    )
    upcoming2 = Appointment(
        chef_id=test_chef.id,
        client_id=test_client_profile.id,
        title="upcoming2",
        description="",
        scheduled_at=now + timedelta(days=2),
        duration_minutes=30,
        location="",
        status="confirmed",
        notes="",
        created_at=now,
    )

    # Inside range but excluded status
    cancelled = Appointment(
        chef_id=test_chef.id,
        client_id=test_client_profile.id,
        title="cancelled",
        description="",
        scheduled_at=now + timedelta(days=3),
        duration_minutes=30,
        location="",
        status="cancelled",
        notes="",
        created_at=now,
    )

    # Outside range (should be excluded)
    far = Appointment(
        chef_id=test_chef.id,
        client_id=test_client_profile.id,
        title="far",
        description="",
        scheduled_at=now + timedelta(days=30),
        duration_minutes=30,
        location="",
        status="scheduled",
        notes="",
        created_at=now,
    )

    db_session.add_all([past, upcoming1, upcoming2, cancelled, far])
    db_session.commit()

    repo = AppointmentRepository(db_session)
    out = repo.get_upcoming_appointments(test_chef.id, days=7)

    assert [a.id for a in out] == [upcoming1.id, upcoming2.id]


def test_update_status_sets_cancelled_and_completed_timestamps(db_session, test_appointment, monkeypatch):
    repo = AppointmentRepository(db_session)

    cancelled_at = _naive(datetime(2025, 1, 10, 10, 0, 0))
    monkeypatch.setattr(appointment_repository_module, "utcnow_naive", lambda: cancelled_at)

    assert test_appointment.cancelled_at is None
    repo.update_status(test_appointment, "cancelled", cancellation_reason="client requested")
    db_session.commit()

    assert test_appointment.cancelled_at == cancelled_at
    assert test_appointment.cancellation_reason == "client requested"

    # Re-cancelling should not overwrite existing values
    later = cancelled_at + timedelta(hours=1)
    monkeypatch.setattr(appointment_repository_module, "utcnow_naive", lambda: later)
    repo.update_status(test_appointment, "cancelled", cancellation_reason="new reason")
    db_session.commit()

    assert test_appointment.cancelled_at == cancelled_at
    assert test_appointment.cancellation_reason == "client requested"

    # Completed timestamp branch
    completed_at = _naive(datetime(2025, 1, 11, 8, 0, 0))
    monkeypatch.setattr(appointment_repository_module, "utcnow_naive", lambda: completed_at)
    repo.update_status(test_appointment, "completed")
    db_session.commit()

    assert test_appointment.completed_at == completed_at


def test_update_delete_and_external_id_lookup(db_session, test_appointment):
    repo = AppointmentRepository(db_session)

    repo.update(test_appointment, {"title": "Updated", "does_not_exist": 123})
    db_session.commit()

    found = repo.get_by_id(test_appointment.id)
    assert found is not None
    assert found.title == "Updated"

    test_appointment.external_calendar_id = "evt_123"
    db_session.commit()

    by_external = repo.get_by_external_calendar_id("evt_123")
    assert by_external is not None
    assert by_external.id == test_appointment.id

    repo.delete(test_appointment)
    db_session.commit()

    assert repo.get_by_id(test_appointment.id) is None
