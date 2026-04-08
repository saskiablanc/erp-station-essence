<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;
use RuntimeException;

class Bdd
{
    private Database $db;
    private bool $isArchiveProfile = false;
    private ?string $tpTransactionColumn = null;
    private ?string $tePkColumn = null;

    public function __construct(string $profile = 'courante')
    {
        $this->db = Database::getInstance($profile);
        $this->isArchiveProfile = ($profile === 'archive');
    }

    private function fetch(string $sql, array $p = []): array
    {
        try {
            return $this->db->query($sql, $p)->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    private function rows(string $sql, array $p = []): array
    {
        return ['rows' => $this->fetch($sql, $p)];
    }

    private function quoteIdent(string $identifier): string
    {
        return '`' . str_replace('`', '``', $identifier) . '`';
    }

    private function archiveCutoffCondition(string $dateExpr): string
    {
        if (!$this->isArchiveProfile) {
            return '';
        }
        return " AND {$dateExpr} <= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
    }

    private function archiveCutoffWhere(string $dateExpr): string
    {
        if (!$this->isArchiveProfile) {
            return '';
        }
        return " WHERE {$dateExpr} <= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
    }

    private function detectColumnName(string $table, array $candidates, string $fallback): string
    {
        try {
            $rows = $this->fetch('SHOW COLUMNS FROM ' . $this->quoteIdent($table));
            $names = array_map(
                static fn(array $row): string => (string)($row['Field'] ?? ''),
                $rows
            );
            foreach ($candidates as $candidate) {
                if (in_array($candidate, $names, true)) {
                    return $candidate;
                }
            }
        } catch (\Throwable $e) {
            // fallback on known schema name
        }
        return $fallback;
    }

    private function transactionProduitTransactionColumn(): string
    {
        if ($this->tpTransactionColumn === null) {
            $this->tpTransactionColumn = $this->detectColumnName(
                'TransactionProduit',
                ['id_transaction', ' id_transaction'],
                'id_transaction'
            );
        }
        return $this->tpTransactionColumn;
    }

    private function transactionEnergiePkColumn(): string
    {
        if ($this->tePkColumn === null) {
            $this->tePkColumn = $this->detectColumnName(
                'TransactionEnergie',
                ['id_transaction_energie', ' id_transaction_energie'],
                'id_transaction_energie'
            );
        }
        return $this->tePkColumn;
    }

    // ═══════════════════════════════════════════════════════
    //  Article
    // ═══════════════════════════════════════════════════════
    public function getArticle(?int $year = null): array
    {
        if ($year === null) {
            return $this->rows("SELECT id_article, type_article FROM Article ORDER BY id_article ASC");
        }
        return $this->rows(
            "SELECT a.id_article, a.type_article
             FROM Article a
             WHERE EXISTS (
                    SELECT 1
                    FROM Produit p
                    JOIN TransactionProduit tp ON tp.code_barres = p.code_barres
                    JOIN `Transaction` t ON t.id_transaction = tp." . $this->quoteIdent($this->transactionProduitTransactionColumn()) . "
                    WHERE p.id_article = a.id_article
                      AND YEAR(t.date_heure) = :year_tx_prod" . $this->archiveCutoffCondition('t.date_heure') . "
             )
                OR EXISTS (
                    SELECT 1
                    FROM Energie e
                    JOIN TransactionEnergie te ON te.id_energie = e.id_energie
                    JOIN `Transaction` t ON t.id_transaction = te.id_transaction
                    WHERE e.id_article = a.id_article
                      AND YEAR(t.date_heure) = :year_tx_energy" . $this->archiveCutoffCondition('t.date_heure') . "
                )
                OR EXISTS (
                    SELECT 1
                    FROM LigneReappro lr
                    JOIN Reapprovisionnement r ON r.id_reappro = lr.id_reappro
                    WHERE lr.id_article = a.id_article
                      AND YEAR(r.date_reappro) = :year_reappro
                )
             ORDER BY a.id_article ASC",
            [
                ':year_tx_prod' => $year,
                ':year_tx_energy' => $year,
                ':year_reappro' => $year,
            ]
        );
    }
    public function addArticle(array $d): array
    {
        $type = trim((string)($d['type_article'] ?? ''));
        if ($type === '') throw new RuntimeException('type_article requis');
        $this->db->execute("INSERT INTO Article (type_article) VALUES (:t)", [':t' => $type]);
        return $this->getArticle();
    }
    public function updateArticle(int $id, array $d): array
    {
        $type = trim((string)($d['type_article'] ?? ''));
        if ($type === '') throw new RuntimeException('type_article requis');
        $this->db->execute("UPDATE Article SET type_article=:t WHERE id_article=:id", [':t'=>$type,':id'=>$id]);
        return $this->getArticle();
    }
    public function deleteArticle(int $id): void
    {
        $this->db->execute("DELETE FROM Article WHERE id_article=:id", [':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Produit
    // ═══════════════════════════════════════════════════════
    public function getProduit(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE EXISTS (
                        SELECT 1
                        FROM TransactionProduit tp
                        JOIN `Transaction` t ON t.id_transaction = tp." . $this->quoteIdent($this->transactionProduitTransactionColumn()) . "
                        WHERE tp.code_barres = p.code_barres
                          AND YEAR(t.date_heure) = :year" . $this->archiveCutoffCondition('t.date_heure') . "
                      )";
            $params[':year'] = $year;
        }
        return ['produits' => $this->fetch(
            "SELECT p.code_barres, p.id_article, p.libelle_produit, p.prix
             FROM Produit p
             {$where}
             ORDER BY p.libelle_produit ASC"
            ,
            $params
        )];
    }
    public function addProduit(array $d): array
    {
        $code = trim((string)($d['code_barres'] ?? ''));
        $lib  = trim((string)($d['libelle_produit'] ?? ''));
        $prix = (float)($d['prix'] ?? 0);
        if ($code===''||$lib===''||$prix<=0) throw new RuntimeException('Données invalides');
        if ($this->db->query('SELECT 1 FROM Produit WHERE code_barres=:c LIMIT 1',[':c'=>$code])->fetch())
            throw new RuntimeException('Code-barres déjà existant');
        $this->db->beginTransaction();
        try {
            $this->db->execute("INSERT INTO Article(type_article) VALUES('produit')");
            $idA = (int)$this->db->lastInsertId();
            $this->db->execute("INSERT INTO Produit(code_barres,id_article,libelle_produit,prix) VALUES(:c,:a,:l,:p)",[':c'=>$code,':a'=>$idA,':l'=>$lib,':p'=>$prix]);
            $this->db->execute("INSERT INTO Stock(id_article,quantite_stock,type_quantite) VALUES(:a,0,'unite')",[':a'=>$idA]);
            $this->db->commit();
        } catch(\Throwable $e) { $this->db->rollBack(); throw new RuntimeException($e->getMessage()); }
        return $this->getProduit();
    }
    public function updateProduit(string $code, array $d): array
    {
        $lib  = trim((string)($d['libelle_produit'] ?? ''));
        $prix = (float)($d['prix'] ?? 0);
        if ($lib===''||$prix<=0) throw new RuntimeException('Données invalides');
        $this->db->execute("UPDATE Produit SET libelle_produit=:l,prix=:p WHERE code_barres=:c",[':l'=>$lib,':p'=>$prix,':c'=>$code]);
        return $this->getProduit();
    }
    public function deleteProduit(string $code): void
    {
        $row = $this->db->query('SELECT id_article FROM Produit WHERE code_barres=:c LIMIT 1',[':c'=>$code])->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new RuntimeException('Produit introuvable');
        $idA = (int)$row['id_article'];
        $this->db->beginTransaction();
        try {
            $this->db->execute('DELETE FROM Stock WHERE id_article=:id',[':id'=>$idA]);
            $this->db->execute('DELETE FROM Produit WHERE code_barres=:c',[':c'=>$code]);
            $this->db->execute('DELETE FROM Article WHERE id_article=:id',[':id'=>$idA]);
            $this->db->commit();
        } catch(\Throwable $e) { $this->db->rollBack(); throw new RuntimeException($e->getMessage()); }
    }

    // ═══════════════════════════════════════════════════════
    //  Energie
    // ═══════════════════════════════════════════════════════
    public function getEnergie(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE EXISTS (
                        SELECT 1
                        FROM TransactionEnergie te
                        JOIN `Transaction` t ON t.id_transaction = te.id_transaction
                        WHERE te.id_energie = e.id_energie
                          AND YEAR(t.date_heure) = :year" . $this->archiveCutoffCondition('t.date_heure') . "
                      )";
            $params[':year'] = $year;
        }
        return $this->rows(
            "SELECT e.id_energie, e.id_article, e.type_energie
             FROM Energie e
             {$where}
             ORDER BY e.id_energie ASC",
            $params
        );
    }
    public function addEnergie(array $d): array
    {
        $idA=(int)($d['id_article']??0); $type=trim((string)($d['type_energie']??''));
        if ($idA<=0||$type==='') throw new RuntimeException('Données invalides');
        $this->db->execute("INSERT INTO Energie(id_article,type_energie) VALUES(:a,:t)",[':a'=>$idA,':t'=>$type]);
        return $this->getEnergie();
    }
    public function updateEnergie(int $id, array $d): array
    {
        $type=trim((string)($d['type_energie']??''));
        if ($type==='') throw new RuntimeException('type_energie requis');
        $this->db->execute("UPDATE Energie SET type_energie=:t WHERE id_energie=:id",[':t'=>$type,':id'=>$id]);
        return $this->getEnergie();
    }
    public function deleteEnergie(int $id): void
    {
        $this->db->execute("DELETE FROM Energie WHERE id_energie=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Carburant
    // ═══════════════════════════════════════════════════════
    public function getCarburant(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE EXISTS (
                        SELECT 1
                        FROM TransactionEnergie te
                        JOIN `Transaction` t ON t.id_transaction = te.id_transaction
                        WHERE te.id_energie = c.id_energie
                          AND YEAR(t.date_heure) = :year" . $this->archiveCutoffCondition('t.date_heure') . "
                      )";
            $params[':year'] = $year;
        }
        return $this->rows(
            "SELECT c.id_carburant,
                    c.id_energie,
                    c.libelle,
                    c.prix_litre,
                    c.livraison_min
             FROM Carburant c
             {$where}
             ORDER BY c.libelle ASC"
            ,
            $params
        );
    }
    public function addCarburant(array $d): array
    {
        $idE=(int)($d['id_energie']??0); $lib=trim((string)($d['libelle']??''));
        $prix=(float)($d['prix_litre']??0);
        $lmin=(float)($d['livraison_min']??0);
        if ($idE<=0||$lib===''||$prix<=0) throw new RuntimeException('Données invalides');
        $energie = $this->db->query(
            "SELECT id_article FROM Energie WHERE id_energie = :id LIMIT 1",
            [':id' => $idE]
        )->fetch(PDO::FETCH_ASSOC);
        if (!$energie) throw new RuntimeException('Énergie introuvable');

        $idA = (int)($energie['id_article'] ?? 0);
        if ($idA <= 0) throw new RuntimeException('Article énergie introuvable');

        $this->db->beginTransaction();
        try {
            $this->db->execute(
                "INSERT INTO Carburant(id_energie,libelle,prix_litre,livraison_min)
                 VALUES(:e,:l,:p,:m)",
                [':e'=>$idE,':l'=>$lib,':p'=>$prix,':m'=>$lmin]
            );
            $this->db->execute(
                "INSERT INTO Stock(id_article,quantite_stock,type_quantite)
                 SELECT :a, 0, 'litre'
                 FROM DUAL
                 WHERE NOT EXISTS (
                   SELECT 1 FROM Stock WHERE id_article = :a2 AND type_quantite = 'litre'
                 )",
                [':a' => $idA, ':a2' => $idA]
            );
            $this->db->commit();
        } catch(\Throwable $e) {
            $this->db->rollBack();
            throw new RuntimeException($e->getMessage());
        }
        return $this->getCarburant();
    }
    public function updateCarburant(int $id, array $d): array
    {
        $lib=trim((string)($d['libelle']??'')); $prix=(float)($d['prix_litre']??0);
        $lmin=(float)($d['livraison_min']??0);
        if ($lib===''||$prix<=0) throw new RuntimeException('Données invalides');

        $this->db->execute(
            "UPDATE Carburant
             SET libelle=:l,prix_litre=:p,livraison_min=:m
             WHERE id_carburant=:id",
            [':l'=>$lib,':p'=>$prix,':m'=>$lmin,':id'=>$id]
        );
        return $this->getCarburant();
    }
    public function deleteCarburant(int $id): void
    {
        $this->db->execute("DELETE FROM Carburant WHERE id_carburant=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Electricite — type_charge enum('rapide','lente')
    // ═══════════════════════════════════════════════════════
    public function getElectricite(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE EXISTS (
                        SELECT 1
                        FROM TransactionEnergie te
                        JOIN `Transaction` t ON t.id_transaction = te.id_transaction
                        WHERE te.id_energie = e.id_energie
                          AND YEAR(t.date_heure) = :year" . $this->archiveCutoffCondition('t.date_heure') . "
                      )";
            $params[':year'] = $year;
        }
        return $this->rows(
            "SELECT e.id_electricite,e.id_energie,e.prix_kwh,e.type_charge
             FROM Electricite e
             {$where}
             ORDER BY e.id_electricite ASC",
            $params
        );
    }
    public function addElectricite(array $d): array
    {
        $idE=(int)($d['id_energie']??0); $prix=(float)($d['prix_kwh']??0);
        $type=trim((string)($d['type_charge']??'rapide'));
        if ($idE<=0) throw new RuntimeException('id_energie requis');
        $this->db->execute("INSERT INTO Electricite(id_energie,prix_kwh,type_charge) VALUES(:e,:p,:t)",[':e'=>$idE,':p'=>$prix,':t'=>$type]);
        return $this->getElectricite();
    }
    public function updateElectricite(int $id, array $d): array
    {
        $prix=(float)($d['prix_kwh']??0); $type=trim((string)($d['type_charge']??''));
        $this->db->execute("UPDATE Electricite SET prix_kwh=:p,type_charge=:t WHERE id_electricite=:id",[':p'=>$prix,':t'=>$type,':id'=>$id]);
        return $this->getElectricite();
    }
    public function deleteElectricite(int $id): void
    {
        $this->db->execute("DELETE FROM Electricite WHERE id_electricite=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Stock — type_quantite enum('litre','unite')
    // ═══════════════════════════════════════════════════════
    public function getStock(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE EXISTS (
                        SELECT 1
                        FROM Produit p2
                        JOIN TransactionProduit tp2 ON tp2.code_barres = p2.code_barres
                        JOIN `Transaction` t2 ON t2.id_transaction = tp2." . $this->quoteIdent($this->transactionProduitTransactionColumn()) . "
                        WHERE p2.id_article = s.id_article
                          AND YEAR(t2.date_heure) = :year_tx_prod" . $this->archiveCutoffCondition('t2.date_heure') . "
                      )
                      OR EXISTS (
                        SELECT 1
                        FROM Energie e2
                        JOIN TransactionEnergie te2 ON te2.id_energie = e2.id_energie
                        JOIN `Transaction` t2 ON t2.id_transaction = te2.id_transaction
                        WHERE e2.id_article = s.id_article
                          AND YEAR(t2.date_heure) = :year_tx_energy" . $this->archiveCutoffCondition('t2.date_heure') . "
                      )
                      OR EXISTS (
                        SELECT 1
                        FROM LigneReappro lr2
                        JOIN Reapprovisionnement r2 ON r2.id_reappro = lr2.id_reappro
                        WHERE lr2.id_article = s.id_article
                          AND YEAR(r2.date_reappro) = :year_reappro
                      )";
            $params = [
                ':year_tx_prod' => $year,
                ':year_tx_energy' => $year,
                ':year_reappro' => $year,
            ];
        }
        return $this->rows(
            "SELECT
                s.id_stock,
                s.id_article,
                COALESCE(p.libelle_produit, c.libelle, CONCAT('Article #', s.id_article)) AS nom_article,
                s.quantite_stock,
                s.type_quantite
             FROM Stock s
             LEFT JOIN Article a
               ON a.id_article = s.id_article
             LEFT JOIN Produit p
               ON p.id_article = a.id_article
             LEFT JOIN Energie e
               ON e.id_article = a.id_article
             LEFT JOIN Carburant c
               ON c.id_energie = e.id_energie
             {$where}
             ORDER BY s.id_stock ASC"
            ,
            $params
        );
    }
    public function addStock(array $d): array
    {
        $idA=(int)($d['id_article']??0); $qty=(float)($d['quantite_stock']??0);
        $type=trim((string)($d['type_quantite']??'unite'));
        if ($idA<=0) throw new RuntimeException('id_article requis');
        $this->db->execute("INSERT INTO Stock(id_article,quantite_stock,type_quantite) VALUES(:a,:q,:t)",[':a'=>$idA,':q'=>$qty,':t'=>$type]);
        return $this->getStock();
    }
    public function updateStock(int $id, array $d): array
    {
        $qty=(float)($d['quantite_stock']??0);
        if ($qty<0) throw new RuntimeException('Quantité invalide');
        $this->db->execute("UPDATE Stock SET quantite_stock=:q WHERE id_stock=:id",[':q'=>$qty,':id'=>$id]);
        return $this->getStock();
    }
    public function deleteStock(int $id): void
    {
        $this->db->execute("DELETE FROM Stock WHERE id_stock=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Client
    // ═══════════════════════════════════════════════════════
    public function getClient(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE EXISTS (
                        SELECT 1
                        FROM CarteCE cc
                        JOIN TransactionCCE txc ON txc.id_carte_CE = cc.id_carte_CE
                        JOIN `Transaction` t ON t.id_transaction = txc.id_transaction
                        WHERE cc.id_client = c.id_client
                          AND YEAR(t.date_heure) = :year" . $this->archiveCutoffCondition('t.date_heure') . "
                      )";
            $params[':year'] = $year;
        }
        return ['clients' => $this->fetch(
            "SELECT c.id_client,c.nom,c.prenom,c.email,c.num_tel
             FROM Client c
             {$where}
             ORDER BY c.nom,c.prenom",
            $params
        )];
    }
    public function addClient(array $d): array
    {
        $nom=trim((string)($d['nom']??'')); $prenom=trim((string)($d['prenom']??''));
        $email=trim((string)($d['email']??'')); $tel=trim((string)($d['num_tel']??''));
        if ($nom===''||$prenom===''||$email===''||$tel==='') throw new RuntimeException('Tous les champs requis');
        if (!filter_var($email,FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Email invalide');
        $this->db->execute("INSERT INTO Client(nom,prenom,email,num_tel) VALUES(:n,:p,:e,:t)",[':n'=>$nom,':p'=>$prenom,':e'=>$email,':t'=>$tel]);
        return $this->getClient();
    }
    public function updateClient(int $id, array $d): array
    {
        $nom=trim((string)($d['nom']??'')); $prenom=trim((string)($d['prenom']??''));
        $email=trim((string)($d['email']??'')); $tel=trim((string)($d['num_tel']??''));
        if ($nom===''||$prenom===''||$email===''||$tel==='') throw new RuntimeException('Tous les champs requis');
        if (!filter_var($email,FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Email invalide');
        $this->db->execute("UPDATE Client SET nom=:n,prenom=:p,email=:e,num_tel=:t WHERE id_client=:id",[':n'=>$nom,':p'=>$prenom,':e'=>$email,':t'=>$tel,':id'=>$id]);
        return $this->getClient();
    }
    public function deleteClient(int $id): void
    {
        $this->db->beginTransaction();
        try {
            $this->db->execute('DELETE FROM CarteCE WHERE id_client=:id',[':id'=>$id]);
            $this->db->execute('DELETE FROM Client WHERE id_client=:id',[':id'=>$id]);
            $this->db->commit();
        } catch(\Throwable $e) { $this->db->rollBack(); throw new RuntimeException($e->getMessage()); }
    }

    // ═══════════════════════════════════════════════════════
    //  CarteCE
    // ═══════════════════════════════════════════════════════
    public function getCarteCCE(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE EXISTS (
                        SELECT 1
                        FROM TransactionCCE txc
                        JOIN `Transaction` t ON t.id_transaction = txc.id_transaction
                        WHERE txc.id_carte_CE = cc.id_carte_CE
                          AND YEAR(t.date_heure) = :year_tx" . $this->archiveCutoffCondition('t.date_heure') . "
                      )
                      OR YEAR(cc.date_dernier_apport) = :year_apport";
            $params = [
                ':year_tx' => $year,
                ':year_apport' => $year,
            ];
        }
        return ['cartes' => $this->fetch(
            "SELECT cc.id_carte_CE,c.nom,c.prenom,c.email,
                    CASE
                      WHEN cc.code_secret IS NULL OR cc.code_secret = '' THEN ''
                      ELSE '****'
                    END AS code_secret,
                    cc.solde_client,cc.date_dernier_apport,cc.montant_dernier_apport
             FROM CarteCE cc JOIN Client c ON c.id_client=cc.id_client
             {$where}
             ORDER BY c.nom,c.prenom"
            ,
            $params
        )];
    }
    public function updateCarteCCE(int $id, array $d): array
    {
        $solde=(float)($d['solde_client']??0);
        if ($solde<0) throw new RuntimeException('Solde invalide');
        $this->db->execute("UPDATE CarteCE SET solde_client=:s WHERE id_carte_CE=:id",[':s'=>$solde,':id'=>$id]);
        return $this->getCarteCCE();
    }
    public function deleteCarteCCE(int $id): void
    {
        $this->db->execute("DELETE FROM CarteCE WHERE id_carte_CE=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Connexion
    // ═══════════════════════════════════════════════════════
    public function getConnexion(?int $year = null): array
    {
        unset($year);
        return $this->rows("SELECT id_connexion,identifiant,role FROM Connexion ORDER BY id_connexion ASC");
    }
    public function addConnexion(array $d): array
    {
        $ident=trim((string)($d['identifiant']??'')); $mdp=trim((string)($d['mdp']??''));
        $role=trim((string)($d['role']??'employe'));
        if ($ident===''||$mdp==='') throw new RuntimeException('identifiant et mdp requis');
        $hash=password_hash($mdp,PASSWORD_BCRYPT);
        $this->db->execute("INSERT INTO Connexion(identifiant,mdp,role) VALUES(:i,:m,:r)",[':i'=>$ident,':m'=>$hash,':r'=>$role]);
        return $this->getConnexion();
    }
    public function updateConnexion(int $id, array $d): array
    {
        $ident=trim((string)($d['identifiant']??'')); $role=trim((string)($d['role']??''));
        if ($ident===''||$role==='') throw new RuntimeException('identifiant et role requis');
        $params=[':i'=>$ident,':r'=>$role,':id'=>$id];
        $mdp=trim((string)($d['mdp']??''));
        if ($mdp!=='') {
            $this->db->execute("UPDATE Connexion SET identifiant=:i,mdp=:m,role=:r WHERE id_connexion=:id",array_merge($params,[':m'=>password_hash($mdp,PASSWORD_BCRYPT)]));
        } else {
            $this->db->execute("UPDATE Connexion SET identifiant=:i,role=:r WHERE id_connexion=:id",$params);
        }
        return $this->getConnexion();
    }
    public function deleteConnexion(int $id): void
    {
        $this->db->execute("DELETE FROM Connexion WHERE id_connexion=:id",[':id'=>$id]);
    }

    /**
     * Vérifie si la journée d'une date donnée est verrouillée (validée par le gérant).
     */
    private function isJourneeTxValidee(string $dateJour): bool
    {
        $row = $this->db->query(
            'SELECT est_valide FROM `ValidationTransactions`
             WHERE date_jour = :d ORDER BY id_validation_tx DESC LIMIT 1',
            ['d' => $dateJour]
        )->fetch(\PDO::FETCH_ASSOC);
        return $row && (int)$row['est_valide'] === 1;
    }

    private function isJourneeIncValidee(string $dateJour): bool
    {
        $row = $this->db->query(
            'SELECT est_valide FROM `ValidationIncidents`
             WHERE date_jour = :d ORDER BY id_validation_inc DESC LIMIT 1',
            ['d' => $dateJour]
        )->fetch(\PDO::FETCH_ASSOC);
        return $row && (int)$row['est_valide'] === 1;
    }

    private function guardTransaction(int $id): void
    {
        $row = $this->db->query(
            'SELECT DATE(date_heure) AS jour FROM `Transaction` WHERE id_transaction = :id LIMIT 1',
            ['id' => $id]
        )->fetch(\PDO::FETCH_ASSOC);
        if ($row && $this->isJourneeTxValidee($row['jour'])) {
            throw new RuntimeException('Transactions du ' . $row['jour'] . ' déjà validées — modification impossible');
        }
    }

    private function guardTransactionDate(string $dateTime): void
    {
        $dateTime = trim($dateTime);
        if ($dateTime === '') return;
        $jour = substr($dateTime, 0, 10);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $jour) && $this->isJourneeTxValidee($jour)) {
            throw new RuntimeException('Transactions du ' . $jour . ' déjà validées — modification impossible');
        }
    }

    private function guardTransactionProduit(int $id): void
    {
        $tpColQ = $this->quoteIdent($this->transactionProduitTransactionColumn());
        $row = $this->db->query(
            'SELECT DATE(t.date_heure) AS jour
             FROM TransactionProduit tp
             JOIN `Transaction` t ON t.id_transaction = tp.' . $tpColQ . '
             WHERE tp.id_transaction_produit = :id LIMIT 1',
            ['id' => $id]
        )->fetch(\PDO::FETCH_ASSOC);
        if ($row && $this->isJourneeTxValidee($row['jour'])) {
            throw new RuntimeException('Transactions du ' . $row['jour'] . ' déjà validées — modification impossible');
        }
    }

    private function guardTransactionEnergie(int $id): void
    {
        $pkQ = $this->quoteIdent($this->transactionEnergiePkColumn());
        $row = $this->db->query(
            "SELECT DATE(t.date_heure) AS jour
             FROM TransactionEnergie te
             JOIN `Transaction` t ON t.id_transaction = te.id_transaction
             WHERE te.{$pkQ} = :id LIMIT 1",
            ['id' => $id]
        )->fetch(\PDO::FETCH_ASSOC);
        if ($row && $this->isJourneeTxValidee($row['jour'])) {
            throw new RuntimeException('Transactions du ' . $row['jour'] . ' déjà validées — modification impossible');
        }
    }

    private function guardRecu(int $id): void
    {
        $row = $this->db->query(
            'SELECT DATE(t.date_heure) AS jour
             FROM `Recu` r
             JOIN `Transaction` t ON t.id_transaction = r.id_transaction
             WHERE r.id_recu = :id LIMIT 1',
            ['id' => $id]
        )->fetch(\PDO::FETCH_ASSOC);
        if ($row && $this->isJourneeTxValidee($row['jour'])) {
            throw new RuntimeException('Transactions du ' . $row['jour'] . ' déjà validées — modification impossible');
        }
    }

    private function guardIncident(int $id): void
    {
        $row = $this->db->query(
            'SELECT date_creation AS jour FROM `FicheIncident` WHERE id_ref_unique = :id LIMIT 1',
            ['id' => $id]
        )->fetch(\PDO::FETCH_ASSOC);
        if ($row && $this->isJourneeIncValidee($row['jour'])) {
            throw new RuntimeException('Incidents du ' . $row['jour'] . ' déjà validés — modification impossible');
        }
    }

    // ═══════════════════════════════════════════════════════
    //  Transaction
    // ═══════════════════════════════════════════════════════
    public function getTransaction(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = ' WHERE YEAR(date_heure) = :year' . $this->archiveCutoffCondition('date_heure');
            $params[':year'] = $year;
        } else {
            $where = $this->archiveCutoffWhere('date_heure');
        }
        return $this->rows(
            "SELECT id_transaction,prix_total,date_heure
             FROM `Transaction`{$where}
             ORDER BY id_transaction DESC LIMIT 500",
            $params
        );
    }
    public function addTransaction(array $d): array
    {
        $prix=(float)($d['prix_total']??0);
        $date=trim((string)($d['date_heure']??date('Y-m-d H:i:s')));
        $this->guardTransactionDate($date);
        $this->db->execute("INSERT INTO `Transaction`(prix_total,date_heure) VALUES(:p,:d)",[':p'=>$prix,':d'=>$date]);
        return $this->getTransaction();
    }
    public function updateTransaction(int $id, array $d): array
    {
        $this->guardTransaction($id);
        $prix=(float)($d['prix_total']??0); $date=trim((string)($d['date_heure']??''));
        if ($date==='') throw new RuntimeException('date_heure requise');
        $this->db->execute("UPDATE `Transaction` SET prix_total=:p,date_heure=:d WHERE id_transaction=:id",[':p'=>$prix,':d'=>$date,':id'=>$id]);
        return $this->getTransaction();
    }
    public function deleteTransaction(int $id): void
    {
        $this->guardTransaction($id);
        $pkQ = $this->quoteIdent($this->transactionEnergiePkColumn());
        $tpColQ = $this->quoteIdent($this->transactionProduitTransactionColumn());

        $this->db->beginTransaction();
        try {
            // Libère les pompes pointant vers une transaction énergie de cette transaction.
            $this->db->execute(
                "UPDATE Pompe p
                 JOIN TransactionEnergie te ON te.{$pkQ} = p.id_transaction_energie
                 SET p.id_transaction_energie = NULL
                 WHERE te.id_transaction = :id",
                [':id' => $id]
            );

            // Cascade logique : enfants puis parent.
            $this->db->execute("DELETE FROM `Recu` WHERE id_transaction=:id", [':id' => $id]);
            $this->db->execute("DELETE FROM TransactionCCE WHERE id_transaction=:id", [':id' => $id]);
            $this->db->execute("DELETE FROM TransactionProduit WHERE {$tpColQ}=:id", [':id' => $id]);
            $this->db->execute("DELETE FROM TransactionEnergie WHERE id_transaction=:id", [':id' => $id]);
            $this->db->execute("DELETE FROM `Transaction` WHERE id_transaction=:id", [':id' => $id]);

            $this->db->commit();
        } catch(\Throwable $e) {
            $this->db->rollBack();
            throw new RuntimeException($e->getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════
    //  TransactionCCE — PK composite (id_transaction, id_carte_CE)
    // ═══════════════════════════════════════════════════════
    public function getTransactionCCE(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = ' WHERE YEAR(t.date_heure) = :year' . $this->archiveCutoffCondition('t.date_heure');
            $params[':year'] = $year;
        } else {
            $where = $this->archiveCutoffWhere('t.date_heure');
        }
        return $this->rows(
            "SELECT tx.id_transaction,tx.id_carte_CE
             FROM TransactionCCE tx
             JOIN `Transaction` t ON t.id_transaction = tx.id_transaction
             {$where}
             ORDER BY tx.id_transaction DESC, tx.id_carte_CE DESC
             LIMIT 500",
            $params
        );
    }
    public function addTransactionCCE(array $d): array
    {
        $idT=(int)($d['id_transaction']??0); $idC=(int)($d['id_carte_CE']??0);
        if ($idT<=0||$idC<=0) throw new RuntimeException('Données invalides');
        $this->guardTransaction($idT);
        $this->db->execute("INSERT INTO TransactionCCE(id_transaction,id_carte_CE) VALUES(:t,:c)",[':t'=>$idT,':c'=>$idC]);
        return $this->getTransactionCCE();
    }
    private function parseTransactionCCECompositeId(string $compositeId): array
    {
        $parts = explode('_', trim($compositeId), 2);
        $idT = (int)($parts[0] ?? 0);
        $idC = (int)($parts[1] ?? 0);
        if ($idT <= 0 || $idC <= 0) {
            throw new RuntimeException('Identifiant transaction CCE invalide');
        }
        return [$idT, $idC];
    }
    public function updateTransactionCCE(string $compositeId, array $d): array
    {
        [$idT, $oldIdC] = $this->parseTransactionCCECompositeId($compositeId);
        $idC=(int)($d['id_carte_CE']??0);
        if ($idC<=0) throw new RuntimeException('id_carte_CE invalide');
        $this->guardTransaction($idT);
        $this->db->execute(
            "UPDATE TransactionCCE
             SET id_carte_CE=:new_card
             WHERE id_transaction=:id_tx
               AND id_carte_CE=:old_card",
            [':new_card'=>$idC, ':id_tx'=>$idT, ':old_card'=>$oldIdC]
        );
        return $this->getTransactionCCE();
    }
    public function deleteTransactionCCE(string $compositeId): void
    {
        [$idT, $idC] = $this->parseTransactionCCECompositeId($compositeId);
        $this->guardTransaction($idT);
        $this->db->execute(
            "DELETE FROM TransactionCCE
             WHERE id_transaction=:id_tx
               AND id_carte_CE=:id_card",
            [':id_tx'=>$idT, ':id_card'=>$idC]
        );
    }

    // ═══════════════════════════════════════════════════════
    //  TransactionProduit
    // ═══════════════════════════════════════════════════════
    public function getTransactionProduit(?int $year = null): array
    {
        $tpColQ = $this->quoteIdent($this->transactionProduitTransactionColumn());
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = ' WHERE YEAR(t.date_heure) = :year' . $this->archiveCutoffCondition('t.date_heure');
            $params[':year'] = $year;
        } else {
            $where = $this->archiveCutoffWhere('t.date_heure');
        }
        return $this->rows(
            "SELECT id_transaction_produit,
                    tp.{$tpColQ} AS id_transaction,
                    code_barres,
                    quantite_produit_totale
             FROM TransactionProduit tp
             JOIN `Transaction` t ON t.id_transaction = tp.{$tpColQ}
             {$where}
             ORDER BY tp.{$tpColQ} DESC LIMIT 500",
            $params
        );
    }
    public function addTransactionProduit(array $d): array
    {
        $idT=(int)($d['id_transaction']??0); $cb=trim((string)($d['code_barres']??''));
        $qty=(int)($d['quantite_produit_totale']??0);
        if ($idT<=0||$cb==='') throw new RuntimeException('Données invalides');
        $this->guardTransaction($idT);
        $tpColQ = $this->quoteIdent($this->transactionProduitTransactionColumn());
        $this->db->execute(
            "INSERT INTO TransactionProduit({$tpColQ},code_barres,quantite_produit_totale) VALUES(:t,:c,:q)",
            [':t'=>$idT,':c'=>$cb,':q'=>$qty]
        );
        return $this->getTransactionProduit();
    }
    public function updateTransactionProduit(int $id, array $d): array
    {
        $this->guardTransactionProduit($id);
        $qty=(int)($d['quantite_produit_totale']??0);
        $this->db->execute("UPDATE TransactionProduit SET quantite_produit_totale=:q WHERE id_transaction_produit=:id",[':q'=>$qty,':id'=>$id]);
        return $this->getTransactionProduit();
    }
    public function deleteTransactionProduit(int $id): void
    {
        $this->guardTransactionProduit($id);
        $this->db->execute("DELETE FROM TransactionProduit WHERE id_transaction_produit=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  TransactionEnergie
    //  Colonnes réelles : statut enum('en_cours','payee'), id_pompe
    // ═══════════════════════════════════════════════════════

    public function getTransactionEnergie(?int $year = null): array
    {
        $pkQ = $this->quoteIdent($this->transactionEnergiePkColumn());
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = ' WHERE te.id_transaction IS NOT NULL AND YEAR(t.date_heure) = :year' . $this->archiveCutoffCondition('t.date_heure');
            $params[':year'] = $year;
        } elseif ($this->isArchiveProfile) {
            $where = ' WHERE te.id_transaction IS NOT NULL AND t.date_heure <= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        }
        return $this->rows(
            "SELECT {$pkQ} AS id_transaction_energie,
                    te.id_transaction, te.id_energie, te.quantite_delivree,
                    te.temps_charge, te.statut, te.id_pompe
             FROM TransactionEnergie te
             LEFT JOIN `Transaction` t ON t.id_transaction = te.id_transaction
             {$where}
             ORDER BY {$pkQ} DESC LIMIT 500",
            $params
        );
    }
    public function addTransactionEnergie(array $d): array
    {
        $idT=(int)($d['id_transaction']??0); $idE=(int)($d['id_energie']??0);
        $qty=(float)($d['quantite_delivree']??0); $tps=trim((string)($d['temps_charge']??'00:00:00'));
        $statut=trim((string)($d['statut']??'en_cours'));
        $idP=isset($d['id_pompe'])&&$d['id_pompe']!==''&&$d['id_pompe']!==null?(int)$d['id_pompe']:null;
        if ($idE<=0) throw new RuntimeException('id_energie requis');
        if ($idT > 0) {
            $this->guardTransaction($idT);
        }
        $this->db->execute(
            "INSERT INTO TransactionEnergie(id_transaction,id_energie,quantite_delivree,temps_charge,statut,id_pompe) VALUES(:t,:e,:q,:c,:s,:p)",
            [':t'=>$idT?:null,':e'=>$idE,':q'=>$qty,':c'=>$tps,':s'=>$statut,':p'=>$idP]
        );
        return $this->getTransactionEnergie();
    }
    public function updateTransactionEnergie(int $id, array $d): array
    {
        $this->guardTransactionEnergie($id);
        $pkQ = $this->quoteIdent($this->transactionEnergiePkColumn());
        $qty=(float)($d['quantite_delivree']??0); $tps=trim((string)($d['temps_charge']??''));
        $statut=trim((string)($d['statut']??''));
        $this->db->execute(
            "UPDATE TransactionEnergie SET quantite_delivree=:q,temps_charge=:c,statut=:s WHERE {$pkQ}=:id",
            [':q'=>$qty,':c'=>$tps,':s'=>$statut,':id'=>$id]
        );
        return $this->getTransactionEnergie();
    }
    public function deleteTransactionEnergie(int $id): void
    {
        $this->guardTransactionEnergie($id);
        $pkQ = $this->quoteIdent($this->transactionEnergiePkColumn());
        $this->db->execute("DELETE FROM TransactionEnergie WHERE {$pkQ}=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Recu
    // ═══════════════════════════════════════════════════════
    public function getRecu(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = ' WHERE YEAR(t.date_heure) = :year' . $this->archiveCutoffCondition('t.date_heure');
            $params[':year'] = $year;
        } else {
            $where = $this->archiveCutoffWhere('t.date_heure');
        }
        return $this->rows(
            "SELECT r.id_recu,r.id_transaction,r.num_carte,r.horodatage
             FROM `Recu` r
             JOIN `Transaction` t ON t.id_transaction = r.id_transaction
             {$where}
             ORDER BY r.id_recu DESC LIMIT 500",
            $params
        );
    }
    public function getRecuDetail(int $idRecu): array
    {
        if ($idRecu <= 0) {
            throw new RuntimeException('id_recu invalide');
        }

        $recu = $this->db->query(
            "SELECT r.id_recu,
                    r.id_transaction,
                    r.num_carte,
                    r.horodatage,
                    t.prix_total,
                    t.date_heure
             FROM `Recu` r
             JOIN `Transaction` t ON t.id_transaction = r.id_transaction
             WHERE r.id_recu = :id
             LIMIT 1",
            [':id' => $idRecu]
        )->fetch(PDO::FETCH_ASSOC);

        if (!$recu) {
            throw new RuntimeException('Reçu introuvable');
        }

        $idTransaction = (int)($recu['id_transaction'] ?? 0);
        if ($idTransaction <= 0) {
            throw new RuntimeException('Transaction du reçu introuvable');
        }
        $tpColQ = $this->quoteIdent($this->transactionProduitTransactionColumn());

        $txProduitsRows = $this->db->query(
            "SELECT tp.code_barres,
                    tp.quantite_produit_totale,
                    p.libelle_produit,
                    p.prix
             FROM TransactionProduit tp
             LEFT JOIN Produit p ON p.code_barres = tp.code_barres
             WHERE tp.{$tpColQ} = :id
             ORDER BY tp.id_transaction_produit ASC",
            [':id' => $idTransaction]
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $txEnergiesRows = $this->db->query(
            "SELECT te.id_energie,
                    te.quantite_delivree,
                    te.temps_charge,
                    e.type_energie,
                    c.libelle AS carburant_libelle,
                    c.prix_litre,
                    el.type_charge,
                    el.prix_kwh
             FROM TransactionEnergie te
             LEFT JOIN Energie e ON e.id_energie = te.id_energie
             LEFT JOIN Carburant c ON c.id_energie = te.id_energie
             LEFT JOIN Electricite el ON el.id_energie = te.id_energie
             WHERE te.id_transaction = :id
             ORDER BY te.id_energie ASC",
            [':id' => $idTransaction]
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $txCceRows = $this->db->query(
            'SELECT id_carte_CE
             FROM TransactionCCE
             WHERE id_transaction = :id',
            [':id' => $idTransaction]
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];

        $lines = [];

        foreach ($txProduitsRows as $row) {
            $code = (string)($row['code_barres'] ?? '');
            $quantite = (int)($row['quantite_produit_totale'] ?? 0);
            if ($quantite <= 0) $quantite = 1;
            $prixUnitaire = (float)($row['prix'] ?? 0);
            $montant = $quantite * $prixUnitaire;

            $lines[] = [
                'type'         => 'achat',
                'nature'       => 'produit',
                'label'        => (string)($row['libelle_produit'] ?? ('Produit ' . $code)),
                'detail'       => $quantite . ' x ' . number_format($prixUnitaire, 2, '.', ''),
                'quantite'     => $quantite,
                'prix_unitaire'=> $prixUnitaire,
                'montant'      => $montant,
                'reference'    => $code,
                'vat_rate'     => 5.5,
            ];
        }

        foreach ($txEnergiesRows as $row) {
            $idEnergie = (int)($row['id_energie'] ?? 0);
            $quantite = (float)($row['quantite_delivree'] ?? 0);
            $typeEnergie = strtolower(trim((string)($row['type_energie'] ?? '')));
            $carburantLabel = trim((string)($row['carburant_libelle'] ?? ''));
            $typeCharge = trim((string)($row['type_charge'] ?? ''));
            $tempsCharge = trim((string)($row['temps_charge'] ?? ''));

            $isElectric = ($typeEnergie === 'electricite') || ((float)($row['prix_kwh'] ?? 0) > 0);
            $prixUnitaire = (float)($isElectric ? ($row['prix_kwh'] ?? 0) : ($row['prix_litre'] ?? 0));
            $montant = $quantite * $prixUnitaire;
            $detailCharge = ($tempsCharge !== '' && $tempsCharge !== '00:00:00') ? (' — ' . $tempsCharge) : '';

            if ($isElectric) {
                $label = 'Chargeur' . ($typeCharge !== '' ? (' ' . $typeCharge) : '');
                $detail = number_format($quantite, 3, '.', '') . ' kWh x ' . number_format($prixUnitaire, 2, '.', '') . $detailCharge;
                $nature = 'rechargement_chargeur';
            } else {
                $label = 'Carburant ' . ($carburantLabel !== '' ? $carburantLabel : ('#' . $idEnergie));
                $detail = number_format($quantite, 2, '.', '') . ' L x ' . number_format($prixUnitaire, 2, '.', '') . $detailCharge;
                $nature = 'carburant';
            }

            $lines[] = [
                'type'         => 'achat',
                'nature'       => $nature,
                'label'        => $label,
                'detail'       => $detail,
                'quantite'     => 1,
                'prix_unitaire'=> $prixUnitaire,
                'montant'      => $montant,
                'reference'    => (string)$idEnergie,
                'vat_rate'     => 20.0,
            ];
        }

        $hasCce = count($txCceRows) > 0;

        if (count($lines) === 0 && $hasCce) {
            $totalLigne = (float)($recu['prix_total'] ?? 0);
            $idCarte = (int)($txCceRows[0]['id_carte_CE'] ?? 0);
            $lines[] = [
                'type'         => 'service',
                'nature'       => 'rechargement_cce',
                'label'        => 'Rechargement CCE',
                'detail'       => $idCarte > 0 ? ('Carte #' . $idCarte) : 'Recharge de carte CCE',
                'quantite'     => 1,
                'prix_unitaire'=> $totalLigne,
                'montant'      => $totalLigne,
                'reference'    => '',
                'vat_rate'     => 0.0,
            ];
        }
        if (count($lines) === 0) {
            $totalLigne = (float)($recu['prix_total'] ?? 0);
            $lines[] = [
                'type'         => 'service',
                'nature'       => 'transaction_sans_detail',
                'label'        => 'Transaction sans détail article',
                'detail'       => 'Aucune ligne produit/énergie retrouvée en base',
                'quantite'     => 1,
                'prix_unitaire'=> $totalLigne,
                'montant'      => $totalLigne,
                'reference'    => '',
                'vat_rate'     => 0.0,
            ];
        }

        $totalCalc = 0.0;
        $totalArticles = 0;
        $vatByRate = [];
        foreach ($lines as $line) {
            $lineTotal = (float)($line['montant'] ?? 0);
            $rate = (float)($line['vat_rate'] ?? 0);
            $totalCalc += $lineTotal;
            $totalArticles += (int)($line['quantite'] ?? 0);

            $vat = ($rate > 0)
                ? ($lineTotal - ($lineTotal / (1 + ($rate / 100))))
                : 0.0;
            if (!isset($vatByRate[(string)$rate])) $vatByRate[(string)$rate] = 0.0;
            $vatByRate[(string)$rate] += $vat;
        }

        $totalTransaction = (float)($recu['prix_total'] ?? 0);
        if ($totalTransaction <= 0) $totalTransaction = $totalCalc;

        return [
            'recu' => [
                'id_recu'        => (int)($recu['id_recu'] ?? 0),
                'id_transaction' => $idTransaction,
                'num_carte'      => (int)($recu['num_carte'] ?? 0),
                'horodatage'     => (string)($recu['horodatage'] ?? ''),
            ],
            'transaction' => [
                'id_transaction' => $idTransaction,
                'prix_total'     => $totalTransaction,
                'date_heure'     => (string)($recu['date_heure'] ?? ''),
            ],
            'lines' => $lines,
            'total' => $totalTransaction,
            'paymentLabel' => $hasCce
                ? 'Carte CCE'
                : ((int)($recu['num_carte'] ?? 0) > 0 ? 'Carte bancaire' : 'Espèces'),
            'totalArticles' => $totalArticles,
            'vatByRate' => $vatByRate,
        ];
    }
    public function addRecu(array $d): array
    {
        $idT=(int)($d['id_transaction']??0); $num=(int)($d['num_carte']??0);
        if ($idT<=0) throw new RuntimeException('id_transaction requis');
        $this->guardTransaction($idT);
        $this->db->execute("INSERT INTO `Recu`(id_transaction,num_carte,horodatage) VALUES(:t,:n,NOW())",[':t'=>$idT,':n'=>$num]);
        return $this->getRecu();
    }
    public function updateRecu(int $id, array $d): array
    {
        $this->guardRecu($id);
        $num=(int)($d['num_carte']??0);
        $this->db->execute("UPDATE `Recu` SET num_carte=:n WHERE id_recu=:id",[':n'=>$num,':id'=>$id]);
        return $this->getRecu();
    }
    public function deleteRecu(int $id): void
    {
        $this->guardRecu($id);
        $this->db->execute("DELETE FROM `Recu` WHERE id_recu=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Pompe — colonnes réelles : date_debut, id_transaction_energie
    // ═══════════════════════════════════════════════════════
    public function getPompe(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE EXISTS (
                        SELECT 1
                        FROM TransactionEnergie te
                        JOIN `Transaction` t ON t.id_transaction = te.id_transaction
                        WHERE te.id_pompe = p.id_pompe
                          AND YEAR(t.date_heure) = :year" . $this->archiveCutoffCondition('t.date_heure') . "
                      )";
            $params[':year'] = $year;
        }
        return $this->rows(
            "SELECT p.id_pompe,p.numero,p.type_pompe,p.sous_type,p.mode,p.statut,p.date_debut,p.id_transaction_energie
             FROM Pompe p
             {$where}
             ORDER BY p.type_pompe,p.numero",
            $params
        );
    }
    public function addPompe(array $d): array
    {
        $num=(int)($d['numero']??0); $type=trim((string)($d['type_pompe']??''));
        $sous=trim((string)($d['sous_type']??'')); $mode=trim((string)($d['mode']??'manuel'));
        $stat=trim((string)($d['statut']??'active'));
        if ($num<=0||$type==='') throw new RuntimeException('Données invalides');
        $this->db->execute(
            "INSERT INTO Pompe(numero,type_pompe,sous_type,mode,statut) VALUES(:n,:t,:s,:m,:st)",
            [':n'=>$num,':t'=>$type,':s'=>$sous?:null,':m'=>$mode,':st'=>$stat]
        );
        return $this->getPompe();
    }
    public function updatePompe(int $id, array $d): array
    {
        $num=(int)($d['numero']??0); $type=trim((string)($d['type_pompe']??''));
        $sous=trim((string)($d['sous_type']??'')); $mode=trim((string)($d['mode']??''));
        $stat=trim((string)($d['statut']??''));
        $this->db->execute(
            "UPDATE Pompe SET numero=:n,type_pompe=:t,sous_type=:s,mode=:m,statut=:st WHERE id_pompe=:id",
            [':n'=>$num,':t'=>$type,':s'=>$sous?:null,':m'=>$mode,':st'=>$stat,':id'=>$id]
        );
        return $this->getPompe();
    }
    public function deletePompe(int $id): void
    {
        $this->db->execute("DELETE FROM Pompe WHERE id_pompe=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Reapprovisionnement
    // ═══════════════════════════════════════════════════════
    public function getReappro(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE YEAR(r.date_reappro) = :year_reappro
                       OR (r.date_reappro IS NULL AND YEAR(r.date_souhaitee) = :year_souhaitee)";
            $params = [
                ':year_reappro' => $year,
                ':year_souhaitee' => $year,
            ];
        }
        return $this->rows(
            "SELECT r.id_reappro,r.statut_reappro,r.date_reappro,r.date_souhaitee,r.est_auto
             FROM Reapprovisionnement r
             {$where}
             ORDER BY r.id_reappro DESC
             LIMIT 500",
            $params
        );
    }
    public function addReappro(array $d): array
    {
        $statut=trim((string)($d['statut_reappro']??'En cours'));
        $date=trim((string)($d['date_reappro']??date('Y-m-d')));
        $dsou=trim((string)($d['date_souhaitee']??''))?:null;
        $auto=(int)(bool)($d['est_auto']??0);
        $this->db->execute("INSERT INTO Reapprovisionnement(statut_reappro,date_reappro,date_souhaitee,est_auto) VALUES(:s,:d,:ds,:a)",[':s'=>$statut,':d'=>$date,':ds'=>$dsou,':a'=>$auto]);
        return $this->getReappro();
    }
    public function updateReappro(int $id, array $d): array
    {
        $statut=trim((string)($d['statut_reappro']??''));
        $dsou=trim((string)($d['date_souhaitee']??''))?:null;
        if ($statut==='') throw new RuntimeException('statut requis');
        $this->db->execute("UPDATE Reapprovisionnement SET statut_reappro=:s,date_souhaitee=:ds WHERE id_reappro=:id",[':s'=>$statut,':ds'=>$dsou,':id'=>$id]);
        return $this->getReappro();
    }
    public function deleteReappro(int $id): void
    {
        $this->db->beginTransaction();
        try {
            $this->db->execute("DELETE FROM LigneReappro WHERE id_reappro=:id",[':id'=>$id]);
            $this->db->execute("DELETE FROM Reapprovisionnement WHERE id_reappro=:id",[':id'=>$id]);
            $this->db->commit();
        } catch(\Throwable $e) { $this->db->rollBack(); throw new RuntimeException($e->getMessage()); }
    }

    // ═══════════════════════════════════════════════════════
    //  LigneReappro — PK COMPOSITE (id_reappro, id_article) — PAS d'id auto
    //  Pas d'edit/delete par id unique → on passe id_reappro:id_article
    // ═══════════════════════════════════════════════════════
    public function getLigneReappro(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE YEAR(r.date_reappro) = :year_reappro
                       OR (r.date_reappro IS NULL AND YEAR(r.date_souhaitee) = :year_souhaitee)";
            $params = [
                ':year_reappro' => $year,
                ':year_souhaitee' => $year,
            ];
        }
        return $this->rows(
            "SELECT lr.id_reappro, lr.id_article, lr.quantite, lr.date_arrivee
             FROM LigneReappro lr
             JOIN Reapprovisionnement r ON r.id_reappro = lr.id_reappro
             {$where}
             ORDER BY lr.id_reappro DESC, lr.id_article ASC",
            $params
        );
    }
    public function addLigneReappro(array $d): array
    {
        $idR=(int)($d['id_reappro']??0); $idA=(int)($d['id_article']??0);
        $qty=(float)($d['quantite']??0); $dat=trim((string)($d['date_arrivee']??''))?:null;
        if ($idR<=0||$idA<=0||$qty<=0) throw new RuntimeException('Données invalides');
        $this->db->execute(
            "INSERT INTO LigneReappro(id_reappro,id_article,quantite,date_arrivee) VALUES(:r,:a,:q,:d)",
            [':r'=>$idR,':a'=>$idA,':q'=>$qty,':d'=>$dat]
        );
        return $this->getLigneReappro();
    }
    // id = "idReappro_idArticle"
    public function updateLigneReappro(string $compositeId, array $d): array
    {
        [$idR,$idA] = array_map('intval', explode('_', $compositeId, 2));
        $qty=(float)($d['quantite']??0); $dat=trim((string)($d['date_arrivee']??''))?:null;
        $this->db->execute(
            "UPDATE LigneReappro SET quantite=:q,date_arrivee=:d WHERE id_reappro=:r AND id_article=:a",
            [':q'=>$qty,':d'=>$dat,':r'=>$idR,':a'=>$idA]
        );
        return $this->getLigneReappro();
    }
    public function deleteLigneReappro(string $compositeId): void
    {
        [$idR,$idA] = array_map('intval', explode('_', $compositeId, 2));
        $this->db->execute(
            "DELETE FROM LigneReappro WHERE id_reappro=:r AND id_article=:a",
            [':r'=>$idR,':a'=>$idA]
        );
    }

    // ═══════════════════════════════════════════════════════
    //  ValeursDefautReappro
    // ═══════════════════════════════════════════════════════
    public function getValeursDefaut(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = " WHERE EXISTS (
                        SELECT 1
                        FROM LigneReappro lr
                        JOIN Reapprovisionnement r ON r.id_reappro = lr.id_reappro
                        WHERE lr.id_article = v.id_article
                          AND (
                            YEAR(r.date_reappro) = :year
                            OR (r.date_reappro IS NULL AND YEAR(r.date_souhaitee) = :year_alt)
                          )
                      )";
            $params = [
                ':year' => $year,
                ':year_alt' => $year,
            ];
        }
        return $this->rows(
            "SELECT v.id_valeur_reappro_defaut,v.id_article,v.seuil_alerte,v.volume,v.frequence_valeur,v.frequence_unite
             FROM ValeursDefautReappro v
             {$where}
             ORDER BY v.id_article ASC",
            $params
        );
    }
    public function addValeursDefaut(array $d): array
    {
        $idA=(int)($d['id_article']??0); $seuil=(float)($d['seuil_alerte']??0);
        $vol=(float)($d['volume']??0); $fv=(int)($d['frequence_valeur']??1);
        $fu=trim((string)($d['frequence_unite']??'semaine'));
        if ($idA<=0) throw new RuntimeException('id_article requis');
        $this->db->execute("INSERT INTO ValeursDefautReappro(id_article,seuil_alerte,volume,frequence_valeur,frequence_unite) VALUES(:a,:s,:v,:fv,:fu)",[':a'=>$idA,':s'=>$seuil,':v'=>$vol,':fv'=>$fv,':fu'=>$fu]);
        return $this->getValeursDefaut();
    }
    public function updateValeursDefaut(int $id, array $d): array
    {
        $seuil=(float)($d['seuil_alerte']??0); $vol=(float)($d['volume']??0);
        $fv=(int)($d['frequence_valeur']??1); $fu=trim((string)($d['frequence_unite']??'semaine'));
        $this->db->execute("UPDATE ValeursDefautReappro SET seuil_alerte=:s,volume=:v,frequence_valeur=:fv,frequence_unite=:fu WHERE id_valeur_reappro_defaut=:id",[':s'=>$seuil,':v'=>$vol,':fv'=>$fv,':fu'=>$fu,':id'=>$id]);
        return $this->getValeursDefaut();
    }
    public function deleteValeursDefaut(int $id): void
    {
        $this->db->execute("DELETE FROM ValeursDefautReappro WHERE id_valeur_reappro_defaut=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  FicheIncident
    // ═══════════════════════════════════════════════════════
    public function getFicheIncident(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = ' WHERE YEAR(date_creation) = :year';
            $params[':year'] = $year;
        }
        return $this->rows(
            "SELECT id_ref_unique,date_creation,TIME_FORMAT(heure_creation,'%H:%i:%s') AS heure_creation,type_incident,detail_tech,solution
             FROM FicheIncident
             {$where}
             ORDER BY id_ref_unique DESC",
            $params
        );
    }
    public function addFicheIncident(array $d): array
    {
        $date=trim((string)($d['date_creation']??date('Y-m-d')));
        $heure=trim((string)($d['heure_creation']??date('H:i:s')));
        $type=trim((string)($d['type_incident']??''));
        $det=trim((string)($d['detail_tech']??'')); $sol=trim((string)($d['solution']??''));
        if ($type===''||$det===''||$sol==='') throw new RuntimeException('Champs requis');
        $this->db->execute("INSERT INTO FicheIncident(date_creation,heure_creation,type_incident,detail_tech,solution) VALUES(:d,:h,:t,:dt,:s)",[':d'=>$date,':h'=>$heure,':t'=>$type,':dt'=>$det,':s'=>$sol]);
        return $this->getFicheIncident();
    }
    public function updateFicheIncident(int $id, array $d): array
    {
        $this->guardIncident($id);
        $type=trim((string)($d['type_incident']??'')); $det=trim((string)($d['detail_tech']??'')); $sol=trim((string)($d['solution']??''));
        if ($type===''||$det===''||$sol==='') throw new RuntimeException('Champs requis');
        $this->db->execute("UPDATE FicheIncident SET type_incident=:t,detail_tech=:dt,solution=:s WHERE id_ref_unique=:id",[':t'=>$type,':dt'=>$det,':s'=>$sol,':id'=>$id]);
        return $this->getFicheIncident();
    }
    public function deleteFicheIncident(int $id): void
    {
        $this->guardIncident($id);
        $this->db->execute("DELETE FROM FicheIncident WHERE id_ref_unique=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  JourFermeture
    // ═══════════════════════════════════════════════════════
    public function getJourFermeture(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = ' WHERE YEAR(date_fermeture) = :year';
            $params[':year'] = $year;
        }
        return $this->rows(
            "SELECT id_fermeture,date_fermeture,motif,recurrent
             FROM JourFermeture
             {$where}
             ORDER BY date_fermeture ASC",
            $params
        );
    }
    public function addJourFermeture(array $d): array
    {
        $date=trim((string)($d['date_fermeture']??'')); $motif=trim((string)($d['motif']??''));
        $recurrent=(int)(bool)($d['recurrent'] ?? 0);
        if ($date==='') throw new RuntimeException('date_fermeture requise');
        $this->db->execute(
            "INSERT INTO JourFermeture(date_fermeture,motif,recurrent)
             VALUES(:d,:m,:r)",
            [':d'=>$date,':m'=>$motif,':r'=>$recurrent]
        );
        return $this->getJourFermeture();
    }
    public function updateJourFermeture(int $id, array $d): array
    {
        $date=trim((string)($d['date_fermeture']??'')); $motif=trim((string)($d['motif']??''));
        $recurrent=(int)(bool)($d['recurrent'] ?? 0);
        if ($date==='') throw new RuntimeException('date_fermeture requise');
        $this->db->execute(
            "UPDATE JourFermeture
             SET date_fermeture=:d,motif=:m,recurrent=:r
             WHERE id_fermeture=:id",
            [':d'=>$date,':m'=>$motif,':r'=>$recurrent,':id'=>$id]
        );
        return $this->getJourFermeture();
    }
    public function deleteJourFermeture(int $id): void
    {
        $this->db->execute("DELETE FROM JourFermeture WHERE id_fermeture=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  JourSemaine
    // ═══════════════════════════════════════════════════════
    public function getJourSemaine(?int $year = null): array
    {
        unset($year);
        return $this->rows("SELECT id_jour,libelle FROM JourSemaine ORDER BY id_jour ASC");
    }
    public function addJourSemaine(array $d): array
    {
        $lib=trim((string)($d['libelle']??''));
        if ($lib==='') throw new RuntimeException('libelle requis');
        $this->db->execute("INSERT INTO JourSemaine(libelle) VALUES(:l)",[':l'=>$lib]);
        return $this->getJourSemaine();
    }
    public function updateJourSemaine(int $id, array $d): array
    {
        $lib=trim((string)($d['libelle']??''));
        if ($lib==='') throw new RuntimeException('libelle requis');
        $this->db->execute("UPDATE JourSemaine SET libelle=:l WHERE id_jour=:id",[':l'=>$lib,':id'=>$id]);
        return $this->getJourSemaine();
    }
    public function deleteJourSemaine(int $id): void
    {
        $this->db->execute("DELETE FROM JourSemaine WHERE id_jour=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Horaire
    // ═══════════════════════════════════════════════════════
    public function getHoraire(?int $year = null): array
    {
        unset($year);
        return $this->rows("SELECT id_horaire,id_jour,heure_ouverture,heure_fermeture,est_ferme FROM Horaire ORDER BY id_jour ASC");
    }
    public function addHoraire(array $d): array
    {
        $idJ=(int)($d['id_jour']??0); $ouv=trim((string)($d['heure_ouverture']??'08:00:00'));
        $ferm=trim((string)($d['heure_fermeture']??'20:00:00')); $est=(int)(bool)($d['est_ferme']??0);
        if ($idJ<=0) throw new RuntimeException('id_jour requis');
        $this->db->execute("INSERT INTO Horaire(id_jour,heure_ouverture,heure_fermeture,est_ferme) VALUES(:j,:o,:f,:e)",[':j'=>$idJ,':o'=>$ouv,':f'=>$ferm,':e'=>$est]);
        return $this->getHoraire();
    }
    public function updateHoraire(int $id, array $d): array
    {
        $ouv=trim((string)($d['heure_ouverture']??'')); $ferm=trim((string)($d['heure_fermeture']??''));
        if ($ouv===''||$ferm==='') throw new RuntimeException('Horaires requis');
        $est=(int)(bool)($d['est_ferme']??0);
        $this->db->execute("UPDATE Horaire SET heure_ouverture=:o,heure_fermeture=:f,est_ferme=:e WHERE id_horaire=:id",[':o'=>$ouv,':f'=>$ferm,':e'=>$est,':id'=>$id]);
        return $this->getHoraire();
    }
    public function deleteHoraire(int $id): void
    {
        $this->db->execute("DELETE FROM Horaire WHERE id_horaire=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  ParametresCCE
    // ═══════════════════════════════════════════════════════
    public function getParamsCCE(?int $year = null): array
    {
        if ($year === null) {
            return $this->rows("SELECT id_parametre,montant_min FROM ParametresCCE ORDER BY id_parametre ASC");
        }

        $meta = $this->fetch("SELECT COUNT(*) AS c, COALESCE(MAX(id_parametre),0) AS max_id FROM ParametresCCE");
        $count = (int)($meta[0]['c'] ?? 0);
        $maxId = (int)($meta[0]['max_id'] ?? 0);
        if ($count === 0 || $maxId === 0) {
            return ['rows' => []];
        }

        // Archive: 6 lignes prévues (2021..2026), une ligne par année.
        if ($count >= 6) {
            if ($year <= 2021) {
                $targetId = 1;
            } elseif ($year === 2022) {
                $targetId = 2;
            } elseif ($year === 2023) {
                $targetId = 3;
            } elseif ($year === 2024) {
                $targetId = 4;
            } elseif ($year === 2025) {
                $targetId = 5;
            } else {
                $targetId = 6;
            }
        } else {
            // Base courante: garde le dernier paramètre disponible.
            $targetId = $maxId;
        }

        return $this->rows(
            "SELECT id_parametre,montant_min
             FROM ParametresCCE
             WHERE id_parametre=:id
             ORDER BY id_parametre ASC",
            [':id' => $targetId]
        );
    }
    public function updateParamsCCE(int $id, array $d): array
    {
        $m=(float)($d['montant_min']??0);
        if ($m<0) throw new RuntimeException('Montant invalide');
        $this->db->execute("UPDATE ParametresCCE SET montant_min=:m WHERE id_parametre=:id",[':m'=>$m,':id'=>$id]);
        return $this->getParamsCCE();
    }

    // ═══════════════════════════════════════════════════════
    //  BonusCCE
    // ═══════════════════════════════════════════════════════
    public function getBonusCCE(?int $year = null): array
    {
        if ($year === null) {
            return $this->rows("SELECT id_bonus,tranche,montant_bonus FROM BonusCCE ORDER BY tranche ASC");
        }

        $meta = $this->fetch("SELECT COUNT(*) AS c, COALESCE(MAX(id_bonus),0) AS max_id FROM BonusCCE");
        $count = (int)($meta[0]['c'] ?? 0);
        $maxId = (int)($meta[0]['max_id'] ?? 0);
        if ($count === 0 || $maxId === 0) {
            return ['rows' => []];
        }

        // Archive: 12 lignes prévues (2 bonus x 6 années: 2021..2026).
        if ($count >= 12) {
            if ($year <= 2021) {
                $startId = 1;
            } elseif ($year === 2022) {
                $startId = 3;
            } elseif ($year === 2023) {
                $startId = 5;
            } elseif ($year === 2024) {
                $startId = 7;
            } elseif ($year === 2025) {
                $startId = 9;
            } else {
                $startId = 11;
            }
            $endId = $startId + 1;
        } elseif ($count >= 2) {
            // Base courante: garde les 2 derniers bonus disponibles.
            $startId = max(1, $maxId - 1);
            $endId = $maxId;
        } else {
            $startId = $maxId;
            $endId = $maxId;
        }

        return $this->rows(
            "SELECT id_bonus,tranche,montant_bonus
             FROM BonusCCE
             WHERE id_bonus BETWEEN :start AND :end
             ORDER BY tranche ASC",
            [':start' => $startId, ':end' => $endId]
        );
    }
    public function addBonusCCE(array $d): array
    {
        $t=(float)($d['tranche']??0); $b=(float)($d['montant_bonus']??0);
        if ($t<=0||$b<0) throw new RuntimeException('Valeurs invalides');
        $this->db->execute("INSERT INTO BonusCCE(tranche,montant_bonus) VALUES(:t,:b)",[':t'=>$t,':b'=>$b]);
        return $this->getBonusCCE();
    }
    public function updateBonusCCE(int $id, array $d): array
    {
        $t=(float)($d['tranche']??0); $b=(float)($d['montant_bonus']??0);
        if ($t<=0||$b<0) throw new RuntimeException('Valeurs invalides');
        $this->db->execute("UPDATE BonusCCE SET tranche=:t,montant_bonus=:b WHERE id_bonus=:id",[':t'=>$t,':b'=>$b,':id'=>$id]);
        return $this->getBonusCCE();
    }
    public function deleteBonusCCE(int $id): void
    {
        $this->db->execute("DELETE FROM BonusCCE WHERE id_bonus=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  ValidationTransactions
    // ═══════════════════════════════════════════════════════
    public function getValidationTransactions(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = ' WHERE YEAR(date_jour) = :year';
            $params[':year'] = $year;
        }
        return $this->rows(
            "SELECT id_validation_tx,date_jour,est_valide,date_validation
             FROM ValidationTransactions
             {$where}
             ORDER BY date_jour DESC, id_validation_tx DESC
             LIMIT 500",
            $params
        );
    }
    public function addValidationTransactions(array $d): array
    {
        $dj=trim((string)($d['date_jour']??''));
        if ($dj==='') throw new RuntimeException('date_jour requis');
        $v=(int)(bool)($d['est_valide']??0);
        $dv=trim((string)($d['date_validation']??date('Y-m-d H:i:s')));
        $this->db->execute(
            "INSERT INTO ValidationTransactions(date_jour,est_valide,date_validation)
             VALUES(:dj,:v,:dv)",
            [':dj'=>$dj,':v'=>$v,':dv'=>$dv]
        );
        return $this->getValidationTransactions();
    }
    public function updateValidationTransactions(int $id, array $d): array
    {
        $dj=trim((string)($d['date_jour']??''));
        if ($dj==='') throw new RuntimeException('date_jour requis');
        $v=(int)(bool)($d['est_valide']??0);
        $dv=trim((string)($d['date_validation']??''));
        if ($dv==='') throw new RuntimeException('date_validation requise');
        $this->db->execute(
            "UPDATE ValidationTransactions
             SET date_jour=:dj,est_valide=:v,date_validation=:dv
             WHERE id_validation_tx=:id",
            [':dj'=>$dj,':v'=>$v,':dv'=>$dv,':id'=>$id]
        );
        return $this->getValidationTransactions();
    }
    public function deleteValidationTransactions(int $id): void
    {
        $this->db->execute(
            "DELETE FROM ValidationTransactions WHERE id_validation_tx=:id",
            [':id'=>$id]
        );
    }

    // ═══════════════════════════════════════════════════════
    //  ValidationIncidents
    // ═══════════════════════════════════════════════════════
    public function getValidationIncidents(?int $year = null): array
    {
        $where = '';
        $params = [];
        if ($year !== null) {
            $where = ' WHERE YEAR(date_jour) = :year';
            $params[':year'] = $year;
        }
        return $this->rows(
            "SELECT id_validation_inc,date_jour,est_valide,date_validation
             FROM ValidationIncidents
             {$where}
             ORDER BY date_jour DESC, id_validation_inc DESC
             LIMIT 500",
            $params
        );
    }
    public function addValidationIncidents(array $d): array
    {
        $dj=trim((string)($d['date_jour']??''));
        if ($dj==='') throw new RuntimeException('date_jour requis');
        $v=(int)(bool)($d['est_valide']??0);
        $dv=trim((string)($d['date_validation']??date('Y-m-d H:i:s')));
        $this->db->execute(
            "INSERT INTO ValidationIncidents(date_jour,est_valide,date_validation)
             VALUES(:dj,:v,:dv)",
            [':dj'=>$dj,':v'=>$v,':dv'=>$dv]
        );
        return $this->getValidationIncidents();
    }
    public function updateValidationIncidents(int $id, array $d): array
    {
        $dj=trim((string)($d['date_jour']??''));
        if ($dj==='') throw new RuntimeException('date_jour requis');
        $v=(int)(bool)($d['est_valide']??0);
        $dv=trim((string)($d['date_validation']??''));
        if ($dv==='') throw new RuntimeException('date_validation requise');
        $this->db->execute(
            "UPDATE ValidationIncidents
             SET date_jour=:dj,est_valide=:v,date_validation=:dv
             WHERE id_validation_inc=:id",
            [':dj'=>$dj,':v'=>$v,':dv'=>$dv,':id'=>$id]
        );
        return $this->getValidationIncidents();
    }
    public function deleteValidationIncidents(int $id): void
    {
        $this->db->execute(
            "DELETE FROM ValidationIncidents WHERE id_validation_inc=:id",
            [':id'=>$id]
        );
    }
}
