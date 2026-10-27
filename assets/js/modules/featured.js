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
const MALLAS = [[960, 5, 5], [640, 3, 7], [0, 2, 7]];
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
  return { evento: v.evento, src: v.miniatura_vertical || v.miniatura, video: v.url_ligera || v.url, completo: v.url, forma: v.reel ? 'v' : 'h' };
}

// Imágenes siempre chicas (1×1); videos siempre de 2 celdas (pedido del fundador, 2026-10-26).
const FORMAS = { v: [1, 2], h: [2, 1], img: [1, 1], relleno: [1, 1] };

// Llena una malla cols×filas sin huecos. En cada celda libre (de arriba abajo, de izquierda a derecha)
// prueba las formas de los destacados —en el orden en que salieron del barajado, pero entre reel y
// horizontal primero el que va atrás, para que salgan en cantidades iguales o a uno de diferencia— y,
// solo si ninguna sirve, una imagen de relleno; si un camino se traba, retrocede. De cada forma toma la
// pieza cuya marca y cuyo nicho se han usado menos (fundador, 2026-10-26). Las filas no pasan de las que llenan
// los destacados, para que el relleno tape huecos y no arme filas enteras. Si no hay acomodo, una fila menos.
function acomodar(destacadas, relleno, cols, filas) {
  const forma = (x) => x.p.forma || 'img';
  const celdas = destacadas.reduce((n, x) => n + FORMAS[forma(x)][0] * FORMAS[forma(x)][1], 0);
  const orden = [...new Set(destacadas.map(forma)), 'relleno'];
  for (filas = Math.min(filas, Math.max(Math.ceil(celdas / cols), orden.includes('v') ? 2 : 1)); filas > 0; filas--) { // un reel pide 2 filas
    const colas = { v: [], h: [], img: [], relleno: relleno.slice() };
    destacadas.forEach((x) => colas[forma(x)].push(x));
    const libre = Array.from({ length: filas }, () => Array(cols).fill(true));
    const cabe = (f, c, w, h) => f + h <= filas && c + w <= cols && libre.slice(f, f + h).every((fila) => fila.slice(c, c + w).every(Boolean));
    const marcar = (f, c, w, h, v) => { for (let y = f; y < f + h; y++) for (let x = c; x < c + w; x++) libre[y][x] = v; };
    const out = [];
    const puestos = { v: 0, h: 0 };
    const uso = {};
    const claves = (x) => ['m:' + x.c.slug, 'n:' + (x.c.nicho || x.c.slug)];
    const gasto = (x) => claves(x).reduce((n, k, i) => n + (uso[k] || 0) * (i ? 1 : 2), 0); // marca pesa doble
    const usar = (x, d) => claves(x).forEach((k) => { uso[k] = (uso[k] || 0) + d; });
    let pasos = 0, mejor = null;
    const llenar = () => {
      const k = libre.flat().indexOf(true);
      if (k < 0) { // llena: vale si reels y horizontales quedan a uno; si no, se guarda y se busca otra
        const d = Math.abs(puestos.v - puestos.h);
        if (d <= 1) return true;
        if (!mejor || d < mejor.d) mejor = { d, out: out.slice() };
        return false;
      }
      if (++pasos > 5000) return false; // ponytail: tope de búsqueda; pasado el tope, una fila menos
      const f = Math.floor(k / cols), c = k % cols;
      const turno = orden.slice();
      const iv = turno.indexOf('v'), ih = turno.indexOf('h');
      if (iv >= 0 && ih >= 0 && puestos.v !== puestos.h && (puestos.v > puestos.h) === (iv < ih)) [turno[iv], turno[ih]] = ['h', 'v'];
      for (const t of turno) {
        const [w, h] = FORMAS[t];
        if (!colas[t].length || !cabe(f, c, w, h)) continue;
        const i = colas[t].reduce((m, x, j, l) => (gasto(x) < gasto(l[m]) ? j : m), 0);
        const [item] = colas[t].splice(i, 1);
        marcar(f, c, w, h, false);
        usar(item, 1);
        if (t in puestos) puestos[t]++;
        out.push({ ...item, f, col: c, w, h });
        if (llenar()) return true;
        out.pop();
        if (t in puestos) puestos[t]--;
        usar(item, -1);
        marcar(f, c, w, h, true);
        colas[t].splice(i, 0, item);
      }
      return false;
    };
    if (llenar()) return out;
    if (mejor) return mejor.out; // la más pareja que se encontró dentro del tope
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
    v.defaultMuted = true; // atributo muted: Safari iOS no arranca solo un video sin él
    v.setAttribute('playsinline', '');
    v.loop = true;
    v.playsInline = true;
    v.preload = 'none';
    if (p.src) v.poster = p.src;
    v.src = p.video;
    v.setAttribute('aria-hidden', 'true');
    art.appendChild(v);
    const rec = el('span', 'rec');
    rec.appendChild(el('i'));
    rec.appendChild(document.createTextNode(p.evento || 'Video'));
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
    // Relleno: las demás imágenes de esas marcas — acomodar() solo las usa para tapar huecos.
    const usadas = new Set(todas.map((x) => x.p.src));
    const relleno = casos.flatMap((c) => { const keys = disciplinas(c); return keys.filter((k) => k !== 'video')
      .flatMap((k) => piezas(c, k)).filter((x) => !usadas.has(x.archivo)).map((x) => ({ c, keys, p: { src: x.archivo } })); });
    const barajar = (l) => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
    barajar(todas);
    barajar(relleno);

    const pintar = () => {
      const [, cols, filas] = MALLAS.find(([ancho]) => matchMedia(`(min-width: ${ancho}px)`).matches);
      const imagenes = [];
      const enfocada = casosEl.contains(document.activeElement) ? document.activeElement.pieza : null;
      casosEl.replaceChildren(...acomodar(todas, relleno, cols, filas).map((x) => renderPieza(x, imagenes)));
      if (enfocada) ([...casosEl.children].find((b) => b.pieza === enfocada) || casosEl.firstElementChild)?.focus();
      autoplay(casosEl);
      VideoModal.init();
      observe(casosEl.querySelectorAll('.reveal'));
    };
    pintar();
    MALLAS.forEach(([ancho]) => ancho && matchMedia(`(min-width: ${ancho}px)`).addEventListener('change', pintar));
  }).catch(() => {});
}
