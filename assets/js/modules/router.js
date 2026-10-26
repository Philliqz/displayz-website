// Router de empresa.html?slug=X — sin build step ni servidor, la única forma de
// tener una "ruta por empresa" en GitHub Pages sin configuración extra. Reutiliza
// renderCompany() de portfolio.js, así que la galería/carrusel/lightbox/video-modal
// se ven exactamente igual que en las páginas de Video/Fotografía/Diseño.
import { getCompanyBySlug } from './data-store.js';
import { renderCompany, tituloDe } from './portfolio.js';
import { observe } from './animations.js';
import * as Lightbox from './lightbox.js';
import * as VideoModal from './video-modal.js';

const SECTION_LABELS = { video: 'Video', fotografia: 'Fotografía', diseno: 'Diseño' };
const SITE_URL = 'https://displayz.studio';

export function init() {
  const root = document.querySelector('[data-empresa-page]');
  if (!root) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) return showNotFound();

  getCompanyBySlug(slug).then((company) => {
    if (!company) return showNotFound();
    renderCompanyPage(company, root);
  });
}

function showNotFound() {
  const notFound = document.querySelector('[data-empresa-notfound]');
  if (notFound) notFound.style.display = 'block';
  const heroTitle = document.querySelector('[data-empresa-nombre]');
  if (heroTitle) heroTitle.textContent = 'Proyecto no encontrado';
}

function renderCompanyPage(company, root) {
  document.title = tituloDe(company) + ' — Displayz.Studio';

  const titleEl = document.querySelector('[data-empresa-nombre]');
  if (titleEl) titleEl.textContent = tituloDe(company);
  const descEl = document.querySelector('[data-empresa-descripcion]');
  if (descEl) descEl.textContent = company.publico ? company.descripcion || '' : '';

  updateMeta(company);
  injectJsonLd(company);

  Object.keys(SECTION_LABELS).forEach((key) => {
    const slot = document.querySelector('[data-empresa-' + key + ']');
    if (!slot || !company[key]) return;
    const eyebrow = document.createElement('span');
    eyebrow.className = 'section-eyebrow';
    eyebrow.textContent = SECTION_LABELS[key];
    slot.appendChild(eyebrow);
    slot.appendChild(renderCompany(company, key));
  });

  observe(root.querySelectorAll('.reveal'));
  Lightbox.init();
  VideoModal.init();
}

function updateMeta(company) {
  const url = `${SITE_URL}/empresa.html?slug=${encodeURIComponent(company.slug)}`;
  setAttr('link[rel="canonical"]', 'href', url);
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[property="og:title"]', `${tituloDe(company)} — Displayz.Studio`);
  if (company.publico) setMeta('meta[property="og:description"]', company.descripcion || '');
  if (company.publico && company.logo) setMeta('meta[property="og:image"]', `${SITE_URL}/${company.logo}`);
}

function setAttr(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}
function setMeta(selector, content) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute('content', content);
}

function injectJsonLd(company) {
  const url = `${SITE_URL}/empresa.html?slug=${encodeURIComponent(company.slug)}`;
  const graph = [{
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: tituloDe(company), item: url }
    ]
  }];

  (company.galeria || []).forEach((g) => {
    graph.push({ '@type': 'ImageObject', contentUrl: `${SITE_URL}/${g.archivo}`, name: g.alt || tituloDe(company) });
  });
  (company.videos || []).forEach((v) => {
    graph.push({
      '@type': 'VideoObject',
      name: v.titulo || tituloDe(company),
      description: v.titulo || tituloDe(company),
      thumbnailUrl: v.miniatura ? `${SITE_URL}/${v.miniatura}` : undefined,
      embedUrl: v.url
    });
  });

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(script);
}
