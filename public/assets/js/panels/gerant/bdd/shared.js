/** panels/gerant/bdd/shared.js */
(() => {
  const ns = (window.BddPanelModules = window.BddPanelModules || {});

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

const ICON_LOCK = `<svg class="bdd-icon bdd-icon--lock" viewBox="0 0 16 16" fill="none">
  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
  <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;
const ICON_PIN = `<svg class="bdd-icon" viewBox="0 0 16 16" fill="none">
  <path d="M5 2.5H11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M6 2.5V6L4 8V9H12V8L10 6V2.5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M8 9V13.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;
const BDD_PIN_STORAGE_KEY = "bdd_pinned_tables_v1";

// Tables dont les lignes peuvent être verrouillées par journée validée
const LOCKED_TABLES = new Set([
  "transaction",
  "transaction_produit",
  "transaction_energie",
  "recu",
  "fiche_incident",
]);

// Cache des dates verrouillées — 2 sets séparés
let _lockedTx = null;
let _lockedInc = null;
let _lockedDatesPromise = null;

async function getLockedDates() {
  if (_lockedTx !== null) return { tx: _lockedTx, inc: _lockedInc };
  if (_lockedDatesPromise) return _lockedDatesPromise;
  _lockedDatesPromise = Requetes.getJourneesValidees()
    .then(function (d) {
      _lockedTx = new Set(d.dates_tx || []);
      _lockedInc = new Set(d.dates_inc || []);
      _lockedDatesPromise = null;
      return { tx: _lockedTx, inc: _lockedInc };
    })
    .catch(function () {
      _lockedDatesPromise = null;
      return { tx: new Set(), inc: new Set() };
    });
  return _lockedDatesPromise;
}

function invalidateLockedDates() {
  _lockedTx = null;
  _lockedInc = null;
  _lockedDatesPromise = null;
}

function readPinnedTables() {
  try {
    const raw = localStorage.getItem(BDD_PIN_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => String(value || "").trim())
      .filter((value, index, array) => value && array.indexOf(value) === index);
  } catch (_) {
    return [];
  }
}

function writePinnedTables(ids) {
  try {
    localStorage.setItem(BDD_PIN_STORAGE_KEY, JSON.stringify(ids || []));
  } catch (_) {}
}

function isPinnedTable(tableId) {
  return readPinnedTables().includes(String(tableId || ""));
}

function togglePinnedTable(tableId) {
  const id = String(tableId || "").trim();
  if (!id) return false;

  const pinned = readPinnedTables();
  const index = pinned.indexOf(id);
  if (index >= 0) {
    pinned.splice(index, 1);
    writePinnedTables(pinned);
    return false;
  }

  pinned.push(id);
  writePinnedTables(pinned);
  return true;
}

function sortGroups(groups) {
  const pinned = new Set(readPinnedTables());
  const collator = new Intl.Collator("fr", {
    sensitivity: "base",
    numeric: true,
  });

  return [...(groups || [])].sort((a, b) => {
    const aPinned = pinned.has(String(a?.id || ""));
    const bPinned = pinned.has(String(b?.id || ""));
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return collator.compare(String(a?.label || ""), String(b?.label || ""));
  });
}

function rowDate(tableId, row) {
  if (tableId === "transaction") return (row.date_heure || "").slice(0, 10);
  if (tableId === "transaction_produit") return null; // pas de date dans la row — géré via join côté PHP
  if (tableId === "transaction_energie") return null;
  if (tableId === "recu") return (row.horodatage || "").slice(0, 10);
  if (tableId === "fiche_incident") return row.date_creation || null;
  return null;
}
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
    confirmButtonText: "Fermer",
    allowOutsideClick: false,
  });
}
async function err(msg, title = "Erreur") {
  const safeHtml = esc(String(msg || "Erreur inconnue")).replaceAll("\n", "<br>");
  await Swal.fire({
    ...swalBase,
    icon: "error",
    title,
    html: safeHtml,
    confirmButtonText: "Fermer",
    allowOutsideClick: false,
  });
}
function extractErrorMessage(error) {
  if (error?.data?.message) return String(error.data.message);
  if (error?.message) return String(error.message);
  return "Une erreur inconnue est survenue.";
}
function isReferentialError(message) {
  const msg = String(message || "").toLowerCase();
  return (
    msg.includes("clé étrangère") ||
    msg.includes("cle etrangere") ||
    msg.includes("foreign key") ||
    msg.includes("référencé") ||
    msg.includes("reference")
  );
}
function isDuplicateError(message) {
  const msg = String(message || "").toLowerCase();
  return msg.includes("déjà existante") || msg.includes("deja existante") || msg.includes("unicité");
}
function actionLabel(action) {
  if (action === "add") return "Ajout";
  if (action === "edit") return "Modification";
  if (action === "delete") return "Suppression";
  return "Action";
}
function buildActionError(action, schema, error) {
  const raw = extractErrorMessage(error);
  const tableLabel = schema?.label || "table";
  const prefix = `${actionLabel(action)} impossible (${tableLabel}).`;

  if (isReferentialError(raw)) {
    return `${prefix}\nLa ligne est liée à d'autres enregistrements.\nSupprimez d'abord les dépendances ou utilisez une suppression en cascade quand elle est prévue.`;
  }
  if (isDuplicateError(raw)) {
    return `${prefix}\nLa valeur existe déjà (contrainte d'unicité).`;
  }
  if (raw.trim() === "") {
    return prefix;
  }
  return `${prefix}\n${raw}`;
}
async function cancelled() {
  // Annulation utilisateur volontaire : pas de popup.
  return;
}
async function confirm(msg, id) {
  const safeMsg = esc(String(msg || "")).replaceAll("\n", "<br>");
  return Swal.fire({
    ...swalBase,
    icon: "question",
    html: `<p class="bdd-confirm-msg">${safeMsg}</p><p class="bdd-confirm-ref">(Référence : Id ${esc(String(id))})</p>`,
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


  Object.assign(ns, {
    swalBase,
    ICON_EDIT,
    ICON_DELETE,
    ICON_LOCK,
    ICON_PIN,
    LOCKED_TABLES,
    BDD_PIN_STORAGE_KEY,
    getLockedDates,
    invalidateLockedDates,
    readPinnedTables,
    writePinnedTables,
    isPinnedTable,
    togglePinnedTable,
    sortGroups,
    rowDate,
    esc,
    fmt,
    bool,
    ok,
    err,
    extractErrorMessage,
    isReferentialError,
    isDuplicateError,
    actionLabel,
    buildActionError,
    cancelled,
    confirm,
  });
})();
