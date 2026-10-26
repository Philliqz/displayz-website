// Home: "Lo más destacado" (galería, una pieza por caso).
// Casos = empresas visibles con "destacado": 1, 2, 3… en database/empresas.json, en
// ese orden. Todo se llena solo desde los datos — para cambiar un caso destacado
// basta con mover ese número en el JSON.
import { fetchCompanies } from './data-store.js';
import { makePictureImg, tituloDe } from './portfolio.js';
import { observe } from './animations.js';
import { ARCHIVO_RE } from './video-provider.js';

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

// Las piezas del caso: los videos propios (mp4) marcados "destacado": true, uno por tile; si no
// hay, una sola pieza — su primer video propio o su primera imagen. Los de YouTube no salen aquí:
// en la home todo video se reproduce al instante, sin reproductor externo.
// Solo de las disciplinas activas: un video con video:false no sale aunque siga en el JSON.
function piezasDestacadas(c, keys) {
  const propios = keys.includes('video') ? piezas(c, 'video').filter((x) => ARCHIVO_RE.test(x.url || '')) : [];
  const marcados = propios.filter((x) => x.destacado);
  if (marcados.length) return marcados.map(comoVideo);
  if (propios.length) return [comoVideo(propios[0])];
  const g = keys.filter((k) => k !== 'video').flatMap((k) => piezas(c, k))[0];
  return g ? [{ src: g.archivo }] : [];
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
    const casos = visibles.filter((c) => Number(c.destacado) > 0)
      .sort((a, b) => Number(a.destacado) - Number(b.destacado));

    casos.forEach((c) => {
      const keys = disciplinas(c);
      piezasDestacadas(c, keys).forEach((p) => casosEl.appendChild(renderPieza(c, keys, p)));
    });
    autoplay(casosEl);
    observe(casosEl.querySelectorAll('.reveal'));
  }).catch(() => {});
}
