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

## 2. Empresas "pendiente" — estado actualizado (2026-07-30)

**Activadas** (confirmaste: "Publica atelier dental, autocare, mr tallarin, ola cell
y senderos del maria. Deja los logos para despues") — ya están con `diseno: true`,
`categoria/categorias: ["diseno"]`, `estado: "activo"` en `database/empresas.json`:

- Atelier Dental (18 imágenes)
- Autocare (14 imágenes)
- Mr Tallarín (22 imágenes)
- Ola Cell (10 imágenes)
- Senderos del María (12 imágenes)

**Pendiente para vos** (deferido a propósito): el "logo" de estas 5 sigue siendo la
primera imagen en orden alfabético de cada galería (no es un logo real). Avisame
cuando quieras reemplazarlos por el logo real de marca.

**Se quedan ocultas — decisión final (2026-07-30)**: preguntaste si publicarlas
podía generar baneo/restricción de la página. Investigué: GitHub Pages (donde vive
el sitio) no tiene ninguna cláusula específica sobre armas en su política de uso
aceptable — el riesgo real está más bien en pauta paga (Google/Meta Ads prohíben
anunciar armas y revisan también la página de destino), algo que hoy no aplica
porque Displayz.Studio no corre pauta propia todavía. Aun así, preferiste dejarlas
ocultas por precaución — se quedan así indefinidamente, no como algo pendiente de
decidir:

- Alpha Gun (16 imágenes, galería lista, oculta)
- Mystery Armory (21 imágenes, galería lista, oculta)

## 3. Posibles casi-duplicados — RESUELTO (2026-07-30): eliminados

Instrucción: "Si son posibles duplicados no los subas". Se eliminaron del
`galeria` de `database/empresas.json` **y** del disco (31 archivos en total):

- **Moocha** (4): `existen-dos-tipo-de-personas.jpg`, `fuit-tea-series.jpg`,
  `sobres-rojis.jpg`, y además `mesa-de-trabajo-3.jpg` (duplicado exacto de nombre
  que se coló, detectado al revisar — no estaba en la lista original de "posibles",
  era un duplicado literal).
- **MOVIT** (3): `black-week2.jpg`, `black-week3.jpg`, `ligth2-inokim.jpg`.
- **Ola Cars** (11): `paga-semanal-kia-carens.jpg`, `promo-200-semanales.jpg`,
  `s07-oferta-flash.jpg`, `sabias-que-kia-soluto.jpg`, `x70-pago-diario.jpg`,
  `conduce-mientras-pagas-kia-soluto.jpg`, `conduce-tu-auto-kia-soluto.jpg`,
  `el-dueno-de-tu-s07.jpg`, `s07-alquila-y-conduce-ht.jpg`,
  `s07-quieres-ser-tu-jefe-ht2.jpg`, `s07-quieres-ser-tu-propio-jefe.jpg`.
- **Tech Mobile** (6, empresa aún pendiente/oculta): `honor-x6b.jpg`,
  `honor-x7c.jpg`, `honor-x8a.jpg`, `honor-x8b.jpg`, `redmi-a3x.jpg`,
  `redmi-note-13-pro.jpg`.
- **Tiger Sugar Panamá** (7): `tiger-choco-chips-1040323.jpg`,
  `tiger-ht-oolong-tea.jpg`, `tiger-ht-taro-milk.jpg`, `feliz-ano-nuevo.jpg`,
  `loyalty-card-front.jpg`, `strawberry-mochi-art.jpg`, `yogurt-series-1.jpg`.

Verificado: JSON válido, sin referencias rotas a archivos borrados.

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
