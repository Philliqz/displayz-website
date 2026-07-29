// init() se llama más de una vez por página (al cargar y otra vez tras renderizar el
// portafolio de forma async) porque las imágenes de galería no existen todavía en el
// primer llamado. Los listeners sobre elementos dinámicos se re-atan cada vez (correcto,
// hay que engancharse a las imágenes nuevas); los del overlay estático (botón cerrar,
// flechas, teclado) se atan una sola vez con un guard, para no duplicar el manejo de
// teclas/clicks en llamados repetidos.
let overlay = null;
let imgEl = null;
let images = [];
let index = 0;
let boundStatic = false;

export function init() {
  overlay = document.getElementById('lightbox');
  if (!overlay) return;
  imgEl = overlay.querySelector('.lightbox-img');

  document.querySelectorAll('[data-lightbox-group]').forEach((group) => {
    const imgs = Array.prototype.slice.call(group.querySelectorAll('img'));
    imgs.forEach((img, i) => {
      img.addEventListener('click', () => {
        images = imgs.map((im) => ({ src: im.src, alt: im.alt }));
        open(i);
      });
    });
  });

  if (boundStatic) return;
  boundStatic = true;

  overlay.querySelectorAll('[data-close-lightbox]').forEach((btn) => {
    btn.addEventListener('click', () => close());
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const prev = overlay.querySelector('.lightbox-prev');
  const next = overlay.querySelector('.lightbox-next');
  if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  if (next) next.addEventListener('click', (e) => { e.stopPropagation(); step(1); });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
}

function open(i) {
  index = i;
  render();
  overlay.classList.add('is-open');
}
function close() {
  overlay.classList.remove('is-open');
}
function step(delta) {
  index = (index + delta + images.length) % images.length;
  render();
}
function render() {
  const cur = images[index];
  if (!cur) return;
  imgEl.src = cur.src;
  imgEl.alt = cur.alt;
}
