<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;
use RuntimeException;

class Bdd
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    // ── Helpers ───────────────────────────────────────────
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

    // ═══════════════════════════════════════════════════════
    //  Article
    // ═══════════════════════════════════════════════════════
    public function getArticle(): array
    {
        return $this->rows("SELECT id_article, type_article FROM Article ORDER BY id_article ASC");
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
    public function getProduit(): array
    {
        return ['produits' => $this->fetch(
            "SELECT p.code_barres, p.libelle_produit, p.prix,
                    COALESCE(s.quantite_stock,0) AS quantite_stock
             FROM Produit p
             LEFT JOIN Stock s ON s.id_article=p.id_article AND s.type_quantite='unite'
             ORDER BY p.libelle_produit ASC"
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
            $this->db->execute("INSERT INTO Produit(code_barres,id_article,libelle_produit,quantite_produit,prix) VALUES(:c,:a,:l,0,:p)",[':c'=>$code,':a'=>$idA,':l'=>$lib,':p'=>$prix]);
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
    public function getEnergie(): array
    {
        return $this->rows("SELECT id_energie,id_article,type_energie FROM Energie ORDER BY id_energie ASC");
    }

    public function addEnergie(array $d): array
    {
        $idA  = (int)($d['id_article'] ?? 0);
        $type = trim((string)($d['type_energie'] ?? ''));
        if ($idA<=0||$type==='') throw new RuntimeException('Données invalides');
        $this->db->execute("INSERT INTO Energie(id_article,type_energie) VALUES(:a,:t)",[':a'=>$idA,':t'=>$type]);
        return $this->getEnergie();
    }

    public function updateEnergie(int $id, array $d): array
    {
        $type = trim((string)($d['type_energie'] ?? ''));
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
    public function getCarburant(): array
    {
        return $this->rows("SELECT id_carburant,id_energie,libelle,prix_litre,stock_litre,livraison_min FROM Carburant ORDER BY libelle ASC");
    }

    public function addCarburant(array $d): array
    {
        $idE  = (int)($d['id_energie'] ?? 0);
        $lib  = trim((string)($d['libelle'] ?? ''));
        $prix = (float)($d['prix_litre'] ?? 0);
        $stk  = (float)($d['stock_litre'] ?? 0);
        $lmin = (float)($d['livraison_min'] ?? 0);
        if ($idE<=0||$lib===''||$prix<=0) throw new RuntimeException('Données invalides');
        $this->db->execute("INSERT INTO Carburant(id_energie,libelle,prix_litre,stock_litre,livraison_min) VALUES(:e,:l,:p,:s,:m)",[':e'=>$idE,':l'=>$lib,':p'=>$prix,':s'=>$stk,':m'=>$lmin]);
        return $this->getCarburant();
    }

    public function updateCarburant(int $id, array $d): array
    {
        $lib  = trim((string)($d['libelle'] ?? ''));
        $prix = (float)($d['prix_litre'] ?? 0);
        $stk  = (float)($d['stock_litre'] ?? 0);
        $lmin = (float)($d['livraison_min'] ?? 0);
        if ($lib===''||$prix<=0) throw new RuntimeException('Données invalides');
        $this->db->execute("UPDATE Carburant SET libelle=:l,prix_litre=:p,stock_litre=:s,livraison_min=:m WHERE id_carburant=:id",[':l'=>$lib,':p'=>$prix,':s'=>$stk,':m'=>$lmin,':id'=>$id]);
        return $this->getCarburant();
    }

    public function deleteCarburant(int $id): void
    {
        $this->db->execute("DELETE FROM Carburant WHERE id_carburant=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Electricite
    // ═══════════════════════════════════════════════════════
    public function getElectricite(): array
    {
        return $this->rows("SELECT id_electricite,id_energie,prix_kwh,type_charge FROM Electricite ORDER BY id_electricite ASC");
    }

    public function addElectricite(array $d): array
    {
        $idE  = (int)($d['id_energie'] ?? 0);
        $prix = (float)($d['prix_kwh'] ?? 0);
        $type = trim((string)($d['type_charge'] ?? ''));
        if ($idE<=0) throw new RuntimeException('id_energie requis');
        $this->db->execute("INSERT INTO Electricite(id_energie,prix_kwh,type_charge) VALUES(:e,:p,:t)",[':e'=>$idE,':p'=>$prix,':t'=>$type]);
        return $this->getElectricite();
    }

    public function updateElectricite(int $id, array $d): array
    {
        $prix = (float)($d['prix_kwh'] ?? 0);
        $type = trim((string)($d['type_charge'] ?? ''));
        $this->db->execute("UPDATE Electricite SET prix_kwh=:p,type_charge=:t WHERE id_electricite=:id",[':p'=>$prix,':t'=>$type,':id'=>$id]);
        return $this->getElectricite();
    }

    public function deleteElectricite(int $id): void
    {
        $this->db->execute("DELETE FROM Electricite WHERE id_electricite=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Stock
    // ═══════════════════════════════════════════════════════
    public function getStock(): array
    {
        return $this->rows("SELECT id_stock,id_article,quantite_stock,type_quantite FROM Stock ORDER BY id_stock ASC");
    }

    public function addStock(array $d): array
    {
        $idA  = (int)($d['id_article'] ?? 0);
        $qty  = (float)($d['quantite_stock'] ?? 0);
        $type = trim((string)($d['type_quantite'] ?? 'unite'));
        if ($idA<=0) throw new RuntimeException('id_article requis');
        $this->db->execute("INSERT INTO Stock(id_article,quantite_stock,type_quantite) VALUES(:a,:q,:t)",[':a'=>$idA,':q'=>$qty,':t'=>$type]);
        return $this->getStock();
    }

    public function updateStock(int $id, array $d): array
    {
        $qty = (float)($d['quantite_stock'] ?? 0);
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
    public function getClient(): array
    {
        return ['clients' => $this->fetch("SELECT id_client,nom,prenom,email,num_tel FROM Client ORDER BY nom,prenom")];
    }

    public function addClient(array $d): array
    {
        $nom=$trim1=(string)($d['nom']??''); $nom=trim($nom);
        $prenom=trim((string)($d['prenom']??''));
        $email=trim((string)($d['email']??''));
        $tel=trim((string)($d['num_tel']??''));
        if ($nom===''||$prenom===''||$email===''||$tel==='') throw new RuntimeException('Tous les champs requis');
        if (!filter_var($email,FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Email invalide');
        $this->db->execute("INSERT INTO Client(nom,prenom,email,num_tel) VALUES(:n,:p,:e,:t)",[':n'=>$nom,':p'=>$prenom,':e'=>$email,':t'=>$tel]);
        return $this->getClient();
    }

    public function updateClient(int $id, array $d): array
    {
        $nom=trim((string)($d['nom']??''));
        $prenom=trim((string)($d['prenom']??''));
        $email=trim((string)($d['email']??''));
        $tel=trim((string)($d['num_tel']??''));
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
    public function getCarteCCE(): array
    {
        return ['cartes' => $this->fetch(
            "SELECT cc.id_carte_CE,c.nom,c.prenom,c.email,cc.code_secret,
                    cc.solde_client,cc.date_dernier_apport,cc.montant_dernier_apport
             FROM CarteCE cc JOIN Client c ON c.id_client=cc.id_client
             ORDER BY c.nom,c.prenom"
        )];
    }

    public function updateCarteCCE(int $id, array $d): array
    {
        $solde = (float)($d['solde_client'] ?? 0);
        if ($solde<0) throw new RuntimeException('Solde invalide');
        $this->db->execute("UPDATE CarteCE SET solde_client=:s WHERE id_carte_CE=:id",[':s'=>$solde,':id'=>$id]);
        return $this->getCarteCCE();
    }

    public function deleteCarteCCE(int $id): void
    {
        $this->db->execute("DELETE FROM CarteCE WHERE id_carte_CE=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Connexion (pas de mdp exposé)
    // ═══════════════════════════════════════════════════════
    public function getConnexion(): array
    {
        return $this->rows("SELECT id_connexion,identifiant,role FROM Connexion ORDER BY id_connexion ASC");
    }

    public function addConnexion(array $d): array
    {
        $ident = trim((string)($d['identifiant'] ?? ''));
        $mdp   = trim((string)($d['mdp'] ?? ''));
        $role  = trim((string)($d['role'] ?? 'employe'));
        if ($ident===''||$mdp==='') throw new RuntimeException('identifiant et mdp requis');
        $hash = password_hash($mdp, PASSWORD_BCRYPT);
        $this->db->execute("INSERT INTO Connexion(identifiant,mdp,role) VALUES(:i,:m,:r)",[':i'=>$ident,':m'=>$hash,':r'=>$role]);
        return $this->getConnexion();
    }

    public function updateConnexion(int $id, array $d): array
    {
        $ident = trim((string)($d['identifiant'] ?? ''));
        $role  = trim((string)($d['role'] ?? ''));
        if ($ident===''||$role==='') throw new RuntimeException('identifiant et role requis');
        $params = [':i'=>$ident,':r'=>$role,':id'=>$id];
        $mdp = trim((string)($d['mdp'] ?? ''));
        if ($mdp !== '') {
            $hash = password_hash($mdp, PASSWORD_BCRYPT);
            $this->db->execute("UPDATE Connexion SET identifiant=:i,mdp=:m,role=:r WHERE id_connexion=:id", array_merge($params,[':m'=>$hash]));
        } else {
            $this->db->execute("UPDATE Connexion SET identifiant=:i,role=:r WHERE id_connexion=:id", $params);
        }
        return $this->getConnexion();
    }

    public function deleteConnexion(int $id): void
    {
        $this->db->execute("DELETE FROM Connexion WHERE id_connexion=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Transaction
    // ═══════════════════════════════════════════════════════
    public function getTransaction(): array
    {
        return $this->rows("SELECT id_transaction,prix_total,date_heure FROM `Transaction` ORDER BY id_transaction DESC LIMIT 500");
    }

    public function addTransaction(array $d): array
    {
        $prix = (float)($d['prix_total'] ?? 0);
        $date = trim((string)($d['date_heure'] ?? date('Y-m-d H:i:s')));
        $this->db->execute("INSERT INTO `Transaction`(prix_total,date_heure) VALUES(:p,:d)",[':p'=>$prix,':d'=>$date]);
        return $this->getTransaction();
    }

    public function updateTransaction(int $id, array $d): array
    {
        $prix = (float)($d['prix_total'] ?? 0);
        $date = trim((string)($d['date_heure'] ?? ''));
        if ($date==='') throw new RuntimeException('date_heure requise');
        $this->db->execute("UPDATE `Transaction` SET prix_total=:p,date_heure=:d WHERE id_transaction=:id",[':p'=>$prix,':d'=>$date,':id'=>$id]);
        return $this->getTransaction();
    }

    public function deleteTransaction(int $id): void
    {
        $this->db->execute("DELETE FROM `Transaction` WHERE id_transaction=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  TransactionProduit
    // ═══════════════════════════════════════════════════════
    private function detectTransactionProduitCols(): array
    {
        try {
            $cols = $this->db->query('SHOW COLUMNS FROM TransactionProduit')->fetchAll(PDO::FETCH_ASSOC);
        } catch(\Throwable $e) { return ['pk'=>'id_transaction_produit','qty'=>'quantite_produit_totale']; }
        $fields = array_map(fn($c)=>trim((string)($c['Field']??'')), $cols);
        $pk  = 'id_transaction_produit';
        $qty = 'quantite_produit_totale';
        foreach ($fields as $f) {
            if (stripos($f,'id_transaction_produit')!==false) $pk=$f;
            if (stripos($f,'quantite')!==false) $qty=$f;
        }
        return ['pk'=>$pk,'qty'=>$qty];
    }

    public function getTransactionProduit(): array
    {
        $c   = $this->detectTransactionProduitCols();
        $pkQ = '`'.str_replace('`','``',$c['pk']).'`';
        $qQ  = '`'.str_replace('`','``',$c['qty']).'`';
        return $this->rows("SELECT {$pkQ} AS id_transaction_produit,id_transaction,code_barres,{$qQ} AS quantite_produit_totale FROM TransactionProduit ORDER BY id_transaction DESC LIMIT 500");
    }

    public function addTransactionProduit(array $d): array
    {
        $c   = $this->detectTransactionProduitCols();
        $idT = (int)($d['id_transaction']??0);
        $cb  = trim((string)($d['code_barres']??''));
        $qty = (float)($d['quantite_produit_totale']??0);
        if ($idT<=0||$cb==='') throw new RuntimeException('Données invalides');
        $pkQ = '`'.str_replace('`','``',$c['pk']).'`';
        $qQ  = '`'.str_replace('`','``',$c['qty']).'`';
        $this->db->execute("INSERT INTO TransactionProduit(id_transaction,code_barres,{$qQ}) VALUES(:t,:c,:q)",[':t'=>$idT,':c'=>$cb,':q'=>$qty]);
        return $this->getTransactionProduit();
    }

    public function updateTransactionProduit(int $id, array $d): array
    {
        $c   = $this->detectTransactionProduitCols();
        $qty = (float)($d['quantite_produit_totale']??0);
        $pkQ = '`'.str_replace('`','``',$c['pk']).'`';
        $qQ  = '`'.str_replace('`','``',$c['qty']).'`';
        $this->db->execute("UPDATE TransactionProduit SET {$qQ}=:q WHERE {$pkQ}=:id",[':q'=>$qty,':id'=>$id]);
        return $this->getTransactionProduit();
    }

    public function deleteTransactionProduit(int $id): void
    {
        $c   = $this->detectTransactionProduitCols();
        $pkQ = '`'.str_replace('`','``',$c['pk']).'`';
        $this->db->execute("DELETE FROM TransactionProduit WHERE {$pkQ}=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  TransactionEnergie
    // ═══════════════════════════════════════════════════════
    private function detectTransactionEnergiePk(): string
    {
        try {
            $cols = $this->db->query('SHOW COLUMNS FROM TransactionEnergie')->fetchAll(PDO::FETCH_ASSOC);
        } catch(\Throwable $e) { return 'id_transaction_energie'; }
        foreach ($cols as $col) {
            $f = trim((string)($col['Field']??''));
            if (stripos($f,'id_transaction_energie')!==false) return $f;
        }
        return 'id_transaction_energie';
    }

    public function getTransactionEnergie(): array
    {
        $pk  = $this->detectTransactionEnergiePk();
        $pkQ = '`'.str_replace('`','``',$pk).'`';
        return $this->rows("SELECT {$pkQ} AS id_transaction_energie,id_transaction,id_energie,quantite_delivree,temps_charge FROM TransactionEnergie ORDER BY {$pkQ} DESC LIMIT 500");
    }

    public function addTransactionEnergie(array $d): array
    {
        $idT = (int)($d['id_transaction']??0);
        $idE = (int)($d['id_energie']??0);
        $qty = (float)($d['quantite_delivree']??0);
        $tps = trim((string)($d['temps_charge']??''));
        if ($idT<=0||$idE<=0) throw new RuntimeException('Données invalides');
        $this->db->execute("INSERT INTO TransactionEnergie(id_transaction,id_energie,quantite_delivree,temps_charge) VALUES(:t,:e,:q,:c)",[':t'=>$idT,':e'=>$idE,':q'=>$qty,':c'=>$tps]);
        return $this->getTransactionEnergie();
    }

    public function updateTransactionEnergie(int $id, array $d): array
    {
        $pk  = $this->detectTransactionEnergiePk();
        $pkQ = '`'.str_replace('`','``',$pk).'`';
        $qty = (float)($d['quantite_delivree']??0);
        $tps = trim((string)($d['temps_charge']??''));
        $this->db->execute("UPDATE TransactionEnergie SET quantite_delivree=:q,temps_charge=:c WHERE {$pkQ}=:id",[':q'=>$qty,':c'=>$tps,':id'=>$id]);
        return $this->getTransactionEnergie();
    }

    public function deleteTransactionEnergie(int $id): void
    {
        $pk  = $this->detectTransactionEnergiePk();
        $pkQ = '`'.str_replace('`','``',$pk).'`';
        $this->db->execute("DELETE FROM TransactionEnergie WHERE {$pkQ}=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Recu
    // ═══════════════════════════════════════════════════════
    public function getRecu(): array
    {
        return $this->rows("SELECT id_recu,id_transaction,num_carte,horodatage FROM `Recu` ORDER BY id_recu DESC LIMIT 500");
    }

    public function addRecu(array $d): array
    {
        $idT  = (int)($d['id_transaction']??0);
        $num  = (int)($d['num_carte']??0);
        if ($idT<=0) throw new RuntimeException('id_transaction requis');
        $this->db->execute("INSERT INTO `Recu`(id_transaction,num_carte,horodatage) VALUES(:t,:n,NOW())",[':t'=>$idT,':n'=>$num]);
        return $this->getRecu();
    }

    public function updateRecu(int $id, array $d): array
    {
        $num = (int)($d['num_carte']??0);
        $this->db->execute("UPDATE `Recu` SET num_carte=:n WHERE id_recu=:id",[':n'=>$num,':id'=>$id]);
        return $this->getRecu();
    }

    public function deleteRecu(int $id): void
    {
        $this->db->execute("DELETE FROM `Recu` WHERE id_recu=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Pompe
    // ═══════════════════════════════════════════════════════
    public function getPompe(): array
    {
        return $this->rows("SELECT id_pompe,numero,type_pompe,sous_type,mode,statut FROM Pompe ORDER BY type_pompe,numero");
    }

    public function addPompe(array $d): array
    {
        $num   = (int)($d['numero']??0);
        $type  = trim((string)($d['type_pompe']??''));
        $sous  = trim((string)($d['sous_type']??''));
        $mode  = trim((string)($d['mode']??''));
        $stat  = trim((string)($d['statut']??'libre'));
        if ($num<=0||$type==='') throw new RuntimeException('Données invalides');
        $this->db->execute("INSERT INTO Pompe(numero,type_pompe,sous_type,mode,statut) VALUES(:n,:t,:s,:m,:st)",[':n'=>$num,':t'=>$type,':s'=>$sous,':m'=>$mode,':st'=>$stat]);
        return $this->getPompe();
    }

    public function updatePompe(int $id, array $d): array
    {
        $num  = (int)($d['numero']??0);
        $type = trim((string)($d['type_pompe']??''));
        $sous = trim((string)($d['sous_type']??''));
        $mode = trim((string)($d['mode']??''));
        $stat = trim((string)($d['statut']??''));
        $this->db->execute("UPDATE Pompe SET numero=:n,type_pompe=:t,sous_type=:s,mode=:m,statut=:st WHERE id_pompe=:id",[':n'=>$num,':t'=>$type,':s'=>$sous,':m'=>$mode,':st'=>$stat,':id'=>$id]);
        return $this->getPompe();
    }

    public function deletePompe(int $id): void
    {
        $this->db->execute("DELETE FROM Pompe WHERE id_pompe=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  Reapprovisionnement
    // ═══════════════════════════════════════════════════════
    public function getReappro(): array
    {
        return $this->rows("SELECT id_reappro,statut_reappro,date_reappro,date_souhaitee,est_auto FROM Reapprovisionnement ORDER BY id_reappro DESC LIMIT 500");
    }

    public function addReappro(array $d): array
    {
        $statut = trim((string)($d['statut_reappro']??'En cours'));
        $date   = trim((string)($d['date_reappro']??date('Y-m-d')));
        $dsou   = trim((string)($d['date_souhaitee']??'')) ?: null;
        $auto   = (int)(bool)($d['est_auto']??0);
        $this->db->execute("INSERT INTO Reapprovisionnement(statut_reappro,date_reappro,date_souhaitee,est_auto) VALUES(:s,:d,:ds,:a)",[':s'=>$statut,':d'=>$date,':ds'=>$dsou,':a'=>$auto]);
        return $this->getReappro();
    }

    public function updateReappro(int $id, array $d): array
    {
        $statut = trim((string)($d['statut_reappro']??''));
        $dsou   = trim((string)($d['date_souhaitee']??'')) ?: null;
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
    //  LigneReappro
    // ═══════════════════════════════════════════════════════
    private function detectLigneReapproPk(): string
    {
        try {
            $cols = $this->db->query('SHOW COLUMNS FROM LigneReappro')->fetchAll(PDO::FETCH_ASSOC);
        } catch(\Throwable $e) { return 'id_ligne_reappro'; }
        foreach ($cols as $col) {
            $f = trim((string)($col['Field']??''));
            if (stripos($f,'id_ligne')!==false) return $f;
        }
        return 'id_ligne_reappro';
    }

    public function getLigneReappro(): array
    {
        $pk  = $this->detectLigneReapproPk();
        $pkQ = '`'.str_replace('`','``',$pk).'`';
        return $this->rows("SELECT {$pkQ} AS id_ligne_reappro,id_reappro,id_article,quantite,date_arrivee FROM LigneReappro ORDER BY id_reappro DESC,id_article ASC");
    }

    public function addLigneReappro(array $d): array
    {
        $idR = (int)($d['id_reappro']??0);
        $idA = (int)($d['id_article']??0);
        $qty = (float)($d['quantite']??0);
        $dat = trim((string)($d['date_arrivee']??'')) ?: null;
        if ($idR<=0||$idA<=0||$qty<=0) throw new RuntimeException('Données invalides');
        $this->db->execute("INSERT INTO LigneReappro(id_reappro,id_article,quantite,date_arrivee) VALUES(:r,:a,:q,:d)",[':r'=>$idR,':a'=>$idA,':q'=>$qty,':d'=>$dat]);
        return $this->getLigneReappro();
    }

    public function updateLigneReappro(int $id, array $d): array
    {
        $pk  = $this->detectLigneReapproPk();
        $pkQ = '`'.str_replace('`','``',$pk).'`';
        $qty = (float)($d['quantite']??0);
        $dat = trim((string)($d['date_arrivee']??'')) ?: null;
        $this->db->execute("UPDATE LigneReappro SET quantite=:q,date_arrivee=:d WHERE {$pkQ}=:id",[':q'=>$qty,':d'=>$dat,':id'=>$id]);
        return $this->getLigneReappro();
    }

    public function deleteLigneReappro(int $id): void
    {
        $pk  = $this->detectLigneReapproPk();
        $pkQ = '`'.str_replace('`','``',$pk).'`';
        $this->db->execute("DELETE FROM LigneReappro WHERE {$pkQ}=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  ValeursDefautReappro
    // ═══════════════════════════════════════════════════════
    public function getValeursDefaut(): array
    {
        return $this->rows("SELECT id_valeur_reappro_defaut,id_article,seuil_alerte,volume,frequence_valeur,frequence_unite FROM ValeursDefautReappro ORDER BY id_article ASC");
    }

    public function addValeursDefaut(array $d): array
    {
        $idA  = (int)($d['id_article']??0);
        $seuil= (float)($d['seuil_alerte']??0);
        $vol  = (float)($d['volume']??0);
        $fv   = (int)($d['frequence_valeur']??1);
        $fu   = trim((string)($d['frequence_unite']??'jour'));
        if ($idA<=0) throw new RuntimeException('id_article requis');
        $this->db->execute("INSERT INTO ValeursDefautReappro(id_article,seuil_alerte,volume,frequence_valeur,frequence_unite) VALUES(:a,:s,:v,:fv,:fu)",[':a'=>$idA,':s'=>$seuil,':v'=>$vol,':fv'=>$fv,':fu'=>$fu]);
        return $this->getValeursDefaut();
    }

    public function updateValeursDefaut(int $id, array $d): array
    {
        $seuil= (float)($d['seuil_alerte']??0);
        $vol  = (float)($d['volume']??0);
        $fv   = (int)($d['frequence_valeur']??1);
        $fu   = trim((string)($d['frequence_unite']??'jour'));
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
    public function getFicheIncident(): array
    {
        return $this->rows("SELECT id_ref_unique,date_creation,TIME_FORMAT(heure_creation,'%H:%i:%s') AS heure_creation,type_incident,detail_tech,solution FROM FicheIncident ORDER BY id_ref_unique DESC");
    }

    public function addFicheIncident(array $d): array
    {
        $date  = trim((string)($d['date_creation']??date('Y-m-d')));
        $heure = trim((string)($d['heure_creation']??date('H:i:s')));
        $type  = trim((string)($d['type_incident']??''));
        $det   = trim((string)($d['detail_tech']??''));
        $sol   = trim((string)($d['solution']??''));
        if ($type===''||$det===''||$sol==='') throw new RuntimeException('Champs requis manquants');
        $this->db->execute("INSERT INTO FicheIncident(date_creation,heure_creation,type_incident,detail_tech,solution) VALUES(:d,:h,:t,:dt,:s)",[':d'=>$date,':h'=>$heure,':t'=>$type,':dt'=>$det,':s'=>$sol]);
        return $this->getFicheIncident();
    }

    public function updateFicheIncident(int $id, array $d): array
    {
        $type = trim((string)($d['type_incident']??''));
        $det  = trim((string)($d['detail_tech']??''));
        $sol  = trim((string)($d['solution']??''));
        if ($type===''||$det===''||$sol==='') throw new RuntimeException('Champs requis');
        $this->db->execute("UPDATE FicheIncident SET type_incident=:t,detail_tech=:dt,solution=:s WHERE id_ref_unique=:id",[':t'=>$type,':dt'=>$det,':s'=>$sol,':id'=>$id]);
        return $this->getFicheIncident();
    }

    public function deleteFicheIncident(int $id): void
    {
        $this->db->execute("DELETE FROM FicheIncident WHERE id_ref_unique=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  JourFermeture
    // ═══════════════════════════════════════════════════════
    public function getJourFermeture(): array
    {
        return $this->rows("SELECT id_fermeture,date_fermeture,motif FROM JourFermeture ORDER BY date_fermeture ASC");
    }

    public function addJourFermeture(array $d): array
    {
        $date  = trim((string)($d['date_fermeture']??''));
        $motif = trim((string)($d['motif']??''));
        if ($date==='') throw new RuntimeException('date_fermeture requise');
        $this->db->execute("INSERT INTO JourFermeture(date_fermeture,motif) VALUES(:d,:m)",[':d'=>$date,':m'=>$motif]);
        return $this->getJourFermeture();
    }

    public function updateJourFermeture(int $id, array $d): array
    {
        $date  = trim((string)($d['date_fermeture']??''));
        $motif = trim((string)($d['motif']??''));
        if ($date==='') throw new RuntimeException('date_fermeture requise');
        $this->db->execute("UPDATE JourFermeture SET date_fermeture=:d,motif=:m WHERE id_fermeture=:id",[':d'=>$date,':m'=>$motif,':id'=>$id]);
        return $this->getJourFermeture();
    }

    public function deleteJourFermeture(int $id): void
    {
        $this->db->execute("DELETE FROM JourFermeture WHERE id_fermeture=:id",[':id'=>$id]);
    }

    // ═══════════════════════════════════════════════════════
    //  JourSemaine
    // ═══════════════════════════════════════════════════════
    public function getJourSemaine(): array
    {
        return $this->rows("SELECT id_jour,libelle FROM JourSemaine ORDER BY id_jour ASC");
    }

    public function addJourSemaine(array $d): array
    {
        $lib = trim((string)($d['libelle']??''));
        if ($lib==='') throw new RuntimeException('libelle requis');
        $this->db->execute("INSERT INTO JourSemaine(libelle) VALUES(:l)",[':l'=>$lib]);
        return $this->getJourSemaine();
    }

    public function updateJourSemaine(int $id, array $d): array
    {
        $lib = trim((string)($d['libelle']??''));
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
    public function getHoraire(): array
    {
        return $this->rows("SELECT id_horaire,id_jour,heure_ouverture,heure_fermeture,est_ferme FROM Horaire ORDER BY id_jour ASC");
    }

    public function addHoraire(array $d): array
    {
        $idJ  = (int)($d['id_jour']??0);
        $ouv  = trim((string)($d['heure_ouverture']??'08:00'));
        $ferm = trim((string)($d['heure_fermeture']??'20:00'));
        $est  = (int)(bool)($d['est_ferme']??0);
        if ($idJ<=0) throw new RuntimeException('id_jour requis');
        $this->db->execute("INSERT INTO Horaire(id_jour,heure_ouverture,heure_fermeture,est_ferme) VALUES(:j,:o,:f,:e)",[':j'=>$idJ,':o'=>$ouv,':f'=>$ferm,':e'=>$est]);
        return $this->getHoraire();
    }

    public function updateHoraire(int $id, array $d): array
    {
        $ouv  = trim((string)($d['heure_ouverture']??''));
        $ferm = trim((string)($d['heure_fermeture']??''));
        if ($ouv===''||$ferm==='') throw new RuntimeException('Horaires requis');
        $est = (int)(bool)($d['est_ferme']??0);
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
    public function getParamsCCE(): array
    {
        return $this->rows("SELECT id_parametre,montant_min FROM ParametresCCE ORDER BY id_parametre ASC");
    }

    public function updateParamsCCE(int $id, array $d): array
    {
        $m = (float)($d['montant_min']??0);
        if ($m<0) throw new RuntimeException('Montant invalide');
        $this->db->execute("UPDATE ParametresCCE SET montant_min=:m WHERE id_parametre=:id",[':m'=>$m,':id'=>$id]);
        return $this->getParamsCCE();
    }

    // ═══════════════════════════════════════════════════════
    //  BonusCCE
    // ═══════════════════════════════════════════════════════
    public function getBonusCCE(): array
    {
        return $this->rows("SELECT id_bonus,tranche,montant_bonus FROM BonusCCE ORDER BY tranche ASC");
    }

    public function addBonusCCE(array $d): array
    {
        $t = (float)($d['tranche']??0);
        $b = (float)($d['montant_bonus']??0);
        if ($t<=0||$b<0) throw new RuntimeException('Valeurs invalides');
        $this->db->execute("INSERT INTO BonusCCE(tranche,montant_bonus) VALUES(:t,:b)",[':t'=>$t,':b'=>$b]);
        return $this->getBonusCCE();
    }

    public function updateBonusCCE(int $id, array $d): array
    {
        $t = (float)($d['tranche']??0);
        $b = (float)($d['montant_bonus']??0);
        if ($t<=0||$b<0) throw new RuntimeException('Valeurs invalides');
        $this->db->execute("UPDATE BonusCCE SET tranche=:t,montant_bonus=:b WHERE id_bonus=:id",[':t'=>$t,':b'=>$b,':id'=>$id]);
        return $this->getBonusCCE();
    }

    public function deleteBonusCCE(int $id): void
    {
        $this->db->execute("DELETE FROM BonusCCE WHERE id_bonus=:id",[':id'=>$id]);
    }
}