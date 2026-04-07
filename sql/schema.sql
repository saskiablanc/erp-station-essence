-- ============================================================
--  WRAPPER SCHEMA
--  Rejoue le schema.sql dans :
--   - unica_station
--   - unica_station_archives
--  Ne crée aucune base
-- ============================================================

-- ============================================================
--  BASE 1 : COURANTE
-- ============================================================
USE `unica_station`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `ValidationIncidents`;
DROP TABLE IF EXISTS `ValidationTransactions`;
DROP TABLE IF EXISTS `TransactionProduit`;
DROP TABLE IF EXISTS `TransactionEnergie`;
DROP TABLE IF EXISTS `TransactionCCE`;
DROP TABLE IF EXISTS `Recu`;
DROP TABLE IF EXISTS `Transaction`;
DROP TABLE IF EXISTS `LigneReappro`;
DROP TABLE IF EXISTS `Reapprovisionnement`;
DROP TABLE IF EXISTS `ValeursDefautReappro`;
DROP TABLE IF EXISTS `FicheIncident`;
DROP TABLE IF EXISTS `JourFermeture`;
DROP TABLE IF EXISTS `Horaire`;
DROP TABLE IF EXISTS `JourSemaine`;
DROP TABLE IF EXISTS `BonusCCE`;
DROP TABLE IF EXISTS `ParametresCCE`;
DROP TABLE IF EXISTS `CarteCE`;
DROP TABLE IF EXISTS `Client`;
DROP TABLE IF EXISTS `Pompe`;
DROP TABLE IF EXISTS `Stock`;
DROP TABLE IF EXISTS `Carburant`;
DROP TABLE IF EXISTS `Electricite`;
DROP TABLE IF EXISTS `Energie`;
DROP TABLE IF EXISTS `Produit`;
DROP TABLE IF EXISTS `Article`;
DROP TABLE IF EXISTS `Connexion`;

CREATE TABLE `Article` (
  `id_article`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type_article` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Energie` (
  `id_energie`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_article`   BIGINT UNSIGNED NOT NULL,
  `type_energie` ENUM('carburant','electricite') NOT NULL,
  PRIMARY KEY (`id_energie`),
  KEY `id_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Carburant` (
  `id_carburant`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_energie`    BIGINT UNSIGNED NOT NULL,
  `prix_litre`    DECIMAL(10,3) NOT NULL,
  `livraison_min` DECIMAL(10,3) NOT NULL DEFAULT 5.000,
  `libelle`       VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_carburant`),
  KEY `id_energie` (`id_energie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Electricite` (
  `id_electricite` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_energie`     BIGINT UNSIGNED NOT NULL,
  `prix_kwh`       DECIMAL(10,3) NOT NULL,
  `type_charge`    ENUM('rapide','lente') NOT NULL,
  PRIMARY KEY (`id_electricite`),
  KEY `fk_electricite_energie` (`id_energie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Produit` (
  `code_barres`     BIGINT UNSIGNED NOT NULL,
  `id_article`      BIGINT UNSIGNED NOT NULL,
  `libelle_produit` VARCHAR(255) NOT NULL,
  `prix`            DECIMAL(10,3) NOT NULL,
  PRIMARY KEY (`code_barres`),
  KEY `id_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Stock` (
  `id_stock`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_article`      BIGINT UNSIGNED NOT NULL,
  `quantite_stock`  DECIMAL(10,3) NOT NULL,
  `type_quantite`   ENUM('litre','unite') NOT NULL,
  PRIMARY KEY (`id_stock`),
  UNIQUE KEY `uk_stock_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Connexion` (
  `id_connexion` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `identifiant`  VARCHAR(100) NOT NULL,
  `mdp`          VARCHAR(255) NOT NULL,
  `role`         ENUM('employe','gerant') NOT NULL DEFAULT 'employe',
  PRIMARY KEY (`id_connexion`),
  UNIQUE KEY `identifiant` (`identifiant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Client` (
  `id_client` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom`       VARCHAR(50) NOT NULL,
  `prenom`    VARCHAR(50) NOT NULL,
  `email`     VARCHAR(100) NOT NULL,
  `num_tel`   VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id_client`),
  UNIQUE KEY `uk_client_email` (`email`),
  UNIQUE KEY `uk_client_num_tel` (`num_tel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `CarteCE` (
  `id_carte_CE`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_client`              BIGINT UNSIGNED NOT NULL,
  `code_secret`            INT NOT NULL,
  `solde_client`           DECIMAL(10,3) NOT NULL,
  `date_dernier_apport`    DATE NOT NULL,
  `montant_dernier_apport` INT NOT NULL,
  PRIMARY KEY (`id_carte_CE`),
  KEY `id_client` (`id_client`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ParametresCCE` (
  `id_parametre` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `montant_min`  DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  PRIMARY KEY (`id_parametre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `BonusCCE` (
  `id_bonus`      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tranche`       DECIMAL(10,2) NOT NULL,
  `montant_bonus` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_bonus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Pompe` (
  `id_pompe`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `numero`                 INT NOT NULL,
  `type_pompe`             ENUM('carburant','electricite') NOT NULL,
  `sous_type`              ENUM('rapide','lente') DEFAULT NULL,
  `mode`                   ENUM('manuel','auto') NOT NULL,
  `statut`                 ENUM('active','desactivee','en_cours') NOT NULL DEFAULT 'active',
  `date_debut`             DATETIME DEFAULT NULL,
  `id_transaction_energie` BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id_pompe`),
  KEY `fk_pompe_transaction_energie` (`id_transaction_energie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Transaction` (
  `id_transaction` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `prix_total`     DECIMAL(10,3) NOT NULL,
  `date_heure`     DATETIME NOT NULL,
  PRIMARY KEY (`id_transaction`),
  KEY `idx_transaction_date_heure` (`date_heure`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `TransactionCCE` (
  `id_transaction` BIGINT UNSIGNED NOT NULL,
  `id_carte_CE`    BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_transaction`, `id_carte_CE`),
  KEY `id_carte_CE` (`id_carte_CE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `TransactionEnergie` (
  `id_transaction_energie` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_transaction`         BIGINT UNSIGNED DEFAULT NULL,
  `id_energie`             BIGINT UNSIGNED NOT NULL,
  `quantite_delivree`      DECIMAL(10,3) NOT NULL,
  `temps_charge`           TIME NOT NULL,
  `statut`                 ENUM('en_cours','payee') NOT NULL DEFAULT 'en_cours',
  `id_pompe`               BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id_transaction_energie`),
  KEY `id_transaction` (`id_transaction`),
  KEY `id_energie` (`id_energie`),
  KEY `fk_te_pompe` (`id_pompe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `TransactionProduit` (
  `id_transaction_produit`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_transaction`          BIGINT UNSIGNED NOT NULL,
  `code_barres`             BIGINT UNSIGNED NOT NULL,
  `quantite_produit_totale` INT NOT NULL,
  PRIMARY KEY (`id_transaction_produit`),
  KEY `id_transaction` (`id_transaction`),
  KEY `code_barres` (`code_barres`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Recu` (
  `id_recu`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_transaction` BIGINT UNSIGNED NOT NULL,
  `num_carte`      INT NOT NULL,
  `horodatage`     DATETIME NOT NULL,
  PRIMARY KEY (`id_recu`),
  KEY `id_transaction` (`id_transaction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Reapprovisionnement` (
  `id_reappro`     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `statut_reappro` ENUM('En cours','En retard','Arrivé','Annulé') NOT NULL DEFAULT 'En cours',
  `date_reappro`   DATE NOT NULL,
  `date_souhaitee` DATE DEFAULT NULL,
  `est_auto`       TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_reappro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `LigneReappro` (
  `id_reappro`   BIGINT UNSIGNED NOT NULL,
  `id_article`   BIGINT UNSIGNED NOT NULL,
  `quantite`     DECIMAL(10,3) NOT NULL,
  `date_arrivee` DATE DEFAULT NULL,
  PRIMARY KEY (`id_reappro`, `id_article`),
  KEY `fk_lr_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ValeursDefautReappro` (
  `id_valeur_reappro_defaut` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_article`       BIGINT UNSIGNED NOT NULL,
  `seuil_alerte`     DECIMAL(10,3) NOT NULL DEFAULT 10.000,
  `volume`           DECIMAL(10,3) NOT NULL DEFAULT 50.000,
  `frequence_valeur` INT NOT NULL DEFAULT 7,
  `frequence_unite`  ENUM('jour','semaine','mois') NOT NULL DEFAULT 'semaine',
  PRIMARY KEY (`id_valeur_reappro_defaut`),
  UNIQUE KEY `uk_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `FicheIncident` (
  `id_ref_unique`  BIGINT NOT NULL AUTO_INCREMENT,
  `date_creation`  DATE NOT NULL,
  `heure_creation` TIME NOT NULL,
  `type_incident`  VARCHAR(100) NOT NULL,
  `detail_tech`    TEXT NOT NULL,
  `solution`       TEXT NOT NULL,
  PRIMARY KEY (`id_ref_unique`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `JourSemaine` (
  `id_jour` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `libelle` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Horaire` (
  `id_horaire`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_jour`         BIGINT UNSIGNED NOT NULL,
  `heure_ouverture` TIME NOT NULL,
  `heure_fermeture` TIME NOT NULL,
  `est_ferme`       TINYINT(1) NOT NULL,
  PRIMARY KEY (`id_horaire`),
  KEY `id_jour` (`id_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `JourFermeture` (
  `id_fermeture`   BIGINT NOT NULL AUTO_INCREMENT,
  `date_fermeture` DATE NOT NULL,
  `motif`          VARCHAR(100) NOT NULL,
  `recurrent`      TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_fermeture`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ValidationTransactions` (
  `id_validation_tx` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date_jour`        DATE NOT NULL,
  `est_valide`       TINYINT(1) NOT NULL DEFAULT 0,
  `date_validation`  DATETIME NOT NULL,
  PRIMARY KEY (`id_validation_tx`),
  KEY `idx_date_jour` (`date_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ValidationIncidents` (
  `id_validation_inc` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date_jour`         DATE NOT NULL,
  `est_valide`        TINYINT(1) NOT NULL DEFAULT 0,
  `date_validation`   DATETIME NOT NULL,
  PRIMARY KEY (`id_validation_inc`),
  KEY `idx_date_jour` (`date_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `Energie`
  ADD CONSTRAINT `fk_energie_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `Carburant`
  ADD CONSTRAINT `fk_carburant_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`);

ALTER TABLE `Electricite`
  ADD CONSTRAINT `fk_electricite_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`);

ALTER TABLE `Produit`
  ADD CONSTRAINT `fk_produit_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `Stock`
  ADD CONSTRAINT `fk_stock_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `CarteCE`
  ADD CONSTRAINT `fk_carte_client` FOREIGN KEY (`id_client`) REFERENCES `Client` (`id_client`);

ALTER TABLE `TransactionCCE`
  ADD CONSTRAINT `fk_txcce_carte` FOREIGN KEY (`id_carte_CE`) REFERENCES `CarteCE` (`id_carte_CE`),
  ADD CONSTRAINT `fk_txcce_tx` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `TransactionEnergie`
  ADD CONSTRAINT `fk_te_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`),
  ADD CONSTRAINT `fk_te_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `TransactionProduit`
  ADD CONSTRAINT `fk_tp_produit` FOREIGN KEY (`code_barres`) REFERENCES `Produit` (`code_barres`),
  ADD CONSTRAINT `fk_tp_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `Recu`
  ADD CONSTRAINT `fk_recu_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `LigneReappro`
  ADD CONSTRAINT `fk_lr_reappro` FOREIGN KEY (`id_reappro`) REFERENCES `Reapprovisionnement` (`id_reappro`),
  ADD CONSTRAINT `fk_lr_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `ValeursDefautReappro`
  ADD CONSTRAINT `fk_vdr_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `Horaire`
  ADD CONSTRAINT `fk_horaire_jour` FOREIGN KEY (`id_jour`) REFERENCES `JourSemaine` (`id_jour`);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  BASE 2 : ARCHIVES
-- ============================================================
USE `unica_station_archives`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `ValidationIncidents`;
DROP TABLE IF EXISTS `ValidationTransactions`;
DROP TABLE IF EXISTS `TransactionProduit`;
DROP TABLE IF EXISTS `TransactionEnergie`;
DROP TABLE IF EXISTS `TransactionCCE`;
DROP TABLE IF EXISTS `Recu`;
DROP TABLE IF EXISTS `Transaction`;
DROP TABLE IF EXISTS `LigneReappro`;
DROP TABLE IF EXISTS `Reapprovisionnement`;
DROP TABLE IF EXISTS `ValeursDefautReappro`;
DROP TABLE IF EXISTS `FicheIncident`;
DROP TABLE IF EXISTS `JourFermeture`;
DROP TABLE IF EXISTS `Horaire`;
DROP TABLE IF EXISTS `JourSemaine`;
DROP TABLE IF EXISTS `BonusCCE`;
DROP TABLE IF EXISTS `ParametresCCE`;
DROP TABLE IF EXISTS `CarteCE`;
DROP TABLE IF EXISTS `Client`;
DROP TABLE IF EXISTS `Pompe`;
DROP TABLE IF EXISTS `Stock`;
DROP TABLE IF EXISTS `Carburant`;
DROP TABLE IF EXISTS `Electricite`;
DROP TABLE IF EXISTS `Energie`;
DROP TABLE IF EXISTS `Produit`;
DROP TABLE IF EXISTS `Article`;
DROP TABLE IF EXISTS `Connexion`;

-- Rejouer exactement le même bloc CREATE TABLE + ALTER TABLE
-- que ci-dessus dans cette base archive.

CREATE TABLE `Article` (
  `id_article`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type_article` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Energie` (
  `id_energie`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_article`   BIGINT UNSIGNED NOT NULL,
  `type_energie` ENUM('carburant','electricite') NOT NULL,
  PRIMARY KEY (`id_energie`),
  KEY `id_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Carburant` (
  `id_carburant`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_energie`    BIGINT UNSIGNED NOT NULL,
  `prix_litre`    DECIMAL(10,3) NOT NULL,
  `livraison_min` DECIMAL(10,3) NOT NULL DEFAULT 5.000,
  `libelle`       VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_carburant`),
  KEY `id_energie` (`id_energie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Electricite` (
  `id_electricite` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_energie`     BIGINT UNSIGNED NOT NULL,
  `prix_kwh`       DECIMAL(10,3) NOT NULL,
  `type_charge`    ENUM('rapide','lente') NOT NULL,
  PRIMARY KEY (`id_electricite`),
  KEY `fk_electricite_energie` (`id_energie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Produit` (
  `code_barres`     BIGINT UNSIGNED NOT NULL,
  `id_article`      BIGINT UNSIGNED NOT NULL,
  `libelle_produit` VARCHAR(255) NOT NULL,
  `prix`            DECIMAL(10,3) NOT NULL,
  PRIMARY KEY (`code_barres`),
  KEY `id_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Stock` (
  `id_stock`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_article`      BIGINT UNSIGNED NOT NULL,
  `quantite_stock`  DECIMAL(10,3) NOT NULL,
  `type_quantite`   ENUM('litre','unite') NOT NULL,
  PRIMARY KEY (`id_stock`),
  UNIQUE KEY `uk_stock_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Connexion` (
  `id_connexion` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `identifiant`  VARCHAR(100) NOT NULL,
  `mdp`          VARCHAR(255) NOT NULL,
  `role`         ENUM('employe','gerant') NOT NULL DEFAULT 'employe',
  PRIMARY KEY (`id_connexion`),
  UNIQUE KEY `identifiant` (`identifiant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Client` (
  `id_client` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom`       VARCHAR(50) NOT NULL,
  `prenom`    VARCHAR(50) NOT NULL,
  `email`     VARCHAR(100) NOT NULL,
  `num_tel`   VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id_client`),
  UNIQUE KEY `uk_client_email` (`email`),
  UNIQUE KEY `uk_client_num_tel` (`num_tel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `CarteCE` (
  `id_carte_CE`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_client`              BIGINT UNSIGNED NOT NULL,
  `code_secret`            INT NOT NULL,
  `solde_client`           DECIMAL(10,3) NOT NULL,
  `date_dernier_apport`    DATE NOT NULL,
  `montant_dernier_apport` INT NOT NULL,
  PRIMARY KEY (`id_carte_CE`),
  KEY `id_client` (`id_client`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ParametresCCE` (
  `id_parametre` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `montant_min`  DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  PRIMARY KEY (`id_parametre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `BonusCCE` (
  `id_bonus`      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tranche`       DECIMAL(10,2) NOT NULL,
  `montant_bonus` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_bonus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Pompe` (
  `id_pompe`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `numero`                 INT NOT NULL,
  `type_pompe`             ENUM('carburant','electricite') NOT NULL,
  `sous_type`              ENUM('rapide','lente') DEFAULT NULL,
  `mode`                   ENUM('manuel','auto') NOT NULL,
  `statut`                 ENUM('active','desactivee','en_cours') NOT NULL DEFAULT 'active',
  `date_debut`             DATETIME DEFAULT NULL,
  `id_transaction_energie` BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id_pompe`),
  KEY `fk_pompe_transaction_energie` (`id_transaction_energie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Transaction` (
  `id_transaction` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `prix_total`     DECIMAL(10,3) NOT NULL,
  `date_heure`     DATETIME NOT NULL,
  PRIMARY KEY (`id_transaction`),
  KEY `idx_transaction_date_heure` (`date_heure`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `TransactionCCE` (
  `id_transaction` BIGINT UNSIGNED NOT NULL,
  `id_carte_CE`    BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_transaction`, `id_carte_CE`),
  KEY `id_carte_CE` (`id_carte_CE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `TransactionEnergie` (
  `id_transaction_energie` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_transaction`         BIGINT UNSIGNED DEFAULT NULL,
  `id_energie`             BIGINT UNSIGNED NOT NULL,
  `quantite_delivree`      DECIMAL(10,3) NOT NULL,
  `temps_charge`           TIME NOT NULL,
  `statut`                 ENUM('en_cours','payee') NOT NULL DEFAULT 'en_cours',
  `id_pompe`               BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id_transaction_energie`),
  KEY `id_transaction` (`id_transaction`),
  KEY `id_energie` (`id_energie`),
  KEY `fk_te_pompe` (`id_pompe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `TransactionProduit` (
  `id_transaction_produit`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_transaction`          BIGINT UNSIGNED NOT NULL,
  `code_barres`             BIGINT UNSIGNED NOT NULL,
  `quantite_produit_totale` INT NOT NULL,
  PRIMARY KEY (`id_transaction_produit`),
  KEY `id_transaction` (`id_transaction`),
  KEY `code_barres` (`code_barres`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Recu` (
  `id_recu`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_transaction` BIGINT UNSIGNED NOT NULL,
  `num_carte`      INT NOT NULL,
  `horodatage`     DATETIME NOT NULL,
  PRIMARY KEY (`id_recu`),
  KEY `id_transaction` (`id_transaction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Reapprovisionnement` (
  `id_reappro`     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `statut_reappro` ENUM('En cours','En retard','Arrivé','Annulé') NOT NULL DEFAULT 'En cours',
  `date_reappro`   DATE NOT NULL,
  `date_souhaitee` DATE DEFAULT NULL,
  `est_auto`       TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_reappro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `LigneReappro` (
  `id_reappro`   BIGINT UNSIGNED NOT NULL,
  `id_article`   BIGINT UNSIGNED NOT NULL,
  `quantite`     DECIMAL(10,3) NOT NULL,
  `date_arrivee` DATE DEFAULT NULL,
  PRIMARY KEY (`id_reappro`, `id_article`),
  KEY `fk_lr_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ValeursDefautReappro` (
  `id_valeur_reappro_defaut` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_article`       BIGINT UNSIGNED NOT NULL,
  `seuil_alerte`     DECIMAL(10,3) NOT NULL DEFAULT 10.000,
  `volume`           DECIMAL(10,3) NOT NULL DEFAULT 50.000,
  `frequence_valeur` INT NOT NULL DEFAULT 7,
  `frequence_unite`  ENUM('jour','semaine','mois') NOT NULL DEFAULT 'semaine',
  PRIMARY KEY (`id_valeur_reappro_defaut`),
  UNIQUE KEY `uk_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `FicheIncident` (
  `id_ref_unique`  BIGINT NOT NULL AUTO_INCREMENT,
  `date_creation`  DATE NOT NULL,
  `heure_creation` TIME NOT NULL,
  `type_incident`  VARCHAR(100) NOT NULL,
  `detail_tech`    TEXT NOT NULL,
  `solution`       TEXT NOT NULL,
  PRIMARY KEY (`id_ref_unique`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `JourSemaine` (
  `id_jour` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `libelle` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `Horaire` (
  `id_horaire`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_jour`         BIGINT UNSIGNED NOT NULL,
  `heure_ouverture` TIME NOT NULL,
  `heure_fermeture` TIME NOT NULL,
  `est_ferme`       TINYINT(1) NOT NULL,
  PRIMARY KEY (`id_horaire`),
  KEY `id_jour` (`id_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `JourFermeture` (
  `id_fermeture`   BIGINT NOT NULL AUTO_INCREMENT,
  `date_fermeture` DATE NOT NULL,
  `motif`          VARCHAR(100) NOT NULL,
  `recurrent`      TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_fermeture`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ValidationTransactions` (
  `id_validation_tx` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date_jour`        DATE NOT NULL,
  `est_valide`       TINYINT(1) NOT NULL DEFAULT 0,
  `date_validation`  DATETIME NOT NULL,
  PRIMARY KEY (`id_validation_tx`),
  KEY `idx_date_jour` (`date_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ValidationIncidents` (
  `id_validation_inc` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date_jour`         DATE NOT NULL,
  `est_valide`        TINYINT(1) NOT NULL DEFAULT 0,
  `date_validation`   DATETIME NOT NULL,
  PRIMARY KEY (`id_validation_inc`),
  KEY `idx_date_jour` (`date_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `Energie`
  ADD CONSTRAINT `fk_energie_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `Carburant`
  ADD CONSTRAINT `fk_carburant_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`);

ALTER TABLE `Electricite`
  ADD CONSTRAINT `fk_electricite_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`);

ALTER TABLE `Produit`
  ADD CONSTRAINT `fk_produit_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `Stock`
  ADD CONSTRAINT `fk_stock_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `CarteCE`
  ADD CONSTRAINT `fk_carte_client` FOREIGN KEY (`id_client`) REFERENCES `Client` (`id_client`);

ALTER TABLE `TransactionCCE`
  ADD CONSTRAINT `fk_txcce_carte` FOREIGN KEY (`id_carte_CE`) REFERENCES `CarteCE` (`id_carte_CE`),
  ADD CONSTRAINT `fk_txcce_tx` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `TransactionEnergie`
  ADD CONSTRAINT `fk_te_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`),
  ADD CONSTRAINT `fk_te_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `TransactionProduit`
  ADD CONSTRAINT `fk_tp_produit` FOREIGN KEY (`code_barres`) REFERENCES `Produit` (`code_barres`),
  ADD CONSTRAINT `fk_tp_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `Recu`
  ADD CONSTRAINT `fk_recu_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `LigneReappro`
  ADD CONSTRAINT `fk_lr_reappro` FOREIGN KEY (`id_reappro`) REFERENCES `Reapprovisionnement` (`id_reappro`),
  ADD CONSTRAINT `fk_lr_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `ValeursDefautReappro`
  ADD CONSTRAINT `fk_vdr_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `Horaire`
  ADD CONSTRAINT `fk_horaire_jour` FOREIGN KEY (`id_jour`) REFERENCES `JourSemaine` (`id_jour`);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  ARCHIVAGE AUTOMATIQUE DES TRANSACTIONS (N-1 an)
--  Règle: une transaction est archivée quand
--         date_heure <= NOW() - INTERVAL 1 YEAR
-- ============================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_archive_old_transactions`$$
CREATE PROCEDURE `sp_archive_old_transactions`(IN p_cutoff DATETIME)
BEGIN
  DECLARE v_cutoff DATETIME;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    DROP TEMPORARY TABLE IF EXISTS tmp_archive_tx_ids;
    RESIGNAL;
  END;

  SET v_cutoff = IFNULL(p_cutoff, DATE_SUB(NOW(), INTERVAL 1 YEAR));

  DROP TEMPORARY TABLE IF EXISTS tmp_archive_tx_ids;
  CREATE TEMPORARY TABLE tmp_archive_tx_ids (
    id_transaction BIGINT UNSIGNED NOT NULL PRIMARY KEY
  ) ENGINE=MEMORY;

  INSERT INTO tmp_archive_tx_ids(id_transaction)
  SELECT t.id_transaction
  FROM `unica_station`.`Transaction` t
  WHERE t.date_heure <= v_cutoff;

  IF EXISTS (SELECT 1 FROM tmp_archive_tx_ids LIMIT 1) THEN
    START TRANSACTION;

    -- ── Référentiels CCE (clients/cartes) ───────────────────
    INSERT IGNORE INTO `unica_station_archives`.`Client`
      (`id_client`,`nom`,`prenom`,`email`,`num_tel`)
    SELECT DISTINCT c.id_client, c.nom, c.prenom, c.email, c.num_tel
    FROM `unica_station`.`Client` c
    JOIN `unica_station`.`CarteCE` cc ON cc.id_client = c.id_client
    JOIN `unica_station`.`TransactionCCE` txc ON txc.id_carte_CE = cc.id_carte_CE
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = txc.id_transaction;

    INSERT IGNORE INTO `unica_station_archives`.`CarteCE`
      (`id_carte_CE`,`id_client`,`code_secret`,`solde_client`,`date_dernier_apport`,`montant_dernier_apport`)
    SELECT DISTINCT cc.id_carte_CE, cc.id_client, cc.code_secret, cc.solde_client, cc.date_dernier_apport, cc.montant_dernier_apport
    FROM `unica_station`.`CarteCE` cc
    JOIN `unica_station`.`TransactionCCE` txc ON txc.id_carte_CE = cc.id_carte_CE
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = txc.id_transaction;

    -- ── Référentiels Produits ───────────────────────────────
    INSERT IGNORE INTO `unica_station_archives`.`Article` (`id_article`,`type_article`)
    SELECT DISTINCT a.id_article, a.type_article
    FROM `unica_station`.`Article` a
    JOIN `unica_station`.`Produit` p ON p.id_article = a.id_article
    JOIN `unica_station`.`TransactionProduit` tp ON tp.code_barres = p.code_barres
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = tp.id_transaction;

    INSERT IGNORE INTO `unica_station_archives`.`Produit`
      (`code_barres`,`id_article`,`libelle_produit`,`prix`)
    SELECT DISTINCT p.code_barres, p.id_article, p.libelle_produit, p.prix
    FROM `unica_station`.`Produit` p
    JOIN `unica_station`.`TransactionProduit` tp ON tp.code_barres = p.code_barres
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = tp.id_transaction;

    -- ── Référentiels Énergie ────────────────────────────────
    INSERT IGNORE INTO `unica_station_archives`.`Article` (`id_article`,`type_article`)
    SELECT DISTINCT a.id_article, a.type_article
    FROM `unica_station`.`Article` a
    JOIN `unica_station`.`Energie` e ON e.id_article = a.id_article
    JOIN `unica_station`.`TransactionEnergie` te ON te.id_energie = e.id_energie
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = te.id_transaction;

    INSERT IGNORE INTO `unica_station_archives`.`Energie`
      (`id_energie`,`id_article`,`type_energie`)
    SELECT DISTINCT e.id_energie, e.id_article, e.type_energie
    FROM `unica_station`.`Energie` e
    JOIN `unica_station`.`TransactionEnergie` te ON te.id_energie = e.id_energie
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = te.id_transaction;

    INSERT IGNORE INTO `unica_station_archives`.`Carburant`
      (`id_carburant`,`id_energie`,`prix_litre`,`livraison_min`,`libelle`)
    SELECT DISTINCT c.id_carburant, c.id_energie, c.prix_litre, c.livraison_min, c.libelle
    FROM `unica_station`.`Carburant` c
    JOIN `unica_station`.`TransactionEnergie` te ON te.id_energie = c.id_energie
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = te.id_transaction;

    INSERT IGNORE INTO `unica_station_archives`.`Electricite`
      (`id_electricite`,`id_energie`,`prix_kwh`,`type_charge`)
    SELECT DISTINCT e.id_electricite, e.id_energie, e.prix_kwh, e.type_charge
    FROM `unica_station`.`Electricite` e
    JOIN `unica_station`.`TransactionEnergie` te ON te.id_energie = e.id_energie
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = te.id_transaction;

    INSERT INTO `unica_station_archives`.`Stock` (`id_article`,`quantite_stock`,`type_quantite`)
    SELECT DISTINCT s.id_article, s.quantite_stock, s.type_quantite
    FROM `unica_station`.`Stock` s
    JOIN `unica_station_archives`.`Article` a ON a.id_article = s.id_article
    WHERE NOT EXISTS (
      SELECT 1
      FROM `unica_station_archives`.`Stock` sa
      WHERE sa.id_article = s.id_article
        AND sa.type_quantite = s.type_quantite
    );

    INSERT IGNORE INTO `unica_station_archives`.`Pompe`
      (`id_pompe`,`numero`,`type_pompe`,`sous_type`,`mode`,`statut`,`date_debut`,`id_transaction_energie`)
    SELECT DISTINCT p.id_pompe, p.numero, p.type_pompe, p.sous_type, p.mode, p.statut, p.date_debut, NULL
    FROM `unica_station`.`Pompe` p
    JOIN `unica_station`.`TransactionEnergie` te ON te.id_pompe = p.id_pompe
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = te.id_transaction;

    -- ── Copie des transactions et dépendances ───────────────
    INSERT IGNORE INTO `unica_station_archives`.`Transaction`
      (`id_transaction`,`prix_total`,`date_heure`)
    SELECT t.id_transaction, t.prix_total, t.date_heure
    FROM `unica_station`.`Transaction` t
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = t.id_transaction;

    INSERT IGNORE INTO `unica_station_archives`.`TransactionCCE`
      (`id_transaction`,`id_carte_CE`)
    SELECT txc.id_transaction, txc.id_carte_CE
    FROM `unica_station`.`TransactionCCE` txc
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = txc.id_transaction;

    INSERT INTO `unica_station_archives`.`TransactionProduit`
      (`id_transaction`,`code_barres`,`quantite_produit_totale`)
    SELECT tp.id_transaction, tp.code_barres, tp.quantite_produit_totale
    FROM `unica_station`.`TransactionProduit` tp
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = tp.id_transaction
    LEFT JOIN `unica_station_archives`.`TransactionProduit` atp
      ON atp.id_transaction = tp.id_transaction
     AND atp.code_barres = tp.code_barres
     AND atp.quantite_produit_totale = tp.quantite_produit_totale
    WHERE atp.id_transaction_produit IS NULL;

    INSERT INTO `unica_station_archives`.`TransactionEnergie`
      (`id_transaction`,`id_energie`,`quantite_delivree`,`temps_charge`,`statut`,`id_pompe`)
    SELECT te.id_transaction, te.id_energie, te.quantite_delivree, te.temps_charge, te.statut, te.id_pompe
    FROM `unica_station`.`TransactionEnergie` te
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = te.id_transaction
    LEFT JOIN `unica_station_archives`.`TransactionEnergie` ate
      ON ate.id_transaction = te.id_transaction
     AND ate.id_energie = te.id_energie
     AND ate.quantite_delivree = te.quantite_delivree
     AND ate.temps_charge = te.temps_charge
     AND ate.statut = te.statut
     AND (
          (ate.id_pompe IS NULL AND te.id_pompe IS NULL)
          OR ate.id_pompe = te.id_pompe
         )
    WHERE ate.id_transaction_energie IS NULL;

    INSERT INTO `unica_station_archives`.`Recu`
      (`id_transaction`,`num_carte`,`horodatage`)
    SELECT r.id_transaction, r.num_carte, r.horodatage
    FROM `unica_station`.`Recu` r
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = r.id_transaction
    LEFT JOIN `unica_station_archives`.`Recu` ar
      ON ar.id_transaction = r.id_transaction
     AND ar.num_carte = r.num_carte
     AND ar.horodatage = r.horodatage
    WHERE ar.id_recu IS NULL;

    -- ── Nettoyage côté base courante ───────────────────────
    UPDATE `unica_station`.`Pompe` p
    JOIN `unica_station`.`TransactionEnergie` te
      ON te.id_transaction_energie = p.id_transaction_energie
    JOIN tmp_archive_tx_ids tx
      ON tx.id_transaction = te.id_transaction
    SET p.id_transaction_energie = NULL;

    DELETE r
    FROM `unica_station`.`Recu` r
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = r.id_transaction;

    DELETE txc
    FROM `unica_station`.`TransactionCCE` txc
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = txc.id_transaction;

    DELETE tp
    FROM `unica_station`.`TransactionProduit` tp
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = tp.id_transaction;

    DELETE te
    FROM `unica_station`.`TransactionEnergie` te
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = te.id_transaction;

    DELETE t
    FROM `unica_station`.`Transaction` t
    JOIN tmp_archive_tx_ids tx ON tx.id_transaction = t.id_transaction;

    COMMIT;
  END IF;

  DROP TEMPORARY TABLE IF EXISTS tmp_archive_tx_ids;
END$$

DROP EVENT IF EXISTS `ev_archive_old_transactions_daily`$$
CREATE EVENT `ev_archive_old_transactions_daily`
ON SCHEDULE EVERY 1 DAY
STARTS (CURRENT_DATE + INTERVAL 2 HOUR)
DO
BEGIN
  CALL `unica_station_archives`.`sp_archive_old_transactions`(DATE_SUB(NOW(), INTERVAL 1 YEAR));
END$$

DELIMITER ;
