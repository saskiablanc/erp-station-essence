/**
 * app.js — Point d'entrée
 * SESSION est injecté par PHP directement dans caisse.php / gerant.php
 * CAISSE_MODE est 'gerant' sur la vue gérant, undefined sur la vue employé
 */
const App = (() => {
  const isGerant =
    typeof CAISSE_MODE !== "undefined" && CAISSE_MODE === "gerant";
  let autoReapproInFlight = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatReapproQty(article) {
    const qty = Number(article?.volume ?? 0);
    const type = String(article?.type_article ?? "").toLowerCase();
    if (!Number.isFinite(qty)) return "0";
    if (type === "carburant" || type === "energie" || type === "electricite") {
      return `${qty.toFixed(3)} L`;
    }
    return String(Math.max(0, Math.trunc(qty)));
  }

  async function verifierReapproAuto() {
    if (autoReapproInFlight) return;
    autoReapproInFlight = true;

    try {
      const result = await Requetes.creerReapproAuto();
      const created = Array.isArray(result?.created) ? result.created : [];
      const createdCount = Number(result?.created_count ?? created.length ?? 0);

      if (createdCount > 0) {
        window.dispatchEvent(
          new CustomEvent("reappro:changed", {
            detail: {
              type: "auto-create",
              id_reappro: Number(result?.id_reappro ?? 0),
              created,
            },
          }),
        );

        const linesHtml = created
          .map(
            (article) => `
              <tr>
                <td style="text-align:left;padding:4px 10px 4px 0;">${escapeHtml(article?.nom_article || `#${article?.id_article || ""}`)}</td>
                <td style="text-align:right;padding:4px 0;">${escapeHtml(formatReapproQty(article))}</td>
              </tr>
            `,
          )
          .join("");

        await Swal.fire({
          icon: "warning",
          title: "Seuil d'alerte atteint",
          html: `
            <div style="text-align:left;font-size:13px;">
              Réapprovisionnement automatique lancé${createdCount > 1 ? "s" : ""}.
              <br><br>
              <b>N° Ordre :</b> #${escapeHtml(result?.id_reappro ?? "—")}<br>
              <b>Articles :</b> ${escapeHtml(createdCount)}<br><br>
              <table style="width:100%;font-size:12px;">
                <tr><th style="text-align:left;">Article</th><th style="text-align:right;">Qté</th></tr>
                ${linesHtml}
              </table>
            </div>
          `,
          confirmButtonText: "Fermer",
        });

        Toast.warn(
          "Réappro automatique lancé" +
            (createdCount > 1 ? "s" : "") +
            " : #" +
            Number(result?.id_reappro || 0),
        );
      }
    } catch (_) {
      // L'auto-réappro ne doit pas bloquer l'encaissement ou l'UI.
    } finally {
      autoReapproInFlight = false;
    }
  }

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

    window.addEventListener("caisse:payment:success", () => {
      void verifierReapproAuto();
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
