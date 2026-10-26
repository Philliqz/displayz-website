// Hero: iPhone 17 Pro Max Cosmic Orange en 3D. Modelo «Iphone 17 pro max cosmic orange» de TechFreak
// (Sketchfab, CC BY 4.0 — crédito en el pie), comprimido con gltf-transform (meshopt + webp).
// La pantalla dibuja las fotos de .phone-screen (luego reels: drawImage acepta <video>).
// Si no hay WebGL o falla la carga, queda el celular CSS tal cual.
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0';
const THREE_URL = CDN + '/+esm';
const ROOM_URL = CDN + '/examples/jsm/environments/RoomEnvironment.js/+esm';
const GLTF_URL = CDN + '/examples/jsm/loaders/GLTFLoader.js/+esm';
const MESHOPT_URL = CDN + '/examples/jsm/libs/meshopt_decoder.module.js/+esm';
const MODELO = 'assets/models/iphone-17-pro-max.glb';
const PANTALLA = 'BsXHDwLKqtDOfrW'; // nombre del material de la pantalla en el modelo

const H = 16.34;                  // alto al que se escala el modelo (cm reales)
const MARGEN = 1.24;              // el canvas es 24 % más alto que .phone para que el giro no se corte
const CADA = 4000, FUNDIDO = 800; // ms por foto y de fundido

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
function cubrir(ctx, img, a) {
  const cw = ctx.canvas.width, ch = ctx.canvas.height - NAV_PT * cw / 440;
  const iw = img.videoWidth || img.naturalWidth, ih = img.videoHeight || img.naturalHeight;
  if (!iw || !ih) return;
  const k = Math.max(cw / iw, ch / ih), w = iw * k, h = ih * k;
  ctx.globalAlpha = a;
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  ctx.globalAlpha = 1;
}

function webgl() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; }
}

export async function init() {
  const host = document.querySelector('.phone');
  if (!host || !webgl()) return;
  const medios = [...host.querySelectorAll('.phone-screen img, .phone-screen video')];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let THREE, RoomEnvironment, gltf;
  try {
    let GLTFLoader, MeshoptDecoder;
    [THREE, { RoomEnvironment }, { GLTFLoader }, { MeshoptDecoder }] = await Promise.all(
      [import(THREE_URL), import(ROOM_URL), import(GLTF_URL), import(MESHOPT_URL)]);
    gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MODELO);
  } catch (e) { return; } // sin red al CDN o sin modelo: queda el celular CSS

  // Preparar el modelo y crear el renderer antes de tocar la página: si algo falla, queda el CSS.
  let phone, lienzo, tex, renderer;
  try {
    ({ phone, lienzo, tex } = preparar(THREE, gltf));
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { return; }
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

  // Pantalla: medios[i] (foto o video) y, durante el fundido, el siguiente ya cargado encima;
  // encima de todo, el overlay de Reels. Cada medio se sigue por su lugar en medios, no por el
  // orden en que termina de cargar. Una foto dura CADA por reloj; un video, lo que le queda
  // según su propio currentTime (así pausar fuera de pantalla no descuadra nada).
  const esVideo = (m) => m.tagName === 'VIDEO';
  const lista = (m) => (esVideo(m) ? m.readyState >= 2 : m.complete && m.naturalWidth);
  const rota = (m) => (esVideo(m) ? !!m.error : m.complete && !m.naturalWidth);
  const reproducir = (m) => { if (esVideo(m) && !quieto && m.paused) m.play().catch(() => {}); };
  // El HTML los trae con autoplay: aquí manda el script. Solo el primero corre; con varios medios
  // ninguno se repite solo (el turno lo marca el fundido), y con movimiento reducido todos quietos.
  medios.filter(esVideo).forEach((v) => {
    if (medios.length > 1) v.loop = false;
    if (quieto || v !== medios[0]) v.pause();
  });
  let i = 0, desde = performance.now(), ultima = null, entrando = -1;
  const queda = (m, t) => (esVideo(m) ? ((m.duration || 0) - m.currentTime) * 1000 : CADA - (t - desde));
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
      return false;
    }
    reproducir(actual);
    const j = quieto ? -1 : siguiente();
    const resta = queda(actual, t);
    if (j < 0 || resta > FUNDIDO) {
      if (ultima === actual && !esVideo(actual)) return false; // una foto fija no se repinta
      ctx.fillStyle = '#120a1a'; ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      cubrir(ctx, actual, 1);
      ctx.drawImage(capa, 0, 0);
      ultima = actual;
      return true;
    }
    const sig = medios[j];
    if (entrando !== j) { // empieza el fundido: el que entra arranca desde su inicio, una sola vez
      entrando = j;
      if (esVideo(sig)) sig.currentTime = 0;
    }
    reproducir(sig); // también si se pausó al salir de pantalla a mitad del fundido
    const a = Math.min(1, 1 - resta / FUNDIDO);
    cubrir(ctx, actual, 1);
    cubrir(ctx, sig, a);
    ctx.drawImage(capa, 0, 0);
    ultima = null;
    if (a >= 1) { if (esVideo(actual)) actual.pause(); i = j; desde = t; entrando = -1; }
    return true;
  }

  // Un solo bucle: se detiene fuera de pantalla, con movimiento reducido una vez pintada la foto,
  // y para siempre si se pierde el contexto WebGL (vuelve el celular CSS).
  let raf = 0, visible = true, conFoto = false, muerto = false;
  const t0 = performance.now();
  const correr = () => { if (!raf && !muerto) raf = requestAnimationFrame(cuadro); };
  canvas.addEventListener('webglcontextlost', () => {
    muerto = true; cancelAnimationFrame(raf); host.classList.remove('is-3d'); canvas.remove();
  });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { desde = performance.now(); correr(); }
    else medios.forEach((m) => { if (esVideo(m)) m.pause(); }); // fuera de pantalla no se decodifica
  }).observe(host);
  function cuadro(t) {
    raf = 0;
    if (muerto || !visible) return;
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
