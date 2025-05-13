# RPG Maker MZ - Tilemap Rendering

This document details the tilemap rendering system in RPG Maker MZ, covering the tilemap implementation, layer management, and optimization techniques.

## Core Components

### Tilemap Class
- Located in `rmmz_core/Tilemap.js`
- Manages and renders the game's tile-based maps
- Handles multiple tile layers and autotiles
- Optimizes rendering through chunks and caching

### Tileset and Map Data Structure
- Tilesets define the visual appearance of tiles
- Maps store the tile IDs for each position on the grid
- Autotiles handle animated and context-sensitive tiles

### Supporting Classes
- `ShaderTilemap`: WebGL accelerated tilemap rendering
- `Tilemap.Layer`: Manages individual tile layers
- `Tilemap.Renderer`: Handles the actual drawing operations

## Tilemap Architecture

### Basic Structure
```javascript
// Initialize tilemap
Tilemap.prototype.initialize = function() {
    PIXI.Container.prototype.initialize.call(this);
    
    this._width = 0;
    this._height = 0;
    this._margin = 20;
    this._tileWidth = 48;
    this._tileHeight = 48;
    this._mapWidth = 0;
    this._mapHeight = 0;
    this._mapData = null;
    this._bitmaps = [];
    
    /**
     * The origin point of the tilemap for scrolling.
     *
     * @type Point
     */
    this.origin = new Point();
    
    /**
     * The tileset flags.
     *
     * @type Array
     */
    this.flags = [];
    
    this.createLayers();
    this.refresh();
};
```

### Layer System
```javascript
// Create tilemap layers
Tilemap.prototype.createLayers = function() {
    this._lowerLayer = new Tilemap.Layer();
    this._upperLayer = new Tilemap.Layer();
    this._shadowLayer = new Tilemap.Layer();
    this.addChild(this._shadowLayer);
    this.addChild(this._lowerLayer);
    this.addChild(this._upperLayer);
};

// Tilemap Layer class
Tilemap.Layer = function() {
    this.initialize(...arguments);
};

Tilemap.Layer.prototype = Object.create(PIXI.Container.prototype);
Tilemap.Layer.prototype.constructor = Tilemap.Layer;

Tilemap.Layer.prototype.initialize = function() {
    PIXI.Container.prototype.initialize.call(this);
    this.z = 0;
    this._elements = [];
    this._indexBuffer = null;
    this._indexArray = new Float32Array(0);
    this._vertexBuffer = null;
    this._vertexArray = new Float32Array(0);
    this._vao = null;
    this._needsTexturesUpdate = false;
    this._needsVertexUpdate = false;
    this._images = [];
    this._state = PIXI.State.for2d();
    this._createVao();
};
```

### Tilemap Update and Rendering
```javascript
// Update tilemap
Tilemap.prototype.update = function() {
    this.animationCount++;
    this.animationFrame = Math.floor(this.animationCount / 30);
    this.children.forEach(child => {
        if (child.update) {
            child.update();
        }
    });
    this.refresh();
};

// Refresh tilemap when needed
Tilemap.prototype.refresh = function() {
    this._needsRepaint = true;
};

// Paint the tilemap
Tilemap.prototype._paintAllTiles = function(startX, startY) {
    const tileCols = Math.ceil(this._width / this._tileWidth) + 1;
    const tileRows = Math.ceil(this._height / this._tileHeight) + 1;
    
    for (let y = 0; y < tileRows; y++) {
        for (let x = 0; x < tileCols; x++) {
            this._paintTiles(startX + x, startY + y);
        }
    }
};

// Draw tiles at specific coordinates
Tilemap.prototype._paintTiles = function(tileX, tileY) {
    const mx = tileX + this._margin;
    const my = tileY + this._margin;
    const dx = tileX * this._tileWidth;
    const dy = tileY * this._tileHeight;
    
    // Draw shadow layer
    const shadowBits = this._readMapData(mx, my, 4);
    if (shadowBits) {
        this._drawShadow(this._shadowLayer, shadowBits, dx, dy);
    }
    
    // Draw lower layer
    const lowerTileId1 = this._readMapData(mx, my, 0);
    const lowerTileId2 = this._readMapData(mx, my, 1);
    if (lowerTileId1 > 0) {
        this._drawTile(this._lowerLayer, lowerTileId1, dx, dy);
    }
    if (lowerTileId2 > 0) {
        this._drawTile(this._lowerLayer, lowerTileId2, dx, dy);
    }
    
    // Draw upper layer
    const upperTileId1 = this._readMapData(mx, my, 2);
    const upperTileId2 = this._readMapData(mx, my, 3);
    if (upperTileId1 > 0) {
        this._drawTile(this._upperLayer, upperTileId1, dx, dy);
    }
    if (upperTileId2 > 0) {
        this._drawTile(this._upperLayer, upperTileId2, dx, dy);
    }
};
```

## Autotile System

### Autotile Structure
```javascript
// Autotile constants
Tilemap.TILE_ID_A1 = 0;
Tilemap.TILE_ID_A2 = 1;
Tilemap.TILE_ID_A3 = 2;
Tilemap.TILE_ID_A4 = 3;
Tilemap.TILE_ID_A5 = 4;
Tilemap.TILE_ID_B = 5;
Tilemap.TILE_ID_C = 6;
Tilemap.TILE_ID_D = 7;
Tilemap.TILE_ID_E = 8;
Tilemap.TILE_ID_MAX = 9;

// Initialize autotile shapes table
Tilemap.prototype._initAutotileShapes = function() {
    this._autotileShapes = [];
    
    // Set up the autotile shape table for each autotile combination
    this._autotileShapes[0] = [[0, 0], [1, 0], [0, 1], [1, 1]];
    this._autotileShapes[1] = [[2, 0], [1, 0], [2, 1], [1, 1]];
    this._autotileShapes[2] = [[0, 0], [3, 0], [0, 1], [3, 1]];
    // ... more shape definitions
    this._autotileShapes[46] = [[2, 2], [3, 2], [2, 3], [3, 3]];
    this._autotileShapes[47] = [[0, 2], [1, 2], [0, 3], [1, 3]];
};
```

### Autotile Calculation
```javascript
// Calculate autotile kind from surrounding tiles
Tilemap.prototype._calculateAutotileKind = function(x, y, z) {
    // Look at neighboring tiles to determine which autotile pattern to use
    const tileId = this._readMapData(x, y, z);
    
    if (this.isWaterfallTile(tileId)) {
        // Special calculation for waterfall tiles
        return this._calculateWaterfallKind(x, y, z);
    }
    
    // Check surrounding 4 directions
    const above = this._isHigherTile(x, y - 1, z);
    const right = this._isHigherTile(x + 1, y, z);
    const below = this._isHigherTile(x, y + 1, z);
    const left = this._isHigherTile(x - 1, y, z);
    
    // Check corners for complete calculation
    const aboveRight = this._isHigherTile(x + 1, y - 1, z);
    const belowRight = this._isHigherTile(x + 1, y + 1, z);
    const belowLeft = this._isHigherTile(x - 1, y + 1, z);
    const aboveLeft = this._isHigherTile(x - 1, y - 1, z);
    
    // Calculate the kind number from the 8 surrounding tiles
    let kind = 0;
    if (above) kind |= 1;
    if (right) kind |= 2;
    if (below) kind |= 4;
    if (left) kind |= 8;
    if (aboveRight && above && right) kind |= 16;
    if (belowRight && below && right) kind |= 32;
    if (belowLeft && below && left) kind |= 64;
    if (aboveLeft && above && left) kind |= 128;
    
    return kind;
};

// Draw autotile at specified position
Tilemap.prototype._drawAutotile = function(layer, tileId, dx, dy) {
    const kind = this._calculateAutotileKind(tileId);
    const shape = this._autotileShapes[kind];
    const sx = (Math.floor(tileId / 128) % 2 * 8 + Math.floor(tileId % 8)) * this._tileWidth;
    const sy = (Math.floor(tileId / 8) % 16) * this._tileHeight;
    const source = this._bitmaps[tileId >> 3];
    
    // Draw the 4 parts of the autotile
    for (let i = 0; i < 4; i++) {
        const qsx = sx + shape[i][0] * this._tileWidth / 2;
        const qsy = sy + shape[i][1] * this._tileHeight / 2;
        const qdx = dx + (i % 2) * this._tileWidth / 2;
        const qdy = dy + Math.floor(i / 2) * this._tileHeight / 2;
        layer.addRect(source, qsx, qsy, this._tileWidth / 2, this._tileHeight / 2, qdx, qdy);
    }
};
```

### Animated Autotiles
```javascript
// Check if tile is animated
Tilemap.prototype.isAnimatedTile = function(tileId) {
    return tileId >= 0 && tileId < 256;
};

// Draw animated tile
Tilemap.prototype._drawAnimatedTile = function(layer, tileId, dx, dy) {
    const frameId = this.animationFrame % 4;
    const tilesetId = this._tilesetId;
    const autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE;
    
    // Water/lava animation
    if (tileId >= 0 && tileId < 48) {
        const kind = tileId % 24;
        const pattern = Math.floor(tileId / 24);
        const sx = (frameId % 3) * 16 + autotileTable[kind][0];
        const sy = Math.floor(frameId / 3) * 16 + pattern * 48 + autotileTable[kind][1];
        layer.addRect(this.bitmaps[0], sx, sy, 16, 16, dx, dy);
    }
    // Other animations...
};
```

## Tile Flags and Passability

### Tileset Flags
```javascript
// Initialize flags from tileset
Tilemap.prototype._readMapData = function(x, y, z) {
    if (this._mapData) {
        const width = this._mapWidth;
        const height = this._mapHeight;
        if (x >= 0 && x < width && y >= 0 && y < height) {
            const index = (z * height + y) * width + x;
            return this._mapData[index];
        } else {
            return 0;
        }
    } else {
        return 0;
    }
};

// Get flag for specific tile
Tilemap.prototype.flagAt = function(x, y) {
    const tileId = this._readMapData(x, y, 0);
    return this.flags[tileId] || 0;
};

// Check for passage in specific direction
Tilemap.prototype.isPassable = function(x, y, d) {
    const flag = this.flagAt(x, y);
    if (d === 0) {
        return (flag & 0x10) === 0; // All directions
    }
    const bit = (1 << (d / 2 - 1)) & 0x0f;
    return (flag & bit) === 0;
};
```

### Tile Priority
```javascript
// Check if tile is ground layer (always below characters)
Tilemap.prototype.isGroundTile = function(tileId) {
    // A1 (animated) or A5 (normal)
    return tileId < 256 || tileId >= 2048 && tileId < 2816;
};

// Check if tile has priority over characters
Tilemap.prototype.isOverpassTile = function(tileId) {
    // B-E tiles with priority flag
    return tileId >= 2816 && this.flags[tileId] & 0x10; // 0x10 = priority flag
};

// Check if tile is waterfall
Tilemap.prototype.isWaterfallTile = function(tileId) {
    // A1 waterfall tiles
    return tileId >= 0 && tileId < 48 && tileId % 2 === 1;
};
```

## Optimization Techniques

### Rendering Optimization
```javascript
// Only update what's needed
Tilemap.prototype._updateAllTiles = function() {
    this._needsRepaint = false;
    
    const viewportWidth = this._width;
    const viewportHeight = this._height;
    
    const display = this._displayX;
    const displayY = this._displayY;
    
    // Only update visible parts of the tilemap
    const startX = Math.floor(displayX / this._tileWidth);
    const startY = Math.floor(displayY / this._tileHeight);
    
    const tileCols = Math.ceil(viewportWidth / this._tileWidth) + 1;
    const tileRows = Math.ceil(viewportHeight / this._tileHeight) + 1;
    
    // Repaint only visible tiles
    this._lowerLayer.clear();
    this._upperLayer.clear();
    
    for (let y = 0; y < tileRows; y++) {
        for (let x = 0; x < tileCols; x++) {
            this._paintTiles(startX + x, startY + y);
        }
    }
};
```

### Chunk-Based Rendering
```javascript
// Define chunk class
Tilemap.Chunk = function() {
    this.initialize(...arguments);
};

Tilemap.Chunk.prototype.initialize = function() {
    this.width = 64;  // Chunk size in pixels
    this.height = 64;
    this.tiles = [];
    this._dirty = true;
    this._bitmap = new Bitmap(64, 64);
};

// Paint chunk only when needed
Tilemap.prototype._paintChunks = function() {
    const startX = this._displayX;
    const startY = this._displayY;
    const tileCols = Math.ceil(this._width / 64) + 1;
    const tileRows = Math.ceil(this._height / 64) + 1;
    
    for (let y = 0; y < tileRows; y++) {
        for (let x = 0; x < tileCols; x++) {
            const chunk = this._getChunk(startX + x * 64, startY + y * 64);
            if (chunk._dirty) {
                this._paintChunk(chunk);
                chunk._dirty = false;
            }
            this._lowerLayer.addChild(chunk.sprite);
        }
    }
};

// Get or create chunk
Tilemap.prototype._getChunk = function(x, y) {
    const chunkX = Math.floor(x / 64);
    const chunkY = Math.floor(y / 64);
    const key = chunkX + "," + chunkY;
    
    if (!this._chunks[key]) {
        this._chunks[key] = new Tilemap.Chunk();
    }
    
    return this._chunks[key];
};
```

### Texture Atlasing
```javascript
// Create texture atlas for efficient rendering
Tilemap.prototype._createTextureAtlas = function() {
    const tilesetBitmaps = this._bitmaps;
    const tileWidth = this._tileWidth;
    const tileHeight = this._tileHeight;
    
    // Create a texture atlas to hold all tiles
    const atlas = new Bitmap(2048, 2048); // Large enough for most tilesets
    
    let atlasX = 0;
    let atlasY = 0;
    let maxY = 0;
    
    // Copy tiles to the atlas
    for (let i = 0; i < tilesetBitmaps.length; i++) {
        const tileset = tilesetBitmaps[i];
        
        if (!tileset.isReady()) continue;
        
        const tilesetCols = tileset.width / tileWidth;
        const tilesetRows = tileset.height / tileHeight;
        
        for (let ty = 0; ty < tilesetRows; ty++) {
            for (let tx = 0; tx < tilesetCols; tx++) {
                // Ensure we have space in current row
                if (atlasX + tileWidth > atlas.width) {
                    atlasX = 0;
                    atlasY += maxY;
                    maxY = 0;
                }
                
                // Copy tile to atlas
                atlas.blt(
                    tileset,
                    tx * tileWidth,
                    ty * tileHeight,
                    tileWidth,
                    tileHeight,
                    atlasX,
                    atlasY
                );
                
                // Store atlas coordinates for this tile
                this._tileCoords[i * 10000 + ty * tilesetCols + tx] = {
                    x: atlasX,
                    y: atlasY
                };
                
                // Update atlas position
                atlasX += tileWidth;
                maxY = Math.max(maxY, tileHeight);
            }
        }
    }
    
    return PIXI.Texture.from(atlas.canvas);
};
```

### Culling and Dirty Regions
```javascript
// Only update tiles that need to be redrawn
Tilemap.prototype._updateLayerPositions = function() {
    const ox = Math.floor(this.origin.x);
    const oy = Math.floor(this.origin.y);
    const startX = Math.floor(ox / this._tileWidth);
    const startY = Math.floor(oy / this._tileHeight);
    
    // Only update if the view has moved
    if (this._lastStartX !== startX || this._lastStartY !== startY) {
        this._lastStartX = startX;
        this._lastStartY = startY;
        this._needsRepaint = true;
    }
    
    this._updateLayerPosition(this._lowerLayer, startX, startY);
    this._updateLayerPosition(this._upperLayer, startX, startY);
};

// Update layer position
Tilemap.prototype._updateLayerPosition = function(layer, startX, startY) {
    const ox = Math.round(this.origin.x);
    const oy = Math.round(this.origin.y);
    const dx = startX * this._tileWidth - ox;
    const dy = startY * this._tileHeight - oy;
    
    layer.x = dx;
    layer.y = dy;
};
```

## WebGL Optimization

### ShaderTilemap Class
```javascript
// WebGL optimized tilemap
function ShaderTilemap() {
    this.initialize(...arguments);
}

ShaderTilemap.prototype = Object.create(Tilemap.prototype);
ShaderTilemap.prototype.constructor = ShaderTilemap;

ShaderTilemap.prototype.initialize = function() {
    Tilemap.prototype.initialize.call(this);
    this._shader = null;
    this._usesVertexShader = false;
};

// Create layer with shader support
ShaderTilemap.prototype._createLayers = function() {
    // Create layers with WebGL support
    this._lowerLayer = new PIXI.Container();
    this._upperLayer = new PIXI.Container();
    
    // Create a shader program for the layers
    this._shader = new TilemapShader();
    
    // Set up layer properties
    this.addChild(this._lowerLayer);
    this.addChild(this._upperLayer);
};

// Use shaders for batched rendering
ShaderTilemap.prototype._drawAutotile = function(layer, tileId, dx, dy) {
    // Add all tiles to a batch for efficient WebGL rendering
    if (!this._tilemapBatch) {
        this._tilemapBatch = new PIXI.BatchRenderer();
    }
    
    this._tilemapBatch.addTile(
        this._getAtlasTexture(tileId),
        dx, dy,
        this._tileWidth, this._tileHeight
    );
};
```

### Vertex Shader for Tiles
```javascript
// Tilemap shader for efficient rendering
function TilemapShader() {
    // Vertex shader
    this.vertexSrc = [
        'attribute vec2 aVertexPosition;',
        'attribute vec2 aTextureCoord;',
        'attribute vec4 aColor;',
        'uniform mat3 projectionMatrix;',
        'varying vec2 vTextureCoord;',
        'varying vec4 vColor;',
        'void main(void){',
        '   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);',
        '   vTextureCoord = aTextureCoord;',
        '   vColor = aColor;',
        '}'
    ].join('\n');
    
    // Fragment shader
    this.fragmentSrc = [
        'varying vec2 vTextureCoord;',
        'varying vec4 vColor;',
        'uniform sampler2D uSampler;',
        'void main(void){',
        '   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor;',
        '}'
    ].join('\n');
    
    this.program = null;
    this.createProgram();
}

// Create WebGL shader program
TilemapShader.prototype.createProgram = function() {
    const gl = Graphics._renderer.gl;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, this.vertexSrc);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentSrc);
    
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
};
```

## Integration with Game Logic

### Game_Map Connection
```javascript
// Connect Game_Map with the tilemap renderer
Game_Map.prototype.createTilemap = function() {
    this._tilemap = new ShaderTilemap();
    this._tilemap.tileWidth = $gameMap.tileWidth();
    this._tilemap.tileHeight = $gameMap.tileHeight();
    this._tilemap.setData($gameMap.width(), $gameMap.height(), $gameMap.data());
    this._tilemap.horizontalWrap = $gameMap.isLoopHorizontal();
    this._tilemap.verticalWrap = $gameMap.isLoopVertical();
    
    // Set tileset bitmaps
    for (let i = 0; i < 6; i++) {
        this._tilemap.bitmaps[i] = ImageManager.loadTileset($gameMap.tileset().tilesetNames[i]);
    }
    
    // Set flags
    this._tilemap.flags = $gameMap.tileset().flags;
    
    // Add to the spriteset
    this._baseSprite.addChild(this._tilemap);
};

// Update tilemap when scrolling
Game_Map.prototype.scrollDown = function(distance) {
    this._displayY = Math.min(this._displayY + distance, this.height() - this.screenTileY());
    this._parallaxY += distance;
    this._tilemap.origin.y = this._displayY * this.tileHeight();
};

// Update tilemap when changing maps
Game_Map.prototype.setup = function(mapId) {
    this._mapId = mapId;
    this._tilesetId = $dataMap.tilesetId;
    this._displayX = 0;
    this._displayY = 0;
    this.setupData();
    this.setupParallax();
    this.setupBattleback();
    this.setupTilemap();
    this.refresh();
};
```

### Event Layer Integration
```javascript
// Layer ordering in Spriteset_Map
Spriteset_Map.prototype.createLowerLayer = function() {
    Spriteset_Base.prototype.createLowerLayer.call(this);
    this.createParallax();
    this.createTilemap();
    this.createCharacters();
    this.createShadow();
    this.createWeather();
};

// Create character sprites on the map
Spriteset_Map.prototype.createCharacters = function() {
    this._characterSprites = [];
    for (const event of $gameMap.events()) {
        this._characterSprites.push(new Sprite_Character(event));
    }
    for (const vehicle of $gameMap.vehicles()) {
        this._characterSprites.push(new Sprite_Character(vehicle));
    }
    for (const follower of $gamePlayer.followers().reverseData()) {
        this._characterSprites.push(new Sprite_Character(follower));
    }
    this._characterSprites.push(new Sprite_Character($gamePlayer));
    for (const sprite of this._characterSprites) {
        this._tilemap.addChild(sprite);
    }
};
```