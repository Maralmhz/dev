// fix-tabs-menu.js - Compatibilidade abas (v2.0)
// Mantém função global switchTab + religa cliques

function switchTab(id) {
  document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach((b) => b.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-button').forEach((btn) => {
    btn.onclick = () => {
      const handler = btn.getAttribute('onclick');
      if (handler) eval(handler);
    };
  });
});
