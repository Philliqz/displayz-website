// Home: "Trabajo seleccionado" (casos grandes) + "Índice" (el resto de proyectos).
// Casos = empresas visibles con "destacado": 1, 2, 3… en database/empresas.json, en
// ese orden. El índice lista las demás empresas visibles. Todo se llena solo desde
// los datos — para cambiar un caso destacado basta con mover ese número en el JSON.
import { fetchCompanies } from './data-store.js';
import { makePictureImg } from './portfolio.js';
import { CONFIG } from './config.js';
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

function pad(n) { return String(n).padStart(2, '0'); }

function urlEmpresa(c) { return 'empresa.html?slug=' + encodeURIComponent(c.slug); }

function formato(c, keys) {
  return keys.map((k) => {
    const n = piezas(c, k).length;
    if (k === 'video') return n + (n === 1 ? ' video' : ' videos');
    if (k === 'fotografia') return n + (n === 1 ? ' foto' : ' fotos');
    return n + (n === 1 ? ' pieza' : ' piezas');
  }).join(' · ');
}

function renderCaso(c, i) {
  const keys = disciplinas(c);
  const art = el('article', 'case reveal');
  art.appendChild(el('span', 'case-num', pad(i + 1)));

  const copy = el('div', 'case-copy');
  const h3 = el('h3', 'case-title');
  const a = el('a', null, c.nombre);
  a.href = urlEmpresa(c);
  h3.appendChild(a);
  copy.appendChild(h3);
  if (c.descripcion) copy.appendChild(el('p', 'case-desc', c.descripcion));
  const dl = el('dl', 'meta');
  [['Disciplina', keys.map((k) => SECCIONES[k]).join(' y ')],
   ['Formato', formato(c, keys)],
   ['Categoría', CONFIG.GRUPOS[c.nicho] || c.nicho]].forEach(([k, v]) => {
    if (!v) return;
    dl.appendChild(el('dt', null, k));
    dl.appendChild(el('dd', null, v));
  });
  copy.appendChild(dl);
  const ver = el('a', 'case-link', 'Ver proyecto →');
  ver.href = urlEmpresa(c);
  copy.appendChild(ver);
  art.appendChild(copy);

  // Tres imágenes: primero la miniatura del video (si hay), luego las de galería.
  const media = el('a', 'case-media');
  media.href = urlEmpresa(c);
  media.setAttribute('aria-label', 'Ver ' + c.nombre);
  // Solo de las disciplinas activas: un video con video:false no sale aunque siga en el JSON.
  const fotos = [];
  const v = keys.includes('video') && piezas(c, 'video')
    .map((x) => ({ x, src: x.miniatura || getThumbnailSync(x.url, x.provider) }))
    .find((o) => o.src);
  if (v) fotos.push({ src: v.src, alt: v.x.titulo || c.nombre, video: true });
  keys.filter((k) => k !== 'video').forEach((k) =>
    piezas(c, k).forEach((g) => fotos.push({ src: g.archivo, alt: g.alt || c.nombre })));
  fotos.slice(0, 3).forEach((f) => {
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

function renderIndice(c, n) {
  const li = el('li');
  const a = el('a');
  a.href = urlEmpresa(c);
  a.appendChild(el('span', 'index-n', pad(n)));
  a.appendChild(el('span', 'index-name', c.nombre));
  const d = [disciplinas(c).map((k) => SECCIONES[k]).join(' · '), CONFIG.GRUPOS[c.nicho] || c.nicho].filter(Boolean).join(' — ');
  a.appendChild(el('span', 'index-d', d));
  li.appendChild(a);
  return li;
}

export function init() {
  const casosEl = document.querySelector('[data-casos]');
  const indiceEl = document.querySelector('[data-indice]');
  if (!casosEl && !indiceEl) return;

  fetchCompanies().then((companies) => {
    const visibles = companies.filter((c) => c && disciplinas(c).length);
    const casos = visibles.filter((c) => Number(c.destacado) > 0)
      .sort((a, b) => Number(a.destacado) - Number(b.destacado));
    const resto = visibles.filter((c) => !casos.includes(c))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    if (casosEl) casos.forEach((c, i) => casosEl.appendChild(renderCaso(c, i)));
    const count = document.querySelector('[data-casos-count]');
    if (count) count.textContent = pad(casos.length) + (casos.length === 1 ? ' caso' : ' casos');
    if (indiceEl) {
      indiceEl.start = casos.length + 1;
      resto.forEach((c, i) => indiceEl.appendChild(renderIndice(c, casos.length + i + 1)));
    }
    if (casosEl) observe(casosEl.querySelectorAll('.reveal'));
  }).catch(() => {});
}
