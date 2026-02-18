<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Model Recu - US26
 * Gère l'insertion et la récupération des reçus en base de données
 */
class Recu
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    /**
     * Insérer un reçu en base de données
     * Appelé uniquement quand le client/employé confirme l'impression
     *
     * @param int $idTransaction
     * @param int $numCarte  numéro partiel (4 derniers chiffres)
     * @return int|null  l'id_recu généré, ou null en cas d'échec
     */
    public function inserer(int $idTransaction, int $numCarte): ?int
    {
        $sql = "INSERT INTO Recu (id_transaction, num_carte, horodatage)
                VALUES (:id_transaction, :num_carte, NOW())";

        $this->db->execute($sql, [
            'id_transaction' => $idTransaction,
            'num_carte'      => $numCarte,
        ]);

        $id = $this->db->lastInsertId();
        return $id ? (int) $id : null;
    }

    /**
     * Récupérer les infos d'un reçu pour un carburant
     *
     * @param int $idRecu
     * @return array|null
     */
    public function getInfosCarburant(int $idRecu): ?array
    {
        $sql = "SELECT
                    R.id_recu,
                    R.horodatage        AS date_impression,
                    R.num_carte,
                    T.id_transaction,
                    T.date_heure        AS date_transaction,
                    T.prix_total,
                    E.type_energie,
                    Carb.libelle        AS type_carburant,
                    Carb.prix_litre,
                    TE.quantite_delivree
                FROM Recu R
                JOIN Transaction T        ON R.id_transaction  = T.id_transaction
                JOIN TransactionEnergie TE ON T.id_transaction  = TE.id_transaction
                JOIN Energie E            ON TE.id_energie      = E.id_energie
                JOIN Carburant Carb       ON Carb.id_energie    = E.id_energie
                WHERE R.id_recu = :id_recu
                  AND E.type_energie = 'carburant'";

        $stmt = $this->db->query($sql, ['id_recu' => $idRecu]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Récupérer les infos d'un reçu pour une charge électrique
     *
     * @param int $idRecu
     * @return array|null
     */
    public function getInfosElectricite(int $idRecu): ?array
    {
        $sql = "SELECT
                    R.id_recu,
                    R.horodatage        AS date_impression,
                    R.num_carte,
                    T.id_transaction,
                    T.date_heure        AS date_transaction,
                    T.prix_total,
                    E.type_energie,
                    Elec.type_charge,
                    Elec.prix_kwh,
                    TE.temps_charge,
                    TE.quantite_delivree
                FROM Recu R
                JOIN Transaction T        ON R.id_transaction  = T.id_transaction
                JOIN TransactionEnergie TE ON T.id_transaction  = TE.id_transaction
                JOIN Energie E            ON TE.id_energie      = E.id_energie
                JOIN Electricite Elec     ON Elec.id_energie    = E.id_energie
                WHERE R.id_recu = :id_recu
                  AND E.type_energie = 'electricite'";

        $stmt = $this->db->query($sql, ['id_recu' => $idRecu]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }
}