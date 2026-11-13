// Visor de reels a pantalla completa, como Reels o TikTok: se desliza hacia arriba o abajo y cada
// reel suena y corre solo mientras está en pantalla. Lo abre el botón «Ver reels» del teléfono.
// Un solo <video> que se mueve al reel activo: Safari iOS solo deja sonar el elemento que arrancó
// con el toque del usuario; con uno por reel, el sonido se cortaba al deslizar.
import { svg } from './video-modal.js?v=20261113-2';

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

function boton(clase, etiqueta, icono) {
  const b = el('button', 'feed-btn ' + clase);
  b.type = 'button';
  b.setAttribute('aria-label', etiqueta);
  b.innerHTML = icono;
  return b;
}

const FLECHA = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CERRAR = FLECHA('M6 6l12 12M18 6 6 18');

// reels: [{ url, titulo, empresa, miniatura }]; inicio: índice; sonido: si arranca con audio.
// alCambiarSonido(bool) avisa al teléfono para que quede igual al cerrar.
export function abrir(reels, inicio, sonido, alCambiarSonido) {
  if (!reels.length) return;
  const previo = document.activeElement;
  const raiz = el('div', 'feed');
  raiz.setAttribute('role', 'dialog');
  raiz.setAttribute('aria-modal', 'true');
  raiz.setAttribute('aria-label', 'Reels de Displayz');
  const lista = el('div', 'feed-lista');
  const items = reels.map((r) => {
    const s = el('section', 'feed-item');
    const img = el('img', 'feed-poster');
    img.alt = '';
    img.loading = 'lazy';
    img.src = r.miniatura_vertical || r.miniatura || '';
    const info = el('div', 'feed-info');
    info.appendChild(el('strong', null, r.titulo || 'Reel'));
    if (r.empresa) info.appendChild(el('span', null, r.empresa));
    s.append(img, info);
    return s;
  });
  lista.append(...items);

  const video = el('video', 'feed-video');
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.loop = true;
  video.muted = !sonido;

  const cerrar = boton('feed-cerrar', 'Cerrar reels', CERRAR);
  const son = boton('feed-sonido', '', '');
  const arriba = boton('feed-arriba', 'Reel anterior', FLECHA('M6 15l6-6 6 6'));
  const abajo = boton('feed-abajo', 'Reel siguiente', FLECHA('M6 9l6 6 6-6'));
  const pintarSonido = () => {
    son.innerHTML = svg(video.muted ? 'mudo' : 'sonido');
    son.setAttribute('aria-label', video.muted ? 'Activar el audio' : 'Silenciar');
    son.setAttribute('aria-pressed', String(!video.muted));
  };
  pintarSonido();
  // WhatsApp dentro del visor (fundador, 2026-11-13): el de la página queda tapado. Mismo número y
  // mensaje que el botón flotante; el texto nombra el reel que se está viendo.
  const waPagina = document.querySelector('.wa-float');
  const wa = el('a', 'feed-wa');
  wa.target = '_blank';
  wa.rel = 'noopener';
  wa.innerHTML = (waPagina?.querySelector('svg')?.outerHTML || '') + '<span>Escríbenos</span>';
  wa.setAttribute('aria-label', 'Escribir por WhatsApp');
  const waBase = (waPagina?.href || 'https://wa.me/50764498833').split('?')[0];
  // Pista de swipe: una mano que sube, solo en pantallas táctiles, hasta el primer cambio de reel.
  const pista = el('div', 'feed-pista');
  pista.setAttribute('aria-hidden', 'true');
  pista.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 11.2V5.5a1.5 1.5 0 0 1 3 0v5.2l4.3.9a2 2 0 0 1 1.6 2.2l-.6 4.7A2.5 2.5 0 0 1 14.8 21h-3.6a2.5 2.5 0 0 1-2-1l-3.4-4.6a1.4 1.4 0 0 1 2.1-1.8L9 15z" fill="currentColor"/></svg><span>Desliza para ver más</span>';
  raiz.append(lista, cerrar, son, arriba, abajo, wa);
  if (reels.length > 1 && matchMedia('(pointer: coarse)').matches) raiz.appendChild(pista);
  const quitarPista = () => { pista.classList.add('is-fuera'); setTimeout(() => pista.remove(), 400); };
  setTimeout(quitarPista, 6000);

  let actual = -1;
  const jugar = () => video.play().catch((e) => {
    if (e.name !== 'NotAllowedError' || video.muted) return;
    video.muted = true; // el navegador no dejó sonar: sigue en silencio y el botón lo muestra
    pintarSonido();
    alCambiarSonido(false);
    video.play().catch(() => {});
  });
  const activar = (n) => {
    if (n === actual || !reels[n]) return;
    actual = n;
    const r = reels[n];
    video.poster = r.miniatura_vertical || r.miniatura || '';
    video.src = r.url;
    items[n].insertBefore(video, items[n].querySelector('.feed-info'));
    jugar();
    wa.href = `${waBase}?text=${encodeURIComponent(`Hola, vi el reel «${r.titulo || 'de Displayz'}» y quiero hablar sobre mi marca`)}`;
    if (n !== inicio) quitarPista();
    arriba.disabled = n === 0;
    abajo.disabled = n === reels.length - 1;
  };
  const ir = (d) => {
    const n = Math.max(0, Math.min(reels.length - 1, actual + d));
    items[n].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) activar(items.indexOf(e.target));
  }), { root: lista, threshold: 0.6 });

  const teclas = (e) => {
    if (e.key === 'Escape') history.back();
    else if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); ir(1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); ir(-1); }
    else if (e.key === 'Tab') { // el foco no sale del visor
      const f = [...raiz.querySelectorAll('button:not(:disabled)')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  };
  // Atrás del teléfono cierra el visor en vez de salir de la página.
  const alVolver = () => {
    io.disconnect();
    video.pause();
    video.removeAttribute('src');
    video.load();
    raiz.remove();
    document.documentElement.classList.remove('feed-abierto');
    removeEventListener('keydown', teclas);
    removeEventListener('popstate', alVolver);
    document.dispatchEvent(new CustomEvent('reels:cerrado'));
    previo?.focus?.();
  };

  cerrar.addEventListener('click', () => history.back());
  son.addEventListener('click', () => {
    video.muted = !video.muted;
    pintarSonido();
    alCambiarSonido(!video.muted);
    if (video.paused) jugar();
  });
  arriba.addEventListener('click', () => ir(-1));
  abajo.addEventListener('click', () => ir(1));
  // Tocar el video lo pausa o lo sigue, como en la app.
  lista.addEventListener('click', (e) => {
    if (!e.target.closest('.feed-item')) return;
    if (video.paused) jugar(); else video.pause();
  });

  document.body.appendChild(raiz);
  document.documentElement.classList.add('feed-abierto');
  document.dispatchEvent(new CustomEvent('reels:abierto'));
  items[inicio].scrollIntoView({ block: 'start' });
  activar(inicio); // dentro del mismo toque: así el navegador deja que suene
  items.forEach((s) => io.observe(s));
  history.pushState({ reels: true }, '');
  addEventListener('popstate', alVolver);
  addEventListener('keydown', teclas);
  cerrar.focus({ preventScroll: true });
}
