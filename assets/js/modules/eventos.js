// Página Eventos: banner con un video al azar de fondo (sin sonido hasta que lo pidan), su título
// en grande, transición entre videos y controles; pestañas Todos / Bodas / 15 años; galería de
// miniaturas que se previsualizan al pasar el cursor (en pantallas táctiles, la que queda a la vista).
// Tocar abre el video completo en el reproductor del modal.
// Entran los videos horizontales cuya etiqueta está en CONFIG.EVENTOS (los reels van a Video).
import { fetchCompanies } from './data-store.js';
import { CONFIG } from './config.js';
import * as VideoModal from './video-modal.js?v=20261112-2';
import { svg } from './video-modal.js?v=20261112-2';
import { toEmbedSrc, ARCHIVO_RE } from './video-provider.js';
import { tituloDe, makePictureImg, shuffle } from './portfolio.js?v=20261112-2';

// Pestañas propias; cualquier otra etiqueta (Certamen, Evento, Cumpleaños…) cae en Eventos.
const PESTANAS = [['Boda', 'Bodas'], ['15 años', '15 años'], [null, 'Eventos']];
// Cada pestaña tiene su link para anuncios: eventos.html?tipo=bodas | 15-anos | eventos (misma página).
const slug = (p) => p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
const pestanaDe = (evento) => (PESTANAS.find(([e]) => e === evento) || PESTANAS[PESTANAS.length - 1])[1];
const tactil = matchMedia('(hover: none)').matches;
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const MUESTRA = 10; // s de cada video en el banner antes de pasar al siguiente
const ancho = matchMedia('(min-width: 960px)').matches; // en computadora el fondo va en 1080p
const FUNDIDO = 600; // ms; igual que la transición de .ev-hero.is-cambiando en style.css

export function init() {
  const seccion = document.querySelector('[data-eventos]');
  if (!seccion) return;
  const hero = document.querySelector('[data-ev-hero]');
  const tabs = seccion.querySelector('[data-ev-tabs]');
  const grid = seccion.querySelector('[data-ev-grid]');

  fetchCompanies().then((empresas) => {
    const todos = empresas.filter((c) => c && c.video).flatMap((c) => (c.videos || [])
      .filter((v) => !v.reel && v.url && CONFIG.EVENTOS.includes(v.evento))
      .map((v) => ({
        titulo: v.titulo_corto || v.titulo || tituloDe(c),
        pestana: pestanaDe(v.evento),
        evento: v.evento,
        desc: c.publico && c.descripcion ? c.descripcion : tituloDe(c),
        credito: c.colaboracion || null, // con quién se hizo: se enlaza su Instagram
        mini: v.miniatura || '',
        previa: ARCHIVO_RE.test(v.url) ? (v.url_ligera || v.url) : '', // los embeds (Mega) no se previsualizan
        fondo: ARCHIVO_RE.test(v.url) ? (ancho ? v.url : (v.url_ligera || v.url)) : '',
        audio: ARCHIVO_RE.test(v.url) ? v.url : '', // la versión ligera no trae audio: con sonido va la completa
        inicio: v.inicio_banner || 0, // segundo de la mejor toma: el banner arranca ahí
        destacado: v.orden_eventos || 0, // orden fijo en Eventos (no es el «destacado» de la portada)
        completo: toEmbedSrc(v.url, v.provider),
        dur: v.duracion,
      })));
    // Primero los destacados en su orden; el resto, al azar en cada visita.
    const items = [...todos.filter((i) => i.destacado).sort((a, b) => a.destacado - b.destacado),
      ...shuffle(todos.filter((i) => !i.destacado))];
    if (!items.length) {
      seccion.querySelector('[data-ev-empty]').hidden = false;
      return;
    }

    const presentes = ['Todos', ...PESTANAS.map(([, p]) => p).filter((p) => items.some((i) => i.pestana === p))];
    const tipo = slug(new URLSearchParams(location.search).get('tipo') || ''); // acepta también el nombre viejo («Bodas»)
    const pedida = presentes.find((p) => slug(p) === tipo);

    presentes.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = p === 'Todos' ? 'ev-tab ev-tab--todos' : 'ev-tab';
      b.textContent = p;
      b.addEventListener('click', () => mostrar(p, true));
      tabs.appendChild(b);
    });

    const tarjetas = items.map(tarjeta);
    tarjetas.forEach((t) => grid.appendChild(t));
    if (tactil) previsualizarAlaVista(tarjetas);
    const banner = crearBanner(hero);
    VideoModal.init();
    // Con el reproductor abierto se calla todo lo de atrás.
    document.addEventListener('video-modal:abierto', () => tarjetas.forEach((t) => t.previa(false)));

    function mostrar(p, desdeClic) {
      [...tabs.children].forEach((b) => b.setAttribute('aria-pressed', String(b.textContent === p)));
      const visibles = items.filter((i) => p === 'Todos' || i.pestana === p);
      tarjetas.forEach((t, k) => { t.hidden = !visibles.includes(items[k]); });
      seccion.querySelector('[data-ev-count]').textContent = `${visibles.length} ${visibles.length === 1 ? 'video' : 'videos'}`;
      banner.usar(visibles);
      if (desdeClic) {
        const url = new URL(location.href);
        if (p === 'Todos') url.searchParams.delete('tipo'); else url.searchParams.set('tipo', slug(p));
        history.replaceState(null, '', url);
      }
    }
    mostrar(pedida || 'Todos', false);
  });
}

function tarjeta(item) {
  // La tarjeta es un bloque con un botón que la cubre entera (abre el video) y, encima, el enlace
  // del crédito: un enlace no puede ir dentro de un botón.
  const t = document.createElement('div');
  t.className = 'ev-card';
  const abrir = document.createElement('button');
  abrir.type = 'button';
  abrir.className = 'ev-card-btn';
  if (item.completo) abrir.setAttribute('data-video-embed', item.completo);
  abrir.setAttribute('aria-label', `Ver ${item.titulo} — ${item.evento}`);

  const media = document.createElement('div');
  media.className = 'ev-media';
  const { node, img } = makePictureImg(item.mini, 'ev-img');
  img.alt = '';
  img.loading = 'lazy';
  media.appendChild(node);
  t.appendChild(media);

  const tipo = document.createElement('span');
  tipo.className = 'rec';
  tipo.appendChild(document.createElement('i'));
  tipo.appendChild(document.createTextNode(item.evento));
  t.appendChild(tipo);
  if (item.dur) {
    const d = document.createElement('span');
    d.className = 'ev-dur';
    d.textContent = mmss(item.dur);
    t.appendChild(d);
  }

  const pie = document.createElement('span');
  pie.className = 'ev-pie';
  const h = document.createElement('span');
  h.className = 'ev-card-title';
  h.textContent = item.titulo;
  const d = document.createElement('span');
  d.className = 'ev-card-desc';
  describir(d, item);
  pie.append(h, d);
  t.append(pie, abrir);

  // La previa se crea al primer uso: 15 videos precargados de golpe ahogan la red del celular.
  let v = null;
  t.previa = (on) => {
    if (!item.previa || quieto) return;
    if (on && !v) {
      v = document.createElement('video');
      Object.assign(v, { muted: true, playsInline: true, loop: true, preload: 'auto', src: item.previa });
      v.defaultMuted = true; // Safari iOS solo arranca solo un video con el atributo muted
      v.setAttribute('playsinline', '');
      v.className = 'ev-img ev-previa';
      v.addEventListener('playing', () => t.classList.add('is-playing'));
      media.appendChild(v);
    }
    if (!v) return;
    if (on) v.play().catch(() => {});
    else { v.pause(); t.classList.remove('is-playing'); }
  };
  if (!tactil) {
    // Solo el cursor encima o el foco por teclado. El foco que deja un clic no cuenta: era lo que
    // dejaba una tarjeta reproduciéndose sola después de abrir y cerrar su video.
    t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') t.previa(true); });
    t.addEventListener('pointerleave', () => t.previa(false));
    abrir.addEventListener('focus', () => { if (abrir.matches(':focus-visible')) t.previa(true); });
    abrir.addEventListener('blur', () => { if (!t.matches(':hover')) t.previa(false); });
  }
  return t;
}

// Descripción con el crédito de la colaboración: «… · @mtzfilms» enlazado a su Instagram.
function describir(el, item) {
  el.textContent = item.desc;
  const c = item.credito;
  if (!c || !c.instagram) return;
  const a = document.createElement('a');
  a.className = 'ev-credito';
  a.href = c.instagram;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = c.usuario || c.nombre;
  a.setAttribute('aria-label', `Instagram de ${c.nombre}`);
  const junto = document.createElement('span'); // el punto y el usuario no se separan de línea
  junto.style.whiteSpace = 'nowrap';
  junto.append('· ', a);
  el.append(' ', junto);
}

// Sin cursor: se reproduce la tarjeta más visible (una sola a la vez) mientras se desliza.
function previsualizarAlaVista(tarjetas) {
  const ratios = new Map();
  let activa = null;
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
    let mejor = null;
    ratios.forEach((r, t) => { if (r >= 0.6 && !t.hidden && (!mejor || r > ratios.get(mejor))) mejor = t; });
    if (mejor === activa) return;
    if (activa) activa.previa(false);
    activa = mejor;
    if (activa) activa.previa(true);
  }, { threshold: [0, 0.6, 0.8, 1] });
  tarjetas.forEach((t) => io.observe(t));
}

// Banner: un video al azar de la pestaña elegida, de fondo y sin sonido; al terminar se funde a otro.
// Controles: pausa, sonido, siguiente; «Ver video completo» lo abre en el reproductor.
function crearBanner(hero) {
  const $ = (k) => hero.querySelector(`[data-ev-${k}]`);
  const video = hero.querySelector('.ev-hero-video');
  const play = $('play'), pausa = $('pausa'), sonido = $('sonido'), siguiente = $('siguiente');
  const progreso = $('progreso');
  video.defaultMuted = true;
  video.muted = true; // siempre arranca en silencio; el botón lo enciende
  let lista = [];
  let actual = null;
  let pausadoAMano = false;
  let modalAbierto = false;
  let enPantalla = true;
  let cambio = 0;

  const correr = () => {
    if (quieto || pausadoAMano || modalAbierto || !enPantalla || !actual || !actual.previa) return;
    video.play().catch(() => {});
  };
  const pintar = () => {
    const parado = pausadoAMano || quieto;
    pausa.innerHTML = svg(parado ? 'play' : 'pausa');
    pausa.setAttribute('aria-label', parado ? 'Reproducir el fondo' : 'Pausar el fondo');
    sonido.innerHTML = svg(video.muted ? 'mudo' : 'sonido');
    sonido.setAttribute('aria-label', video.muted ? 'Activar sonido' : 'Silenciar');
    sonido.setAttribute('aria-pressed', String(!video.muted));
  };

  const aplicar = (item) => {
    $('titulo').textContent = item.titulo;
    $('tipo').textContent = item.evento;
    describir($('meta'), item);
    $('dur').textContent = item.dur ? ` · ${mmss(item.dur)}` : '';
    play.hidden = !item.completo;
    if (item.completo) play.setAttribute('data-video-embed', item.completo);
    progreso.style.transform = 'scaleX(0)';
    video.poster = item.mini;
    if (quieto || !item.fondo) { video.removeAttribute('src'); hero.classList.remove('is-cambiando'); return; }
    const src = video.muted ? item.fondo : item.audio;
    if (!video.muted) video.volume = 0;
    video.src = item.inicio ? `${src}#t=${item.inicio}` : src;
    correr();
    // Vuelve a aparecer cuando el video ya corre; si no arranca (pausado, red lenta), con el póster.
    clearTimeout(cambio);
    cambio = setTimeout(() => hero.classList.remove('is-cambiando'), pausadoAMano || modalAbierto ? 0 : 1500);
  };
  // El sonido también se funde: baja con la imagen y sube cuando entra el siguiente (sin cortes).
  // Safari iOS no deja tocar el volumen desde código: ahí el cambio sigue siendo seco.
  let rampa = 0;
  const fundirSonido = (hasta) => {
    cancelAnimationFrame(rampa);
    const desde = video.volume, t0 = performance.now();
    const paso = (t) => {
      const k = Math.max(0, Math.min((t - t0) / FUNDIDO, 1)); // el primer cuadro de rAF puede ser anterior a t0
      video.volume = desde + (hasta - desde) * k;
      if (k < 1) rampa = requestAnimationFrame(paso);
    };
    rampa = requestAnimationFrame(paso);
  };
  video.addEventListener('playing', () => { if (!video.muted) fundirSonido(1); });
  // Fundido: se apaga el banner, se cambia el video y el texto, y se enciende al arrancar.
  const poner = (item) => {
    const primero = !actual; // el primero entra directo: el banner ya arranca apagado (is-cambiando en el HTML)
    actual = item;
    hero.classList.add('is-cambiando');
    if (!video.muted && !primero) fundirSonido(0);
    if (quieto || primero) return aplicar(item);
    setTimeout(() => { if (actual === item) aplicar(item); }, FUNDIDO);
  };
  const otro = () => {
    const con = lista.filter((i) => i.fondo && i !== actual);
    if (con.length) poner(con[Math.floor(Math.random() * con.length)]);
    else if (actual) { video.currentTime = actual.inicio; correr(); } // uno solo: vuelve a su toma
  };

  video.addEventListener('playing', () => { clearTimeout(cambio); hero.classList.remove('is-cambiando'); });
  // Cada video se muestra MUESTRA segundos desde su mejor toma (o hasta el final si queda menos).
  video.addEventListener('ended', otro);
  video.addEventListener('timeupdate', () => {
    if (!video.duration || !actual || hero.classList.contains('is-cambiando')) return;
    const tope = Math.min(actual.inicio + MUESTRA, video.duration);
    const hecho = (video.currentTime - actual.inicio) / (tope - actual.inicio);
    progreso.style.transform = `scaleX(${Math.max(0, Math.min(hecho, 1))})`;
    if (video.currentTime >= tope && tope < video.duration) otro();
  });
  video.addEventListener('volumechange', pintar);
  pausa.addEventListener('click', () => {
    pausadoAMano = !pausadoAMano;
    if (pausadoAMano) video.pause(); else correr();
    pintar();
  });
  sonido.addEventListener('click', () => {
    video.muted = !video.muted;
    // En teléfono el fondo es la versión ligera, sin audio: al pedir sonido se pasa a la completa en el mismo segundo.
    if (!video.muted && actual?.audio && actual.audio !== actual.fondo && !video.currentSrc.startsWith(new URL(actual.audio, location).href)) {
      video.src = `${actual.audio}#t=${video.currentTime}`;
    }
    if (!video.muted && video.paused && !pausadoAMano) correr();
    if (!video.muted) fundirSonido(1); // por si quedó en 0 a mitad de un fundido
  });
  siguiente.innerHTML = svg('siguiente');
  siguiente.addEventListener('click', otro);
  document.addEventListener('video-modal:abierto', () => { modalAbierto = true; video.pause(); });
  document.addEventListener('video-modal:cerrado', () => { modalAbierto = false; correr(); });
  // Fuera de pantalla no se decodifica.
  new IntersectionObserver(([e]) => {
    enPantalla = e.isIntersecting;
    if (enPantalla) correr(); else video.pause();
  }).observe(hero);
  pintar();

  return {
    usar(items) {
      lista = items;
      if (actual && items.includes(actual)) return; // la pestaña lo contiene: que siga
      const con = items.filter((i) => i.fondo);
      if (con.length) poner(con[Math.floor(Math.random() * con.length)]);
      else if (items[0]) poner({ ...items[0], fondo: '' });
    },
  };
}
