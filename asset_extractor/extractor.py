"""
Asset Extractor - Professional tool for extracting individual assets from asset sheets.
This tool automatically detects, crops, and removes backgrounds from illustrations.
"""

import cv2
import numpy as np
from PIL import Image
import os
from tqdm import tqdm
import glob
import pytesseract
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Tuple, Dict, Optional

# ==================== CONFIGURABLE CONSTANTS ====================

# Size filtering
MIN_AREA = 500              # Minimum area in pixels to consider an object
MAX_AREA = 5000000          # Maximum area in pixels to consider an object
MIN_HEIGHT = 30             # Minimum height in pixels
MIN_WIDTH = 30              # Minimum width in pixels

# Text filtering criteria
TEXT_MAX_ASPECT_RATIO = 10  # Maximum width/height ratio (text is typically wide)
TEXT_MIN_ASPECT_RATIO = 0.1 # Minimum width/height ratio
TEXT_BORDER_MARGIN = 20     # Distance from top border to consider as text

# Processing parameters
PADDING = 10                # Padding in pixels around each asset
BACKGROUND_THRESHOLD = 240  # Threshold for detecting light background (0-255)
GAUSSIAN_BLUR_SIZE = 5      # Size for Gaussian blur kernel
ADAPTIVE_BLOCK_SIZE = 11    # Block size for adaptive thresholding
ADAPTIVE_C = 2              # Constant for adaptive thresholding

# Morphological operations
MORPH_OPEN_KERNEL = 3       # Kernel size for morphological opening
MORPH_CLOSE_KERNEL = 5      # Kernel size for morphological closing
MORPH_ITERATIONS = 2        # Number of iterations for morphological operations

# Background removal
FEATHER_SIZE = 3            # Size of feathering for smooth edges
EROSION_ITERATIONS = 1      # Erosion iterations to remove white halos

# Watershed parameters
WATERSHED_DIST_THRESHOLD = 0.7  # Threshold for distance transform (0-1)

# GrabCut parameters (fallback)
GRABCUT_ITERATIONS = 5      # Number of GrabCut iterations

# OCR parameters
OCR_ENABLED = True          # Enable OCR for asset naming
OCR_CONFIDENCE_THRESHOLD = 60  # Minimum confidence for OCR text

# Merge Components parameters
MERGE_DISTANCE_THRESHOLD = 50  # Maximum distance between components to merge
MERGE_OVERLAP_THRESHOLD = 0.3  # Minimum overlap ratio to merge

# Batch Processing
BATCH_ENABLED = True        # Enable batch processing
MAX_WORKERS = 4             # Maximum number of parallel workers

# Debugging
ENABLE_DEBUG = True         # Set to True to save intermediate images

# ==================== PATHS ====================

INPUT_DIR = "input"
OUTPUT_DIR = "output"


def load_image(image_path):
    """
    Load an image from the specified path.
    
    Args:
        image_path: Path to the input image
        
    Returns:
        Loaded image as numpy array (BGR format for OpenCV)
    """
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to load image from {image_path}")
    return image


def preprocess(image):
    """
    Preprocess the image for better detection.
    Convert to grayscale and apply Gaussian blur.
    
    Gaussian blur reduces noise and smooths the image, which helps
    adaptive thresholding work better by preventing small pixel
    variations from causing incorrect thresholding.
    
    Args:
        image: Input image in BGR format
        
    Returns:
        Preprocessed grayscale image
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (GAUSSIAN_BLUR_SIZE, GAUSSIAN_BLUR_SIZE), 0)
    return blurred


def detect_background(image):
    """
    Detect the background color and create a mask.
    Uses a more robust approach by finding the most common color in corners
    and using that as the background color.
    
    Args:
        image: Input image in BGR format
        
    Returns:
        Binary mask where 255 indicates background, 0 indicates foreground
    """
    # Sample corners to determine background color
    h, w = image.shape[:2]
    corner_size = min(50, h // 10, w // 10)
    
    # Get corner pixels
    corners = np.vstack([
        image[:corner_size, :corner_size].reshape(-1, 3),  # Top-left
        image[:corner_size, -corner_size:].reshape(-1, 3),  # Top-right
        image[-corner_size:, :corner_size].reshape(-1, 3),  # Bottom-left
        image[-corner_size:, -corner_size:].reshape(-1, 3)  # Bottom-right
    ])
    
    # Find most common color in corners (background)
    from collections import Counter
    corner_colors = [tuple(color) for color in corners]
    most_common = Counter(corner_colors).most_common(1)[0][0]
    bg_color = np.array(most_common)
    
    # Calculate color distance from background color
    # Use Euclidean distance in BGR space
    bg_color_3d = bg_color.reshape(1, 1, 3)
    color_dist = np.sqrt(np.sum((image - bg_color_3d) ** 2, axis=2))
    
    # Threshold: pixels within distance threshold are background
    # Adjust this threshold based on your images
    color_threshold = 30  # More permissive than the original 240 grayscale threshold
    background_mask = color_dist < color_threshold
    
    return background_mask.astype(np.uint8) * 255


def find_components(preprocessed_image, background_mask):
    """
    Find connected components in the image.
    Uses adaptive thresholding and morphological operations.
    
    Process:
    1. Invert background mask to get foreground
    2. Apply adaptive thresholding for better edge detection
    3. Combine with foreground mask
    4. Morphological opening to remove small noise
    5. Morphological closing to fill holes
    6. Find connected components
    
    Args:
        preprocessed_image: Preprocessed grayscale image
        background_mask: Binary mask of the background
        
    Returns:
        num_labels: Number of components found (including background)
        labels: Labeled image where each pixel has its component ID
        stats: Statistics for each component [x, y, w, h, area]
        centroids: Centroid coordinates for each component
        final_mask: Final binary mask after morphological operations
    """
    # Invert background mask to get foreground
    foreground_mask = cv2.bitwise_not(background_mask)
    
    # Apply adaptive thresholding for better edge detection
    # ADAPTIVE_THRESH_GAUSSIAN_C uses weighted mean of neighborhood
    # THRESH_BINARY_INV inverts: objects become white (255), background black (0)
    adaptive_thresh = cv2.adaptiveThreshold(
        preprocessed_image, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        ADAPTIVE_BLOCK_SIZE,
        ADAPTIVE_C
    )
    
    # Combine with foreground mask to ensure we only keep actual foreground
    combined_mask = cv2.bitwise_and(adaptive_thresh, foreground_mask)
    
    # Morphological opening: erosion followed by dilation
    # Removes small noise while preserving object size
    kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (MORPH_OPEN_KERNEL, MORPH_OPEN_KERNEL))
    opened = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel_open, iterations=MORPH_ITERATIONS)
    
    # Morphological closing: dilation followed by erosion
    # Fills holes inside objects
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (MORPH_CLOSE_KERNEL, MORPH_CLOSE_KERNEL))
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel_close, iterations=MORPH_ITERATIONS)
    
    # Save debug images if enabled
    if ENABLE_DEBUG:
        cv2.imwrite("debug_threshold.png", adaptive_thresh)
        cv2.imwrite("debug_mask.png", combined_mask)
        cv2.imwrite("debug_morphology.png", closed)
    
    # Find connected components using two-pass algorithm
    # connectivity=8 means 8-connected (diagonal neighbors count)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(closed, connectivity=8)
    
    return num_labels, labels, stats, centroids, closed


def merge_components(labels: np.ndarray, stats: np.ndarray, centroids: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Merge components that are close to each other.
    This helps when objects are separated by small gaps.
    
    Merging strategy:
    1. Calculate distance between component centroids
    2. Check for bounding box overlap
    3. Merge components that are close or overlapping
    
    Args:
        labels: Labeled image from connected components
        stats: Statistics for each component
        centroids: Centroid coordinates for each component
        
    Returns:
        Updated labels, stats, and centroids after merging
    """
    height, width = labels.shape
    merged_labels = labels.copy()
    
    # Create mapping from old labels to new labels
    label_mapping = {i: i for i in range(len(stats))}
    
    # Check each pair of components
    for i in range(1, len(stats)):
        for j in range(i + 1, len(stats)):
            if label_mapping[i] != label_mapping[j]:  # Only check if not already merged
                x1, y1, w1, h1, _ = stats[i]
                x2, y2, w2, h2, _ = stats[j]
                
                # Calculate centroid distance
                centroid_dist = np.sqrt((centroids[i][0] - centroids[j][0])**2 + 
                                       (centroids[i][1] - centroids[j][1])**2)
                
                # Check bounding box overlap
                overlap_x = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
                overlap_y = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
                overlap_area = overlap_x * overlap_y
                
                min_area = min(w1 * h1, w2 * h2)
                overlap_ratio = overlap_area / min_area if min_area > 0 else 0
                
            # Merge if close or overlapping
            if centroid_dist < MERGE_DISTANCE_THRESHOLD or overlap_ratio > MERGE_OVERLAP_THRESHOLD:
                # Merge j into i
                label_mapping[j] = label_mapping[i]
    
    # Apply mapping to labels
    for i in range(len(stats)):
        if label_mapping[i] != i:
            merged_labels[merged_labels == i] = label_mapping[i]
    
    # Recalculate stats and centroids for merged components
    unique_labels = np.unique(merged_labels)
    new_stats = []
    new_centroids = []
    
    for label in unique_labels:
        if label == 0:  # Skip background
            new_stats.append([0, 0, 0, 0, 0])
            new_centroids.append([0, 0])
            continue
        
        mask = merged_labels == label
        pixels = np.column_stack(np.where(mask))
        
        if len(pixels) == 0:
            new_stats.append([0, 0, 0, 0, 0])
            new_centroids.append([0, 0])
            continue
        
        y_min, x_min = pixels.min(axis=0)
        y_max, x_max = pixels.max(axis=0)
        
        new_stats.append([x_min, y_min, x_max - x_min, y_max - y_min, len(pixels)])
        new_centroids.append([np.mean(pixels[:, 1]), np.mean(pixels[:, 0])])
    
    return merged_labels, np.array(new_stats, dtype=stats.dtype), np.array(new_centroids, dtype=centroids.dtype)


def filter_objects(stats, image_shape):
    """
    Filter out noise and text-like components.
    
    Filtering criteria:
    1. Area: Too small (noise) or too large (background)
    2. Size: Too small in height or width
    3. Aspect ratio: Text is typically wide (high aspect ratio)
    4. Position: Components touching top border are likely titles
    
    Args:
        stats: Statistics for each component [x, y, w, h, area]
        image_shape: Shape of the original image (height, width)
        
    Returns:
        List of valid component indices
    """
    height, width = image_shape[:2]
    valid_components = []
    
    for i in range(1, len(stats)):  # Skip background (label 0)
        x, y, w, h, area = stats[i]
        
        # Filter by area (removes noise and very large regions)
        if area < MIN_AREA or area > MAX_AREA:
            continue
        
        # Filter by size (removes very small components)
        if h < MIN_HEIGHT or w < MIN_WIDTH:
            continue
        
        # Filter by aspect ratio (text is typically wide and short)
        aspect_ratio = w / h if h > 0 else 0
        if aspect_ratio > TEXT_MAX_ASPECT_RATIO or aspect_ratio < TEXT_MIN_ASPECT_RATIO:
            # Additional check: if it's very close to top border, it's likely text
            if y < TEXT_BORDER_MARGIN:
                continue
        
        # Filter components touching top border (likely titles/headers)
        if y < TEXT_BORDER_MARGIN:
            continue
        
        valid_components.append(i)
    
    return valid_components


def separate_close_objects(mask: np.ndarray, stats: np.ndarray, component_idx: int) -> Optional[List[Tuple[int, int, int, int]]]:
    """
    Attempt to separate objects that are very close using watershed algorithm.
    Falls back to GrabCut if watershed fails.
    
    Watershed algorithm:
    1. Morphological opening to clean the mask
    2. Distance transform to find object centers
    3. Threshold distance transform to get "sure foreground"
    4. Dilate to get "sure background"
    5. Create markers for watershed
    6. Apply watershed to separate objects
    
    GrabCut fallback:
    1. Use watershed mask as initialization
    2. Refine segmentation with GrabCut
    
    Args:
        mask: Binary mask of the component
        stats: Component statistics
        component_idx: Index of the component to process
        
    Returns:
        List of separated bounding boxes or None if separation fails
    """
    # Try watershed segmentation first
    try:
        # Create sure foreground and background markers
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        opening = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=2)
        
        # Sure background area (dilation expands the region)
        sure_bg = cv2.dilate(opening, kernel, iterations=3)
        
        # Finding sure foreground area using distance transform
        dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
        ret, sure_fg = cv2.threshold(
            dist_transform, 
            WATERSHED_DIST_THRESHOLD * dist_transform.max(), 
            255, 
            0
        )
        
        sure_fg = np.uint8(sure_fg)
        unknown = cv2.subtract(sure_bg, sure_fg)
        
        # Marker labelling for watershed
        ret, markers = cv2.connectedComponents(sure_fg)
        markers = markers + 1
        markers[unknown == 255] = 0
        
        # Apply watershed
        if len(mask.shape) == 2:
            mask_color = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
        else:
            mask_color = mask.copy()
            
        markers = cv2.watershed(mask_color, markers)
        
        # Save debug image if enabled
        if ENABLE_DEBUG:
            watershed_debug = mask_color.copy()
            watershed_debug[markers == -1] = [0, 0, 255]
            cv2.imwrite("debug_watershed.png", watershed_debug)
        
        # Extract separated regions
        separated_boxes = []
        unique_markers = np.unique(markers)
        
        for marker in unique_markers:
            if marker <= 1:
                continue
            
            component_mask = np.uint8(markers == marker) * 255
            contours, _ = cv2.findContours(component_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                x, y, w, h = cv2.boundingRect(contours[0])
                if w >= MIN_WIDTH and h >= MIN_HEIGHT and w * h >= MIN_AREA:
                    separated_boxes.append((x, y, w, h))
        
        if len(separated_boxes) > 1:
            return separated_boxes
            
    except Exception as e:
        if ENABLE_DEBUG:
            print(f"Watershed failed: {e}")
    
    # Fallback to GrabCut if watershed didn't work
    return grabcut_fallback(mask, stats, component_idx)


def grabcut_fallback(mask: np.ndarray, stats: np.ndarray, component_idx: int) -> Optional[List[Tuple[int, int, int, int]]]:
    """
    Use GrabCut algorithm as a fallback for separating objects.
    
    GrabCut is an interactive segmentation algorithm that uses
    graph cuts to separate foreground from background.
    
    Args:
        mask: Binary mask of the component
        stats: Component statistics
        component_idx: Index of the component to process
        
    Returns:
        List of separated bounding boxes or None if separation fails
    """
    try:
        x, y, w, h = stats[component_idx]
        
        # Create a larger region for GrabCut
        grabcut_margin = 20
        gc_x = max(0, x - grabcut_margin)
        gc_y = max(0, y - grabcut_margin)
        gc_w = min(mask.shape[1] - gc_x, w + grabcut_margin * 2)
        gc_h = min(mask.shape[0] - gc_y, h + grabcut_margin * 2)
        
        # Extract region
        region = mask[gc_y:gc_y+gc_h, gc_x:gc_x+gc_w]
        
        if len(region.shape) == 2:
            region_color = cv2.cvtColor(region, cv2.COLOR_GRAY2BGR)
        else:
            region_color = region.copy()
        
        # Initialize GrabCut mask
        grabcut_mask = np.zeros(region.shape[:2], np.uint8)
        
        # Set background and foreground models
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)
        
        # Use the binary mask to initialize
        grabcut_mask[region > 0] = cv2.GC_FGD
        grabcut_mask[region == 0] = cv2.GC_BGD
        
        # Define rectangle around the object
        rect = (grabcut_margin, grabcut_margin, gc_w - grabcut_margin*2, gc_h - grabcut_margin*2)
        
        # Apply GrabCut
        cv2.grabCut(region_color, grabcut_mask, rect, bgd_model, fgd_model, GRABCUT_ITERATIONS, cv2.GC_INIT_WITH_MASK)
        
        # Extract foreground
        grabcut_mask = np.where((grabcut_mask == cv2.GC_FGD) | (grabcut_mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
        
        # Find contours in the result
        contours, _ = cv2.findContours(grabcut_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        separated_boxes = []
        for contour in contours:
            bx, by, bw, bh = cv2.boundingRect(contour)
            if bw >= MIN_WIDTH and bh >= MIN_HEIGHT and bw * bh >= MIN_AREA:
                # Adjust coordinates back to original image space
                separated_boxes.append((gc_x + bx, gc_y + by, bw, bh))
        
        if len(separated_boxes) > 1:
            if ENABLE_DEBUG:
                print(f"GrabCut successfully separated {len(separated_boxes)} objects")
            return separated_boxes
        
    except Exception as e:
        if ENABLE_DEBUG:
            print(f"GrabCut fallback failed: {e}")
    
    return None


def remove_background(image, mask):
    """
    Remove background from an image using the provided mask.
    Creates an RGBA image with transparency.
    
    Process:
    1. Erode mask slightly to remove white halos
    2. Convert BGR to RGBA
    3. Use eroded mask as alpha channel
    4. Apply Gaussian blur to alpha for smooth edges
    
    Args:
        image: Input image in BGR format
        mask: Binary mask where 255 indicates foreground
        
    Returns:
        RGBA image with transparent background
    """
    # Erode mask slightly to remove white halos at edges
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    if EROSION_ITERATIONS > 0:
        mask_eroded = cv2.erode(mask, kernel, iterations=EROSION_ITERATIONS)
    else:
        mask_eroded = mask.copy()
    
    # Convert BGR to RGBA
    rgba_image = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
    
    # Use mask as alpha channel
    alpha_channel = mask_eroded.copy()
    
    # Apply feathering using distance transform for smooth edges
    if FEATHER_SIZE > 0:
        dist = cv2.distanceTransform(alpha_channel, cv2.DIST_L2, 5)
        alpha_smooth = np.clip(dist * (255 / FEATHER_SIZE), 0, 255).astype(np.uint8)
        # Combine with original mask
        alpha_channel = cv2.bitwise_and(alpha_smooth, alpha_channel)
    else:
        # Smooth the edges of the alpha channel for better quality
        alpha_channel = cv2.GaussianBlur(alpha_channel, (3, 3), 0)
    
    # Set alpha channel
    rgba_image[:, :, 3] = alpha_channel
    
    return rgba_image


def crop_asset(image, bbox, padding=PADDING):
    """
    Crop an asset from the image with specified padding.
    
    Args:
        image: Input image
        bbox: Bounding box as (x, y, width, height)
        padding: Padding in pixels to add around the crop
        
    Returns:
        Cropped image with padding
    """
    x, y, w, h = bbox
    
    # Add padding
    x_start = max(0, x - padding)
    y_start = max(0, y - padding)
    x_end = min(image.shape[1], x + w + padding)
    y_end = min(image.shape[0], y + h + padding)
    
    # Crop
    cropped = image[y_start:y_end, x_start:x_end]
    
    return cropped


def save_asset(image, output_path, quality=100):
    """
    Save an asset as a PNG with transparency.
    
    Uses Pillow instead of OpenCV for saving because it handles
    the alpha channel more reliably.
    
    Args:
        image: RGBA image to save (OpenCV BGRA format)
        output_path: Path where to save the image
        quality: Quality parameter (not used for PNG but kept for compatibility)
    """
    # Convert OpenCV BGRA to Pillow RGBA
    pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGRA2RGBA))
    
    # Save as PNG with no compression to preserve quality
    pil_image.save(output_path, 'PNG', optimize=False)


def generate_asset_name(index: int, total: int, bbox: Optional[Tuple[int, int, int, int]] = None, 
                      image: Optional[np.ndarray] = None) -> str:
    """
    Generate a descriptive name for an asset using OCR if possible, otherwise use generic name.
    
    OCR strategy:
    1. Extract region around the asset
    2. Apply OCR to detect text labels
    3. Use detected text for descriptive naming
    
    Args:
        index: Current asset index
        total: Total number of assets
        bbox: Bounding box of the asset (x, y, w, h)
        image: Original image for OCR
        
    Returns:
        String filename for the asset
    """
    if OCR_ENABLED and bbox is not None and image is not None:
        try:
            x, y, w, h = bbox
            
            # Expand region to include potential text labels
            text_region_margin = 30
            text_x = max(0, x - text_region_margin)
            text_y = max(0, y - text_region_margin)
            text_w = min(image.shape[1] - text_x, w + text_region_margin * 2)
            text_h = min(image.shape[0] - text_y, h + text_region_margin * 2)
            
            text_region = image[text_y:text_y+text_h, text_x:text_x+text_w]
            
            # Convert to grayscale for OCR
            if len(text_region.shape) == 3:
                text_region_gray = cv2.cvtColor(text_region, cv2.COLOR_BGR2GRAY)
            else:
                text_region_gray = text_region
            
            # Apply OCR
            ocr_data = pytesseract.image_to_data(
                text_region_gray,
                output_type=pytesseract.Output.DICT,
                config='--psm 6 -c min_character_size=8'
            )
            
            # Extract text with confidence above threshold
            detected_texts = []
            for i, text in enumerate(ocr_data['text']):
                confidence = int(ocr_data['conf'][i])
                if confidence > OCR_CONFIDENCE_THRESHOLD and text.strip():
                    detected_texts.append(text.strip())
            
            if detected_texts:
                # Use first detected text for naming
                asset_name = detected_texts[0].lower().replace(' ', '_').replace('/', '_')
                # Remove special characters
                asset_name = ''.join(c for c in asset_name if c.isalnum() or c == '_')
                if asset_name:
                    return f"{asset_name}_{index:03d}.png"
        except Exception as e:
            if ENABLE_DEBUG:
                print(f"OCR failed: {e}")
    
    # Fallback to generic naming
    return f"asset_{index:03d}.png"


def generate_manifest(assets_info, output_path):
    """
    Generate a JSON manifest file with information about all extracted assets.
    
    The manifest includes:
    - Asset ID
    - Filename
    - Width and height
    
    This is useful for game engines and React Native to load assets
    programmatically.
    
    Args:
        assets_info: List of dictionaries with asset information
        output_path: Path where to save the manifest file
    """
    import json
    
    manifest = {
        "assets": assets_info,
        "total": len(assets_info)
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"Generated manifest: {output_path}")


def find_contours(mask):
    """
    Find contours in a binary mask.
    
    Contours are curves that join continuous points along a boundary.
    Unlike connected components, contours focus on the shape and edges.
    
    Args:
        mask: Binary mask
        
    Returns:
        List of contours
    """
    contours, hierarchy = cv2.findContours(
        mask, 
        cv2.RETR_EXTERNAL,  # Only external contours
        cv2.CHAIN_APPROX_SIMPLE  # Compress contours, saves memory
    )
    return contours


def process_single_image(image_path: str) -> Tuple[List[Dict], str]:
    """
    Process a single image and extract assets.
    
    Args:
        image_path: Path to the input image
        
    Returns:
        Tuple of (assets_info, image_filename)
    """
    # Load image
    image = load_image(image_path)
    height, width = image.shape[:2]
    
    # Preprocess
    preprocessed = preprocess(image)
    
    # Detect background
    background_mask = detect_background(image)
    
    # Find components
    num_labels, labels, stats, centroids, final_mask = find_components(preprocessed, background_mask)
    
    # Find contours for debugging
    if ENABLE_DEBUG:
        contours = find_contours(final_mask)
        contours_debug = image.copy()
        cv2.drawContours(contours_debug, contours, -1, (0, 255, 0), 2)
        cv2.imwrite("debug_contours.png", contours_debug)
    
    # Merge components if needed
    labels, stats, centroids = merge_components(labels, stats, centroids)
    
    # Filter objects
    valid_components = filter_objects(stats, image.shape)
    
    # Save debug image showing filtered vs unfiltered
    if ENABLE_DEBUG:
        filter_debug = image.copy()
        for i in range(1, len(stats)):
            x, y, w, h, area = stats[i]
            if i in valid_components:
                cv2.rectangle(filter_debug, (x, y), (x + w, y + h), (0, 255, 0), 2)
            else:
                cv2.rectangle(filter_debug, (x, y), (x + w, y + h), (0, 0, 255), 2)
        cv2.imwrite("debug_filtering.png", filter_debug)
    
    # Process each valid component
    asset_count = 0
    assets_info = []
    
    for i in valid_components:
        x, y, w, h, area = stats[i]
        
        # Create mask for this component
        component_mask = np.uint8(labels == i) * 255
        
        # Try to separate close objects
        separated = separate_close_objects(component_mask, stats, i)
        
        if separated is not None and len(separated) > 1:
            # Successfully separated into multiple objects
            for sep_bbox in separated:
                sep_x, sep_y, sep_w, sep_h = sep_bbox
                
                # Create mask for separated object
                sep_mask = np.zeros_like(component_mask)
                sep_mask[sep_y:sep_y+sep_h, sep_x:sep_x+sep_w] = 255
                
                # Remove background
                rgba_image = remove_background(image, sep_mask)
                
                # Crop with padding
                cropped = crop_asset(rgba_image, sep_bbox, PADDING)
                
                # Save asset
                asset_count += 1
                asset_name = generate_asset_name(asset_count, len(valid_components), sep_bbox, image)
                output_path = os.path.join(OUTPUT_DIR, asset_name)
                save_asset(cropped, output_path)
                
                # Add to manifest
                assets_info.append({
                    "id": len(assets_info) + 1,
                    "file": asset_name,
                    "width": cropped.shape[1],
                    "height": cropped.shape[0]
                })
                
                if ENABLE_DEBUG:
                    print(f"Saved separated asset: {asset_name}")
        else:
            # Single object, process normally
            # Remove background
            rgba_image = remove_background(image, component_mask)
            
            # Crop with padding
            bbox = (x, y, w, h)
            cropped = crop_asset(rgba_image, bbox, PADDING)
            
            # Save asset
            asset_count += 1
            asset_name = generate_asset_name(asset_count, len(valid_components), bbox, image)
            output_path = os.path.join(OUTPUT_DIR, asset_name)
            save_asset(cropped, output_path)
            
            # Add to manifest
            assets_info.append({
                "id": len(assets_info) + 1,
                "file": asset_name,
                "width": cropped.shape[1],
                "height": cropped.shape[0]
            })
            
            if ENABLE_DEBUG:
                print(f"Saved asset: {asset_name}")
    
    # Save debug image with bounding boxes if enabled
    if ENABLE_DEBUG:
        debug_image = image.copy()
        for i in valid_components:
            x, y, w, h, area = stats[i]
            cv2.rectangle(debug_image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.imwrite("debug_bounding_boxes.png", debug_image)
        
        # Save final mask
        cv2.imwrite("debug_final_mask.png", final_mask)
    
    return assets_info, os.path.basename(image_path)


def main():
    """
    Main function to orchestrate the asset extraction process.
    
    Pipeline:
    1. Load images from input directory
    2. Preprocess (grayscale + blur)
    3. Detect background
    4. Find connected components
    5. Merge components if needed
    6. Filter objects (remove text and noise)
    7. Separate close objects using Watershed (with GrabCut fallback)
    8. Remove background and create RGBA
    9. Crop with padding
    10. Save as PNG
    11. Generate manifest
    
    Supports batch processing for multiple images.
    """
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Find all images in input directory
    image_files = glob.glob(os.path.join(INPUT_DIR, "*.png"))
    image_files.extend(glob.glob(os.path.join(INPUT_DIR, "*.jpg")))
    image_files.extend(glob.glob(os.path.join(INPUT_DIR, "*.jpeg")))
    
    if not image_files:
        print(f"No images found in {INPUT_DIR} directory.")
        return
    
    print(f"Found {len(image_files)} image(s) to process.")
    
    # Store all assets info for manifest
    all_assets_info = []
    
    if BATCH_ENABLED and len(image_files) > 1:
        # Batch processing with parallel execution
        print(f"Processing {len(image_files)} images in parallel (max {MAX_WORKERS} workers)...")
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Submit all tasks
            future_to_path = {executor.submit(process_single_image, path): path 
                             for path in image_files}
            
            # Process as they complete
            for future in tqdm(as_completed(future_to_path), total=len(image_files), desc="Processing images"):
                image_path = future_to_path[future]
                try:
                    assets_info, filename = future.result()
                    all_assets_info.extend(assets_info)
                    print(f"Extracted {len(assets_info)} assets from {filename}")
                except Exception as e:
                    print(f"Error processing {image_path}: {e}")
    else:
        # Sequential processing
        for image_path in tqdm(image_files, desc="Processing images"):
            print(f"\nProcessing: {image_path}")
            
            try:
                image = load_image(image_path)
                height, width = image.shape[:2]
                print(f"Image size: {width}x{height}")
                
                assets_info, filename = process_single_image(image_path)
                all_assets_info.extend(assets_info)
                print(f"Extracted {len(assets_info)} assets from {filename}")
            except Exception as e:
                print(f"Error processing {image_path}: {e}")
    
    # Generate manifest
    if all_assets_info:
        manifest_path = os.path.join(OUTPUT_DIR, "assets.json")
        generate_manifest(all_assets_info, manifest_path)
    
    print(f"\nDone! All assets saved to {OUTPUT_DIR}/")
    print(f"Total assets extracted: {len(all_assets_info)}")


if __name__ == "__main__":
    main()
