export function init() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.getAttribute('href') === path) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
  initSectionSpy(path);
  initMobileToggle();
}

// En el home, "Trabajo" se rellena mientras su sección está en pantalla.
function initSectionSpy(path) {
  if (path !== 'index.html' || !('IntersectionObserver' in window)) return;
  document.querySelectorAll('.nav-link[href^="index.html#"]').forEach((link) => {
    const section = document.getElementById(link.hash.slice(1));
    if (!section) return;
    new IntersectionObserver(([entry]) => {
      link.classList.toggle('is-active', entry.isIntersecting);
      if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }, { rootMargin: '-45% 0px -45% 0px' }).observe(section);
  });
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
