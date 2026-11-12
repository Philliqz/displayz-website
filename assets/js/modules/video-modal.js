// Modal de reproducción de video — embeds (Mega, YouTube…) en <iframe> con su propio reproductor;
// los mp4 propios en <video> con el reproductor de Displayz: play/pausa, barra, tiempo, sonido y
// pantalla completa. El modal se abre creciendo desde el centro. Avisa con los eventos
// 'video-modal:abierto' / 'video-modal:cerrado' en document para que el resto de la página se calle.
// init() se llama dos veces por página porque las miniaturas se crean async; el guard evita atar dos veces.
import { ARCHIVO_RE } from './video-provider.js';

let boundStatic = false;
const mmss = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');
export const ICONO = {
  play: '<path d="M8 5v14l11-7z"/>',
  pausa: '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
  sonido: '<path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/>',
  mudo: '<path d="M4 9v6h4l5 4V5L8 9H4zm12.6 3 2.2-2.2-1.1-1.1-2.2 2.2-2.2-2.2-1.1 1.1 2.2 2.2-2.2 2.2 1.1 1.1 2.2-2.2 2.2 2.2 1.1-1.1z"/>',
  siguiente: '<path d="M6 5v14l9-7zM16 5h2.5v14H16z"/>',
  pantalla: '<path d="M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 4h-4v2h6v-6h-2z"/>',
};
export const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONO[k]}</svg>`;

export function init() {
  const overlay = document.getElementById('video-modal');
  if (!overlay) return;
  const frame = overlay.querySelector('iframe');
  const p = reproductor(overlay, frame);

  document.querySelectorAll('[data-video-embed]:not([data-video-atado])').forEach((trigger) => {
    trigger.setAttribute('data-video-atado', ''); // init() corre dos veces: un solo clic por miniatura
    trigger.addEventListener('click', () => {
      const src = trigger.getAttribute('data-video-embed');
      if (!src) return;
      const archivo = ARCHIVO_RE.test(src);
      frame.hidden = archivo;
      p.caja.hidden = !archivo;
      if (archivo) p.cargar(src); else frame.src = src;
      overlay.classList.add('is-open');
      document.dispatchEvent(new CustomEvent('video-modal:abierto'));
      overlay.querySelector('[data-close-video]').focus({ preventScroll: true, focusVisible: false });
    });
  });

  if (boundStatic) return;
  boundStatic = true;
  const cerrar = () => {
    if (!overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    frame.src = '';
    p.vaciar();
    document.dispatchEvent(new CustomEvent('video-modal:cerrado'));
  };
  overlay.querySelectorAll('[data-close-video]').forEach((btn) => btn.addEventListener('click', cerrar));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') cerrar();
    else if (e.key === ' ' && !p.caja.hidden && e.target.tagName !== 'INPUT') { e.preventDefault(); p.alternar(); }
  });
}

// Se arma una sola vez por página (el guard es el propio DOM).
function reproductor(overlay, frame) {
  const existente = overlay.querySelector('.vp');
  if (existente) return existente.api;

  const caja = document.createElement('div');
  caja.className = 'vp';
  caja.hidden = true;
  caja.innerHTML = `
    <video class="vp-video" playsinline preload="metadata"></video>
    <div class="vp-barra">
      <button type="button" class="vp-btn" data-vp="play" aria-label="Reproducir">${svg('play')}</button>
      <span class="vp-tiempo" data-vp="actual">0:00</span>
      <input class="vp-progreso" data-vp="progreso" type="range" min="0" max="1000" value="0" step="1" aria-label="Avance del video">
      <span class="vp-tiempo" data-vp="total">0:00</span>
      <button type="button" class="vp-btn" data-vp="sonido" aria-label="Silenciar">${svg('sonido')}</button>
      <button type="button" class="vp-btn" data-vp="pantalla" aria-label="Pantalla completa">${svg('pantalla')}</button>
    </div>
    <div class="vp-fin" data-vp="fin" hidden>
      <p class="vp-fin-titulo" data-vp="cta"></p>
      <div class="vp-fin-botones">
        <a class="vp-fin-wa" data-vp="wa" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>
        <button type="button" class="vp-fin-otra" data-vp="otra">Ver de nuevo</button>
      </div>
    </div>`;
  frame.after(caja);
  overlay.querySelectorAll(':scope > video').forEach((v) => v.remove()); // el <video> suelto de versiones anteriores

  const v = caja.querySelector('video');
  const $ = (k) => caja.querySelector(`[data-vp="${k}"]`);
  const play = $('play'), sonido = $('sonido'), barra = $('progreso'), actual = $('actual'), total = $('total');
  // Al terminar: invitación a cotizar. El texto lo pone cada página en data-cta del modal; el enlace
  // es el del WhatsApp flotante de la página (ya trae su mensaje).
  const fin = $('fin');
  $('cta').textContent = overlay.dataset.cta || '¿Te gustó? Hablemos de tu proyecto';
  $('wa').href = document.querySelector('.wa-float')?.href || 'https://wa.me/50764498833';
  $('otra').addEventListener('click', () => { v.currentTime = 0; v.play().catch(() => {}); });
  v.addEventListener('ended', () => { fin.hidden = false; caja.classList.remove('is-quieto'); });
  v.addEventListener('play', () => { fin.hidden = true; });
  let arrastrando = false;
  let quieto = 0;

  const pintar = () => {
    play.innerHTML = svg(v.paused ? 'play' : 'pausa');
    play.setAttribute('aria-label', v.paused ? 'Reproducir' : 'Pausar');
    caja.classList.toggle('is-pausado', v.paused);
  };
  const pintarSonido = () => {
    sonido.innerHTML = svg(v.muted ? 'mudo' : 'sonido');
    sonido.setAttribute('aria-label', v.muted ? 'Activar sonido' : 'Silenciar');
  };
  const avance = () => {
    if (!v.duration) return;
    if (!arrastrando) barra.value = Math.round((v.currentTime / v.duration) * 1000);
    barra.style.setProperty('--p', `${barra.value / 10}%`);
    actual.textContent = mmss(v.currentTime);
  };
  // Los controles se esconden tras 2,5 s sin mover el ratón mientras el video corre.
  const despertar = () => {
    caja.classList.remove('is-quieto');
    clearTimeout(quieto);
    quieto = setTimeout(() => { if (!v.paused) caja.classList.add('is-quieto'); }, 2500);
  };
  const alternar = () => (v.paused ? v.play().catch(() => {}) : v.pause());

  v.addEventListener('play', pintar);
  v.addEventListener('pause', () => { pintar(); despertar(); });
  v.addEventListener('timeupdate', avance);
  v.addEventListener('loadedmetadata', () => { total.textContent = mmss(v.duration); avance(); });
  v.addEventListener('volumechange', pintarSonido);
  v.addEventListener('waiting', () => caja.classList.add('is-cargando'));
  v.addEventListener('playing', () => caja.classList.remove('is-cargando'));
  v.addEventListener('click', alternar);
  play.addEventListener('click', alternar);
  sonido.addEventListener('click', () => { v.muted = !v.muted; });
  $('pantalla').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (caja.requestFullscreen) caja.requestFullscreen().catch(() => {});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iPhone
  });
  barra.addEventListener('input', () => {
    arrastrando = true;
    if (v.duration) v.currentTime = (barra.value / 1000) * v.duration;
    avance();
  });
  barra.addEventListener('change', () => { arrastrando = false; });
  caja.addEventListener('pointermove', despertar);

  const api = {
    caja,
    alternar,
    cargar(src) {
      v.muted = false;
      v.src = src;
      barra.value = 0;
      barra.style.setProperty('--p', '0%');
      actual.textContent = total.textContent = '0:00';
      caja.classList.add('is-cargando');
      fin.hidden = true;
      v.play().catch(() => pintar()); // si el navegador bloquea el sonido, queda en pausa con el botón a mano
      pintar();
      pintarSonido();
      despertar();
    },
    vaciar() {
      v.pause();
      v.removeAttribute('src');
      v.load();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    },
  };
  caja.api = api;
  return api;
}
