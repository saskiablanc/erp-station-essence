/** panels/gerant/bdd.js — Base de données complète (US19) */
const BddPanel = (() => {
  const swalBase = {
    customClass: {
      popup: "bdd-swal-popup",
      title: "bdd-swal-title",
      htmlContainer: "bdd-swal-html",
      confirmButton: "bdd-swal-btn",
      cancelButton: "bdd-swal-btn bdd-swal-btn--cancel",
    },
    buttonsStyling: false,
    reverseButtons: false,
    backdrop: "rgba(26,26,46,0.45)",
  };

  const ICON_EDIT = `<svg class="bdd-icon" viewBox="0 0 16 16" fill="none">
    <path d="M11.5 2.5L13.5 4.5L5.5 12.5H3.5V10.5L11.5 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"></path>
    <path d="M10 4L12 6" stroke="currentColor" stroke-width="1.4"></path>
  </svg>`;
  const ICON_DELETE = `<svg class="bdd-icon" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></line>
    <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></line>
  </svg>`;

  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
  function fmt(v, d = 2) {
    return Number(v ?? 0).toFixed(d);
  }
  function bool(v) {
    return v ? "✓" : "✗";
  }

  async function ok(msg) {
    await Swal.fire({
      ...swalBase,
      icon: "success",
      title: msg,
      showCloseButton: true,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
  }
  async function err(msg) {
    await Swal.fire({
      ...swalBase,
      icon: "error",
      title: "Erreur",
      html: esc(msg),
      showCloseButton: true,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
  }
  async function cancelled() {
    await Swal.fire({
      ...swalBase,
      icon: "error",
      title: "Opération Annulée",
      showCloseButton: true,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
  }
  async function confirm(msg, id) {
    return Swal.fire({
      ...swalBase,
      icon: "question",
      html: `<p class="bdd-confirm-msg">${esc(msg)}</p><p class="bdd-confirm-ref">(Référence : Id ${esc(String(id))})</p>`,
      showCancelButton: true,
      cancelButtonText: "Annuler",
      confirmButtonText: "Confirmer",
      allowOutsideClick: false,
    });
  }

  // ════════════════════════════════════════════════════════
  //  SCHEMAS — une entrée par table
  //  cols : { f, label, w?, isPrice? }
  //  editFields : champs affichés dans le formulaire de modification
  //  addFields  : champs affichés dans le formulaire d'ajout
  //  canAdd / canEdit / canDel
  // ════════════════════════════════════════════════════════
  const SCHEMAS = {
    article: {
      label: "Article",
      short: "Article",
      key: "id_article",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_article", label: "ID", w: "60px" },
        { f: "type_article", label: "Type Article", w: "" },
      ],
      addFields: [
        {
          id: "bdd-type_article",
          f: "type_article",
          label: "Type",
          type: "text",
          ph: "produit",
        },
      ],
      editFields: [{ f: "type_article", label: "Type Article", type: "text" }],
      load: () => Requetes.bddGet("article"),
      add: (d) => Requetes.bddPost("article", d),
      update: (id, d) => Requetes.bddPut("article", id, d),
      del: (id) => Requetes.bddDel("article", id),
      rowKey: (r) => r.id_article,
      rowHtml: (r) => [esc(r.id_article), esc(r.type_article)],
    },

    produit: {
      label: "Produit",
      short: "Produit",
      key: "code_barres",
      dataKey: "produits",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "code_barres", label: "Code-barres", w: "140px" },
        { f: "libelle_produit", label: "Libellé", w: "" },
        { f: "prix", label: "Prix (€)", w: "90px", isPrice: true },
        { f: "quantite_stock", label: "Stock", short: "Stock", w: "70px" },
      ],
      addFields: [
        {
          id: "bdd-code_barres",
          f: "code_barres",
          label: "Code-barres",
          type: "text",
          ph: "EAN13...",
        },
        {
          id: "bdd-libelle_produit",
          f: "libelle_produit",
          label: "Libellé",
          type: "text",
          ph: "Nom...",
        },
        {
          id: "bdd-prix",
          f: "prix",
          label: "Prix (€)",
          type: "number",
          ph: "0.00",
        },
      ],
      editFields: [
        { f: "libelle_produit", label: "Libellé", type: "text" },
        { f: "prix", label: "Prix (€)", type: "number", isPrice: true },
      ],
      load: () => Requetes.bddGet("produit"),
      add: (d) => Requetes.bddPost("produit", d),
      update: (id, d) => Requetes.bddPut("produit", id, d),
      del: (id) => Requetes.bddDel("produit", id),
      rowKey: (r) => r.code_barres,
      rowHtml: (r) => [
        esc(r.code_barres),
        esc(r.libelle_produit),
        fmt(r.prix) + "&nbsp;€",
        String(r.quantite_stock ?? 0),
      ],
    },

    energie: {
      label: "Énergie",
      short: "Énergie",
      key: "id_energie",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_energie", label: "ID", w: "60px" },
        { f: "id_article", label: "id_article", w: "90px" },
        { f: "type_energie", label: "Type", w: "" },
      ],
      addFields: [
        {
          id: "bdd-id_article",
          f: "id_article",
          label: "id_article",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-type_energie",
          f: "type_energie",
          label: "Type énergie",
          type: "text",
          ph: "carburant",
        },
      ],
      editFields: [{ f: "type_energie", label: "Type énergie", type: "text" }],
      load: () => Requetes.bddGet("energie"),
      add: (d) => Requetes.bddPost("energie", d),
      update: (id, d) => Requetes.bddPut("energie", id, d),
      del: (id) => Requetes.bddDel("energie", id),
      rowKey: (r) => r.id_energie,
      rowHtml: (r) => [
        esc(r.id_energie),
        esc(r.id_article),
        esc(r.type_energie),
      ],
    },

    carburant: {
      label: "Carburant",
      short: "Carburant",
      key: "id_carburant",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_carburant", label: "ID", w: "50px" },
        { f: "id_energie", label: "id_energie", w: "80px" },
        { f: "libelle", label: "Libellé", w: "" },
        { f: "prix_litre", label: "Prix/L (€)", w: "90px", isPrice: true },
        { f: "stock_litre", label: "Stock (L)", w: "80px" },
        { f: "livraison_min", label: "Liv. min", w: "80px" },
      ],
      addFields: [
        {
          id: "bdd-id_energie",
          f: "id_energie",
          label: "id_energie",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-libelle",
          f: "libelle",
          label: "Libellé",
          type: "text",
          ph: "SP95",
        },
        {
          id: "bdd-prix_litre",
          f: "prix_litre",
          label: "Prix/L (€)",
          type: "number",
          ph: "1.80",
        },
        {
          id: "bdd-stock_litre",
          f: "stock_litre",
          label: "Stock (L)",
          type: "number",
          ph: "0",
        },
        {
          id: "bdd-livraison_min",
          f: "livraison_min",
          label: "Liv. min",
          type: "number",
          ph: "0",
        },
      ],
      editFields: [
        { f: "libelle", label: "Libellé", type: "text" },
        { f: "prix_litre", label: "Prix/L (€)", type: "number", isPrice: true },
        { f: "stock_litre", label: "Stock (L)", type: "number" },
        { f: "livraison_min", label: "Liv. min", type: "number" },
      ],
      load: () => Requetes.bddGet("carburant"),
      add: (d) => Requetes.bddPost("carburant", d),
      update: (id, d) => Requetes.bddPut("carburant", id, d),
      del: (id) => Requetes.bddDel("carburant", id),
      rowKey: (r) => r.id_carburant,
      rowHtml: (r) => [
        esc(r.id_carburant),
        esc(r.id_energie),
        esc(r.libelle),
        fmt(r.prix_litre) + "&nbsp;€",
        fmt(r.stock_litre, 0) + "&nbsp;L",
        esc(r.livraison_min),
      ],
    },

    electricite: {
      label: "Électricité",
      short: "Électric.",
      key: "id_electricite",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_electricite", label: "ID", w: "50px" },
        { f: "id_energie", label: "id_energie", w: "80px" },
        { f: "prix_kwh", label: "Prix/kWh (€)", w: "110px", isPrice: true },
        { f: "type_charge", label: "Type charge", w: "" },
      ],
      addFields: [
        {
          id: "bdd-id_energie",
          f: "id_energie",
          label: "id_energie",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-prix_kwh",
          f: "prix_kwh",
          label: "Prix/kWh (€)",
          type: "number",
          ph: "0.25",
        },
        {
          id: "bdd-type_charge",
          f: "type_charge",
          label: "Type charge",
          type: "text",
          ph: "rapide",
        },
      ],
      editFields: [
        { f: "prix_kwh", label: "Prix/kWh (€)", type: "number", isPrice: true },
        { f: "type_charge", label: "Type charge", type: "text" },
      ],
      load: () => Requetes.bddGet("electricite"),
      add: (d) => Requetes.bddPost("electricite", d),
      update: (id, d) => Requetes.bddPut("electricite", id, d),
      del: (id) => Requetes.bddDel("electricite", id),
      rowKey: (r) => r.id_electricite,
      rowHtml: (r) => [
        esc(r.id_electricite),
        esc(r.id_energie),
        fmt(r.prix_kwh) + "&nbsp;€",
        esc(r.type_charge),
      ],
    },

    stock: {
      label: "Stock",
      key: "id_stock",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_stock", label: "ID", w: "50px" },
        { f: "id_article", label: "id_article", w: "80px" },
        { f: "quantite_stock", label: "Quantité", w: "" },
        { f: "type_quantite", label: "Type", w: "90px" },
      ],
      addFields: [
        {
          id: "bdd-id_article",
          f: "id_article",
          label: "id_article",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-quantite_stock",
          f: "quantite_stock",
          label: "Quantité",
          type: "number",
          ph: "0",
        },
        {
          id: "bdd-type_quantite",
          f: "type_quantite",
          label: "Type",
          type: "text",
          ph: "unite",
        },
      ],
      editFields: [{ f: "quantite_stock", label: "Quantité", type: "number" }],
      load: () => Requetes.bddGet("stock"),
      add: (d) => Requetes.bddPost("stock", d),
      update: (id, d) => Requetes.bddPut("stock", id, d),
      del: (id) => Requetes.bddDel("stock", id),
      rowKey: (r) => r.id_stock,
      rowHtml: (r) => [
        esc(r.id_stock),
        esc(r.id_article),
        esc(r.quantite_stock),
        esc(r.type_quantite),
      ],
    },

    client: {
      label: "Client",
      short: "Client",
      key: "id_client",
      dataKey: "clients",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_client", label: "ID", w: "50px" },
        { f: "nom", label: "Nom", w: "130px" },
        { f: "prenom", label: "Prénom", w: "130px" },
        { f: "email", label: "Email", w: "" },
        { f: "num_tel", label: "Téléphone", w: "110px" },
      ],
      addFields: [
        { id: "bdd-nom", f: "nom", label: "Nom", type: "text", ph: "Dupont" },
        {
          id: "bdd-prenom",
          f: "prenom",
          label: "Prénom",
          type: "text",
          ph: "Jean",
        },
        {
          id: "bdd-email",
          f: "email",
          label: "Email",
          type: "email",
          ph: "jean@email.fr",
        },
        {
          id: "bdd-num_tel",
          f: "num_tel",
          label: "Téléphone",
          type: "text",
          ph: "0600000000",
        },
      ],
      editFields: [
        { f: "nom", label: "Nom", type: "text" },
        { f: "prenom", label: "Prénom", type: "text" },
        { f: "email", label: "Email", type: "email" },
        { f: "num_tel", label: "Téléphone", type: "text" },
      ],
      load: () => Requetes.bddGet("client"),
      add: (d) => Requetes.bddPost("client", d),
      update: (id, d) => Requetes.bddPut("client", id, d),
      del: (id) => Requetes.bddDel("client", id),
      rowKey: (r) => r.id_client,
      rowHtml: (r) => [
        esc(r.id_client),
        esc(r.nom),
        esc(r.prenom),
        esc(r.email),
        esc(r.num_tel),
      ],
    },

    cce: {
      label: "Carte CCE",
      short: "Carte CCE",
      key: "id_carte_CE",
      dataKey: "cartes",
      canAdd: false,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_carte_CE", label: "ID", w: "50px" },
        { f: "nom", label: "Nom", w: "100px" },
        { f: "prenom", label: "Prénom", w: "100px" },
        { f: "email", label: "Email", w: "" },
        { f: "code_secret", label: "Code secret", w: "82px" },
        { f: "solde_client", label: "Solde (€)", w: "80px", isPrice: true },
        { f: "date_dernier_apport", label: "Dernier apport", w: "106px" },
        {
          f: "montant_dernier_apport",
          label: "Montant (€)",
          w: "80px",
          isPrice: true,
        },
      ],
      editFields: [
        {
          f: "solde_client",
          label: "Solde (€)",
          type: "number",
          isPrice: true,
        },
      ],
      load: () => Requetes.bddGet("cce"),
      update: (id, d) => Requetes.bddPut("cce", id, d),
      del: (id) => Requetes.bddDel("cce", id),
      rowKey: (r) => r.id_carte_CE,
      rowHtml: (r) => [
        esc(r.id_carte_CE),
        esc(r.nom),
        esc(r.prenom),
        esc(r.email),
        esc(r.code_secret),
        fmt(r.solde_client) + "&nbsp;€",
        esc(r.date_dernier_apport || "—"),
        fmt(r.montant_dernier_apport) + "&nbsp;€",
      ],
    },

    connexion: {
      label: "Connexion",
      short: "Connexion",
      key: "id_connexion",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_connexion", label: "ID", w: "50px" },
        { f: "identifiant", label: "Identifiant", w: "" },
        { f: "role", label: "Rôle", w: "90px" },
      ],
      addFields: [
        {
          id: "bdd-identifiant",
          f: "identifiant",
          label: "Identifiant",
          type: "text",
          ph: "employe2",
        },
        {
          id: "bdd-mdp",
          f: "mdp",
          label: "Mot de passe",
          type: "password",
          ph: "••••••",
        },
        {
          id: "bdd-role",
          f: "role",
          label: "Rôle",
          type: "text",
          ph: "employe",
        },
      ],
      editFields: [
        { f: "identifiant", label: "Identifiant", type: "text" },
        { f: "mdp", label: "Nouveau mdp", type: "password" },
        { f: "role", label: "Rôle", type: "text" },
      ],
      load: () => Requetes.bddGet("connexion"),
      add: (d) => Requetes.bddPost("connexion", d),
      update: (id, d) => Requetes.bddPut("connexion", id, d),
      del: (id) => Requetes.bddDel("connexion", id),
      rowKey: (r) => r.id_connexion,
      rowHtml: (r) => [esc(r.id_connexion), esc(r.identifiant), esc(r.role)],
    },

    transaction: {
      label: "Transaction",
      short: "Transact.",
      key: "id_transaction",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_transaction", label: "ID", w: "50px" },
        { f: "prix_total", label: "Prix total", w: "90px", isPrice: true },
        { f: "date_heure", label: "Date/Heure", w: "" },
      ],
      addFields: [
        {
          id: "bdd-prix_total",
          f: "prix_total",
          label: "Prix total",
          type: "number",
          ph: "0.00",
        },
        {
          id: "bdd-date_heure",
          f: "date_heure",
          label: "Date/Heure",
          type: "text",
          ph: "2026-01-01 12:00:00",
        },
      ],
      editFields: [
        { f: "prix_total", label: "Prix total", type: "number", isPrice: true },
        { f: "date_heure", label: "Date/Heure", type: "text" },
      ],
      load: () => Requetes.bddGet("transaction"),
      add: (d) => Requetes.bddPost("transaction", d),
      update: (id, d) => Requetes.bddPut("transaction", id, d),
      del: (id) => Requetes.bddDel("transaction", id),
      rowKey: (r) => r.id_transaction,
      rowHtml: (r) => [
        esc(r.id_transaction),
        fmt(r.prix_total) + "&nbsp;€",
        esc(r.date_heure),
      ],
    },

    transaction_produit: {
      label: "Tx Produit",
      short: "Tx Produit",
      key: "id_transaction_produit",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_transaction_produit", label: "ID", w: "50px" },
        { f: "id_transaction", label: "id_transaction", w: "110px" },
        { f: "code_barres", label: "Code-barres", w: "130px" },
        { f: "quantite_produit_totale", label: "Quantité", w: "" },
      ],
      addFields: [
        {
          id: "bdd-id_transaction",
          f: "id_transaction",
          label: "id_transaction",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-code_barres",
          f: "code_barres",
          label: "Code-barres",
          type: "text",
          ph: "EAN13...",
        },
        {
          id: "bdd-quantite_produit_totale",
          f: "quantite_produit_totale",
          label: "Quantité",
          type: "number",
          ph: "1",
        },
      ],
      editFields: [
        { f: "quantite_produit_totale", label: "Quantité", type: "number" },
      ],
      load: () => Requetes.bddGet("transaction_produit"),
      add: (d) => Requetes.bddPost("transaction_produit", d),
      update: (id, d) => Requetes.bddPut("transaction_produit", id, d),
      del: (id) => Requetes.bddDel("transaction_produit", id),
      rowKey: (r) => r.id_transaction_produit,
      rowHtml: (r) => [
        esc(r.id_transaction_produit),
        esc(r.id_transaction),
        esc(r.code_barres),
        esc(r.quantite_produit_totale),
      ],
    },

    transaction_energie: {
      label: "Tx Énergie",
      short: "Tx Énergie",
      key: "id_transaction_energie",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_transaction_energie", label: "ID", w: "50px" },
        { f: "id_transaction", label: "id_transaction", w: "110px" },
        { f: "id_energie", label: "id_energie", w: "80px" },
        { f: "quantite_delivree", label: "Qté délivrée", w: "100px" },
        { f: "temps_charge", label: "Temps charge", w: "" },
      ],
      addFields: [
        {
          id: "bdd-id_transaction",
          f: "id_transaction",
          label: "id_transaction",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-id_energie",
          f: "id_energie",
          label: "id_energie",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-quantite_delivree",
          f: "quantite_delivree",
          label: "Qté délivrée",
          type: "number",
          ph: "0",
        },
        {
          id: "bdd-temps_charge",
          f: "temps_charge",
          label: "Temps charge",
          type: "text",
          ph: "00:00:00",
        },
      ],
      editFields: [
        { f: "quantite_delivree", label: "Qté délivrée", type: "number" },
        { f: "temps_charge", label: "Temps charge", type: "text" },
      ],
      load: () => Requetes.bddGet("transaction_energie"),
      add: (d) => Requetes.bddPost("transaction_energie", d),
      update: (id, d) => Requetes.bddPut("transaction_energie", id, d),
      del: (id) => Requetes.bddDel("transaction_energie", id),
      rowKey: (r) => r.id_transaction_energie,
      rowHtml: (r) => [
        esc(r.id_transaction_energie),
        esc(r.id_transaction),
        esc(r.id_energie),
        esc(r.quantite_delivree),
        esc(r.temps_charge),
      ],
    },

    recu: {
      label: "Reçu",
      short: "Reçu",
      key: "id_recu",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_recu", label: "ID", w: "50px" },
        { f: "id_transaction", label: "id_transaction", w: "110px" },
        { f: "num_carte", label: "Num carte", w: "100px" },
        { f: "horodatage", label: "Horodatage", w: "" },
      ],
      addFields: [
        {
          id: "bdd-id_transaction",
          f: "id_transaction",
          label: "id_transaction",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-num_carte",
          f: "num_carte",
          label: "Num carte",
          type: "number",
          ph: "100001",
        },
      ],
      editFields: [{ f: "num_carte", label: "Num carte", type: "number" }],
      load: () => Requetes.bddGet("recu"),
      add: (d) => Requetes.bddPost("recu", d),
      update: (id, d) => Requetes.bddPut("recu", id, d),
      del: (id) => Requetes.bddDel("recu", id),
      rowKey: (r) => r.id_recu,
      rowHtml: (r) => [
        esc(r.id_recu),
        esc(r.id_transaction),
        esc(r.num_carte),
        esc(r.horodatage),
      ],
    },

    pompe: {
      label: "Pompe",
      short: "Pompe",
      key: "id_pompe",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_pompe", label: "ID", w: "50px" },
        { f: "numero", label: "Numéro", w: "70px" },
        { f: "type_pompe", label: "Type", w: "90px" },
        { f: "sous_type", label: "Sous-type", w: "90px" },
        { f: "mode", label: "Mode", w: "70px" },
        { f: "statut", label: "Statut", w: "" },
      ],
      addFields: [
        {
          id: "bdd-numero",
          f: "numero",
          label: "Numéro",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-type_pompe",
          f: "type_pompe",
          label: "Type pompe",
          type: "text",
          ph: "carburant",
        },
        {
          id: "bdd-sous_type",
          f: "sous_type",
          label: "Sous-type",
          type: "text",
          ph: "SP95",
        },
        {
          id: "bdd-mode",
          f: "mode",
          label: "Mode",
          type: "text",
          ph: "standard",
        },
        {
          id: "bdd-statut",
          f: "statut",
          label: "Statut",
          type: "text",
          ph: "libre",
        },
      ],
      editFields: [
        { f: "numero", label: "Numéro", type: "number" },
        { f: "type_pompe", label: "Type", type: "text" },
        { f: "sous_type", label: "Sous-type", type: "text" },
        { f: "mode", label: "Mode", type: "text" },
        { f: "statut", label: "Statut", type: "text" },
      ],
      load: () => Requetes.bddGet("pompe"),
      add: (d) => Requetes.bddPost("pompe", d),
      update: (id, d) => Requetes.bddPut("pompe", id, d),
      del: (id) => Requetes.bddDel("pompe", id),
      rowKey: (r) => r.id_pompe,
      rowHtml: (r) => [
        esc(r.id_pompe),
        esc(r.numero),
        esc(r.type_pompe),
        esc(r.sous_type),
        esc(r.mode),
        esc(r.statut),
      ],
    },

    reappro: {
      label: "Réappro",
      short: "Réappro",
      key: "id_reappro",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_reappro", label: "ID", w: "50px" },
        { f: "statut_reappro", label: "Statut", w: "100px" },
        { f: "date_reappro", label: "Date", w: "100px" },
        { f: "date_souhaitee", label: "Date souhaitée", w: "120px" },
        { f: "est_auto", label: "Auto", w: "" },
      ],
      addFields: [
        {
          id: "bdd-statut_reappro",
          f: "statut_reappro",
          label: "Statut",
          type: "text",
          ph: "En cours",
        },
        {
          id: "bdd-date_reappro",
          f: "date_reappro",
          label: "Date",
          type: "text",
          ph: "2026-01-01",
        },
        {
          id: "bdd-date_souhaitee",
          f: "date_souhaitee",
          label: "Date souhaitée",
          type: "text",
          ph: "2026-01-10",
        },
        {
          id: "bdd-est_auto",
          f: "est_auto",
          label: "Auto (0/1)",
          type: "number",
          ph: "0",
        },
      ],
      editFields: [
        { f: "statut_reappro", label: "Statut", type: "text" },
        { f: "date_souhaitee", label: "Date souhaitée", type: "text" },
      ],
      load: () => Requetes.bddGet("reappro"),
      add: (d) => Requetes.bddPost("reappro", d),
      update: (id, d) => Requetes.bddPut("reappro", id, d),
      del: (id) => Requetes.bddDel("reappro", id),
      rowKey: (r) => r.id_reappro,
      rowHtml: (r) => [
        esc(r.id_reappro),
        esc(r.statut_reappro),
        esc(r.date_reappro),
        esc(r.date_souhaitee || "—"),
        bool(r.est_auto),
      ],
    },

    ligne_reappro: {
      label: "Ligne Réappro",
      short: "Ligne Réap.",
      key: "id_ligne_reappro",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_ligne_reappro", label: "ID", w: "50px" },
        { f: "id_reappro", label: "id_reappro", w: "90px" },
        { f: "id_article", label: "id_article", w: "90px" },
        { f: "quantite", label: "Quantité", w: "80px" },
        { f: "date_arrivee", label: "Date arrivée", w: "" },
      ],
      addFields: [
        {
          id: "bdd-id_reappro",
          f: "id_reappro",
          label: "id_reappro",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-id_article",
          f: "id_article",
          label: "id_article",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-quantite",
          f: "quantite",
          label: "Quantité",
          type: "number",
          ph: "10",
        },
        {
          id: "bdd-date_arrivee",
          f: "date_arrivee",
          label: "Date arrivée",
          type: "text",
          ph: "2026-01-10",
        },
      ],
      editFields: [
        { f: "quantite", label: "Quantité", type: "number" },
        { f: "date_arrivee", label: "Date arrivée", type: "text" },
      ],
      load: () => Requetes.bddGet("ligne_reappro"),
      add: (d) => Requetes.bddPost("ligne_reappro", d),
      update: (id, d) => Requetes.bddPut("ligne_reappro", id, d),
      del: (id) => Requetes.bddDel("ligne_reappro", id),
      rowKey: (r) =>
        r.id_ligne_reappro || String(r.id_reappro) + "_" + r.id_article,
      rowHtml: (r) => [
        esc(r.id_ligne_reappro || "—"),
        esc(r.id_reappro),
        esc(r.id_article),
        esc(r.quantite),
        esc(r.date_arrivee || "—"),
      ],
    },

    valeurs_defaut: {
      label: "Val. Défaut",
      short: "Val. Déf.",
      key: "id_valeur_reappro_defaut",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_valeur_reappro_defaut", label: "ID", w: "50px" },
        { f: "id_article", label: "id_article", w: "80px" },
        { f: "seuil_alerte", label: "Seuil alerte", w: "90px" },
        { f: "volume", label: "Volume", w: "80px" },
        { f: "frequence_valeur", label: "Fréq.", w: "60px" },
        { f: "frequence_unite", label: "Unité", w: "" },
      ],
      addFields: [
        {
          id: "bdd-id_article",
          f: "id_article",
          label: "id_article",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-seuil_alerte",
          f: "seuil_alerte",
          label: "Seuil alerte",
          type: "number",
          ph: "10",
        },
        {
          id: "bdd-volume",
          f: "volume",
          label: "Volume",
          type: "number",
          ph: "100",
        },
        {
          id: "bdd-frequence_valeur",
          f: "frequence_valeur",
          label: "Fréq. valeur",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-frequence_unite",
          f: "frequence_unite",
          label: "Fréq. unité",
          type: "text",
          ph: "semaine",
        },
      ],
      editFields: [
        { f: "seuil_alerte", label: "Seuil alerte", type: "number" },
        { f: "volume", label: "Volume", type: "number" },
        { f: "frequence_valeur", label: "Fréq. valeur", type: "number" },
        { f: "frequence_unite", label: "Fréq. unité", type: "text" },
      ],
      load: () => Requetes.bddGet("valeurs_defaut"),
      add: (d) => Requetes.bddPost("valeurs_defaut", d),
      update: (id, d) => Requetes.bddPut("valeurs_defaut", id, d),
      del: (id) => Requetes.bddDel("valeurs_defaut", id),
      rowKey: (r) => r.id_valeur_reappro_defaut,
      rowHtml: (r) => [
        esc(r.id_valeur_reappro_defaut),
        esc(r.id_article),
        esc(r.seuil_alerte),
        esc(r.volume),
        esc(r.frequence_valeur),
        esc(r.frequence_unite),
      ],
    },

    fiche_incident: {
      label: "Fiche Incident",
      short: "Incident",
      key: "id_ref_unique",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_ref_unique", label: "Ref", w: "50px" },
        { f: "date_creation", label: "Date", w: "90px" },
        { f: "heure_creation", label: "Heure", w: "70px" },
        { f: "type_incident", label: "Type", w: "110px" },
        { f: "detail_tech", label: "Détail tech.", w: "" },
        { f: "solution", label: "Solution", w: "140px" },
      ],
      addFields: [
        {
          id: "bdd-date_creation",
          f: "date_creation",
          label: "Date",
          type: "text",
          ph: "2026-01-01",
        },
        {
          id: "bdd-heure_creation",
          f: "heure_creation",
          label: "Heure",
          type: "text",
          ph: "12:00:00",
        },
        {
          id: "bdd-type_incident",
          f: "type_incident",
          label: "Type",
          type: "text",
          ph: "Accident Travail",
        },
        {
          id: "bdd-detail_tech",
          f: "detail_tech",
          label: "Détail tech.",
          type: "text",
          ph: "...",
        },
        {
          id: "bdd-solution",
          f: "solution",
          label: "Solution",
          type: "text",
          ph: "...",
        },
      ],
      editFields: [
        { f: "type_incident", label: "Type", type: "text" },
        { f: "detail_tech", label: "Détail tech.", type: "text" },
        { f: "solution", label: "Solution", type: "text" },
      ],
      load: () => Requetes.bddGet("fiche_incident"),
      add: (d) => Requetes.bddPost("fiche_incident", d),
      update: (id, d) => Requetes.bddPut("fiche_incident", id, d),
      del: (id) => Requetes.bddDel("fiche_incident", id),
      rowKey: (r) => r.id_ref_unique,
      rowHtml: (r) => [
        esc(r.id_ref_unique),
        esc(r.date_creation),
        esc(r.heure_creation),
        esc(r.type_incident),
        esc(r.detail_tech),
        esc(r.solution),
      ],
    },

    jour_fermeture: {
      label: "Jour Fermeture",
      short: "Fermeture",
      key: "id_fermeture",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_fermeture", label: "ID", w: "50px" },
        { f: "date_fermeture", label: "Date", w: "110px" },
        { f: "motif", label: "Motif", w: "" },
      ],
      addFields: [
        {
          id: "bdd-date_fermeture",
          f: "date_fermeture",
          label: "Date",
          type: "text",
          ph: "2026-12-25",
        },
        {
          id: "bdd-motif",
          f: "motif",
          label: "Motif",
          type: "text",
          ph: "Noël",
        },
      ],
      editFields: [
        { f: "date_fermeture", label: "Date", type: "text" },
        { f: "motif", label: "Motif", type: "text" },
      ],
      load: () => Requetes.bddGet("jour_fermeture"),
      add: (d) => Requetes.bddPost("jour_fermeture", d),
      update: (id, d) => Requetes.bddPut("jour_fermeture", id, d),
      del: (id) => Requetes.bddDel("jour_fermeture", id),
      rowKey: (r) => r.id_fermeture,
      rowHtml: (r) => [
        esc(r.id_fermeture),
        esc(r.date_fermeture),
        esc(r.motif),
      ],
    },

    jour_semaine: {
      label: "Jour Semaine",
      short: "Semaine",
      key: "id_jour",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_jour", label: "ID", w: "50px" },
        { f: "libelle", label: "Libellé", w: "" },
      ],
      addFields: [
        {
          id: "bdd-libelle",
          f: "libelle",
          label: "Libellé",
          type: "text",
          ph: "Lundi",
        },
      ],
      editFields: [{ f: "libelle", label: "Libellé", type: "text" }],
      load: () => Requetes.bddGet("jour_semaine"),
      add: (d) => Requetes.bddPost("jour_semaine", d),
      update: (id, d) => Requetes.bddPut("jour_semaine", id, d),
      del: (id) => Requetes.bddDel("jour_semaine", id),
      rowKey: (r) => r.id_jour,
      rowHtml: (r) => [esc(r.id_jour), esc(r.libelle)],
    },

    horaire: {
      label: "Horaire",
      short: "Horaire",
      key: "id_horaire",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_horaire", label: "ID", w: "50px" },
        { f: "id_jour", label: "id_jour", w: "70px" },
        { f: "heure_ouverture", label: "Ouverture", w: "90px" },
        { f: "heure_fermeture", label: "Fermeture", w: "90px" },
        { f: "est_ferme", label: "Fermé", w: "" },
      ],
      addFields: [
        {
          id: "bdd-id_jour",
          f: "id_jour",
          label: "id_jour",
          type: "number",
          ph: "1",
        },
        {
          id: "bdd-heure_ouverture",
          f: "heure_ouverture",
          label: "Ouverture",
          type: "text",
          ph: "08:00:00",
        },
        {
          id: "bdd-heure_fermeture",
          f: "heure_fermeture",
          label: "Fermeture",
          type: "text",
          ph: "20:00:00",
        },
        {
          id: "bdd-est_ferme",
          f: "est_ferme",
          label: "Fermé (0/1)",
          type: "number",
          ph: "0",
        },
      ],
      editFields: [
        { f: "heure_ouverture", label: "Ouverture", type: "text" },
        { f: "heure_fermeture", label: "Fermeture", type: "text" },
        { f: "est_ferme", label: "Fermé (0/1)", type: "number" },
      ],
      load: () => Requetes.bddGet("horaire"),
      add: (d) => Requetes.bddPost("horaire", d),
      update: (id, d) => Requetes.bddPut("horaire", id, d),
      del: (id) => Requetes.bddDel("horaire", id),
      rowKey: (r) => r.id_horaire,
      rowHtml: (r) => [
        esc(r.id_horaire),
        esc(r.id_jour),
        esc(r.heure_ouverture),
        esc(r.heure_fermeture),
        bool(r.est_ferme),
      ],
    },

    params_cce: {
      label: "Params CCE",
      short: "Params CCE",
      key: "id_parametre",
      dataKey: "rows",
      canAdd: false,
      canEdit: true,
      canDel: false,
      cols: [
        { f: "id_parametre", label: "ID", w: "50px" },
        { f: "montant_min", label: "Montant min (€)", w: "", isPrice: true },
      ],
      editFields: [
        {
          f: "montant_min",
          label: "Montant min (€)",
          type: "number",
          isPrice: true,
        },
      ],
      load: () => Requetes.bddGet("params_cce"),
      update: (id, d) => Requetes.bddPut("params_cce", id, d),
      rowKey: (r) => r.id_parametre,
      rowHtml: (r) => [esc(r.id_parametre), fmt(r.montant_min) + "&nbsp;€"],
    },

    bonus_cce: {
      label: "Bonus CCE",
      short: "Bonus CCE",
      key: "id_bonus",
      dataKey: "rows",
      canAdd: true,
      canEdit: true,
      canDel: true,
      cols: [
        { f: "id_bonus", label: "ID", w: "50px" },
        { f: "tranche", label: "Tranche (€)", w: "120px", isPrice: true },
        { f: "montant_bonus", label: "Bonus (€)", w: "", isPrice: true },
      ],
      addFields: [
        {
          id: "bdd-tranche",
          f: "tranche",
          label: "Tranche (€)",
          type: "number",
          ph: "50",
        },
        {
          id: "bdd-montant_bonus",
          f: "montant_bonus",
          label: "Bonus (€)",
          type: "number",
          ph: "5",
        },
      ],
      editFields: [
        { f: "tranche", label: "Tranche (€)", type: "number", isPrice: true },
        {
          f: "montant_bonus",
          label: "Bonus (€)",
          type: "number",
          isPrice: true,
        },
      ],
      load: () => Requetes.bddGet("bonus_cce"),
      add: (d) => Requetes.bddPost("bonus_cce", d),
      update: (id, d) => Requetes.bddPut("bonus_cce", id, d),
      del: (id) => Requetes.bddDel("bonus_cce", id),
      rowKey: (r) => r.id_bonus,
      rowHtml: (r) => [
        esc(r.id_bonus),
        fmt(r.tranche) + "&nbsp;€",
        fmt(r.montant_bonus) + "&nbsp;€",
      ],
    },
  };

  const GROUPS = Object.entries(SCHEMAS).map(([id, s]) => ({
    id,
    label: s.label,
    short: s.short || s.label,
  }));

  // ════════════════════════════════════════════════════════
  //  HTML
  // ════════════════════════════════════════════════════════
  function buildHTML() {
    const tabs = GROUPS.map(
      (g) =>
        `<button class="bdd-tab${g.id === "produit" ? " active" : ""}" data-table="${g.id}">${g.label}</button>`,
    ).join("");
    return `
      <div class="bdd-panel">
        <div class="bdd-nav">${tabs}</div>
        <div class="bdd-content">
          <div class="bdd-toolbar"><button class="bdd-add-btn">Ajouter Ligne</button></div>
          <div class="bdd-table-wrap">
            <div class="bdd-table-center">
              <table class="bdd-table">
                <thead><tr class="bdd-thead-row"></tr></thead>
                <tbody class="bdd-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ════════════════════════════════════════════════════════
  //  Rendu tableau
  // ════════════════════════════════════════════════════════
  function renderTable(root, schema, rows) {
    const thead = root.querySelector(".bdd-thead-row");
    const tbody = root.querySelector(".bdd-tbody");
    if (!thead || !tbody) return;

    const showAct = schema.canEdit || schema.canDel;
    thead.innerHTML =
      schema.cols
        .map(
          (c) =>
            `<th class="bdd-th" ${c.w ? `style="width:${c.w}"` : ""}>${c.label}</th>`,
        )
        .join("") +
      (showAct ? '<th class="bdd-th bdd-th--actions">Actions</th>' : "");

    if (!rows.length) {
      tbody.innerHTML = `<tr><td class="bdd-empty" colspan="${schema.cols.length + (showAct ? 1 : 0)}">Aucune entrée</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map((r) => {
        const key = schema.rowKey(r);
        const k = esc(String(key));
        const act = showAct
          ? `<td class="bdd-td bdd-td--actions">
        ${schema.canEdit ? `<button class="bdd-action-btn bdd-edit-btn" data-key="${k}" title="Modifier">${ICON_EDIT}</button>` : ""}
        ${schema.canDel ? `<button class="bdd-action-btn bdd-del-btn"  data-key="${k}" title="Supprimer">${ICON_DELETE}</button>` : ""}
      </td>`
          : "";
        return `<tr class="bdd-row" data-key="${k}">${schema
          .rowHtml(r)
          .map((c) => `<td class="bdd-td">${c}</td>`)
          .join("")}${act}</tr>`;
      })
      .join("");
  }

  function setLoading(root, on) {
    root
      .querySelectorAll(".bdd-add-btn,.bdd-edit-btn,.bdd-del-btn")
      .forEach((b) => (b.disabled = on));
  }

  async function loadTable(root) {
    const schema = SCHEMAS[root._bddTable || "produit"];
    const tbody = root.querySelector(".bdd-tbody");
    if (tbody)
      tbody.innerHTML = `<tr><td class="bdd-empty" colspan="10">Chargement…</td></tr>`;
    setLoading(root, true);
    try {
      const resp = await schema.load();
      const rows = resp[schema.dataKey] || resp.rows || [];
      root._bddRows = rows;
      renderTable(root, schema, rows);
    } catch (e) {
      if (tbody)
        tbody.innerHTML = `<tr><td class="bdd-empty bdd-empty--err" colspan="10">${esc(e.message)}</td></tr>`;
    } finally {
      setLoading(root, false);
    }
  }

  // ════════════════════════════════════════════════════════
  //  Popup ajout
  // ════════════════════════════════════════════════════════
  async function openAdd(root) {
    const schema = SCHEMAS[root._bddTable || "produit"];
    if (!schema.add) {
      await Swal.fire({
        ...swalBase,
        icon: "info",
        title: "Ajout non disponible",
        html: "Cette table se gère via son panel dédié.",
        showCloseButton: true,
        showConfirmButton: false,
      });
      return;
    }
    const formHtml = `<div class="bdd-form">${(schema.addFields || [])
      .map(
        (f) =>
          `<label class="bdd-form-row"><span class="bdd-form-label">${esc(f.label)}</span>
       <input id="${f.id}" class="bdd-form-input" type="${f.type}" placeholder="${esc(f.ph || "")}"></label>`,
      )
      .join("")}</div>`;

    const res = await Swal.fire({
      ...swalBase,
      title: "Ajouter une ligne",
      html: formHtml,
      showCancelButton: true,
      cancelButtonText: "Annuler",
      confirmButtonText: "Confirmer",
      allowOutsideClick: false,
      focusConfirm: false,
      didOpen: (p) => p.querySelector("input")?.focus(),
      preConfirm: () => {
        const vals = {};
        let hasEmpty = false;
        (schema.addFields || []).forEach((f) => {
          const v = document.getElementById(f.id)?.value.trim() || "";
          if (!v && f.type !== "password") hasEmpty = true;
          vals[f.f] = f.type === "number" ? parseFloat(v) || 0 : v;
        });
        if (hasEmpty) {
          Swal.showValidationMessage("Merci de renseigner tous les champs");
          return false;
        }
        return vals;
      },
    });

    if (!res.isConfirmed) {
      await cancelled();
      return;
    }

    let nextRef = "?";
    try {
      const rows = root._bddRows || [];
      if (rows.length) {
        const ids = rows.map((r) => Number(schema.rowKey(r))).filter(Boolean);
        if (ids.length) nextRef = Math.max(...ids) + 1;
      }
    } catch (_) {}

    const conf = await confirm(
      "Êtes vous sûr de vouloir ajouter cette ligne ?",
      nextRef,
    );
    if (!conf.isConfirmed) {
      await cancelled();
      return;
    }

    try {
      await schema.add(res.value);
      await loadTable(root);
      await ok("Ligne Ajoutée");
    } catch (e) {
      await err(e.message || "Erreur lors de l'ajout");
    }
  }

  // ════════════════════════════════════════════════════════
  //  Popup modification
  // ════════════════════════════════════════════════════════
  async function openEdit(root, key) {
    const schema = SCHEMAS[root._bddTable || "produit"];
    const row = root.querySelector(
      `.bdd-row[data-key="${CSS.escape(String(key))}"]`,
    );
    if (!row) return;

    const cells = Array.from(row.querySelectorAll(".bdd-td"));
    const editFields = schema.editFields || [];

    // Pré-remplit avec les valeurs actuelles en trouvant la colonne par son champ
    const currentVals = {};
    editFields.forEach((ef) => {
      const colIdx = schema.cols.findIndex((c) => c.f === ef.f);
      currentVals[ef.f] = (cells[colIdx]?.textContent || "")
        .replace(/[€\u00a0]/g, "")
        .trim();
    });

    const formHtml = `<div class="bdd-form">
      <p class="bdd-confirm-ref" style="margin-bottom:10px">(Référence : Id ${esc(String(key))})</p>
      ${editFields
        .map(
          (ef) =>
            `<label class="bdd-form-row"><span class="bdd-form-label">${esc(ef.label)}</span>
         <input id="bdd-edit-${ef.f}" class="bdd-form-input" type="${ef.type || "text"}"
                ${ef.isPrice ? 'step="0.01"' : ""} value="${esc(currentVals[ef.f] || "")}"></label>`,
        )
        .join("")}
    </div>`;

    const res = await Swal.fire({
      ...swalBase,
      title: "Modifier la ligne",
      html: formHtml,
      showCancelButton: true,
      cancelButtonText: "Annuler",
      confirmButtonText: "Confirmer",
      allowOutsideClick: false,
      focusConfirm: false,
      didOpen: (p) => p.querySelector("input")?.focus(),
      preConfirm: () => {
        const vals = {};
        let hasEmpty = false;
        editFields.forEach((ef) => {
          const v =
            document.getElementById("bdd-edit-" + ef.f)?.value.trim() || "";
          if (!v && ef.type !== "password") hasEmpty = true;
          vals[ef.f] =
            ef.isPrice || ef.type === "number" ? parseFloat(v) || 0 : v;
        });
        if (hasEmpty) {
          Swal.showValidationMessage("Mauvaise Entrée — champs vides");
          return false;
        }
        return vals;
      },
    });

    if (!res.isConfirmed) {
      await cancelled();
      return;
    }

    const conf = await confirm(
      "Êtes vous sûr de vouloir modifier cette ligne ?",
      key,
    );
    if (!conf.isConfirmed) {
      await cancelled();
      return;
    }

    try {
      await schema.update(key, res.value);
      await loadTable(root);
      await ok("Ligne Modifiée");
    } catch (e) {
      await err(e.message || "Erreur modification");
      await loadTable(root);
    }
  }

  // ════════════════════════════════════════════════════════
  //  Popup suppression
  // ════════════════════════════════════════════════════════
  async function openDelete(root, key) {
    const schema = SCHEMAS[root._bddTable || "produit"];
    const conf = await confirm(
      "Êtes vous sûr de vouloir supprimer cette ligne ?",
      key,
    );
    if (!conf.isConfirmed) {
      await cancelled();
      return;
    }
    try {
      await schema.del(key);
      await loadTable(root);
      await ok("Ligne Supprimée");
    } catch (e) {
      await err(e.message || "Suppression impossible");
    }
  }

  // ════════════════════════════════════════════════════════
  //  onMount
  // ════════════════════════════════════════════════════════
  function onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;
    root._bddTable = "produit";

    root.querySelectorAll(".bdd-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        root
          .querySelectorAll(".bdd-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        root._bddTable = tab.dataset.table;
        const s = SCHEMAS[tab.dataset.table] || {};
        const addBtn = root.querySelector(".bdd-add-btn");
        if (addBtn) addBtn.style.display = s.canAdd ? "" : "none";
        void loadTable(root);
      });
    });

    root
      .querySelector(".bdd-add-btn")
      ?.addEventListener("click", () => void openAdd(root));

    root.querySelector(".bdd-tbody")?.addEventListener("click", (e) => {
      const eb = e.target.closest(".bdd-edit-btn");
      const db = e.target.closest(".bdd-del-btn");
      if (eb) void openEdit(root, eb.dataset.key);
      if (db) void openDelete(root, db.dataset.key);
    });

    void loadTable(root);
  }

  return { buildHTML, onMount };
})();

WM.register("gerant_bdd", {
  label: "Base de Données",
  icon: "",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return BddPanel.buildHTML();
  },
  onMount(id) {
    BddPanel.onMount(id);
  },
});
