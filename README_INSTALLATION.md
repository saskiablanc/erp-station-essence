# Guide d'Installation - Projet Station-Service

**Bienvenue dans l'équipe !** Ce guide vous permettra d'installer le projet en 10 minutes.

---

## Prérequis

Avant de commencer, installez ces logiciels :

### 1. Git
Déjà installé normalement sur votre machine de l'IUT.

Vérifier :
```bash
git --version
```

### 2. Docker Desktop
Télécharger : https://www.docker.com/products/docker-desktop/

Vérifier :
```bash
docker --version
docker-compose --version
```

### 3. Python 3.9+
Déjà installé sur Mac/Linux. Sur Windows, télécharger depuis python.org.

Vérifier :
```bash
python3 --version
```

---

## Installation (10 minutes)

### Étape 1 : Cloner le projet

```bash
# Cloner le repository Git de l'IUT
git clone https://iut-git.unice.fr/GROUPE_3B/SAE_R409_PROJET_4E.git

# Se déplacer dans le dossier
cd SAE_R409_PROJET_4E

# Vérifier que vous êtes sur la branche main
git branch
```

### Étape 2 : Créer l'environnement virtuel Python

```bash
# Créer l'environnement virtuel
python3 -m venv venv

# Activer l'environnement virtuel
# Sur Mac/Linux :
source venv/bin/activate

# Sur Windows (PowerShell) :
venv\Scripts\Activate.ps1

# Sur Windows (CMD) :
venv\Scripts\activate.bat
```

Vous devriez voir `(venv)` apparaître dans votre terminal.

### Étape 3 : Copier le fichier de configuration

```bash
# Copier le template de configuration
cp .env.example .env
```

Le fichier `.env` contient les mots de passe de la base de données (déjà configurés).

### Étape 4 : Installer les dépendances Python

```bash
# Installer toutes les dépendances du projet
pip install -r requirements.txt
```

Cela prend environ 1-2 minutes.

### Étape 5 : Démarrer Docker

```bash
# Démarrer les bases de données MySQL
docker-compose up -d

# Vérifier que les conteneurs tournent
docker-compose ps
```

Vous devriez voir 3 conteneurs "Up" :
- `station_db_courante` (port 3306)
- `station_db_archive` (port 3307)
- `station_phpmyadmin` (port 8080)

### Étape 6 : Appliquer les migrations

```bash
# Créer les tables dans la base de données
alembic upgrade head
```

### Étape 7 : Charger les données de test (optionnel)

```bash
# Charger des données de test pour pouvoir tester l'application
./scripts/load_all_seeds.sh
```

### Étape 8 : Tester l'installation

```bash
# Test 1 : Vérifier la connexion à la BD
python3 backend/database/connection.py

# Vous devriez voir :
# Connexion à StationCourante : OK
# Connexion à Archive : OK

# Test 2 : Lancer l'interface graphique
python3 gui/gui_clients_pyqt6.py

# Une fenêtre doit s'ouvrir !
```

---

## Utilisation du Makefile (optionnel mais pratique)

Au lieu de taper les commandes longues, utilisez `make` :

```bash
# Installer tout
make install

# Démarrer Docker
make docker-up

# Appliquer les migrations
make migrations-apply

# Charger les données de test
make seed

# Lancer l'interface
make gui-clients

# Voir toutes les commandes
make help
```

---

## Vérifications

### Vérifier Docker

```bash
docker-compose ps
```

Résultat attendu :
```
NAME                      STATUS    PORTS
station_db_courante       Up        0.0.0.0:3306->3306/tcp
station_db_archive        Up        0.0.0.0:3307->3306/tcp
station_phpmyadmin        Up        0.0.0.0:8080->80/tcp
```

### Vérifier phpMyAdmin

Ouvrir dans le navigateur : **http://localhost:8080**

Identifiants :
- Serveur : `db_courante` ou `db_archive`
- Utilisateur : `station_user`
- Mot de passe : `station_pass_secure`

Vous devriez voir les bases `StationCourante` et `Archive`.

### Vérifier Python

```bash
# L'environnement est activé ?
which python3
# Doit afficher : .../SAE_R409_PROJET_4E/venv/bin/python3

# SQLAlchemy est installé ?
pip list | grep -i sqlalchemy
# Doit afficher : SQLAlchemy    2.0.25
```

---

## Workflow quotidien

### Début de journée

```bash
# 1. Pull les dernières modifications
git pull

# 2. Activer l'environnement virtuel
source venv/bin/activate

# 3. Installer nouvelles dépendances (si requirements.txt a changé)
pip install -r requirements.txt

# 4. Appliquer nouvelles migrations (si il y en a)
alembic upgrade head

# 5. Démarrer Docker (si pas déjà lancé)
docker-compose up -d

# 6. Travailler !
python3 gui/gui_clients_pyqt6.py
```

### Fin de journée

```bash
# 1. Commit votre travail
git add .
git commit -m "Description de vos modifications"
git push

# 2. Arrêter Docker (optionnel, peut rester actif)
docker-compose down
```

---

## Organisation du travail

### Branches Git

Chacun travaille sur sa branche :

```bash
# Créer votre branche
git checkout -b feature/prenom-fonctionnalite

# Exemple :
git checkout -b feature/saskia-gestion-stock
git checkout -b feature/lenny-incidents
```

### Structure des fichiers

Chaque développeur peut travailler sur des fichiers séparés :

```
gui/
├── gui_clients_pyqt6.py      <- Dev 1
├── transactions_gui.py        <- Dev 2
├── stock_gui.py               <- Dev 3
├── incidents_gui.py           <- Dev 4
└── ...
```

Moins de conflits Git !

---

## Résolution de problèmes

### Problème : "Port 3306 already in use"

Vous avez déjà MySQL installé localement.

**Solution 1 :** Arrêter MySQL local
```bash
# Mac
brew services stop mysql

# Linux
sudo systemctl stop mysql
```

**Solution 2 :** Changer le port dans `docker-compose.yml`
```yaml
ports:
  - "3308:3306"  # Au lieu de 3306:3306
```

### Problème : "Module 'backend' not found"

Vous n'êtes pas à la racine du projet.

```bash
# Vérifier où vous êtes
pwd

# Doit afficher : .../SAE_R409_PROJET_4E

# Sinon, revenir à la racine
cd /chemin/vers/SAE_R409_PROJET_4E
```

### Problème : "Cannot connect to Docker daemon"

Docker n'est pas lancé.

**Solution :** Démarrer Docker Desktop manuellement, puis :
```bash
docker-compose up -d
```

### Problème : "alembic: command not found"

L'environnement virtuel n'est pas activé.

```bash
# Activer venv
source venv/bin/activate

# Vérifier
which alembic
```

---

## Commandes utiles

### Docker

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Redémarrer un conteneur
docker-compose restart db_courante

# Supprimer tout (attention, efface les données)
docker-compose down -v
```

### Git

```bash
# Récupérer les modifications
git pull

# Voir l'état
git status

# Ajouter vos fichiers
git add .

# Commit
git commit -m "Message descriptif"

# Push
git push
```

### Python

```bash
# Activer venv
source venv/bin/activate

# Installer une nouvelle dépendance
pip install <package>

# Mettre à jour requirements.txt
pip freeze > requirements.txt
```

---

## Checklist d'installation

Cochez au fur et à mesure :

- [ ] Git cloné
- [ ] Environnement virtuel créé (`venv/`)
- [ ] Environnement virtuel activé `(venv)` visible
- [ ] Fichier `.env` créé
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Docker lancé (3 conteneurs Up)
- [ ] Migrations appliquées (`alembic upgrade head`)
- [ ] Données de test chargées (optionnel)
- [ ] Test connexion BD OK
- [ ] Interface GUI s'ouvre

---

## Ressources

- **Repository Git** : https://iut-git.unice.fr/GROUPE_3B/SAE_R409_PROJET_4E
- **phpMyAdmin local** : http://localhost:8080
- **Guide Alembic** : Voir `README_ALEMBIC.md`
- **Guide Base de données** : Voir `README_DATABASE.md`

---

## En cas de problème

1. Vérifier que Docker tourne
2. Vérifier que venv est activé
3. Vérifier que vous êtes à la racine du projet
4. Demander de l'aide à l'équipe sur Discord/Slack

**Bon développement !**
