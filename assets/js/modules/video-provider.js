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
    const m = url.match(YOUTUBE_ID_RE);
    return m ? `https://www.youtube.com/embed/${m[1]}` : url;
  }

  if (p === 'vimeo') {
    if (url.includes('player.vimeo.com')) return url; // ya es un link de embed
    const m = url.match(VIMEO_ID_RE);
    return m ? `https://player.vimeo.com/video/${m[1]}` : url;
  }

  // 'bunny' (links de Bunny Stream ya vienen listos para iframe) e 'iframe' (genérico):
  // pasar la URL tal cual, sin transformar. Nunca lanza error — si la URL es inválida,
  // el iframe simplemente no carga, igual que hoy si alguien pega un link roto.
  return url;
}
