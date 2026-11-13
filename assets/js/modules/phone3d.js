// Hero: iPhone 17 Pro Max Cosmic Orange en 3D. Modelo «Iphone 17 pro max cosmic orange» de TechFreak
// (Sketchfab, CC BY 4.0 — crédito en el pie), comprimido con gltf-transform (meshopt + webp).
// La pantalla dibuja los reels de los datos (o, sin ellos, las fotos de .phone-screen).
// Si no hay WebGL o falla la carga, queda el celular CSS tal cual.
import { fetchCompanies } from './data-store.js';
import { svg } from './video-modal.js?v=20261113-1';
import * as Feed from './reels-feed.js?v=20261113-1';

// Audio del teléfono (fundador, 2026-11-13): arranca en silencio; con el botón suena solo el reel
// en pantalla y solo mientras el teléfono se ve (al bajar por la página se calla). Los videos del
// teléfono (url_ligera) no traen audio: con sonido se cambia al completo (url) en el mismo segundo.
const estado = { reels: [], i: 0, sonido: false, enVista: false, feed: false, actual: null, host: null, aviso: null };
const audible = () => estado.sonido && estado.enVista && !estado.feed;

function aplicarSonido() {
  if (!estado.host) return;
  estado.host.querySelectorAll('.phone-screen video').forEach((v) => {
    const quiero = estado.sonido ? v.dataset.completo : v.dataset.ligera;
    if (quiero && v.getAttribute('src') && v.getAttribute('src') !== quiero) {
      const t = v.currentTime, corria = !v.paused;
      v.src = quiero;
      if (t) v.currentTime = t;
      if (corria) jugar(v);
    }
    v.muted = !(audible() && v === estado.actual);
  });
  pintarBoton();
}

// play() con red: si el navegador no deja sonar sin un toque, sigue en silencio y vuelve el aviso.
function jugar(v) {
  return v.play().catch((e) => {
    if (e.name !== 'NotAllowedError' || v.muted) return;
    estado.sonido = false;
    aplicarSonido();
    mostrarAviso();
    v.play().catch(() => {});
  });
}

function pintarBoton() {
  const b = estado.host?.querySelector('.phone-sonido');
  if (!b) return;
  b.innerHTML = svg(estado.sonido ? 'sonido' : 'mudo');
  b.setAttribute('aria-pressed', String(estado.sonido));
  b.setAttribute('aria-label', estado.sonido ? 'Silenciar el teléfono' : 'Activar el audio');
}

function mostrarAviso() {
  const a = estado.aviso;
  if (!a || estado.sonido) return;
  a.classList.add('is-visible');
  clearTimeout(a.t);
  a.t = setTimeout(() => a.classList.remove('is-visible'), 4000);
}

// Botones bajo el teléfono: audio y «Ver reels» (el visor deslizable de reels-feed.js).
function controles(host) {
  const caja = document.createElement('div');
  caja.className = 'phone-ctrl';
  const aviso = document.createElement('span');
  aviso.className = 'phone-aviso';
  aviso.textContent = 'Activa el audio';
  aviso.setAttribute('aria-hidden', 'true');
  const son = document.createElement('button');
  son.type = 'button';
  son.className = 'phone-btn phone-sonido';
  const ver = document.createElement('button');
  ver.type = 'button';
  ver.className = 'phone-btn phone-ver';
  ver.innerHTML = svg('play') + '<span>Ver reels</span>';
  caja.append(aviso, son, ver);
  host.appendChild(caja);
  host.classList.add('con-ctrl');
  estado.aviso = aviso;
  pintarBoton();

  son.addEventListener('click', () => {
    estado.sonido = !estado.sonido;
    aviso.classList.remove('is-visible');
    aplicarSonido();
    const v = estado.actual;
    if (v && estado.sonido) { v.muted = !audible(); jugar(v); }
    // iPhone: el reel que entra en el swipe también tiene que quedar habilitado por este toque.
    host.querySelectorAll('.phone-screen video').forEach((w) => {
      if (w === v || !estado.sonido || !w.getAttribute('src') || !host.classList.contains('is-plano')) return;
      w.muted = false;
      w.play().then(() => { if (w !== estado.actual) w.pause(); w.muted = w !== estado.actual || !audible(); }, () => { w.muted = true; });
    });
  });
  ver.addEventListener('click', () => {
    Feed.abrir(estado.reels, estado.i, estado.sonido, (s) => { estado.sonido = s; });
  });
  document.addEventListener('reels:abierto', () => {
    estado.feed = true;
    host.querySelectorAll('.phone-screen video').forEach((v) => { v.muted = true; v.pause(); });
  });
  document.addEventListener('reels:cerrado', () => {
    estado.feed = false;
    aplicarSonido();
    if (estado.actual && estado.enVista) jugar(estado.actual);
  });
  // El sonido se limita a cuando el teléfono se ve: con menos del 40 % en pantalla, se calla.
  let avisado = false;
  new IntersectionObserver(([e]) => {
    estado.enVista = e.intersectionRatio >= 0.4;
    aplicarSonido();
    if (estado.enVista && !avisado) { avisado = true; setTimeout(mostrarAviso, 1200); }
  }, { threshold: [0, 0.4] }).observe(host);
}

const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0';
const THREE_URL = CDN + '/+esm';
const ROOM_URL = CDN + '/examples/jsm/environments/RoomEnvironment.js/+esm';
const GLTF_URL = CDN + '/examples/jsm/loaders/GLTFLoader.js/+esm';
const MESHOPT_URL = CDN + '/examples/jsm/libs/meshopt_decoder.module.js/+esm';
const MODELO = 'assets/models/iphone-17-pro-max.glb';
const PANTALLA = 'BsXHDwLKqtDOfrW'; // nombre del material de la pantalla en el modelo

const H = 16.34;                  // alto al que se escala el modelo (cm reales)
const MARGEN = 1.24;              // el canvas es 24 % más alto que .phone para que el giro no se corte
const CADA = 4000, REEL = 10000, SWIPE = 450; // ms por foto, por reel y del swipe al siguiente
const PASO = 1000 / 30;           // ms entre dibujos del 3D (tope de 30 cuadros/s)

// Centra el modelo, lo lleva a H de alto y pone el canvas como textura de la pantalla.
function preparar(THREE, gltf) {
  const phone = gltf.scene;
  const caja = new THREE.Box3().setFromObject(phone);
  const k = H / caja.getSize(new THREE.Vector3()).y;
  phone.scale.setScalar(k);
  phone.position.copy(caja.getCenter(new THREE.Vector3()).multiplyScalar(-k));
  const grupo = new THREE.Group();
  grupo.add(phone);

  const lienzo = document.createElement('canvas');
  lienzo.width = 600; lienzo.height = 1300;
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false; // las UV de glTF van con el origen arriba
  let pantalla = null;
  phone.traverse((o) => {
    if (o.isMesh && o.material.name === PANTALLA) {
      o.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      pantalla = o;
    }
  });
  if (!pantalla) throw new Error('modelo sin pantalla');
  return { phone: grupo, lienzo, tex };
}

// Overlay de Reels de Instagram dibujado una sola vez (se pinta encima de cada cuadro).
// Medidas en puntos de un iPhone de 440 pt de ancho, escaladas al lienzo.
const ICONOS = {
  corazon: 'M12 20.5C6 16 2.5 12.6 2.5 8.6 2.5 5.8 4.7 3.5 7.4 3.5c1.9 0 3.6 1.1 4.6 2.7 1-1.6 2.7-2.7 4.6-2.7 2.7 0 4.9 2.3 4.9 5.1 0 4-3.5 7.4-9.5 11.9z',
  comentario: 'M20.7 16.9A9.2 9.2 0 1 0 17 20.6l4.5 1z',
  enviar: 'M21.5 2.5 10.3 13.7M21.5 2.5 14.6 21l-4.3-7.3L3 9.4z',
  camara: 'M4 7.5h3.2L9 5h6l1.8 2.5H20a1.5 1.5 0 0 1 1.5 1.5v9.5A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 4 7.5zM12 17a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z',
  inicio: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  buscar: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16 16l5.5 5.5',
  crear: 'M6 2.5h12A3.5 3.5 0 0 1 21.5 6v12a3.5 3.5 0 0 1-3.5 3.5H6A3.5 3.5 0 0 1 2.5 18V6A3.5 3.5 0 0 1 6 2.5zM12 7v10M7 12h10',
  reels: 'M6 2.5h12A3.5 3.5 0 0 1 21.5 6v12a3.5 3.5 0 0 1-3.5 3.5H6A3.5 3.5 0 0 1 2.5 18V6A3.5 3.5 0 0 1 6 2.5zM2.5 8h19M9 2.5 12 8M14.5 2.5 17.5 8M10 11.5v6l5-3z',
};

// Barra de pestañas de Instagram: 49 pt + 34 de zona segura. El reel ocupa solo lo que queda
// encima, como en la app; si se dibujara a pantalla completa, su parte baja quedaría tapada.
const NAV_PT = 83;

function capaReels(ancho, alto, avatar) {
  // Todo en puntos de iOS (pantalla de 440 × 956 pt del 17 Pro Max), escalado por k al lienzo.
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  const g = c.getContext('2d'), k = ancho / 440, H_PT = alto / k;
  g.scale(k, k);
  const fuente = (peso, pt) => `${peso} ${pt}px Inter, -apple-system, system-ui, sans-serif`;
  const icono = (nombre, cx, cy, pt, relleno) => {
    g.save(); g.translate(cx - pt / 2, cy - pt / 2); g.scale(pt / 24, pt / 24);
    g.lineWidth = 1.9; g.lineJoin = g.lineCap = 'round';
    const p = new Path2D(ICONOS[nombre]);
    relleno ? g.fill(p) : g.stroke(p);
    g.restore();
  };
  const texto = (t, x, y, peso, pt, alinear = 'left', max) => {
    g.font = fuente(peso, pt); g.textAlign = alinear;
    if (max) while (t.length > 4 && g.measureText(t).width > max) t = t.slice(0, -2) + '…';
    g.fillText(t, x, y);
  };
  const circulo = (x, y, r, img) => {
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = '#0d0712'; g.fill(); g.clip();
    if (img) g.drawImage(img, x - r * 0.72, y - r * 0.72, r * 1.44, r * 1.44);
    g.restore();
  };
  const pie = H_PT - NAV_PT;         // donde empieza la barra

  // Degradados para que el texto se lea sobre cualquier video.
  let d = g.createLinearGradient(0, 0, 0, 130);
  d.addColorStop(0, 'rgba(0,0,0,0.4)'); d.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = d; g.fillRect(0, 0, 440, 130);
  d = g.createLinearGradient(0, pie - 260, 0, pie);
  d.addColorStop(0, 'rgba(0,0,0,0)'); d.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = d; g.fillRect(0, pie - 260, 440, 260);

  g.fillStyle = g.strokeStyle = '#fff';
  // Barra de estado: hora centrada en la oreja izquierda; señal, wifi y batería en la derecha.
  texto('9:41', 78, 39, 600, 17, 'center');
  [4, 6.5, 9, 11.5].forEach((h, n) => { g.beginPath(); g.roundRect(330 + n * 4.6, 38 - h, 3, h, 1); g.fill(); });
  g.save(); g.translate(351, 26); g.scale(0.7, 0.7); g.lineWidth = 2.6; g.lineCap = 'round';
  g.stroke(new Path2D('M2 8.8a15 15 0 0 1 20 0M5.3 12.2a10.4 10.4 0 0 1 13.4 0M8.6 15.6a5.6 5.6 0 0 1 6.8 0'));
  g.beginPath(); g.arc(12, 18.6, 1.6, 0, Math.PI * 2); g.fill(); g.restore();
  g.save(); g.globalAlpha = 0.45; g.lineWidth = 1;
  g.beginPath(); g.roundRect(375, 27, 26, 12.5, 4); g.stroke();
  g.beginPath(); g.roundRect(402.5, 31, 1.6, 4.5, 0.8); g.fill(); g.restore();
  g.beginPath(); g.roundRect(377, 29, 19, 8.5, 2.5); g.fill();

  g.shadowColor = 'rgba(0,0,0,0.3)'; g.shadowBlur = 3;
  // Cabecera.
  texto('Reels', 16, 96, 700, 24);
  icono('camara', 410, 88, 26);

  // Columna derecha, de abajo arriba desde la barra: audio, más, compartir, comentarios, me gusta.
  const cx = 412;
  const audio = pie - 30;                       // centro del cuadro del audio
  g.save(); g.shadowBlur = 0; g.lineWidth = 2;
  g.beginPath(); g.roundRect(cx - 14, audio - 14, 28, 28, 6); g.stroke(); g.restore();
  circulo(cx, audio, 10, avatar);
  [-7, 0, 7].forEach((dx) => { g.beginPath(); g.arc(cx + dx, audio - 44, 2, 0, Math.PI * 2); g.fill(); });
  [['enviar', '1.032'], ['comentario', '248'], ['corazon', '12,4 mil']].forEach(([n, cifra], f) => {
    const y = audio - 108 - f * 64;            // centro del ícono
    icono(n, cx, y, 28);
    texto(cifra, cx, y + 30, 600, 13, 'center');
  });

  // Autor, descripción y audio, alineados a la izquierda con 14 pt de margen.
  const base = pie - 82;                        // centro de la fila del autor
  circulo(30, base, 16, avatar);
  g.save(); g.shadowBlur = 0; g.lineWidth = 1.2; g.beginPath(); g.arc(30, base, 16, 0, Math.PI * 2); g.stroke(); g.restore();
  texto('displayz.studio', 54, base + 5, 600, 14);
  g.font = fuente(600, 14);
  const xs = 54 + g.measureText('displayz.studio').width + 10;
  g.save(); g.shadowBlur = 0; g.lineWidth = 1; g.globalAlpha = 0.8;
  g.beginPath(); g.roundRect(xs, base - 13, 60, 26, 8); g.stroke(); g.restore();
  texto('Seguir', xs + 30, base + 4.5, 600, 13, 'center');
  texto('Video, foto y diseño para tu marca y tus eventos', 14, base + 36, 400, 14, 'left', 320);
  texto('♫  displayz.studio · Audio original', 14, base + 60, 400, 13, 'left', 320);

  // Barra de pestañas de Instagram e indicador de inicio.
  g.shadowBlur = 0;
  g.fillStyle = '#000'; g.fillRect(0, pie, 440, NAV_PT);
  g.fillStyle = g.strokeStyle = '#fff';
  const paso = 440 / 5, yIc = pie + 25;
  ['inicio', 'buscar', 'crear', 'reels'].forEach((n, f) => icono(n, paso * (f + 0.5), yIc, 25));
  circulo(paso * 4.5, yIc, 13, avatar);
  g.save(); g.lineWidth = 1.2; g.beginPath(); g.arc(paso * 4.5, yIc, 13, 0, Math.PI * 2); g.stroke(); g.restore();
  g.beginPath(); g.roundRect(220 - 70, H_PT - 13, 140, 5, 2.5); g.fill();
  return c;
}

// Dibuja img o video en modo cover sobre el área del reel (encima de la barra), con opacidad a.
// Dibuja img o video en modo cover sobre el área del reel (encima de la barra), corrido dy px en
// vertical y recortado a su propio rectángulo dentro de esa área: en el swipe ninguno asoma
// sobre el otro ni sobre la barra de abajo.
function cubrir(ctx, img, dy = 0) {
  const cw = ctx.canvas.width, ch = ctx.canvas.height - NAV_PT * cw / 440;
  const iw = img.videoWidth || img.naturalWidth, ih = img.videoHeight || img.naturalHeight;
  if (!iw || !ih) return;
  const k = Math.max(cw / iw, ch / ih), w = iw * k, h = ih * k;
  ctx.save();
  const y0 = Math.max(0, dy), y1 = Math.min(ch, dy + ch);
  if (y1 <= y0) { ctx.restore(); return; }
  ctx.beginPath(); ctx.rect(0, y0, cw, y1 - y0); ctx.clip();
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2 + dy, w, h);
  ctx.restore();
}

function webgl() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
}

// Los reels del teléfono salen de los datos (videos con "reel": true); las fotos del HTML quedan
// solo si no hay ninguno o el JSON no carga. Va antes de WebGL: el celular CSS también los usa.
// Orden al azar en cada visita, sin dos reels seguidos de la misma marca (contando el paso del
// último al primero, porque la lista da la vuelta). Se arma paso a paso: cada reel sale al azar
// entre los de otra marca, salvo que una marca ya ocupe más de la mitad de lo que falta, que
// entonces va primero (si no, después no habría con qué separarla). Si la vuelta último→primero
// choca, se arma de nuevo; si la mezcla no tiene solución, queda el mejor intento.
function barajar(reels) {
  let r = reels;
  for (let n = 0; n < 50; n++) {
    const resto = [...reels];
    r = [];
    while (resto.length) {
      const prev = r.length ? r[r.length - 1].marca : null;
      const cuenta = {};
      resto.forEach((x) => { cuenta[x.marca] = (cuenta[x.marca] || 0) + 1; });
      const urge = Object.keys(cuenta).find((m) => m !== prev && cuenta[m] * 2 > resto.length);
      const ok = resto.filter((x) => (urge ? x.marca === urge : x.marca !== prev));
      const pool = ok.length ? ok : resto;
      const x = pool[Math.floor(Math.random() * pool.length)];
      r.push(x);
      resto.splice(resto.indexOf(x), 1);
    }
    if (r.length < 2 || r[0].marca !== r[r.length - 1].marca) break;
  }
  return r;
}

async function llenarReels(host) {
  const reels = barajar((await fetchCompanies())
    .flatMap((c) => ((c.video && c.videos) || []).map((v) => ({ ...v, marca: c.slug, empresa: c.publico === false ? '' : c.nombre })))
    .filter((v) => v.reel && v.url));
  if (!reels.length) return;
  estado.reels = reels;
  const pantalla = host.querySelector('.phone-screen');
  pantalla.replaceChildren(...reels.map((r, k) => {
    const v = document.createElement('video');
    // url_ligera: 720p sin audio, hecha para el tamaño del teléfono. Solo el primero se precarga;
    // los demás bajan cuando les toca (ver pintarPantalla). crossOrigin antes del src: el video
    // viene del Worker de R2 y sin CORS el lienzo WebGL queda "contaminado" y la pantalla sale negra.
    Object.assign(v, { crossOrigin: 'anonymous', muted: true, playsInline: true, loop: true, autoplay: k === 0,
      preload: k === 0 ? 'auto' : 'none', src: r.url_ligera || r.url });
    // Safari iOS solo deja arrancar solo un video con el atributo muted en el HTML (la propiedad no basta).
    v.defaultMuted = true;
    v.setAttribute('playsinline', '');
    if (r.miniatura) v.poster = r.miniatura;
    v.setAttribute('aria-label', r.titulo || 'Reel');
    v.dataset.ligera = r.url_ligera || r.url;
    v.dataset.completo = r.url;
    return v;
  }));
}

// iPhone: teléfono plano (el celular CSS) con los reels en video normal, la capa de Instagram y el swipe
// del 3D, pero sin el modelo. En el
// 3D, Safari iOS deja de decodificar la imagen desde el 3.er reel aunque el video sigue corriendo
// (?diag del 2026-10-31: currentTime avanza y los cuadros entregados se quedan fijos), probado con
// lienzo 2D, con textura de video directa y con solo dos elementos. Decisión del fundador, 2026-10-31.
async function plano(host, reels, quieto) {
  await reels;
  const pantalla = host.querySelector('.phone-screen');
  const vs = [...pantalla.querySelectorAll('video')];
  if (!vs.length) return; // sin reels quedan las fotos del HTML
  host.classList.add('is-plano');
  const lista = vs.map((x) => ({ src: x.dataset.ligera, completo: x.dataset.completo, poster: x.poster, nombre: x.getAttribute('aria-label') }));
  // Dos videos que se turnan: el que se ve y el que entra en el swipe. Los demás sobran.
  // Con un solo reel no hay segundo (su poster taparía al que se reproduce).
  vs.slice(2).forEach((x) => x.remove());
  const [v, w] = vs, dos = vs.slice(0, 2);
  if (w) { w.removeAttribute('src'); w.removeAttribute('autoplay'); }

  // La misma capa de Reels del 3D, en un lienzo encima de los videos, al tamaño real de la pantalla.
  const avatar = new Image();
  avatar.src = 'assets/images/isotipo.svg';
  await Promise.race([Promise.all([avatar.decode().catch(() => {}), document.fonts.ready]),
    new Promise((r) => setTimeout(r, 1500))]);
  const capa = document.createElement('canvas');
  capa.className = 'phone-capa';
  pantalla.appendChild(capa);
  const ajustar = () => {
    const { clientWidth: cw, clientHeight: ch } = pantalla;
    if (!cw || !ch) return;
    const d = Math.min(devicePixelRatio, 3);
    capa.width = Math.round(cw * d); capa.height = Math.round(ch * d);
    capa.getContext('2d').drawImage(capaReels(capa.width, capa.height, avatar.naturalWidth ? avatar : null), 0, 0);
    // El reel ocupa solo lo que queda encima de la barra de pestañas, como en la app.
    dos.forEach((x) => { x.style.height = `calc(100% - ${NAV_PT * cw / 440}px)`; });
  };
  new ResizeObserver(ajustar).observe(pantalla);
  ajustar();

  let k = 0, visible = true, actual = v, sig = w, moviendo = false;
  estado.actual = v;
  const correr = () => { if (visible && !quieto && !moviendo && !estado.feed) jugar(actual); };
  const poner = (x, n) => {
    x.poster = lista[n].poster;
    x.dataset.ligera = lista[n].src;
    x.dataset.completo = lista[n].completo;
    x.src = estado.sonido ? lista[n].completo : lista[n].src;
    x.setAttribute('aria-label', lista[n].nombre || 'Reel');
  };
  const mover = (x, y, animar) => {
    x.style.transition = animar ? `transform ${SWIPE}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none';
    x.style.transform = `translateY(${y}%)`;
  };
  // El siguiente se prepara apenas termina el swipe: carga detrás del actual (que lo tapa entero, sin
  // asomar por ningún borde) y un play() con pausa inmediata le deja el primer cuadro listo, porque iOS
  // no carga nada antes de un play(). Así entra con imagen y no en negro.
  const preparar = (x) => {
    if (lista.length < 2) return;
    poner(x, (k + 1) % lista.length);
    x.style.zIndex = '0'; actual.style.zIndex = '1';
    mover(x, 0, false);
    // Sin play() fuera de pantalla; y si el swipe ya empezó, este es el que entra: no se pausa.
    x.muted = true; // el que espera no suena
    if (!quieto && visible) x.play().then(() => { if (x !== actual && !(moviendo && visible)) x.pause(); }, () => {});
  };
  // Swipe como en Instagram: el siguiente entra desde abajo mientras el actual sube, y sigue desde
  // donde quedó su primer cuadro.
  const pasar = () => {
    if (moviendo || !visible || estado.feed) return;
    moviendo = true;
    k = (k + 1) % lista.length;
    estado.i = k;
    mover(sig, 100, false);
    sig.getBoundingClientRect(); // fija la posición de partida antes de animar
    estado.actual = sig;
    sig.muted = !audible();
    jugar(sig);
    mover(actual, -100, true);
    mover(sig, 0, true);
    setTimeout(() => {
      actual.pause();
      actual.muted = true;
      [actual, sig] = [sig, actual];
      moviendo = false;
      preparar(sig);
      correr();
    }, SWIPE);
  };
  preparar(w);
  if (lista.length > 1) {
    dos.forEach((x) => {
      x.loop = false;
      x.addEventListener('ended', () => { if (x === actual) pasar(); });
      x.addEventListener('timeupdate', () => { if (x === actual && x.currentTime * 1000 >= REEL) pasar(); }); // REEL ms por reel, como el 3D
    });
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) correr(); else dos.forEach((x) => x.pause()); }).observe(host);
  if (quieto) v.pause();
}

export async function init() {
  const host = document.querySelector('.phone');
  if (!host) return;
  estado.host = host;
  const reels = llenarReels(host).then(() => { if (estado.reels.length) controles(host); }).catch(() => {}); // en paralelo con la carga 3D
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (/iPhone/.test(navigator.userAgent)) return plano(host, reels, quieto);
  if (!webgl()) return;

  let THREE, RoomEnvironment, gltf;
  try {
    let GLTFLoader, MeshoptDecoder;
    [THREE, { RoomEnvironment }, { GLTFLoader }, { MeshoptDecoder }] = await Promise.all(
      [import(THREE_URL), import(ROOM_URL), import(GLTF_URL), import(MESHOPT_URL)]);
    gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MODELO);
  } catch { return; } // sin red al CDN o sin modelo: queda el celular CSS

  // Preparar el modelo y crear el renderer antes de tocar la página: si algo falla, queda el CSS.
  let phone, lienzo, tex, renderer;
  try {
    ({ phone, lienzo, tex } = preparar(THREE, gltf));
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const canto = new THREE.DirectionalLight(0xffe2c8, 1); // ilumina el canto que queda a la vista
  canto.position.set(12, 2, 4);
  scene.add(canto);

  scene.add(phone);
  const ctx = lienzo.getContext('2d');

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 200);
  camera.position.z = (H * MARGEN) / (2 * Math.tan(THREE.MathUtils.degToRad(15)));

  const canvas = renderer.domElement;
  canvas.className = 'phone-3d';
  host.appendChild(canvas);
  const ajustar = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera); // con movimiento reducido el bucle ya paró: repintar al cambiar de tamaño
  };
  new ResizeObserver(ajustar).observe(canvas);
  ajustar();

  // Avatar del overlay: el isotipo. Se espera a las fuentes para que el texto salga en Inter.
  const avatar = new Image();
  avatar.src = 'assets/images/isotipo.svg';
  // Son adornos: si tardan más de 1,5 s, se sigue sin ellos.
  await Promise.race([Promise.all([avatar.decode().catch(() => {}), document.fonts.ready]),
    new Promise((r) => setTimeout(r, 1500))]);
  const capa = capaReels(lienzo.width, lienzo.height, avatar.naturalWidth ? avatar : null);

  await reels;
  const medios = [...host.querySelectorAll('.phone-screen img, .phone-screen video')];
  // Pantalla: medios[i] (foto o video) y, durante el swipe, el siguiente entrando desde abajo
  // como en Instagram; encima de todo, el overlay de Reels. Cada medio se sigue por su lugar en
  // medios, no por el orden en que termina de cargar. Una foto dura CADA por reloj; un video,
  // sus primeros REEL ms (o entero si es más corto), según su propio currentTime (así pausar
  // fuera de pantalla no descuadra nada).
  const esVideo = (m) => m.tagName === 'VIDEO';
  const lista = (m) => (esVideo(m) ? m.readyState >= 2 : m.complete && m.naturalWidth);
  const rota = (m) => (esVideo(m) ? !!m.error : m.complete && !m.naturalWidth);
  const reproducir = (m) => { if (esVideo(m) && !quieto && m.paused && !estado.feed) jugar(m); };
  // El HTML los trae con autoplay: aquí manda el script. Solo el primero corre; con varios medios
  // ninguno se repite solo (el turno lo marca el swipe), y con movimiento reducido todos quietos.
  medios.filter(esVideo).forEach((v) => {
    if (medios.length > 1) v.loop = false;
    if (quieto || v !== medios[0]) v.pause();
  });
  estado.actual = medios[0];
  let i = 0, desde = performance.now(), ultima = null, entrando = -1, inicio = 0, pausa = 0;
  const queda = (m, t) => (esVideo(m) ? Math.min((m.duration || 0) * 1000, REEL) - m.currentTime * 1000 : CADA - (t - desde));
  const alto = lienzo.height - NAV_PT * lienzo.width / 440; // área del reel, sin la barra
  function siguiente() {
    for (let k = 1; k < medios.length; k++) {
      const j = (i + k) % medios.length;
      if (lista(medios[j])) return j;
    }
    return -1;
  }
  function pintarPantalla(t) {
    const actual = medios[i];
    if (!actual) return false;
    if (!lista(actual)) {
      if (rota(actual)) { i = (i + 1) % medios.length; desde = t; entrando = -1; ultima = null; } // rota: se salta
      else reproducir(actual); // Safari iOS no carga datos hasta el play(): esperar a "listo" lo dejaba quieto
      return false;
    }
    reproducir(actual);
    const prox = medios[(i + 1) % medios.length]; // el siguiente baja mientras corre el actual
    if (esVideo(prox) && prox.preload === 'none') {
      prox.preload = 'auto';
      // iOS ignora preload: un play() silenciado y pausa en cuanto arranca deja el primer cuadro listo.
      prox.muted = true; // se precarga en silencio
      if (!quieto) prox.play().then(() => { if (medios[i] !== prox && medios[entrando] !== prox) prox.pause(); }, () => {});
      else prox.load();
    }
    // Un swipe empezado se termina con el mismo medio, aunque se haya salido de pantalla a mitad.
    const j = entrando >= 0 ? entrando : quieto ? -1 : siguiente();
    if (entrando < 0 && (j < 0 || queda(actual, t) > 0)) {
      if (ultima === actual && !esVideo(actual)) return false; // una foto fija no se repinta
      ctx.fillStyle = '#120a1a'; ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      cubrir(ctx, actual);
      ctx.drawImage(capa, 0, 0);
      ultima = actual;
      return true;
    }
    const sig = medios[j];
    if (entrando !== j) { // empieza el swipe: el que entra arranca desde su inicio, una sola vez
      entrando = j;
      inicio = t; // el swipe corre por reloj: si el siguiente llegó tarde, igual se ve entero
      if (esVideo(sig)) { sig.currentTime = 0; estado.actual = sig; estado.i = j; sig.muted = !audible(); }
    }
    reproducir(sig); // también si se pausó al salir de pantalla a mitad del swipe
    const a = Math.min(1, (t - inicio) / SWIPE);
    const sube = (a < 0.5 ? 4 * a * a * a : 1 - (-2 * a + 2) ** 3 / 2) * alto; // ease-in-out como el dedo
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, lienzo.width, alto);
    cubrir(ctx, actual, -sube);
    cubrir(ctx, sig, alto - sube);
    ctx.drawImage(capa, 0, 0);
    ultima = null;
    if (a >= 1) { if (esVideo(actual)) { actual.pause(); actual.muted = true; } i = j; desde = t; entrando = -1; }
    return true;
  }

  // Un solo bucle: se detiene fuera de pantalla, con movimiento reducido una vez pintada la foto,
  // y para siempre si se pierde el contexto WebGL (vuelve el celular CSS).
  let raf = 0, visible = true, conFoto = false, muerto = false, previo = -Infinity;
  const t0 = performance.now();
  const correr = () => { if (!raf && !muerto) raf = requestAnimationFrame(cuadro); };
  canvas.addEventListener('webglcontextlost', () => {
    muerto = true; cancelAnimationFrame(raf); host.classList.remove('is-3d'); canvas.remove();
  });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { desde = performance.now(); inicio = desde - pausa; correr(); } // el swipe sigue donde iba
    else {
      pausa = performance.now() - inicio;
      medios.forEach((m) => { if (esVideo(m)) m.pause(); }); // fuera de pantalla no se decodifica
    }
  }).observe(host);
  function cuadro(t) {
    raf = 0;
    if (muerto || !visible) return;
    // Tope de 30 cuadros/s: los reels van a 30 y 30 reparte parejo en pantallas de 60, 90 y 120 Hz.
    // 4 ms de holgura para el temblor del reloj. previo avanza de 1/30 s en 1/30 s (conserva la fase),
    // así en 100, 144 o 165 Hz el promedio también es 30; si se atrasó más de un refresco (primer cuadro,
    // vuelta a pantalla, tirón) arranca de nuevo en t, sin recuperar cuadros de golpe.
    if (t - previo < PASO - 4) return correr();
    previo = previo + PASO > t - PASO / 3 ? previo + PASO : t;
    if (medios.every(rota)) return; // ningún medio cargó: queda el CSS
    if (pintarPantalla(t)) { tex.needsUpdate = true; conFoto = true; }
    const s = quieto ? 0 : (t - t0) / 9000 * Math.PI * 2;
    phone.rotation.y = -0.42 + Math.sin(s) * 0.2;    // ±11° alrededor de una pose de 3/4 que deja ver el canto naranja
    phone.rotation.x = Math.sin(s * 0.5) * 0.07;     // ±4°
    renderer.render(scene, camera);
    if (conFoto) host.classList.add('is-3d'); // el 3D reemplaza al CSS solo con una foto ya en pantalla
    if (!(quieto && conFoto)) correr();
  }
  correr();
}
