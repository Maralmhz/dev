function switchTab(id) {
  document.querySelectorAll('.tab-content').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach((b) => b.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-button').forEach((btn) => {
    btn.onclick = () => {
      const handler = btn.getAttribute('onclick');
      if (handler) {
        // Preserva comportamento legado inline para abas/menu
        eval(handler);
      }
    };
  });
});
