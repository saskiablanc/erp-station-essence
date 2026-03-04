<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Connexion;

class AuthController extends Controller
{
    private Connexion $model;

    public function __construct()
    {
        $this->model = new Connexion();
    }

    // GET /connexion
    public function showLogin(): void
    {
        // Si déjà connecté : on envoie directement à la caisse
        if (!empty($_SESSION['employe'])) {
            $this->redirect('caisse');
            return;
        }

        $error = $_SESSION['login_error'] ?? null;
        unset($_SESSION['login_error']);

        $this->render('connexion', ['error' => $error]);
    }

    // POST /connexion
    public function login(): void
    {
        $identifiant = trim($_POST['identifiant'] ?? '');
        $mdp         = $_POST['mdp'] ?? '';

        $employe = $this->model->authenticate($identifiant, $mdp);

        if ($employe === null) {
            // Critère 2 : message d'erreur défini dans l'US
            $_SESSION['login_error'] = 'Erreur : Identifiant ou mot de passe incorrect';
            $this->redirect('connexion');
            return;
        }

        // Critère 1 : connexion réussie → session ouverte
        session_regenerate_id(true);
        $_SESSION['employe'] = $employe;

        // Critère 3 : redirection vers la caisse (interface principale)
        $this->redirect('caisse');
    }

    // POST /deconnexion
    public function logout(): void
    {
        if (empty($_SESSION['employe'])) {
            $this->redirect('connexion');
            return;
        }

        // Critère 4 : déconnexion possible à n'importe quel moment
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(
                session_name(), '',
                time() - 3600,
                $p['path'], $p['domain'],
                $p['secure'], $p['httponly']
            );
        }
        session_destroy();

        $this->redirect('connexion');
    }

    // GET /json/auth/session
    public function jsonSession(): void
    {
        if (empty($_SESSION['employe'])) {
            $this->jsonError('Non authentifié', 401);
            return;
        }
        $this->json(['employe' => $_SESSION['employe']]);
    }

    // POST /json/auth/logout
    public function jsonLogout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(
                session_name(), '',
                time() - 3600,
                $p['path'], $p['domain'],
                $p['secure'], $p['httponly']
            );
        }
        session_destroy();
        $this->json(['success' => true]);
    }
}