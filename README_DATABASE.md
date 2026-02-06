# Guide Base de Données - Projet Station-Service

Ce document explique l'organisation et le fonctionnement des bases de données du projet.

---

## Architecture des bases de données

Le projet utilise **2 bases de données MySQL distinctes** :

### 1. StationCourante (Base opérationnelle)
- **Port :** 3306
- **Rôle :** Base de données de production, utilisée au quotidien
- **Contenu :** Transactions en cours, stocks actuels, clients actifs

### 2. Archive (Base d'archivage)
- **Port :** 3307
- **Rôle :** Base de données d'archivage
- **Contenu :** Transactions de plus d'un an, données historiques

---

## Structure de la base StationCourante

### Tables principales

#### Client
Stocke les informations des clients.

| Colonne | Type | Description |
|---------|------|-------------|
| `id_client_cid` | INT (PK) | Identifiant unique |
| `nom` | VARCHAR(255) | Nom de famille |
| `prenom` | VARCHAR(255) | Prénom |
| `email` | VARCHAR(255) | Email (optionnel) |
| `num_tel_tel` | VARCHAR(20) | Téléphone (optionnel) |

#### Transaction
Enregistre toutes les transactions (ventes).

| Colonne | Type | Description |
|---------|------|-------------|
| `id_transaction` | INT (PK) | Identifiant unique |
| `prix_total` | DECIMAL(10,3) | Montant total TTC |
| `horodatage` | DATETIME | Date et heure |

#### Energie
Liste des énergies disponibles (carburants, électricité).

| Colonne | Type | Description |
|---------|------|-------------|
| `id_energie` | INT (PK) | Identifiant unique |
| `type_energie` | VARCHAR | Type (essence_sans_plomb_95, diesel, electricite, etc.) |
| `prix_litre` | DECIMAL(10,3) | Prix par litre ou kWh |
| `stock_litres` | DECIMAL(10,3) | Stock disponible |
| `type_charge` | ENUM | carburant ou kWh |

#### Produit
Articles vendus en boutique.

| Colonne | Type | Description |
|---------|------|-------------|
| `code_barre` | VARCHAR (PK) | Code-barres du produit |
| `libelle_produit` | VARCHAR | Nom du produit |
| `quantite_produit` | INT | Quantité en stock |
| `prix_unitaire` | DECIMAL(10,3) | Prix unitaire |

#### Stock
Gestion centralisée des stocks.

| Colonne | Type | Description |
|---------|------|-------------|
| `id_stock` | INT (PK) | Identifiant unique |
| `id_article` | INT (FK) | Référence à Article |
| `quantite_stock` | INT | Quantité disponible |
| `type_quantite` | ENUM | litre ou unite |

#### CarteCCE
Cartes de fidélité des clients (Sprint 2).

| Colonne | Type | Description |
|---------|------|-------------|
| `id_carte_cce_cid` | INT (PK) | Identifiant unique |
| `id_client_cid` | INT (FK) | Client propriétaire |
| `mode_accueil` | VARCHAR | Message personnalisé |
| `solde_client` | DECIMAL(10,3) | Solde disponible |
| `date_dernier_apport` | DATE | Date dernier rechargement |
| `montant_dernier_apport` | INT | Montant dernier rechargement |

#### FicheIncident
Incidents techniques (Sprint 5).

| Colonne | Type | Description |
|---------|------|-------------|
| `id_ref_unique` | INT (PK) | Identifiant unique |
| `date_creation` | DATE | Date de création |
| `heure_creation` | TIME | Heure de création |
| `type_incident` | VARCHAR | Type d'incident |
| `detail_tech` | TEXT | Détails techniques |
| `solution` | TEXT | Solution appliquée |

---

## Relations entre tables

### Diagramme simplifié

```
Client (1) -------- (0,N) CarteCCE
  |
  |
(0,N)
  |
Transaction (1) -------- (0,N) TransactionProduit -------- (1) Produit
  |
  |------------ (0,N) TransactionEnergie -------- (1) Energie
  |
  |------------ (0,1) TransactionCCE -------- (1) CarteCCE
```

### Tables de liaison

#### TransactionProduit
Relie les transactions aux produits vendus.

| Colonne | Type | Description |
|---------|------|-------------|
| `id_transaction_produit` | INT (PK) | Identifiant |
| `id_transaction` | INT (FK) | Transaction |
| `code_barre` | VARCHAR (FK) | Produit vendu |
| `quantite_produit_total` | INT | Quantité achetée |

#### TransactionEnergie
Relie les transactions aux énergies délivrées.

| Colonne | Type | Description |
|---------|------|-------------|
| `id_transaction_energie` | INT (PK) | Identifiant |
| `id_transaction` | INT (FK) | Transaction |
| `id_energie` | INT (FK) | Énergie délivrée |
| `quantite_delivree` | DECIMAL(10,3) | Quantité délivrée |
| `temps_charge` | TIME | Temps de charge (électricité) |

---

## Accès aux bases de données

### Via phpMyAdmin (Interface web)

Ouvrir : **http://localhost:8080**

**Pour StationCourante :**
- Serveur : `db_courante`
- Utilisateur : `station_user`
- Mot de passe : `station_pass_secure`

**Pour Archive :**
- Serveur : `db_archive`
- Utilisateur : `station_user`
- Mot de passe : `station_pass_secure`

### Via ligne de commande

```bash
# Connexion à StationCourante
docker exec -it station_db_courante mysql -ustation_user -pstation_pass_secure StationCourante

# Connexion à Archive
docker exec -it station_db_archive mysql -ustation_user -pstation_pass_secure Archive
```

Ou avec le Makefile :
```bash
make db-shell         # StationCourante
make db-shell-archive # Archive
```

### Via Python (SQLAlchemy)

```python
from backend.database.connection import SessionCourante, SessionArchive

# Session pour StationCourante
session = SessionCourante()

# Exemple de requête
clients = session.query(Client).all()

session.close()
```

---

## Migrations et évolution du schéma

### Gestion avec Alembic

Les changements de schéma sont gérés par **Alembic** (voir `README_ALEMBIC.md`).

**Principe :**
1. Vous modifiez un modèle SQLAlchemy
2. Vous générez une migration : `alembic revision --autogenerate -m "Description"`
3. Vous appliquez la migration : `alembic upgrade head`
4. Les autres développeurs font `git pull` puis `alembic upgrade head`

### Table de suivi : alembic_version

Cette table (créée automatiquement) contient une seule ligne avec l'ID de la dernière migration appliquée.

**Ne jamais modifier manuellement cette table !**

```sql
SELECT * FROM alembic_version;
```

---

## Données de test (Seeds)

### Chargement des seeds

```bash
# Charger toutes les données de test
./scripts/load_all_seeds.sh

# Ou avec Make
make seed
```

### Fichiers seeds

Localisés dans `database/seeds/` :
- `sprint1_seed.sql` : Clients, Énergies, Produits
- `sprint2_seed.sql` : Cartes CCE
- `sprint3_seed.sql` : Données supplémentaires

### Créer un nouveau seed

```sql
-- database/seeds/sprint4_seed.sql

-- Insérer vos données de test
INSERT INTO MaTable (colonne1, colonne2) VALUES
('valeur1', 'valeur2'),
('valeur3', 'valeur4');
```

Puis charger :
```bash
./scripts/load_all_seeds.sh
```

---

## Opérations courantes

### Requêtes SQL typiques

#### Lister tous les clients

```sql
SELECT id_client_cid, nom, prenom, email 
FROM Client 
ORDER BY nom, prenom;
```

#### Voir les transactions du jour

```sql
SELECT id_transaction, prix_total, horodatage 
FROM Transaction 
WHERE DATE(horodatage) = CURDATE()
ORDER BY horodatage DESC;
```

#### Vérifier les stocks faibles

```sql
SELECT s.id_article, s.quantite_stock, a.type_article
FROM Stock s
JOIN Article a ON s.id_article = a.id_article
WHERE s.quantite_stock < 100;
```

#### Chiffre d'affaires du mois

```sql
SELECT SUM(prix_total) AS CA_mensuel
FROM Transaction
WHERE YEAR(horodatage) = YEAR(CURDATE())
  AND MONTH(horodatage) = MONTH(CURDATE());
```

---

## Sauvegarde et restauration

### Sauvegarder la base de données

```bash
# Sauvegarder StationCourante
docker exec station_db_courante mysqldump \
  -ustation_user -pstation_pass_secure StationCourante \
  > backup_$(date +%Y%m%d).sql

# Sauvegarder Archive
docker exec station_db_archive mysqldump \
  -ustation_user -pstation_pass_secure Archive \
  > backup_archive_$(date +%Y%m%d).sql
```

### Restaurer depuis une sauvegarde

```bash
# Restaurer StationCourante
docker exec -i station_db_courante mysql \
  -ustation_user -pstation_pass_secure StationCourante \
  < backup_20260206.sql
```

---

## Archivage (US19 - Sprint 6)

### Principe

Les transactions de plus d'un an sont déplacées de `StationCourante` vers `Archive`.

### Structure identique

La base `Archive` a **exactement la même structure** que `StationCourante` pour garantir la cohérence.

### Processus d'archivage

```sql
-- 1. Copier les anciennes transactions dans Archive
INSERT INTO Archive.Transaction
SELECT * FROM StationCourante.Transaction
WHERE horodatage < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- 2. Copier les données liées (TransactionProduit, TransactionEnergie, etc.)

-- 3. Supprimer de StationCourante
DELETE FROM StationCourante.Transaction
WHERE horodatage < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

Cela sera implémenté dans l'interface gérant (Sprint 6).

---

## Performance et optimisation

### Index

Les clés primaires et étrangères sont automatiquement indexées.

Pour améliorer les performances, vous pouvez ajouter des index :

```sql
-- Index sur date de transaction (requêtes fréquentes par date)
CREATE INDEX idx_transaction_date ON Transaction(horodatage);

-- Index sur nom client (recherche par nom)
CREATE INDEX idx_client_nom ON Client(nom);
```

### Requêtes optimisées

Privilégier :
- `JOIN` plutôt que sous-requêtes multiples
- `LIMIT` pour limiter les résultats
- `WHERE` avec colonnes indexées

---

## Sécurité

### Mots de passe

Les mots de passe sont stockés dans `.env` (non versionné sur Git).

**Ne jamais commit le fichier `.env` !**

### Droits utilisateurs

L'utilisateur `station_user` a tous les droits sur `StationCourante` et `Archive`.

En production réelle, créer des utilisateurs avec droits limités :
- `app_user` : SELECT, INSERT, UPDATE (pour l'application)
- `admin_user` : Tous droits (pour maintenance)

---

## Conventions de nommage

### Tables
- PascalCase : `Client`, `Transaction`, `FicheIncident`

### Colonnes
- snake_case : `id_client_cid`, `prix_total`, `date_creation`

### Clés primaires
- Format : `id_table` ou `id_table_cid`
- Exemple : `id_client_cid`, `id_transaction`

### Clés étrangères
- Même nom que la clé primaire référencée
- Exemple : `id_client_cid` (FK) → `Client.id_client_cid` (PK)

---

## Outils de développement

### Visualiser le schéma

Utilisez phpMyAdmin :
1. Ouvrir http://localhost:8080
2. Sélectionner `StationCourante`
3. Onglet "Structure" pour voir toutes les tables
4. Onglet "Designer" pour voir le schéma relationnel

### Générer un diagramme ER

```bash
# Installer MySQL Workbench (optionnel)
# Importer la connexion vers localhost:3306
# Reverse Engineer pour générer le diagramme
```

---

## Résolution de problèmes

### Problème : "Table doesn't exist"

**Cause :** Les migrations ne sont pas appliquées.

**Solution :**
```bash
alembic upgrade head
```

### Problème : "Duplicate entry for key PRIMARY"

**Cause :** Vous tentez d'insérer un ID qui existe déjà.

**Solution :** Utiliser l'auto-increment (ne pas spécifier l'ID).

### Problème : "Lock wait timeout exceeded"

**Cause :** Transaction non commitée qui bloque les autres.

**Solution :**
```sql
-- Voir les transactions en cours
SHOW PROCESSLIST;

-- Tuer une transaction bloquante
KILL <process_id>;
```

### Problème : Données corrompues

**Solution :**
```bash
# 1. Sauvegarder
make backup

# 2. Reset complet
make reset

# 3. Recréer
make docker-up
make migrations-apply
make seed
```

---

## Maintenance régulière

### Vérifier l'intégrité

```sql
-- Vérifier les clés étrangères
SELECT * FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'StationCourante';
```

### Nettoyer les logs

```bash
# Logs Docker
docker-compose logs --tail=100 db_courante
```

### Optimiser les tables

```sql
OPTIMIZE TABLE Client, Transaction, Stock;
```

---

## Checklist avant démo

- [ ] Toutes les migrations appliquées
- [ ] Données de test chargées
- [ ] Tables visibles dans phpMyAdmin
- [ ] Connexion Python fonctionne
- [ ] Pas d'erreurs dans les logs Docker

---

## Ressources

- **phpMyAdmin** : http://localhost:8080
- **MySQL Documentation** : https://dev.mysql.com/doc/
- **SQLAlchemy ORM** : https://docs.sqlalchemy.org/

---

**Pour toute question sur la base de données, consultez d'abord ce guide !**
