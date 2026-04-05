/**
 * app.js — Point d'entrée
 * SESSION est injecté par PHP directement dans caisse.php / gerant.php
 * CAISSE_MODE est 'gerant' sur la vue gérant, undefined sur la vue employé
 */
const App = (() => {
  const isGerantView =
    typeof CAISSE_MODE !== "undefined" && CAISSE_MODE === "gerant";
  const isGerantAccount =
    String(SESSION?.role ?? "").toLowerCase() === "gerant";
  let autoReapproInFlight = false;
  const autoReapproTabId =
    "reappro-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  const AUTO_REAPPRO_STORAGE_KEY = "unica_reappro_auto_ping";
  const AUTO_REAPPRO_PENDING_KEY = "unica_reappro_auto_pending";
  const AUTO_REAPPRO_CHANNEL_NAME = "unica-reappro-auto";
  const seenAutoReapproIds = new Set();
  let autoReapproChannel = null;
  let autoReapproPromptInFlight = false;

  function normalizeAutoReapproPayload(raw) {
    const created = Array.isArray(raw?.created) ? raw.created : [];
    return {
      id_reappro: Number(raw?.id_reappro ?? 0),
      created_count: Number(raw?.created_count ?? created.length ?? 0),
      created: created,
    };
  }

  function markAutoReapproSeen(idReappro) {
    const id = Number(idReappro || 0);
    if (id > 0) {
      seenAutoReapproIds.add(id);
    }
  }

  function hasSeenAutoReappro(idReappro) {
    const id = Number(idReappro || 0);
    return id > 0 && seenAutoReapproIds.has(id);
  }

  function dispatchAutoReapproChanged(payload) {
    const normalized = normalizeAutoReapproPayload(payload);
    window.dispatchEvent(
      new CustomEvent("reappro:changed", {
        detail: {
          type: "auto-create",
          id_reappro: normalized.id_reappro,
          created: normalized.created,
        },
      }),
    );
  }

  function readPendingAutoReappros() {
    try {
      const raw = localStorage.getItem(AUTO_REAPPRO_PENDING_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writePendingAutoReappros(map) {
    try {
      localStorage.setItem(
        AUTO_REAPPRO_PENDING_KEY,
        JSON.stringify(map || {}),
      );
    } catch (_) {}
  }

  function upsertPendingAutoReappro(payload) {
    const normalized = normalizeAutoReapproPayload(payload);
    if (normalized.id_reappro <= 0) return;
    const map = readPendingAutoReappros();
    map[String(normalized.id_reappro)] = {
      ...normalized,
      queued_at: Date.now(),
    };
    writePendingAutoReappros(map);
  }

  function removePendingAutoReappro(idReappro) {
    const id = Number(idReappro || 0);
    if (id <= 0) return;
    const map = readPendingAutoReappros();
    delete map[String(id)];
    writePendingAutoReappros(map);
  }

  async function drainPendingAutoReappros() {
    if (
      !isGerantAccount ||
      autoReapproPromptInFlight ||
      !ReapproPanel?.promptAutoReview
    ) {
      return;
    }

    const queue = Object.values(readPendingAutoReappros()).sort(function (a, b) {
      return Number(a?.queued_at ?? 0) - Number(b?.queued_at ?? 0);
    });

    if (!queue.length) return;

    autoReapproPromptInFlight = true;
    try {
      for (const item of queue) {
        const idReappro = Number(item?.id_reappro ?? 0);
        const currentMap = readPendingAutoReappros();
        if (!currentMap[String(idReappro)]) continue;

        const result = await ReapproPanel.promptAutoReview(item);
        if (
          result === "confirmed" ||
          result === "modified" ||
          result === "cancelled"
        ) {
          removePendingAutoReappro(idReappro);
          markAutoReapproSeen(idReappro);
        }
      }
    } finally {
      autoReapproPromptInFlight = false;
    }
  }

  async function showLocalAutoReapproAlert(payload) {
    if (isGerantAccount && ReapproPanel?.promptAutoReview) {
      await drainPendingAutoReappros();
      return;
    }
    if (ReapproPanel?.showEmployeThresholdNotice) {
      await ReapproPanel.showEmployeThresholdNotice(payload);
    }
  }

  async function handleRemoteAutoReappro(payload) {
    const normalized = normalizeAutoReapproPayload(payload);
    if (normalized.id_reappro <= 0 || hasSeenAutoReappro(normalized.id_reappro)) {
      return;
    }
    upsertPendingAutoReappro(normalized);
    dispatchAutoReapproChanged(normalized);

    if (isGerantAccount && ReapproPanel?.promptAutoReview) {
      await drainPendingAutoReappros();
    }
  }

  function broadcastAutoReappro(payload) {
    const normalized = normalizeAutoReapproPayload(payload);
    const message = {
      source: autoReapproTabId,
      type: "auto-reappro-created",
      ts: Date.now(),
      ...normalized,
    };

    try {
      if (!autoReapproChannel && typeof BroadcastChannel !== "undefined") {
        autoReapproChannel = new BroadcastChannel(AUTO_REAPPRO_CHANNEL_NAME);
      }
      autoReapproChannel?.postMessage(message);
    } catch (_) {}

    try {
      localStorage.setItem(AUTO_REAPPRO_STORAGE_KEY, JSON.stringify(message));
    } catch (_) {}
  }

  function initAutoReapproBridge() {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        autoReapproChannel = new BroadcastChannel(AUTO_REAPPRO_CHANNEL_NAME);
        autoReapproChannel.onmessage = function (event) {
          const payload = event?.data || null;
          if (!payload || payload.source === autoReapproTabId) return;
          if (payload.type !== "auto-reappro-created") return;
          void handleRemoteAutoReappro(payload);
        };
      } catch (_) {}
    }

    window.addEventListener("storage", function (event) {
      if (event.key !== AUTO_REAPPRO_STORAGE_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        if (!payload || payload.source === autoReapproTabId) return;
        if (payload.type !== "auto-reappro-created") return;
        void handleRemoteAutoReappro(payload);
      } catch (_) {}
    });

    if (isGerantAccount) {
      setTimeout(function () {
        void drainPendingAutoReappros();
      }, 0);

      window.addEventListener("focus", function () {
        void drainPendingAutoReappros();
      });

      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") {
          void drainPendingAutoReappros();
        }
      });
    }
  }

  async function verifierReapproAuto() {
    if (autoReapproInFlight) return;
    autoReapproInFlight = true;

    try {
      const result = normalizeAutoReapproPayload(await Requetes.creerReapproAuto());
      const created = result.created;
      const createdCount = result.created_count;

      if (createdCount > 0) {
        upsertPendingAutoReappro(result);
        if (isGerantAccount) {
          markAutoReapproSeen(result.id_reappro);
        }
        dispatchAutoReapproChanged(result);
        broadcastAutoReappro(result);
        await showLocalAutoReapproAlert(result);

        Toast.warn(
          "Réappro automatique lancé" +
            (createdCount > 1 ? "s" : "") +
            " : #" +
            Number(result.id_reappro || 0),
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
    initAutoReapproBridge();

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
    updateLayoutModeButtons();

    // Sur la caisse gérant, ouvrir uniquement les panels gérant
    if (isGerantView) {
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
    updateLayoutModeButtons();
  }
  function saveLayout() {
    WM.saveLayout();
  }
  function resetLayout() {
    WM.resetLayout();
    updateLayoutModeButtons();
  }

  function updateLayoutModeButtons() {
    const mode = WM.getLayoutMode?.() || "sandbox";
    document.querySelectorAll(".layout-mode-btn").forEach((btn) => {
      const isDragDrop = mode === "dragdrop";
      btn.textContent = isDragDrop ? "D&D" : "Sandbox";
      btn.title = isDragDrop
        ? "Mode Drag & Drop (emplacements prédéfinis)"
        : "Mode Sandbox (libre)";
      btn.classList.toggle("active", isDragDrop);
    });
  }

  function toggleLayoutMode() {
    WM.toggleLayoutMode?.();
    updateLayoutModeButtons();
    const isDragDrop = (WM.getLayoutMode?.() || "sandbox") === "dragdrop";
    Toast.ok(
      isDragDrop
        ? "Mode Drag & Drop activé"
        : "Mode Sandbox activé",
    );
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
    toggleLayoutMode,
    openGerant,
    switchCaisse,
    deconnexion,
    closeConfirm,
    doDeconnexion,
  };
})();
