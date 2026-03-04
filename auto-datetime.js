document.addEventListener('DOMContentLoaded', () => {
  const data = document.getElementById('data');
  const hora = document.getElementById('hora');
  const now = new Date();
  if (data) data.value = now.toISOString().split('T')[0];
  if (hora) hora.value = now.toTimeString().slice(0, 5);
});
