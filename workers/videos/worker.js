import NIVELES from './niveles.json';
// Sirve los mp4 del bucket con soporte de rangos (adelantar en el reproductor) y caché larga.
// Solo rutas portfolio/<marca>/video/<archivo>.mp4: el bucket no queda listable ni expone otra cosa.
const RUTA = /^portfolio\/[a-z0-9-]+\/video\/[a-z0-9-]+\.mp4$/;

// Media Encoder exportó 68 videos con nivel H.264 6.0 y el iPhone no los reproduce (2026-10-26).
// El nivel es un byte (avcC y cada SPS); aquí se sirve como 4.1, lo que corresponde a 1080p a
// 3.75 Mbps, sin volver a subir los archivos. niveles.json: MD5 y posiciones de ese byte por archivo.
const NIVEL = 41;

// Cambia los bytes de nivel que caen en este tramo; inicio = posición absoluta del primer byte.
function parchear(cuerpo, offs, inicio) {
  let pos = inicio;
  let k = 0;
  while (k < offs.length && offs[k] < inicio) k++;
  return cuerpo.pipeThrough(new TransformStream({
    transform(trozo, ctl) {
      const fin = pos + trozo.length;
      if (k < offs.length && offs[k] < fin) {
        trozo = new Uint8Array(trozo); // copia: el trozo original puede ser de solo lectura
        for (; k < offs.length && offs[k] < fin; k++) trozo[offs[k] - pos] = NIVEL;
      }
      pos = fin;
      ctl.enqueue(trozo);
    },
  }));
}

// debil: If-None-Match compara sin el prefijo W/ (RFC 9110 §8.8.3.2); If-Match exige igualdad estricta.
const coincide = (lista, etag, debil) => lista.split(',').some((e) => {
  e = e.trim();
  if (debil) e = e.replace(/^W\//, '');
  return e === '*' || e === etag;
});

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Método no permitido', { status: 405, headers: { allow: 'GET, HEAD' } });
    }
    // ponytail: diagnóstico temporal del iPhone 3D (2026-10-27): lo lee `wrangler tail`; se quita al resolverlo.
    const url = new URL(request.url);
    if (url.pathname === '/diag') {
      console.log('DIAG', request.headers.get('user-agent'), url.searchParams.get('d'));
      return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*' } });
    }
    let key;
    try { key = decodeURIComponent(new URL(request.url).pathname.slice(1)); } catch { key = ''; }
    if (!RUTA.test(key)) return new Response('No encontrado', { status: 404 });

    const meta = await env.VIDEOS.head(key);
    if (!meta) return new Response('No encontrado', { status: 404 });

    // Solo si el archivo es el mismo con el que se midieron las posiciones (ETag de R2 = MD5):
    // otro archivo subido con la misma clave se sirve tal cual, sin tocarle bytes.
    const offs = NIVELES[key]?.md5 === meta.etag ? NIVELES[key].o : null;
    // Otro ETag para la versión con el nivel cambiado: no se mezcla con lo que haya en caché.
    const etag = offs ? meta.httpEtag.replace(/"$/, `-n${NIVEL}"`) : meta.httpEtag;
    const headers = new Headers();
    meta.writeHttpMetadata(headers);
    headers.set('etag', etag);
    headers.set('accept-ranges', 'bytes');
    headers.set('access-control-allow-origin', '*');

    // Precondiciones (RFC 9110 §13.2.2): If-Match falla → 412; If-None-Match coincide → 304.
    const ifMatch = request.headers.get('if-match');
    if (ifMatch && !coincide(ifMatch, etag)) return new Response(null, { status: 412, headers });
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && coincide(ifNoneMatch, etag, true)) return new Response(null, { status: 304, headers });

    if (request.method === 'HEAD') {
      headers.set('content-length', String(meta.size));
      return new Response(null, { headers });
    }

    // If-Range con otra versión: se ignora el rango y va el archivo completo (no se mezclan versiones).
    const ifRange = request.headers.get('if-range');
    const conRango = request.headers.has('range') && (!ifRange || ifRange === etag);

    let obj;
    try {
      obj = await env.VIDEOS.get(key, conRango ? { range: request.headers } : {});
    } catch {
      if (!conRango) return new Response('Error leyendo el video', { status: 502 });
      headers.set('content-range', `bytes */${meta.size}`); // rango fuera del archivo
      return new Response(null, { status: 416, headers });
    }
    if (!obj) return new Response('No encontrado', { status: 404 });
    if (obj.etag !== meta.etag) return new Response('El video cambió, reintenta', { status: 503, headers: { 'retry-after': '1' } }); // carrera head/get

    if (conRango && obj.range) {
      // R2 trae las tres claves aunque alguna venga undefined: se mira el valor, no si existe.
      const r = obj.range;
      const offset = r.suffix !== undefined ? obj.size - r.suffix : (r.offset ?? 0);
      const length = r.suffix !== undefined ? r.suffix : (r.length ?? obj.size - offset);
      headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${obj.size}`);
      headers.set('content-length', String(length));
      return new Response(offs ? parchear(obj.body, offs, offset) : obj.body, { status: 206, headers });
    }
    headers.set('content-length', String(obj.size));
    return new Response(offs ? parchear(obj.body, offs, 0) : obj.body, { headers });
  },
};
