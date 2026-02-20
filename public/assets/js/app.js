/**
 * app.js — Point d'entrée
 * SESSION est injecté par PHP directement dans caisse.php
 */
const App = (() => {

  function init() {
    State.set('employe', SESSION);

    // Horloge
    updateClock();
    setInterval(updateClock, 1000);

    // Main hand toggle sync
    const hand = State.get('hand');
    document.querySelectorAll('.hand-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.hand === hand);
    });

    // Charger les panels
    WM.applyLayout(hand);

    // Panels gérant si rôle gérant
    if (SESSION.role === 'gerant') {
      WM.ajouterPanelsGerant();
    }

    // Recalage du layout par défaut sur redimensionnement
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const currentHand = State.get('hand');
        if (!WM.hasSavedLayout(currentHand)) {
          WM.applyLayout(currentHand);
        }
      }, 120);
    });
  }

  function updateClock() {
    const el = document.getElementById('clock');
    if (el) el.textContent = new Date().toLocaleTimeString('fr-FR');
  }

  function setHand(hand) { WM.applyLayout(hand); }
  function saveLayout()   { WM.saveLayout(); }
  function resetLayout()  { WM.resetLayout(); }

  function openGerant() {
    Toast.warn('Espace gérant — Sprint 4-6');
  }

  function deconnexion() {
    document.getElementById('confirm-overlay').style.display = 'flex';
  }
  function closeConfirm() {
    document.getElementById('confirm-overlay').style.display = 'none';
  }
  async function doDeconnexion() {
    closeConfirm();
    try { await Requetes.logout(); } catch (_) {}
    window.location.href = '/connexion';
  }

  document.addEventListener('DOMContentLoaded', () => {
    init();
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeConfirm();
    });
  });

  return { setHand, saveLayout, resetLayout, openGerant, deconnexion, closeConfirm, doDeconnexion };
})();
