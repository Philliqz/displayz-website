// Única puerta de entrada a los datos de empresas. Ningún otro módulo debe hacer
// fetch() de database/empresas.json directamente — este es el "enchufe" que el día
// de mañana se cambia por llamadas a un backend real (Supabase/REST/etc.) sin tener
// que tocar portfolio.js ni featured.js.
import { CONFIG } from './config.js';

let cache = null;

export function fetchCompanies() {
  if (!cache) {
    cache = fetch(CONFIG.DATA_URL)
      .then((res) => res.json())
      .then((empresas) => {
        empresas.forEach((c) => (c.videos || []).forEach((v) => {
          v.url = enVideos(v.url);
          v.url_ligera = enVideos(v.url_ligera);
        }));
        return empresas;
      })
      .catch(() => []);
  }
  return cache;
}


// Los mp4 propios no viven en el repo (GitHub Pages topa en 100 MB por archivo y 1 GB por sitio):
// el JSON guarda la ruta relativa y aquí se le antepone CONFIG.VIDEO_BASE. Los links externos
// (YouTube, iframes) y las rutas sin mp4 pasan tal cual; con VIDEO_BASE vacío, salen del propio sitio.
function enVideos(ruta) {
  if (!ruta || !CONFIG.VIDEO_BASE || /^[a-z]+:\/\//i.test(ruta) || !/\.(mp4|webm|mov)(\?|#|$)/i.test(ruta)) return ruta;
  return new URL(ruta, CONFIG.VIDEO_BASE).href;
}
