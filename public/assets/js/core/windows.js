/**
 * core/windows.js — Gestionnaire de fenêtres mosaïque
 * Layout calqué sur la maquette fil de fer
 */
const WM = (() => {
  const PANELS = {};

  const LAYOUT_VERSION = 'v6';
  const HAND_STORAGE_KEY = 'caisse_hand_v2';
  const flipHand = (hand) => (hand === 'left' ? 'right' : 'left');

  // Ajuste ces ratios pour coller exactement à la maquette
  const LAYOUT_METRICS = {
    margin: 6,
    gap: 6,
    mainAreaPct: 0.86, // largeur du bloc gauche+centre (hors colonne CCE)
    topSplitPct: 0.66, // répartition haut : ticket vs stock dans le bloc principal
    rowTopPct: 0.56,   // hauteur ligne du haut
  };

  // ── Layout maquette (positions fixes initiales) ──────
  // Maquette : Panier grand gauche | Stocks haut centre | CCE création haut droit
  //            Pompes bas gauche+centre | CCE consultation bas droit
  const BASE_LAYOUTS = {
    right: {
      ticket:       { x: 10,  y: 10,  w: 520, h: 420 },  // Panier — haut gauche
      stock:        { x: 536, y: 10,  w: 268, h: 420 },  // Stocks — haut centre
      pompes:       { x: 10,  y: 440, w: 794, h: 320 },  // Pompes — bas gauche+centre
      cce_create:   { x: 810, y: 10,  w: 160, h: 420 },  // Créer CCE — haut droite
      cce_consult:  { x: 810, y: 440, w: 160, h: 320 },  // Consulter CCE — bas droite
      // Panels secondaires (taskbar, pas sur canvas par défaut)
      clavier: { x: 620, y: 10, w: 260, h: 310 },
      paiement: { x: 620, y: 330, w: 260, h: 280 },
      transactions: { x: 900, y: 10, w: 280, h: 380 },
      alertes: { x: 900, y: 400, w: 280, h: 200 },
    },
    left: {
      ticket:       { x: 450, y: 10,  w: 520, h: 420 },
      stock:        { x: 176, y: 10,  w: 268, h: 420 },
      pompes:       { x: 176, y: 440, w: 794, h: 320 },
      cce_create:   { x: 10,  y: 10,  w: 160, h: 420 },
      cce_consult:  { x: 10,  y: 440, w: 160, h: 320 },
      clavier:      { x: 100, y: 10,  w: 260, h: 310 },
      paiement:     { x: 100, y: 330, w: 260, h: 280 },
      transactions: { x: 10,  y: 10,  w: 280, h: 380 },
      alertes:      { x: 10,  y: 400, w: 280, h: 200 },
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
      ticket:      { x: leftX,                    y: topY,    w: topLeftW,   h: rowTop },
      stock:       { x: leftX + topLeftW + gap,  y: topY,    w: topMiddleW, h: rowTop },
      pompes:      { x: leftX,                    y: bottomY, w: mainW,       h: rowBottom },
      cce_create:  { x: sideX,                    y: topY,    w: sideW,       h: rowTop },
      cce_consult: { x: sideX,                    y: bottomY, w: sideW,       h: rowBottom },
    };

    const computed =
      hand === "left" ? mirrorLayout(right, leftX, leftX + availW) : right;

    const base = BASE_LAYOUTS[hand] || {};
    return { ...base, ...computed };
  }

  // Panels affichés par défaut sur le canvas (ordre maquette)
  // En mode gérant, on n'affiche pas les panels employé par défaut
  const DEFAULT_VISIBLE_EMPLOYE = ['ticket', 'stock', 'pompes', 'cce_create', 'cce_consult'];
  const DEFAULT_VISIBLE_GERANT = [
    "gerant_reappro",
    "gerant_prix",
    "gerant_incidents",
    "gerant_cce_params",
    "gerant_horaires",
  ];

  function getDefaultVisible() {
    if (typeof CAISSE_MODE !== "undefined" && CAISSE_MODE === "gerant") {
      return DEFAULT_VISIBLE_GERANT;
    }
    return DEFAULT_VISIBLE_EMPLOYE;
  }

  function register(id, def) {
    PANELS[id] = def;
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

    el.innerHTML = `
      <div class="win-title" id="wt-${id}">
        <span class="win-icon">${def.icon}</span>
        <span class="win-label">${def.label}</span>
        <div class="win-controls">
          <button class="wc min" type="button" title="Réduire">-</button>
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
          el.classList.add("dragging");
        },
        move(e) {
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
        interact.modifiers.restrictEdges({
          outer: "#canvas",
          endOnly: true,
        }),
        interact.modifiers.restrictSize({ min: { width: 220, height: 140 } }),
      ],
      listeners: {
        start() {
          const w = State.all().windows[id];
          if (w?.minimized) {
            minimize(id);
          }
          el.classList.add("resizing");
          document.body.classList.add("is-resizing");
          const sel = window.getSelection?.();
          if (sel && sel.removeAllRanges) sel.removeAllRanges();
        },
        move(e) {
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

    // Vider le canvas
    document.querySelectorAll(".win").forEach((w) => w.remove());
    State.all().windows = {};

    // Charger disposition sauvegardée ou défaut
    const layoutHand = flipHand(hand);
    const saved = JSON.parse(
      localStorage.getItem(
        "caisse_layout_" + LAYOUT_VERSION + "_" + layoutHand,
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
      "caisse_layout_" + LAYOUT_VERSION + "_" + hand,
      JSON.stringify(items),
    );
    Toast.ok("Disposition sauvegardée");
  }

  function resetLayout() {
    const hand = State.get("hand");
    localStorage.removeItem(
      "caisse_layout_" + LAYOUT_VERSION + "_" + flipHand(hand),
    );
    applyLayout(hand);
    Toast.ok("Disposition réinitialisée");
  }

  function hasSavedLayout(hand) {
    return !!localStorage.getItem(
      "caisse_layout_" + LAYOUT_VERSION + "_" + flipHand(hand),
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
    [
      "gerant_reappro",
      "gerant_prix",
      "gerant_incidents",
      "gerant_cce_params",
      "gerant_horaires",
    ].forEach((id) => {
      if (PANELS[id]) open(id);
    });
  }

  return {
    register,
    open,
    close,
    minimize,
    focus,
    applyLayout,
    saveLayout,
    resetLayout,
    hasSavedLayout,
    updateTaskbar,
    ajouterPanelsGerant,
  };
})();
