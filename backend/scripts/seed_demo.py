"""
Seed demo data for Savora MVP.
Creates a demo chef, dishes, and published menus if none exist.
"""

import logging
import sys
from pathlib import Path
from decimal import Decimal
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.core import database
from app.auth.models import User, UserRole
from app.chefs.models import Chef
from app.dishes.models import Dish, Ingredient
from app.menus.models import Menu
from app.menus.models.menu_model import MenuStatus
from app.menus.models.menu_dish_model import MenuDish
from app.auth.services.security_service import SecurityService

logger = logging.getLogger(__name__)


DEMO_USERNAME = "demo_chef"
DEMO_EMAIL = "demo@savora.com"
DEMO_PASSWORD = "DemoChef123!"


def seed_demo_data():
    """Seed demo data if no chefs exist."""
    if database.SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    session = database.SessionLocal()

    try:
        existing_chef = session.query(Chef).first()
        if existing_chef:
            logger.info("Demo seed skipped: chefs already exist.")
            return

        existing_user = session.query(User).filter(User.username == DEMO_USERNAME).first()
        if existing_user:
            logger.info("Demo seed skipped: demo user already exists.")
            return

        password_hash = SecurityService.hash_password(DEMO_PASSWORD)
        user = User(
            username=DEMO_USERNAME,
            email=DEMO_EMAIL,
            password_hash=password_hash,
            role=UserRole.CHEF,
            is_active=True
        )
        session.add(user)
        session.flush()

        chef = Chef(
            user_id=user.id,
            bio=(
                "Chef de cocina contemporánea con enfoque en experiencias privadas. "
                "Menús de temporada, maridajes y servicio boutique."
            ),
            specialty="Contemporary Cuisine",
            phone="+1-555-0190",
            location="Miami, FL",
            profile_photo_url=None,
            is_active=True
        )
        session.add(chef)
        session.flush()

        dishes = [
            Dish(
                chef_id=chef.id,
                name="Seared Salmon",
                description="Citrus glaze, fennel salad, and herb oil.",
                price=Decimal("24.00"),
                category="Main Course",
                prep_time=35,
                servings=1,
                photo_url="https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80",
                is_active=True
            ),
            Dish(
                chef_id=chef.id,
                name="Truffle Risotto",
                description="Creamy risotto with wild mushrooms and parmesan.",
                price=Decimal("18.00"),
                category="Main Course",
                prep_time=30,
                servings=1,
                photo_url="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
                is_active=True
            ),
            Dish(
                chef_id=chef.id,
                name="Garden Crudités",
                description="Seasonal vegetables with whipped herb ricotta.",
                price=Decimal("12.00"),
                category="Appetizer",
                prep_time=15,
                servings=1,
                photo_url="https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
                is_active=True
            ),
            Dish(
                chef_id=chef.id,
                name="Citrus Panna Cotta",
                description="Silky dessert with candied orange and mint.",
                price=Decimal("10.00"),
                category="Dessert",
                prep_time=20,
                servings=1,
                photo_url="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80",
                is_active=True
            ),
            Dish(
                chef_id=chef.id,
                name="Herb Roasted Chicken",
                description="Lemon-thyme roasted chicken with pan jus.",
                price=Decimal("20.00"),
                category="Main Course",
                prep_time=40,
                servings=1,
                photo_url="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
                is_active=True
            ),
            Dish(
                chef_id=chef.id,
                name="Seasonal Salad",
                description="Mixed greens, citrus, toasted seeds, champagne vinaigrette.",
                price=Decimal("9.00"),
                category="Appetizer",
                prep_time=10,
                servings=1,
                photo_url="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80",
                is_active=True
            )
        ]
        session.add_all(dishes)
        session.flush()

        ingredients = [
            Ingredient(dish_id=dishes[0].id, name="Salmon", quantity=200, unit="g"),
            Ingredient(dish_id=dishes[1].id, name="Arborio rice", quantity=150, unit="g"),
            Ingredient(dish_id=dishes[2].id, name="Seasonal vegetables", quantity=120, unit="g"),
            Ingredient(dish_id=dishes[3].id, name="Cream", quantity=100, unit="ml"),
            Ingredient(dish_id=dishes[4].id, name="Chicken", quantity=220, unit="g"),
            Ingredient(dish_id=dishes[5].id, name="Mixed greens", quantity=80, unit="g")
        ]
        session.add_all(ingredients)
        session.flush()

        menus = [
            Menu(
                chef_id=chef.id,
                name="Coastal Elegance",
                description="Seared seafood, citrus-forward sides, and refined plating.",
                status=MenuStatus.PUBLISHED
            ),
            Menu(
                chef_id=chef.id,
                name="Chef's Tasting",
                description="Five courses designed around your guests and venue.",
                status=MenuStatus.PUBLISHED
            ),
            Menu(
                chef_id=chef.id,
                name="Rustic Garden",
                description="Farm-to-table plates and herb-forward pairings.",
                status=MenuStatus.PUBLISHED
            )
        ]
        session.add_all(menus)
        session.flush()

        menu_dishes = [
            MenuDish(menu_id=menus[0].id, dish_id=dishes[0].id, order_position=0),
            MenuDish(menu_id=menus[0].id, dish_id=dishes[2].id, order_position=1),
            MenuDish(menu_id=menus[0].id, dish_id=dishes[3].id, order_position=2),
            MenuDish(menu_id=menus[1].id, dish_id=dishes[1].id, order_position=0),
            MenuDish(menu_id=menus[1].id, dish_id=dishes[0].id, order_position=1),
            MenuDish(menu_id=menus[1].id, dish_id=dishes[3].id, order_position=2),
            MenuDish(menu_id=menus[2].id, dish_id=dishes[5].id, order_position=0),
            MenuDish(menu_id=menus[2].id, dish_id=dishes[4].id, order_position=1),
            MenuDish(menu_id=menus[2].id, dish_id=dishes[3].id, order_position=2)
        ]
        session.add_all(menu_dishes)

        session.commit()
        logger.info("Demo seed completed successfully.")
    except Exception as exc:
        session.rollback()
        logger.error(f"Demo seed failed: {exc}", exc_info=True)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    database.init_db()
    seed_demo_data()
