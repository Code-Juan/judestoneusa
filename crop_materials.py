#!/usr/bin/env python3
"""
Crop specific material images for Judestone website
Downloads from source URLs and saves with new-name filenames (hides original names from view)
"""

import os
import re
import requests
from io import BytesIO
from PIL import Image

# Output directory for cropped images
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images", "materials")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# All 16 materials: (source_url, width, height, offset_x, offset_y)
# Source URLs used only for fetching; output filename derived from new material name
MATERIALS_TO_CROP = {
    "Arctic Tundra": (
        "https://[redacted].com/wp-content/uploads/2025/01/2040Ocean-White.jpg",
        600, 600, 0, 0
    ),
    "Glacier Frost": (
        "https://[redacted].com/wp-content/uploads/2025/01/2050Iced-White.jpg",
        600, 600, 0, 0
    ),
    "Sterling Ash": (
        "https://[redacted].com/wp-content/uploads/2025/01/2147Silver-Grey-600x600.jpg",
        600, 600, 0, 0
    ),
    "Titanium Ridge": (
        "https://[redacted].com/wp-content/uploads/2025/01/2143Steel-Grey.jpg",
        600, 600, 0, 0
    ),
    "Desert Dune": (
        "https://[redacted].com/wp-content/uploads/2025/01/2332Pebble-Sand.jpg",
        600, 600, 0, 0
    ),
    "Coastal Mist": (
        "https://[redacted].com/uploads/product/classic/3151-seashell1.jpg",
        414, 414, 0, 0
    ),
    "Imperial Pearl": (
        "https://[redacted].com/wp-content/uploads/2025/01/2036Platinum-White.jpg",
        600, 600, 0, 0
    ),
    "Venato Classic": (
        "https://cdn.[redacted].com/images/quartz-countertops/products/thumbnails/carrara-delphi-quartz.jpg",
        600, 600, 0, 0
    ),
    "Aurora Venato": (
        "https://[redacted].com/uploads/product/natural/golden-carrara-6308.jpg",
        414, 414, 0, 0
    ),
    "Bianco Crest": (
        "https://[redacted].com/uploads/product/natural/nq6003-5.jpg",
        414, 414, 0, 0
    ),
    "Summit Fog": (
        "https://[redacted].com/wp-content/uploads/2025/01/Montana-Grey-VQ8121-4.jpg",
        414, 414, 0, 0
    ),
    "Alpine Pure": (
        "https://[redacted].com/wp-content/uploads/2025/01/1003-2.jpg",
        414, 414, 0, 0
    ),
    "Nocturne Stone": (
        "https://[redacted].com/wp-content/uploads/2025/01/8101-Elegant-Grey.jpg",
        414, 414, 0, 0
    ),
    "Obsidian Venato": (
        "https://[redacted].com/uploads/product/natural/nq6005-close.jpg",
        414, 414, 0, 0
    ),
    "Luna Calacatta": (
        "https://[redacted].com/uploads/product/calacatta/calacatta-new-logo/90051.jpg",
        470, 470, 20, 20
    ),
    "Calacatta Royale": (
        "https://[redacted].com/uploads/product/calacatta/calacatta-new-logo/9700.jpg",
        470, 470, 20, 20
    ),
}


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
