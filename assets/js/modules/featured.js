// Home: "Lo más destacado" (galería, una pieza por caso).
// Casos = empresas visibles con "destacado": 1, 2, 3… en database/empresas.json, en
// ese orden. Todo se llena solo desde los datos — para cambiar un caso destacado
// basta con mover ese número en el JSON.
import { fetchCompanies } from './data-store.js';
import { makePictureImg, tituloDe } from './portfolio.js';
import { observe } from './animations.js';
import { getThumbnailSync } from './video-provider.js';

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

// La pieza del caso, una sola: la miniatura del video (vertical si el video lo es) o la primera imagen.
// Solo de las disciplinas activas: un video con video:false no sale aunque siga en el JSON.
function pieza(c, keys) {
  const v = keys.includes('video') && piezas(c, 'video').find((x) => x.miniatura_vertical || x.miniatura || getThumbnailSync(x.url, x.provider));
  if (v) return { src: v.miniatura_vertical || v.miniatura || getThumbnailSync(v.url, v.provider), video: true };
  const g = keys.filter((k) => k !== 'video').flatMap((k) => piezas(c, k))[0];
  return g ? { src: g.archivo } : null;
}

// Galería: cada caso es su pieza a su proporción (por eso los tamaños varían); el texto
// aparece encima, sobre un degradado negro, al pasar el mouse (en pantallas táctiles, siempre).
function renderCaso(c) {
  const keys = disciplinas(c);
  const p = pieza(c, keys);
  if (!p) return null;
  const art = el('a', 'case reveal');
  art.href = urlEmpresa(c);
  const { node, img } = makePictureImg(p.src);
  img.alt = ''; // el nombre del enlace ya lo dan el título y las disciplinas del overlay
  img.loading = 'lazy';
  art.appendChild(node);
  if (p.video) {
    const rec = el('span', 'rec');
    rec.appendChild(el('i'));
    rec.appendChild(document.createTextNode('Video'));
    art.appendChild(rec);
  }
  const over = el('span', 'case-over');
  over.appendChild(el('span', 'case-title', tituloDe(c)));
  over.appendChild(el('span', 'case-line', keys.map((k) => SECCIONES[k]).join(' · ')));
  art.appendChild(over);
  return art;
}

export function init() {
  const casosEl = document.querySelector('[data-casos]');
  if (!casosEl) return;

  fetchCompanies().then((companies) => {
    const visibles = companies.filter((c) => c && disciplinas(c).length);
    const casos = visibles.filter((c) => Number(c.destacado) > 0)
      .sort((a, b) => Number(a.destacado) - Number(b.destacado));

    casos.map(renderCaso).filter(Boolean).forEach((n) => casosEl.appendChild(n));
    observe(casosEl.querySelectorAll('.reveal'));
  }).catch(() => {});
}
