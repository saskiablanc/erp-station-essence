"""
Modèle SQLAlchemy pour la table Client.
Gère les informations des clients de la station-service.
"""

from sqlalchemy import Column, Integer, String
from backend.database.connection import Base


class Client(Base):
    """
    Table Client - Stocke les informations des clients.
    
    Attributes:
        id_client_cid (int): Identifiant unique du client (clé primaire)
        nom (str): Nom de famille du client
        prenom (str): Prénom du client
        email (str): Adresse email du client (optionnel)
        num_tel_tel (str): Numéro de téléphone du client (optionnel)
    """
    __tablename__ = 'Client'
    
    id_client_cid = Column(Integer, primary_key=True, autoincrement=True)
    nom = Column(String(255), nullable=False)
    prenom = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    num_tel_tel = Column(String(20), nullable=True)
    
    def __repr__(self):
        return f"<Client(id={self.id_client_cid}, nom='{self.nom}', prenom='{self.prenom}')>"
    
    def __str__(self):
        return f"{self.prenom} {self.nom}"