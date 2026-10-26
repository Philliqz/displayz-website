// Hero: iPhone 17 Pro Max Cosmic Orange en 3D (three.js, geometría propia — no hay modelo libre).
// La pantalla dibuja las fotos de .phone-screen (luego reels: drawImage acepta <video>).
// Si no hay WebGL o falla la carga, queda el celular CSS tal cual.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
const ROOM_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js/+esm';

// Medidas reales en cm: 7,8 × 16,34 × 0,875.
const W = 7.8, H = 16.34, D = 0.875, R = 1.25, BEVEL = 0.22;
const MARGEN = 1.24;              // el canvas es 24 % más alto que .phone para que el giro no se corte
const CADA = 4000, FUNDIDO = 800; // ms por foto y de fundido

function rect(THREE, w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// ShapeGeometry deja la UV en coordenadas del mundo; la pantalla necesita 0-1.
function plano(THREE, w, h, r) {
  const g = new THREE.ShapeGeometry(rect(THREE, w, h, r), 24);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}

function construir(THREE) {
  const phone = new THREE.Group();
  // Aluminio anodizado: metal puro (sin laca ni difuso, que es lo que lo hacía ver de plástico); el color tiñe el reflejo.
  const aluminio = new THREE.MeshPhysicalMaterial({ color: 0xff8a33, metalness: 1, roughness: 0.4, envMapIntensity: 1.5 });
  const negro = new THREE.MeshPhysicalMaterial({ color: 0x050505, metalness: 0, roughness: 0.08, clearcoat: 1 });

  const cuerpo = new THREE.ExtrudeGeometry(rect(THREE, W - 2 * BEVEL, H - 2 * BEVEL, R - BEVEL), {
    depth: D - 2 * BEVEL, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 10, curveSegments: 32,
  });
  cuerpo.translate(0, 0, -(D - 2 * BEVEL) / 2);
  phone.add(new THREE.Mesh(cuerpo, aluminio));

  const z = D / 2 + 0.002;
  const cristal = new THREE.Mesh(plano(THREE, W - 0.14, H - 0.14, R - 0.07), negro);
  cristal.position.z = z;
  phone.add(cristal);

  // Pantalla: canvas 2D como textura.
  const lienzo = document.createElement('canvas');
  lienzo.width = 600; lienzo.height = Math.round(600 * (H - 0.5) / (W - 0.5));
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  const pantalla = new THREE.Mesh(plano(THREE, W - 0.5, H - 0.5, R - 0.25), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  pantalla.position.z = z + 0.002;
  phone.add(pantalla);

  const isla = new THREE.Mesh(plano(THREE, 2.1, 0.62, 0.31), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  isla.position.set(0, H / 2 - 0.85, z + 0.004);
  phone.add(isla);

  // Botones: lateral derecho (encendido y Control de Cámara), izquierdo (Acción y volumen).
  [[1, 3.2, 1.6], [1, -1.3, 1.0], [-1, 4.4, 0.6], [-1, 3.0, 1.2], [-1, 1.5, 1.2]].forEach(([lado, y, alto]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, alto, D * 0.42), aluminio);
    b.position.set(lado * (W / 2 + 0.02), y, 0);
    phone.add(b);
  });
  return { phone, lienzo, tex };
}

// Dibuja img en modo cover con opacidad a.
function cubrir(ctx, img, a) {
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
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
  const imgs = [...host.querySelectorAll('.phone-screen img')];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let THREE, RoomEnvironment;
  try {
    [THREE, { RoomEnvironment }] = await Promise.all([import(THREE_URL), import(ROOM_URL)]);
  } catch (e) { return; } // sin red al CDN: queda el celular CSS

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 768 ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const canto = new THREE.DirectionalLight(0xffe2c8, 2); // ilumina el canto que queda a la vista
  canto.position.set(12, 2, 4);
  scene.add(canto);

  const { phone, lienzo, tex } = construir(THREE);
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

  // Pantalla: imgs[i] y, durante el fundido, la siguiente ya cargada encima. Se sigue a cada foto
  // por su lugar en imgs, no por el orden en que terminan de cargar.
  const lista = (im) => im.complete && im.naturalWidth;
  let i = 0, desde = performance.now(), ultima = null;
  function siguiente() {
    for (let k = 1; k < imgs.length; k++) {
      const j = (i + k) % imgs.length;
      if (lista(imgs[j])) return j;
    }
    return -1;
  }
  function pintarPantalla(t) {
    const actual = imgs[i];
    if (!actual) return false;
    if (!lista(actual)) {
      if (actual.complete) i = (i + 1) % imgs.length; // rota: se salta
      return false;
    }
    const j = quieto ? -1 : siguiente();
    const transcurrido = t - desde;
    if (j < 0 || transcurrido < CADA - FUNDIDO) {
      if (ultima === actual) return false;
      ctx.fillStyle = '#120a1a'; ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      cubrir(ctx, actual, 1);
      ultima = actual;
      return true;
    }
    const a = Math.min(1, (transcurrido - (CADA - FUNDIDO)) / FUNDIDO);
    cubrir(ctx, actual, 1);
    cubrir(ctx, imgs[j], a);
    ultima = null;
    if (a >= 1) { i = j; desde = t; }
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
  }).observe(host);
  function cuadro(t) {
    raf = 0;
    if (muerto || !visible) return;
    if (imgs.every((im) => im.complete && !im.naturalWidth)) return; // ninguna foto cargó: queda el CSS
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
