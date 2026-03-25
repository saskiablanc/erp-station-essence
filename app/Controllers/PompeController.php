<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Pompe;
use RuntimeException;

/**
 * PompeController
 *
 * Routes :
 *   GET  /json/pompes              → getAll()    — liste toutes les pompes + transaction en cours
 *   POST /json/pompes/{id}/activer → activer($id) — activation manuelle par l'employé
 *   POST /json/pompes/{id}/demarrer → demarrer($id) — simulation de démarrage d'une livraison
 *   POST /json/pompes/{id}/terminer → terminer($id) — simulation de fin de livraison
 *
 * Toutes les routes nécessitent une session authentifiée (requireAuth).
 */
final class PompeController extends Controller
{
    private Pompe $model;

    public function __construct()
    {
        $this->model = new Pompe();
    }

    // ──────────────────────────────────────────────────────────
    //  GET /json/pompes
    // ──────────────────────────────────────────────────────────

    /**
     * Retourne l'état de toutes les pompes + bornes avec leur éventuelle
     * transaction en cours, au format JSON.
     *
     * Réponse 200 :
     * [
     *   {
     *     "id_pompe": 1,
     *     "numero": 1,
     *     "type_pompe": "carburant",
     *     "sous_type": null,
     *     "mode": "manuel",
     *     "statut": "desactivee",
     *     "date_debut": "2026-03-04 14:32:00",
     *     "transaction": {
     *       "id_transaction_energie": 42,
     *       "libelle": "GAZOLE",
     *       "prix_litre": 1.699,
     *       "quantite_delivree": 16.34,
     *       "prix_total": 27.77,
     *       "statut": "en_cours"
     *     }
     *   },
     *   ...
     * ]
     */
    public function getAll(): void
    {
        $this->requireAuth();

        try {
            $pompes = $this->model->getAll();
            $this->json($pompes);
        } catch (RuntimeException $e) {
            $this->jsonError('Erreur lors de la récupération des pompes : ' . $e->getMessage(), 500);
        }
    }

    // ──────────────────────────────────────────────────────────
    //  POST /json/pompes/{id}/activer
    // ──────────────────────────────────────────────────────────

    /**
     * Active manuellement une pompe désactivée.
     * US1 — Critère 3 : "Si la pompe n'est pas activée, il peut la réactiver via un bouton."
     * US1 — Critère 5 : Si déjà active → erreur 409 (le bouton JS est grisé, mais on protège côté serveur)
     *
     * @param string $id  id_pompe passé dans l'URL
     *
     * Réponse 200 : { "id_pompe": 1, "statut": "active", "message": "Pompe 1 activée." }
     * Réponse 409 : { "error": true, "message": "La pompe 1 est déjà active." }
     * Réponse 404 : { "error": true, "message": "Pompe 99 introuvable." }
     */
    public function activer(string $id): void
    {
        $this->requireAuth();

        $idPompe = (int) $id;
        if ($idPompe <= 0) {
            $this->jsonError('Identifiant de pompe invalide.', 400);
        }

        try {
            $result = $this->model->activer($idPompe);
            $this->json([
                'id_pompe' => $result['id_pompe'],
                'statut'   => $result['statut'],
                'message'  => "Pompe $idPompe activée avec succès.",
            ]);
        } catch (RuntimeException $e) {
            // Le code est encodé dans le message via convention (404, 409…)
            $code = $this->_parseErrorCode($e->getMessage());
            $this->jsonError($e->getMessage(), $code);
        }
    }

    // ──────────────────────────────────────────────────────────
    //  POST /json/pompes/{id}/demarrer
    // ──────────────────────────────────────────────────────────

    public function demarrer(string $id): void
    {
        $this->requireAuth();

        $idPompe = (int) $id;
        if ($idPompe <= 0) {
            $this->jsonError('Identifiant de pompe invalide.', 400);
        }

        $body = $this->body();
        $idEnergie = (int) ($body['id_energie'] ?? 0);
        $quantiteDelivree = (float) ($body['quantite_delivree'] ?? 0);
        $tempsCharge = (string) ($body['temps_charge'] ?? '00:00:00');

        try {
            if ($idEnergie <= 0) {
                $idEnergie = $this->model->getRandomEnergieIdForPompe($idPompe);
            }
            if ($quantiteDelivree <= 0) {
                $quantiteDelivree = round(mt_rand(5, 450) / 10, 3);
            }

            $idTransactionEnergie = $this->model->demarrerTransactionEnergie(
                $idPompe,
                $idEnergie,
                $quantiteDelivree,
                $tempsCharge
            );

            $this->json([
                'success' => true,
                'id_pompe' => $idPompe,
                'id_transaction_energie' => $idTransactionEnergie,
                'statut' => 'en_cours',
            ], 201);
        } catch (RuntimeException $e) {
            $code = $e->getCode();
            if ($code < 400 || $code > 599) {
                $code = 400;
            }
            $this->jsonError($e->getMessage(), $code);
        }
    }

    // ──────────────────────────────────────────────────────────
    //  POST /json/pompes/{id}/terminer
    // ──────────────────────────────────────────────────────────

    public function terminer(string $id): void
    {
        $this->requireAuth();

        $idPompe = (int) $id;
        if ($idPompe <= 0) {
            $this->jsonError('Identifiant de pompe invalide.', 400);
        }

        try {
            $this->model->terminerLivraison($idPompe);
            $this->json([
                'success' => true,
                'id_pompe' => $idPompe,
                'statut' => 'desactivee',
            ]);
        } catch (RuntimeException $e) {
            $code = $e->getCode();
            if ($code < 400 || $code > 599) {
                $code = 400;
            }
            $this->jsonError($e->getMessage(), $code);
        }
    }

    // ──────────────────────────────────────────────────────────
    //  POST /json/pompes/{id}/encaisser
    // ──────────────────────────────────────────────────────────

    public function encaisser(string $id): void
    {
        $this->requireAuth();

        $idPompe = (int) $id;
        if ($idPompe <= 0) {
            $this->jsonError('Identifiant de pompe invalide.', 400);
        }

        $body = $this->body();
        $idTransactionEnergie = (int) ($body['id_transaction_energie'] ?? 0);
        if ($idTransactionEnergie <= 0) {
            $this->jsonError('Identifiant de transaction énergie invalide.', 400);
        }
        $idTransaction = isset($body['id_transaction'])
            ? (int) $body['id_transaction']
            : null;
        if ($idTransaction !== null && $idTransaction <= 0) {
            $idTransaction = null;
        }

        try {
            $idTransaction = $this->model->validerPaiement(
                $idPompe,
                $idTransactionEnergie,
                $idTransaction
            );
            $this->json([
                'success' => true,
                'id_pompe' => $idPompe,
                'id_transaction_energie' => $idTransactionEnergie,
                'id_transaction' => $idTransaction,
                'statut' => 'payee',
            ]);
        } catch (RuntimeException $e) {
            $code = $e->getCode();
            if ($code < 400 || $code > 599) {
                $code = 400;
            }
            $this->jsonError($e->getMessage(), $code);
        }
    }

    // ──────────────────────────────────────────────────────────
    //  Helpers privés
    // ──────────────────────────────────────────────────────────

    /**
     * Extrait le code HTTP du message d'exception si présent en suffixe ", NNN".
     * Sinon retourne 400 par défaut.
     */
    private function _parseErrorCode(string $msg): int
    {
        if (preg_match('/,\s*(\d{3})\.?$/', $msg, $m)) {
            return (int) $m[1];
        }
        return 400;
    }
}
