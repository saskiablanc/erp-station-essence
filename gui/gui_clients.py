"""
Interface graphique PyQt6 pour la gestion des clients.
"""

import sys
import os

# Ajouter la racine du projet au path Python
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QTableWidget, QTableWidgetItem,
    QMessageBox, QGroupBox, QHeaderView
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

from backend.database.connection import SessionCourante
from backend.models.client import Client


class GestionClientsWindow(QMainWindow):
    """Fenêtre principale de gestion des clients"""
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Station-Service - Gestion des Clients")
        self.setGeometry(100, 100, 900, 650)
        
        # Widget central
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Layout principal
        main_layout = QVBoxLayout()
        central_widget.setLayout(main_layout)
        
        # Titre
        title = QLabel("🏪 Gestion des Clients")
        title.setFont(QFont("Arial", 20, QFont.Weight.Bold))
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        main_layout.addWidget(title)
        
        # Section formulaire
        form_group = self.create_form_section()
        main_layout.addWidget(form_group)
        
        # Section tableau
        table_group = self.create_table_section()
        main_layout.addWidget(table_group)
        
        # Barre de statut
        self.statusBar().showMessage("Prêt")
        
        # Charger les clients
        self.load_clients()
    
    def create_form_section(self):
        """Crée la section formulaire"""
        group = QGroupBox("Informations Client")
        layout = QVBoxLayout()
        
        # Ligne 1 : Nom et Prénom
        row1 = QHBoxLayout()
        
        row1.addWidget(QLabel("Nom:"))
        self.nom_input = QLineEdit()
        self.nom_input.setPlaceholderText("Entrez le nom...")
        row1.addWidget(self.nom_input)
        
        row1.addWidget(QLabel("Prénom:"))
        self.prenom_input = QLineEdit()
        self.prenom_input.setPlaceholderText("Entrez le prénom...")
        row1.addWidget(self.prenom_input)
        
        layout.addLayout(row1)
        
        # Ligne 2 : Email et Téléphone
        row2 = QHBoxLayout()
        
        row2.addWidget(QLabel("Email:"))
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("email@exemple.com")
        row2.addWidget(self.email_input)
        
        row2.addWidget(QLabel("Téléphone:"))
        self.tel_input = QLineEdit()
        self.tel_input.setPlaceholderText("0601020304")
        row2.addWidget(self.tel_input)
        
        layout.addLayout(row2)
        
        # Ligne 3 : Boutons
        buttons_layout = QHBoxLayout()
        
        btn_create = QPushButton("Créer")
        btn_create.clicked.connect(self.create_client)
        btn_create.setStyleSheet("background-color: #4CAF50; color: white; padding: 8px;")
        buttons_layout.addWidget(btn_create)
        
        btn_update = QPushButton("Modifier")
        btn_update.clicked.connect(self.update_client)
        btn_update.setStyleSheet("background-color: #2196F3; color: white; padding: 8px;")
        buttons_layout.addWidget(btn_update)
        
        btn_delete = QPushButton("Supprimer")
        btn_delete.clicked.connect(self.delete_client)
        btn_delete.setStyleSheet("background-color: #f44336; color: white; padding: 8px;")
        buttons_layout.addWidget(btn_delete)
        
        btn_clear = QPushButton("🧹 Effacer")
        btn_clear.clicked.connect(self.clear_form)
        btn_clear.setStyleSheet("padding: 8px;")
        buttons_layout.addWidget(btn_clear)
        
        btn_refresh = QPushButton("Rafraîchir")
        btn_refresh.clicked.connect(self.load_clients)
        btn_refresh.setStyleSheet("padding: 8px;")
        buttons_layout.addWidget(btn_refresh)
        
        layout.addLayout(buttons_layout)
        
        group.setLayout(layout)
        return group
    
    def create_table_section(self):
        """Crée la section tableau"""
        group = QGroupBox("Liste des Clients")
        layout = QVBoxLayout()
        
        # Tableau
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["ID", "Nom", "Prénom", "Email", "Téléphone"])
        
        # Ajuster les colonnes
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeMode.ResizeToContents)
        header.setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(3, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(4, QHeaderView.ResizeMode.ResizeToContents)
        
        # Sélection d'une ligne complète
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setSelectionMode(QTableWidget.SelectionMode.SingleSelection)
        
        # Événement de sélection
        self.table.itemSelectionChanged.connect(self.on_row_selected)
        
        layout.addWidget(self.table)
        
        group.setLayout(layout)
        return group
    
    def load_clients(self):
        """Charge tous les clients dans le tableau"""
        session = SessionCourante()
        try:
            clients = session.query(Client).all()
            
            # Vider le tableau
            self.table.setRowCount(0)
            
            # Remplir le tableau
            for row_idx, client in enumerate(clients):
                self.table.insertRow(row_idx)
                
                self.table.setItem(row_idx, 0, QTableWidgetItem(str(client.id_client_cid)))
                self.table.setItem(row_idx, 1, QTableWidgetItem(client.nom or ""))
                self.table.setItem(row_idx, 2, QTableWidgetItem(client.prenom or ""))
                self.table.setItem(row_idx, 3, QTableWidgetItem(client.email or ""))
                self.table.setItem(row_idx, 4, QTableWidgetItem(client.num_tel_tel or ""))
            
            self.statusBar().showMessage(f"{len(clients)} client(s) chargé(s)")
        
        except Exception as e:
            QMessageBox.critical(self, "Erreur", f"Erreur lors du chargement : {e}")
        
        finally:
            session.close()
    
    def create_client(self):
        """Crée un nouveau client"""
        nom = self.nom_input.text().strip()
        prenom = self.prenom_input.text().strip()
        email = self.email_input.text().strip() or None
        tel = self.tel_input.text().strip() or None
        
        if not nom or not prenom:
            QMessageBox.warning(self, "Attention", "Le nom et le prénom sont obligatoires !")
            return
        
        session = SessionCourante()
        try:
            client = Client(
                nom=nom.upper(),
                prenom=prenom.capitalize(),
                email=email,
                num_tel_tel=tel
            )
            session.add(client)
            session.commit()
            
            QMessageBox.information(
                self, 
                "Succès", 
                f"Client {prenom} {nom} créé avec succès !\nID: {client.id_client_cid}"
            )
            
            self.clear_form()
            self.load_clients()
        
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Erreur", f"Erreur lors de la création : {e}")
        
        finally:
            session.close()
    
    def update_client(self):
        """Modifie le client sélectionné"""
        selected_row = self.table.currentRow()
        
        if selected_row < 0:
            QMessageBox.warning(self, "Attention", "Veuillez sélectionner un client à modifier")
            return
        
        client_id = int(self.table.item(selected_row, 0).text())
        
        nom = self.nom_input.text().strip()
        prenom = self.prenom_input.text().strip()
        email = self.email_input.text().strip() or None
        tel = self.tel_input.text().strip() or None
        
        if not nom or not prenom:
            QMessageBox.warning(self, "Attention", "Le nom et le prénom sont obligatoires !")
            return
        
        session = SessionCourante()
        try:
            client = session.query(Client).filter_by(id_client_cid=client_id).first()
            
            if client:
                client.nom = nom.upper()
                client.prenom = prenom.capitalize()
                client.email = email
                client.num_tel_tel = tel
                
                session.commit()
                
                QMessageBox.information(
                    self, 
                    "Succès", 
                    f"Client {prenom} {nom} modifié avec succès !"
                )
                
                self.clear_form()
                self.load_clients()
            else:
                QMessageBox.critical(self, "Erreur", "Client introuvable")
        
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Erreur", f"Erreur lors de la modification : {e}")
        
        finally:
            session.close()
    
    def delete_client(self):
        """Supprime le client sélectionné"""
        selected_row = self.table.currentRow()
        
        if selected_row < 0:
            QMessageBox.warning(self, "Attention", "Veuillez sélectionner un client à supprimer")
            return
        
        client_id = int(self.table.item(selected_row, 0).text())
        nom = self.table.item(selected_row, 1).text()
        prenom = self.table.item(selected_row, 2).text()
        
        # Confirmation
        reply = QMessageBox.question(
            self,
            "Confirmation",
            f"Voulez-vous vraiment supprimer {prenom} {nom} ?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply != QMessageBox.StandardButton.Yes:
            return
        
        session = SessionCourante()
        try:
            client = session.query(Client).filter_by(id_client_cid=client_id).first()
            
            if client:
                session.delete(client)
                session.commit()
                
                QMessageBox.information(
                    self, 
                    "Succès", 
                    f"Client {prenom} {nom} supprimé avec succès !"
                )
                
                self.clear_form()
                self.load_clients()
            else:
                QMessageBox.critical(self, "Erreur", "Client introuvable")
        
        except Exception as e:
            session.rollback()
            QMessageBox.critical(self, "Erreur", f"Erreur lors de la suppression : {e}")
        
        finally:
            session.close()
    
    def on_row_selected(self):
        """Remplit le formulaire quand une ligne est sélectionnée"""
        selected_row = self.table.currentRow()
        
        if selected_row >= 0:
            self.clear_form()
            
            self.nom_input.setText(self.table.item(selected_row, 1).text())
            self.prenom_input.setText(self.table.item(selected_row, 2).text())
            
            email = self.table.item(selected_row, 3).text()
            if email:
                self.email_input.setText(email)
            
            tel = self.table.item(selected_row, 4).text()
            if tel:
                self.tel_input.setText(tel)
    
    def clear_form(self):
        """Efface tous les champs du formulaire"""
        self.nom_input.clear()
        self.prenom_input.clear()
        self.email_input.clear()
        self.tel_input.clear()
        self.table.clearSelection()


def main():
    """Lance l'application"""
    app = QApplication(sys.argv)
    
    # Style moderne
    app.setStyle('Fusion')
    
    window = GestionClientsWindow()
    window.show()
    
    sys.exit(app.exec())


if __name__ == "__main__":
    main()