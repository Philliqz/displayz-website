#!/usr/bin/env python3
"""Migración única: portfolio/manifest.json + portfolio/<slug>/data.json
   -> database/empresas.json (esquema centralizado) + sitemap.xml

Se corre a mano, una vez (o cada vez que se agregue una empresa, es
idempotente): python3 scripts/migrate_to_empresas.py

No se referencia desde ninguna página del sitio — es una herramienta de
desarrollo, no parte del código desplegado.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORTFOLIO = ROOT / "portfolio"
OUT = ROOT / "database" / "empresas.json"
SITEMAP = ROOT / "sitemap.xml"

SITE_URL = "https://displayz.studio"

PROVIDER_PATTERNS = [
    ("youtube", ["youtube.com/embed/", "youtube.com/watch", "youtu.be/", "youtube.com/shorts/"]),
    ("vimeo", ["vimeo.com/"]),
    ("bunny", ["mediadelivery.net"]),
]


def detect_provider(url: str) -> str:
    low = url.lower()
    for name, needles in PROVIDER_PATTERNS:
        if any(n in low for n in needles):
            return name
    return "iframe"  # passthrough genérico (Mega.nz y cualquier otro host embebible)


def build_company(slug: str, data: dict) -> dict:
    prefix = f"portfolio/{slug}/"
    media = data.get("media", {})

    galeria = []
    for tipo in ("fotografia", "diseno"):
        for item in media.get(tipo, []):
            galeria.append({
                "archivo": prefix + item["file"],
                "alt": item.get("alt", data.get("name", slug)),
                "tipo": tipo,
            })

    videos = []
    for item in media.get("video", []):
        url = item.get("embed", "")
        thumb = item.get("thumbnail", "")
        videos.append({
            "titulo": item.get("title", ""),
            "provider": detect_provider(url),
            "url": url,
            "miniatura": (prefix + thumb) if thumb else "",
        })

    has_video = len(videos) > 0
    has_foto = any(g["tipo"] == "fotografia" for g in galeria)
    has_diseno = any(g["tipo"] == "diseno" for g in galeria)

    categorias = [c for c, has in (
        ("video", has_video), ("fotografia", has_foto), ("diseno", has_diseno)
    ) if has]
    categoria = categorias[0] if categorias else ""

    return {
        "id": slug,
        "slug": slug,
        "nombre": data.get("name", slug),
        "descripcion": data.get("description", ""),
        "logo": prefix + (data.get("logo") or data.get("thumbnail") or ""),
        "categoria": categoria,
        "categorias": categorias,
        "video": has_video,
        "fotografia": has_foto,
        "diseno": has_diseno,
        "galeria": galeria,
        "videos": videos,
        "telefono": "",
        "correo": "",
        "direccion": "",
        "instagram": data.get("instagram", ""),
        "facebook": "",
        "tiktok": "",
        "youtube": "",
        "linkedin": "",
        "sitioWeb": "",
        "horario": "",
        "estado": "activo",
    }


def write_sitemap(companies):
    static_urls = [
        f"{SITE_URL}/",
        f"{SITE_URL}/video.html",
        f"{SITE_URL}/fotografia.html",
        f"{SITE_URL}/diseno.html",
        f"{SITE_URL}/politica.html",
    ]
    company_urls = [
        f"{SITE_URL}/empresa.html?slug={c['slug']}"
        for c in companies if c["estado"] == "activo"
    ]
    urls = static_urls + company_urls
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    lines += [f"  <url><loc>{u}</loc></url>" for u in urls]
    lines.append("</urlset>")
    SITEMAP.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    manifest = json.loads((PORTFOLIO / "manifest.json").read_text(encoding="utf-8"))
    slugs = manifest.get("companies", [])

    companies = []
    errors = []
    for slug in slugs:
        data_path = PORTFOLIO / slug / "data.json"
        if not data_path.exists():
            errors.append(f"MISSING: {data_path}")
            continue
        data = json.loads(data_path.read_text(encoding="utf-8"))
        companies.append(build_company(slug, data))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(companies, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_sitemap(companies)

    print(f"Escritas {len(companies)} empresas en {OUT}")
    print(f"sitemap.xml regenerado con {len(companies)} rutas de empresa")
    if errors:
        print("AVISOS:")
        for e in errors:
            print(" -", e)

    total_galeria = sum(len(c["galeria"]) for c in companies)
    total_videos = sum(len(c["videos"]) for c in companies)
    print(f"Total items de galeria: {total_galeria}, total items de video: {total_videos}")


if __name__ == "__main__":
    main()
