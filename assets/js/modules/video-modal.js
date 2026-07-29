// Modal de reproducción de video — nunca se guardan archivos de video en el repo, solo
// embeds. init() se llama dos veces por página (igual que lightbox.js) porque las
// miniaturas de video se crean de forma async; el guard evita atar el cierre/backdrop
// más de una vez.
let boundStatic = false;

export function init() {
  const overlay = document.getElementById('video-modal');
  if (!overlay) return;
  const frame = overlay.querySelector('iframe');

  document.querySelectorAll('[data-video-embed]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      frame.src = trigger.getAttribute('data-video-embed');
      overlay.classList.add('is-open');
    });
  });

  if (boundStatic) return;
  boundStatic = true;

  overlay.querySelectorAll('[data-close-video]').forEach((btn) => {
    btn.addEventListener('click', () => close(overlay, frame));
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(overlay, frame); });
}

function close(overlay, frame) {
  overlay.classList.remove('is-open');
  frame.src = '';
}
