/**
 * core/windows.js — Gestionnaire de fenêtres mosaïque
 * Layout calqué sur la maquette fil de fer
 */
const WM = (() => {
  const PANELS = {};

  const EMPLOYE_LAYOUT_VERSION = "v6";
  const GERANT_LAYOUT_VERSION = "v7";
  const HAND_STORAGE_KEY = "caisse_hand_v2";
  const flipHand = (hand) => (hand === "left" ? "right" : "left");
  const isGerantMode = () =>
    typeof CAISSE_MODE !== "undefined" && CAISSE_MODE === "gerant";
  const getLayoutVersion = () =>
    isGerantMode() ? GERANT_LAYOUT_VERSION : EMPLOYE_LAYOUT_VERSION;

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

    // Style pour remplir le popup
    el.style.cssText = [
      "position:relative",
      "width:min(92vw,1100px)",
      "height:min(88vh,780px)",
      "z-index:auto",
      "transform:none",
      "animation:wmMaxSlideUp 0.2s cubic-bezier(0.25,0.46,0.45,0.94)",
    ].join(";");
    el.dataset.x = 0;
    el.dataset.y = 0;

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
        <span class="win-icon">${def.icon}</span>
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
      inertia: { resistance: 30 },
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: "#canvas",
          endOnly: false,
        }),
      ],
      listeners: {
        start() {
          if (el.classList.contains("maximized")) return false;
          el.classList.add("dragging");
        },
        move(e) {
          if (el.classList.contains("maximized")) return;
          const x = (parseFloat(el.dataset.x) || 0) + e.dx;
          const y = (parseFloat(el.dataset.y) || 0) + e.dy;
          el.style.transform = `translate(${x}px,${y}px)`;
          el.dataset.x = x;
          el.dataset.y = y;
        },
        end() {
          el.classList.remove("dragging");
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
        },
      },
    });

    State.all().windows[id] = { minimized: false, visible: true };
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
      el.style.zIndex = ++State.all().zTop;
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
    focus(id);
  }

  function applyLayout(hand) {
    State.set("hand", hand);
    localStorage.setItem(HAND_STORAGE_KEY, hand);

    document.querySelectorAll(".hand-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.hand === hand);
    });

    document.querySelectorAll(".win").forEach((w) => w.remove());
    State.all().windows = {};

    const layoutHand = flipHand(hand);
    const saved = JSON.parse(
      localStorage.getItem(
        "caisse_layout_" + getLayoutVersion() + "_" + layoutHand,
      ) || "null",
    );

    if (saved) {
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
    } else {
      getDefaultVisible().forEach((id) => {
        if (PANELS[id]) create(id);
      });
    }
    updateTaskbar();
  }

  function saveLayout() {
    const hand = flipHand(State.get("hand"));
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
      "caisse_layout_" + getLayoutVersion() + "_" + hand,
      JSON.stringify(items),
    );
    Toast.ok("Disposition sauvegardée");
  }

  function resetLayout() {
    const hand = State.get("hand");
    localStorage.removeItem(
      "caisse_layout_" + getLayoutVersion() + "_" + flipHand(hand),
    );
    applyLayout(hand);
    Toast.ok("Disposition réinitialisée");
  }

  function hasSavedLayout(hand) {
    return !!localStorage.getItem(
      "caisse_layout_" + getLayoutVersion() + "_" + flipHand(hand),
    );
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
      chip.innerHTML = `${def.icon} ${def.label}`;
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
    applyLayout,
    saveLayout,
    resetLayout,
    hasSavedLayout,
    updateTaskbar,
    ajouterPanelsGerant,
  };
})();
