// Home: "Lo más destacado" — cuadrícula de celdas cuadradas, siempre completa (sin huecos al pie).
// Casos = empresas visibles con "destacado" (un número > 0) en database/empresas.json. Sus piezas
// se barajan en cada visita: el número ya no ordena, solo incluye. Los videos se abren en el modal
// y las imágenes en el visor, sin salir de la home.
import { fetchCompanies } from './data-store.js';
import { makePictureImg, tituloDe } from './portfolio.js';
import { observe } from './animations.js';
import { ARCHIVO_RE } from './video-provider.js';
import * as VideoModal from './video-modal.js';
import * as Lightbox from './lightbox.js';

// Columnas y filas por ancho (igual que los @media de [data-casos] en style.css).
const MALLAS = [[960, 5, 4], [640, 3, 6], [0, 2, 6]];
const SECCIONES = { video: 'Video', fotografia: 'Fotografía', diseno: 'Diseño' };

function disciplinas(c) {
  return Object.keys(SECCIONES).filter((k) => c[k] && piezas(c, k).length);
}

function piezas(c, key) {
  if (key === 'video') return c.videos || [];
  return (c.galeria || []).filter((g) => g.tipo === key);
}

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

// Las piezas del caso: las marcadas "destacado": true (videos propios o imágenes), una por tile;
// si no hay, una sola — su primer video propio o su primera imagen. Los de YouTube no salen aquí:
// en la home todo video se reproduce al instante, sin reproductor externo.
// Solo de las disciplinas activas: un video con video:false no sale aunque siga en el JSON.
function piezasDestacadas(c, keys) {
  const todas = keys.flatMap((k) => (k === 'video' ? piezas(c, k).filter((x) => ARCHIVO_RE.test(x.url || '')) : piezas(c, k)));
  const marcadas = todas.filter((x) => x.destacado);
  return (marcadas.length ? marcadas : todas.slice(0, 1)).map((x) => (x.archivo ? { src: x.archivo } : comoVideo(x)));
}

// forma: 'v' (reel, 1×2 celdas), 'h' (horizontal, 2×1) o 'img' (ver FORMAS).
function comoVideo(v) {
  return { src: v.miniatura_vertical || v.miniatura, video: v.url_ligera || v.url, completo: v.url, forma: v.reel ? 'v' : 'h' };
}

// Las imágenes suelen ser 4:5 o 1:1: grandes (2×2) si caben, si no 1×1; así casi no se recortan.
const FORMAS = { v: [[1, 2]], h: [[2, 1]], img: [[2, 2], [1, 1]] };

// Llena una malla cols×filas: en cada celda libre (de arriba abajo, de izquierda a derecha) pone la
// primera pieza cuya forma quepa; si ninguna cabe, la primera que quede ocupa 1×1 (recortada).
// Si se acaban las piezas antes de llenar, prueba con una fila menos: el bloque nunca queda disparejo.
// ponytail: voraz, no busca el mejor acomodo; basta con el pool de destacados de hoy (~12 piezas).
function acomodar(pool, cols, filas) {
  for (; filas > 0; filas--) {
    const libre = Array.from({ length: filas }, () => Array(cols).fill(true));
    const cabe = (f, c, w, h) => f + h <= filas && c + w <= cols && libre.slice(f, f + h).every((fila) => fila.slice(c, c + w).every(Boolean));
    const resto = pool.slice();
    const out = [];
    let ok = true;
    for (let f = 0; f < filas && ok; f++) for (let c = 0; c < cols && ok; c++) {
      if (!libre[f][c]) continue;
      let i = -1, w = 1, h = 1;
      for (let k = 0; k < resto.length && i < 0; k++) {
        const opciones = FORMAS[resto[k].p.forma || 'img'];
        const fit = opciones.find(([a, b]) => cabe(f, c, a, b));
        if (fit) { i = k; [w, h] = fit; }
      }
      if (i < 0) i = resto.length ? 0 : -1;
      if (i < 0) { ok = false; break; }
      for (let y = f; y < f + h; y++) for (let x = c; x < c + w; x++) libre[y][x] = false;
      out.push({ ...resto.splice(i, 1)[0], f, col: c, w, h });
    }
    if (ok) return out;
  }
  return [];
}

// El texto aparece encima, sobre un degradado negro, al pasar el mouse (en pantallas táctiles, siempre).
function renderPieza({ c, keys, p, f, col, w, h }, imagenes) {
  const art = el('button', 'case reveal');
  art.type = 'button';
  art.pieza = p; // para devolver el foco tras repintar
  art.style.gridArea = `${f + 1} / ${col + 1} / span ${h} / span ${w}`;
  if (p.video) {
    art.setAttribute('data-video-embed', p.completo); // video-modal.js: 1080p con audio
    // Mudo y en bucle: así el navegador lo deja arrancar solo. Se carga y suena solo en pantalla.
    const v = el('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'none';
    if (p.src) v.poster = p.src;
    v.src = p.video;
    v.setAttribute('aria-hidden', 'true');
    art.appendChild(v);
    const rec = el('span', 'rec');
    rec.appendChild(el('i'));
    rec.appendChild(document.createTextNode('Video'));
    art.appendChild(rec);
  } else {
    const { node, img } = makePictureImg(p.src);
    img.alt = ''; // el nombre del enlace ya lo dan el título y las disciplinas del overlay
    img.loading = 'lazy';
    const azar = (a, b) => (a + Math.random() * (b - a)).toFixed(2);
    img.style.setProperty('--kb-dur', azar(14, 24) + 's');
    img.style.setProperty('--kb-delay', '-' + azar(0, 20) + 's');
    img.style.setProperty('--kb-x', azar(-3, 3) + '%');
    img.style.setProperty('--kb-y', azar(-3, 3) + '%');
    art.appendChild(node);
    const i = imagenes.push({ src: p.src, alt: tituloDe(c) }) - 1;
    art.addEventListener('click', () => Lightbox.abrir(imagenes, i));
  }
  const over = el('span', 'case-over');
  over.appendChild(el('span', 'case-title', tituloDe(c)));
  over.appendChild(el('span', 'case-line', keys.map((k) => SECCIONES[k]).join(' · ')));
  art.appendChild(over);
  return art;
}

// Reproduce cada video mientras está a la vista; fuera de pantalla, en pausa.
function autoplay(root) {
  const videos = root.querySelectorAll('video');
  if (!('IntersectionObserver' in window)) { videos.forEach((v) => v.play().catch(() => {})); return; }
  const io = new IntersectionObserver((entradas) => entradas.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) target.play().catch(() => {}); else target.pause();
  }), { rootMargin: '200px 0px' });
  videos.forEach((v) => io.observe(v));
}

export function init() {
  const casosEl = document.querySelector('[data-casos]');
  if (!casosEl) return;

  fetchCompanies().then((companies) => {
    const visibles = companies.filter((c) => c && disciplinas(c).length);
    const casos = visibles.filter((c) => Number(c.destacado) > 0);

    // Todas las piezas destacadas, barajadas una vez por visita; la malla se rehace al cambiar de ancho.
    const todas = casos.flatMap((c) => { const keys = disciplinas(c); return piezasDestacadas(c, keys).map((p) => ({ c, keys, p })); });
    for (let i = todas.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [todas[i], todas[j]] = [todas[j], todas[i]]; }

    const pintar = () => {
      const [, cols, filas] = MALLAS.find(([ancho]) => matchMedia(`(min-width: ${ancho}px)`).matches);
      const imagenes = [];
      const enfocada = casosEl.contains(document.activeElement) ? document.activeElement.pieza : null;
      casosEl.replaceChildren(...acomodar(todas, cols, filas).map((x) => renderPieza(x, imagenes)));
      if (enfocada) ([...casosEl.children].find((b) => b.pieza === enfocada) || casosEl.firstElementChild)?.focus();
      autoplay(casosEl);
      VideoModal.init();
      observe(casosEl.querySelectorAll('.reveal'));
    };
    pintar();
    MALLAS.forEach(([ancho]) => ancho && matchMedia(`(min-width: ${ancho}px)`).addEventListener('change', pintar));
  }).catch(() => {});
}
