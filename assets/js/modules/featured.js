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

// Imágenes de un proyecto: primero la miniatura del video (si hay), luego las de galería.
// Solo de las disciplinas activas: un video con video:false no sale aunque siga en el JSON.
function medios(c, keys) {
  const fotos = [];
  const v = keys.includes('video') && piezas(c, 'video')
    .map((x) => ({ x, src: x.miniatura || getThumbnailSync(x.url, x.provider) }))
    .find((o) => o.src);
  if (v) fotos.push({ src: v.src, vertical: v.x.miniatura_vertical, alt: v.x.titulo || c.nombre, video: true });
  keys.filter((k) => k !== 'video').forEach((k) =>
    piezas(c, k).forEach((g) => fotos.push({ src: g.archivo, alt: g.alt || c.nombre, tipo: k })));
  return fotos;
}

// Portada: una pieza por caso destacado. La de video va al frente.
function renderCollage(collageEl, casos) {
  const cartas = casos.slice(0, 3).map((c) => {
    const f = medios(c, disciplinas(c))[0];
    return f && { c, f };
  }).filter(Boolean);
  cartas.sort((a, b) => Number(!!a.f.video) - Number(!!b.f.video));
  // La última va al frente, sean 1, 2 o 3; las demás se reparten detrás a cada lado.
  const lados = ['collage-left', 'collage-right'];
  cartas.forEach(({ c, f }, i) => {
    const frente = i === cartas.length - 1;
    const a = el('a', 'collage-card ' + (frente ? 'collage-front' : lados[i]));
    a.href = urlEmpresa(c);
    const etiqueta = (f.video ? 'Video' : SECCIONES[f.tipo]) + ' · ' + c.nombre;
    a.setAttribute('aria-label', 'Ver proyecto: ' + etiqueta);
    // Las tarjetas son verticales: un Short se ve mejor con su miniatura vertical, si la hay.
    const { node, img } = makePictureImg(f.vertical || f.src);
    img.alt = '';
    if (!frente) img.loading = 'lazy';
    a.appendChild(node);
    if (f.video) a.appendChild(el('span', 'collage-play', '▶')).setAttribute('aria-hidden', 'true');
    a.appendChild(el('span', 'collage-tag', etiqueta));
    collageEl.appendChild(a);
  });
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

  const media = el('a', 'case-media');
  media.href = urlEmpresa(c);
  media.setAttribute('aria-label', 'Ver ' + c.nombre);
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
  if (!casosEl && !indiceEl && !document.querySelector('[data-marcas], [data-collage]')) return;

  fetchCompanies().then((companies) => {
    const visibles = companies.filter((c) => c && disciplinas(c).length);
    const casos = visibles.filter((c) => Number(c.destacado) > 0)
      .sort((a, b) => Number(a.destacado) - Number(b.destacado));
    const resto = visibles.filter((c) => !casos.includes(c))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    const collageEl = document.querySelector('[data-collage]');
    if (collageEl) renderCollage(collageEl, casos);
    if (casosEl) casos.forEach((c, i) => casosEl.appendChild(renderCaso(c, i)));
    const count = document.querySelector('[data-casos-count]');
    if (count) count.textContent = pad(casos.length) + (casos.length === 1 ? ' caso' : ' casos');
    if (indiceEl) {
      indiceEl.start = casos.length + 1;
      resto.forEach((c, i) => indiceEl.appendChild(renderIndice(c, casos.length + i + 1)));
    }
    if (casosEl) observe(casosEl.querySelectorAll('.reveal'));
    // Franja de marcas: los nombres, dos veces seguidas para que el loop no salte.
    const marcasEl = document.querySelector('[data-marcas]');
    if (marcasEl) {
      const nombres = visibles.map((c) => c.nombre.split(' — ')[0]);
      [...nombres, ...nombres].forEach((n) => {
        const s = el('span', null, n);
        s.prepend(Object.assign(document.createElement('img'), { src: 'assets/images/isotipo.png', alt: '' }));
        marcasEl.appendChild(s);
      });
    }
  }).catch(() => {});
}
