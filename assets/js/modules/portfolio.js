// Renderiza las secciones de portafolio (video/fotografía/diseño) de cada página de
// galería. Lee de data-store.js — nunca hace fetch directo — así que este archivo no
// sabe ni le importa si los datos vienen de un JSON estático o de un backend real.
import { fetchCompanies } from './data-store.js';
import { observe } from './animations.js';
import * as Lightbox from './lightbox.js';
import * as VideoModal from './video-modal.js';
import { toEmbedSrc, getThumbnailSync, fetchThumbnail } from './video-provider.js';

export function init() {
  const section = document.querySelector('[data-portfolio-section]');
  if (!section) return;
  const sectionKey = section.getAttribute('data-portfolio-section'); // "video" | "fotografia" | "diseno"
  const container = section.querySelector('[data-portfolio-companies]');
  const emptyState = section.querySelector('[data-portfolio-empty]');

  fetchCompanies()
    .then((companies) => {
      const visible = shuffle(companies.filter((c) => c && c[sectionKey] && companyItems(c, sectionKey).length));
      if (!visible.length) {
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      if (emptyState) emptyState.style.display = 'none';
      visible.forEach((company) => {
        container.appendChild(renderCompany(company, sectionKey));
      });
      observe(container.querySelectorAll('.reveal'));
      Lightbox.init();
      VideoModal.init();
    })
    .catch(() => {
      if (emptyState) emptyState.style.display = 'block';
    });
}

function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function companyItems(company, sectionKey) {
  if (sectionKey === 'video') return company.videos || [];
  return (company.galeria || []).filter((g) => g.tipo === sectionKey);
}

const LOCAL_JPG_RE = /\.jpe?g$/i;

/**
 * Crea un <img> y, cuando src es un .jpg local (no una URL remota tipo
 * miniatura de YouTube/Vimeo), lo envuelve en <picture> con un <source
 * type="image/webp"> hermano — cada .jpg del repo ya tiene su .webp generado
 * al lado. Devuelve { node, img }: node es lo que se agrega al DOM (picture o
 * el propio img si no aplica webp), img es siempre el <img> real para seguir
 * configurándolo (data-* , listeners, etc.) después de llamar esta función.
 */
function makePictureImg(src) {
  const img = document.createElement('img');
  img.src = src || '';
  if (src && LOCAL_JPG_RE.test(src) && !/^https?:\/\//i.test(src)) {
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.srcset = src.replace(LOCAL_JPG_RE, '.webp');
    source.type = 'image/webp';
    picture.appendChild(source);
    picture.appendChild(img);
    return { node: picture, img };
  }
  return { node: img, img };
}

export function renderCompany(company, sectionKey) {
  const wrap = document.createElement('div');
  wrap.className = 'brand-section reveal';

  const header = document.createElement('div');
  header.className = 'brand-header';

  const block = document.createElement('div');
  block.className = 'brand-block';
  const { node: logoNode, img: logo } = makePictureImg(company.logo || '');
  logo.className = 'brand-logo';
  logo.alt = company.nombre + ' — logo';
  logo.loading = 'lazy';
  const info = document.createElement('div');
  info.className = 'brand-info';
  const name = document.createElement('h2');
  name.className = 'brand-name';
  name.textContent = company.nombre;
  info.appendChild(name);
  if (company.nicho) {
    const nichoTag = document.createElement('span');
    nichoTag.className = 'brand-nicho-tag';
    nichoTag.textContent = company.nicho;
    info.appendChild(nichoTag);
  }
  if (company.descripcion) {
    const desc = document.createElement('p');
    desc.className = 'brand-desc';
    desc.textContent = company.descripcion;
    info.appendChild(desc);
  }
  block.appendChild(logoNode);
  block.appendChild(info);
  header.appendChild(block);

  const actions = document.createElement('div');
  actions.className = 'brand-actions';
  if (company.instagram) {
    const ig = document.createElement('a');
    ig.className = 'brand-ig-btn';
    ig.href = company.instagram;
    ig.target = '_blank';
    ig.rel = 'noopener';
    ig.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="2"></rect><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="2"></circle><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"></circle></svg> Instagram';
    actions.appendChild(ig);
  }
  actions.appendChild(makeLikeBtn(company.slug));
  header.appendChild(actions);
  wrap.appendChild(header);

  const items = companyItems(company, sectionKey);
  wrap.appendChild(renderGallery(items, sectionKey, company));
  return wrap;
}

export function makeLikeBtn(slug) {
  const likedKey = 'displayz-like-' + slug;
  const countKey = 'displayz-likes-' + slug;
  let liked = localStorage.getItem(likedKey) === '1';
  let count = parseInt(localStorage.getItem(countKey), 10);
  if (isNaN(count)) count = liked ? 1 : 0;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'brand-like-btn' + (liked ? ' is-liked' : '');
  btn.setAttribute('aria-label', 'Me gusta');

  function render() {
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20s-7-4.35-9.5-8.5C.7 8 2.3 4.5 6 4.5c2 0 3.3 1 4.5 2.5C11.7 5.5 13 4.5 15 4.5c3.7 0 5.3 3.5 3.5 7C18 15.65 12 20 12 20z" stroke="currentColor" stroke-width="2" fill="' + (liked ? 'currentColor' : 'none') + '"/></svg><span>' + count + '</span>';
  }
  render();
  btn.addEventListener('click', () => {
    liked = true;
    count += 1;
    btn.classList.add('is-liked');
    localStorage.setItem(likedKey, '1');
    localStorage.setItem(countKey, String(count));
    render();
  });
  return btn;
}

export function renderGallery(rawItems, sectionKey, company) {
  const isVideo = sectionKey === 'video';
  const items = shuffle(rawItems);

  function makeImg(item) {
    const autoThumb = isVideo ? getThumbnailSync(item.url, item.provider) : null;
    const src = isVideo ? (item.miniatura || autoThumb || company.logo || '') : item.archivo;
    const { node, img } = makePictureImg(src);
    img.className = 'gallery-img';
    img.draggable = false;
    img.loading = 'lazy';
    if (isVideo) {
      img.alt = item.titulo || company.nombre + ' — video';
      const embedSrc = toEmbedSrc(item.url, item.provider);
      if (embedSrc) img.setAttribute('data-video-embed', embedSrc);
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
    } else {
      img.alt = item.alt || company.nombre;
    }
    return node;
  }

  const outer = document.createElement('div');
  outer.className = 'gallery-carousel';
  if (isVideo) outer.classList.add('gallery-video');
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
  function step() { return track.querySelector('.gallery-img').getBoundingClientRect().width + 16; }
  function maxScroll() { return track.scrollWidth - track.clientWidth; }

  nextBtn.addEventListener('click', () => {
    if (track.scrollLeft >= maxScroll() - 4) track.scrollTo({ left: 0, behavior: 'smooth' });
    else track.scrollBy({ left: step(), behavior: 'smooth' });
  });
  prevBtn.addEventListener('click', () => {
    if (track.scrollLeft <= 4) track.scrollTo({ left: maxScroll(), behavior: 'smooth' });
    else track.scrollBy({ left: -step(), behavior: 'smooth' });
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
