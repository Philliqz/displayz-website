export function init() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.getAttribute('href') === path) link.classList.add('is-active');
  });
  initMobileToggle();
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
