# Guide Alembic - Gestion des Migrations de Base de Données

## Qu'est-ce qu'Alembic ?

Alembic est un outil qui permet de gérer l'évolution du schéma de votre base de données de manière versionnée, comme Git pour le code.

**Principe :** Au lieu de modifier manuellement les tables SQL, vous créez des "migrations" qui enregistrent chaque changement.

---

## Concepts de base

### Migration
Un fichier Python qui décrit un changement de schéma :
- Ajouter une table
- Ajouter/supprimer une colonne
- Modifier un type de données
- Créer un index

### Historique
Alembic garde une trace de toutes les migrations appliquées dans la table `alembic_version`.

### Upgrade / Downgrade
- **Upgrade** : Appliquer une migration (avancer)
- **Downgrade** : Annuler une migration (revenir en arrière)

---

## Commandes essentielles

### Voir l'état actuel

```bash
# Version actuelle de la BD
alembic current

# Historique de toutes les migrations
alembic history

# Migrations non appliquées
alembic heads
```

### Créer une nouvelle migration

```bash
# Méthode 1 : Autogénération (recommandé)
# Alembic détecte automatiquement les changements dans vos modèles
alembic revision --autogenerate -m "Description du changement"

# Méthode 2 : Migration vide (pour cas complexes)
alembic revision -m "Description"
```

### Appliquer les migrations

```bash
# Appliquer toutes les migrations non appliquées
alembic upgrade head

# Appliquer jusqu'à une version spécifique
alembic upgrade <revision_id>

# Appliquer la prochaine migration seulement
alembic upgrade +1
```

### Annuler des migrations

```bash
# Annuler la dernière migration
alembic downgrade -1

# Revenir à une version spécifique
alembic downgrade <revision_id>

# Tout annuler (revenir à zéro)
alembic downgrade base
```

---

## Workflow typique par sprint

### Sprint 1 : Création des tables initiales

```bash
# 1. Créer les modèles SQLAlchemy
# backend/models/client.py, transaction.py, etc.

# 2. Générer la migration
alembic revision --autogenerate -m "Sprint 1: Tables Client, Transaction, Stock, Energie, Produit"

# 3. Vérifier le fichier généré
ls database/migrations/versions/
# Ouvre le fichier et vérifie que tout est correct

# 4. Appliquer la migration
alembic upgrade head

# 5. Vérifier dans phpMyAdmin que les tables sont créées
```

### Sprint 2 : Ajout de nouvelles tables

```bash
# 1. Créer les nouveaux modèles
# backend/models/carte_cce.py

# 2. Importer dans __init__.py
# backend/models/__init__.py

# 3. Générer la migration
alembic revision --autogenerate -m "Sprint 2: Ajout tables CarteCCE et TransactionCCE"

# 4. Appliquer
alembic upgrade head
```

### Sprint 3 : Modification d'une table existante

```bash
# 1. Modifier le modèle
# Exemple : Ajouter une colonne 'statut' dans Transaction

# 2. Générer la migration
alembic revision --autogenerate -m "Sprint 3: Ajout colonne statut dans Transaction"

# 3. Vérifier le fichier généré
# database/migrations/versions/xxxxx_sprint_3_ajout_colonne.py

# 4. Appliquer
alembic upgrade head
```

---

## Structure d'une migration

### Fichier auto-généré

```python
# database/migrations/versions/abc123_sprint_1_tables_base.py

"""Sprint 1: Tables Client, Transaction, Stock, Energie, Produit

Revision ID: abc123
Revises: 
Create Date: 2026-02-06 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# Identifiants de la migration
revision = 'abc123'
down_revision = None  # Aucune migration avant
branch_labels = None
depends_on = None

def upgrade():
    """Fonction pour appliquer la migration"""
    op.create_table('Client',
        sa.Column('id_client_cid', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nom', sa.String(length=255), nullable=False),
        sa.Column('prenom', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('num_tel_tel', sa.String(length=20), nullable=True),
        sa.PrimaryKeyConstraint('id_client_cid')
    )

def downgrade():
    """Fonction pour annuler la migration"""
    op.drop_table('Client')
```

---

## Gestion des conflits (équipe de 7)

### Problème : Deux personnes créent des migrations en même temps

**Personne A** crée : `001_ajout_table_x.py`  
**Personne B** crée : `001_ajout_table_y.py`

Les deux ont le même numéro de révision !

### Solution : Merge des branches

```bash
# Après avoir pull les changements
alembic merge <rev1> <rev2> -m "Merge migrations sprint X"

# Puis appliquer
alembic upgrade head
```

### Prévention : Communication

- Annoncer sur Discord/Slack quand vous créez une migration
- Ne pas créer 2 migrations simultanément
- Faire des pull réguliers

---

## Commandes Make

Pour simplifier, utilisez le Makefile :

```bash
# Créer une migration
make migrations-create m="Description"

# Appliquer les migrations
make migrations-apply

# Annuler la dernière
make migrations-rollback

# Voir l'historique
make migrations-history
```

---

## Vérification de cohérence

### Vérifier que les modèles et la BD sont synchronisés

```bash
alembic check
```

Si des différences existent :
```
Target database is not up to date
```

Solution : Créer une nouvelle migration.

---

## Bonnes pratiques

### 1. Toujours vérifier la migration générée

```bash
# Après autogenerate, ouvrir le fichier
cat database/migrations/versions/xxxxx_description.py
```

Vérifier :
- Les tables créées/modifiées sont correctes
- Pas de suppressions inattendues
- Les types de données sont bons

### 2. Tester la migration

```bash
# Appliquer
alembic upgrade head

# Vérifier dans phpMyAdmin

# Si problème, rollback
alembic downgrade -1

# Corriger le fichier de migration
# Réessayer
alembic upgrade head
```

### 3. Ne jamais modifier une migration déjà pushée

Si la migration est sur Git et d'autres l'ont appliquée, NE PAS la modifier.

À la place : Créer une nouvelle migration corrective.

### 4. Messages de commit clairs

```bash
git add database/migrations/versions/xxxxx_sprint_2_cartes_cce.py
git commit -m "Migration Sprint 2: Ajout tables CarteCCE et TransactionCCE"
git push
```

### 5. Un commit = Une migration

Ne pas regrouper plusieurs migrations dans un même commit.

---

## Résolution de problèmes courants

### Erreur : "Can't locate revision identified by 'xxxxx'"

**Cause :** La migration référencée n'existe pas.

**Solution :**
```bash
# Voir toutes les migrations
alembic history

# Revenir à la base
alembic downgrade base

# Réappliquer
alembic upgrade head
```

### Erreur : "Table 'Client' already exists"

**Cause :** Vous essayez de créer une table qui existe déjà.

**Solution :**
```bash
# Option 1 : Marquer la migration comme appliquée sans l'exécuter
alembic stamp head

# Option 2 : Supprimer la table manuellement et réappliquer
```

### Erreur : "Multiple head revisions are present"

**Cause :** Deux branches de migrations divergentes.

**Solution :**
```bash
# Merger les branches
alembic merge heads -m "Merge divergent migrations"
alembic upgrade head
```

---

## Cas d'usage avancés

### Ajouter des données avec une migration

```python
def upgrade():
    # Créer la table
    op.create_table('TypeIncident', ...)
    
    # Insérer des données par défaut
    op.execute("""
        INSERT INTO TypeIncident (libelle) VALUES
        ('Panne pompe'),
        ('Problème paiement'),
        ('Rupture stock')
    """)

def downgrade():
    op.drop_table('TypeIncident')
```

### Renommer une colonne

```python
def upgrade():
    op.alter_column('Client', 'num_tel_tel', 
                    new_column_name='telephone')

def downgrade():
    op.alter_column('Client', 'telephone',
                    new_column_name='num_tel_tel')
```

---

## Workflow complet (résumé)

```bash
# 1. Créer/modifier les modèles SQLAlchemy
vim backend/models/nouvelle_table.py

# 2. Générer la migration
make migrations-create m="Sprint X: Description"

# 3. Vérifier le fichier généré
cat database/migrations/versions/xxxxx_*.py

# 4. Appliquer localement
make migrations-apply

# 5. Vérifier dans phpMyAdmin
make phpmyadmin

# 6. Commit et push
git add database/migrations/versions/
git commit -m "Migration Sprint X: Description"
git push

# 7. Les autres font
git pull
make migrations-apply
```

---

## Aide-mémoire

| Commande | Action |
|----------|--------|
| `alembic current` | Version actuelle |
| `alembic history` | Historique complet |
| `alembic revision --autogenerate -m "Description"` | Créer migration |
| `alembic upgrade head` | Appliquer tout |
| `alembic downgrade -1` | Annuler dernière |
| `alembic check` | Vérifier cohérence |

---

## Ressources

- Documentation officielle : https://alembic.sqlalchemy.org/
- SQLAlchemy docs : https://docs.sqlalchemy.org/

---

**En cas de doute, demandez à l'équipe avant de pusher une migration !**
