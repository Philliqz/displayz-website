export function init() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.getAttribute('href') === path) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
  initMobileToggle();
  initSolid();
}

// La barra va transparente solo arriba del todo, sobre el banner; en cuanto se baja toma fondo
// (.is-solid): en móvil el banner es alto y su contenido pasaba por debajo sin contraste.
// Sin banner (política), siempre con fondo.
function initSolid() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  if (!document.querySelector('.hero.banner, .gallery-hero')) { nav.classList.add('is-solid'); return; }
  const poner = () => nav.classList.toggle('is-solid', scrollY > 8);
  addEventListener('scroll', poner, { passive: true });
  poner();
}

function initMobileToggle() {
  const siteNav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');
  if (!siteNav || !toggle) return;

  function close() {
    siteNav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const open = siteNav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  siteNav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', close);
  });
  document.addEventListener('click', (e) => {
    if (!siteNav.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}
