// "Trabajo seleccionado" del home: 6 piezas reales, alternando Video/Fotografía/Diseño
// para que se vea la variedad, una por empresa. Cada tarjeta lleva a la página de la
// empresa. Se llena solo desde database/empresas.json — no hay que tocar código al
// agregar trabajo nuevo.
import { fetchCompanies } from './data-store.js';
import { observe } from './animations.js';
import { shuffle, makePictureImg } from './portfolio.js';
import { getThumbnailSync } from './video-provider.js';

const MAX = 6;
const LABELS = { video: 'Video', fotografia: 'Fotografía', diseno: 'Diseño' };

function cover(company, key) {
  if (key === 'video') {
    const v = (company.videos || [])[0];
    return v ? (v.miniatura || getThumbnailSync(v.url, v.provider)) : null;
  }
  const g = (company.galeria || []).find((x) => x.tipo === key);
  return g ? g.archivo : null;
}

export function init() {
  const grid = document.querySelector('[data-featured]');
  if (!grid) return;

  fetchCompanies().then((companies) => {
    const pools = Object.keys(LABELS).map((key) => shuffle(
      companies.filter((c) => c && c[key] && cover(c, key)).map((c) => ({ c, key }))
    ));
    const used = new Set();
    const picks = [];
    // Round-robin entre secciones: video, foto, diseño, video... hasta llenar.
    while (picks.length < MAX && pools.some((p) => p.length)) {
      pools.forEach((pool) => {
        while (pool.length && picks.length < MAX) {
          const item = pool.shift();
          if (used.has(item.c.slug)) continue;
          used.add(item.c.slug);
          picks.push(item);
          break;
        }
      });
    }

    picks.forEach(({ c, key }) => {
      const a = document.createElement('a');
      a.className = 'work-tile reveal';
      a.href = 'empresa.html?slug=' + encodeURIComponent(c.slug);
      const { node, img } = makePictureImg(cover(c, key), 'work-tile-img');
      img.alt = c.nombre;
      img.loading = 'lazy';
      a.appendChild(node);
      const meta = document.createElement('span');
      meta.className = 'work-tile-meta';
      const name = document.createElement('strong');
      name.textContent = c.nombre;
      const tag = document.createElement('span');
      tag.textContent = LABELS[key];
      meta.appendChild(name);
      meta.appendChild(tag);
      a.appendChild(meta);
      grid.appendChild(a);
    });
    observe(grid.querySelectorAll('.reveal'));
  }).catch(() => {});
}
