"""Config package for Savora application."""

from config.settings import Settings

# Export settings instance for consistent imports
settings = Settings()

__all__ = ['settings', 'Settings']

