/**
 * core/windows.js — Gestionnaire de fenêtres mosaïque
 * Layout calqué sur la maquette fil de fer
 */
const WM = (() => {

  const PANELS = {};

  // ── Layout maquette (positions fixes initiales) ──────
  // Maquette : Panier grand gauche | Stocks haut droit
  //            Pompes bas gauche large | CCE bas droit
  const LAYOUTS = {
    right: {
      ticket:       { x: 10,  y: 10,  w: 580, h: 420 },  // Panier — grand, gauche haut
      stock:        { x: 600, y: 10,  w: 370, h: 420 },  // Stocks — haut droit
      pompes:       { x: 10,  y: 440, w: 580, h: 320 },  // Pompes — bas gauche large
      cce:          { x: 600, y: 440, w: 370, h: 320 },  // Gestion CCE — bas droit
      // Panels secondaires (taskbar, pas sur canvas par défaut)
      clavier:      { x: 620, y: 10,  w: 260, h: 310 },
      paiement:     { x: 620, y: 330, w: 260, h: 280 },
      transactions: { x: 900, y: 10,  w: 280, h: 380 },
      alertes:      { x: 900, y: 400, w: 280, h: 200 },
    },
    left: {
      ticket:       { x: 390, y: 10,  w: 580, h: 420 },
      stock:        { x: 10,  y: 10,  w: 370, h: 420 },
      pompes:       { x: 390, y: 440, w: 580, h: 320 },
      cce:          { x: 10,  y: 440, w: 370, h: 320 },
      clavier:      { x: 100, y: 10,  w: 260, h: 310 },
      paiement:     { x: 100, y: 330, w: 260, h: 280 },
      transactions: { x: 10,  y: 10,  w: 280, h: 380 },
      alertes:      { x: 10,  y: 400, w: 280, h: 200 },
    },
  };

  // Panels affichés par défaut sur le canvas (ordre maquette)
  const DEFAULT_VISIBLE = ['ticket', 'stock', 'pompes', 'cce'];

  function register(id, def) {
    PANELS[id] = def;
  }

  function create(id) {
    const def  = PANELS[id];
    if (!def) return;
    const hand = State.get('hand');
    const pos  = LAYOUTS[hand]?.[id] ?? { x: 20, y: 20, w: 320, h: 280 };

    const el = document.createElement('div');
    el.className  = 'win';
    el.id         = 'win-' + id;
    el.dataset.id = id;

    el.style.cssText = [
      `left:${pos.x}px`, `top:${pos.y}px`,
      `width:${pos.w}px`, `height:${pos.h}px`,
      `z-index:${++State.all().zTop}`,
      `animation:winIn .2s cubic-bezier(.25,.46,.45,.94)`,
    ].join(';');

    el.innerHTML = `
      <div class="win-title" id="wt-${id}">
        <span class="win-icon">${def.icon}</span>
        <span class="win-label">${def.label}</span>
        ${def.sprint > 2 ? `<span class="win-sprint">S${def.sprint}</span>` : '<span class="win-sprint done">S2</span>'}
        <div class="win-controls">
          <button class="wc min"   onclick="WM.minimize('${id}')" title="Réduire">—</button>
          <button class="wc close" onclick="WM.close('${id}')"    title="Fermer">✕</button>
        </div>
      </div>
      <div class="win-body" id="wb-${id}">${def.buildHTML()}</div>
      <div class="win-resize"></div>
    `;

    document.getElementById('canvas').appendChild(el);
    el.addEventListener('mousedown', () => focus(id));

    interact(el).draggable({
      allowFrom: '#wt-' + id,
      inertia:   { resistance: 30 },
      modifiers: [interact.modifiers.restrictRect({ restriction: '#canvas', endOnly: false })],
      listeners: {
        start() { el.classList.add('dragging'); },
        move(e) {
          const x = (parseFloat(el.dataset.x) || 0) + e.dx;
          const y = (parseFloat(el.dataset.y) || 0) + e.dy;
          el.style.transform = `translate(${x}px,${y}px)`;
          el.dataset.x = x; el.dataset.y = y;
        },
        end() { el.classList.remove('dragging'); },
      },
    });

    interact(el).resizable({
      edges:     { right: true, bottom: true, bottomRight: '.win-resize' },
      modifiers: [interact.modifiers.restrictSize({ min: { width: 220, height: 140 } })],
      listeners: {
        move(e) {
          el.style.width  = e.rect.width  + 'px';
          el.style.height = e.rect.height + 'px';
        },
      },
    });

    State.all().windows[id] = { minimized: false, visible: true };
    if (def.onMount) def.onMount(id);
    updateTaskbar();
  }

  function focus(id) {
    document.querySelectorAll('.win').forEach(w => w.classList.remove('focused'));
    const el = document.getElementById('win-' + id);
    if (el) { el.classList.add('focused'); el.style.zIndex = ++State.all().zTop; }
  }

  function close(id) {
    const el = document.getElementById('win-' + id);
    if (el) {
      el.style.animation = 'winOut .15s forwards';
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
    State.all().windows[id] = { minimized: false, visible: false };
    updateTaskbar();
  }

  function minimize(id) {
    const el = document.getElementById('win-' + id);
    if (!el) return;
    const w = State.all().windows[id] ?? {};
    w.minimized = !w.minimized;
    el.classList.toggle('minimized', w.minimized);
    State.all().windows[id] = w;
    updateTaskbar();
  }

  function open(id) {
    if (document.getElementById('win-' + id)) {
      const w = State.all().windows[id];
      if (w?.minimized) minimize(id);
      focus(id);
      return;
    }
    create(id);
    focus(id);
  }

  function applyLayout(hand) {
    State.set('hand', hand);
    localStorage.setItem('caisse_hand', hand);

    document.querySelectorAll('.hand-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.hand === hand);
    });

    // Vider le canvas
    document.querySelectorAll('.win').forEach(w => w.remove());
    State.all().windows = {};

    // Charger disposition sauvegardée ou défaut
    const saved = JSON.parse(localStorage.getItem('caisse_layout_' + hand) || 'null');

    if (saved) {
      saved.forEach(item => {
        if (!PANELS[item.id]) return;
        create(item.id);
        const el = document.getElementById('win-' + item.id);
        if (el && item.style) Object.assign(el.style, item.style);
        if (el && item.dx)    { el.dataset.x = item.dx; el.dataset.y = item.dy; }
      });
    } else {
      DEFAULT_VISIBLE.forEach(id => { if (PANELS[id]) create(id); });
    }
    updateTaskbar();
  }

  function saveLayout() {
    const hand  = State.get('hand');
    const items = [];
    document.querySelectorAll('.win').forEach(w => {
      items.push({
        id:    w.dataset.id,
        style: { left: w.style.left, top: w.style.top, width: w.style.width, height: w.style.height, transform: w.style.transform },
        dx:    w.dataset.x || 0,
        dy:    w.dataset.y || 0,
      });
    });
    localStorage.setItem('caisse_layout_' + hand, JSON.stringify(items));
    Toast.ok('Disposition sauvegardée ✓');
  }

  function resetLayout() {
    localStorage.removeItem('caisse_layout_' + State.get('hand'));
    applyLayout(State.get('hand'));
    Toast.ok('Disposition réinitialisée');
  }

  function updateTaskbar() {
    const area = document.getElementById('taskbar-chips');
    if (!area) return;
    area.innerHTML = '';
    Object.keys(PANELS).forEach(id => {
      const def    = PANELS[id];
      const exists = !!document.getElementById('win-' + id);
      const w      = State.all().windows[id];
      const chip   = document.createElement('button');
      chip.className = 'task-chip' + (exists && !w?.minimized ? ' open' : exists ? ' minimized' : '');
      chip.innerHTML = `${def.icon} ${def.label}`;
      chip.title     = def.sprint > 2 ? `Sprint ${def.sprint}` : def.label;
      chip.onclick   = () => open(id);
      area.appendChild(chip);
    });
  }

  function ajouterPanelsGerant() {
    ['gerant_reappro','gerant_prix','gerant_incidents','gerant_cce_params','gerant_horaires']
      .forEach(id => { if (PANELS[id]) open(id); });
  }

  return { register, open, close, minimize, focus, applyLayout, saveLayout, resetLayout, updateTaskbar, ajouterPanelsGerant };
})();
