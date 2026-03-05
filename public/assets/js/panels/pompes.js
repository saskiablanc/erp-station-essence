/**
 * panels/pompes.js
 * WM.register('pompes')
 *
 * Layout : carburants (2/5) | electricite (3/5) — tout horizontal, sans scroll
 *
 * Dépendances (ordre <script> dans caisse.php) :
 *   core/state.js → core/requetes.js → core/toast.js → core/windows.js
 *   panels/carburant.js   → PompeCarburant  (IIFE globale)
 *   panels/electricite.js → PompeElectricite (IIFE globale)
 *   panels/pompes.js
 *
 * CSS : assets/css/pompes.css (chargé dans caisse.php via <link>)
 */

WM.register("pompes", {
  label: "Pompes",
  icon: "PMP",
  sprint: 3,

  buildHTML() {
    const carbHTML =
      typeof PompeCarburant !== "undefined"
        ? PompeCarburant.buildHTML()
        : '<p style="color:var(--danger);font-size:11px;">Erreur : carburant.js non charge</p>';

    const elecHTML =
      typeof PompeElectricite !== "undefined"
        ? PompeElectricite.buildHTML()
        : '<p style="color:var(--danger);font-size:11px;">Erreur : electricite.js non charge</p>';

    return `
      <div class="pompes-panel">

        <div class="pompes-body">

          <!-- ── CARBURANTS (2/5) ────────────────── -->
          <div class="pompes-col-carburant">
            <div class="pompes-section-label">
              CARBURANTS
              <span class="pompes-desact-badge" id="badge-carb"></span>
            </div>
            ${carbHTML}
          </div>

          <!-- ── ELECTRICITE (3/5) ───────────────── -->
          <div class="pompes-col-electricite">
            <div class="pompes-section-label">
              ELECTRICITE
              <span class="pompes-desact-badge" id="badge-elec"></span>
            </div>
            ${elecHTML}
          </div>

        </div>

        <!-- ── STATUT POLLING ──────────────────────── -->
        <div class="pompes-statusbar">
          <span class="pompes-statusbar-dot" id="pompes-dot"></span>
          <span id="pompes-statusbar-txt">Initialisation...</span>
          <button class="pompes-statusbar-refresh" onclick="PompesPanelRefresh()">Rafraichir</button>
        </div>

      </div>
    `;
  },

  onMount() {
    setTimeout(_demarrerPolling, 120);
  },
});

/* ── Polling ─────────────────────────────────────────────────── */
var _pollingTimer = null;
var _pollingRunning = false;
var POLLING_DELAY = 30000;

function _setStatus(state, txt) {
  var dot = document.getElementById("pompes-dot");
  var span = document.getElementById("pompes-statusbar-txt");
  if (!dot || !span) return;
  dot.className =
    "pompes-statusbar-dot" +
    (state === "loading" ? " loading" : state === "error" ? " error" : "");
  span.textContent = txt;
}

function _majBadges(nbCarb, nbElec) {
  var bc = document.getElementById("badge-carb");
  var be = document.getElementById("badge-elec");
  if (bc) {
    bc.textContent = nbCarb;
    bc.classList.toggle("visible", nbCarb > 0);
  }
  if (be) {
    be.textContent = nbElec;
    be.classList.toggle("visible", nbElec > 0);
  }
}

async function _fetchEtMajAffichage() {
  if (_pollingRunning) return;
  _pollingRunning = true;
  _setStatus("loading", "Mise a jour...");
  try {
    var data = await Requetes.getPompes();
    var carburant = data.filter(function (p) {
      return p.type_pompe === "carburant";
    });
    var electricite = data.filter(function (p) {
      return p.type_pompe === "electricite";
    });

    if (typeof PompeCarburant !== "undefined") PompeCarburant.onData(carburant);
    if (typeof PompeElectricite !== "undefined")
      PompeElectricite.onData(electricite);

    _majBadges(
      carburant.filter(function (p) {
        return p.statut === "desactivee";
      }).length,
      electricite.filter(function (p) {
        return p.statut === "desactivee";
      }).length,
    );

    var now = new Date();
    var hms = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(function (v) {
        return String(v).padStart(2, "0");
      })
      .join(":");
    _setStatus("ok", "Mis a jour a " + hms);
  } catch (e) {
    _setStatus("error", "Erreur reseau - " + e.message);
  } finally {
    _pollingRunning = false;
  }
}

function _demarrerPolling() {
  _fetchEtMajAffichage();
  if (_pollingTimer) clearInterval(_pollingTimer);
  _pollingTimer = setInterval(_fetchEtMajAffichage, POLLING_DELAY);
}

function PompesPanelRefresh() {
  _fetchEtMajAffichage();
}
