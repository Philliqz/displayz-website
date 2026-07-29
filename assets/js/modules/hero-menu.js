export function init() {
  const menu = document.getElementById('hero-contact-menu');
  if (!menu) return;
  const trigger = menu.querySelector('.hero-contact-trigger');
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    menu.classList.toggle('is-open');
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) menu.classList.remove('is-open');
  });
}
