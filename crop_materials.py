#!/usr/bin/env python3
"""
Crop specific material images for Judestone website
Based on cropping settings from generate_catalog_designer.py
"""

import os
import requests
from io import BytesIO
from PIL import Image

# Output directory for cropped images
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images", "materials")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Materials to crop with their settings
# Format: {name: (image_url, width, height, offset_x, offset_y)}
MATERIALS_TO_CROP = {
    "Seashell": (
        "https://alphaquartz.vn/uploads/product/classic/3151-seashell1.jpg",
        414, 414, 0, 0
    ),
    "Golden Carrara": (
        "https://alphaquartz.vn/uploads/product/natural/golden-carrara-6308.jpg",
        414, 414, 0, 0
    ),
    "Carrara Blanco": (
        "https://alphaquartz.vn/uploads/product/natural/nq6003-5.jpg",
        414, 414, 0, 0
    ),
    "Black Carrara": (
        "https://alphaquartz.vn/uploads/product/natural/nq6005-close.jpg",
        414, 414, 0, 0
    ),
    "Calacatta Luna": (
        "https://alphaquartz.vn/uploads/product/calacatta/calacatta-new-logo/90051.jpg",
        470, 470, 20, 20
    ),
    "Calacatta Nova": (
        "https://alphaquartz.vn/uploads/product/calacatta/calacatta-new-logo/9700.jpg",
        470, 470, 20, 20
    ),
}

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
    """Download image from URL and crop it"""
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
        
        # Save the cropped image
        # Create a safe filename
        safe_name = name.lower().replace(" ", "-")
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
