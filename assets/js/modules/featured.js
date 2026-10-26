// Home: "Trabajo seleccionado" (casos grandes).
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

// Imágenes de un proyecto: primero la miniatura del video (si hay), luego las de galería.
// Solo de las disciplinas activas: un video con video:false no sale aunque siga en el JSON.
function medios(c, keys) {
  const fotos = [];
  const v = keys.includes('video') && piezas(c, 'video')
    .map((x) => ({ x, src: x.miniatura || getThumbnailSync(x.url, x.provider) }))
    .find((o) => o.src);
  if (v) fotos.push({ src: v.src, vertical: v.x.miniatura_vertical, alt: v.x.titulo || tituloDe(c), video: true });
  keys.filter((k) => k !== 'video').forEach((k) =>
    piezas(c, k).forEach((g) => fotos.push({ src: g.archivo, alt: g.alt || tituloDe(c), tipo: k })));
  return fotos;
}

function renderCaso(c) {
  const keys = disciplinas(c);
  const art = el('article', 'case reveal');

  const copy = el('div', 'case-copy');
  const h3 = el('h3', 'case-title');
  const a = el('a', null, tituloDe(c));
  a.href = urlEmpresa(c);
  h3.appendChild(a);
  copy.appendChild(h3);
  copy.appendChild(el('p', 'case-line', keys.map((k) => SECCIONES[k]).join(' · ')));
  art.appendChild(copy);

  const media = el('a', 'case-media');
  media.href = urlEmpresa(c);
  media.setAttribute('aria-label', 'Ver ' + tituloDe(c));
  medios(c, keys).slice(0, 3).forEach((f) => {
    const { node, img } = makePictureImg(f.src);
    img.alt = f.alt;
    img.loading = 'lazy';
    if (!f.video) { media.appendChild(node); return; }
    const wrap = el('div', 'media-wrap');
    wrap.appendChild(node);
    const rec = el('span', 'rec');
    rec.appendChild(el('i'));
    rec.appendChild(document.createTextNode('Video'));
    wrap.appendChild(rec);
    media.appendChild(wrap);
  });
  art.appendChild(media);
  return art;
}

export function init() {
  const casosEl = document.querySelector('[data-casos]');
  if (!casosEl) return;

  fetchCompanies().then((companies) => {
    const visibles = companies.filter((c) => c && disciplinas(c).length);
    const casos = visibles.filter((c) => Number(c.destacado) > 0)
      .sort((a, b) => Number(a.destacado) - Number(b.destacado));

    casos.forEach((c) => casosEl.appendChild(renderCaso(c)));
    observe(casosEl.querySelectorAll('.reveal'));
  }).catch(() => {});
}
