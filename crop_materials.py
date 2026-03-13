#!/usr/bin/env python3
"""
Crop specific material images for Judestone website
Downloads from source URLs (in crop_source_urls.json) and saves with new-name filenames.
Source URLs are gitignored - copy crop_source_urls.json.example to crop_source_urls.json.
"""

import json
import os
import re
import sys
import requests
from io import BytesIO
from PIL import Image

# Output directory for cropped images
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "images", "materials")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Load source URLs from config (gitignored - no supplier URLs in repo)
CONFIG_PATH = os.path.join(SCRIPT_DIR, "crop_source_urls.json")


def load_materials_config():
    """Load MATERIALS_TO_CROP from crop_source_urls.json. Format: {name: [url, w, h, ox, oy]}"""
    if not os.path.exists(CONFIG_PATH):
        print(f"ERROR: {CONFIG_PATH} not found.")
        print("Copy crop_source_urls.json.example to crop_source_urls.json and add source URLs.")
        sys.exit(1)
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
    # Convert list format to tuple: [url, w, h, ox, oy] -> (url, w, h, ox, oy)
    return {k: tuple(v) for k, v in raw.items() if not k.startswith("_")}


MATERIALS_TO_CROP = load_materials_config()


def slug_from_name(name):
    """Convert material name to safe filename slug: lowercase, spaces to hyphens"""
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug or "material"


def crop_image_top_left(img, target_width, target_height, offset_x=0, offset_y=0):
    """
    Crop image from top-left corner with optional offset
    """
    width, height = img.size

    # Calculate crop coordinates
    left = offset_x
    top = offset_y
    right = min(left + target_width, width)
    bottom = min(top + target_height, height)

    # Crop from specified position
    img = img.crop((left, top, right, bottom))

    return img


def download_and_crop_image(name, url, width, height, offset_x, offset_y):
    """Download image from URL and crop it, save with new-name filename"""
    try:
        print(f"Downloading {name}...")

        # Create a session that ignores proxy settings
        session = requests.Session()
        session.trust_env = False

        proxies = {'http': None, 'https': None}
        response = session.get(url, timeout=30, headers={'User-Agent': 'Mozilla/5.0'}, proxies=proxies)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content))

        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')

        print(f"  Original size: {img.size}")
        print(f"  Cropping to {width}x{height} with offset ({offset_x}, {offset_y})")

        # Crop the image
        cropped = crop_image_top_left(img, width, height, offset_x, offset_y)

        print(f"  Cropped size: {cropped.size}")

        # Save with new-name filename (slug from material name)
        safe_name = slug_from_name(name)
        output_path = os.path.join(OUTPUT_DIR, f"{safe_name}.jpg")

        cropped.save(output_path, "JPEG", quality=95)
        print(f"  Saved to: {output_path}")

        return output_path

    except Exception as e:
        print(f"  ERROR: {e}")
        return None


def main():
    print("=" * 50)
    print("Judestone Material Image Cropper")
    print("=" * 50)
    print()

    results = []

    for name, (url, width, height, offset_x, offset_y) in MATERIALS_TO_CROP.items():
        result = download_and_crop_image(name, url, width, height, offset_x, offset_y)
        results.append((name, result))
        print()

    print("=" * 50)
    print("Summary:")
    print("=" * 50)
    for name, path in results:
        status = "SUCCESS" if path else "FAILED"
        print(f"  {name}: {status}")

    print()
    print(f"Cropped images saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
