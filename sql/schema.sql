-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : mer. 04 mars 2026 à 21:51
-- Version du serveur : 11.8.3-MariaDB-0+deb13u1 from Debian
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
-- Structure de la table `Carburant`
--

CREATE TABLE `Carburant` (
  `id_carburant` bigint(20) UNSIGNED NOT NULL,
  `id_energie` bigint(20) UNSIGNED NOT NULL,
  `prix_litre` decimal(10,3) NOT NULL,
  `stock_litre` decimal(10,3) NOT NULL,
  `libelle` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `Carburant`
--

INSERT INTO `Carburant` (`id_carburant`, `id_energie`, `prix_litre`, `stock_litre`, `libelle`) VALUES
(1, 1, 1.799, 4990.500, 'SP95'),
(2, 2, 1.899, 2991.900, 'SP98'),
(3, 3, 1.699, 6912.350, 'GAZOLE'),
(4, 4, 1.759, 4473.600, 'E10'),
(5, 5, 0.999, 1978.750, 'E85');

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
(1, 1, 1234, 150.000, '2026-02-01', 100),
(2, 2, 5678, 50.000, '2026-02-05', 50),
(3, 3, 9999, 500.000, '2026-01-15', 200);

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
(3, 'Durand', 'Pierre', 'pierre.durand@email.com', '698765432');

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
(1, 1, 'carburant', NULL, 'manuel', 'en_cours', '2026-03-04 22:49:38', 12),
(2, 2, 'carburant', NULL, 'manuel', 'active', NULL, NULL),
(3, 3, 'carburant', NULL, 'auto', 'active', NULL, NULL),
(4, 4, 'carburant', NULL, 'auto', 'active', NULL, NULL),
(5, 1, 'electricite', 'rapide', 'auto', 'active', NULL, NULL),
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
(3014760032112, 11, 'Chewing-gum Freedent White 10p', 1, 1.390),
(3017620425035, 8, 'Chips Lay\'s Nature 45g', 1, 1.490),
(3057640257578, 17, 'Eau Evian 50cl', 1, 1.190),
(3175680011800, 12, 'Mentos Fruits 38g', 1, 0.990),
(3175680091680, 23, 'Dégivrant pare-brise 400ml', 1, 4.990),
(3228882010053, 18, 'Café Expresso capsule x1', 1, 0.890),
(3245390214017, 21, 'Briquet BIC classique', 1, 1.990),
(3245390214024, 22, 'Allumettes x40', 1, 0.890),
(3400930006903, 30, 'Croissant pur beurre', 1, 1.490),
(3560070976843, 28, 'Sandwich Jambon-Beurre', 1, 3.990),
(3571090000148, 24, 'Huile moteur 5W40 1L', 1, 9.990),
(3600522118015, 26, 'Gel hydroalcoolique 100ml', 1, 2.490),
(3600524068738, 27, 'Paracétamol 500mg x8', 1, 2.990),
(3760020509015, 29, 'Wrap Poulet-Crudités', 1, 4.290),
(5000112657920, 16, 'Red Bull 250ml', 1, 2.490),
(5000159417891, 13, 'KitKat 2 barres 41.5g', 1, 1.350),
(5000159461121, 9, 'Chips Pringles Original 40g', 1, 1.790),
(5099576088745, 25, 'Chiffons microfibre x3', 1, 3.490),
(5449000131836, 15, 'Coca-Cola Zero 50cl', 1, 2.190),
(5449000214911, 14, 'Coca-Cola 50cl', 1, 2.190),
(7622210449283, 10, 'Barre Céréales BelVita x2', 1, 1.290),
(9771950123005, 19, 'L\'Équipe (journal du jour)', 1, 1.590),
(9772102347008, 20, 'Télé 7 Jours (hebdo)', 1, 2.200);

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
(12, 27.770, '2026-03-04 22:49:38');

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
(12, NULL, 3, 16.340, '00:00:00', 'en_cours', 1);

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
-- Index pour les tables déchargées
--

--
-- Index pour la table `Article`
--
ALTER TABLE `Article`
  ADD PRIMARY KEY (`id_article`),
  ADD UNIQUE KEY `id_article` (`id_article`);

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
  ADD UNIQUE KEY `id_client` (`id_client`);

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
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `Article`
--
ALTER TABLE `Article`
  MODIFY `id_article` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT pour la table `Carburant`
--
ALTER TABLE `Carburant`
  MODIFY `id_carburant` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `CarteCE`
--
ALTER TABLE `CarteCE`
  MODIFY `id_carte_CE` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `Client`
--
ALTER TABLE `Client`
  MODIFY `id_client` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
-- AUTO_INCREMENT pour la table `Recu`
--
ALTER TABLE `Recu`
  MODIFY `id_recu` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `Stock`
--
ALTER TABLE `Stock`
  MODIFY `id_stock` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Transaction`
--
ALTER TABLE `Transaction`
  MODIFY `id_transaction` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `TransactionEnergie`
--
ALTER TABLE `TransactionEnergie`
  MODIFY ` id_transaction_energie` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `TransactionProduit`
--
ALTER TABLE `TransactionProduit`
  MODIFY `id_transaction_produit` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
