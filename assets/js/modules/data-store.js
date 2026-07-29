// Única puerta de entrada a los datos de empresas. Ningún otro módulo debe hacer
// fetch() de database/empresas.json directamente — este es el "enchufe" que el día
// de mañana se cambia por llamadas a un backend real (Supabase/REST/etc.) sin tener
// que tocar portfolio.js, portfolio-preview.js ni router.js.
import { CONFIG } from './config.js';

let cache = null;

export function fetchCompanies() {
  if (!cache) {
    cache = fetch(CONFIG.DATA_URL)
      .then((res) => res.json())
      .catch(() => []);
  }
  return cache;
}

export function getCompanyBySlug(slug) {
  return fetchCompanies().then((companies) => companies.find((c) => c.slug === slug) || null);
}
