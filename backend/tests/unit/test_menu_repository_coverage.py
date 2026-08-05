"""Coverage-focused tests for MenuRepository.

These tests use the real test DB session to cover common branches in the
repository methods (create, lookup, update, assign_dishes, delete).
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.dishes.models.dish_model import Dish
from app.menus.models.menu_dish_model import MenuDish
from app.menus.models.menu_model import MenuStatus
from app.menus.repositories.menu_repository import MenuRepository


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def test_create_menu_with_and_without_dishes(db_session, test_chef, test_dish):
    dish2 = Dish(
        chef_id=test_chef.id,
        name="Dish 2",
        description="",
        category="Main",
        price=10.0,
        prep_time=10,
        servings=1,
        is_active=True,
        created_at=_utcnow_naive(),
    )
    db_session.add(dish2)
    db_session.commit()
    db_session.refresh(dish2)

    repo = MenuRepository(db_session)

    menu_with = repo.create(
        {
            "chef_id": test_chef.id,
            "name": "Menu With Dishes",
            "description": "",
            "status": MenuStatus.DRAFT,
            "created_at": _utcnow_naive(),
        },
        dish_ids=[test_dish.id, dish2.id],
    )
    db_session.commit()

    rows = (
        db_session.query(MenuDish)
        .filter(MenuDish.menu_id == menu_with.id)
        .order_by(MenuDish.order_position)
        .all()
    )

    assert [r.dish_id for r in rows] == [test_dish.id, dish2.id]
    assert [r.order_position for r in rows] == [0, 1]

    menu_without = repo.create(
        {
            "chef_id": test_chef.id,
            "name": "Menu Without Dishes",
            "description": "",
            "status": MenuStatus.DRAFT,
            "created_at": _utcnow_naive(),
        },
        dish_ids=None,
    )
    db_session.commit()

    assert menu_without.id is not None


def test_get_by_id_include_dishes_true_and_false(db_session, test_menu, test_dish):
    # Ensure at least one association exists
    assoc = MenuDish(menu_id=test_menu.id, dish_id=test_dish.id, order_position=0)
    db_session.add(assoc)
    db_session.commit()

    repo = MenuRepository(db_session)

    with_dishes = repo.get_by_id(test_menu.id, include_dishes=True)
    assert with_dishes is not None

    without_dishes = repo.get_by_id(test_menu.id, include_dishes=False)
    assert without_dishes is not None


def test_get_by_chef_and_name_case_insensitive(db_session, test_chef, test_menu):
    repo = MenuRepository(db_session)

    found = repo.get_by_chef_and_name(test_chef.id, "test menu")
    assert found is not None
    assert found.id == test_menu.id


def test_get_by_chef_id_active_only_filters_published(db_session, test_chef):
    repo = MenuRepository(db_session)

    draft = repo.create(
        {
            "chef_id": test_chef.id,
            "name": "Draft Menu",
            "description": "",
            "status": MenuStatus.DRAFT,
            "created_at": _utcnow_naive(),
        }
    )
    published = repo.create(
        {
            "chef_id": test_chef.id,
            "name": "Published Menu",
            "description": "",
            "status": MenuStatus.PUBLISHED,
            "created_at": _utcnow_naive(),
        }
    )
    db_session.commit()

    all_menus = repo.get_by_chef_id(test_chef.id, active_only=False)
    active_only = repo.get_by_chef_id(test_chef.id, active_only=True)

    assert {m.id for m in all_menus} >= {draft.id, published.id}
    assert {m.id for m in active_only} == {published.id}


def test_update_assign_dishes_and_delete(db_session, test_menu, test_chef, test_dish):
    dish2 = Dish(
        chef_id=test_chef.id,
        name="Dish X",
        description="",
        category="Main",
        price=11.0,
        prep_time=10,
        servings=1,
        is_active=True,
        created_at=_utcnow_naive(),
    )
    db_session.add(dish2)
    db_session.commit()
    db_session.refresh(dish2)

    repo = MenuRepository(db_session)

    repo.update(test_menu, {"name": "Renamed", "unknown_key": "ignored"})
    db_session.commit()
    assert test_menu.name == "Renamed"

    # Seed an existing association to ensure delete+replace path executes
    db_session.add(MenuDish(menu_id=test_menu.id, dish_id=test_dish.id, order_position=0))
    db_session.commit()

    repo.assign_dishes(
        test_menu,
        [
            {"dish_id": test_dish.id, "order_position": 5},
            {"dish_id": dish2.id},  # default order_position branch
        ],
    )
    db_session.commit()

    rows = (
        db_session.query(MenuDish)
        .filter(MenuDish.menu_id == test_menu.id)
        .order_by(MenuDish.dish_id)
        .all()
    )
    assert len(rows) == 2
    assert {r.dish_id for r in rows} == {test_dish.id, dish2.id}

    repo.delete(test_menu)
    db_session.commit()

    assert repo.get_by_id(test_menu.id) is None
