# ERP Station Essence

A full-stack point-of-sale (POS/ERP) application for a service station with a convenience store. Cashier side handles checkout, fuel pumps and EV charging, and store-card payments; manager side handles restocking, fuel prices, incidents, opening hours and daily accounting closure.

Stack: PHP (custom MVC framework) / vanilla JavaScript / custom CSS / MySQL via PDO. No Composer, no npm.

---

English version (version française plus bas 🇫🇷)

---

## 🇬🇧 Context

Group project built during the fourth semester of a French BUT Informatique (second year). The application was designed and developed end to end, from data modelling and design to code, with no starter code provided.

The project was run entirely in Agile, using a Scrum organisation over successive sprints. It was our first hands-on experience with these practices: a product backlog split into user stories, planned and reviewed sprints, and shared responsibilities within the team, including the Product Owner and Scrum Master roles.

The station, products, customers and store cards are fictional.

## Features

Cashier:

- Cart and checkout with barcode scanning and change calculation
- Fuel pumps: activation, dispensing, payment, synced in real time across screens
- EV charging sessions
- Store-card payment, top-up and balance lookup
- Transaction history with receipts and cancellation

Manager:

- Restocking, manual or automatic on thresholds
- Fuel price updates
- Incident reports
- Store-card parameters (minimum amount, bonus tiers)
- Opening hours and closing days
- Daily accounting closure
- Built-in database explorer

## Architecture

All requests go through a single front controller (`public/index.php`) routed to controllers, then models (PDO). Responses are either HTML views or JSON.

- HTML routes: `/connexion`, `/caisse`, `/gerant`, `/simulator`
- JSON routes, always prefixed `/json/`: `/json/articles/{code}`, `/json/transactions`, etc.
- SSE route: `/events/pompes` for the real-time pump feed

The front end uses no ES6 modules (IIFE only). A window manager handles the tiled, draggable panels; all `fetch()` calls are centralised in a single module. Real-time sync relies on Server-Sent Events (server to client) and the BroadcastChannel API (tab to tab), with no polling.

A simulator at `/simulator` reproduces the physical devices (pumps, charging stations, card terminal) and calls the same JSON routes as the cashier interface, so the full cycle can be tested without hardware.

## Database

Two databases sharing the same schema: a current one (`unica_station`) and an archive (`unica_station_archives`) for transactions older than one year. The model uses table inheritance: `Article` is the parent of `Produit` and `Energie`, itself split into `Carburant` and `Electricite`. Passwords are bcrypt-hashed.

## Installation

Requirements: PHP 8.1+ with PDO MySQL, and MySQL or MariaDB.

1. Create the databases:

   ```sql
   CREATE DATABASE `unica_station`          CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE `unica_station_archives` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Import the schema then the data:

   ```bash
   mysql -u root -p < sql/schema.sql
   mysql -u root -p unica_station < sql/data.sql
   ```

3. Set up the database connection. Copy the template and fill in your local credentials:

   ```bash
   cp config/database.example.php config/database.php
   ```

   `config/database.php` is not versioned; the `courante` profile must point to `unica_station`.

4. Prepare the storage folder:

   ```bash
   mkdir -p storage/logs storage/sse
   chmod -R 775 storage
   ```

## Running

Serve the project with any PHP server, pointing the web root at the `public/` folder. The simplest option is PHP's built-in server:

```bash
cd public
php -S localhost:8000
```

It also runs under Apache (XAMPP, MAMP, Laragon) with `public/` as the document root. The base URL depends on the setup: `http://localhost:8000` with the built-in server, or `http://localhost/erp-station-essence/public` under a default Apache install. From there the screens are `/connexion`, `/caisse`, `/gerant` and `/simulator`.

Note: the real-time pump feed (`/events/pompes`) keeps a connection open. Depending on the server, a single-threaded setup may stall other requests while that connection is active; serving the app behind Apache, or running the built-in server with several workers, avoids this.

## Test accounts

| Username   | Password     | Role    |
| ---------- | ------------ | ------- |
| `employe1` | `employe123` | Cashier |
| `gerant1`  | `gerant123`  | Manager |

Passwords are bcrypt-hashed in the `Connexion` table.

---

## 🇫🇷 Contexte

Projet de groupe réalisé au cours du semestre 4 de BUT Informatique (deuxième année). L'application a été conçue et développée de bout en bout, de la modélisation des données et de la conception jusqu'au code, sans code fourni au départ.

Le projet a été mené intégralement en Agile, selon une organisation Scrum sur des sprints successifs. Ce fut notre première expérience concrète de ces pratiques : un product backlog découpé en user stories, des sprints planifiés et revus, et une répartition des responsabilités dans l'équipe, dont les rôles de Product Owner et de Scrum Master.

La station, les produits, les clients et les cartes sont fictifs.

## Fonctionnalités

Caisse :

- Panier et encaissement avec scan de code-barres et calcul du rendu de monnaie
- Pompes carburant : activation, délivrance, paiement, synchronisés en temps réel entre les écrans
- Sessions de recharge électrique
- Paiement, recharge et consultation de solde par carte CE
- Historique des transactions avec reçus et annulation

Gérant :

- Réapprovisionnement, manuel ou automatique sur seuils
- Modification des prix carburant
- Déclaration d'incidents
- Paramètres carte CE (montant minimum, tranches de bonus)
- Horaires d'ouverture et jours de fermeture
- Validation comptable journalière
- Explorateur de base de données intégré

## Architecture

Toutes les requêtes passent par un front controller unique (`public/index.php`) dispatché vers les contrôleurs, puis les modèles (PDO). Les réponses sont des vues HTML ou du JSON.

- Routes HTML : `/connexion`, `/caisse`, `/gerant`, `/simulator`
- Routes JSON, toujours préfixées `/json/` : `/json/articles/{code}`, `/json/transactions`, etc.
- Route SSE : `/events/pompes` pour le flux temps réel des pompes

Le front-end n'utilise pas de modules ES6 (IIFE uniquement). Un gestionnaire de fenêtres gère les panneaux en mosaïque déplaçables ; tous les appels `fetch()` sont centralisés dans un seul module. La synchronisation temps réel repose sur les Server-Sent Events (serveur vers client) et l'API BroadcastChannel (onglet vers onglet), sans polling.

Un simulateur sur `/simulator` reproduit les périphériques physiques (pompes, bornes, terminal de carte) et appelle les mêmes routes JSON que la caisse, ce qui permet de tester tout le cycle sans matériel.

## Base de données

Deux bases partageant le même schéma : une base courante (`unica_station`) et une archive (`unica_station_archives`) pour les transactions de plus d'un an. Le modèle utilise un héritage de tables : `Article` est le parent de `Produit` et `Energie`, elle-même déclinée en `Carburant` et `Electricite`. Les mots de passe sont hachés en bcrypt.

## Installation

Prérequis : PHP 8.1+ avec PDO MySQL, et MySQL ou MariaDB.

1. Créer les bases :

   ```sql
   CREATE DATABASE `unica_station`          CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE `unica_station_archives` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Importer le schéma puis les données :

   ```bash
   mysql -u root -p < sql/schema.sql
   mysql -u root -p unica_station < sql/data.sql
   ```

3. Configurer la connexion. Copier le modèle et renseigner les identifiants locaux :

   ```bash
   cp config/database.example.php config/database.php
   ```

   `config/database.php` n'est pas versionné ; le profil `courante` doit pointer sur `unica_station`.

4. Préparer le dossier de stockage :

   ```bash
   mkdir -p storage/logs storage/sse
   chmod -R 775 storage
   ```

## Lancement

Servir le projet avec n'importe quel serveur PHP, en pointant la racine web sur le dossier `public/`. L'option la plus simple est le serveur intégré de PHP :

```bash
cd public
php -S localhost:8000
```

Il fonctionne aussi sous Apache (XAMPP, MAMP, Laragon) avec `public/` comme racine. L'URL de base dépend de l'installation : `http://localhost:8000` avec le serveur intégré, ou `http://localhost/erp-station-essence/public` sous un Apache par défaut. Les écrans sont ensuite `/connexion`, `/caisse`, `/gerant` et `/simulator`.

Note : le flux temps réel des pompes (`/events/pompes`) garde une connexion ouverte. Selon le serveur, une configuration mono-thread peut bloquer les autres requêtes tant que cette connexion est active ; servir l'application derrière Apache, ou lancer le serveur intégré avec plusieurs workers, évite ce problème.

## Comptes de test

| Identifiant | Mot de passe | Rôle    |
| ----------- | ------------ | ------- |
| `employe1`  | `employe123` | Employé |
| `gerant1`   | `gerant123`  | Gérant  |

Les mots de passe sont hachés en bcrypt dans la table `Connexion`.
