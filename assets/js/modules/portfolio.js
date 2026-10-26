// Renderiza las secciones de portafolio (video/fotografía/diseño) de cada página de
// galería. Lee de data-store.js — nunca hace fetch directo — así que este archivo no
// sabe ni le importa si los datos vienen de un JSON estático o de un backend real.
import { fetchCompanies } from './data-store.js';
import { CONFIG } from './config.js';
import { observe } from './animations.js';
import * as Lightbox from './lightbox.js';
import * as VideoModal from './video-modal.js';
import { toEmbedSrc, getThumbnailSync, fetchThumbnail } from './video-provider.js';

export function init() {
  const section = document.querySelector('[data-portfolio-section]');
  if (!section) return;
  const sectionKey = section.getAttribute('data-portfolio-section'); // "video" | "eventos" | "fotografia" | "diseno"
  const container = section.querySelector('[data-portfolio-companies]');
  const emptyState = section.querySelector('[data-portfolio-empty]');

  fetchCompanies()
    .then((companies) => {
      const visible = shuffle(companies.filter((c) => c && c[sectionKey === 'eventos' ? 'video' : sectionKey] && companyItems(c, sectionKey).length));
      if (!visible.length) {
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      if (emptyState) emptyState.style.display = 'none';
      visible.forEach((company) => {
        const node = renderCompany(company, sectionKey);
        node.dataset.grupo = grupoDe(company);
        container.appendChild(node);
      });
      renderFilters(container, sectionKey);
      observe(container.querySelectorAll('.reveal'));
      Lightbox.init();
      VideoModal.init();
    })
    .catch(() => {
      if (emptyState) emptyState.style.display = 'block';
    });
}

// Grupo de cada empresa para los filtros de la galería: sale de su "nicho" vía
// CONFIG.GRUPOS. Un nicho sin mapear cae en "Otros".
function grupoDe(company) {
  return CONFIG.GRUPOS[company.nicho] || 'Otros';
}

function slugify(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Filtros. Solo aparecen si hay 2+ grupos con trabajo — un filtro que deja todo
// igual o una categoría vacía es ruido. La categoría elegida queda en la URL (?cat=)
// para poder compartir el enlace ya filtrado. En Video se filtra por tipo de evento
// de cada video (y se esconde la marca que se queda sin ninguno); en las demás, por
// el grupo de la empresa.
function renderFilters(container, sectionKey) {
  const porEvento = sectionKey === 'video' || sectionKey === 'eventos';
  const clave = porEvento ? 'evento' : 'grupo';
  const piezas = Array.from(container.querySelectorAll(porEvento ? '[data-evento]' : '.brand-section'));
  const grupos = [...new Set(piezas.map((el) => el.dataset[clave]))];
  if (grupos.length < 2) return;
  grupos.sort((a, b) => (a === 'Otros') - (b === 'Otros') || a.localeCompare(b, 'es'));

  const bar = document.createElement('div');
  bar.className = 'filter-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', porEvento ? 'Filtrar por tipo de evento' : 'Filtrar por categoría');
  const buttons = [];

  function apply(grupo) {
    piezas.forEach((el) => { el.hidden = grupo !== null && el.dataset[clave] !== grupo; });
    if (porEvento) {
      container.querySelectorAll('.brand-section').forEach((el) => { el.hidden = !el.querySelector('[data-evento]:not([hidden])'); });
      // Con menos miniaturas a la vista, el carrusel pasa a fijo (sin flechas), como si se hubiera creado así.
      container.querySelectorAll('.gallery-carousel').forEach((g) => {
        const n = g.querySelectorAll('[data-evento]:not([hidden])').length;
        g.classList.toggle('is-static', n <= 3);
        g.classList.toggle('is-single', n === 1);
        g.querySelector('.gallery-track').scrollLeft = 0;
      });
    }
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.grupo === (grupo || ''))));
    const url = new URL(window.location.href);
    if (grupo) url.searchParams.set('cat', slugify(grupo)); else url.searchParams.delete('cat');
    history.replaceState(null, '', url);
  }

  ['', ...grupos].forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'filter-chip';
    b.dataset.grupo = g;
    b.textContent = g || 'Todo';
    b.addEventListener('click', () => apply(g || null));
    buttons.push(b);
    bar.appendChild(b);
  });
  container.parentNode.insertBefore(bar, container);

  const pedido = new URLSearchParams(window.location.search).get('cat');
  apply(grupos.find((g) => slugify(g) === pedido) || null);
}

// Semilla determinística por día: el orden se siente "fresco" (cambia día a
// día) sin reordenarse en cada recarga — antes Math.random() podía enterrar
// el mejor trabajo justo en la visita que importaba.
function daySeed() {
  const d = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
  return h;
}

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list) {
  const rand = mulberry32(daySeed());
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function companyItems(company, sectionKey) {
  // Video y Eventos se reparten los videos por su etiqueta: los de evento van a Eventos.
  if (sectionKey === 'video' || sectionKey === 'eventos') {
    return (company.videos || []).filter((v) => CONFIG.EVENTOS.includes(v.evento) === (sectionKey === 'eventos'));
  }
  return (company.galeria || []).filter((g) => g.tipo === sectionKey);
}

const LOCAL_JPG_RE = /\.jpe?g$/i;

/**
 * Crea un <img> y, cuando src es un .jpg local (no una URL remota tipo
 * miniatura de YouTube/Vimeo), lo envuelve en <picture> con un <source
 * type="image/webp"> hermano — cada .jpg del repo ya tiene su .webp generado
 * al lado. Devuelve { node, img }: node es lo que se agrega al DOM (picture o
 * el propio img si no aplica webp), img es siempre el <img> real para seguir
 * configurándolo (data-*, listeners, etc.) después de llamar esta función.
 *
 * `className` se aplica a AMBOS: al <picture> (que es el hijo directo real
 * dentro de contenedores flex/grid como .gallery-track o .brand-block, así
 * que necesita el ancho/flex-shrink/etc. de esa clase para no colapsar) y al
 * <img> (que necesita aspect-ratio/object-fit/border-radius de la misma
 * clase para recortarse bien). Antes esto se resolvía con
 * `picture { display: contents }`, pero eso rompe el cálculo de tamaño del
 * contenedor cuando .gallery-track está en modo grid (galerías de ≤3 fotos)
 * — con las clases duplicadas no hace falta ese truco.
 */
export function makePictureImg(src, className) {
  const img = document.createElement('img');
  img.src = src || '';
  if (className) img.className = className;
  if (src && LOCAL_JPG_RE.test(src) && !/^https?:\/\//i.test(src)) {
    const picture = document.createElement('picture');
    if (className) picture.className = className;
    const source = document.createElement('source');
    source.srcset = src.replace(LOCAL_JPG_RE, '.webp');
    source.type = 'image/webp';
    picture.appendChild(source);
    picture.appendChild(img);
    return { node: picture, img };
  }
  return { node: img, img };
}

// Título público del proyecto. El nombre, logo, descripción e Instagram del cliente
// solo salen con "publico": true (permiso del cliente); por defecto el proyecto es anónimo.
export function tituloDe(company) {
  return company.titulo || (company.publico ? company.nombre : 'Proyecto');
}

export function renderCompany(company, sectionKey) {
  const wrap = document.createElement('div');
  wrap.className = 'brand-section reveal';

  const header = document.createElement('div');
  header.className = 'brand-header';

  const block = document.createElement('div');
  block.className = 'brand-block';
  const info = document.createElement('div');
  info.className = 'brand-info';
  const name = document.createElement('h2');
  name.className = 'brand-name';
  name.textContent = tituloDe(company);
  info.appendChild(name);
  if (company.publico && company.descripcion) {
    const desc = document.createElement('p');
    desc.className = 'brand-desc';
    desc.textContent = company.descripcion;
    info.appendChild(desc);
  }
  if (company.publico && company.logo) {
    const { node: logoNode, img: logo } = makePictureImg(company.logo, 'brand-logo');
    logo.alt = company.nombre + ' — logo';
    logo.loading = 'lazy';
    block.appendChild(logoNode);
  }
  block.appendChild(info);
  header.appendChild(block);

  const actions = document.createElement('div');
  actions.className = 'brand-actions';
  if (company.publico && company.instagram) {
    const ig = document.createElement('a');
    ig.className = 'brand-ig-btn';
    ig.href = company.instagram;
    ig.target = '_blank';
    ig.rel = 'noopener';
    ig.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="2"></rect><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="2"></circle><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"></circle></svg> Instagram';
    actions.appendChild(ig);
  }
  if (actions.children.length) header.appendChild(actions);
  wrap.appendChild(header);

  const items = companyItems(company, sectionKey);
  wrap.appendChild(renderGallery(items, sectionKey, company));
  return wrap;
}

export function renderGallery(rawItems, sectionKey, company) {
  const isVideo = sectionKey === 'video' || sectionKey === 'eventos';
  const items = shuffle(rawItems);

  function makeImg(item) {
    const autoThumb = isVideo ? getThumbnailSync(item.url, item.provider) : null;
    const src = isVideo ? (item.miniatura || autoThumb || company.logo || '') : item.archivo;
    const { node, img } = makePictureImg(src, isVideo ? '' : 'gallery-img');
    img.draggable = false;
    img.loading = 'lazy';
    if (isVideo) {
      img.alt = item.titulo || tituloDe(company) + ' — video';
      const caja = document.createElement('div');
      caja.className = 'gallery-img gallery-thumb';
      if (item.reel) caja.classList.add('is-reel'); // vertical: miniatura 9:16
      caja.dataset.evento = item.evento || 'Otros';
      caja.appendChild(node);
      const rec = document.createElement('span');
      rec.className = 'rec';
      rec.appendChild(document.createElement('i'));
      rec.appendChild(document.createTextNode(item.evento || 'Video'));
      caja.appendChild(rec);
      const embedSrc = toEmbedSrc(item.url, item.provider);
      if (embedSrc) caja.setAttribute('data-video-embed', embedSrc);
      // Mejora progresiva: si no había miniatura propia ni una automática por
      // URL (ej. Vimeo), preguntar de forma async y actualizar si aparece algo
      // mejor que el logo de respaldo. Nunca bloquea el render inicial. Si el
      // <img> quedó envuelto en <picture> (miniatura/logo local), se quita el
      // <source> webp viejo antes de cambiar el src — si no, el navegador se
      // queda mostrando la imagen local en vez de la remota nueva.
      if (!item.miniatura && !autoThumb) {
        fetchThumbnail(item.url, item.provider).then((src2) => {
          if (!src2) return;
          const picture = node.tagName === 'PICTURE' ? node : null;
          if (picture) {
            const source = picture.querySelector('source');
            if (source) source.remove();
          }
          img.src = src2;
        });
      }
      return caja;
    }
    img.alt = item.alt || tituloDe(company);
    return node;
  }

  const outer = document.createElement('div');
  outer.className = 'gallery-carousel';
  if (isVideo) outer.classList.add('gallery-video');
  if (isVideo && items.every((i) => i.reel)) outer.classList.add('solo-reels');
  if (!isVideo) outer.setAttribute('data-lightbox-group', '');

  const track = document.createElement('div');
  track.className = 'gallery-track';
  items.forEach((item) => track.appendChild(makeImg(item)));

  const prevBtn = document.createElement('button');
  prevBtn.className = 'gallery-nav-btn prev'; prevBtn.type = 'button'; prevBtn.setAttribute('aria-label', 'Anterior');
  prevBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const nextBtn = document.createElement('button');
  nextBtn.className = 'gallery-nav-btn next'; nextBtn.type = 'button'; nextBtn.setAttribute('aria-label', 'Siguiente');
  nextBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  outer.appendChild(track);
  outer.appendChild(prevBtn);
  outer.appendChild(nextBtn);

  if (items.length > 3) {
    setupCarousel(track, prevBtn, nextBtn);
  } else {
    outer.classList.add('is-static');
    if (isVideo && items.length === 1) outer.classList.add('is-single');
  }
  return outer;
}

export function setupCarousel(track, prevBtn, nextBtn) {
  let startX = 0, startScroll = 0, moved = false;
  function step() { return track.querySelector('.gallery-img:not([hidden])').getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0); }
  function maxScroll() { return track.scrollWidth - track.clientWidth; }

  nextBtn.addEventListener('click', () => {
    if (track.scrollLeft >= maxScroll() - 4) track.scrollTo({ left: 0, behavior: 'smooth' });
    else track.scrollBy({ left: step(), behavior: 'smooth' });
  });
  prevBtn.addEventListener('click', () => {
    if (track.scrollLeft <= 4) track.scrollTo({ left: maxScroll(), behavior: 'smooth' });
    else track.scrollBy({ left: -step(), behavior: 'smooth' });
  });
  track.tabIndex = 0;
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn.click(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prevBtn.click(); }
  });
  track.addEventListener('dragstart', (e) => e.preventDefault());

  function onMove(e) {
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = startScroll - dx;
  }
  function endDrag() {
    track.classList.remove('is-dragging');
    track.style.scrollBehavior = 'smooth';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
  }
  track.addEventListener('pointerdown', (e) => {
    moved = false; startX = e.clientX; startScroll = track.scrollLeft;
    track.classList.add('is-dragging');
    track.style.scrollBehavior = 'auto';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    e.preventDefault();
  });
  track.addEventListener('click', (e) => {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);
}
