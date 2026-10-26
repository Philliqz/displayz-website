// Modal de reproducción de video — embeds en <iframe>; los mp4 propios (reels) en <video>.
// init() se llama dos veces por página (igual que lightbox.js) porque las miniaturas de
// video se crean de forma async; el guard evita atar el cierre/backdrop más de una vez.
import { ARCHIVO_RE } from './video-provider.js';

let boundStatic = false;

export function init() {
  const overlay = document.getElementById('video-modal');
  if (!overlay) return;
  const frame = overlay.querySelector('iframe');
  let video = overlay.querySelector('video');
  if (!video) {
    video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.style.cssText = 'height:min(82vh,160vw); aspect-ratio:9/16; max-width:92vw; border-radius:8px; background:#000';
    frame.after(video);
  }

  document.querySelectorAll('[data-video-embed]:not([data-video-atado])').forEach((trigger) => {
    trigger.setAttribute('data-video-atado', ''); // init() corre dos veces: un solo clic por miniatura
    trigger.addEventListener('click', () => {
      const src = trigger.getAttribute('data-video-embed');
      const archivo = ARCHIVO_RE.test(src);
      frame.hidden = archivo;
      video.hidden = !archivo;
      if (archivo) { video.src = src; video.play().catch(() => {}); } else frame.src = src;
      overlay.classList.add('is-open');
    });
  });

  if (boundStatic) return;
  boundStatic = true;

  overlay.querySelectorAll('[data-close-video]').forEach((btn) => {
    btn.addEventListener('click', () => close(overlay, frame, video));
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(overlay, frame, video); });
}

function close(overlay, frame, video) {
  overlay.classList.remove('is-open');
  frame.src = '';
  video.pause();
  video.removeAttribute('src');
  video.load();
}
