// Home: "Lo más destacado" (galería, una pieza por caso).
// Casos = empresas visibles con "destacado" (un número > 0) en database/empresas.json. Sus piezas
// se barajan en cada visita y se muestran MAX: el número ya no ordena, solo incluye.
import { fetchCompanies } from './data-store.js';
import { makePictureImg, tituloDe } from './portfolio.js';
import { observe } from './animations.js';
import { ARCHIVO_RE } from './video-provider.js';

const MAX = 8; // piezas por visita: dos filas en PC (4 columnas)
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

function urlEmpresa(c) { return 'empresa.html?slug=' + encodeURIComponent(c.slug); }

// Las piezas del caso: las marcadas "destacado": true (videos propios o imágenes), una por tile;
// si no hay, una sola — su primer video propio o su primera imagen. Los de YouTube no salen aquí:
// en la home todo video se reproduce al instante, sin reproductor externo.
// Solo de las disciplinas activas: un video con video:false no sale aunque siga en el JSON.
function piezasDestacadas(c, keys) {
  const todas = keys.flatMap((k) => (k === 'video' ? piezas(c, k).filter((x) => ARCHIVO_RE.test(x.url || '')) : piezas(c, k)));
  const marcadas = todas.filter((x) => x.destacado);
  return (marcadas.length ? marcadas : todas.slice(0, 1)).map((x) => (x.archivo ? { src: x.archivo } : comoVideo(x)));
}

function comoVideo(v) {
  return { src: v.miniatura_vertical || v.miniatura, video: v.url_ligera || v.url };
}

// Galería: cada pieza a su proporción (por eso los tamaños varían); el texto aparece encima,
// sobre un degradado negro, al pasar el mouse (en pantallas táctiles, siempre).
function renderPieza(c, keys, p) {
  const art = el('a', 'case reveal');
  art.href = urlEmpresa(c);
  if (p.video) {
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

    // Todas las piezas destacadas, barajadas: cada visita muestra otras MAX y en otro orden.
    const todas = casos.flatMap((c) => { const keys = disciplinas(c); return piezasDestacadas(c, keys).map((p) => [c, keys, p]); });
    for (let i = todas.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [todas[i], todas[j]] = [todas[j], todas[i]]; }
    todas.slice(0, MAX).forEach(([c, keys, p]) => casosEl.appendChild(renderPieza(c, keys, p)));
    autoplay(casosEl);
    observe(casosEl.querySelectorAll('.reveal'));
  }).catch(() => {});
}
