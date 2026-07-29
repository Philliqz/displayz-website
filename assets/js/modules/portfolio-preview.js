// Rotador de miniaturas del home (las 3 tarjetas Video/Fotografía/Diseño). Se llena
// solo cuando hay contenido real — no requiere tocar código al agregar una empresa.
import { fetchCompanies } from './data-store.js';

export function init() {
  const slots = document.querySelectorAll('[data-portfolio-thumbs]');
  if (!slots.length) return;

  fetchCompanies().then((companies) => {
    slots.forEach((slot) => {
      const key = slot.getAttribute('data-portfolio-thumbs');
      const images = [];
      companies.forEach((c) => {
        const items = key === 'video' ? (c.videos || []) : (c.galeria || []).filter((g) => g.tipo === key);
        if (!items.length) return;
        const src = key === 'video' ? items[0].miniatura : items[0].archivo;
        if (src) images.push(src);
      });
      images.slice(0, 3).forEach((src, i) => {
        const div = document.createElement('div');
        div.className = 'portfolio-item-thumb';
        div.style.backgroundImage = `url(${src})`;
        div.style.animationDelay = `${-i * 4}s`;
        slot.appendChild(div);
      });
    });
  }).catch(() => {});
}
