/**
 * app.js — Point d'entrée
 * SESSION est injecté par PHP directement dans caisse.php / gerant.php
 * CAISSE_MODE est 'gerant' sur la vue gérant, undefined sur la vue employé
 */
const App = (() => {
  const isGerant =
    typeof CAISSE_MODE !== "undefined" && CAISSE_MODE === "gerant";

  function init() {
    State.set("employe", SESSION);

    // Horloge
    updateClock();
    setInterval(updateClock, 1000);

    // Main hand toggle sync
    const hand = State.get("hand");
    document.querySelectorAll(".hand-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.hand === hand);
    });

    // Charger les panels
    WM.applyLayout(hand);

    // Sur la caisse gérant, ouvrir uniquement les panels gérant
    if (isGerant) {
      WM.ajouterPanelsGerant();
    }

    // Recalage du layout par défaut sur redimensionnement
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const currentHand = State.get("hand");
        if (!WM.hasSavedLayout(currentHand)) {
          WM.applyLayout(currentHand);
        }
      }, 120);
    });
  }

  function updateClock() {
    const el = document.getElementById("clock");
    if (el) el.textContent = new Date().toLocaleTimeString("fr-FR");
  }

  function setHand(hand) {
    WM.applyLayout(hand);
  }
  function saveLayout() {
    WM.saveLayout();
  }
  function resetLayout() {
    WM.resetLayout();
  }

  // Ouvre la caisse gérant (depuis la caisse employé)
  function openGerant() {
    window.location.href = APP_BASE_URL + "/gerant";
  }

  // Bascule vers la caisse employé (depuis la caisse gérant)
  function switchCaisse() {
    window.location.href = APP_BASE_URL + "/caisse";
  }

  function deconnexion() {
    document.getElementById("confirm-overlay").style.display = "flex";
  }
  function closeConfirm() {
    document.getElementById("confirm-overlay").style.display = "none";
  }
  async function doDeconnexion() {
    closeConfirm();
    try {
      await Requetes.logout();
    } catch (_) {}
    window.location.href = APP_BASE_URL + "/connexion";
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeConfirm();
    });
  });

  return {
    setHand,
    saveLayout,
    resetLayout,
    openGerant,
    switchCaisse,
    deconnexion,
    closeConfirm,
    doDeconnexion,
  };
})();
