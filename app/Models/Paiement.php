<?php
declare(strict_types=1);

namespace App\Models;

class Paiement
{
    private string $codeSecret = "1234";
    private int $solde = 150;

    public function verifierPaiement(string $code, int $montant): array
    {
        if ($code !== $this->codeSecret) {
            return [
                "status" => "erreur_code",
                "message" => "Erreur : Code Secret incorrect"
            ];
        }

        if ($montant > $this->solde) {
            return [
                "status" => "solde_insuffisant",
                "message" => "Paiement Refusé : Solde Insuffisant"
            ];
        }

        return [
            "status" => "ok",
            "message" => "Paiement accepté"
        ];
    }
}
