# RPG Maker MZ - Graphics Rendering System

RPG Maker MZ uses a layered rendering system powered by the PIXI.js library to handle all visual elements of the game.

## Core Rendering Components

### Graphics
- Located in `rmmz_core/Graphics.js`
- Initializes and manages the rendering system
- Handles rendering context creation and resizing
- Controls frame rendering timing
- Manages screen scaling and full-screen functionality

### Bitmap
- Located in `rmmz_core/Bitmap.js`
- Represents image data and provides drawing functionality
- Handles image loading and caching
- Provides methods for text rendering, pixel manipulation, and basic shapes
- Manages image smoothing and pixel crispness

### PIXI Integration
- RPG Maker MZ uses PIXI.js for WebGL/Canvas rendering
- The engine wraps PIXI functionality in its own classes
- Core PIXI objects like PIXI.Container and PIXI.Sprite are extended

## Rendering Structure

### Renderer Initialization
```javascript
// Initialize the renderer
Graphics.initialize(width, height, type);

// Set rendering options
Graphics.setDefaultScale(scaleX, scaleY);
Graphics.setFontSmoothing(enabled);
Graphics.setTickHandler(handler);
```

### Render Loop
```javascript
// Main rendering loop (simplified)
Graphics._onTick = function(deltaTime) {
    this._fpsCounter.startTick();
    
    // Update game logic
    this._tickHandler(deltaTime);
    
    // Render the scene
    this._app.render();
    
    this._fpsCounter.endTick();
};
```

## Display Hierarchy

The game's visual elements are organized in a hierarchy:

1. **Stage** - Root container for all visual elements
2. **Scene layers** - Different scenes (map, battle, menu)
3. **Spriteset layers** - Collections of sprites for specific contexts
4. **Window layers** - UI windows with their contents
5. **Individual sprites** - Characters, animations, etc.
6. **Bitmaps** - The actual image data

## Graphics Performance

### Resolution and Scaling
- Default game resolution is 816×624 pixels
- Scaling is automatically applied for different screen sizes
- Pixel ratio is considered for high-DPI displays

### Rendering Modes
- **Canvas mode**: Better compatibility but slower
- **WebGL mode**: Faster rendering with hardware acceleration
- The engine chooses the best available mode

### Optimization Techniques
- **Texture caching**: Reusing loaded images
- **Sprite batching**: Reducing draw calls
- **Dirty rectangle checking**: Only redrawing changed areas
- **Offscreen rendering**: Preparing complex visuals before display

## Custom Rendering

### Creating Custom Visual Elements
```javascript
// Create a custom sprite
const sprite = new Sprite();
sprite.bitmap = ImageManager.loadPicture("CustomImage");
sprite.x = 100;
sprite.y = 100;
sprite.scale.x = 2.0;
sprite.scale.y = 2.0;
sprite.opacity = 192;
sprite.blendMode = PIXI.BLEND_MODES.ADD;
this.addChild(sprite);
```

### Visual Effects
```javascript
// Create color filters
const colorFilter = new ColorFilter();
colorFilter.setHue(60); // Yellow tint
colorFilter.setColorTone([0, 0, 255, 0]); // Blue tone
sprite.filters = [colorFilter];

// Use blend modes
sprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
```

### Custom Shaders
```javascript
// Create a custom PIXI filter with shader
const fragmentSrc = `
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float time;
    
    void main(void) {
        vec2 coord = vTextureCoord;
        coord.x += sin(coord.y * 10.0 + time) * 0.01;
        gl_FragColor = texture2D(uSampler, coord);
    }
`;

const customFilter = new PIXI.Filter(null, fragmentSrc, {
    time: 0.0
});

// Update shader uniforms
customFilter.uniforms.time += 0.01;

// Apply to sprite
sprite.filters = [customFilter];
```

## Texture Management

### ImageManager
- Loads and caches images
- Provides standardized access to different image categories
- Handles error states for missing images

```javascript
// Load different types of images
const characterBitmap = ImageManager.loadCharacter("Actor1");
const faceBitmap = ImageManager.loadFace("Actor1");
const battleBackBitmap = ImageManager.loadBattleback1("Grassland");
const enemyBitmap = ImageManager.loadEnemy("Slime");
```

### Resource Handling
- Images are cached for performance
- Memory usage is monitored
- Unused resources can be released when low on memory
- Loading states are tracked for proper initialization