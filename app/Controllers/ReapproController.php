<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Reappro;

final class ReapproController extends Controller
{
    private Reappro $model;

    public function __construct()
    {
        $this->model = new Reappro();
    }

    // US23 — GET /json/reappros(?statut=En+cours)
    public function getAll(): void
    {
        $this->requireGerant();
        try {
            $statut = isset($_GET['statut']) ? trim($_GET['statut']) : null;
            if ($statut === '') $statut = null;
            $this->json($this->model->getAll($statut));
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // US23 — GET /json/reappros/{id}
    public function getById(string $id): void
    {
        $this->requireGerant();
        try {
            $reappro = $this->model->getById((int) $id);
            if (!$reappro) {
                $this->jsonError("Réapprovisionnement #{$id} introuvable", 404);
            }
            $this->json($reappro);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // US23 — POST /json/reappros/{id}/statut
    public function updateStatut(string $id): void
    {
        $this->requireGerant();
        try {
            $body = $this->body();
            $statut = $body['statut'] ?? null;
            if (!$statut) $this->jsonError('Le champ statut est requis');

            $ok = $this->model->updateStatut((int) $id, $statut);
            if (!$ok) $this->jsonError("Impossible de modifier le statut", 400);

            $this->json(['success' => true, 'id_reappro' => (int) $id, 'statut' => $statut]);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // US22 — POST /json/reappros/{id}/annuler
    public function annuler(string $id): void
    {
        $this->requireGerant();
        try {
            $reappro = $this->model->getById((int) $id);
            if (!$reappro) $this->jsonError("Réapprovisionnement #{$id} introuvable", 404);

            if ($reappro['statut_reappro'] === 'Arrivé') {
                $this->jsonError("Impossible d'annuler : livraison déjà réceptionnée", 409);
            }

            $ok = $this->model->annuler((int) $id);
            if (!$ok) $this->jsonError("Impossible d'annuler", 400);

            $this->json(['success' => true, 'id_reappro' => (int) $id, 'statut' => 'Annulé']);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // US21 — POST /json/reappros
    public function creerManuel(): void
    {
        $this->requireGerant();
        try {
            $body = $this->body();
            if (empty($body['lignes'])) $this->jsonError('Au moins un article est requis');

            $idReappro = $this->model->creerManuel($body);
            $reappro = $this->model->getById($idReappro);

            $this->json(['success' => true, 'id_reappro' => $idReappro, 'reappro' => $reappro], 201);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }
    }

    // POST /json/reappros/auto
    public function creerAuto(): void
    {
        $this->requireAuth();
        try {
            $result = $this->model->creerAutomatiqueDepuisSeuils();
            $this->json(['success' => true] + $result);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // US21 — GET /json/reappros/articles
    public function getArticles(): void
    {
        $this->requireGerant();
        try {
            $this->json($this->model->getArticlesDisponibles());
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // US20 — GET /json/reappros/valeurs-defaut
    public function getValeursDefaut(): void
    {
        $this->requireGerant();
        try {
            $this->json($this->model->getValeursDefaut());
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // US20 — POST /json/reappros/valeurs-defaut/{id}
    public function updateValeurDefaut(string $idArticle): void
    {
        $this->requireGerant();
        try {
            $body = $this->body();
            $ok = $this->model->updateValeurDefaut((int) $idArticle, $body);
            if (!$ok) $this->jsonError('Aucune modification effectuée', 400);
            $this->json(['success' => true, 'id_article' => (int) $idArticle]);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // US20 — POST /json/reappros/valeurs-defaut-type
    public function updateValeursDefautType(): void
    {
        $this->requireGerant();
        try {
            $body = $this->body();
            $type = $body['type_article'] ?? null;
            if (!$type) $this->jsonError('Le champ type_article est requis');

            $count = $this->model->updateValeursDefautParType($type, $body);
            $this->json(['success' => true, 'type_article' => $type, 'articles_modifies' => $count]);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }
}
