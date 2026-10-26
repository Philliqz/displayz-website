// Home: "Lo más destacado". Una sola pieza por caso, elegida a propósito.
// Casos = empresas visibles con "destacado": 1, 2, 3… en database/empresas.json, en
// ese orden; la pieza es "portada" (ruta de una imagen de su galería) si la hay, si no
// el primer video y si no la primera imagen. Todo sale de los datos.
import { fetchCompanies } from './data-store.js';
import { makePictureImg, tituloDe } from './portfolio.js';
import { observe } from './animations.js';
import { getThumbnailSync, toEmbedSrc } from './video-provider.js';
import * as VideoModal from './video-modal.js';

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

// La pieza del caso: la portada elegida, o el primer video, o la primera imagen.
function portada(c, keys) {
  const fotos = keys.filter((k) => k !== 'video').flatMap((k) => piezas(c, k));
  // Títulos y alt de las piezas pueden nombrar al cliente: solo con publico: true.
  const texto = (t) => (c.publico && t) || tituloDe(c);
  const elegida = c.portada && fotos.find((g) => g.archivo === c.portada);
  if (elegida) return { src: elegida.archivo, alt: texto(elegida.alt) };
  const v = keys.includes('video') && piezas(c, 'video').find((x) => x.url);
  // Sin miniatura propia, el video usa la primera foto del caso de portada; sigue siendo reproductor.
  const vSrc = v && (v.miniatura || getThumbnailSync(v.url, v.provider) || (fotos[0] && fotos[0].archivo));
  if (vSrc) return { src: vSrc, alt: texto(v.titulo), video: v };
  return fotos[0] ? { src: fotos[0].archivo, alt: texto(fotos[0].alt) } : null;
}

function renderCaso(c) {
  const keys = disciplinas(c);
  const p = portada(c, keys);
  const art = el('article', 'case reveal');
  if (p) {
    // Video: botón con aspecto de reproductor que abre el modal; foto: enlace al caso.
    const media = el(p.video ? 'button' : 'a', 'case-media');
    if (p.video) {
      media.type = 'button';
      media.setAttribute('data-video-embed', toEmbedSrc(p.video.url, p.video.provider));
      media.setAttribute('aria-label', 'Reproducir ' + p.alt);
    } else {
      media.href = urlEmpresa(c);
      media.setAttribute('aria-label', 'Ver ' + tituloDe(c));
    }
    const { node, img } = makePictureImg(p.src);
    img.alt = p.video ? '' : p.alt;
    img.loading = 'lazy';
    media.appendChild(node);
    if (p.video) {
      const player = el('span', 'player');
      player.appendChild(el('span', 'player-play'));
      const meta = el('span', 'player-meta');
      meta.appendChild(el('b', null, p.alt));
      meta.appendChild(el('small', null, 'Reproducir video'));
      player.appendChild(meta);
      media.appendChild(player);
    }
    art.appendChild(media);
  }
  const copy = el('div', 'case-copy');
  const h3 = el('h3', 'case-title');
  const a = el('a', null, tituloDe(c));
  a.href = urlEmpresa(c);
  h3.appendChild(a);
  copy.appendChild(h3);
  const go = el('a', 'case-go', '↗');
  go.href = urlEmpresa(c);
  go.setAttribute('aria-label', 'Ver el caso de ' + tituloDe(c));
  copy.appendChild(go);
  // La descripción nombra al cliente: solo con su permiso (publico: true), como en las galerías.
  if (c.publico && c.descripcion) copy.appendChild(el('p', 'case-desc', c.descripcion.split(/(?<=\.)\s/)[0]));
  copy.appendChild(el('p', 'case-line', keys.map((k) => SECCIONES[k]).join(' · ')));
  art.appendChild(copy);
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
    VideoModal.init();
  }).catch(() => {});
}
