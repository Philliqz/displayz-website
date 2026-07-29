import { handleSubmit } from './forms.js';

export function init() {
  const overlay = document.getElementById('contact-modal');
  if (!overlay) return;
  const openers = document.querySelectorAll('[data-open-modal]');
  const closers = overlay.querySelectorAll('[data-close-modal]');
  const panel = overlay.querySelector('.modal-panel');
  const form = overlay.querySelector('.modal-form');
  const success = overlay.querySelector('.modal-success');

  function open(e) {
    if (e) e.preventDefault();
    overlay.classList.add('is-open');
    form.classList.remove('is-hidden');
    success.classList.remove('is-visible');
    const heroMenu = document.getElementById('hero-contact-menu');
    if (heroMenu) heroMenu.classList.remove('is-open');
  }
  function close(e) {
    if (e) e.preventDefault();
    overlay.classList.remove('is-open');
  }

  openers.forEach((btn) => btn.addEventListener('click', open));
  closers.forEach((btn) => btn.addEventListener('click', close));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  panel.addEventListener('click', (e) => e.stopPropagation());

  form.addEventListener('submit', (e) => {
    handleSubmit(e, form, () => {
      form.classList.add('is-hidden');
      success.classList.add('is-visible');
    });
  });

  const toPortfolio = overlay.querySelector('[data-goto-portfolio]');
  if (toPortfolio) {
    toPortfolio.addEventListener('click', (e) => {
      e.preventDefault();
      close();
      setTimeout(() => {
        const target = document.getElementById('portafolio');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.location.href = 'index.html#portafolio';
        }
      }, 50);
    });
  }
}
