<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

/**
 * Model CarburantPrix — US12 Modification Prix Carburant + US13 Livraison Minimale
 * Travaille sur la table Carburant (colonnes prix_litre, livraison_min)
 */
class CarburantPrix
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    /**
     * US12 critère 2 / US13 critère 2 :
     * Retourner tous les carburants avec leur prix et leur livraison minimale
     */
    public function getAll(): array
    {
        $stmt = $this->db->prepare(
            'SELECT id_carburant, libelle, prix_litre, livraison_min
             FROM Carburant
             ORDER BY libelle ASC'
        );
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * US12 critère 3 : modifier le prix d'un carburant
     * US13 critère 3 : modifier la livraison minimale d'un carburant
     *
     * @param array $modifications [['id' => int, 'prix_litre' => float, 'livraison_min' => float], ...]
     * @throws \InvalidArgumentException si une valeur est invalide (critère 4)
     */
    public function updateAll(array $modifications): array
    {
        foreach ($modifications as $modif) {
            $id          = (int) ($modif['id'] ?? 0);
            $prixLitre   = $modif['prix_litre']   ?? null;
            $livraisonMin = $modif['livraison_min'] ?? null;

            // US12 critère 4 : "Erreur : Format Price"
            if ($prixLitre !== null) {
                if (!is_numeric($prixLitre) || (float) $prixLitre <= 0) {
                    throw new \InvalidArgumentException('Erreur : Format Price');
                }
            }

            // US13 critère 4 : "Erreur : Format Values"
            if ($livraisonMin !== null) {
                if (!is_numeric($livraisonMin) || (float) $livraisonMin < 0) {
                    throw new \InvalidArgumentException('Erreur : Format Values');
                }
            }

            // US12+US13 critère 3 : mise à jour en base
            $stmt = $this->db->prepare(
                'UPDATE Carburant
                 SET prix_litre    = COALESCE(:prix_litre, prix_litre),
                     livraison_min = COALESCE(:livraison_min, livraison_min)
                 WHERE id_carburant = :id'
            );
            $stmt->execute([
                ':prix_litre'    => $prixLitre   !== null ? (float) $prixLitre   : null,
                ':livraison_min' => $livraisonMin !== null ? (float) $livraisonMin : null,
                ':id'            => $id,
            ]);
        }

        return $this->getAll();
    }
}