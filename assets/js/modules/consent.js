// Aviso de cookies: GA arranca con el consentimiento de analítica negado (lo fija el <head> de cada
// página, que lee la elección guardada) y solo pone cookies si la persona acepta. Sin elección
// guardada, el aviso aparece; la elección queda en localStorage ('si' / 'no').
export function init() {
  let elegido = null;
  try { elegido = localStorage.getItem('cookies'); } catch { /* sin almacenamiento: se pregunta cada vez */ }
  if (elegido) return;
  const aviso = document.createElement('div');
  aviso.className = 'cookies';
  aviso.setAttribute('role', 'region');
  aviso.setAttribute('aria-label', 'Aviso de cookies');
  aviso.innerHTML = `<p>Usamos cookies de Google Analytics para saber cuántas personas visitan el sitio.
    <a href="politica.html">Política de privacidad</a></p>
    <div class="cookies-btns"><button type="button" class="btn btn-sm" data-c="no">Rechazar</button>
    <button type="button" class="btn btn-sm btn-gradient" data-c="si">Aceptar</button></div>`;
  aviso.addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (!c) return;
    try { localStorage.setItem('cookies', c); } catch { /* vale solo para esta visita */ }
    if (c === 'si' && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted' });
    aviso.remove();
  });
  document.body.appendChild(aviso);
}
