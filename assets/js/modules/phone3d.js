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
