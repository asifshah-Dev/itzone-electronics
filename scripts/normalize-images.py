#!/usr/bin/env python3
"""
Normalize product images to a 4:3 canvas (800x600) WITHOUT cropping.
Uses letterbox padding — the original image is never cut, only
centered on a white 4:3 background.

Usage:
    pip install pillow
    python scripts/normalize-images.py
"""

import os
from pathlib import Path
from PIL import Image

# ── Config ──────────────────────────────────────────────
INPUT_DIR    = Path("assets/img/products")
TARGET_W     = 800
TARGET_H     = 600            # 4:3
BG_COLOR     = (255, 255, 255)  # white padding
JPEG_QUALITY = 92
# ────────────────────────────────────────────────────────

def normalize(path: Path) -> None:
    try:
        img = Image.open(path).convert("RGB")
    except Exception as e:
        print(f"  ⚠️  skip {path.name}: {e}")
        return

    src_w, src_h = img.size

    # Scale DOWN (never up) so the whole image fits inside the canvas
    scale = min(TARGET_W / src_w, TARGET_H / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))

    if scale < 1.0:
        img = img.resize((new_w, new_h), Image.LANCZOS)

    # Create white canvas and center the image inside it
    canvas = Image.new("RGB", (TARGET_W, TARGET_H), BG_COLOR)
    off_x = (TARGET_W - new_w) // 2
    off_y = (TARGET_H - new_h) // 2
    canvas.paste(img, (off_x, off_y))

    # Save in place
    ext = path.suffix.lower()
    if ext in (".jpg", ".jpeg"):
        canvas.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True)
    elif ext == ".png":
        canvas.save(path, "PNG", optimize=True)
    elif ext == ".webp":
        canvas.save(path, "WEBP", quality=JPEG_QUALITY)
    else:
        canvas.save(path)

    print(f"  ✔ {path.name}  {src_w}x{src_h} → {TARGET_W}x{TARGET_H} (letterboxed, no crop)")


def main():
    if not INPUT_DIR.exists():
        print(f"✘ Input dir not found: {INPUT_DIR}")
        return

    files = sorted([
        p for p in INPUT_DIR.rglob("*")
        if p.is_file()
        and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")
        and ".orig." not in p.name           # skip leftover backups
    ])

    print(f"Found {len(files)} images in {INPUT_DIR}")
    for f in files:
        normalize(f)

    print("\nDone. Every image is now 800x600 (4:3), letterboxed, no crop.")


if __name__ == "__main__":
    main()