<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Article;
use App\Models\Transaction;

class CaisseController extends Controller
{
    public function index(): void
    {
        $emp = $this->requireAuth();
        $this->render('caisse', ['employe' => $emp]);
    }

    // GET /gerant — interface caisse réservée au gérant
    public function gerant(): void
    {
        $emp = $this->requireGerant();
        $this->render('gerant', ['employe' => $emp]);
    }

    public function getArticle(string $code): void
    {
        $this->requireAuth();
        $model   = new Article();
        $article = $model->findByCodeBarres($code);

        if (!$article) {
            $this->jsonError("Article non reconnu : {$code}", 404);
        }
        $this->json($article);
    }

    public function getRandomArticle(): void
    {
        $this->requireAuth();
        $model   = new Article();
        $article = $model->findRandomProduit();

        if (!$article) {
            $this->jsonError('Aucun produit disponible', 404);
        }
        $this->json($article);
    }

    public function creerTransaction(): void
    {
        $this->requireAuth();
        $body    = $this->body();
        $mode    = $body['mode_paiement'] ?? null;
        $lignes  = $body['lignes']        ?? [];

        if (!$mode || empty($lignes)) {
            $this->jsonError('mode_paiement et lignes sont requis');
        }

        $model = new Transaction();
        try {
            $id = $model->creer([
                'mode_paiement' => $mode,
                'lignes'        => $lignes,
            ]);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }

        $this->json(['success' => true, 'id_transaction' => $id], 201);
    }

    public function getTransactions(): void
    {
        $this->requireAuth();
        $model = new Transaction();
        $this->json($model->getAll());
    }

    public function getTransaction(string $id): void
    {
        $this->requireAuth();
        $model = new Transaction();
        $trans = $model->getById((int) $id);

        if (!$trans) {
            $this->jsonError("Transaction #{$id} introuvable", 404);
        }
        $this->json($trans);
    }

    public function annulerTransaction(string $id): void
    {
        $this->requireAuth();
        $model = new Transaction();
        $ok    = $model->annuler((int) $id);

        if (!$ok) {
            $this->jsonError("Impossible d'annuler la transaction #{$id}");
        }
        $this->json(['success' => true]);
    }
}