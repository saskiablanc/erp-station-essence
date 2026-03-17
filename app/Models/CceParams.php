<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

/**
 * Model CceParams — US14 Modification Paramètres CCE
 * Gère ParametresCCE (ligne unique) + BonusCCE (tranches dynamiques)
 */
class CceParams
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    // ── Paramètre global ──────────────────────────────────────

    /**
     * US14 critère 2 : lire le montant minimum actuel
     */
    public function getMontantMin(): array|false
    {
        $stmt = $this->db->prepare(
            'SELECT id_parametre, montant_min FROM ParametresCCE WHERE id_parametre = 1'
        );
        $stmt->execute();
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * US14 critère 3 : modifier le montant minimum
     * @throws \InvalidArgumentException si la valeur est invalide (critère 4/6)
     */
    public function updateMontantMin(float $montantMin): array
    {
        // US14 critère 4 : valeur numérique >= 0
        if ($montantMin < 0) {
            // US14 critère 6 : message exact
            throw new \InvalidArgumentException('Erreur : Format Minimum Montant');
        }

        $stmt = $this->db->prepare(
            'UPDATE ParametresCCE SET montant_min = :montant_min WHERE id_parametre = 1'
        );
        $stmt->execute([':montant_min' => $montantMin]);
        return $this->getMontantMin();
    }

    // ── Bonus (tranches dynamiques) ───────────────────────────

    /**
     * US14 critère 2 : lire toutes les tranches bonus, triées par tranche croissante
     */
    public function getBonusList(): array
    {
        $stmt = $this->db->prepare(
            'SELECT id_bonus, tranche, montant_bonus FROM BonusCCE ORDER BY tranche ASC'
        );
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * US14 critère 2 (ajout) : ajouter une nouvelle tranche de bonus
     * @throws \InvalidArgumentException si les valeurs sont invalides (critère 4/6)
     */
    public function addBonus(float $tranche, float $montantBonus): array
    {
        // US14 critère 4 : valeurs numériques > 0
        if ($tranche <= 0 || $montantBonus < 0) {
            // US14 critère 6
            throw new \InvalidArgumentException('Erreur : Format Bonus');
        }

        $stmt = $this->db->prepare(
            'INSERT INTO BonusCCE (tranche, montant_bonus) VALUES (:tranche, :montant_bonus)'
        );
        $stmt->execute([':tranche' => $tranche, ':montant_bonus' => $montantBonus]);
        return ['id_bonus' => $this->db->lastInsertId(), 'tranche' => $tranche, 'montant_bonus' => $montantBonus];
    }

    /**
     * US14 critère 3 : modifier une tranche bonus existante
     * @throws \InvalidArgumentException si les valeurs sont invalides (critère 4/6)
     */
    public function updateBonus(int $idBonus, float $tranche, float $montantBonus): void
    {
        // US14 critère 4
        if ($tranche <= 0 || $montantBonus < 0) {
            // US14 critère 6
            throw new \InvalidArgumentException('Erreur : Format Bonus');
        }

        $stmt = $this->db->prepare(
            'UPDATE BonusCCE SET tranche = :tranche, montant_bonus = :montant_bonus WHERE id_bonus = :id'
        );
        $stmt->execute([':tranche' => $tranche, ':montant_bonus' => $montantBonus, ':id' => $idBonus]);
    }

    /**
     * US14 : supprimer une tranche bonus
     */
    public function deleteBonus(int $idBonus): void
    {
        $stmt = $this->db->prepare('DELETE FROM BonusCCE WHERE id_bonus = :id');
        $stmt->execute([':id' => $idBonus]);
    }
}