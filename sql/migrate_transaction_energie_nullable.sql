-- Rend TransactionEnergie.id_transaction nullable
-- pour créer la transaction énergie au démarrage
-- puis créer la transaction de paiement lors de l'encaissement.

START TRANSACTION;

ALTER TABLE `TransactionEnergie`
  DROP FOREIGN KEY `fk_te_transaction`;

ALTER TABLE `TransactionEnergie`
  MODIFY `id_transaction` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Renseigné uniquement au paiement';

UPDATE `TransactionEnergie`
SET `id_transaction` = NULL
WHERE `statut` = 'en_cours';

ALTER TABLE `TransactionEnergie`
  ADD CONSTRAINT `fk_te_transaction`
    FOREIGN KEY (`id_transaction`) REFERENCES `Transaction` (`id_transaction`);

COMMIT;
