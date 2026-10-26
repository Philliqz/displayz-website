// Hero del home por intención: cada pastilla (Mensual, Eventos, Fotos, Video) cambia
// titular, subtítulo, botones y las tres piezas del collage. El H1 (la firma) no cambia.
// Avanza solo hasta que la persona toca algo; con ?s=eventos (anuncios) abre directo ahí.
import { makePictureImg } from './portfolio.js';

const V = 'portfolio/onads/video/';
const SLIDES = {
  mensual: {
    titulo: 'Contenido cada semana para que tu marca venda más',
    sub: 'Fotos, videos y diseños para redes, listos cada semana.',
    cta: 'Quiero mi plan', servicio: 'Contenido mensual', ver: 'diseno.html',
    piezas: [
      { src: 'portfolio/ola-cars/geely-okavango.jpg', tag: 'Diseño · Ola Cars', slug: 'ola-cars' },
      { src: 'portfolio/moocha/matcha.jpg', tag: 'Diseño · Moocha', slug: 'moocha' },
      { src: V + 'atp-vertical.jpg', tag: 'Video · OnAds', slug: 'onads', video: true }
    ]
  },
  eventos: {
    titulo: 'Tu boda, tus 15 años o tu evento, contados de principio a fin',
    sub: 'Fotografía, video y reel del día.',
    cta: 'Consultar mi fecha', servicio: 'Evento', ver: 'fotografia.html',
    piezas: [
      { src: 'portfolio/graduacion-canal-panama/foto-1.jpg', tag: 'Foto · Graduación', slug: 'graduacion-canal-panama' },
      { src: 'portfolio/por-amor-a-panama-monte-santo/video/miniatura.jpg', tag: 'Video · Por Amor a Panamá', slug: 'por-amor-a-panama-monte-santo', video: true },
      { src: 'portfolio/lissette-y-luis/foto-5.jpg', tag: 'Foto · Boda Lissette y Luis', slug: 'lissette-y-luis' }
    ]
  },
  fotos: {
    titulo: 'Sesiones de fotos cuidadas para celebrar y compartir',
    sub: 'Graduaciones, parejas, marcas y retratos.',
    cta: 'Agendar sesión', servicio: 'Sesión de fotos', ver: 'fotografia.html',
    piezas: [
      { src: 'portfolio/lissette-y-luis/foto-6.jpg', tag: 'Foto · Lissette y Luis', slug: 'lissette-y-luis' },
      { src: 'portfolio/graduacion-canal-panama/foto-2.jpg', tag: 'Foto · Graduación', slug: 'graduacion-canal-panama' },
      { src: 'portfolio/graduacion-canal-panama/foto-3.jpg', tag: 'Foto · Graduación Canal de Panamá', slug: 'graduacion-canal-panama' }
    ]
  },
  video: {
    titulo: 'Videos claros, memorables y hechos para vender',
    sub: 'Spots, institucionales, recaps y reels.',
    cta: 'Cotizar mi video', servicio: 'Video puntual', ver: 'video.html',
    piezas: [
      { src: V + 'como-funciona-vertical.jpg', tag: 'Video · OnAds', slug: 'onads', video: true },
      { src: V + 'qr-de-oro-vertical.jpg', tag: 'Video · OnAds', slug: 'onads', video: true },
      { src: V + 'atp-vertical.jpg', tag: 'Video · OnAds', slug: 'onads', video: true }
    ]
  }
};
const LADOS = ['collage-left', 'collage-right', 'collage-front'];

function collage(s) {
  const frag = document.createDocumentFragment();
  s.piezas.forEach((p, i) => {
    const a = document.createElement('a');
    a.className = 'collage-card ' + LADOS[i];
    a.href = 'empresa.html?slug=' + encodeURIComponent(p.slug);
    a.setAttribute('aria-label', 'Ver proyecto: ' + p.tag);
    const { node, img } = makePictureImg(p.src);
    img.alt = '';
    a.appendChild(node);
    if (p.video) {
      const play = document.createElement('span');
      play.className = 'collage-play';
      play.textContent = '▶';
      play.setAttribute('aria-hidden', 'true');
      a.appendChild(play);
    }
    const tag = document.createElement('span');
    tag.className = 'collage-tag';
    tag.textContent = p.tag;
    a.appendChild(tag);
    frag.appendChild(a);
  });
  return frag;
}

export function init() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const tabs = [...hero.querySelectorAll('[data-hero-tab]')];
  const titulo = hero.querySelector('[data-hero-title]');
  const sub = hero.querySelector('[data-hero-sub]');
  const cta = hero.querySelector('[data-hero-cta]');
  const ver = hero.querySelector('[data-hero-ver]');
  const col = hero.querySelector('[data-collage]');
  const pausa = hero.querySelector('[data-hero-pause]');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pedido = new URLSearchParams(location.search).get('s');
  let actual = Object.hasOwn(SLIDES, pedido ?? '') ? pedido : 'mensual';
  let pendiente;

  function mostrar(key) {
    const s = SLIDES[key];
    actual = key;
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.heroTab === key)));
    const cambiar = () => {
      titulo.textContent = s.titulo;
      sub.textContent = s.sub;
      cta.firstChild.textContent = s.cta + ' ';
      cta.dataset.servicio = s.servicio;
      ver.href = s.ver;
      col.replaceChildren(collage(s));
      hero.classList.remove('is-swapping');
    };
    clearTimeout(pendiente); // un clic rápido no deja pintar la diapositiva anterior
    if (quieto || !col.childElementCount) return cambiar();
    hero.classList.add('is-swapping');
    pendiente = setTimeout(cambiar, 220);
  }

  // Autoavance: la barra de la pastilla activa es una animación CSS de 6 s; al terminar,
  // pasa a la siguiente. Hover la pausa solo con CSS; tocar algo la detiene del todo.
  function detener() {
    hero.classList.add('is-manual');
    pausa.hidden = true;
  }
  tabs.forEach((t) => {
    t.addEventListener('click', () => {
      detener();
      hero.querySelector('[data-hero-live]').setAttribute('aria-live', 'polite');
      mostrar(t.dataset.heroTab);
      const url = new URL(location.href);
      url.searchParams.set('s', t.dataset.heroTab);
      history.replaceState(null, '', url);
    });
    t.querySelector('.hero-bar').addEventListener('animationend', () => {
      if (hero.classList.contains('is-manual') || t.dataset.heroTab !== actual) return;
      const i = tabs.indexOf(t);
      mostrar(tabs[(i + 1) % tabs.length].dataset.heroTab);
    });
  });
  pausa.addEventListener('click', () => {
    const p = hero.classList.toggle('is-paused');
    pausa.setAttribute('aria-label', p ? 'Reanudar diapositivas' : 'Pausar diapositivas');
    pausa.textContent = p ? '▶' : '❚❚';
  });
  cta.addEventListener('click', detener);
  if (quieto || actual === pedido) detener();
  mostrar(actual);
}
