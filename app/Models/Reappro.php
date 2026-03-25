<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

class Reappro
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    // ═══════════════════════════════════════════════════════
    //  US23 — Consultation état réapprovisionnements
    // ═══════════════════════════════════════════════════════

    /**
     * Liste tous les réapprovisionnements avec leurs lignes
     * Filtrable par statut
     */
    public function getAll(?string $statut = null): array
    {
        $sql = "
            SELECT
                r.id_reappro,
                r.statut_reappro,
                r.date_reappro,
                r.date_souhaitee,
                r.est_auto
            FROM Reapprovisionnement r
        ";
        $params = [];

        if ($statut !== null && $statut !== '') {
            $sql .= " WHERE r.statut_reappro = :statut";
            $params[':statut'] = $statut;
        }

        $sql .= " ORDER BY r.date_reappro DESC, r.id_reappro DESC";

        $stmt = $this->db->query($sql, $params);
        $reappros = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($reappros as &$r) {
            $r['est_auto'] = (bool) $r['est_auto'];
            $r['lignes'] = $this->getLignes((int) $r['id_reappro']);
        }

        return $reappros;
    }

    /**
     * Détail d'un réapprovisionnement par ID
     */
    public function getById(int $id): ?array
    {
        $stmt = $this->db->query(
            "SELECT * FROM Reapprovisionnement WHERE id_reappro = :id LIMIT 1",
            [':id' => $id]
        );
        $r = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$r) return null;

        $r['est_auto'] = (bool) $r['est_auto'];
        $r['lignes'] = $this->getLignes((int) $r['id_reappro']);
        return $r;
    }

    /**
     * Lignes de détail d'un réappro avec nom article
     */
    private function getLignes(int $idReappro): array
    {
        $stmt = $this->db->query(
            "SELECT
                lr.id_article,
                lr.quantite,
                lr.date_arrivee,
                a.type_article,
                COALESCE(p.libelle_produit, c.libelle) AS nom_article,
                COALESCE(p.code_barres, NULL) AS code_barres
            FROM LigneReappro lr
            JOIN Article a ON lr.id_article = a.id_article
            LEFT JOIN Produit p ON a.id_article = p.id_article
            LEFT JOIN Energie e ON a.id_article = e.id_article
            LEFT JOIN Carburant c ON e.id_energie = c.id_energie
            WHERE lr.id_reappro = :id
            ORDER BY a.type_article, lr.id_article",
            [':id' => $idReappro]
        );
        $lignes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($lignes as &$l) {
            $l['quantite'] = (float) $l['quantite'];
            if ($l['code_barres'] !== null) {
                $l['code_barres'] = (string) $l['code_barres'];
            }
        }

        return $lignes;
    }

    /**
     * Modifier le statut d'un réappro
     * Seuls "En cours" et "En retard" peuvent passer à "Arrivé"
     * Quand on passe à "Arrivé" : date_arrivee = aujourd'hui + mise à jour stock
     */
    public function updateStatut(int $id, string $nouveauStatut): bool
    {
        $statutsValides = ['En cours', 'En retard', 'Arrivé', 'Annulé'];
        if (!in_array($nouveauStatut, $statutsValides, true)) {
            return false;
        }

        // Vérifier le statut actuel
        $reappro = $this->getById($id);
        if (!$reappro) return false;

        $actuel = $reappro['statut_reappro'];

        // On ne peut modifier que "En cours" ou "En retard"
        if ($actuel !== 'En cours' && $actuel !== 'En retard') {
            return false;
        }

        if ($nouveauStatut === 'Arrivé') {
            return $this->marquerArrive($id, $reappro['lignes']);
        }

        // Autres transitions (ex: En cours → En retard)
        $rows = $this->db->execute(
            "UPDATE Reapprovisionnement
             SET statut_reappro = :statut
             WHERE id_reappro = :id",
            [':statut' => $nouveauStatut, ':id' => $id]
        );
        return $rows > 0;
    }

    /**
     * Marquer un réappro comme arrivé :
     * 1. Statut → Arrivé
     * 2. date_arrivee = CURRENT_DATE sur chaque LigneReappro
     * 3. Stock += quantité pour chaque ligne
     */
    private function marquerArrive(int $id, array $lignes): bool
    {
        $this->db->beginTransaction();
        try {
            // 1. Mettre à jour le statut
            $this->db->execute(
                "UPDATE Reapprovisionnement
                 SET statut_reappro = 'Arrivé'
                 WHERE id_reappro = :id
                   AND statut_reappro IN ('En cours', 'En retard')",
                [':id' => $id]
            );

            // 2. Remplir date_arrivee sur toutes les lignes
            $this->db->execute(
                "UPDATE LigneReappro
                 SET date_arrivee = CURRENT_DATE
                 WHERE id_reappro = :id AND date_arrivee IS NULL",
                [':id' => $id]
            );

            // 3. Mettre à jour le stock pour chaque ligne
            foreach ($lignes as $l) {
                $this->db->execute(
                    "UPDATE Stock
                     SET quantite_stock = quantite_stock + :qty
                     WHERE id_article = :id_article",
                    [':qty' => $l['quantite'], ':id_article' => $l['id_article']]
                );
            }

            $this->db->commit();
            return true;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ═══════════════════════════════════════════════════════
    //  US22 — Annulation réapprovisionnement
    // ═══════════════════════════════════════════════════════

    /**
     * Annuler un réappro — uniquement si En cours ou En retard
     */
    public function annuler(int $id): bool
    {
        $rows = $this->db->execute(
            "UPDATE Reapprovisionnement
             SET statut_reappro = 'Annulé'
             WHERE id_reappro = :id
               AND statut_reappro IN ('En cours', 'En retard')",
            [':id' => $id]
        );
        return $rows > 0;
    }

    // ═══════════════════════════════════════════════════════
    //  US21 — Lancement réapprovisionnement manuel
    // ═══════════════════════════════════════════════════════

    /**
     * Créer un réappro manuel avec lignes
     * $data = ['date_souhaitee' => '2026-...', 'lignes' => [['id_article' => X, 'quantite' => Y], ...]]
     */
    public function creerManuel(array $data): int
    {
        $lignes = $data['lignes'] ?? [];
        if (empty($lignes)) {
            throw new \RuntimeException('Au moins un article requis');
        }

        $dateSouhaitee = $data['date_souhaitee'] ?? null;

        $this->db->beginTransaction();
        try {
            $this->db->execute(
                "INSERT INTO Reapprovisionnement (statut_reappro, date_reappro, date_souhaitee, est_auto)
                 VALUES ('En cours', CURRENT_DATE, :date_souhaitee, 0)",
                [':date_souhaitee' => $dateSouhaitee]
            );
            $idReappro = (int) $this->db->lastInsertId();

            foreach ($lignes as $ligne) {
                $idArticle = (int) ($ligne['id_article'] ?? 0);
                $quantite  = (float) ($ligne['quantite'] ?? 0);

                if ($idArticle <= 0 || $quantite <= 0) {
                    throw new \RuntimeException('Ligne invalide : article et quantité requis');
                }

                $this->db->execute(
                    "INSERT INTO LigneReappro (id_reappro, id_article, quantite, date_arrivee)
                     VALUES (:id_reappro, :id_article, :quantite, NULL)",
                    [
                        ':id_reappro' => $idReappro,
                        ':id_article' => $idArticle,
                        ':quantite'   => $quantite,
                    ]
                );
            }

            $this->db->commit();
            return $idReappro;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Liste des articles disponibles pour un réappro manuel
     * (produits + carburants avec leur nom)
     */
    public function getArticlesDisponibles(): array
    {
        $stmt = $this->db->query(
            "SELECT a.id_article, a.type_article,
                    COALESCE(p.libelle_produit, c.libelle) AS nom_article
             FROM Article a
             LEFT JOIN Produit p ON a.id_article = p.id_article
             LEFT JOIN Energie e ON a.id_article = e.id_article
             LEFT JOIN Carburant c ON e.id_energie = c.id_energie
             WHERE COALESCE(p.libelle_produit, c.libelle) IS NOT NULL
             ORDER BY a.type_article, nom_article"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ═══════════════════════════════════════════════════════
    //  US20 — Valeurs défaut réapprovisionnement
    // ═══════════════════════════════════════════════════════

    /**
     * Récupérer toutes les valeurs par défaut, groupées par type d'article
     */
    public function getValeursDefaut(): array
    {
        $stmt = $this->db->query(
            "SELECT
                vd.id_valeur_reappro_defaut,
                vd.id_article,
                vd.seuil_alerte,
                vd.volume,
                vd.frequence_valeur,
                vd.frequence_unite,
                a.type_article,
                COALESCE(p.libelle_produit, c.libelle) AS nom_article
             FROM ValeursDefautReappro vd
             JOIN Article a ON vd.id_article = a.id_article
             LEFT JOIN Produit p ON a.id_article = p.id_article
             LEFT JOIN Energie e ON a.id_article = e.id_article
             LEFT JOIN Carburant c ON e.id_energie = c.id_energie
             ORDER BY a.type_article, vd.id_article"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as &$r) {
            $r['seuil_alerte']     = (float) $r['seuil_alerte'];
            $r['volume']           = (float) $r['volume'];
            $r['frequence_valeur'] = (int) $r['frequence_valeur'];
        }

        return $rows;
    }

    /**
     * Modifier les valeurs par défaut d'un article
     */
    public function updateValeurDefaut(int $idArticle, array $data): bool
    {
        $fields = [];
        $params = [':id_article' => $idArticle];

        if (isset($data['seuil_alerte'])) {
            $fields[] = "seuil_alerte = :seuil";
            $params[':seuil'] = (float) $data['seuil_alerte'];
        }
        if (isset($data['volume'])) {
            $fields[] = "volume = :volume";
            $params[':volume'] = (float) $data['volume'];
        }
        if (isset($data['frequence_valeur'])) {
            $fields[] = "frequence_valeur = :freq_val";
            $params[':freq_val'] = (int) $data['frequence_valeur'];
        }
        if (isset($data['frequence_unite'])) {
            $unites = ['jour', 'semaine', 'mois'];
            if (!in_array($data['frequence_unite'], $unites, true)) {
                return false;
            }
            $fields[] = "frequence_unite = :freq_unite";
            $params[':freq_unite'] = $data['frequence_unite'];
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE ValeursDefautReappro SET " . implode(', ', $fields)
             . " WHERE id_article = :id_article";

        $rows = $this->db->execute($sql, $params);
        return $rows > 0;
    }

    /**
     * Modifier les valeurs par défaut de tous les articles d'un type
     */
    public function updateValeursDefautParType(string $typeArticle, array $data): int
    {
        $fields = [];
        $params = [':type' => $typeArticle];

        if (isset($data['seuil_alerte'])) {
            $fields[] = "vd.seuil_alerte = :seuil";
            $params[':seuil'] = (float) $data['seuil_alerte'];
        }
        if (isset($data['volume'])) {
            $fields[] = "vd.volume = :volume";
            $params[':volume'] = (float) $data['volume'];
        }
        if (isset($data['frequence_valeur'])) {
            $fields[] = "vd.frequence_valeur = :freq_val";
            $params[':freq_val'] = (int) $data['frequence_valeur'];
        }
        if (isset($data['frequence_unite'])) {
            $unites = ['jour', 'semaine', 'mois'];
            if (!in_array($data['frequence_unite'], $unites, true)) {
                return 0;
            }
            $fields[] = "vd.frequence_unite = :freq_unite";
            $params[':freq_unite'] = $data['frequence_unite'];
        }

        if (empty($fields)) {
            return 0;
        }

        $sql = "UPDATE ValeursDefautReappro vd
                JOIN Article a ON vd.id_article = a.id_article
                SET " . implode(', ', $fields)
             . " WHERE a.type_article = :type";

        return $this->db->execute($sql, $params);
    }
}