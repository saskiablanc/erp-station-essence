"""
Module de connexion aux bases de données MySQL avec SQLAlchemy.
Gère les connexions pour StationCourante et Archive.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Construction des URLs de connexion
DB_COURANTE_URL = (
    f"mysql+pymysql://{os.getenv('DB_COURANTE_USER')}:"
    f"{os.getenv('DB_COURANTE_PASSWORD')}@"
    f"{os.getenv('DB_COURANTE_HOST')}:"
    f"{os.getenv('DB_COURANTE_PORT')}/"
    f"{os.getenv('DB_COURANTE_NAME')}?charset=utf8mb4"
)

DB_ARCHIVE_URL = (
    f"mysql+pymysql://{os.getenv('DB_ARCHIVE_USER')}:"
    f"{os.getenv('DB_ARCHIVE_PASSWORD')}@"
    f"{os.getenv('DB_ARCHIVE_HOST')}:"
    f"{os.getenv('DB_ARCHIVE_PORT')}/"
    f"{os.getenv('DB_ARCHIVE_NAME')}?charset=utf8mb4"
)

# Création des engines SQLAlchemy
engine_courante = create_engine(
    DB_COURANTE_URL,
    echo=True,  # Affiche les requêtes SQL (utile pour déboguer)
    pool_pre_ping=True,  # Vérifie la connexion avant utilisation
    pool_recycle=3600  # Recycle les connexions après 1h
)

engine_archive = create_engine(
    DB_ARCHIVE_URL,
    echo=True,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Création des sessions
SessionCourante = sessionmaker(
    bind=engine_courante,
    autocommit=False,
    autoflush=False
)

SessionArchive = sessionmaker(
    bind=engine_archive,
    autocommit=False,
    autoflush=False
)

# Base pour les modèles SQLAlchemy
Base = declarative_base()


def get_db_courante():
    """
    Générateur de session pour la base courante.
    Utilisé comme dépendance dans FastAPI.
    
    Yields:
        Session: Session SQLAlchemy pour StationCourante
    """
    db = SessionCourante()
    try:
        yield db
    finally:
        db.close()


def get_db_archive():
    """
    Générateur de session pour la base archive.
    Utilisé comme dépendance dans FastAPI.
    
    Yields:
        Session: Session SQLAlchemy pour Archive
    """
    db = SessionArchive()
    try:
        yield db
    finally:
        db.close()


def test_connection():
    """
    Teste la connexion aux deux bases de données.
    
    Returns:
        bool: True si les deux connexions fonctionnent
    """
    try:
        # Test connexion courante
        with engine_courante.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"Connexion à StationCourante : OK")
        
        # Test connexion archive
        with engine_archive.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"Connexion à Archive : OK")
        
        return True
    except Exception as e:
        print(f"Erreur de connexion : {e}")
        return False


if __name__ == "__main__":
    # Test des connexions
    print("Test des connexions aux bases de données...")
    test_connection()
