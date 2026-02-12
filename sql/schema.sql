-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost
-- Généré le : mer. 11 fév. 2026 à 10:34
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

-- --------------------------------------------------------

--
-- Structure de la table `Energie`
--

CREATE TABLE `Energie` (
  `id_energie` bigint(20) UNSIGNED NOT NULL,
  `id_article` bigint(20) UNSIGNED NOT NULL,
  `type_energie` enum('carburant','electricite') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

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

-- --------------------------------------------------------

--
-- Structure de la table `TransactionEnergie`
--

CREATE TABLE `TransactionEnergie` (
  `id_transaction_energie` bigint(20) UNSIGNED NOT NULL,
  `id_transaction` bigint(20) UNSIGNED NOT NULL,
  `id_energie` bigint(20) UNSIGNED NOT NULL,
  `quantite_delivree` decimal(10,3) NOT NULL,
  `temps_charge` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `TransactionProduit`
--

CREATE TABLE `TransactionProduit` (
  `id_transaction_produit` bigint(20) UNSIGNED NOT NULL,
  `id_transaction` bigint(20) UNSIGNED NOT NULL,
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
  ADD PRIMARY KEY (`id_transaction_energie`),
  ADD UNIQUE KEY `id_transaction_energie` (`id_transaction_energie`),
  ADD KEY `id_transaction` (`id_transaction`),
  ADD KEY `id_energie` (`id_energie`);

--
-- Index pour la table `TransactionProduit`
--
ALTER TABLE `TransactionProduit`
  ADD PRIMARY KEY (`id_transaction_produit`),
  ADD UNIQUE KEY `id_transaction_produit` (`id_transaction_produit`),
  ADD KEY `id_transaction` (`id_transaction`),
  ADD KEY `code_barres` (`code_barres`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `Article`
--
ALTER TABLE `Article`
  MODIFY `id_article` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Carburant`
--
ALTER TABLE `Carburant`
  MODIFY `id_carburant` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `CarteCE`
--
ALTER TABLE `CarteCE`
  MODIFY `id_carte_CE` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Client`
--
ALTER TABLE `Client`
  MODIFY `id_client` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Electricite`
--
ALTER TABLE `Electricite`
  MODIFY `id_electricite` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Energie`
--
ALTER TABLE `Energie`
  MODIFY `id_energie` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Produit`
--
ALTER TABLE `Produit`
  MODIFY `code_barres` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Recu`
--
ALTER TABLE `Recu`
  MODIFY `id_recu` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Stock`
--
ALTER TABLE `Stock`
  MODIFY `id_stock` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Transaction`
--
ALTER TABLE `Transaction`
  MODIFY `id_transaction` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `TransactionEnergie`
--
ALTER TABLE `TransactionEnergie`
  MODIFY `id_transaction_energie` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

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
  ADD CONSTRAINT `fk_tp_transaction` FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;