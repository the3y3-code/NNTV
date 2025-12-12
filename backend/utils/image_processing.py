import io
import base64
import numpy as np
from PIL import Image, ImageOps 
import torchvision.transforms as transforms

def process_image_for_prediction(image_file, target_size=20, final_size=28):
    """
    Prepares a raw uploaded image for the Neural Network.
    
    The goal is to match the preprocessing steps of the training data (e.g., MNIST).
    MNIST images are:
    1. Grayscale.
    2. White digits on Black background (Inverted from typical paper drawings).
    3. Centered by mass (we approximate this by bounding box cropping).
    4. Size 28x28 pixels.
    
    Args:
        image_file: The raw file object from the request.
        target_size: The size of the digit itself (bounding box).
        final_size: The final canvas size (28x28 standard).
    """
    try:
        # Read file into memory and convert to Grayscale (L mode)
        image_bytes = image_file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert('L')
        
        # 1. Invert colors 
        # Most users draw black ink on white paper, but MNIST is white ink on black background.
        img = ImageOps.invert(img)
        
        # 2. Boost Contrast (Thresholding)
        # Remove noise (faint gray lines) and ensure solid white digits.
        img = img.point(lambda p: 255 if p > 50 else 0)
        
        # 3. Auto-crop to content
        # Find the bounding box of the non-zero (white) pixels and crop to it.
        # This centers the digit purely based on its content, not the canvas interactions.
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        
        # 4. Resize maintaining aspect ratio
        w, h = img.size
        new_w, new_h = target_size, target_size 
        
        if w > 0 and h > 0:
            ratio = min(target_size/w, target_size/h)
            new_w, new_h = max(1, int(w * ratio)), max(1, int(h * ratio))
            
            # Use High-quality downsampling filter
            resample_method = getattr(Image, 'Resampling', Image).LANCZOS
            img = img.resize((new_w, new_h), resample_method)
            
            # Re-apply threshold to prevent "fuzziness" from resizing interpolation
            img = img.point(lambda p: 255 if p > 50 else 0)
        
        # 5. Center Paste onto 28x28 Canvas
        # Create a black background and paste the resized digit in the exact center.
        new_img = Image.new('L', (final_size, final_size), 0)
        offset_x = (final_size - new_w) // 2
        offset_y = (final_size - new_h) // 2
        new_img.paste(img, (offset_x, offset_y))
        
        return new_img
        
    except Exception as e:
        print(f"Error in image processing: {e}")
        return None

def image_to_base64(pil_image):
    """Helper to convert a PIL Image to a Data URL string for frontend display."""
    buffered = io.BytesIO()
    pil_image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def get_transform():
    """
    Returns the standard PyTorch transformation pipeline for this application.
    Converts PIL images to Tensors and normalizes them to the range expected by the model.
    """
    return transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,)) # Mean and Std Dev for MNIST
    ])
