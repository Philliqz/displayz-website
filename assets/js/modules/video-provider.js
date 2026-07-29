// Detecta el proveedor de un link de video normal y genera el src de iframe correspondiente.
// Nunca se guarda HTML/iframe en los datos — solo {titulo, provider, url} — esta es la
// única función que sabe transformar eso en algo embebible.

const YOUTUBE_ID_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{6,})/i;
const VIMEO_ID_RE = /vimeo\.com\/(?:video\/)?(\d+)/i;

/**
 * @param {string} url
 * @returns {'youtube'|'vimeo'|'bunny'|'iframe'}
 */
export function detectProvider(url) {
  if (!url) return 'iframe';
  const low = url.toLowerCase();
  if (low.includes('youtube.com') || low.includes('youtu.be')) return 'youtube';
  if (low.includes('vimeo.com')) return 'vimeo';
  if (low.includes('mediadelivery.net')) return 'bunny';
  return 'iframe'; // passthrough genérico: Mega.nz o cualquier otro host embebible
}

function youtubeId(url) {
  if (url.includes('youtube.com/embed/')) {
    const m = url.match(/embed\/([\w-]{6,})/);
    return m ? m[1] : null;
  }
  const m = url.match(YOUTUBE_ID_RE);
  return m ? m[1] : null;
}

function vimeoId(url) {
  if (url.includes('player.vimeo.com')) {
    const m = url.match(/video\/(\d+)/);
    return m ? m[1] : null;
  }
  const m = url.match(VIMEO_ID_RE);
  return m ? m[1] : null;
}

/**
 * @param {string} url
 * @param {string} [provider] - si se omite, se detecta a partir de la URL
 * @returns {string|null} src listo para <iframe>, o null si no hay URL
 */
export function toEmbedSrc(url, provider) {
  if (!url) return null;
  const p = provider || detectProvider(url);

  if (p === 'youtube') {
    if (url.includes('youtube.com/embed/')) return url; // ya es un link de embed
    const id = youtubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  if (p === 'vimeo') {
    if (url.includes('player.vimeo.com')) return url; // ya es un link de embed
    const id = vimeoId(url);
    return id ? `https://player.vimeo.com/video/${id}` : url;
  }

  // 'bunny' (links de Bunny Stream ya vienen listos para iframe) e 'iframe' (genérico):
  // pasar la URL tal cual, sin transformar. Nunca lanza error — si la URL es inválida,
  // el iframe simplemente no carga, igual que hoy si alguien pega un link roto.
  return url;
}

/**
 * Miniatura automática sin llamadas de red — solo funciona para YouTube, que
 * expone sus miniaturas en una URL pública y predecible por ID de video.
 * @param {string} url
 * @param {string} [provider]
 * @returns {string|null}
 */
export function getThumbnailSync(url, provider) {
  if (!url) return null;
  const p = provider || detectProvider(url);
  if (p === 'youtube') {
    const id = youtubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  }
  return null;
}

/**
 * Miniatura automática que sí requiere una consulta de red (Vimeo no tiene
 * una URL de miniatura predecible por ID — hay que preguntarle a su oEmbed
 * público). Se usa como mejora progresiva: el <img> ya se pintó con algún
 * respaldo (getThumbnailSync o el logo de la empresa) y esto, si encuentra
 * algo mejor, lo reemplaza. Nunca lanza error — si la red falla o el host
 * no tiene una forma conocida de resolver la miniatura, resuelve null.
 * @param {string} url
 * @param {string} [provider]
 * @returns {Promise<string|null>}
 */
export function fetchThumbnail(url, provider) {
  if (!url) return Promise.resolve(null);
  const p = provider || detectProvider(url);

  if (p === 'vimeo') {
    return fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data && data.thumbnail_url) || null)
      .catch(() => null);
  }

  return Promise.resolve(null);
}
