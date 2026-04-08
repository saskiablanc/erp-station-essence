/**
 * core/toast.js — Notifications
 */
const Toast = (() => {
  function show(msg, type = 'ok') {
    const area = document.getElementById('toast-area');
    const el   = document.createElement('div');
    el.className = 'toast' + (type === 'warn' ? ' warn' : type === 'err' ? ' err' : '');
    el.textContent = msg;
    area.appendChild(el);
    setTimeout(() => {
      el.style.transition = '.3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(10px)';
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  return {
    ok:   (msg) => show(msg, 'ok'),
    warn: (msg) => show(msg, 'warn'),
    err:  (msg) => show(msg, 'err'),
  };
})();
