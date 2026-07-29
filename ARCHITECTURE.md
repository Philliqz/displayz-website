# Arquitectura — notas honestas

Este documento explica decisiones de arquitectura que no son obvias con solo mirar el
código, y en particular qué tan lejos llega la versión actual (sin backend) antes de
necesitar uno real.

## El "enchufe" a un backend futuro

Todo el sitio lee datos de empresas a través de **un único archivo**:
`assets/js/modules/data-store.js`. Ningún otro módulo (`portfolio.js`,
`portfolio-preview.js`, `router.js`) hace `fetch()` directo de `database/empresas.json` —
todos llaman a `fetchCompanies()` / `getCompanyBySlug()`.

Esto es deliberado: el día que exista un backend real (Supabase, Firebase, una API REST,
PostgreSQL/MySQL/SQLite detrás de Node/PHP/Python), el cambio se hace **en un solo
archivo**. `data-store.js` pasa de "hacer fetch de un JSON estático y cachearlo en
memoria" a "consultar ese backend" — las firmas de las funciones (`fetchCompanies()`
devuelve una Promise de un array de empresas, `getCompanyBySlug(slug)` devuelve una
Promise de una empresa o `null`) se mantienen iguales, así que nada más en el sitio
necesita cambiar.

## Por qué esto NO escala a 100,000 empresas tal cual está

Hay que ser honestos sobre esto: `database/empresas.json` es un archivo que **cada
visitante descarga completo** en el navegador. Con 15 empresas pesa unos pocos KB — no
es un problema. Funciona bien hasta unos cientos de empresas. Pero no es una base de
datos: no tiene paginación, no tiene búsqueda del lado del servidor, no tiene índices.
A la escala de decenas de miles de empresas (con galerías de imágenes y videos incluidas
en cada objeto, como pide el esquema), el archivo pesaría decenas o cientos de MB —
inaceptable para cargar en cada visita, y contraproducente para el lazy-loading de
imágenes que ya implementa el sitio.

Esto **no es un descuido** — es una limitación conocida y aceptada de la fase actual
("sitio estático, sin backend todavía"). La solución no es optimizar el JSON estático
para que aguante más — es cambiar `data-store.js` para que hable con un backend real
que sí pueda paginar/filtrar del lado del servidor. Ese día, `router.js` en particular
se vuelve más eficiente de lo que es hoy: en vez de descargar la lista completa de
empresas para luego buscar una por slug (lo que hace hoy, porque no hay otra forma con
un JSON estático), pediría directamente esa una empresa al backend.

## Por qué `empresa.html?slug=X` y no `/empresa/X`

GitHub Pages no permite reescritura de rutas del lado del servidor (no hay equivalente a
un `netlify.toml` o `vercel.json`). La única forma de tener URLs "bonitas" como
`/hikaru` sin un servidor propio es un truco con `404.html` que redirige por JavaScript
del lado del cliente — pero eso hace que el navegador reciba brevemente un status 404
real antes del redirect, lo cual Google desaconseja para URLs que se quieren indexar
como principales. Por eso el sitio usa `empresa.html?slug=X`: funciona sin ninguna
configuración especial en GitHub Pages, y es la URL que queda como canónica. Si algún
día se agrega el truco de `404.html` para tener URLs bonitas como alias, ese archivo
canónico (`empresa.html?slug=X`) debe seguir siendo el único indexado — la URL bonita
sería solo una conveniencia visual, nunca la canónica.

## Por qué los videos guardan `{titulo, provider, url}` y no el embed

Guardar HTML de iframe directamente en los datos (como se hacía antes de este refactor)
significa que cada vez que un proveedor de video cambia su formato de embed, o que hay
que migrar de proveedor (como pasó en este mismo proyecto: un video tuvo que moverse de
YouTube a Mega.nz porque YouTube bloqueó su reproducción por un reclamo de derechos de
autor sobre la música), hay que editar los datos a mano. Guardando solo la URL normal
del video y dejando que `video-provider.js` genere el embed en el momento, cambiar de
proveedor es simplemente pegar un link distinto — el sistema detecta automáticamente si
es YouTube, Vimeo, Bunny Stream, o (si no reconoce el host) lo trata como un link de
embed genérico y lo usa tal cual, sin romperse.
