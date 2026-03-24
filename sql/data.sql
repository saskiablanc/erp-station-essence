-- ============================================================
--  UNICA Station — Base de données v2
--  Sprint 6 — Validation journalière (2 tables séparées)
--  Compatible MariaDB / MySQL 8+
--  Collation : utf8mb4_general_ci (compatible universelle)
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
--  SUPPRESSION des tables existantes (ordre inverse des FKs)
-- ============================================================
DROP TABLE IF EXISTS `ValidationIncidents`;
DROP TABLE IF EXISTS `ValidationTransactions`;
DROP TABLE IF EXISTS `ValidationJournee`;
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

-- ============================================================
--  ARTICLE
-- ============================================================
CREATE TABLE `Article` (
  `id_article`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type_article` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id_article`),
  UNIQUE KEY `id_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Article` (`id_article`, `type_article`) VALUES
(1,  'Carburant'),
(2,  'Carburant'),
(3,  'Carburant'),
(4,  'Carburant'),
(5,  'Carburant'),
(6,  'energie'),
(7,  'energie'),
(8,  'Snack'),
(9,  'Snack'),
(10, 'Snack'),
(11, 'Confiserie'),
(12, 'Confiserie'),
(13, 'Confiserie'),
(14, 'Boisson'),
(15, 'Boisson'),
(16, 'Boisson'),
(17, 'Boisson'),
(18, 'Boisson'),
(19, 'Presse'),
(20, 'Presse'),
(21, 'Tabac'),
(22, 'Tabac'),
(23, 'Auto'),
(24, 'Auto'),
(25, 'Auto'),
(26, 'Hygiène'),
(27, 'Hygiène'),
(28, 'Alimentation'),
(29, 'Alimentation'),
(30, 'Alimentation');
ALTER TABLE `Article` AUTO_INCREMENT = 31;

-- ============================================================
--  ENERGIE / CARBURANT / ELECTRICITE
-- ============================================================
CREATE TABLE `Energie` (
  `id_energie`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_article`   BIGINT UNSIGNED NOT NULL,
  `type_energie` ENUM('carburant','electricite') NOT NULL,
  PRIMARY KEY (`id_energie`),
  UNIQUE KEY `id_energie` (`id_energie`),
  KEY `id_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Energie` (`id_energie`, `id_article`, `type_energie`) VALUES
(1, 1, 'carburant'),
(2, 2, 'carburant'),
(3, 3, 'carburant'),
(4, 4, 'carburant'),
(5, 5, 'carburant'),
(6, 6, 'electricite'),
(7, 7, 'electricite');
ALTER TABLE `Energie` AUTO_INCREMENT = 8;

CREATE TABLE `Carburant` (
  `id_carburant`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_energie`    BIGINT UNSIGNED NOT NULL,
  `prix_litre`    DECIMAL(10,3) NOT NULL,
  `livraison_min` DECIMAL(10,3) NOT NULL DEFAULT 5.000,
  `libelle`       VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id_carburant`),
  UNIQUE KEY `id_carburant` (`id_carburant`),
  KEY `id_energie` (`id_energie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Carburant` (`id_carburant`, `id_energie`, `prix_litre`, `livraison_min`, `libelle`) VALUES
(1, 1, 1.799, 30.000, 'SP95'),
(2, 2, 1.897, 30.000, 'SP98'),
(3, 3, 1.699, 20.000, 'GAZOLE'),
(4, 4, 1.759, 30.000, 'E10'),
(5, 5, 0.999, 10.000, 'E85');
ALTER TABLE `Carburant` AUTO_INCREMENT = 6;

CREATE TABLE `Electricite` (
  `id_electricite` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_energie`     BIGINT UNSIGNED NOT NULL,
  `prix_kwh`       DECIMAL(10,3) NOT NULL,
  `type_charge`    ENUM('rapide','lente') NOT NULL,
  PRIMARY KEY (`id_electricite`),
  UNIQUE KEY `id_electricite` (`id_electricite`),
  KEY `fk_electricite_energie` (`id_energie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Electricite` (`id_electricite`, `id_energie`, `prix_kwh`, `type_charge`) VALUES
(1, 6, 0.650, 'rapide'),
(2, 7, 0.300, 'lente');
ALTER TABLE `Electricite` AUTO_INCREMENT = 3;

-- ============================================================
--  PRODUIT / STOCK
-- ============================================================
CREATE TABLE `Produit` (
  `code_barres`     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_article`      BIGINT UNSIGNED NOT NULL,
  `libelle_produit` VARCHAR(255) NOT NULL,
  `prix`            DECIMAL(10,3) NOT NULL,
  PRIMARY KEY (`code_barres`),
  UNIQUE KEY `code_barres` (`code_barres`),
  KEY `id_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Produit` (`code_barres`, `id_article`, `libelle_produit`, `prix`) VALUES
(3014760032112, 11, 'Chewing-gum Freedent White 10p', 1.390),
(3017620425035, 8,  'Chips Lay\'s Nature 45g',         1.490),
(3057640257578, 17, 'Eau Evian 50cl',                  1.190),
(3175680011800, 12, 'Mentos Fruits 38g',               0.990),
(3175680091680, 23, 'Dégivrant pare-brise 400ml',      4.990),
(3228882010053, 18, 'Café Expresso capsule x1',        0.890),
(3245390214017, 21, 'Briquet BIC classique',           1.990),
(3245390214024, 22, 'Allumettes x40',                  0.910),
(3400930006903, 30, 'Croissant pur beurre',            1.490),
(3560070976843, 28, 'Sandwich Jambon-Beurre',          3.990),
(3571090000148, 24, 'Huile moteur 5W40 1L',            9.990),
(3600522118015, 26, 'Gel hydroalcoolique 100ml',       2.490),
(3600524068738, 27, 'Paracétamol 500mg x8',           2.990),
(3760020509015, 29, 'Wrap Poulet-Crudités',           4.290),
(5000112657920, 16, 'Red Bull 250ml',                  2.490),
(5000159417891, 13, 'KitKat 2 barres 41.5g',          1.350),
(5000159461121, 9,  'Chips Pringles Original 40g',     1.790),
(5099576088745, 25, 'Chiffons microfibre x3',          3.490),
(5449000131836, 15, 'Coca-Cola Zero 50cl',             2.190),
(5449000214911, 14, 'Coca-Cola 50cl',                  2.190),
(7622210449283, 10, 'Barre Céréales BelVita x2',      1.290),
(9771950123005, 19, 'L\'Équipe (journal du jour)',     1.590),
(9772102347008, 20, 'Télé 7 Jours (hebdo)',           2.200);
ALTER TABLE `Produit` AUTO_INCREMENT = 9772102347009;

CREATE TABLE `Stock` (
  `id_stock`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_article`      BIGINT UNSIGNED NOT NULL,
  `quantite_stock`  DECIMAL(10,3) NOT NULL,
  `type_quantite`   ENUM('litre','unite') NOT NULL,
  PRIMARY KEY (`id_stock`),
  UNIQUE KEY `id_stock` (`id_stock`),
  KEY `id_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Stock` (`id_stock`, `id_article`, `quantite_stock`, `type_quantite`) VALUES
(1,  8,  96.000,   'unite'),
(2,  9,  96.000,   'unite'),
(3,  10, 90.000,   'unite'),
(4,  11, 97.000,   'unite'),
(5,  12, 98.000,   'unite'),
(6,  13, 95.000,   'unite'),
(7,  14, 91.000,   'unite'),
(8,  15, 97.000,   'unite'),
(9,  16, 93.000,   'unite'),
(10, 17, 95.000,   'unite'),
(11, 18, 90.000,   'unite'),
(12, 19, 98.000,   'unite'),
(13, 20, 96.000,   'unite'),
(14, 21, 96.000,   'unite'),
(15, 22, 99.000,   'unite'),
(16, 23, 93.000,   'unite'),
(17, 24, 97.000,   'unite'),
(18, 25, 95.000,   'unite'),
(19, 26, 97.000,   'unite'),
(20, 27, 94.000,   'unite'),
(21, 28, 99.000,   'unite'),
(22, 29, 98.000,   'unite'),
(23, 30, 97.000,   'unite'),
(24, 1,  4951.072, 'litre'),
(25, 2,  2874.944, 'litre'),
(26, 3,  6879.483, 'litre'),
(27, 4,  4432.688, 'litre'),
(28, 5,  1948.797, 'litre');
ALTER TABLE `Stock` AUTO_INCREMENT = 31;

-- ============================================================
--  CONNEXION
-- ============================================================
CREATE TABLE `Connexion` (
  `id_connexion` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `identifiant`  VARCHAR(100) NOT NULL,
  `mdp`          VARCHAR(255) NOT NULL,
  `role`         ENUM('employe','gerant') NOT NULL DEFAULT 'employe',
  PRIMARY KEY (`id_connexion`),
  UNIQUE KEY `identifiant` (`identifiant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- employe1 / password  —  gerant1 / password  (bcrypt)
INSERT INTO `Connexion` (`id_connexion`, `identifiant`, `mdp`, `role`) VALUES
(1, 'employe1', '$2y$10$vKjY.kqXjfN.kal2IVzIv.oPzPG6yIE6vSXqsWgvds0hwW5L2j5qm', 'employe'),
(2, 'gerant1',  '$2y$10$WtArQLuo/xfRF/T.flSXjOI5PoMNhsajid2huRpv692Q8OglkzUG.', 'gerant');
ALTER TABLE `Connexion` AUTO_INCREMENT = 3;

-- ============================================================
--  CLIENT / CARTE CE / PARAMETRES CCE / BONUS CCE
-- ============================================================
CREATE TABLE `Client` (
  `id_client` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom`       VARCHAR(50) NOT NULL,
  `prenom`    VARCHAR(50) NOT NULL,
  `email`     VARCHAR(100) NOT NULL,
  `num_tel`   VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id_client`),
  UNIQUE KEY `id_client` (`id_client`),
  UNIQUE KEY `uk_client_email` (`email`),
  UNIQUE KEY `uk_client_num_tel` (`num_tel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Client` (`id_client`, `nom`, `prenom`, `email`, `num_tel`) VALUES
(1,  'Dupont',       'Jean',    'jean.dupont@email.com',    '601020304'),
(2,  'Martin',       'Sophie',  'sophie.martin@email.com',  '612345678'),
(3,  'Durand',       'Pierre',  'pierre.durand@email.com',  '698765432'),
(4,  'Bachov',       'Steven',  's.bach@mail.com',          '+0766161603'),
(5,  'Bachova',      'Camilia', 'c.bachova@mail.com',       '+0766161604'),
(10, 'Mongrandi',    'Lenny',   'lenny21@gmail.com',        '+33618212121'),
(12, 'Blanc',        'Saskia',  'saskia@gmail.com',         '+33677777777'),
(13, 'Alrawahi',     'Aser',    'aaa@mail.com',             '+99199191199'),
(14, 'Daddy',        'Aser',    'aser@gmail.com',           '+33754323655'),
(15, 'Lassauniere',  'Nathan',  'nathan@gmail.com',         '0651766318');
ALTER TABLE `Client` AUTO_INCREMENT = 17;

CREATE TABLE `CarteCE` (
  `id_carte_CE`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_client`              BIGINT UNSIGNED NOT NULL,
  `code_secret`            INT NOT NULL,
  `solde_client`           DECIMAL(10,3) NOT NULL,
  `date_dernier_apport`    DATE NOT NULL,
  `montant_dernier_apport` INT NOT NULL,
  PRIMARY KEY (`id_carte_CE`),
  UNIQUE KEY `id_carte_CE` (`id_carte_CE`),
  KEY `id_client` (`id_client`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `CarteCE` (`id_carte_CE`, `id_client`, `code_secret`, `solde_client`, `date_dernier_apport`, `montant_dernier_apport`) VALUES
(1,  1,  1234, 375.000, '2026-03-17', 200),
(2,  2,  5678, 50.000,  '2026-02-05', 50),
(3,  3,  9999, 571.300, '2026-03-17', 50),
(4,  4,  4850, 0.000,   '2026-03-14', 0),
(5,  5,  2019, 225.000, '2026-03-17', 200),
(10, 10, 4665, 433.460, '2026-03-17', 200),
(12, 12, 4931, 260.370, '2026-03-18', 52),
(13, 13, 8207, 7.580,   '2026-03-18', 8),
(14, 14, 4343, 0.000,   '2026-03-18', 0),
(15, 15, 8937, 0.000,   '2026-03-18', 0);
ALTER TABLE `CarteCE` AUTO_INCREMENT = 16;

CREATE TABLE `ParametresCCE` (
  `id_parametre` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `montant_min`  DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  PRIMARY KEY (`id_parametre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `ParametresCCE` (`id_parametre`, `montant_min`) VALUES (1, 50.00);
ALTER TABLE `ParametresCCE` AUTO_INCREMENT = 2;

CREATE TABLE `BonusCCE` (
  `id_bonus`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tranche`      DECIMAL(10,2) NOT NULL,
  `montant_bonus` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_bonus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `BonusCCE` (`id_bonus`, `tranche`, `montant_bonus`) VALUES
(1, 100.00, 10.00),
(2, 200.00, 25.00);
ALTER TABLE `BonusCCE` AUTO_INCREMENT = 6;

-- ============================================================
--  POMPE
-- ============================================================
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

INSERT INTO `Pompe` (`id_pompe`, `numero`, `type_pompe`, `sous_type`, `mode`, `statut`, `date_debut`, `id_transaction_energie`) VALUES
(1,  1,  'carburant',   NULL,      'manuel', 'active',   NULL, NULL),
(2,  2,  'carburant',   NULL,      'manuel', 'active',   NULL, NULL),
(3,  3,  'carburant',   NULL,      'auto',   'active',   NULL, NULL),
(4,  4,  'carburant',   NULL,      'auto',   'active',   NULL, NULL),
(5,  1,  'electricite', 'rapide',  'auto',   'active',   NULL, NULL),
(6,  2,  'electricite', 'rapide',  'auto',   'active',   NULL, NULL),
(7,  3,  'electricite', 'rapide',  'auto',   'active',   NULL, NULL),
(8,  4,  'electricite', 'rapide',  'auto',   'active',   NULL, NULL),
(9,  5,  'electricite', 'rapide',  'auto',   'active',   NULL, NULL),
(10, 6,  'electricite', 'rapide',  'auto',   'active',   NULL, NULL),
(11, 7,  'electricite', 'rapide',  'auto',   'active',   NULL, NULL),
(12, 8,  'electricite', 'rapide',  'auto',   'active',   NULL, NULL),
(13, 9,  'electricite', 'lente',   'auto',   'active',   NULL, NULL),
(14, 10, 'electricite', 'lente',   'auto',   'active',   NULL, NULL);
ALTER TABLE `Pompe` AUTO_INCREMENT = 15;

-- ============================================================
--  TRANSACTION / TRANSACTION_PRODUIT / TRANSACTION_ENERGIE / CCE / RECU
-- ============================================================
CREATE TABLE `Transaction` (
  `id_transaction` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `prix_total`     DECIMAL(10,3) NOT NULL,
  `date_heure`     DATETIME NOT NULL,
  PRIMARY KEY (`id_transaction`),
  UNIQUE KEY `id_transaction` (`id_transaction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Transaction` (`id_transaction`, `prix_total`, `date_heure`) VALUES
(19, 4.990,   '2026-03-05 14:08:51'),
(20, 49.735,  '2026-03-05 21:31:28'),
(21, 18.956,  '2026-03-05 21:44:33'),
(22, 47.268,  '2026-03-12 10:36:38'),
(23, 74.374,  '2026-03-12 11:04:36'),
(24, 1.290,   '2026-03-12 11:17:40'),
(25, 67.031,  '2026-03-12 13:46:30'),
(26, 51.975,  '2026-03-12 14:47:27'),
(27, 30.959,  '2026-03-12 14:48:02'),
(28, 5.080,   '2026-03-12 15:12:26'),
(29, 4.780,   '2026-03-12 15:26:25'),
(30, 2.180,   '2026-03-12 15:31:15'),
(31, 4.470,   '2026-03-14 13:24:09'),
(32, 4.670,   '2026-03-14 15:02:22'),
(33, 5.670,   '2026-03-14 15:06:17'),
(34, 55.841,  '2026-03-14 15:11:51'),
(35, 9.060,   '2026-03-14 15:49:57'),
(36, 24.696,  '2026-03-14 15:56:46'),
(37, 25.920,  '2026-03-14 23:41:13'),
(38, 7.560,   '2026-03-14 23:41:28'),
(39, 9.240,   '2026-03-16 09:55:07'),
(40, 7.670,   '2026-03-16 18:21:48'),
(41, 2.580,   '2026-03-16 18:27:27'),
(42, 15.950,  '2026-03-16 18:32:25'),
(43, 4.280,   '2026-03-16 18:33:35'),
(44, 3.980,   '2026-03-16 18:34:26'),
(45, 4.780,   '2026-03-16 21:17:53'),
(46, 8.080,   '2026-03-16 22:16:04'),
(47, 8.070,   '2026-03-16 22:23:38'),
(48, 12.770,  '2026-03-17 14:33:54'),
(49, 11.420,  '2026-03-17 14:36:07'),
(50, 4.830,   '2026-03-17 14:59:26'),
(51, 8.630,   '2026-03-17 15:33:50'),
(52, 8.830,   '2026-03-17 15:36:59'),
(53, 7.170,   '2026-03-17 18:29:45'),
(54, 9.960,   '2026-03-17 18:47:43'),
(55, 11.580,  '2026-03-17 21:43:35'),
(56, 17.760,  '2026-03-18 13:21:12'),
(57, 2.190,   '2026-03-18 16:34:24'),
(58, 3.080,   '2026-03-18 16:35:20'),
(59, 8.530,   '2026-03-19 00:32:19'),
(60, 18.503,  '2026-03-19 07:46:11');
ALTER TABLE `Transaction` AUTO_INCREMENT = 61;

CREATE TABLE `TransactionCCE` (
  `id_transaction` BIGINT UNSIGNED NOT NULL,
  `id_carte_CE`    BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_transaction`, `id_carte_CE`),
  KEY `id_carte_CE` (`id_carte_CE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `TransactionCCE` (`id_transaction`, `id_carte_CE`) VALUES
(53, 3), (54, 10), (55, 10), (56, 12), (59, 12);

CREATE TABLE `TransactionEnergie` (
  ` id_transaction_energie` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_transaction`          BIGINT UNSIGNED DEFAULT NULL,
  `id_energie`              BIGINT UNSIGNED NOT NULL,
  `quantite_delivree`       DECIMAL(10,3) NOT NULL,
  `temps_charge`            TIME NOT NULL,
  `statut`                  ENUM('en_cours','payee') NOT NULL DEFAULT 'en_cours',
  `id_pompe`                BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (` id_transaction_energie`),
  UNIQUE KEY ` id_transaction_energie` (` id_transaction_energie`),
  KEY `id_transaction` (`id_transaction`),
  KEY `id_energie` (`id_energie`),
  KEY `fk_te_pompe` (`id_pompe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `TransactionEnergie` (` id_transaction_energie`, `id_transaction`, `id_energie`, `quantite_delivree`, `temps_charge`, `statut`, `id_pompe`) VALUES
(17, 20, 2, 26.190, '00:00:00', 'payee', 1),
(18, 21, 1, 10.537, '00:00:00', 'payee', 1),
(19, 22, 4, 26.872, '00:00:00', 'payee', 1),
(20, 23, 2, 39.165, '00:00:00', 'payee', 2),
(21, 25, 2, 35.298, '00:00:00', 'payee', 1),
(22, 26, 1, 28.891, '00:00:00', 'payee', 2),
(23, 27, 2, 16.303, '00:00:00', 'payee', 2),
(24, 34, 3, 32.867, '00:00:00', 'payee', 2),
(25, 36, 4, 14.040, '00:00:00', 'payee', 2),
(26, 49, 5, 11.431, '00:00:00', 'payee', 1),
(27, 60, 5, 18.522, '00:00:00', 'payee', 1);
ALTER TABLE `TransactionEnergie` AUTO_INCREMENT = 28;

CREATE TABLE `TransactionProduit` (
  `id_transaction_produit`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ` id_transaction`          BIGINT UNSIGNED NOT NULL,
  `code_barres`              BIGINT UNSIGNED NOT NULL,
  `quantite_produit_totale`  INT NOT NULL,
  PRIMARY KEY (`id_transaction_produit`),
  UNIQUE KEY `id_transaction_produit` (`id_transaction_produit`),
  KEY ` id_transaction` (` id_transaction`),
  KEY `code_barres` (`code_barres`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `TransactionProduit` (`id_transaction_produit`, ` id_transaction`, `code_barres`, `quantite_produit_totale`) VALUES
(3,  19, 3175680091680, 1), (4,  24, 7622210449283, 1), (5,  28, 5099576088745, 1),
(6,  28, 9771950123005, 1), (7,  29, 3600524068738, 1), (8,  29, 5000159461121, 1),
(9,  30, 3175680011800, 1), (10, 30, 3057640257578, 1), (11, 31, 3228882010053, 1),
(12, 31, 3014760032112, 1), (13, 31, 5449000214911, 1), (14, 32, 3600522118015, 1),
(15, 32, 7622210449283, 1), (16, 32, 3228882010053, 1), (17, 33, 7622210449283, 1),
(18, 33, 3600524068738, 1), (19, 33, 3014760032112, 1), (20, 35, 9772102347008, 1),
(21, 35, 5449000131836, 1), (22, 35, 5000112657920, 1), (23, 35, 3228882010053, 1),
(24, 35, 7622210449283, 1), (25, 37, 5099576088745, 1), (26, 37, 3245390214017, 1),
(27, 37, 3057640257578, 2), (28, 37, 3600524068738, 1), (29, 37, 5449000214911, 1),
(30, 37, 3228882010053, 2), (31, 37, 7622210449283, 2), (32, 37, 3600522118015, 1),
(33, 37, 5000112657920, 1), (34, 37, 5449000131836, 1), (35, 37, 5000159417891, 1),
(36, 38, 3228882010053, 1), (37, 38, 3600524068738, 1), (38, 38, 3400930006903, 1),
(39, 38, 5449000214911, 1), (40, 39, 3228882010053, 1), (41, 39, 7622210449283, 2),
(42, 39, 3017620425035, 1), (43, 39, 5000112657920, 1), (44, 39, 5000159461121, 1),
(45, 40, 3245390214017, 1), (46, 40, 5099576088745, 1), (47, 40, 5449000131836, 1),
(48, 41, 3057640257578, 1), (49, 41, 3014760032112, 1), (50, 42, 5099576088745, 2),
(51, 42, 5000112657920, 1), (52, 42, 3760020509015, 1), (53, 42, 5449000214911, 1),
(54, 43, 9772102347008, 1), (55, 43, 3057640257578, 1), (56, 43, 3228882010053, 1),
(57, 44, 5000112657920, 1), (58, 44, 3017620425035, 1), (59, 45, 3600524068738, 1),
(60, 45, 5000159461121, 1), (61, 46, 3228882010053, 1), (62, 46, 9772102347008, 1),
(63, 46, 3175680091680, 1), (64, 47, 5449000214911, 1), (65, 47, 3175680091680, 1),
(66, 47, 3245390214024, 1), (67, 48, 3571090000148, 1), (68, 48, 3400930006903, 1),
(69, 48, 7622210449283, 1), (70, 50, 3400930006903, 1), (71, 50, 3245390214017, 1),
(72, 50, 5000159417891, 1), (73, 51, 5000159417891, 1), (74, 51, 3760020509015, 1),
(75, 51, 3600524068738, 1), (76, 52, 3600522118015, 1), (77, 52, 5000159417891, 1),
(78, 52, 3175680091680, 1), (79, 53, 5000159461121, 1), (80, 53, 9772102347008, 1),
(81, 53, 3175680011800, 1), (82, 53, 5449000214911, 1), (83, 54, 3017620425035, 1),
(84, 54, 5000112657920, 1), (85, 54, 3560070976843, 1), (86, 54, 3245390214017, 1),
(87, 55, 9771950123005, 1), (88, 55, 3571090000148, 1), (89, 56, 7622210449283, 1),
(90, 56, 3175680091680, 1), (91, 56, 3571090000148, 1), (92, 56, 3017620425035, 1),
(93, 57, 5449000214911, 1), (94, 58, 5449000214911, 1), (95, 58, 3228882010053, 1),
(96, 59, 5000159417891, 1), (97, 59, 5449000214911, 1), (98, 59, 3175680091680, 1);
ALTER TABLE `TransactionProduit` AUTO_INCREMENT = 99;

CREATE TABLE `Recu` (
  `id_recu`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_transaction` BIGINT UNSIGNED NOT NULL,
  `num_carte`      INT NOT NULL,
  `horodatage`     DATETIME NOT NULL,
  PRIMARY KEY (`id_recu`),
  UNIQUE KEY `id_recu` (`id_recu`),
  KEY `id_transaction` (`id_transaction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Recu` (`id_recu`, `id_transaction`, `num_carte`, `horodatage`) VALUES
(6,  29, 200029, '2026-03-12 15:27:15'),
(7,  30, 100030, '2026-03-12 15:31:49'),
(8,  33, 100033, '2026-03-14 15:06:18'),
(9,  34, 200034, '2026-03-14 15:11:54'),
(10, 35, 200035, '2026-03-14 15:49:59'),
(11, 36, 100036, '2026-03-14 15:56:50'),
(12, 37, 100037, '2026-03-14 23:41:18'),
(13, 48, 100048, '2026-03-17 14:34:03'),
(14, 56, 200056, '2026-03-18 13:21:19'),
(15, 57, 100057, '2026-03-18 16:34:37'),
(16, 58, 300058, '2026-03-18 16:35:24'),
(17, 59, 200059, '2026-03-19 00:32:22');
ALTER TABLE `Recu` AUTO_INCREMENT = 18;

-- ============================================================
--  RÉAPPROVISIONNEMENT
-- ============================================================
CREATE TABLE `Reapprovisionnement` (
  `id_reappro`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `statut_reappro`  ENUM('En cours','En retard','Arrivé','Annulé') NOT NULL DEFAULT 'En cours',
  `date_reappro`    DATE NOT NULL,
  `date_souhaitee`  DATE DEFAULT NULL,
  `est_auto`        TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_reappro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Reapprovisionnement` VALUES
(1, 'Arrivé',   '2026-03-01', '2026-03-05', 1),
(2, 'Annulé',   '2026-03-10', '2026-03-14', 1),
(3, 'Annulé',   '2026-03-11', '2026-03-13', 0),
(4, 'En retard','2026-02-25', '2026-03-01', 1),
(5, 'Annulé',   '2026-03-05', '2026-03-08', 0),
(6, 'En cours', '2026-03-12', '2026-03-20', 0),
(7, 'Annulé',   '2026-03-12', '2026-03-14', 0);
ALTER TABLE `Reapprovisionnement` AUTO_INCREMENT = 8;

CREATE TABLE `LigneReappro` (
  `id_reappro`  BIGINT UNSIGNED NOT NULL,
  `id_article`  BIGINT UNSIGNED NOT NULL,
  `quantite`    DECIMAL(10,3) NOT NULL,
  `date_arrivee` DATE DEFAULT NULL,
  PRIMARY KEY (`id_reappro`, `id_article`),
  KEY `fk_lr_article` (`id_article`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `LigneReappro` VALUES
(1, 1,  5000.000, '2026-03-04'),
(1, 2,  3000.000, '2026-03-04'),
(1, 3,  7000.000, '2026-03-05'),
(2, 4,  5000.000, NULL),
(2, 5,  2000.000, NULL),
(3, 8,  20.000,   NULL),
(3, 14, 24.000,   NULL),
(3, 28, 15.000,   NULL),
(4, 5,  2000.000, NULL),
(5, 16, 18.000,   NULL),
(5, 17, 30.000,   NULL),
(6, 12, 3.000,    NULL),
(7, 22, 67.000,   NULL);

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

INSERT INTO `ValeursDefautReappro` (`id_valeur_reappro_defaut`, `id_article`, `seuil_alerte`, `volume`, `frequence_valeur`, `frequence_unite`) VALUES
(1,1,500.000,5000.000,1,'semaine'),(2,2,500.000,3000.000,1,'semaine'),
(3,3,800.000,7000.000,5,'jour'),  (4,4,500.000,5000.000,1,'semaine'),
(5,5,300.000,2000.000,2,'semaine'),(6,6,0.000,0.000,1,'mois'),
(7,7,0.000,0.000,1,'mois'),       (8,8,5.000,20.000,1,'semaine'),
(9,9,5.000,20.000,1,'semaine'),   (10,10,5.000,15.000,1,'semaine'),
(11,11,3.000,12.000,2,'semaine'), (12,12,3.000,12.000,2,'semaine'),
(13,13,3.000,12.000,2,'semaine'), (14,14,8.000,24.000,5,'jour'),
(15,15,8.000,24.000,5,'jour'),    (16,16,7.000,18.000,1,'semaine'),
(17,17,10.000,30.000,5,'jour'),   (18,18,6.000,18.000,1,'semaine'),
(19,19,2.000,10.000,1,'jour'),    (20,20,2.000,5.000,1,'semaine'),
(21,21,5.000,20.000,1,'semaine'), (22,22,3.000,10.000,2,'semaine'),
(23,23,2.000,6.000,1,'mois'),     (24,24,1.000,4.000,1,'mois'),
(25,25,2.000,6.000,1,'mois'),     (26,26,3.000,10.000,2,'semaine'),
(27,27,3.000,10.000,2,'semaine'), (28,28,3.000,15.000,5,'jour'),
(29,29,4.000,15.000,5,'jour'),    (30,30,6.000,20.000,5,'jour');
ALTER TABLE `ValeursDefautReappro` AUTO_INCREMENT = 31;

-- ============================================================
--  INCIDENTS / JOURS
-- ============================================================
CREATE TABLE `FicheIncident` (
  `id_ref_unique`  BIGINT NOT NULL AUTO_INCREMENT,
  `date_creation`  DATE NOT NULL,
  `heure_creation` TIME NOT NULL,
  `type_incident`  VARCHAR(100) NOT NULL,
  `detail_tech`    TEXT NOT NULL,
  `solution`       TEXT NOT NULL,
  PRIMARY KEY (`id_ref_unique`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `FicheIncident` (`id_ref_unique`, `date_creation`, `heure_creation`, `type_incident`, `detail_tech`, `solution`) VALUES
(1, '2026-03-05', '09:15:00', 'Panne pompe',         'Pompe n°2 hors service - défaut électrique détecté',     'Technicien appelé, remplacement fusible'),
(2, '2026-03-12', '11:45:00', 'Débordement carburant','Client n°22 a débordé lors du plein - SP98 répandu sol', 'Nettoyage immédiat, signalement sécurité'),
(3, '2026-03-14', '16:20:00', 'Problème caisse',      'Terminal CB refusait les transactions Visa',             'Redémarrage terminal, reprise normale 16h35'),
(4, '2026-03-16', '08:30:00', 'Alerte stock',         'Stock E85 en dessous du seuil critique (< 300 L)',       'Commande urgente passée - livraison J+1'),
(5, '2026-03-17', '14:10:00', 'Incident électrique',  'Borne rapide n°3 en défaut - code erreur E42',           'Reset borne, maintenance préventive programmée'),
(6, '2026-03-18', '00:28:41', 'Burnout',              'Trop de travail peu de sommeil..',                       'Dormir et des bons repas'),
(7, '2026-03-19', '07:55:00', 'Vandalisme',           'Caméra de surveillance n°2 endommagée',                  'Signalement police, demande remplacement caméra');
ALTER TABLE `FicheIncident` AUTO_INCREMENT = 8;

CREATE TABLE `JourSemaine` (
  `id_jour` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `libelle` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`id_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `JourSemaine` VALUES
(1,'Lundi'),(2,'Mardi'),(3,'Mercredi'),(4,'Jeudi'),(5,'Vendredi'),(6,'Samedi'),(7,'Dimanche');
ALTER TABLE `JourSemaine` AUTO_INCREMENT = 8;

CREATE TABLE `Horaire` (
  `id_horaire`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_jour`         BIGINT UNSIGNED NOT NULL,
  `heure_ouverture` TIME NOT NULL,
  `heure_fermeture` TIME NOT NULL,
  `est_ferme`       TINYINT(1) NOT NULL,
  PRIMARY KEY (`id_horaire`),
  KEY `id_jour` (`id_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `Horaire` VALUES
(1,1,'06:00:00','22:00:00',0),
(2,2,'06:00:00','22:00:00',0),
(3,3,'06:00:00','22:00:00',0),
(4,4,'06:00:00','22:00:00',0),
(5,5,'06:00:00','23:00:00',0),
(6,6,'07:00:00','23:00:00',0),
(7,7,'08:00:00','21:00:00',0);
ALTER TABLE `Horaire` AUTO_INCREMENT = 8;

CREATE TABLE `JourFermeture` (
  `id_fermeture`   BIGINT NOT NULL AUTO_INCREMENT,
  `date_fermeture` DATE NOT NULL,
  `motif`          VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id_fermeture`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `JourFermeture` VALUES
(1, '2026-12-25', 'Noël'),
(2, '2026-06-02', 'Jour férié'),
(4, '2026-03-26', 'Fêtes des bulgares'),
(5, '2026-11-21', 'Fêtes de Twenty One Pilots');
ALTER TABLE `JourFermeture` AUTO_INCREMENT = 6;

-- ============================================================
--  VALIDATION — 2 TABLES SÉPARÉES (Sprint 6)
-- ============================================================
CREATE TABLE `ValidationTransactions` (
  `id_validation_tx`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date_jour`         DATE NOT NULL,
  `est_valide`        TINYINT(1) NOT NULL DEFAULT 0,
  `date_validation`   DATETIME NOT NULL,
  PRIMARY KEY (`id_validation_tx`),
  KEY `idx_date_jour` (`date_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Validation de la table relevé des transactions journalières';

CREATE TABLE `ValidationIncidents` (
  `id_validation_inc` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `date_jour`         DATE NOT NULL,
  `est_valide`        TINYINT(1) NOT NULL DEFAULT 0,
  `date_validation`   DATETIME NOT NULL,
  PRIMARY KEY (`id_validation_inc`),
  KEY `idx_date_jour` (`date_jour`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Validation de la table relevé des incidents journaliers';

-- Exemples : journées déjà validées pour tester le verrouillage
INSERT INTO `ValidationTransactions` (`date_jour`, `est_valide`, `date_validation`) VALUES
('2026-03-05', 1, '2026-03-05 23:45:00'),
('2026-03-12', 1, '2026-03-12 23:50:00'),
('2026-03-14', 1, '2026-03-14 23:55:00');

INSERT INTO `ValidationIncidents` (`date_jour`, `est_valide`, `date_validation`) VALUES
('2026-03-05', 1, '2026-03-05 23:46:00'),
('2026-03-12', 1, '2026-03-12 23:51:00');

-- ============================================================
--  CLÉS ÉTRANGÈRES
-- ============================================================
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
  ADD CONSTRAINT `CarteCE_ibfk_1` FOREIGN KEY (`id_client`) REFERENCES `Client` (`id_client`);

ALTER TABLE `TransactionCCE`
  ADD CONSTRAINT `TransactionCCE_ibfk_1` FOREIGN KEY (`id_carte_CE`) REFERENCES `CarteCE` (`id_carte_CE`),
  ADD CONSTRAINT `TransactionCCE_ibfk_2` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `TransactionEnergie`
  ADD CONSTRAINT `fk_te_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`),
  ADD CONSTRAINT `fk_te_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `TransactionProduit`
  ADD CONSTRAINT `fk_tp_produit` FOREIGN KEY (`code_barres`) REFERENCES `Produit` (`code_barres`),
  ADD CONSTRAINT `fk_tp_transaction` FOREIGN KEY (` id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `Recu`
  ADD CONSTRAINT `fk_recu_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

ALTER TABLE `LigneReappro`
  ADD CONSTRAINT `fk_lr_reappro` FOREIGN KEY (`id_reappro`) REFERENCES `Reapprovisionnement` (`id_reappro`),
  ADD CONSTRAINT `fk_lr_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `ValeursDefautReappro`
  ADD CONSTRAINT `fk_vdr_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

ALTER TABLE `Horaire`
  ADD CONSTRAINT `Horaire_ibfk_1` FOREIGN KEY (`id_jour`) REFERENCES `JourSemaine` (`id_jour`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;