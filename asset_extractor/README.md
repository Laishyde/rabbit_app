# Asset Extractor

Professional tool for automatically extracting individual assets from asset sheets. This tool detects, crops, and removes backgrounds from illustrations, generating transparent PNG files ready for game development and React Native projects.

## Features

- **Automatic Detection**: Identifies and extracts each illustration automatically
- **Smart Text Filtering**: Ignores text, titles, and legends using configurable criteria
- **Background Removal**: Generates transparent PNGs (RGBA) with smooth edges
- **Padding**: Adds configurable padding around each asset
- **Quality Preservation**: Maintains original resolution without compression
- **Object Separation**: Attempts to separate close objects using watershed algorithm
- **GrabCut Fallback**: Uses GrabCut segmentation when watershed fails
- **OCR Asset Naming**: Automatically names assets using detected text labels
- **Merge Components**: Intelligently merges nearby components for better extraction
- **Batch Processing**: Processes multiple images in parallel for faster workflow
- **Performance**: Handles images up to 6000x6000 pixels
- **Asset Manifest**: Generates `assets.json` with metadata for all extracted assets
- **Debug Mode**: Saves intermediate images for troubleshooting

## Project Structure

```
asset_extractor/
│
├── input/              # Place your asset sheets here
│      asset_sheet.png
│
├── output/             # Extracted assets will be saved here
│      asset_001.png
│      asset_002.png
│      ...
│
├── extractor.py        # Main extraction script
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Navigate to the project directory:
```bash
cd asset_extractor
```

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install opencv-python numpy Pillow tqdm pytesseract
```

3. **For OCR functionality**, install Tesseract OCR engine:
   - **Windows**: Download from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
   - **macOS**: `brew install tesseract`
   - **Linux**: `sudo apt-get install tesseract-ocr`

4. Ensure Tesseract is in your system PATH for OCR asset naming to work.

## Usage

### Basic Usage

1. Place your asset sheet image in the `input/` directory
2. Run the extractor:
```bash
python extractor.py
```

3. Find your extracted assets in the `output/` directory

### Supported Image Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)

## Configuration

The extractor includes configurable constants at the top of `extractor.py`. You can adjust these parameters to fine-tune the extraction:

### Size Filtering

```python
MIN_AREA = 500              # Minimum area in pixels
MAX_AREA = 5000000          # Maximum area in pixels
MIN_HEIGHT = 30             # Minimum height in pixels
MIN_WIDTH = 30              # Minimum width in pixels
```

### Text Filtering

```python
TEXT_MAX_ASPECT_RATIO = 10  # Maximum width/height ratio for text
TEXT_MIN_ASPECT_RATIO = 0.1 # Minimum width/height ratio
TEXT_BORDER_MARGIN = 20     # Distance from top border to consider as text
```

### Processing Parameters

```python
PADDING = 10                # Padding in pixels around each asset
BACKGROUND_THRESHOLD = 240  # Threshold for detecting light background (0-255)
GAUSSIAN_BLUR_SIZE = 5      # Size for Gaussian blur kernel
ADAPTIVE_BLOCK_SIZE = 11    # Block size for adaptive thresholding
ADAPTIVE_C = 2              # Constant for adaptive thresholding
```

### Morphological Operations

```python
MORPH_OPEN_KERNEL = 3       # Kernel size for morphological opening
MORPH_CLOSE_KERNEL = 5      # Kernel size for morphological closing
MORPH_ITERATIONS = 2        # Number of iterations
```

### OCR Configuration

```python
OCR_ENABLED = True          # Enable OCR for asset naming
OCR_CONFIDENCE_THRESHOLD = 60  # Minimum confidence for OCR text
```

### Merge Components

```python
MERGE_DISTANCE_THRESHOLD = 50  # Maximum distance between components to merge
MERGE_OVERLAP_THRESHOLD = 0.3  # Minimum overlap ratio to merge
```

### Batch Processing

```python
BATCH_ENABLED = True        # Enable batch processing
MAX_WORKERS = 4             # Maximum number of parallel workers
```

### GrabCut Fallback

```python
GRABCUT_ITERATIONS = 5      # Number of GrabCut iterations
```

### Debug Mode

Set `ENABLE_DEBUG = True` to save intermediate images for troubleshooting:

```python
ENABLE_DEBUG = False        # Set to True to save debug images
```

When enabled, the following debug images will be saved:
- `debug_threshold.png` - After adaptive thresholding
- `debug_mask.png` - Combined mask
- `debug_morphology.png` - After morphological operations
- `debug_contours.png` - Contours detected in the image
- `debug_filtering.png` - Shows valid (green) and filtered (red) components
- `debug_watershed.png` - Watershed segmentation results
- `debug_bounding_boxes.png` - Final bounding boxes overlay
- `debug_final_mask.png` - Final mask after all processing

## Output

Assets are saved as transparent PNG files in the `output/` directory. With OCR enabled, assets are named using detected text labels:
- `rabbit_001.png`
- `tree_002.png`
- `flower_003.png`
- ...

If OCR fails or is disabled, generic names are used:
- `asset_001.png`
- `asset_002.png`
- `asset_003.png`
- ...

Additionally, an `assets.json` manifest file is generated with metadata:

```json
{
  "assets": [
    {
      "id": 1,
      "file": "asset_001.png",
      "width": 320,
      "height": 420
    },
    {
      "id": 2,
      "file": "asset_002.png",
      "width": 280,
      "height": 350
    }
  ],
  "total": 2
}
```

This manifest can be used by game engines and React Native to load assets programmatically.

## Algorithm Overview

The extraction process follows these steps:

1. **Load Image**: Reads the asset sheet from the input directory
2. **Preprocess**: Converts to grayscale and applies Gaussian blur
3. **Detect Background**: Identifies light background regions
4. **Create Mask**: Uses adaptive thresholding and morphological operations
5. **Find Components**: Identifies connected components using connected components analysis
6. **Find Contours**: Detects contours for shape analysis (debug mode)
7. **Merge Components**: Intelligently merges nearby components based on:
   - Distance between centroids
   - Bounding box overlap
   - Configurable thresholds
8. **Filter Objects**: Removes noise and text-like components based on:
   - Area (too small or too large)
   - Size (minimum height/width)
   - Aspect ratio (text is typically wide)
   - Proximity to borders (titles/headers)
9. **Separate Close Objects**: Attempts watershed segmentation for nearby objects
   - Falls back to GrabCut if watershed fails
10. **OCR Asset Naming**: Detects text labels for descriptive naming (if enabled)
11. **Remove Background**: Creates RGBA image with transparency using:
    - Erosion to remove white halos
    - Feathering for smooth edges
12. **Crop Asset**: Extracts with configurable padding
13. **Save Asset**: Saves as PNG without compression
14. **Generate Manifest**: Creates assets.json with metadata

## New Features

### OCR Asset Naming

The extractor now includes OCR (Optical Character Recognition) capabilities to automatically name assets based on detected text labels in the asset sheet. This creates more descriptive filenames like `rabbit_001.png` instead of generic `asset_001.png`.

**How it works:**
- Scans the region around each detected asset
- Uses Tesseract OCR to detect text labels
- Applies confidence threshold to filter low-quality detections
- Falls back to generic naming if OCR fails

**Configuration:**
```python
OCR_ENABLED = True          # Enable/disable OCR
OCR_CONFIDENCE_THRESHOLD = 60  # Minimum confidence (0-100)
```

### Merge Components

The merge components feature intelligently combines nearby components that should be treated as a single object. This is useful when:
- Objects are separated by small gaps
- Text labels are split across multiple components
- Complex objects are detected as separate parts

**Merge criteria:**
- Centroid distance below threshold
- Bounding box overlap above threshold
- Configurable parameters for fine-tuning

**Configuration:**
```python
MERGE_DISTANCE_THRESHOLD = 50  # Maximum distance to merge
MERGE_OVERLAP_THRESHOLD = 0.3  # Minimum overlap ratio
```

### GrabCut Fallback

When the watershed algorithm fails to separate close objects, the extractor automatically falls back to GrabCut segmentation. This provides a more robust separation method for difficult cases.

**How it works:**
- Watershed is attempted first (faster)
- If separation fails, GrabCut is used
- GrabCut uses graph cuts for precise segmentation
- Results in better separation for complex objects

**Configuration:**
```python
GRABCUT_ITERATIONS = 5  # Number of GrabCut iterations
```

### Batch Processing

For workflows with multiple asset sheets, batch processing enables parallel execution to significantly reduce processing time.

**How it works:**
- Detects multiple images in input directory
- Processes them in parallel using ThreadPoolExecutor
- Configurable number of workers
- Shows progress with tqdm progress bar

**Configuration:**
```python
BATCH_ENABLED = True  # Enable/disable batch processing
MAX_WORKERS = 4      # Maximum parallel workers
```

**Performance:**
- Single image: ~2-5 seconds (depending on complexity)
- 4 images with batch processing: ~2-5 seconds total (parallel)
- Significant speedup for multiple asset sheets

## Troubleshooting

### Assets not detected

- Increase `MIN_AREA` if small objects are being filtered
- Decrease `BACKGROUND_THRESHOLD` if background is not light enough
- Enable debug mode to inspect intermediate steps
- Check `debug_threshold.png` and `debug_morphology.png`

### Text detected as assets

- Decrease `TEXT_MAX_ASPECT_RATIO`
- Increase `TEXT_BORDER_MARGIN`
- Increase `MIN_HEIGHT` and `MIN_WIDTH`
- Check `debug_filtering.png` to see what's being filtered

### Objects merged together

- Decrease `ADAPTIVE_BLOCK_SIZE`
- Decrease `ADAPTIVE_C`
- Enable debug mode to inspect the mask
- Check `debug_watershed.png` to see separation results

### Poor edge quality

- Increase `FEATHER_SIZE` for smoother edges
- Increase `EROSION_ITERATIONS` to remove white halos
- Adjust morphological kernel sizes

### White halos around assets

- Increase `EROSION_ITERATIONS`
- Decrease `BACKGROUND_THRESHOLD`
- Check `debug_final_mask.png` to inspect the mask

### Watershed not separating objects

- Adjust `WATERSHED_DIST_THRESHOLD` (try 0.6 or 0.8)
- Increase morphological opening kernel size
- Check `debug_watershed.png` to see markers
- The tool will automatically fall back to GrabCut if watershed fails

### OCR not detecting text

- Ensure Tesseract OCR is installed and in system PATH
- Decrease `OCR_CONFIDENCE_THRESHOLD` for more detections
- Increase text region margin in `generate_asset_name()`
- Check that text labels are clear and high-contrast
- Disable OCR with `OCR_ENABLED = False` if not needed

### Batch processing slow

- Reduce `MAX_WORKERS` if system has limited resources
- Disable batch processing for single images with `BATCH_ENABLED = False`
- Check system memory usage with large asset sheets

## Performance

The tool is optimized to handle images up to 6000x6000 pixels. Processing time depends on:
- Image size
- Number of objects
- Complexity of the asset sheet
- Whether debug mode is enabled (slower due to image saving)

### Performance Tips

- Disable debug mode for production runs
- Process large asset sheets in batches if memory is limited
- Use appropriate image resolution (don't upscale unnecessarily)
- Enable batch processing for multiple asset sheets
- Adjust MAX_WORKERS based on available CPU cores

## Use Cases

- Game development (2D sprites, tiles, UI elements)
- React Native projects
- Asset library organization
- Sprite sheet extraction
- UI component extraction
- Automated asset pipelines
- Game asset preparation from AI-generated sheets

## License

This tool is provided as-is for use in your projects.

## Advanced Usage

### Custom Asset Naming

To implement custom asset naming (e.g., reading labels with OCR), modify the `generate_asset_name()` function:

```python
def generate_asset_name(index, total, bbox=None, image=None):
    # Implement OCR or custom naming logic here
    # Example: read text label near the asset
    return f"custom_name_{index}.png"
```

### Component Merging

To merge nearby components, implement logic in `merge_components()`:

```python
def merge_components(labels, stats, centroids):
    # Calculate distances between centroids
    # Merge if distance < threshold
    return labels, stats, centroids
```

### GrabCut Fallback

The code includes GrabCut parameters for future implementation as a fallback when Watershed fails.

## Contributing

Feel free to modify the constants and functions to suit your specific needs. The code is well-commented and organized for easy customization.
