<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;

final class HomeController extends Controller
{
    public function index(): void
    {
        $this->render('home/index', [
            'appName' => defined('APP_NAME') ? APP_NAME : 'Projet 4E',
        ]);
    }
}
