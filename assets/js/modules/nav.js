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

// La barra va transparente sobre el banner de arriba; al pasarlo toma fondo (.is-solid).
// Sin banner (política), siempre con fondo.
function initSolid() {
  const nav = document.querySelector('.site-nav');
  const banner = document.querySelector('.hero.banner, .gallery-hero');
  if (!nav) return;
  if (!banner || !('IntersectionObserver' in window)) { nav.classList.add('is-solid'); return; }
  const alto = nav.offsetHeight;
  new IntersectionObserver(([e]) => nav.classList.toggle('is-solid', !e.isIntersecting),
    { rootMargin: `-${alto}px 0px 0px 0px` }).observe(banner);
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
