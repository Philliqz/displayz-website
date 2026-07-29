# Displayz.Studio — sitio web

Sitio estático (HTML + CSS + JS vanilla, sin build step, sin backend). Compatible con
GitHub Pages, Netlify, Vercel, Cloudflare Pages o cualquier hosting estático — solo sube
el contenido de esta carpeta tal cual.

Toda la información de empresas vive en **un solo archivo**, `database/empresas.json`.
No hay que crear carpetas ni JSON por empresa — ver "Cómo agregar una empresa nueva" abajo.

## Estructura

```
/
├── index.html            página principal
├── video.html             galería de Video
├── fotografia.html        galería de Fotografía
├── diseno.html            galería de Diseño
├── empresa.html           página de una empresa — empresa.html?slug=X
├── politica.html          política de privacidad
├── robots.txt, sitemap.xml, site.webmanifest, favicon.ico
├── database/
│   └── empresas.json      ÚNICA fuente de datos — todas las empresas, un array
├── assets/
│   ├── css/style.css      un solo archivo, organizado por secciones comentadas
│   ├── js/modules/        módulos ES nativos (sin bundler), uno por responsabilidad
│   │   ├── main.js          entry point — importa e inicializa todo lo demás
│   │   ├── data-store.js    única puerta de entrada a empresas.json (ver Escalabilidad)
│   │   ├── video-provider.js  detecta YouTube/Vimeo/Bunny desde una URL y arma el embed
│   │   ├── router.js        empresa.html?slug=X
│   │   ├── portfolio.js     galerías/carrusel/lightbox/video-modal/likes
│   │   ├── forms.js + forms/adapter-*.js   formularios, ver sección abajo
│   │   └── nav.js, animations.js, hero-menu.js, modal.js, lightbox.js,
│   │       video-modal.js, portfolio-preview.js, config.js
│   ├── images/            logo, isotipo, íconos, imágenes propias del sitio
│   └── fonts/
├── portfolio/<slug-empresa>/   SOLO imágenes de cada empresa (sin JSON — ver arriba)
├── scripts/
│   └── migrate_to_empresas.py   herramienta de desarrollo, no se despliega (ver abajo)
└── uploads/               archivos entrantes sin procesar (no se referencian en el sitio)
```

## Cómo agregar una empresa nueva

1. Copia sus imágenes optimizadas (máx. 1600px de lado mayor, JPEG calidad ~0.76) a
   `portfolio/<slug-empresa>/`.
2. Agrega un objeto al array de `database/empresas.json`:

```json
{
  "id": "mi-marca", "slug": "mi-marca", "nombre": "Mi Marca",
  "descripcion": "Una frase corta sobre la marca.",
  "logo": "portfolio/mi-marca/logo.jpg",
  "categoria": "diseno", "categorias": ["diseno"],
  "video": false, "fotografia": false, "diseno": true,
  "galeria": [{ "archivo": "portfolio/mi-marca/pieza-1.jpg", "alt": "Mi Marca — pieza 1", "tipo": "diseno" }],
  "videos": [],
  "telefono": "", "correo": "", "direccion": "",
  "instagram": "https://instagram.com/mimarca",
  "facebook": "", "tiktok": "", "youtube": "", "linkedin": "", "sitioWeb": "", "horario": "",
  "estado": "activo"
}
```

Los flags `video`/`fotografia`/`diseno` deben coincidir con si hay contenido real en
`videos[]`/`galeria[]` (tipo `fotografia` o `diseno`) — son los que determinan en qué
página aparece la empresa. No hay que tocar ningún HTML/CSS/JS.

3. Corre `python3 scripts/migrate_to_empresas.py` — regenera `sitemap.xml` agregando
   `empresa.html?slug=mi-marca` automáticamente (el script es idempotente: seguro de
   correr aunque ya hayas editado `empresas.json` a mano, no pisa nada tuyo, solo
   reconstruye el sitemap desde los slugs que encuentre).

La empresa aparece automáticamente en Video/Fotografía/Diseño según corresponda, en el
rotador de miniaturas del home, y tiene su propia página en `empresa.html?slug=mi-marca`
— nada de esto requiere editar código.

## Videos

Nunca se guarda HTML de embed ni iframes en los datos — solo `{ "titulo", "provider", "url" }`
por video, dentro del array `videos[]` de la empresa:

```json
{ "titulo": "Reel de campaña", "provider": "youtube", "url": "https://youtu.be/XXXXXXXX" }
```

`assets/js/modules/video-provider.js` detecta el proveedor desde la URL (`youtu.be/`,
`youtube.com/watch?v=`, `vimeo.com/`, links de Bunny Stream) y arma el `src` del iframe
automáticamente. Si el proveedor no es ninguno de esos (por ejemplo Mega.nz, o cualquier
otro host que ya te dé un link de embed listo), usa `"provider": "iframe"` y pega la URL
de embed directamente en `url` — se pasa tal cual, sin transformar.

### Miniaturas de video — automáticas, no hace falta subir nada

`miniatura` es un campo **opcional**. Si no lo pones, el sitio la resuelve solo, en este orden:

1. **YouTube**: se genera sola por URL pública (`i.ytimg.com/vi/<id>/hqdefault.jpg`) — sin
   pedir nada a ninguna API, instantáneo.
2. **Vimeo**: se consulta su oEmbed público (`vimeo.com/api/oembed.json`) para obtener la
   miniatura real — pequeño delay async, pero también automático.
3. **Bunny Stream / Mega / cualquier otro (`provider: "iframe"`)**: no tienen forma pública
   de resolver una miniatura sin credenciales, así que se usa el **logo de la empresa**
   como respaldo — nunca queda una imagen rota.

Si en algún momento quieres una miniatura específica (un fotograma exacto en vez del que
elige YouTube automáticamente), agrega `"miniatura": "portfolio/mi-marca/video/mi-foto.jpg"`
al video y esa siempre gana sobre la automática.

Sube los videos como **"No listados"** en YouTube (no aparecen en búsquedas ni en tu
canal, pero sí se pueden embeber en cualquier sitio).

## Formulario de contacto

`assets/js/modules/config.js` tiene `CONFIG.FORM_PROVIDER` — por defecto `'mailto'`
(cero backend, abre el cliente de correo del visitante). Para conectar un backend real,
cambia esa única línea:

- `'webhook'` — envía POST en JSON a `CONFIG.FORM_ENDPOINT` (Google Apps Script, API
  REST, Zapier, Make, etc.)
- `'supabase-stub'` / `'sheets-stub'` — placeholders listos en `assets/js/modules/forms/`,
  completa el `submit()` de esos archivos cuando tengas esa integración lista

No hace falta tocar ningún HTML. Si el proveedor elegido falla, siempre cae de vuelta a
`mailto` — el formulario nunca se rompe para el visitante.

## Escalabilidad y backend futuro

`database/empresas.json` es perfecto para decenas o cientos de empresas. **No** escala
solo como archivo estático a decenas de miles — a esa escala pesaría demasiado para que
cada visitante lo descargue completo. El punto de conexión ya está preparado:
`assets/js/modules/data-store.js` es el único archivo que hace `fetch()` de los datos —
ningún otro módulo lo hace directamente. El día que haga falta un backend real
(Supabase/Firebase/SQL/REST/Node/PHP/Python), solo hay que reescribir ese archivo para
que consulte ese backend en vez del JSON estático; el resto del sitio no cambia. Más
detalle en `ARCHITECTURE.md`.

## Despliegue

- **GitHub Pages**: sube el repo y activa Pages sobre la rama principal, carpeta raíz.
- **Netlify / Vercel / Cloudflare Pages**: arrastra esta carpeta o conéctala por Git; no
  requiere build command.

El dominio ya está configurado como `https://displayz.studio/` en `canonical`, `og:url`,
`sitemap.xml` y el schema.org de cada página — si el dominio cambia, hay que actualizarlo
en esos lugares.
