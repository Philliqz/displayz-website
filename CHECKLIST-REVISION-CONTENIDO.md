# Checklist de revisión — importación de contenido MEGA (2026-07-29)

Generado automáticamente al importar `/Users/philliqz/Descargas MEGA/DISEÑOS` al
portafolio. **Nada de esto está publicado** — todo quedó en un commit local, sin
`git push`. Revisar y decidir antes de subir.

## 1. Empresas nuevas sin agregar (falta tu contexto)

- **JETOUR** — 3 imágenes en la carpeta MEGA. No la agregué como empresa nueva
  porque no sé el rubro exacto (parece ser un concesionario/marca de autos chinos,
  posiblemente relacionado al mismo grupo de Ola Cars) ni si querés publicarla.
- **OLA MOTORS** — 5 imágenes en la carpeta MEGA (venta de motos, ej. "Tank 150").
  Mismo caso: no la agregué, parece parte del mismo grupo Ola (Cars/Cell/Motors)
  pero no asumí la relación.

Decime el rubro y si las agrego, y las proceso en la próxima sesión.

## 2. Empresas que pasaron de "pendiente" (sin contenido) a "pendiente" (con contenido listo)

Estas 7 ya tienen su galería completa importada, pero **las dejé ocultas a propósito**
(como pediste) — no van a aparecer en el sitio hasta que decidas activarlas:

- Alpha Gun (16 imágenes)
- Atelier Dental (18 imágenes)
- Autocare (14 imágenes)
- Mr Tallarín (22 imágenes)
- Mystery Armory (21 imágenes)
- Ola Cell (10 imágenes)
- Senderos del María (12 imágenes)

**Pendiente para vos**: el "logo" de cada una se asignó automáticamente a la primera
imagen en orden alfabético (no es un logo real, es solo para que el campo no quede
vacío). Si querés activarlas, revisá/reemplazá el logo de cada una por el logo real
de marca antes de activarlas — decime cuando quieras y te ayudo con el proceso de
activar+revisar una por una.

**Para activarlas** cuando decidas: hay que poner `"diseno": true` (y
`"categoria"`/`"categorias": ["diseno"]`) en `database/empresas.json` para cada una
— hoy están en `false`/`[]` a propósito para que no se muestren, aunque ya tengan
la galería cargada.

## 3. Empresas ya activas — contenido nuevo agregado (revisar posibles casi-duplicados)

Comparé cada imagen nueva contra lo que ya existía por nombre; las que coincidían al
100% con algo ya publicado **no se importaron** (evité duplicar). Las que se
parecían pero no eran idénticas **sí se importaron**, pero quedan aquí para que las
revises — puede que sean variantes reales (ej. "pago diario" vs "pago semanal") o
puede que sí sean el mismo diseño con otro nombre:

- **Moocha**: `EXISTEN DOS TIPO DE PERSONAS` (¿vs. `dos-tipos-de-personas`?), `FUIT
  TEA SERIES` (typo de "fruit", ¿vs. `fruit-tea-series`?), `SOBRES ROJIS` (typo de
  "rojos", ¿vs. `sobres-rojos`?)
- **MOVIT**: `BLACK WEEK2`/`BLACK WEEK3` (¿variantes de `black-week-a`?), `LIGTH2 -
  INOKIM` (¿vs. `light2-inokim`?)
- **Ola Cars**: 11 casos, mezcla de variantes reales (pago diario vs. semanal) y
  posibles duplicados con nombre distinto — vale la pena una revisión visual rápida
  de esta carpeta en particular, es la que más contenido nuevo recibió (22 piezas).
- **Tech Mobile**: modelos de teléfono distintos (Honor X6B/X7C/X8A/X8B, Redmi
  A3X/Note 13 Pro) — probablemente todos genuinamente distintos, solo comparten
  la marca del teléfono.
- **Tiger Sugar**: variantes de sabor (oolong/taro vs. black sugar), tarjeta de
  lealtad (front vs. back — probablemente son 2 caras de la misma tarjeta, no
  duplicado), y algunas otras piezas de temporada.

Ninguna de estas se eliminó — si al revisar ves que alguna sí es un duplicado exacto,
decime cuál y la saco.

## 4. Resumen de lo agregado a empresas activas

| Empresa | Imágenes nuevas agregadas |
|---|---|
| Ola Cars | 22 |
| Tiger Sugar Panamá | 20 |
| Zero One | 10 |
| Tech Mobile | 11 (empresa aún "pendiente", ver nota abajo) |
| Movit | 3 |
| Moocha | 4 |
| Hikaru | 1 |
| Bremer's | 0 (las 3 fotos del MEGA eran las mismas 3 ya publicadas) |
| Villa de las Palmas | 0 (las 4 fotos del MEGA eran las mismas 4 ya publicadas) |

**Nota sobre Tech Mobile**: en las instrucciones originales la traté como "ya
activa", pero en realidad en `empresas.json` ya estaba como `"pendiente"` sin
contenido (no había logo ni galería). Le importé las 11 imágenes nuevas pero la dejé
igual que las demás "pendiente" — oculta hasta que la actives. Avisame si en
realidad querías que esta sí quedara visible de una vez.

## 5. Verificación técnica hecha

- JSON válido, todos los archivos referenciados existen en disco.
- Sitio local probado sin errores de consola (`video.html`, `fotografia.html`,
  `diseno.html`).
- Confirmé que ninguna de las 8 empresas "pendiente" aparece en el HTML renderizado.
- Cambios commiteados localmente (ver `git log`), **sin `git push`** — nada está en
  producción todavía.
