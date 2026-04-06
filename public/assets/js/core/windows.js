/**
 * core/windows.js — Gestionnaire de fenêtres mosaïque
 * Layout calqué sur la maquette fil de fer
 */
const WM = (() => {
  const PANELS = {};
  let dragDropSortable = null;

  const EMPLOYE_LAYOUT_VERSION = "v6";
  const GERANT_LAYOUT_VERSION = "v7";
  const HAND_STORAGE_KEY = "caisse_hand_v2";
  const LAYOUT_MODE_STORAGE_PREFIX = "caisse_layout_mode_v1";
  const LAYOUT_MODE_STORAGE_KEY = `${LAYOUT_MODE_STORAGE_PREFIX}_shared`;
  const LAYOUT_MODE_SANDBOX = "sandbox";
  const LAYOUT_MODE_DRAGDROP = "dragdrop";
  const LAYOUT_SLOT_OVERRIDES_PREFIX = "caisse_layout_slots_v1";
  const flipHand = (hand) => (hand === "left" ? "right" : "left");
  const isGerantMode = () =>
    typeof CAISSE_MODE !== "undefined" && CAISSE_MODE === "gerant";
  const getLayoutVersion = () =>
    isGerantMode() ? GERANT_LAYOUT_VERSION : EMPLOYE_LAYOUT_VERSION;
  const getLegacyLayoutModeStorageKey = () =>
    `${LAYOUT_MODE_STORAGE_PREFIX}_${isGerantMode() ? "gerant" : "employe"}`;
  const getLayoutModeStorageKey = () => LAYOUT_MODE_STORAGE_KEY;
  const getLayoutSlotOverridesStorageKey = (hand) =>
    `${LAYOUT_SLOT_OVERRIDES_PREFIX}_${getLayoutVersion()}_${flipHand(hand)}`;
  const normalizeLayoutMode = (mode) =>
    mode === LAYOUT_MODE_DRAGDROP ? LAYOUT_MODE_DRAGDROP : LAYOUT_MODE_SANDBOX;

  function getLayoutMode() {
    const shared = localStorage.getItem(getLayoutModeStorageKey());
    if (shared) return normalizeLayoutMode(shared);

    // Migration douce des anciens modes stockés par rôle vers une clé partagée.
    const legacy = localStorage.getItem(getLegacyLayoutModeStorageKey());
    const resolved = normalizeLayoutMode(legacy || LAYOUT_MODE_SANDBOX);
    localStorage.setItem(getLayoutModeStorageKey(), resolved);
    return resolved;
  }

  function isDragDropMode() {
    return getLayoutMode() === LAYOUT_MODE_DRAGDROP;
  }

  function canUseSortableDragDrop() {
    return typeof window !== "undefined" && typeof window.Sortable !== "undefined";
  }

  function useSortableDragDrop() {
    // En D&D, on conserve le moteur de déplacement "sandbox-like" (interact.js)
    // pour une sensation plus directe au drag.
    return false;
  }

  function syncLayoutModeClass() {
    document.body.classList.toggle("layout-mode-dragdrop", isDragDropMode());
  }

  function setLayoutMode(mode) {
    const next = normalizeLayoutMode(mode);
    localStorage.setItem(getLayoutModeStorageKey(), next);
    syncLayoutModeClass();
    if (next !== LAYOUT_MODE_DRAGDROP) {
      clearDragDropHints();
    }
    ensureSortableDragDropEngine();
    syncInteractDragState();
    updateResizeHandlesForAllWindows();
    return next;
  }

  function readDragDropSlotOverrides(hand = State.get("hand")) {
    try {
      const raw = localStorage.getItem(getLayoutSlotOverridesStorageKey(hand));
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return {};
      return parsed;
    } catch (_) {
      return {};
    }
  }

  function writeDragDropSlotOverrides(overrides, hand = State.get("hand")) {
    try {
      localStorage.setItem(
        getLayoutSlotOverridesStorageKey(hand),
        JSON.stringify(overrides || {}),
      );
    } catch (_) {}
  }

  const LAYOUT_METRICS = {
    margin: 6,
    gap: 6,
    mainAreaPct: 0.86,
    topSplitPct: 0.66,
    rowTopPct: 0.56,
  };

  const BASE_LAYOUTS = {
    right: {
      ticket: { x: 10, y: 10, w: 520, h: 420 },
      stock: { x: 536, y: 10, w: 268, h: 420 },
      pompes: { x: 10, y: 440, w: 794, h: 320 },
      cce_create: { x: 810, y: 10, w: 160, h: 420 },
      cce_consult: { x: 810, y: 440, w: 160, h: 320 },
      clavier: { x: 620, y: 10, w: 260, h: 310 },
      paiement: { x: 620, y: 330, w: 260, h: 280 },
      transactions: { x: 900, y: 10, w: 280, h: 380 },
      alertes: { x: 900, y: 400, w: 280, h: 200 },
    },
    left: {
      ticket: { x: 450, y: 10, w: 520, h: 420 },
      stock: { x: 176, y: 10, w: 268, h: 420 },
      pompes: { x: 176, y: 440, w: 794, h: 320 },
      cce_create: { x: 10, y: 10, w: 160, h: 420 },
      cce_consult: { x: 10, y: 440, w: 160, h: 320 },
      clavier: { x: 100, y: 10, w: 260, h: 310 },
      paiement: { x: 100, y: 330, w: 260, h: 280 },
      transactions: { x: 10, y: 10, w: 280, h: 380 },
      alertes: { x: 10, y: 400, w: 280, h: 200 },
    },
  };

  function mirrorLayout(layout, leftBound, rightBound) {
    const width = rightBound - leftBound;
    const mirrored = {};
    Object.keys(layout).forEach((id) => {
      const pos = layout[id];
      mirrored[id] = {
        ...pos,
        x: Math.round(leftBound + (width - (pos.x - leftBound) - pos.w)),
      };
    });
    return mirrored;
  }

  function computeLayout(hand) {
    if (isGerantMode()) {
      return computeLayoutGerant(hand);
    }
    return computeLayoutEmploye(hand);
  }

  function computeLayoutGerant(hand) {
    const canvas = document.getElementById("canvas");
    if (!canvas) return {};

    const rect = canvas.getBoundingClientRect();
    const W = Math.max(900, rect.width);
    const H = Math.max(600, rect.height);

    const m = 6;
    const g = 5;
    const totalH = H - m * 2 - g * 2;

    const row1H = Math.round(totalH * 0.4104);
    const row2H = Math.round(totalH * 0.3281);
    const row3H = totalH - row1H - row2H;
    const y0 = m;
    const y1 = y0 + row1H + g;
    const y2 = y1 + row2H + g;

    const r1ReapW = Math.round(W * 0.3824);
    const r1IncW = Math.round(W * 0.2243);
    const r1DefW = W - m * 2 - g * 2 - r1ReapW - r1IncW;
    const xReap = m;
    const xDef = xReap + r1ReapW + g;
    const xInc = xDef + r1DefW + g;

    const xPrix = m;
    const xCce = Math.round(W * 0.2345);
    const xMan = Math.round(W * 0.439);
    const xVal = Math.round(W * 0.6823);
    const xDoc = Math.round(W * 0.8269);
    const r2PrixW = xCce - g - xPrix;
    const r2CceW = xMan - g - xCce;
    const r2ManW = xVal - g - xMan;
    const r2ValW = xDoc - g - xVal;
    const r2DocW = W - m - xDoc;
    const rcDocsH = Math.round(row2H * 0.49);
    const rcDirH = row2H - rcDocsH - g;

    const r3FermW = Math.round(W * 0.3211);
    const r3HorW = Math.round(W * 0.2918);
    const r3BddW = W - m * 2 - g * 2 - r3FermW - r3HorW;
    const xFerm = m;
    const xHor = xFerm + r3FermW + g;
    const xBdd = xHor + r3HorW + g;

    const right = {
      gerant_reappro: { x: xReap, y: y0, w: r1ReapW, h: row1H },
      gerant_reappro_defauts: { x: xDef, y: y0, w: r1DefW, h: row1H },
      gerant_incidents: { x: xInc, y: y0, w: r1IncW, h: row1H },
      gerant_prix: { x: xPrix, y: y1, w: r2PrixW, h: row2H },
      gerant_cce_params: { x: xCce, y: y1, w: r2CceW, h: row2H },
      gerant_reappro_manuel: { x: xMan, y: y1, w: r2ManW, h: row2H },
      gerant_validation: { x: xVal, y: y1, w: r2ValW, h: row2H },
      gerant_docs_gestion: { x: xDoc, y: y1, w: r2DocW, h: rcDocsH },
      gerant_directives: { x: xDoc, y: y1 + rcDocsH + g, w: r2DocW, h: rcDirH },
      gerant_fermetures: { x: xFerm, y: y2, w: r3FermW, h: row3H },
      gerant_horaires: { x: xHor, y: y2, w: r3HorW, h: row3H },
      gerant_bdd: { x: xBdd, y: y2, w: r3BddW, h: row3H },
    };

    return hand === "left" ? mirrorLayout(right, m, W - m) : right;
  }

  function computeLayoutEmploye(hand) {
    const canvas = document.getElementById("canvas");
    if (!canvas) return BASE_LAYOUTS[hand];

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return BASE_LAYOUTS[hand];

    const { margin, gap, mainAreaPct, topSplitPct, rowTopPct } = LAYOUT_METRICS;

    const availW = Math.max(640, rect.width - margin * 2);
    const availH = Math.max(480, rect.height - margin * 2);

    const mainW = Math.round((availW - gap) * mainAreaPct);
    const sideW = availW - gap - mainW;
    const topLeftW = Math.round((mainW - gap) * topSplitPct);
    const topMiddleW = mainW - gap - topLeftW;
    const rowTop = Math.round((availH - gap) * rowTopPct);
    const rowBottom = availH - gap - rowTop;

    const leftX = margin;
    const sideX = margin + mainW + gap;
    const topY = margin;
    const bottomY = margin + rowTop + gap;

    const right = {
      ticket: { x: leftX, y: topY, w: topLeftW, h: rowTop },
      stock: { x: leftX + topLeftW + gap, y: topY, w: topMiddleW, h: rowTop },
      pompes: { x: leftX, y: bottomY, w: mainW, h: rowBottom },
      cce_create: { x: sideX, y: topY, w: sideW, h: rowTop },
      cce_consult: { x: sideX, y: bottomY, w: sideW, h: rowBottom },
    };

    const computed =
      hand === "left" ? mirrorLayout(right, leftX, leftX + availW) : right;

    const base = BASE_LAYOUTS[hand] || {};
    return { ...base, ...computed };
  }

  const DEFAULT_VISIBLE_EMPLOYE = [
    "ticket",
    "stock",
    "pompes",
    "cce_create",
    "cce_consult",
  ];
  const DEFAULT_VISIBLE_GERANT = [
    "gerant_reappro",
    "gerant_reappro_defauts",
    "gerant_incidents",
    "gerant_prix",
    "gerant_cce_params",
    "gerant_reappro_manuel",
    "gerant_validation",
    "gerant_docs_gestion",
    "gerant_directives",
    "gerant_fermetures",
    "gerant_horaires",
    "gerant_bdd",
  ];

  function getDefaultVisible() {
    if (isGerantMode()) {
      return DEFAULT_VISIBLE_GERANT;
    }
    return DEFAULT_VISIBLE_EMPLOYE;
  }

  function register(id, def) {
    PANELS[id] = def;
  }

  function getMaxViewportBounds() {
    return {
      maxW: Math.max(320, Math.floor(window.innerWidth * 0.94)),
      maxH: Math.max(240, Math.floor(window.innerHeight * 0.9)),
    };
  }

  function fitMaximizedWindow(el) {
    if (!el || !el._maxOverlay) return;

    const def = PANELS[el.dataset.id] || {};
    const title = el.querySelector(".win-title");
    const body = el.querySelector(".win-body");
    if (!title || !body) return;

    const { maxW, maxH } = getMaxViewportBounds();
    const contentRoot = body.firstElementChild;

    el.style.maxWidth = maxW + "px";
    el.style.maxHeight = maxH + "px";
    el.style.width = "auto";
    el.style.height = "auto";

    const prevOverflow = body.style.overflow;
    body.style.overflow = "visible";

    const contentWidth = Math.max(
      el.scrollWidth,
      title.scrollWidth + 24,
      body.scrollWidth,
      contentRoot?.scrollWidth || 0,
    );
    const minWidth = Math.max(320, Number(def.fullscreenMinWidth || 0));
    const targetWidth = Math.min(maxW, Math.max(minWidth, Math.ceil(contentWidth)));

    const contentHeight = Math.max(
      el.scrollHeight,
      title.offsetHeight + body.scrollHeight,
      title.offsetHeight + (contentRoot?.scrollHeight || 0),
    );
    const minHeight = Math.max(160, Number(def.fullscreenMinHeight || 0));
    const targetHeight = Math.min(maxH, Math.max(minHeight, Math.ceil(contentHeight)));

    el._maxFitWidth = targetWidth;
    el._maxFitHeight = targetHeight;
    el.style.width = targetWidth + "px";
    el.style.height = targetHeight + "px";
    body.style.overflow = prevOverflow;
  }

  function unbindMaximizedFit(el) {
    if (!el) return;
    if (el._maxFitRaf) {
      cancelAnimationFrame(el._maxFitRaf);
      el._maxFitRaf = null;
    }
    if (el._maxResizeObserver) {
      el._maxResizeObserver.disconnect();
      el._maxResizeObserver = null;
    }
    if (el._maxMutationObserver) {
      el._maxMutationObserver.disconnect();
      el._maxMutationObserver = null;
    }
    if (el._maxWindowResizeHandler) {
      window.removeEventListener("resize", el._maxWindowResizeHandler);
      el._maxWindowResizeHandler = null;
    }
    el._maxFitWidth = null;
    el._maxFitHeight = null;
  }

  // ── Maximize / Restore ───────────────────────────────────
  function maximize(id) {
    const el = document.getElementById("win-" + id);
    if (!el) return;

    // Si déjà maximisé → restaurer
    if (el._maxOverlay) {
      restoreFromMax(id);
      return;
    }

    // ── Sauvegarder l'état courant ──
    el._maxPrevStyle = el.style.cssText;
    el._maxPrevParent = el.parentNode;
    el._maxPrevDx = el.dataset.x || 0;
    el._maxPrevDy = el.dataset.y || 0;

    // ── Créer l'overlay ──
    const overlay = document.createElement("div");
    overlay.className = "wm-max-overlay";

    // Fermer au clic sur le fond (pas sur le panel)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) restoreFromMax(id);
    });

    document.body.appendChild(overlay);

    // ── Déplacer le .win dans l'overlay ──
    overlay.appendChild(el);
    el._maxOverlay = overlay;
    el.classList.add("maximized");

    // Style fullscreen responsive au contenu du panel
    el.style.cssText = [
      "position:relative",
      "width:auto",
      "height:auto",
      "max-width:94vw",
      "max-height:90vh",
      "z-index:auto",
      "transform:none",
    ].join(";");
    el.dataset.x = 0;
    el.dataset.y = 0;
    fitMaximizedWindow(el);

    // Remplacer le bouton min par un bouton fermer ✕
    const minBtn = el.querySelector(".wc.min");
    if (minBtn) {
      minBtn._maxPrevHTML = minBtn.innerHTML;
      minBtn._maxPrevTitle = minBtn.title;
      minBtn.innerHTML = "&#x2715;";
      minBtn.title = "Fermer";
      minBtn.classList.add("wc-max-close");
    }

    const maxBtn = el.querySelector(".wc.max");
    if (maxBtn) {
      maxBtn.setAttribute("title", "Restaurer");
      maxBtn.classList.add("active");
    }
  }

  function restoreFromMax(id) {
    const el = document.getElementById("win-" + id);
    if (!el || !el._maxOverlay) return;

    unbindMaximizedFit(el);

    const overlay = el._maxOverlay;
    const prevParent = el._maxPrevParent || document.getElementById("canvas");

    // Remettre le .win dans le canvas
    prevParent.appendChild(el);

    // Restaurer le style
    el.style.cssText = el._maxPrevStyle || "";
    el.dataset.x = el._maxPrevDx || 0;
    el.dataset.y = el._maxPrevDy || 0;
    el.classList.remove("maximized");

    // Restaurer le bouton min
    const minBtn = el.querySelector(".wc.min");
    if (minBtn && minBtn._maxPrevHTML !== undefined) {
      minBtn.innerHTML = minBtn._maxPrevHTML;
      minBtn.title = minBtn._maxPrevTitle || "Réduire";
      minBtn.classList.remove("wc-max-close");
      delete minBtn._maxPrevHTML;
      delete minBtn._maxPrevTitle;
    }

    const maxBtn = el.querySelector(".wc.max");
    if (maxBtn) {
      maxBtn.setAttribute("title", "Agrandir");
      maxBtn.classList.remove("active");
    }

    // Supprimer l'overlay
    overlay.remove();
    el._maxOverlay = null;
    delete el._maxPrevStyle;
    delete el._maxPrevParent;
    delete el._maxPrevDx;
    delete el._maxPrevDy;
  }

  function getLayoutStorageKey(hand, mode = getLayoutMode()) {
    const suffix = mode === LAYOUT_MODE_DRAGDROP ? "_dragdrop" : "";
    return "caisse_layout_" + getLayoutVersion() + "_" + flipHand(hand) + suffix;
  }

  function getSlotTemplateForCurrentHand() {
    const hand = State.get("hand");
    const base = computeLayout(flipHand(hand)) || {};
    const overrides = readDragDropSlotOverrides(hand);
    const slots = {};

    Object.keys(base).forEach((slotId) => {
      const b = base[slotId];
      const ov = overrides?.[slotId];
      slots[slotId] = {
        x: Number.isFinite(Number(ov?.x)) ? Number(ov.x) : b.x,
        y: Number.isFinite(Number(ov?.y)) ? Number(ov.y) : b.y,
        w: Math.max(220, Number.isFinite(Number(ov?.w)) ? Number(ov.w) : b.w),
        h: Math.max(140, Number.isFinite(Number(ov?.h)) ? Number(ov.h) : b.h),
      };
    });

    return slots;
  }

  function getWindowAbsoluteRect(el) {
    const x = (parseFloat(el.style.left) || 0) + (parseFloat(el.dataset.x) || 0);
    const y = (parseFloat(el.style.top) || 0) + (parseFloat(el.dataset.y) || 0);
    const w = parseFloat(el.style.width) || el.offsetWidth || 0;
    const h = parseFloat(el.style.height) || el.offsetHeight || 0;
    return { x, y, w, h };
  }

  function getWindowRectMetrics(el) {
    const { x, y, w, h } = getWindowAbsoluteRect(el);
    return { cx: x + w / 2, cy: y + h / 2 };
  }

  function getClosestSlotId(el, slots, used = new Set()) {
    const rect = getWindowRectMetrics(el);
    let closestId = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    Object.keys(slots).forEach((slotId) => {
      if (used.has(slotId)) return;
      const slot = slots[slotId];
      const dx = rect.cx - (slot.x + slot.w / 2);
      const dy = rect.cy - (slot.y + slot.h / 2);
      const dist = dx * dx + dy * dy;
      if (dist < bestDistance) {
        bestDistance = dist;
        closestId = slotId;
      }
    });

    return closestId;
  }

  function getClosestSlotIdToPoint(point, slots, used = new Set()) {
    if (!point || !slots) return null;
    let closestId = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    Object.keys(slots).forEach((slotId) => {
      if (used.has(slotId)) return;
      const slot = slots[slotId];
      const dx = point.x - (slot.x + slot.w / 2);
      const dy = point.y - (slot.y + slot.h / 2);
      const dist = dx * dx + dy * dy;
      if (dist < bestDistance) {
        bestDistance = dist;
        closestId = slotId;
      }
    });

    return closestId;
  }

  function getIntersectionArea(a, b) {
    const left = Math.max(a.x, b.x);
    const top = Math.max(a.y, b.y);
    const right = Math.min(a.x + a.w, b.x + b.w);
    const bottom = Math.min(a.y + a.h, b.y + b.h);
    const w = right - left;
    const h = bottom - top;
    if (w <= 0 || h <= 0) return 0;
    return w * h;
  }

  function getBestSlotIdByOverlap(el, slots, used = new Set()) {
    if (!el || !slots) return null;
    const winRect = getWindowAbsoluteRect(el);
    const winCenter = getWindowRectMetrics(el);
    let bestSlotId = null;
    let bestArea = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    Object.keys(slots).forEach((slotId) => {
      if (used.has(slotId)) return;
      const slot = slots[slotId];
      const area = getIntersectionArea(winRect, slot);
      const dx = winCenter.cx - (slot.x + slot.w / 2);
      const dy = winCenter.cy - (slot.y + slot.h / 2);
      const dist = dx * dx + dy * dy;

      if (area > bestArea || (area === bestArea && dist < bestDistance)) {
        bestArea = area;
        bestDistance = dist;
        bestSlotId = slotId;
      }
    });

    if (bestArea > 0) return bestSlotId;
    return getClosestSlotId(el, slots, used);
  }

  function resolveDragDropTargetSlotId(el, slots, pointerPoint, fallbackSlotId) {
    if (!el || !slots) return null;

    // 1. Si la souris est clairement dans un slot, on respecte cette intention.
    const pointerSlotId = getSlotIdAtCanvasPoint(pointerPoint, slots);
    if (pointerSlotId) return pointerSlotId;

    // 2. Si la souris est proche d'un slot, on s'en sert pour aider sur les petits panneaux.
    const closestToPointer = getClosestSlotIdToPoint(pointerPoint, slots);
    if (closestToPointer) return closestToPointer;

    // 3. Sinon, on se base sur le panel lui-même.
    const byOverlap = getBestSlotIdByOverlap(el, slots);
    if (byOverlap) return byOverlap;

    // 4. Dernier recours : on garde l'ancien slot.
    if (fallbackSlotId && slots[fallbackSlotId]) return fallbackSlotId;

    return null;
  }

  function getClientPointFromEvent(evt) {
    if (!evt) return null;
    const clientFromInteract = evt.interaction?.coords?.cur?.client;
    const clientX = Number(
      evt.clientX ??
        evt.client?.x ??
        clientFromInteract?.x ??
        evt.x ??
        (Number.isFinite(Number(evt.pageX)) ? Number(evt.pageX) - window.scrollX : NaN),
    );
    const clientY = Number(
      evt.clientY ??
        evt.client?.y ??
        clientFromInteract?.y ??
        evt.y ??
        (Number.isFinite(Number(evt.pageY)) ? Number(evt.pageY) - window.scrollY : NaN),
    );
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
    return { x: clientX, y: clientY };
  }

  function getCanvasPointFromEvent(evt) {
    const clientPoint = getClientPointFromEvent(evt);
    if (!clientPoint) return null;
    const canvas = document.getElementById("canvas");
    if (!canvas) return null;
    const canvasRect = canvas.getBoundingClientRect();
    return {
      x: clientPoint.x - canvasRect.left,
      y: clientPoint.y - canvasRect.top,
    };
  }

  function getSlotIdAtCanvasPoint(point, slots) {
    if (!point) return null;
    const ids = Object.keys(slots || {});
    for (const slotId of ids) {
      const slot = slots[slotId];
      if (!slot) continue;
      const inX = point.x >= slot.x && point.x <= slot.x + slot.w;
      const inY = point.y >= slot.y && point.y <= slot.y + slot.h;
      if (inX && inY) return slotId;
    }
    return null;
  }

  function placeWindowInSlot(el, slotId, slots) {
    const slot = slots?.[slotId];
    if (!slot || !el) return;
    el.style.left = slot.x + "px";
    el.style.top = slot.y + "px";
    el.style.width = slot.w + "px";
    el.style.height = slot.h + "px";
    el.style.transform = "translate(0px,0px)";
    el.dataset.x = 0;
    el.dataset.y = 0;
    el.dataset.slotId = slotId;
  }

  function getSlotPreviewEl() {
    const canvas = document.getElementById("canvas");
    if (!canvas) return null;
    let preview = canvas.querySelector(".wm-slot-preview");
    if (!preview) {
      preview = document.createElement("div");
      preview.className = "wm-slot-preview";
      canvas.appendChild(preview);
    }
    return preview;
  }

  function showSlotPreview(slotId, slots, isSwap) {
    const slot = slots?.[slotId];
    if (!slot) return;
    const preview = getSlotPreviewEl();
    if (!preview) return;
    preview.style.left = slot.x + "px";
    preview.style.top = slot.y + "px";
    preview.style.width = slot.w + "px";
    preview.style.height = slot.h + "px";
    preview.classList.toggle("is-swap", !!isSwap);
    preview.classList.add("is-visible");
  }

  function clearSlotPreview() {
    document.querySelector(".wm-slot-preview")?.remove();
  }

  function clearDragDropHints() {
    document.querySelectorAll(".win").forEach((w) => {
      w.classList.remove("win-dd-source", "win-dd-swap-candidate");
    });
    clearSlotPreview();
  }

  function elevateDraggingWindow(el) {
    if (!el) return;
    if (el.dataset.ddPrevZ === undefined) {
      el.dataset.ddPrevZ = el.style.zIndex || "";
    }
    el.style.zIndex = String((State.all().zTop || 100) + 5000);
  }

  function restoreDraggingWindowZ(el) {
    if (!el) return;
    if (el.dataset.ddPrevZ === undefined) return;
    const prev = el.dataset.ddPrevZ;
    if (prev === "") el.style.removeProperty("z-index");
    else el.style.zIndex = prev;
    delete el.dataset.ddPrevZ;
  }

  function cleanupDragDropState(el) {
    if (!el) return;
    el._ddPointer = null;
    el._ddTargetSlotId = null;
    el._ddOriginSlotId = null;
    if (el._ddPointerMoveHandler) {
      window.removeEventListener("pointermove", el._ddPointerMoveHandler, true);
      el._ddPointerMoveHandler = null;
    }
  }

  function updateDragDropHints(sourceEl, evt = null) {
    if (!isDragDropMode() || !sourceEl) return;

    const slots = getSlotTemplateForCurrentHand();
    const pointerPoint = getCanvasPointFromEvent(evt) || sourceEl._ddPointer || null;

    const sourceSlotId =
      sourceEl.dataset.slotId && slots[sourceEl.dataset.slotId]
        ? sourceEl.dataset.slotId
        : null;

    const fallbackSlotId =
      (sourceEl._ddOriginSlotId &&
        slots[sourceEl._ddOriginSlotId] &&
        sourceEl._ddOriginSlotId) ||
      sourceSlotId ||
      sourceEl._ddTargetSlotId ||
      null;

    const targetSlotId = resolveDragDropTargetSlotId(
      sourceEl,
      slots,
      pointerPoint,
      fallbackSlotId,
    );

    if (!sourceEl.classList.contains("win-dd-source")) {
      sourceEl.classList.add("win-dd-source");
    }

    document.querySelectorAll(".win-dd-swap-candidate").forEach((node) => {
      node.classList.remove("win-dd-swap-candidate");
    });

    if (!targetSlotId) {
      sourceEl._ddTargetSlotId = null;
      clearSlotPreview();
      return;
    }

    sourceEl._ddTargetSlotId = targetSlotId;

    const occupant = [...document.querySelectorAll(".win")].find(
      (other) => other !== sourceEl && other.dataset.slotId === targetSlotId,
    );

    const willSwap = !!occupant && targetSlotId !== sourceSlotId;

    if (occupant) {
      occupant.classList.add("win-dd-swap-candidate");
    }

    showSlotPreview(targetSlotId, slots, willSwap);
  }

  function ensureSortableDragDropEngine() {
    const canvas = document.getElementById("canvas");
    if (!canvas || !canUseSortableDragDrop() || !useSortableDragDrop()) {
      if (dragDropSortable) {
        dragDropSortable.option("disabled", true);
      }
      return;
    }

    if (!dragDropSortable) {
      dragDropSortable = window.Sortable.create(canvas, {
        draggable: ".win",
        handle: ".win-title",
        animation: 0,
        forceFallback: true,
        fallbackOnBody: true,
        fallbackTolerance: 0,
        delay: 0,
        touchStartThreshold: 1,
        fallbackClass: "wm-sortable-fallback",
        disabled: !isDragDropMode(),
        onStart(evt) {
          if (!isDragDropMode()) return;
          const el = evt.item;
          if (!el) return;
          el._ddOriginSlotId = el.dataset.slotId || null;
          el._ddTargetSlotId = null;
          el._ddPointer = getCanvasPointFromEvent(evt.originalEvent) || null;
          el._ddClientPointer = getClientPointFromEvent(evt.originalEvent) || null;
          updateDragDropHints(el, evt.originalEvent);
        },
        onMove(evt, originalEvent) {
          if (!isDragDropMode()) return false;
          const sourceEl = evt.dragged;
          if (!sourceEl) return false;
          sourceEl._ddPointer =
            getCanvasPointFromEvent(originalEvent) || sourceEl._ddPointer || null;
          sourceEl._ddClientPointer =
            getClientPointFromEvent(originalEvent) || sourceEl._ddClientPointer || null;
          updateDragDropHints(sourceEl, originalEvent);
          // Laisser Sortable suivre la souris sans blocage.
          return true;
        },
        onEnd(evt) {
          const el = evt.item;
          if (!el) return;
          if (!isDragDropMode()) {
            cleanupDragDropState(el);
            clearDragDropHints();
            return;
          }
          snapWindowToNearestSlot(el, evt.originalEvent, el._ddTargetSlotId);
          cleanupDragDropState(el);
        },
      });
      return;
    }

    dragDropSortable.option("disabled", !isDragDropMode());
  }

  function syncInteractDragState() {
    const disableInteractDrag =
      isDragDropMode() && canUseSortableDragDrop() && useSortableDragDrop();
    document.querySelectorAll(".win").forEach((el) => {
      try {
        interact(el).draggable({ enabled: !disableInteractDrag });
      } catch (_) {}
    });
  }

  function persistDragDropLayout() {
    const hand = State.get("hand");
    const slots = getSlotTemplateForCurrentHand();
    const items = [];
    document.querySelectorAll(".win").forEach((el) => {
      const slotId =
        el.dataset.slotId && slots[el.dataset.slotId]
          ? el.dataset.slotId
          : slots[el.dataset.id]
            ? el.dataset.id
            : getClosestSlotId(el, slots) || null;
      items.push({ id: el.dataset.id, slotId });
    });
    localStorage.setItem(
      getLayoutStorageKey(hand, LAYOUT_MODE_DRAGDROP),
      JSON.stringify(items),
    );
  }

  function getSlotsBounds(slots) {
    const ids = Object.keys(slots || {});
    if (!ids.length) return null;
    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;
    ids.forEach((id) => {
      const s = slots[id];
      left = Math.min(left, s.x);
      top = Math.min(top, s.y);
      right = Math.max(right, s.x + s.w);
      bottom = Math.max(bottom, s.y + s.h);
    });
    return { left, top, right, bottom };
  }

  function getLockedOuterEdges(slot, bounds) {
    const epsilon = 2;
    if (!slot || !bounds) {
      return { top: false, right: false, bottom: false, left: false };
    }
    return {
      left: Math.abs(slot.x - bounds.left) <= epsilon,
      right: Math.abs(slot.x + slot.w - bounds.right) <= epsilon,
      top: Math.abs(slot.y - bounds.top) <= epsilon,
      bottom: Math.abs(slot.y + slot.h - bounds.bottom) <= epsilon,
    };
  }

  function setHandleLocked(el, selector, locked) {
    el.querySelectorAll(selector).forEach((node) => {
      node.classList.toggle("is-locked-edge", !!locked);
    });
  }

  function updateResizeHandlesForWindow(el, slots = null, bounds = null) {
    if (!el) return;

    if (!isDragDropMode()) {
      setHandleLocked(el, ".win-resize-top", false);
      setHandleLocked(el, ".win-resize-right", false);
      setHandleLocked(el, ".win-resize-bottom", false);
      setHandleLocked(el, ".win-resize-left", false);
      setHandleLocked(el, ".win-resize-tl", false);
      setHandleLocked(el, ".win-resize-tr", false);
      setHandleLocked(el, ".win-resize-bl", false);
      setHandleLocked(el, ".win-resize-br", false);
      return;
    }

    const resolvedSlots = slots || getSlotTemplateForCurrentHand();
    const resolvedBounds = bounds || getSlotsBounds(resolvedSlots);
    const slotId = getWindowSlotId(el, resolvedSlots);
    const slot = slotId ? resolvedSlots[slotId] : null;
    const locked = getLockedOuterEdges(slot, resolvedBounds);

    setHandleLocked(el, ".win-resize-top", locked.top);
    setHandleLocked(el, ".win-resize-right", locked.right);
    setHandleLocked(el, ".win-resize-bottom", locked.bottom);
    setHandleLocked(el, ".win-resize-left", locked.left);
    setHandleLocked(el, ".win-resize-tl", locked.top || locked.left);
    setHandleLocked(el, ".win-resize-tr", locked.top || locked.right);
    setHandleLocked(el, ".win-resize-bl", locked.bottom || locked.left);
    setHandleLocked(el, ".win-resize-br", locked.bottom || locked.right);
  }

  function updateResizeHandlesForAllWindows(slots = null) {
    const resolvedSlots = slots || getSlotTemplateForCurrentHand();
    const bounds = getSlotsBounds(resolvedSlots);
    document.querySelectorAll(".win").forEach((el) => {
      updateResizeHandlesForWindow(el, resolvedSlots, bounds);
    });
  }

  function clampRectToBounds(rect, bounds) {
    const minW = 120;
    const minH = 90;
    const maxW = Math.max(minW, bounds.right - bounds.left);
    const maxH = Math.max(minH, bounds.bottom - bounds.top);
    const w = Math.min(Math.max(minW, rect.w), maxW);
    const h = Math.min(Math.max(minH, rect.h), maxH);
    const x = Math.min(Math.max(rect.x, bounds.left), bounds.right - w);
    const y = Math.min(Math.max(rect.y, bounds.top), bounds.bottom - h);
    return { x, y, w, h };
  }

  function lockOuterBoundEdges(current, rect, bounds) {
    const minW = 120;
    const minH = 90;
    const epsilon = 2;

    const lockLeft = Math.abs(current.x - bounds.left) <= epsilon;
    const lockRight =
      Math.abs(current.x + current.w - bounds.right) <= epsilon;
    const lockTop = Math.abs(current.y - bounds.top) <= epsilon;
    const lockBottom =
      Math.abs(current.y + current.h - bounds.bottom) <= epsilon;

    let left = rect.x;
    let right = rect.x + rect.w;
    let top = rect.y;
    let bottom = rect.y + rect.h;

    if (lockLeft) left = bounds.left;
    if (lockRight) right = bounds.right;
    if (lockTop) top = bounds.top;
    if (lockBottom) bottom = bounds.bottom;

    if (right - left < minW) {
      if (lockLeft && !lockRight) right = left + minW;
      else if (!lockLeft && lockRight) left = right - minW;
      else right = left + minW;
    }
    if (bottom - top < minH) {
      if (lockTop && !lockBottom) bottom = top + minH;
      else if (!lockTop && lockBottom) top = bottom - minH;
      else bottom = top + minH;
    }

    if (!lockLeft && !lockRight) {
      left = Math.min(Math.max(left, bounds.left), bounds.right - minW);
      right = Math.min(Math.max(right, left + minW), bounds.right);
    }
    if (!lockTop && !lockBottom) {
      top = Math.min(Math.max(top, bounds.top), bounds.bottom - minH);
      bottom = Math.min(Math.max(bottom, top + minH), bounds.bottom);
    }

    if (lockLeft) left = bounds.left;
    if (lockRight) right = bounds.right;
    if (lockTop) top = bounds.top;
    if (lockBottom) bottom = bounds.bottom;

    return {
      x: left,
      y: top,
      w: Math.max(minW, right - left),
      h: Math.max(minH, bottom - top),
    };
  }

  function buildAxisMapper(totalStart, totalEnd, oldStart, oldEnd, nextStart, nextEnd) {
    const mapSegment = (value, srcA, srcB, dstA, dstB) => {
      if (Math.abs(srcB - srcA) < 0.0001) return dstA;
      return dstA + ((value - srcA) * (dstB - dstA)) / (srcB - srcA);
    };

    return (coord) => {
      if (coord <= oldStart) {
        return mapSegment(coord, totalStart, oldStart, totalStart, nextStart);
      }
      if (coord >= oldEnd) {
        return mapSegment(coord, oldEnd, totalEnd, nextEnd, totalEnd);
      }
      return mapSegment(coord, oldStart, oldEnd, nextStart, nextEnd);
    };
  }

  function adaptSlotsAfterResize(slots, resizedSlotId, rawRect) {
    const current = slots?.[resizedSlotId];
    const bounds = getSlotsBounds(slots);
    if (!current || !bounds) return slots;
    const minSlotW = 160;
    const minSlotH = 110;

    const buildAdaptedSlots = (nextRect) => {
      const oldLeft = current.x;
      const oldRight = current.x + current.w;
      const oldTop = current.y;
      const oldBottom = current.y + current.h;
      const newLeft = nextRect.x;
      const newRight = nextRect.x + nextRect.w;
      const newTop = nextRect.y;
      const newBottom = nextRect.y + nextRect.h;

      const mapX = buildAxisMapper(
        bounds.left,
        bounds.right,
        oldLeft,
        oldRight,
        newLeft,
        newRight,
      );
      const mapY = buildAxisMapper(
        bounds.top,
        bounds.bottom,
        oldTop,
        oldBottom,
        newTop,
        newBottom,
      );

      const adapted = {};
      Object.keys(slots).forEach((slotId) => {
        const s = slots[slotId];
        const left = mapX(s.x);
        const right = mapX(s.x + s.w);
        const top = mapY(s.y);
        const bottom = mapY(s.y + s.h);
        adapted[slotId] = {
          x: Math.round(left),
          y: Math.round(top),
          w: Math.max(60, Math.round(right - left)),
          h: Math.max(56, Math.round(bottom - top)),
        };
      });

      adapted[resizedSlotId] = {
        x: Math.round(nextRect.x),
        y: Math.round(nextRect.y),
        w: Math.max(120, Math.round(nextRect.w)),
        h: Math.max(90, Math.round(nextRect.h)),
      };

      return adapted;
    };

    const respectsMinSlotSize = (adaptedSlots) =>
      Object.values(adaptedSlots || {}).every(
        (slot) => slot.w >= minSlotW && slot.h >= minSlotH,
      );

    const boundedRect = clampRectToBounds(rawRect, bounds);
    const desiredRect = lockOuterBoundEdges(current, boundedRect, bounds);

    const desiredAdapted = buildAdaptedSlots(desiredRect);
    if (respectsMinSlotSize(desiredAdapted)) return desiredAdapted;

    // Empêche de pousser les autres panels au-delà de leurs frontières mini.
    let low = 0;
    let high = 1;
    let bestRect = { ...current };
    for (let i = 0; i < 16; i += 1) {
      const t = (low + high) / 2;
      const candidateRect = {
        x: current.x + (desiredRect.x - current.x) * t,
        y: current.y + (desiredRect.y - current.y) * t,
        w: current.w + (desiredRect.w - current.w) * t,
        h: current.h + (desiredRect.h - current.h) * t,
      };
      const candidateAdapted = buildAdaptedSlots(candidateRect);
      if (respectsMinSlotSize(candidateAdapted)) {
        bestRect = candidateRect;
        low = t;
      } else {
        high = t;
      }
    }

    return buildAdaptedSlots(bestRect);
  }

  function getWindowSlotId(el, slots) {
    return (
      (el.dataset.slotId && slots[el.dataset.slotId] && el.dataset.slotId) ||
      (slots[el.dataset.id] ? el.dataset.id : null) ||
      getClosestSlotId(el, slots)
    );
  }

  function applySlotsToWindows(slots, options = {}) {
    const exceptEl = options.exceptEl || null;
    const fixedSlotId = options.fixedSlotId || null;
    document.querySelectorAll(".win").forEach((win) => {
      if (exceptEl && win === exceptEl) {
        if (fixedSlotId) {
          win.dataset.slotId = fixedSlotId;
        }
        return;
      }
      const targetSlotId = getWindowSlotId(win, slots);
      if (!targetSlotId) return;
      placeWindowInSlot(win, targetSlotId, slots);
    });
    applyStableZOrderForDragDrop(slots);
    updateResizeHandlesForAllWindows(slots);
  }

  function applyStableZOrderForDragDrop(slots = null) {
    if (!isDragDropMode()) return;
    const resolvedSlots = slots || getSlotTemplateForCurrentHand();
    const wins = [...document.querySelectorAll(".win")];
    wins
      .map((el) => {
        const slotId = getWindowSlotId(el, resolvedSlots);
        const slot = slotId ? resolvedSlots[slotId] : null;
        return { el, slot };
      })
      .sort((a, b) => {
        const ay = a.slot?.y ?? 0;
        const by = b.slot?.y ?? 0;
        if (ay !== by) return ay - by;
        const ax = a.slot?.x ?? 0;
        const bx = b.slot?.x ?? 0;
        return ax - bx;
      })
      .forEach((item, index) => {
        item.el.style.zIndex = String(20 + index);
      });
  }

  function relayoutAroundResizedWindowLive(el, rawRect = null) {
    if (!isDragDropMode() || !el) return;
    const slots = getSlotTemplateForCurrentHand();
    const slotId = getWindowSlotId(el, slots);
    if (!slotId) return;
    const rect = rawRect || getWindowAbsoluteRect(el);
    const adaptedSlots = adaptSlotsAfterResize(slots, slotId, rect);
    const constrained = adaptedSlots?.[slotId];
    if (constrained) {
      el.style.left = constrained.x + "px";
      el.style.top = constrained.y + "px";
      el.style.width = constrained.w + "px";
      el.style.height = constrained.h + "px";
      el.style.transform = "translate(0px,0px)";
      el.dataset.x = 0;
      el.dataset.y = 0;
      el.dataset.slotId = slotId;
    }
    applySlotsToWindows(adaptedSlots, { exceptEl: el, fixedSlotId: slotId });
  }

  function persistSlotOverrideFromWindow(el) {
    if (!isDragDropMode() || !el) return;
    const slots = getSlotTemplateForCurrentHand();
    const slotId = getWindowSlotId(el, slots);
    if (!slotId) return;

    const rect = getWindowAbsoluteRect(el);
    const adaptedSlots = adaptSlotsAfterResize(slots, slotId, rect);
    writeDragDropSlotOverrides(adaptedSlots);

    applySlotsToWindows(adaptedSlots);

    persistDragDropLayout();
  }

  function normalizeWindowsToSlots() {
    if (!isDragDropMode()) return;
    const slots = getSlotTemplateForCurrentHand();
    const used = new Set();

    document.querySelectorAll(".win").forEach((el) => {
      const preferred =
        (el.dataset.slotId && slots[el.dataset.slotId] && el.dataset.slotId) ||
        (slots[el.dataset.id] ? el.dataset.id : null);
      if (!preferred || used.has(preferred)) return;
      placeWindowInSlot(el, preferred, slots);
      used.add(preferred);
    });

    document.querySelectorAll(".win").forEach((el) => {
      if (used.has(el.dataset.slotId)) return;
      const slotId = getClosestSlotId(el, slots, used);
      if (!slotId) return;
      placeWindowInSlot(el, slotId, slots);
      used.add(slotId);
    });

    persistDragDropLayout();
    applyStableZOrderForDragDrop(slots);
    updateResizeHandlesForAllWindows(slots);
  }

  function snapWindowToNearestSlot(el, evt = null) {
    if (!isDragDropMode() || !el) return;

    const slots = getSlotTemplateForCurrentHand();
    const pointerPoint = getCanvasPointFromEvent(evt) || el._ddPointer || null;

    const previousSlotId =
      (el._ddOriginSlotId && slots[el._ddOriginSlotId] && el._ddOriginSlotId) ||
      (el.dataset.slotId && slots[el.dataset.slotId] ? el.dataset.slotId : null);

    const targetSlotId = resolveDragDropTargetSlotId(
      el,
      slots,
      pointerPoint,
      previousSlotId,
    );

    if (!targetSlotId) return;

    const occupant = [...document.querySelectorAll(".win")].find(
      (other) => other !== el && other.dataset.slotId === targetSlotId,
    );

    placeWindowInSlot(el, targetSlotId, slots);

    if (occupant) {
      if (
        previousSlotId &&
        slots[previousSlotId] &&
        previousSlotId !== targetSlotId
      ) {
        placeWindowInSlot(occupant, previousSlotId, slots);
      } else {
        const fallbackSlot = getClosestSlotId(occupant, slots);
        if (fallbackSlot && fallbackSlot !== targetSlotId) {
          placeWindowInSlot(occupant, fallbackSlot, slots);
        }
      }
    }

    persistDragDropLayout();
    applyStableZOrderForDragDrop(slots);
    updateResizeHandlesForAllWindows(slots);
    clearDragDropHints();
  }

  function create(id) {
    const def = PANELS[id];
    if (!def) return;
    const hand = flipHand(State.get("hand"));
    const pos = computeLayout(hand)?.[id] ?? { x: 20, y: 20, w: 320, h: 280 };

    const el = document.createElement("div");
    el.className = "win";
    el.id = "win-" + id;
    el.dataset.id = id;

    el.style.cssText = [
      `left:${pos.x}px`,
      `top:${pos.y}px`,
      `width:${pos.w}px`,
      `height:${pos.h}px`,
      `z-index:${++State.all().zTop}`,
      `animation:winIn .2s cubic-bezier(.25,.46,.45,.94)`,
    ].join(";");

    // SVG plein-écran (4 coins pointant vers l'extérieur)
    const SVG_MAX = `<svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="1,4 1,1 4,1"/>
      <polyline points="6,1 9,1 9,4"/>
      <polyline points="9,6 9,9 6,9"/>
      <polyline points="4,9 1,9 1,6"/>
    </svg>`;

    el.innerHTML = `
      <div class="win-title" id="wt-${id}">
        <span class="win-label">${def.label}</span>
        <div class="win-controls">
          <button class="wc min" type="button" title="Réduire">-</button>
          <button class="wc max" type="button" title="Agrandir">${SVG_MAX}</button>
        </div>
      </div>
      <div class="win-body" id="wb-${id}">${def.buildHTML()}</div>
      <div class="win-resize-side win-resize-top"></div>
      <div class="win-resize-side win-resize-right"></div>
      <div class="win-resize-side win-resize-bottom"></div>
      <div class="win-resize-side win-resize-left"></div>
      <div class="win-resize-handle win-resize-tl"></div>
      <div class="win-resize-handle win-resize-tr"></div>
      <div class="win-resize-handle win-resize-bl"></div>
      <div class="win-resize-handle win-resize-br"></div>
    `;

    document.getElementById("canvas").appendChild(el);
    el.addEventListener("mousedown", () => focus(id));

    el.querySelector(".wc.max")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      maximize(id);
    });

    el.querySelector(".wc.min")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      minimize(id);
    });

    interact(el).draggable({
      allowFrom: "#wt-" + id,
      inertia: false,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: "#canvas",
          endOnly: false,
        }),
      ],
      listeners: {
        start(e) {
          if (el.classList.contains("maximized")) return false;
          if (isDragDropMode() && canUseSortableDragDrop() && useSortableDragDrop()) return false;
          el.classList.add("dragging");
          if (isDragDropMode()) {
            elevateDraggingWindow(el);
            el._ddOriginSlotId = el.dataset.slotId || null;
            el._ddTargetSlotId = null;
            el._ddPointer = getCanvasPointFromEvent(e) || null;
            const pointerTracker = (ev) => {
              el._ddPointer = getCanvasPointFromEvent(ev) || el._ddPointer || null;
              updateDragDropHints(el, ev);
            };
            el._ddPointerMoveHandler = pointerTracker;
            window.addEventListener("pointermove", pointerTracker, true);
            updateDragDropHints(el);
          }
        },
        move(e) {
          if (el.classList.contains("maximized")) return;
          if (isDragDropMode() && canUseSortableDragDrop() && useSortableDragDrop()) return;
          const x = (parseFloat(el.dataset.x) || 0) + e.dx;
          const y = (parseFloat(el.dataset.y) || 0) + e.dy;
          el.style.transform = `translate(${x}px,${y}px)`;
          el.dataset.x = x;
          el.dataset.y = y;
          if (isDragDropMode()) {
            el._ddPointer = getCanvasPointFromEvent(e) || el._ddPointer || null;
            updateDragDropHints(el, e);
          }
        },
        end(e) {
          if (isDragDropMode() && canUseSortableDragDrop() && useSortableDragDrop()) {
            return;
          }
          el.classList.remove("dragging");
          if (isDragDropMode()) {
            if (el._ddPointerMoveHandler) {
              window.removeEventListener("pointermove", el._ddPointerMoveHandler, true);
              el._ddPointerMoveHandler = null;
            }
            restoreDraggingWindowZ(el);
            snapWindowToNearestSlot(el, e);
            el._ddPointer = null;
            el._ddTargetSlotId = null;
            el._ddOriginSlotId = null;
          } else {
            clearDragDropHints();
          }
        },
      },
    });

    interact(el).resizable({
      edges: {
        top: ".win-resize-top, .win-resize-tl, .win-resize-tr",
        left: ".win-resize-left, .win-resize-tl, .win-resize-bl",
        bottom: ".win-resize-bottom, .win-resize-bl, .win-resize-br",
        right: ".win-resize-right, .win-resize-tr, .win-resize-br",
      },
      modifiers: [
        interact.modifiers.restrictEdges({ outer: "#canvas", endOnly: true }),
        interact.modifiers.restrictSize({ min: { width: 220, height: 140 } }),
      ],
      listeners: {
        start() {
          if (el.classList.contains("maximized")) return false;
          const w = State.all().windows[id];
          if (w?.minimized) minimize(id);
          el.classList.add("resizing");
          document.body.classList.add("is-resizing");
          const sel = window.getSelection?.();
          if (sel && sel.removeAllRanges) sel.removeAllRanges();
        },
        move(e) {
          if (el.classList.contains("maximized")) return;
          if (isDragDropMode()) {
            const current = getWindowAbsoluteRect(el);
            const rawRect = {
              x: current.x + (e.deltaRect?.left || 0),
              y: current.y + (e.deltaRect?.top || 0),
              w: e.rect.width,
              h: e.rect.height,
            };
            relayoutAroundResizedWindowLive(el, rawRect);
            return;
          }
          const x = (parseFloat(el.dataset.x) || 0) + e.deltaRect.left;
          const y = (parseFloat(el.dataset.y) || 0) + e.deltaRect.top;
          el.style.width = e.rect.width + "px";
          el.style.height = e.rect.height + "px";
          el.style.transform = `translate(${x}px,${y}px)`;
          el.dataset.x = x;
          el.dataset.y = y;
          const sel = window.getSelection?.();
          if (sel && sel.removeAllRanges) sel.removeAllRanges();
        },
        end() {
          el.classList.remove("resizing");
          document.body.classList.remove("is-resizing");
          if (isDragDropMode()) {
            persistSlotOverrideFromWindow(el);
          }
        },
      },
    });

    State.all().windows[id] = { minimized: false, visible: true };
    if (isDragDropMode()) {
      const slots = getSlotTemplateForCurrentHand();
      if (slots[id]) el.dataset.slotId = id;
    }
    updateResizeHandlesForWindow(el);
    syncInteractDragState();
    if (def.onMount) def.onMount(id);
    updateTaskbar();
  }

  function focus(id) {
    document
      .querySelectorAll(".win")
      .forEach((w) => w.classList.remove("focused"));
    const el = document.getElementById("win-" + id);
    if (el) {
      el.classList.add("focused");
      // En mode sandbox, le panel cliqué remonte au premier plan.
      if (!isDragDropMode()) {
        el.style.zIndex = ++State.all().zTop;
      }
    }
  }

  function close(id) {
    return;
  }

  function minimize(id) {
    const el = document.getElementById("win-" + id);
    if (!el) return;

    // En mode maximisé, le bouton min sert de fermer → restaurer
    if (el._maxOverlay) {
      restoreFromMax(id);
      return;
    }

    const w = State.all().windows[id] || { minimized: false, visible: true };
    w.minimized = !w.minimized;
    w.visible = true;
    State.all().windows[id] = w;

    el.classList.toggle("minimized", w.minimized);
    updateTaskbar();
  }

  function open(id) {
    if (document.getElementById("win-" + id)) {
      const w = State.all().windows[id];
      if (w?.minimized) minimize(id);
      focus(id);
      return;
    }
    create(id);
    if (isDragDropMode()) {
      normalizeWindowsToSlots();
    }
    ensureSortableDragDropEngine();
    focus(id);
  }

  function applyLayout(hand) {
    clearDragDropHints();
    syncLayoutModeClass();
    State.set("hand", hand);
    localStorage.setItem(HAND_STORAGE_KEY, hand);

    document.querySelectorAll(".hand-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.hand === hand);
    });

    document.querySelectorAll(".win").forEach((w) => w.remove());
    State.all().windows = {};

    const mode = getLayoutMode();
    const saved = JSON.parse(localStorage.getItem(getLayoutStorageKey(hand, mode)) || "null");

    if (saved) {
      if (mode === LAYOUT_MODE_DRAGDROP) {
        const slots = getSlotTemplateForCurrentHand();
        saved.forEach((item) => {
          if (!PANELS[item.id]) return;
          create(item.id);
          const el = document.getElementById("win-" + item.id);
          if (!el) return;
          const slotId =
            item.slotId && slots[item.slotId]
              ? item.slotId
              : slots[item.id]
                ? item.id
                : null;
          if (slotId) placeWindowInSlot(el, slotId, slots);
        });
        normalizeWindowsToSlots();
      } else {
        saved.forEach((item) => {
          if (!PANELS[item.id]) return;
          create(item.id);
          const el = document.getElementById("win-" + item.id);
          if (el && item.style) Object.assign(el.style, item.style);
          if (el && item.dx) {
            el.dataset.x = item.dx;
            el.dataset.y = item.dy;
          }
        });
      }
    } else {
      getDefaultVisible().forEach((id) => {
        if (PANELS[id]) create(id);
      });
      if (mode === LAYOUT_MODE_DRAGDROP) {
        normalizeWindowsToSlots();
      }
    }
    if (isDragDropMode()) {
      applyStableZOrderForDragDrop();
    }
    ensureSortableDragDropEngine();
    syncInteractDragState();
    updateResizeHandlesForAllWindows();
    updateTaskbar();
  }

  function saveLayout() {
    const hand = State.get("hand");
    if (isDragDropMode()) {
      persistDragDropLayout();
      Toast.ok("Disposition sauvegardée");
      return;
    }

    const items = [];
    document.querySelectorAll(".win").forEach((w) => {
      items.push({
        id: w.dataset.id,
        style: {
          left: w.style.left,
          top: w.style.top,
          width: w.style.width,
          height: w.style.height,
          transform: w.style.transform,
        },
        dx: w.dataset.x || 0,
        dy: w.dataset.y || 0,
      });
    });
    localStorage.setItem(
      getLayoutStorageKey(hand, LAYOUT_MODE_SANDBOX),
      JSON.stringify(items),
    );
    Toast.ok("Disposition sauvegardée");
  }

  function resetLayout() {
    const hand = State.get("hand");
    localStorage.removeItem(getLayoutStorageKey(hand, getLayoutMode()));
    if (isDragDropMode()) {
      localStorage.removeItem(getLayoutSlotOverridesStorageKey(hand));
    }
    applyLayout(hand);
    Toast.ok("Disposition réinitialisée");
  }

  function hasSavedLayout(hand) {
    return !!localStorage.getItem(getLayoutStorageKey(hand, getLayoutMode()));
  }

  function toggleLayoutMode() {
    const next =
      getLayoutMode() === LAYOUT_MODE_DRAGDROP
        ? LAYOUT_MODE_SANDBOX
        : LAYOUT_MODE_DRAGDROP;
    setLayoutMode(next);
    applyLayout(State.get("hand"));
    return next;
  }

  function updateTaskbar() {
    const area = document.getElementById("taskbar-chips");
    if (!area) return;
    area.innerHTML = "";
    Object.keys(PANELS).forEach((id) => {
      const def = PANELS[id];
      const exists = !!document.getElementById("win-" + id);
      const w = State.all().windows[id];
      const chip = document.createElement("button");
      chip.className =
        "task-chip" +
        (exists && !w?.minimized ? " open" : exists ? " minimized" : "");
      chip.textContent = def.label;
      chip.title = def.sprint > 2 ? `Sprint ${def.sprint}` : def.label;
      chip.onclick = () => open(id);
      area.appendChild(chip);
    });
  }

  function ajouterPanelsGerant() {
    DEFAULT_VISIBLE_GERANT.forEach((id) => {
      if (PANELS[id]) open(id);
    });
  }

  return {
    register,
    open,
    close,
    minimize,
    maximize,
    focus,
    getLayoutMode,
    setLayoutMode,
    toggleLayoutMode,
    applyLayout,
    saveLayout,
    resetLayout,
    hasSavedLayout,
    updateTaskbar,
    ajouterPanelsGerant,
  };
})();