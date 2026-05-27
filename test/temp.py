import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import random

# Create output directory
output_dir = "backup"
os.makedirs(output_dir, exist_ok=True)

def create_grayscale_digit_4(filename, font_size=50, rotation=0, 
                             brightness=100, noise_level=0, style='regular'):
    """
    Create a 6x6 pixel grayscale image of digit 4 by rendering large and scaling down
    
    Parameters:
    - filename: output file name
    - font_size: size of the font for rendering (will be scaled down)
    - rotation: rotation angle in degrees
    - brightness: base brightness (0-255)
    - noise_level: amount of random noise to add (0-50)
    - style: 'regular', 'italic', 'bold'
    """
    
    # Create a larger image first (for better rendering), then scale down
    temp_size = 64
    img_large = Image.new('L', (temp_size, temp_size), color=255)  # White background
    draw = ImageDraw.Draw(img_large)
    
    # Try to use a system font, fallback to default
    try:
        if style == 'bold':
            font = ImageFont.truetype("arial.ttf", font_size)
        elif style == 'italic':
            font = ImageFont.truetype("ariali.ttf", font_size)
        else:
            font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            # Windows default fonts
            font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", font_size)
        except:
            # Fallback to default font
            font = ImageFont.load_default()
    
    # Draw the digit "4" centered in the large image
    text = "4"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (temp_size - text_width) // 2
    y = (temp_size - text_height) // 2 - 5
    
    draw.text((x, y), text, fill=brightness, font=font)
    
    # Apply rotation if specified
    if rotation != 0:
        img_large = img_large.rotate(rotation, expand=False, fillcolor=255, resample=Image.BICUBIC)
    
    # Scale down to 6x6
    img = img_large.resize((6, 6), Image.Resampling.LANCZOS)
    
    # Add noise if specified
    if noise_level > 0:
        img_array = np.array(img)
        noise = np.random.randint(-noise_level, noise_level, img_array.shape)
        img_array = np.clip(img_array + noise, 0, 255)
        img = Image.fromarray(img_array.astype(np.uint8))
    
    # Save the image
    img.save(os.path.join(output_dir, filename))
    return img

# Generate multiple variations of digit 4
variations = [
    # (filename, font_size, rotation, brightness, noise_level, style)
    ("digit_4_thin_01.png", 40, 0, 120, 0, 'regular'),
    ("digit_4_thin_02.png", 40, 5, 120, 5, 'regular'),
    ("digit_4_thin_03.png", 40, -5, 120, 5, 'regular'),
    ("digit_4_thin_04.png", 38, 10, 130, 10, 'regular'),
    
    ("digit_4_medium_01.png", 48, 0, 100, 0, 'regular'),
    ("digit_4_medium_02.png", 48, -3, 100, 5, 'regular'),
    ("digit_4_medium_03.png", 48, 3, 100, 5, 'regular'),
    ("digit_4_medium_04.png", 46, -8, 95, 10, 'regular'),
    
    ("digit_4_dark_01.png", 45, 0, 60, 0, 'regular'),
    ("digit_4_dark_02.png", 45, 5, 60, 10, 'regular'),
    ("digit_4_dark_03.png", 45, -5, 55, 10, 'regular'),
    ("digit_4_dark_04.png", 42, 0, 50, 15, 'regular'),
    
    ("digit_4_light_01.png", 45, 0, 180, 0, 'regular'),
    ("digit_4_light_02.png", 45, 5, 180, 5, 'regular'),
    ("digit_4_light_03.png", 45, -5, 190, 10, 'regular'),
    ("digit_4_light_04.png", 42, 0, 200, 10, 'regular'),
    
    ("digit_4_thick_bold_01.png", 52, 0, 100, 0, 'bold'),
    ("digit_4_thick_bold_02.png", 50, -3, 100, 5, 'bold'),
    ("digit_4_thick_bold_03.png", 50, 3, 100, 8, 'bold'),
    ("digit_4_thick_bold_04.png", 48, 0, 95, 10, 'bold'),
    
    ("digit_4_noisy_01.png", 45, 0, 110, 20, 'regular'),
    ("digit_4_noisy_02.png", 45, 2, 110, 25, 'regular'),
    ("digit_4_noisy_03.png", 45, -2, 110, 30, 'regular'),
    ("digit_4_noisy_04.png", 42, 5, 100, 35, 'regular'),
]

print(f"Generating {len(variations)} variations of digit 4 (6x6 grayscale)...")
for i, (filename, font_size, rotation, brightness, noise, style) in enumerate(variations, 1):
    create_grayscale_digit_4(filename, font_size, rotation, brightness, noise, style)
    print(f"  {i:2d}. Created {filename}")

print(f"\nAll images saved to: {os.path.abspath(output_dir)}")

# Verify image properties
sample_img = Image.open(os.path.join(output_dir, variations[0][0]))
print(f"\nImage properties:")
print(f"  Size: {sample_img.size} pixels")
print(f"  Mode: {sample_img.mode} (true grayscale)")
print(f"  Sample file: {variations[0][0]}")