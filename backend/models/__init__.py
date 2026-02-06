"""
Package des modèles SQLAlchemy.
Importer tous les modèles ici pour qu'Alembic les détecte.
"""

from backend.models.client import Client

# Liste des modèles exportés
__all__ = ['Client']