# Displayz.Studio — sitio web

Sitio estático (HTML + CSS + JS, sin backend). Compatible con GitHub Pages, Netlify, Vercel, Cloudflare Pages o cualquier hosting estático — solo sube el contenido de esta carpeta tal cual.

## Estructura

```
/
├── index.html          página principal
├── video.html           galería de Video
├── fotografia.html      galería de Fotografía
├── diseno.html          galería de Diseño
├── politica.html        política de privacidad
├── robots.txt
├── sitemap.xml
├── assets/               TODO lo del diseño del sitio (nunca contenido de clientes)
│   ├── css/style.css
│   ├── js/script.js
│   ├── images/           logo, isotipo, imágenes propias del sitio
│   ├── icons/
│   └── fonts/
├── portfolio/            TODO el contenido de clientes, una carpeta por empresa
│   ├── manifest.json     lista de slugs de empresas visibles en el sitio
│   └── <slug-empresa>/
│       ├── data.json
│       ├── thumbnail.jpg
│       ├── video/
│       ├── fotografia/
│       └── diseno/
├── uploads/              archivos entrantes sin procesar (no se referencian en el sitio)
└── screenshots/          capturas internas de referencia (no se referencian en el sitio)
```

## Cómo agregar una empresa nueva

1. Crea una carpeta en `portfolio/` con el nombre en minúsculas y guiones, ej. `portfolio/mi-marca/`.
2. Copia dentro sus imágenes/miniaturas en subcarpetas `video/`, `fotografia/`, `diseno/` según el contenido que tengas.
3. Crea `portfolio/mi-marca/data.json` con esta forma:

```json
{
  "name": "Mi Marca",
  "slug": "mi-marca",
  "thumbnail": "thumbnail.jpg",
  "logo": "thumbnail.jpg",
  "instagram": "https://instagram.com/mimarca",
  "description": "Una frase corta sobre la marca.",
  "sections": { "video": true, "fotografia": false, "diseno": true },
  "media": {
    "video": [{ "thumbnail": "video/miniatura.jpg", "embed": "https://www.youtube.com/embed/XXXXX", "title": "Reel 1" }],
    "fotografia": [],
    "diseno": [{ "file": "diseno/pieza-1.jpg", "alt": "Mi Marca — pieza 1" }]
  }
}
```

4. Agrega el slug `"mi-marca"` a la lista en `portfolio/manifest.json`.

No hay que tocar ningún HTML/CSS/JS: `assets/js/script.js` lee el manifiesto y cada `data.json`, y solo muestra la marca en las secciones (Video / Fotografía / Diseño) donde `sections` esté en `true`.

## Videos

Los videos NO se guardan en este proyecto. Usa `embed` con una URL de YouTube, Vimeo o similar (iframe); se carga solo cuando el visitante hace clic en la miniatura (lazy-loading).

## Formulario de contacto

Por defecto los formularios envían por `mailto:` (cero backend). Para conectarlos a un servicio real (Google Apps Script, API REST, Firebase, Supabase), edita `CONFIG.FORM_ENDPOINT` en `assets/js/script.js` — no hace falta tocar el HTML.

## Despliegue

- **GitHub Pages**: sube el repo y activa Pages sobre la rama principal, carpeta raíz.
- **Netlify / Vercel / Cloudflare Pages**: arrastra esta carpeta o conéctala por Git; no requiere build command.

Antes de publicar, reemplaza `https://displayz.studio/` en las etiquetas `canonical`/`og:url`/`sitemap.xml` por el dominio real.
