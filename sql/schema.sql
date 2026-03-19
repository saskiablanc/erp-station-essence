-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : mer. 18 mars 2026 à 21:14
-- Version du serveur : 11.8.6-MariaDB-0+deb13u1 from Debian
-- Version de PHP : 8.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `unica_station`
--

-- --------------------------------------------------------

--
-- Structure de la table `Article`
--

CREATE TABLE `Article` (
  `id_article` bigint(20) UNSIGNED NOT NULL,
  `type_article` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Article`
--

INSERT INTO `Article` (`id_article`, `type_article`) VALUES
(1, 'Carburant'),
(2, 'Carburant'),
(3, 'Carburant'),
(4, 'Carburant'),
(5, 'Carburant'),
(6, 'energie'),
(7, 'energie'),
(8, 'Snack'),
(9, 'Snack'),
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

-- --------------------------------------------------------

--
-- Structure de la table `BonusCCE`
--

CREATE TABLE `BonusCCE` (
  `id_bonus` int(10) UNSIGNED NOT NULL,
  `tranche` decimal(10,2) NOT NULL,
  `montant_bonus` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `BonusCCE`
--

INSERT INTO `BonusCCE` (`id_bonus`, `tranche`, `montant_bonus`) VALUES
(1, 100.00, 10.00),
(2, 200.00, 25.00);

-- --------------------------------------------------------

--
-- Structure de la table `Carburant`
--

CREATE TABLE `Carburant` (
  `id_carburant` bigint(20) UNSIGNED NOT NULL,
  `id_energie` bigint(20) UNSIGNED NOT NULL,
  `prix_litre` decimal(10,3) NOT NULL,
  `stock_litre` decimal(10,3) NOT NULL,
  `livraison_min` decimal(10,3) NOT NULL DEFAULT 5.000,
  `libelle` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Carburant`
--

INSERT INTO `Carburant` (`id_carburant`, `id_energie`, `prix_litre`, `stock_litre`, `livraison_min`, `libelle`) VALUES
(1, 1, 1.799, 4951.072, 30.000, 'SP95'),
(2, 2, 1.897, 2874.944, 30.000, 'SP98'),
(3, 3, 1.699, 6879.483, 20.000, 'GAZOLE'),
(4, 4, 1.759, 4432.688, 30.000, 'E10'),
(5, 5, 0.999, 1967.319, 10.000, 'E85');

-- --------------------------------------------------------

--
-- Structure de la table `CarteCE`
--

CREATE TABLE `CarteCE` (
  `id_carte_CE` bigint(20) UNSIGNED NOT NULL,
  `id_client` bigint(20) UNSIGNED NOT NULL,
  `code_secret` int(11) NOT NULL,
  `solde_client` decimal(10,3) NOT NULL,
  `date_dernier_apport` date NOT NULL,
  `montant_dernier_apport` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `CarteCE`
--

INSERT INTO `CarteCE` (`id_carte_CE`, `id_client`, `code_secret`, `solde_client`, `date_dernier_apport`, `montant_dernier_apport`) VALUES
(1, 1, 1234, 375.000, '2026-03-17', 200),
(2, 2, 5678, 50.000, '2026-02-05', 50),
(3, 3, 9999, 571.300, '2026-03-17', 50),
(4, 4, 4850, 0.000, '2026-03-14', 0),
(5, 5, 2019, 225.000, '2026-03-17', 200),
(10, 10, 4665, 433.460, '2026-03-17', 200),
(12, 12, 4931, 268.900, '2026-03-18', 52),
(13, 13, 8207, 7.580, '2026-03-18', 8),
(14, 14, 4343, 0.000, '2026-03-18', 0),
(15, 15, 8937, 0.000, '2026-03-18', 0);

-- --------------------------------------------------------

--
-- Structure de la table `Client`
--

CREATE TABLE `Client` (
  `id_client` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(50) NOT NULL,
  `prenom` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `num_tel` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Client`
--

INSERT INTO `Client` (`id_client`, `nom`, `prenom`, `email`, `num_tel`) VALUES
(1, 'Dupont', 'Jean', 'jean.dupont@email.com', '601020304'),
(2, 'Martin', 'Sophie', 'sophie.martin@email.com', '612345678'),
(3, 'Durand', 'Pierre', 'pierre.durand@email.com', '698765432'),
(4, 'Bachov', 'Steven', 's.bach@mail.com', '+0766161603'),
(5, 'bachova', 'camilia', 'c.bachova@mail.com', '+0766161604'),
(10, 'Mongrandi', 'Lenny', 'lenny21@gmail.com', '+33618212121'),
(12, 'Blanc', 'Saskia', 'saskia@gmail.com', '+33677777777'),
(13, 'alrawahi', 'aser', 'aaa@mail.com', '+99199191199'),
(14, 'daddy', 'aser', 'aser@gmail.com', '+33754323655'),
(15, 'Lassauniere', 'Nathan', 'nathan@gmail.com', '0651766318'),
(16, 'Montariol', 'Gillis', 'gigi@gmail.com', '0768211715');

-- --------------------------------------------------------

--
-- Structure de la table `Connexion`
--

CREATE TABLE `Connexion` (
  `id_connexion` int(10) UNSIGNED NOT NULL,
  `identifiant` varchar(100) NOT NULL,
  `mdp` varchar(255) NOT NULL,
  `role` enum('employe','gerant') NOT NULL DEFAULT 'employe'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `Connexion`
--

INSERT INTO `Connexion` (`id_connexion`, `identifiant`, `mdp`, `role`) VALUES
(1, 'employe1', '$2y$10$vKjY.kqXjfN.kal2IVzIv.oPzPG6yIE6vSXqsWgvds0hwW5L2j5qm', 'employe'),
(2, 'gerant1', '$2y$10$WtArQLuo/xfRF/T.flSXjOI5PoMNhsajid2huRpv692Q8OglkzUG.', 'gerant');

-- --------------------------------------------------------

--
-- Structure de la table `Electricite`
--

CREATE TABLE `Electricite` (
  `id_electricite` bigint(20) UNSIGNED NOT NULL,
  `id_energie` bigint(20) UNSIGNED NOT NULL,
  `prix_kwh` decimal(10,3) NOT NULL,
  `type_charge` enum('rapide','lente') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Electricite`
--

INSERT INTO `Electricite` (`id_electricite`, `id_energie`, `prix_kwh`, `type_charge`) VALUES
(1, 6, 0.650, 'rapide'),
(2, 7, 0.300, 'lente');

-- --------------------------------------------------------

--
-- Structure de la table `Energie`
--

CREATE TABLE `Energie` (
  `id_energie` bigint(20) UNSIGNED NOT NULL,
  `id_article` bigint(20) UNSIGNED NOT NULL,
  `type_energie` enum('carburant','electricite') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Energie`
--

INSERT INTO `Energie` (`id_energie`, `id_article`, `type_energie`) VALUES
(1, 1, 'carburant'),
(2, 2, 'carburant'),
(3, 3, 'carburant'),
(4, 4, 'carburant'),
(5, 5, 'carburant'),
(6, 6, 'electricite'),
(7, 7, 'electricite');

-- --------------------------------------------------------

--
-- Structure de la table `FicheIncident`
--

CREATE TABLE `FicheIncident` (
  `id_ref_unique` bigint(20) NOT NULL,
  `date_creation` date NOT NULL,
  `heure_creation` time NOT NULL,
  `type_incident` varchar(100) NOT NULL,
  `detail_tech` text NOT NULL,
  `solution` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `FicheIncident`
--

INSERT INTO `FicheIncident` (`id_ref_unique`, `date_creation`, `heure_creation`, `type_incident`, `detail_tech`, `solution`) VALUES
(1, '2026-03-18', '00:28:41', 'Burnout', 'trop de travail peu de sommeil..', 'dormir et des bons repas');

-- --------------------------------------------------------

--
-- Structure de la table `Horaire`
--

CREATE TABLE `Horaire` (
  `id_horaire` bigint(20) UNSIGNED NOT NULL,
  `id_jour` bigint(20) UNSIGNED NOT NULL,
  `heure_ouverture` time NOT NULL,
  `heure_fermeture` time NOT NULL,
  `est_ferme` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Horaire`
--

INSERT INTO `Horaire` (`id_horaire`, `id_jour`, `heure_ouverture`, `heure_fermeture`, `est_ferme`) VALUES
(1, 1, '14:00:00', '22:00:00', 0),
(2, 2, '14:00:00', '22:00:00', 1),
(3, 3, '09:00:00', '23:00:00', 1),
(4, 4, '11:00:00', '23:00:00', 1),
(5, 5, '09:00:00', '23:00:00', 0),
(6, 6, '09:00:00', '23:00:00', 0),
(7, 7, '11:00:00', '23:00:00', 0);

-- --------------------------------------------------------

--
-- Structure de la table `JourFermeture`
--

CREATE TABLE `JourFermeture` (
  `id_fermeture` bigint(20) NOT NULL,
  `date_fermeture` date NOT NULL,
  `motif` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `JourFermeture`
--

INSERT INTO `JourFermeture` (`id_fermeture`, `date_fermeture`, `motif`) VALUES
(1, '2026-12-25', 'Noël'),
(2, '2026-06-02', 'Jour férié'),
(4, '2026-03-26', 'Fêtes des bulgares'),
(5, '2026-11-21', 'Fêtes de Twenty One Pilots');

-- --------------------------------------------------------

--
-- Structure de la table `JourSemaine`
--

CREATE TABLE `JourSemaine` (
  `id_jour` bigint(20) UNSIGNED NOT NULL,
  `libelle` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `JourSemaine`
--

INSERT INTO `JourSemaine` (`id_jour`, `libelle`) VALUES
(1, 'Lundi'),
(2, 'Mardi'),
(3, 'Mercredi'),
(4, 'Jeudi'),
(5, 'Vendredi'),
(6, 'Samedi'),
(7, 'Dimanche');

-- --------------------------------------------------------

--
-- Structure de la table `LigneReappro`
--

CREATE TABLE `LigneReappro` (
  `id_reappro` bigint(20) UNSIGNED NOT NULL,
  `id_article` bigint(20) UNSIGNED NOT NULL,
  `quantite` decimal(10,3) NOT NULL,
  `date_arrivee` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `LigneReappro`
--

INSERT INTO `LigneReappro` (`id_reappro`, `id_article`, `quantite`, `date_arrivee`) VALUES
(1, 1, 5000.000, '2026-03-04'),
(1, 2, 3000.000, '2026-03-04'),
(1, 3, 7000.000, '2026-03-05'),
(2, 4, 5000.000, NULL),
(2, 5, 2000.000, NULL),
(3, 8, 20.000, NULL),
(3, 14, 24.000, NULL),
(3, 28, 15.000, NULL),
(4, 5, 2000.000, NULL),
(5, 16, 18.000, NULL),
(5, 17, 30.000, NULL),
(6, 12, 3.000, NULL),
(7, 22, 67.000, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ParametresCCE`
--

CREATE TABLE `ParametresCCE` (
  `id_parametre` int(10) UNSIGNED NOT NULL,
  `montant_min` decimal(10,2) NOT NULL DEFAULT 50.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `ParametresCCE`
--

INSERT INTO `ParametresCCE` (`id_parametre`, `montant_min`) VALUES
(1, 50.00);

-- --------------------------------------------------------

--
-- Structure de la table `Pompe`
--

CREATE TABLE `Pompe` (
  `id_pompe` bigint(20) UNSIGNED NOT NULL,
  `numero` int(11) NOT NULL COMMENT 'Numéro affiché sur le panneau (1-4 carburant, 1-10 elec)',
  `type_pompe` enum('carburant','electricite') NOT NULL,
  `sous_type` enum('rapide','lente') DEFAULT NULL COMMENT 'Pour les bornes élec : rapide (super-chargeur) ou lente (chargeur standard)',
  `mode` enum('manuel','auto') NOT NULL COMMENT 'manuel=paye en caisse, auto=automate 24h',
  `statut` enum('active','desactivee','en_cours') NOT NULL DEFAULT 'active' COMMENT 'active=libre et opérationnelle, en_cours=livraison en cours, desactivee=attend activation',
  `date_debut` datetime DEFAULT NULL COMMENT 'Début de la transaction en cours',
  `id_transaction_energie` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'FK vers la TransactionEnergie en cours'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci COMMENT='Pompes carburant et bornes électriques de la station';

--
-- Déchargement des données de la table `Pompe`
--

INSERT INTO `Pompe` (`id_pompe`, `numero`, `type_pompe`, `sous_type`, `mode`, `statut`, `date_debut`, `id_transaction_energie`) VALUES
(1, 1, 'carburant', NULL, 'manuel', 'active', NULL, NULL),
(2, 2, 'carburant', NULL, 'manuel', 'active', NULL, NULL),
(3, 3, 'carburant', NULL, 'auto', 'active', NULL, NULL),
(4, 4, 'carburant', NULL, 'auto', 'active', NULL, NULL),
(5, 1, 'electricite', 'rapide', 'auto', 'en_cours', '2026-03-04 23:15:00', 14),
(6, 2, 'electricite', 'rapide', 'auto', 'active', NULL, NULL),
(7, 3, 'electricite', 'rapide', 'auto', 'active', NULL, NULL),
(8, 4, 'electricite', 'rapide', 'auto', 'active', NULL, NULL),
(9, 5, 'electricite', 'rapide', 'auto', 'active', NULL, NULL),
(10, 6, 'electricite', 'rapide', 'auto', 'active', NULL, NULL),
(11, 7, 'electricite', 'rapide', 'auto', 'active', NULL, NULL),
(12, 8, 'electricite', 'rapide', 'auto', 'active', NULL, NULL),
(13, 9, 'electricite', 'lente', 'auto', 'active', NULL, NULL),
(14, 10, 'electricite', 'lente', 'auto', 'active', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `Produit`
--

CREATE TABLE `Produit` (
  `code_barres` bigint(20) UNSIGNED NOT NULL,
  `id_article` bigint(20) UNSIGNED NOT NULL,
  `libelle_produit` varchar(255) NOT NULL,
  `quantite_produit` int(10) NOT NULL,
  `prix` decimal(10,3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Produit`
--

INSERT INTO `Produit` (`code_barres`, `id_article`, `libelle_produit`, `quantite_produit`, `prix`) VALUES
(3014760032112, 11, 'Chewing-gum Freedent White 10p', 0, 1.390),
(3017620425035, 8, 'Chips Lay\'s Nature 45g', 1, 1.490),
(3057640257578, 17, 'Eau Evian 50cl', 0, 1.190),
(3175680011800, 12, 'Mentos Fruits 38g', 0, 0.990),
(3175680091680, 23, 'Dégivrant pare-brise 400ml', 0, 4.990),
(3228882010053, 18, 'Café Expresso capsule x1', 0, 0.890),
(3245390214017, 21, 'Briquet BIC classique', 1, 1.990),
(3245390214024, 22, 'Allumettes x40', 1, 0.890),
(3400930006903, 30, 'Croissant pur beurre', 1, 1.490),
(3560070976843, 28, 'Sandwich Jambon-Beurre', 1, 3.990),
(3571090000148, 24, 'Huile moteur 5W40 1L', 1, 9.990),
(3600522118015, 26, 'Gel hydroalcoolique 100ml', 1, 2.490),
(3600524068738, 27, 'Paracétamol 500mg x8', 0, 2.990),
(3760020509015, 29, 'Wrap Poulet-Crudités', 1, 4.290),
(5000112657920, 16, 'Red Bull 250ml', 1, 2.490),
(5000159417891, 13, 'KitKat 2 barres 41.5g', 1, 1.350),
(5000159461121, 9, 'Chips Pringles Original 40g', 0, 1.790),
(5099576088745, 25, 'Chiffons microfibre x3', 0, 3.490),
(5449000131836, 15, 'Coca-Cola Zero 50cl', 1, 2.190),
(5449000214911, 14, 'Coca-Cola 50cl', 0, 2.190),
(7622210449283, 10, 'Barre Céréales BelVita x2', 0, 1.290),
(9771950123005, 19, 'L\'Équipe (journal du jour)', 0, 1.590),
(9772102347008, 20, 'Télé 7 Jours (hebdo)', 1, 2.200);

-- --------------------------------------------------------

--
-- Structure de la table `Reapprovisionnement`
--

CREATE TABLE `Reapprovisionnement` (
  `id_reappro` bigint(20) UNSIGNED NOT NULL,
  `statut_reappro` enum('En cours','En retard','Arrivé','Annulé') NOT NULL DEFAULT 'En cours',
  `date_reappro` date NOT NULL,
  `date_souhaitee` date DEFAULT NULL,
  `est_auto` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Reapprovisionnement`
--

INSERT INTO `Reapprovisionnement` (`id_reappro`, `statut_reappro`, `date_reappro`, `date_souhaitee`, `est_auto`) VALUES
(1, 'Arrivé', '2026-03-01', '2026-03-05', 1),
(2, 'Annulé', '2026-03-10', '2026-03-14', 1),
(3, 'Annulé', '2026-03-11', '2026-03-13', 0),
(4, 'En retard', '2026-02-25', '2026-03-01', 1),
(5, 'Annulé', '2026-03-05', '2026-03-08', 0),
(6, 'En cours', '2026-03-12', '2026-03-20', 0),
(7, 'Annulé', '2026-03-12', '2026-03-14', 0);

-- --------------------------------------------------------

--
-- Structure de la table `Recu`
--

CREATE TABLE `Recu` (
  `id_recu` bigint(20) UNSIGNED NOT NULL,
  `id_transaction` bigint(20) UNSIGNED NOT NULL,
  `num_carte` int(50) NOT NULL,
  `horodatage` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Recu`
--

INSERT INTO `Recu` (`id_recu`, `id_transaction`, `num_carte`, `horodatage`) VALUES
(6, 29, 200029, '2026-03-12 15:27:15'),
(7, 30, 100030, '2026-03-12 15:31:49'),
(8, 33, 100033, '2026-03-14 15:06:18'),
(9, 34, 200034, '2026-03-14 15:11:54'),
(10, 35, 200035, '2026-03-14 15:49:59'),
(11, 36, 100036, '2026-03-14 15:56:50'),
(12, 37, 100037, '2026-03-14 23:41:18'),
(13, 48, 100048, '2026-03-17 14:34:03'),
(14, 56, 200056, '2026-03-18 13:21:19'),
(15, 57, 100057, '2026-03-18 16:34:37'),
(16, 58, 300058, '2026-03-18 16:35:24');

-- --------------------------------------------------------

--
-- Structure de la table `Stock`
--

CREATE TABLE `Stock` (
  `id_stock` bigint(20) UNSIGNED NOT NULL,
  `id_article` bigint(20) UNSIGNED NOT NULL,
  `quantite_stock` int(10) NOT NULL,
  `type_quantite` enum('litre','unite') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Stock`
--

INSERT INTO `Stock` (`id_stock`, `id_article`, `quantite_stock`, `type_quantite`) VALUES
(1, 8, 96, 'unite'),
(2, 9, 96, 'unite'),
(3, 10, 90, 'unite'),
(4, 11, 97, 'unite'),
(5, 12, 98, 'unite'),
(6, 13, 96, 'unite'),
(7, 14, 92, 'unite'),
(8, 15, 97, 'unite'),
(9, 16, 93, 'unite'),
(10, 17, 95, 'unite'),
(11, 18, 90, 'unite'),
(12, 19, 98, 'unite'),
(13, 20, 96, 'unite'),
(14, 21, 96, 'unite'),
(15, 22, 99, 'unite'),
(16, 23, 94, 'unite'),
(17, 24, 97, 'unite'),
(18, 25, 95, 'unite'),
(19, 26, 97, 'unite'),
(20, 27, 94, 'unite'),
(21, 28, 99, 'unite'),
(22, 29, 98, 'unite'),
(23, 30, 97, 'unite');

-- --------------------------------------------------------

--
-- Structure de la table `Transaction`
--

CREATE TABLE `Transaction` (
  `id_transaction` bigint(20) UNSIGNED NOT NULL,
  `prix_total` decimal(10,3) NOT NULL,
  `date_heure` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Transaction`
--

INSERT INTO `Transaction` (`id_transaction`, `prix_total`, `date_heure`) VALUES
(19, 4.990, '2026-03-05 14:08:51'),
(20, 49.735, '2026-03-05 21:31:28'),
(21, 18.956, '2026-03-05 21:44:33'),
(22, 47.268, '2026-03-12 10:36:38'),
(23, 74.374, '2026-03-12 11:04:36'),
(24, 1.290, '2026-03-12 11:17:40'),
(25, 67.031, '2026-03-12 13:46:30'),
(26, 51.975, '2026-03-12 14:47:27'),
(27, 30.959, '2026-03-12 14:48:02'),
(28, 5.080, '2026-03-12 15:12:26'),
(29, 4.780, '2026-03-12 15:26:25'),
(30, 2.180, '2026-03-12 15:31:15'),
(31, 4.470, '2026-03-14 13:24:09'),
(32, 4.670, '2026-03-14 15:02:22'),
(33, 5.670, '2026-03-14 15:06:17'),
(34, 55.841, '2026-03-14 15:11:51'),
(35, 9.060, '2026-03-14 15:49:57'),
(36, 24.696, '2026-03-14 15:56:46'),
(37, 25.920, '2026-03-14 23:41:13'),
(38, 7.560, '2026-03-14 23:41:28'),
(39, 9.240, '2026-03-16 09:55:07'),
(40, 7.670, '2026-03-16 18:21:48'),
(41, 2.580, '2026-03-16 18:27:27'),
(42, 15.950, '2026-03-16 18:32:25'),
(43, 4.280, '2026-03-16 18:33:35'),
(44, 3.980, '2026-03-16 18:34:26'),
(45, 4.780, '2026-03-16 21:17:53'),
(46, 8.080, '2026-03-16 22:16:04'),
(47, 8.070, '2026-03-16 22:23:38'),
(48, 12.770, '2026-03-17 14:33:54'),
(49, 11.420, '2026-03-17 14:36:07'),
(50, 4.830, '2026-03-17 14:59:26'),
(51, 8.630, '2026-03-17 15:33:50'),
(52, 8.830, '2026-03-17 15:36:59'),
(53, 7.170, '2026-03-17 18:29:45'),
(54, 9.960, '2026-03-17 18:47:43'),
(55, 11.580, '2026-03-17 21:43:35'),
(56, 17.760, '2026-03-18 13:21:12'),
(57, 2.190, '2026-03-18 16:34:24'),
(58, 3.080, '2026-03-18 16:35:20');

-- --------------------------------------------------------

--
-- Structure de la table `TransactionCCE`
--

CREATE TABLE `TransactionCCE` (
  `id_transaction` bigint(20) UNSIGNED NOT NULL,
  `id_carte_CE` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `TransactionCCE`
--

INSERT INTO `TransactionCCE` (`id_transaction`, `id_carte_CE`) VALUES
(53, 3),
(54, 10),
(55, 10),
(56, 12);

-- --------------------------------------------------------

--
-- Structure de la table `TransactionEnergie`
--

CREATE TABLE `TransactionEnergie` (
  ` id_transaction_energie` bigint(20) UNSIGNED NOT NULL,
  `id_transaction` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Renseigné uniquement au paiement',
  `id_energie` bigint(20) UNSIGNED NOT NULL,
  `quantite_delivree` decimal(10,3) NOT NULL,
  `temps_charge` time NOT NULL,
  `statut` enum('en_cours','payee') NOT NULL DEFAULT 'en_cours' COMMENT 'en_cours = livraison terminée, pas encore payée ; payee = transaction soldée',
  `id_pompe` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'FK vers la pompe ayant réalisé cette transaction'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `TransactionEnergie`
--

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
(26, 49, 5, 11.431, '00:00:00', 'payee', 1);

-- --------------------------------------------------------

--
-- Structure de la table `TransactionProduit`
--

CREATE TABLE `TransactionProduit` (
  `id_transaction_produit` bigint(20) UNSIGNED NOT NULL,
  ` id_transaction` bigint(20) UNSIGNED NOT NULL,
  `code_barres` bigint(20) UNSIGNED NOT NULL,
  `quantite_produit_totale` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `TransactionProduit`
--

INSERT INTO `TransactionProduit` (`id_transaction_produit`, ` id_transaction`, `code_barres`, `quantite_produit_totale`) VALUES
(3, 19, 3175680091680, 1),
(4, 24, 7622210449283, 1),
(5, 28, 5099576088745, 1),
(6, 28, 9771950123005, 1),
(7, 29, 3600524068738, 1),
(8, 29, 5000159461121, 1),
(9, 30, 3175680011800, 1),
(10, 30, 3057640257578, 1),
(11, 31, 3228882010053, 1),
(12, 31, 3014760032112, 1),
(13, 31, 5449000214911, 1),
(14, 32, 3600522118015, 1),
(15, 32, 7622210449283, 1),
(16, 32, 3228882010053, 1),
(17, 33, 7622210449283, 1),
(18, 33, 3600524068738, 1),
(19, 33, 3014760032112, 1),
(20, 35, 9772102347008, 1),
(21, 35, 5449000131836, 1),
(22, 35, 5000112657920, 1),
(23, 35, 3228882010053, 1),
(24, 35, 7622210449283, 1),
(25, 37, 5099576088745, 1),
(26, 37, 3245390214017, 1),
(27, 37, 3057640257578, 2),
(28, 37, 3600524068738, 1),
(29, 37, 5449000214911, 1),
(30, 37, 3228882010053, 2),
(31, 37, 7622210449283, 2),
(32, 37, 3600522118015, 1),
(33, 37, 5000112657920, 1),
(34, 37, 5449000131836, 1),
(35, 37, 5000159417891, 1),
(36, 38, 3228882010053, 1),
(37, 38, 3600524068738, 1),
(38, 38, 3400930006903, 1),
(39, 38, 5449000214911, 1),
(40, 39, 3228882010053, 1),
(41, 39, 7622210449283, 2),
(42, 39, 3017620425035, 1),
(43, 39, 5000112657920, 1),
(44, 39, 5000159461121, 1),
(45, 40, 3245390214017, 1),
(46, 40, 5099576088745, 1),
(47, 40, 5449000131836, 1),
(48, 41, 3057640257578, 1),
(49, 41, 3014760032112, 1),
(50, 42, 5099576088745, 2),
(51, 42, 5000112657920, 1),
(52, 42, 3760020509015, 1),
(53, 42, 5449000214911, 1),
(54, 43, 9772102347008, 1),
(55, 43, 3057640257578, 1),
(56, 43, 3228882010053, 1),
(57, 44, 5000112657920, 1),
(58, 44, 3017620425035, 1),
(59, 45, 3600524068738, 1),
(60, 45, 5000159461121, 1),
(61, 46, 3228882010053, 1),
(62, 46, 9772102347008, 1),
(63, 46, 3175680091680, 1),
(64, 47, 5449000214911, 1),
(65, 47, 3175680091680, 1),
(66, 47, 3245390214024, 1),
(67, 48, 3571090000148, 1),
(68, 48, 3400930006903, 1),
(69, 48, 7622210449283, 1),
(70, 50, 3400930006903, 1),
(71, 50, 3245390214017, 1),
(72, 50, 5000159417891, 1),
(73, 51, 5000159417891, 1),
(74, 51, 3760020509015, 1),
(75, 51, 3600524068738, 1),
(76, 52, 3600522118015, 1),
(77, 52, 5000159417891, 1),
(78, 52, 3175680091680, 1),
(79, 53, 5000159461121, 1),
(80, 53, 9772102347008, 1),
(81, 53, 3175680011800, 1),
(82, 53, 5449000214911, 1),
(83, 54, 3017620425035, 1),
(84, 54, 5000112657920, 1),
(85, 54, 3560070976843, 1),
(86, 54, 3245390214017, 1),
(87, 55, 9771950123005, 1),
(88, 55, 3571090000148, 1),
(89, 56, 7622210449283, 1),
(90, 56, 3175680091680, 1),
(91, 56, 3571090000148, 1),
(92, 56, 3017620425035, 1),
(93, 57, 5449000214911, 1),
(94, 58, 5449000214911, 1),
(95, 58, 3228882010053, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ValeursDefautReappro`
--

CREATE TABLE `ValeursDefautReappro` (
  `id_valeur_reappro_defaut` bigint(20) UNSIGNED NOT NULL,
  `id_article` bigint(20) UNSIGNED NOT NULL,
  `seuil_alerte` decimal(10,3) NOT NULL DEFAULT 10.000,
  `volume` decimal(10,3) NOT NULL DEFAULT 50.000,
  `frequence_valeur` int(10) NOT NULL DEFAULT 7,
  `frequence_unite` enum('jour','semaine','mois') NOT NULL DEFAULT 'semaine'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `ValeursDefautReappro`
--

INSERT INTO `ValeursDefautReappro` (`id_valeur_reappro_defaut`, `id_article`, `seuil_alerte`, `volume`, `frequence_valeur`, `frequence_unite`) VALUES
(1, 1, 500.000, 5000.000, 1, 'semaine'),
(2, 2, 500.000, 3000.000, 1, 'semaine'),
(3, 3, 800.000, 7000.000, 5, 'jour'),
(4, 4, 500.000, 5000.000, 1, 'semaine'),
(5, 5, 300.000, 2000.000, 2, 'semaine'),
(6, 6, 0.000, 0.000, 1, 'mois'),
(7, 7, 0.000, 0.000, 1, 'mois'),
(8, 8, 5.000, 20.000, 1, 'semaine'),
(9, 9, 5.000, 20.000, 1, 'semaine'),
(10, 10, 5.000, 15.000, 1, 'semaine'),
(11, 11, 3.000, 12.000, 2, 'semaine'),
(12, 12, 3.000, 12.000, 2, 'semaine'),
(13, 13, 3.000, 12.000, 2, 'semaine'),
(14, 14, 8.000, 24.000, 5, 'jour'),
(15, 15, 8.000, 24.000, 5, 'jour'),
(16, 16, 7.000, 18.000, 1, 'semaine'),
(17, 17, 10.000, 30.000, 5, 'jour'),
(18, 18, 6.000, 18.000, 1, 'semaine'),
(19, 19, 2.000, 10.000, 1, 'jour'),
(20, 20, 2.000, 5.000, 1, 'semaine'),
(21, 21, 5.000, 20.000, 1, 'semaine'),
(22, 22, 3.000, 10.000, 2, 'semaine'),
(23, 23, 2.000, 6.000, 1, 'mois'),
(24, 24, 1.000, 4.000, 1, 'mois'),
(25, 25, 2.000, 6.000, 1, 'mois'),
(26, 26, 3.000, 10.000, 2, 'semaine'),
(27, 27, 3.000, 10.000, 2, 'semaine'),
(28, 28, 3.000, 15.000, 5, 'jour'),
(29, 29, 4.000, 15.000, 5, 'jour'),
(30, 30, 6.000, 20.000, 5, 'jour');

-- --------------------------------------------------------

--
-- Structure de la table `ValidationJournee`
--

CREATE TABLE `ValidationJournee` (
  `id_journee_validee` bigint(20) UNSIGNED NOT NULL,
  `date_jour` date NOT NULL,
  `est_valide` tinyint(1) NOT NULL,
  `date_validation` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `Article`
--
ALTER TABLE `Article`
  ADD PRIMARY KEY (`id_article`),
  ADD UNIQUE KEY `id_article` (`id_article`);

--
-- Index pour la table `BonusCCE`
--
ALTER TABLE `BonusCCE`
  ADD PRIMARY KEY (`id_bonus`);

--
-- Index pour la table `Carburant`
--
ALTER TABLE `Carburant`
  ADD PRIMARY KEY (`id_carburant`),
  ADD UNIQUE KEY `id_carburant` (`id_carburant`),
  ADD KEY `id_energie` (`id_energie`);

--
-- Index pour la table `CarteCE`
--
ALTER TABLE `CarteCE`
  ADD PRIMARY KEY (`id_carte_CE`),
  ADD UNIQUE KEY `id_carte_CE` (`id_carte_CE`),
  ADD KEY `id_client` (`id_client`);

--
-- Index pour la table `Client`
--
ALTER TABLE `Client`
  ADD PRIMARY KEY (`id_client`),
  ADD UNIQUE KEY `id_client` (`id_client`),
  ADD UNIQUE KEY `uk_client_email` (`email`),
  ADD UNIQUE KEY `uk_client_num_tel` (`num_tel`);

--
-- Index pour la table `Connexion`
--
ALTER TABLE `Connexion`
  ADD PRIMARY KEY (`id_connexion`),
  ADD UNIQUE KEY `identifiant` (`identifiant`);

--
-- Index pour la table `Electricite`
--
ALTER TABLE `Electricite`
  ADD PRIMARY KEY (`id_electricite`),
  ADD UNIQUE KEY `id_electricite` (`id_electricite`),
  ADD KEY `fk_electricite_energie` (`id_energie`);

--
-- Index pour la table `Energie`
--
ALTER TABLE `Energie`
  ADD PRIMARY KEY (`id_energie`),
  ADD UNIQUE KEY `id_energie` (`id_energie`),
  ADD KEY `id_article` (`id_article`);

--
-- Index pour la table `FicheIncident`
--
ALTER TABLE `FicheIncident`
  ADD PRIMARY KEY (`id_ref_unique`);

--
-- Index pour la table `Horaire`
--
ALTER TABLE `Horaire`
  ADD PRIMARY KEY (`id_horaire`),
  ADD KEY `id_jour` (`id_jour`);

--
-- Index pour la table `JourFermeture`
--
ALTER TABLE `JourFermeture`
  ADD PRIMARY KEY (`id_fermeture`);

--
-- Index pour la table `JourSemaine`
--
ALTER TABLE `JourSemaine`
  ADD PRIMARY KEY (`id_jour`);

--
-- Index pour la table `LigneReappro`
--
ALTER TABLE `LigneReappro`
  ADD PRIMARY KEY (`id_reappro`,`id_article`),
  ADD KEY `fk_lr_article` (`id_article`);

--
-- Index pour la table `ParametresCCE`
--
ALTER TABLE `ParametresCCE`
  ADD PRIMARY KEY (`id_parametre`);

--
-- Index pour la table `Pompe`
--
ALTER TABLE `Pompe`
  ADD PRIMARY KEY (`id_pompe`),
  ADD KEY `fk_pompe_transaction_energie` (`id_transaction_energie`);

--
-- Index pour la table `Produit`
--
ALTER TABLE `Produit`
  ADD PRIMARY KEY (`code_barres`),
  ADD UNIQUE KEY `code_barres` (`code_barres`),
  ADD KEY `id_article` (`id_article`);

--
-- Index pour la table `Reapprovisionnement`
--
ALTER TABLE `Reapprovisionnement`
  ADD PRIMARY KEY (`id_reappro`);

--
-- Index pour la table `Recu`
--
ALTER TABLE `Recu`
  ADD PRIMARY KEY (`id_recu`),
  ADD UNIQUE KEY `id_recu` (`id_recu`),
  ADD KEY `id_transaction` (`id_transaction`);

--
-- Index pour la table `Stock`
--
ALTER TABLE `Stock`
  ADD PRIMARY KEY (`id_stock`),
  ADD UNIQUE KEY `id_stock` (`id_stock`),
  ADD KEY `id_article` (`id_article`);

--
-- Index pour la table `Transaction`
--
ALTER TABLE `Transaction`
  ADD PRIMARY KEY (`id_transaction`),
  ADD UNIQUE KEY `id_transaction` (`id_transaction`);

--
-- Index pour la table `TransactionCCE`
--
ALTER TABLE `TransactionCCE`
  ADD PRIMARY KEY (`id_transaction`,`id_carte_CE`),
  ADD KEY `id_carte_CE` (`id_carte_CE`);

--
-- Index pour la table `TransactionEnergie`
--
ALTER TABLE `TransactionEnergie`
  ADD PRIMARY KEY (` id_transaction_energie`),
  ADD UNIQUE KEY ` id_transaction_energie` (` id_transaction_energie`),
  ADD KEY `id_transaction` (`id_transaction`),
  ADD KEY `id_energie` (`id_energie`),
  ADD KEY `fk_te_pompe` (`id_pompe`);

--
-- Index pour la table `TransactionProduit`
--
ALTER TABLE `TransactionProduit`
  ADD PRIMARY KEY (`id_transaction_produit`),
  ADD UNIQUE KEY `id_transaction_produit` (`id_transaction_produit`),
  ADD KEY ` id_transaction` (` id_transaction`),
  ADD KEY `code_barres` (`code_barres`);

--
-- Index pour la table `ValeursDefautReappro`
--
ALTER TABLE `ValeursDefautReappro`
  ADD PRIMARY KEY (`id_valeur_reappro_defaut`),
  ADD UNIQUE KEY `uk_article` (`id_article`);

--
-- Index pour la table `ValidationJournee`
--
ALTER TABLE `ValidationJournee`
  ADD PRIMARY KEY (`id_journee_validee`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `Article`
--
ALTER TABLE `Article`
  MODIFY `id_article` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT pour la table `BonusCCE`
--
ALTER TABLE `BonusCCE`
  MODIFY `id_bonus` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `Carburant`
--
ALTER TABLE `Carburant`
  MODIFY `id_carburant` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `CarteCE`
--
ALTER TABLE `CarteCE`
  MODIFY `id_carte_CE` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `Client`
--
ALTER TABLE `Client`
  MODIFY `id_client` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `Connexion`
--
ALTER TABLE `Connexion`
  MODIFY `id_connexion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `Electricite`
--
ALTER TABLE `Electricite`
  MODIFY `id_electricite` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `Energie`
--
ALTER TABLE `Energie`
  MODIFY `id_energie` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `FicheIncident`
--
ALTER TABLE `FicheIncident`
  MODIFY `id_ref_unique` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `Horaire`
--
ALTER TABLE `Horaire`
  MODIFY `id_horaire` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `JourFermeture`
--
ALTER TABLE `JourFermeture`
  MODIFY `id_fermeture` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `JourSemaine`
--
ALTER TABLE `JourSemaine`
  MODIFY `id_jour` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `ParametresCCE`
--
ALTER TABLE `ParametresCCE`
  MODIFY `id_parametre` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `Pompe`
--
ALTER TABLE `Pompe`
  MODIFY `id_pompe` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT pour la table `Produit`
--
ALTER TABLE `Produit`
  MODIFY `code_barres` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9772102347009;

--
-- AUTO_INCREMENT pour la table `Reapprovisionnement`
--
ALTER TABLE `Reapprovisionnement`
  MODIFY `id_reappro` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `Recu`
--
ALTER TABLE `Recu`
  MODIFY `id_recu` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `Stock`
--
ALTER TABLE `Stock`
  MODIFY `id_stock` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT pour la table `Transaction`
--
ALTER TABLE `Transaction`
  MODIFY `id_transaction` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT pour la table `TransactionEnergie`
--
ALTER TABLE `TransactionEnergie`
  MODIFY ` id_transaction_energie` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT pour la table `TransactionProduit`
--
ALTER TABLE `TransactionProduit`
  MODIFY `id_transaction_produit` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT pour la table `ValeursDefautReappro`
--
ALTER TABLE `ValeursDefautReappro`
  MODIFY `id_valeur_reappro_defaut` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT pour la table `ValidationJournee`
--
ALTER TABLE `ValidationJournee`
  MODIFY `id_journee_validee` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `Carburant`
--
ALTER TABLE `Carburant`
  ADD CONSTRAINT `fk_carburant_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`);

--
-- Contraintes pour la table `CarteCE`
--
ALTER TABLE `CarteCE`
  ADD CONSTRAINT `CarteCE_ibfk_1` FOREIGN KEY (`id_client`) REFERENCES `Client` (`id_client`);

--
-- Contraintes pour la table `Electricite`
--
ALTER TABLE `Electricite`
  ADD CONSTRAINT `fk_electricite_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`);

--
-- Contraintes pour la table `Energie`
--
ALTER TABLE `Energie`
  ADD CONSTRAINT `fk_energie_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

--
-- Contraintes pour la table `Horaire`
--
ALTER TABLE `Horaire`
  ADD CONSTRAINT `Horaire_ibfk_1` FOREIGN KEY (`id_jour`) REFERENCES `JourSemaine` (`id_jour`);

--
-- Contraintes pour la table `LigneReappro`
--
ALTER TABLE `LigneReappro`
  ADD CONSTRAINT `fk_lr_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`),
  ADD CONSTRAINT `fk_lr_reappro` FOREIGN KEY (`id_reappro`) REFERENCES `Reapprovisionnement` (`id_reappro`);

--
-- Contraintes pour la table `Produit`
--
ALTER TABLE `Produit`
  ADD CONSTRAINT `fk_produit_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

--
-- Contraintes pour la table `Recu`
--
ALTER TABLE `Recu`
  ADD CONSTRAINT `fk_recu_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

--
-- Contraintes pour la table `Stock`
--
ALTER TABLE `Stock`
  ADD CONSTRAINT `fk_stock_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);

--
-- Contraintes pour la table `TransactionCCE`
--
ALTER TABLE `TransactionCCE`
  ADD CONSTRAINT `TransactionCCE_ibfk_1` FOREIGN KEY (`id_carte_CE`) REFERENCES `CarteCE` (`id_carte_CE`),
  ADD CONSTRAINT `TransactionCCE_ibfk_2` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

--
-- Contraintes pour la table `TransactionEnergie`
--
ALTER TABLE `TransactionEnergie`
  ADD CONSTRAINT `fk_te_energie` FOREIGN KEY (`id_energie`) REFERENCES `Energie` (`id_energie`),
  ADD CONSTRAINT `fk_te_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

--
-- Contraintes pour la table `TransactionProduit`
--
ALTER TABLE `TransactionProduit`
  ADD CONSTRAINT `fk_tp_produit` FOREIGN KEY (`code_barres`) REFERENCES `Produit` (`code_barres`),
  ADD CONSTRAINT `fk_tp_transaction` FOREIGN KEY (` id_transaction`) REFERENCES `Transaction` (`id_transaction`);

--
-- Contraintes pour la table `ValeursDefautReappro`
--
ALTER TABLE `ValeursDefautReappro`
  ADD CONSTRAINT `fk_vdr_article` FOREIGN KEY (`id_article`) REFERENCES `Article` (`id_article`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
