"""Rebuild web-only derivatives; original catalogue and print assets are never edited.
Run from the project root: .venv/bin/python scripts/generate-web-images.py
Pillow's version is pinned by apps/api/requirements.txt.
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'apps/web/assets'
OUTPUT = ASSETS / 'responsive'
WIDTHS = (320, 640, 960, 1440)
NAMES = ('heritage', 'blueprint', 'typographie', 'hoodie', 'sweat')


def build():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name in NAMES:
        with Image.open(ASSETS / (name+'.png')) as original:
            original = ImageOps.exif_transpose(original).convert('RGBA')
            variants = []
            for width in WIDTHS:
                if width > original.width: continue
                height = round(original.height * width / original.width)
                resized = original.resize((width,height), Image.Resampling.LANCZOS)
                filename = f'{name}-{width}.webp'
                resized.save(OUTPUT/filename, 'WEBP', quality=84, method=6, exact=True)
                variants.append({'src':'/assets/responsive/'+filename, 'width':width, 'height':height})
            manifest['/assets/'+name+'.png'] = variants
    data = json.dumps(manifest, ensure_ascii=False, separators=(',',':'))
    (OUTPUT/'manifest.json').write_text(data+'\n')
    (OUTPUT/'images.js').write_text('export const images = '+data+';\n')
    print(f'{len(NAMES)} photos, {sum(len(v) for v in manifest.values())} variantes WebP générées.')


if __name__ == '__main__': build()
