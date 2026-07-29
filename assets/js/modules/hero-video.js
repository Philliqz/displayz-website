// Video de fondo del hero — solo en desktop (≥900px) para no gastar datos móviles,
// y solo si el visitante no pidió "reducir movimiento" (accesibilidad). En mobile o
// con esa preferencia activada, el <video> nunca recibe src, así que el navegador
// jamás descarga el archivo.
const DESKTOP_QUERY = '(min-width: 900px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function init() {
  const video = document.querySelector('.hero-video-bg');
  if (!video) return;
  if (!window.matchMedia(DESKTOP_QUERY).matches) return;
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;

  video.addEventListener('canplay', () => { video.play().catch(() => {}); }, { once: true });
  video.src = 'assets/video/hero-bg.mp4';
}
