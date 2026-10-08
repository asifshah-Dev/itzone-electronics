import os
from pathlib import Path

import cv2
import torch
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def collect_image_paths(input_dir: Path):
    return sorted(
        path
        for path in input_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def main():
    root_dir = Path(__file__).resolve().parent
    input_dir = root_dir / "assets" / "img" / "products"
    output_dir = root_dir / "assets" / "img" / "products-upscaled"
    model_path = root_dir / "RealESRGAN_x4plus.pth"

    if not input_dir.exists():
        print(f"Input directory not found: '{input_dir}'")
        return

    if not model_path.exists():
        print(f"Model file not found: '{model_path}'")
        return

    print("Initializing Real-ESRGAN model...")
    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
    use_half = torch.cuda.is_available()
    if not use_half:
        print("CUDA not available — running Real-ESRGAN in FP32 mode.")

    upsampler = RealESRGANer(
        scale=4,
        model_path=str(model_path),
        model=model,
        tile=0,
        tile_pad=10,
        pre_pad=0,
        half=use_half,
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    image_paths = collect_image_paths(input_dir)
    if not image_paths:
        print(f"No images found in '{input_dir}'! Please verify the folder contents.")
        return

    print(f"Found {len(image_paths)} images to upscale. Processing only the first image for now...")
    image_paths = image_paths[:1]

    for image_path in image_paths:
        filename = image_path.name
        output_path = output_dir / filename
        if output_path.exists():
            print(f"SKIPPED: {filename} already exists in the output folder")
            continue

        print(f"Processing: {filename} ... ", end="", flush=True)
        img = cv2.imread(str(image_path))
        if img is None:
            print("SKIPPED (Could not read image file)")
            continue

        try:
            output, _ = upsampler.enhance(img, outscale=4)
            saved = cv2.imwrite(str(output_path), output)
            if not saved:
                raise IOError(f"cv2.imwrite failed for '{output_path}'")
            print("DONE!")
        except Exception as exc:
            print(f"ERROR: {exc}")


if __name__ == "__main__":
    main()
