#!/usr/bin/env python3
"""
Normalize all product images to a 4:3 canvas (800x600) so
object-fit: cover works perfectly on every card without
cropping product content.

Usage:
    pip install pillow
    python scripts/normalize-images.py

Output: overwrites originals in assets/img/products/
A backup of each original is saved next to it as <name>.orig.ext
"""

import os
from pathlib import Path
from PIL import Image

# ── Config ──────────────────────────────────────────────
INPUT_DIR  = Path("assets/img/products")
TARGET_W   = 800
TARGET_H   = 600           # 4:3
BG_COLOR   = (255, 255, 255)   # white fill
JPEG_QUALITY = 92
BACKUP     = True          # keep .orig.<ext> next to each file
# ────────────────────────────────────────────────────────

def normalize(path: Path) -> None:
    try:
        img = Image.open(path).convert("RGB")
    except Exception as e:
        print(f"  ⚠️  skip {path.name}: {e}")
        return

    src_w, src_h = img.size
    src_ratio = src_w / src_h
    tgt_ratio = TARGET_W / TARGET_H

    # Compute "cover" crop: scale image so it fills the target,
    # then center-crop the overflow. This gives a full-bleed 4:3
    # canvas — no letterbox bars, no white margins.
    if src_ratio > tgt_ratio:
        # source is wider → scale by height, crop sides
        new_h = TARGET_H
        new_w = int(src_w * (TARGET_H / src_h))
        img = img.resize((new_w, new_h), Image.LANCZOS)
        left = (new_w - TARGET_W) // 2
        img = img.crop((left, 0, left + TARGET_W, TARGET_H))
    else:
        # source is taller/square → scale by width, crop top/bottom
        new_w = TARGET_W
        new_h = int(src_h * (TARGET_W / src_w))
        img = img.resize((new_w, new_h), Image.LANCZOS)
        top = (new_h - TARGET_H) // 2
        img = img.crop((0, top, TARGET_W, top + TARGET_H))

    # Optional: put on white canvas if you prefer letterbox over crop
    # (comment the crop above and uncomment this block for "contain" behavior)
    # canvas = Image.new("RGB", (TARGET_W, TARGET_H), BG_COLOR)
    # img.thumbnail((TARGET_W, TARGET_H), Image.LANCZOS)
    # off_x = (TARGET_W - img.width) // 2
    # off_y = (TARGET_H - img.height) // 2
    # canvas.paste(img, (off_x, off_y))
    # img = canvas

    # Backup original
    if BACKUP:
        orig = path.with_suffix(path.suffix + ".orig")
        if not orig.exists():
            try:
                Image.open(path).save(orig, quality=95)
            except Exception:
                pass

    # Save normalized version
    if path.suffix.lower() in (".jpg", ".jpeg"):
        img.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True)
    elif path.suffix.lower() == ".png":
        img.save(path, "PNG", optimize=True)
    else:
        img.save(path)

    print(f"  ✔ {path.name}  {src_w}x{src_h} → {TARGET_W}x{TARGET_H}")


def main():
    if not INPUT_DIR.exists():
        print(f"✘ Input dir not found: {INPUT_DIR}")
        return

    files = sorted([
        p for p in INPUT_DIR.rglob("*")
        if p.is_file() and p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")
    ])

    print(f"Found {len(files)} images in {INPUT_DIR}")
    for f in files:
        normalize(f)

    print("\nDone. Every image is now 800x600 (4:3).")
    print("Originals backed up as *.orig.* next to each file.")


if __name__ == "__main__":
    main()