# Asset Library Creation Guide

This guide explains how to use the enhanced asset extractor to create a consistent asset library for the Algodão storybook forest theme.

## Required Art Style

All assets must follow this specific storybook illustration style:

**Style Description:**
- Original children's storybook illustration inspired by early 20th-century watercolor books
- Soft watercolor painting technique
- Hand-painted look
- Warm pastel palette
- Delicate ink outlines
- Minimal shading
- Cute woodland animals
- Natural proportions
- Clean isolated object
- Transparent background
- No text
- No border
- No shadow
- High detail
- Consistent storybook style
- Whimsical forest theme
- Suitable for educational mobile game
- Front view

## Required Asset Categories

### 1. Forest Environment Assets
- **Trees**: Various tree types (oak, pine, willow) in different sizes
- **Grass patches**: Different grass clumps and tufts
- **Flowers**: Wildflowers (daisies, tulips, bluebells, sunflowers)
- **Stones**: River stones, pebbles, rocks
- **Leaves**: Falling leaves, branches, vines
- **Mushrooms**: Forest mushrooms in various colors
- **Logs**: Fallen tree trunks, wooden planks

### 2. Character Assets
- **Rabbit (Algodão)**: Main character in various poses
  - Idle/standing
  - Walking/hopping
  - Eating
  - Looking around
  - Happy/excited
- **Owl (Velho Corujão)**: Narrator character
  - Perched on branch
  - Flying
  - Blinking
  - Head tilted
- **Mother Rabbit**: Goal character
  - Standing
  - Welcoming pose
- **Other Animals**: Background forest creatures
  - Birds
  - Squirrels
  - Butterflies
  - Fireflies

### 3. Interactive Objects
- **Carrots**: Regular carrots (collectible)
- **Golden Carrot**: Magical golden carrot (main goal)
- **Flower patches**: Interactive flower clusters
- **Wooden elements**: Bridges, fences, signs

### 4. UI Elements
- **Wooden planks**: For headers, buttons, panels
- **Storybook pages**: For intro/end screens
- **Decorative elements**: Corners, borders, frames

## Asset Sheet Preparation

### Creating Asset Sheets

1. **Design your assets** in the required storybook style using:
   - Watercolor painting software (Procreate, Photoshop watercolor brushes)
   - Traditional watercolor scanned at high resolution
   - AI image generators with specific prompts

2. **Arrange assets** on asset sheets:
   - Place assets on white/light background
   - Leave adequate spacing between objects (at least 50px)
   - Group similar assets together
   - Include text labels near assets for OCR naming (optional)
   - Maintain consistent scale within categories

3. **Export asset sheets**:
   - Format: PNG or JPEG
   - Resolution: 2000-4000px (depending on asset count)
   - Background: White or very light color
   - Quality: High (no compression)

### Example AI Prompt for Asset Generation

```
Original children's storybook illustration inspired by early 20th-century watercolor books.
Soft watercolor painting. Hand-painted look. Warm pastel palette.
Delicate ink outlines. Minimal shading. Cute woodland rabbit.
Natural proportions. Clean isolated object. Transparent background.
No text. No border. No shadow. High detail. Consistent storybook style.
Whimsical forest. Suitable for educational mobile game. Front view.
White background.
```

## Using the Enhanced Extractor

### Step 1: Setup

```bash
cd asset_extractor
pip install -r requirements.txt
```

### Step 2: Configure for Storybook Assets

Edit `extractor.py` with these optimized settings:

```python
# Size filtering for storybook assets
MIN_AREA = 800              # Slightly higher for quality assets
MAX_AREA = 4000000          # Adjust based on your sheet size
MIN_HEIGHT = 40             # Minimum height for usable assets
MIN_WIDTH = 40              # Minimum width for usable assets

# OCR for descriptive naming
OCR_ENABLED = True          # Enable for smart naming
OCR_CONFIDENCE_THRESHOLD = 55  # Slightly lower for watercolor text

# Merge components for complex objects
MERGE_DISTANCE_THRESHOLD = 60  # Merge nearby parts
MERGE_OVERLAP_THRESHOLD = 0.4  # Higher overlap threshold

# Batch processing for multiple sheets
BATCH_ENABLED = True
MAX_WORKERS = 4

# GrabCut fallback for difficult separations
GRABCUT_ITERATIONS = 5
```

### Step 3: Process Asset Sheets

1. Place your asset sheets in the `input/` directory
2. Run the extractor:
```bash
python extractor.py
```

3. Check the `output/` directory for extracted assets
4. Review the `assets.json` manifest for metadata

### Step 4: Quality Control

After extraction:

1. **Review each asset** for:
   - Clean edges (no white halos)
   - Proper transparency
   - Correct cropping
   - Consistent style
   - Appropriate size

2. **Rename assets** if OCR didn't work perfectly:
   - Follow naming convention: `category_description_001.png`
   - Examples: `rabbit_idle_001.png`, `tree_oak_002.png`

3. **Organize assets** into subdirectories:
   ```
   output/
   ├── characters/
   │   ├── rabbit/
   │   ├── owl/
   │   └── mother_rabbit/
   ├── environment/
   │   ├── trees/
   │   ├── grass/
   │   └── flowers/
   ├── objects/
   │   ├── carrots/
   │   └── interactive/
   └── ui/
       ├── wooden_planks/
       └── decorations/
   ```

## Integration with React Native

### Loading Assets

After extraction, integrate assets into the React Native project:

1. **Copy assets** to `frontend/assets/images/`
2. **Update imports** in `App.tsx`:
```typescript
import rabbitIdle from './assets/images/characters/rabbit/rabbit_idle_001.png';
import treeOak from './assets/images/environment/trees/tree_oak_001.png';
```

3. **Replace emojis** with actual assets in the code:
```typescript
// Before
<Text style={styles.treeEmoji}>🌳</Text>

// After
<Image source={treeOak} style={styles.treeImage} resizeMode="contain" />
```

### Asset Manifest Usage

Use the generated `assets.json` to programmatically load assets:

```typescript
import assetManifest from './assets/assets.json';

const getAsset = (id: number) => {
  const asset = assetManifest.assets.find(a => a.id === id);
  return asset ? require(`./assets/images/${asset.file}`) : null;
};
```

## Troubleshooting Storybook Assets

### Watercolor Edges Not Clean

- Increase `FEATHER_SIZE` for smoother edges
- Increase `EROSION_ITERATIONS` to remove color bleeding
- Try `GRABCUT_ITERATIONS = 7` for better separation

### Delicate Details Lost

- Decrease `MIN_AREA` to capture small details
- Reduce morphological kernel sizes
- Enable debug mode to check which steps are filtering details

### Pastel Colors Too Light

- Decrease `BACKGROUND_THRESHOLD` to better detect light backgrounds
- Manually adjust contrast in asset sheets before extraction
- Use higher resolution asset sheets

### Multiple Objects Merged

- Decrease `MERGE_DISTANCE_THRESHOLD`
- Decrease `MERGE_OVERLAP_THRESHOLD`
- Increase spacing between objects in asset sheets

## Best Practices

1. **Consistent Style**: Use the same artist/technique for all assets
2. **Quality Over Quantity**: Better to have fewer high-quality assets
3. **Test Early**: Extract a sample sheet before creating full library
4. **Version Control**: Keep original asset sheets in version control
5. **Backup**: Maintain backups of extracted assets
6. **Documentation**: Document asset naming conventions
7. **Optimization**: Optimize asset sizes for mobile performance

## Asset Library Checklist

- [ ] All character poses extracted (idle, walk, eat, etc.)
- [ ] Environment assets (trees, grass, flowers, stones)
- [ ] Interactive objects (carrots, golden carrot)
- [ ] UI elements (wooden planks, decorations)
- [ ] Background elements (clouds, birds, butterflies)
- [ ] All assets follow storybook style
- [ ] Consistent color palette maintained
- [ ] Proper transparency on all assets
- [ ] Clean edges without halos
- [ ] Appropriate sizing for mobile
- [ ] Organized directory structure
- [ ] Asset manifest generated
- [ ] Quality control completed
- [ ] Integrated into React Native project

## Next Steps

After creating the asset library:

1. **Replace emoji placeholders** in App.tsx with actual assets
2. **Test animations** with new assets
3. **Optimize performance** if needed
4. **Add more assets** as the game expands
5. **Maintain consistency** for future asset additions

## Support

For issues with asset extraction:
1. Enable debug mode: `ENABLE_DEBUG = True`
2. Review debug images to identify the issue
3. Adjust configuration parameters accordingly
4. Consult the main README.md for detailed troubleshooting
