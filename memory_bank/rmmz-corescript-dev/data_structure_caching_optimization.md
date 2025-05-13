# RPG Maker MZ - Data Caching and Optimization

This document explores how RPG Maker MZ manages memory usage, optimizes data access, and implements caching mechanisms to enhance performance.

## Cache Management

RPG Maker MZ implements sophisticated caching mechanisms to optimize the loading and reuse of game resources.

### Image Manager Cache

The `ImageManager` maintains a cache of loaded images to prevent unnecessary reloading:

```javascript
// ImageManager cache implementation
ImageManager._cache = {};
ImageManager._systemReservationId = Utils.generateRuntimeId();

// Get from cache or load new bitmap
ImageManager.loadBitmap = function(folder, filename) {
    if (filename) {
        const url = folder + Utils.encodeURI(filename) + ".png";
        return this.loadBitmapFromUrl(url);
    } else {
        return this._emptyBitmap;
    }
};

// Load bitmap from URL using cache
ImageManager.loadBitmapFromUrl = function(url) {
    const cache = this._cache;
    if (!cache[url]) {
        cache[url] = Bitmap.load(url);
    }
    return cache[url];
};

// Clear cached image
ImageManager.clear = function() {
    this._cache = {};
};

// Reserve memory for system resources
ImageManager.reserveSystem = function() {
    this.reserveBitmap("system/", this._systemReservationId);
};

// Remove cached system resources
ImageManager.releaseSystem = function() {
    this.releaseBitmap("system/", this._systemReservationId);
};
```

### Audio Manager Cache

The `AudioManager` caches audio resources for efficient playback:

```javascript
// AudioManager cache implementation
AudioManager._cache = {};
AudioManager._masterVolume = 1;

// Load and cache audio
AudioManager.createBuffer = function(folder, name) {
    const url = this._path + folder + "/" + Utils.encodeURI(name) + this.audioFileExt();
    
    // Check cache first
    if (this.shouldUseHtml5Audio() && folder === "bgm") {
        if (this._blobUrl) {
            URL.revokeObjectURL(this._blobUrl);
        }
        this._blobUrl = null;
        return Html5Audio.setup(url);
    } else {
        if (!this._cache[url]) {
            this._cache[url] = new WebAudio(url);
        }
        return this._cache[url];
    }
};

// Handle cache clearing on scene changes
AudioManager.checkErrors = function() {
    this.checkWebAudioError();
    this.checkHtml5AudioError();
};

// Clear unused audio resources
AudioManager.clear = function() {
    this.stopAll();
    this._cache = {};
};
```

## Memory Management

RPG Maker MZ uses various techniques to manage memory efficiently during gameplay.

### Texture Atlas and Sprite Batching

```javascript
// Sprite batch management in PIXI.js integration
Graphics._createRenderer = function() {
    // Try using WebGL with batch settings for optimal performance
    try {
        const options = {
            view: this._canvas,
            transparent: true,
            autoDensity: true,
            antialias: this._antialias
        };
        
        // Set up texture batching for performance
        PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(
            PIXI.settings.SPRITE_MAX_TEXTURES, 16
        );
        
        // Create WebGL renderer
        this._renderer = new PIXI.Renderer(options);
        
        // Create fallback canvas renderer
        if (!this._renderer) {
            this._renderer = new PIXI.CanvasRenderer(options);
        }
    } catch (e) {
        // Fallback to canvas renderer
        this._renderer = new PIXI.CanvasRenderer(options);
    }
};
```

### Memory Usage Monitoring

```javascript
// Game_System memory monitoring capability
Game_System.prototype.updateMemoryUsage = function() {
    if (Utils.isNwjs() && process && process.memoryUsage) {
        this._currentMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        
        // Log warning if memory usage is very high
        if (this._currentMemoryUsage > 200) {
            console.warn("High memory usage: " + this._currentMemoryUsage.toFixed(2) + " MB");
        }
    }
};

// Optional performance monitoring
Game_System.prototype.getMemoryInfo = function() {
    let memoryInfo = "";
    
    if (Utils.isNwjs() && process && process.memoryUsage) {
        const usage = process.memoryUsage();
        memoryInfo = "Heap: " + (usage.heapUsed / 1024 / 1024).toFixed(2) + " MB / " +
                     (usage.heapTotal / 1024 / 1024).toFixed(2) + " MB";
    }
    
    return memoryInfo;
};
```

### Bitmap Management

```javascript
// Bitmap memory management
Bitmap.prototype.destroy = function() {
    if (this._baseTexture) {
        this._baseTexture.destroy();
        this._baseTexture = null;
    }
    
    this._image = null;
    this._canvas = null;
    this._context = null;
    this._destroyed = true;
};

// Bitmap smart destruction through reference counting
ImageManager.releaseBitmap = function(folder, filename) {
    const url = folder + Utils.encodeURI(filename) + ".png";
    
    if (this._cache[url]) {
        this._cache[url]._referenceCount--;
        if (this._cache[url]._referenceCount === 0) {
            this._cache[url].destroy();
            delete this._cache[url];
        }
    }
};
```

## Resource Preloading

RPG Maker MZ preloads resources to ensure smooth gameplay transitions.

### Map Resource Preloading

```javascript
// Pre-load resources for upcoming maps
Game_Player.prototype.reserveTransfer = function(mapId, x, y, d, fadeType) {
    this._transferring = true;
    this._newMapId = mapId;
    this._newX = x;
    this._newY = y;
    this._newDirection = d;
    this._fadeType = fadeType;
    
    // Pre-load map data and tileset images
    if (mapId > 0) {
        DataManager.loadMapData(mapId);
        
        // Pre-load tileset images when map data is available
        if ($dataMap && $dataMap.tilesetId > 0) {
            const tileset = $dataTilesets[$dataMap.tilesetId];
            if (tileset) {
                // Pre-load tileset images
                for (const filename of tileset.tilesetNames) {
                    if (filename) {
                        ImageManager.loadTileset(filename);
                    }
                }
            }
        }
    }
};
```

### Battle Resource Preloading

```javascript
// Pre-load resources for upcoming battles
BattleManager.setup = function(troopId, canEscape, canLose) {
    this.initMembers();
    this._canEscape = canEscape;
    this._canLose = canLose;
    
    // Set up troop and preload resources
    $gameTroop.setup(troopId);
    
    // Pre-load enemy battler images
    for (const enemy of $gameTroop.members()) {
        if (enemy && enemy.battlerName()) {
            ImageManager.loadEnemy(enemy.battlerName());
        }
    }
    
    // Pre-load actor battler images 
    for (const actor of $gameParty.members()) {
        if (actor) {
            ImageManager.loadFace(actor.faceName());
            if (actor.battlerName()) {
                ImageManager.loadSvActor(actor.battlerName());
            }
        }
    }
    
    // Pre-load battle back images
    this.preloadBattleback();
    
    // Make preparations
    this._action = null;
    this._phase = "init";
    this._preemptive = Math.random() < this._preemptiveRate;
    this._surprise = Math.random() < this._surpriseRate;
};

// Pre-load battleback images
BattleManager.preloadBattleback = function() {
    if ($gameMap.battleback1Name()) {
        ImageManager.loadBattleback1($gameMap.battleback1Name());
    }
    
    if ($gameMap.battleback2Name()) {
        ImageManager.loadBattleback2($gameMap.battleback2Name());
    }
};
```

## Data Access Optimization

### Efficient Object Lookup

RPG Maker MZ uses indexing and hash maps for efficient data access:

```javascript
// Game_Actors efficient lookup
Game_Actors.prototype.initialize = function() {
    this._data = {};
};

Game_Actors.prototype.actor = function(actorId) {
    if (!this._data[actorId]) {
        this._data[actorId] = new Game_Actor(actorId);
    }
    return this._data[actorId];
};

// Game_SelfSwitches hash-based lookup
Game_SelfSwitches.prototype.setValue = function(key, value) {
    this._data[key] = value;
    this.onChange();
};

Game_SelfSwitches.prototype.value = function(key) {
    return !!this._data[key];
};
```

### Lazy Initialization

Components are initialized only when needed:

```javascript
// Lazy initialization of game objects
Scene_Map.prototype.lazyInitialize = function() {
    // Only initialize components as needed
    if (!this._mapNameWindow) {
        this._mapNameWindow = new Window_MapName();
        this.addChild(this._mapNameWindow);
    }
    
    if (!this._messageWindow) {
        this._messageWindow = new Window_Message();
        this.addWindow(this._messageWindow);
        this._messageWindow.subWindows().forEach(window => {
            this.addWindow(window);
        });
    }
};

// Lazy creation of windows
Scene_Menu.prototype.createCommandWindow = function() {
    const rect = this.commandWindowRect();
    this._commandWindow = new Window_MenuCommand(rect);
    this._commandWindow.setHandler("item", this.commandItem.bind(this));
    this._commandWindow.setHandler("skill", this.commandPersonal.bind(this));
    this._commandWindow.setHandler("equip", this.commandPersonal.bind(this));
    this._commandWindow.setHandler("status", this.commandPersonal.bind(this));
    this._commandWindow.setHandler("formation", this.commandFormation.bind(this));
    this._commandWindow.setHandler("options", this.commandOptions.bind(this));
    this._commandWindow.setHandler("save", this.commandSave.bind(this));
    this._commandWindow.setHandler("gameEnd", this.commandGameEnd.bind(this));
    this._commandWindow.setHandler("cancel", this.popScene.bind(this));
    this.addWindow(this._commandWindow);
};
```

## Data Persistence Optimization

### Incremental Save/Load

Only serialize data that has changed:

```javascript
// Optimized save content creation
DataManager.makeSaveContents = function() {
    // Only include changed switches
    const compressedSwitches = this.compressSwitches($gameSwitches);
    
    // Only include changed variables
    const compressedVariables = this.compressVariables($gameVariables);
    
    // Contents of save file
    const contents = {};
    contents.system = $gameSystem;
    contents.screen = $gameScreen;
    contents.timer = $gameTimer;
    contents.switches = compressedSwitches;
    contents.variables = compressedVariables;
    contents.selfSwitches = $gameSelfSwitches;
    contents.actors = $gameActors;
    contents.party = $gameParty;
    contents.map = $gameMap;
    contents.player = $gamePlayer;
    return contents;
};

// Compress switches to save only ones that are true
DataManager.compressSwitches = function(switches) {
    const result = {};
    const data = switches._data;
    
    for (let i = 1; i < data.length; i++) {
        if (data[i] === true) {
            result[i] = true;
        }
    }
    
    return result;
};

// Compress variables to save only non-zero/non-empty ones
DataManager.compressVariables = function(variables) {
    const result = {};
    const data = variables._data;
    
    for (let i = 1; i < data.length; i++) {
        if (data[i] !== 0 && data[i] !== "" && data[i] !== undefined && data[i] !== null) {
            result[i] = data[i];
        }
    }
    
    return result;
};

// Extract compressed data
DataManager.extractSaveContents = function(contents) {
    $gameSystem = contents.system;
    $gameScreen = contents.screen;
    $gameTimer = contents.timer;
    
    // Expand compressed switches and variables
    this.expandSwitches(contents.switches);
    this.expandVariables(contents.variables);
    
    $gameSelfSwitches = contents.selfSwitches;
    $gameActors = contents.actors;
    $gameParty = contents.party;
    $gameMap = contents.map;
    $gamePlayer = contents.player;
};

// Expand compressed switches
DataManager.expandSwitches = function(compressedSwitches) {
    $gameSwitches = new Game_Switches();
    
    for (const id in compressedSwitches) {
        if (compressedSwitches.hasOwnProperty(id)) {
            $gameSwitches.setValue(Number(id), compressedSwitches[id]);
        }
    }
};

// Expand compressed variables
DataManager.expandVariables = function(compressedVariables) {
    $gameVariables = new Game_Variables();
    
    for (const id in compressedVariables) {
        if (compressedVariables.hasOwnProperty(id)) {
            $gameVariables.setValue(Number(id), compressedVariables[id]);
        }
    }
};
```

### Optimized LZ Compression

```javascript
// Custom LZ compression optimization
StorageManager.saveToWebStorage = function(savefileId, json) {
    const key = this.webStorageKey(savefileId);
    
    // Use optimized compression for large saves
    if (json.length > 200000) {
        const data = this.compressLargeData(json);
        localStorage.setItem(key, data);
    } else {
        // Standard compression for small saves
        const data = LZString.compressToBase64(json);
        localStorage.setItem(key, data);
    }
};

// Compression optimization for large data
StorageManager.compressLargeData = function(json) {
    // For very large data, split into chunks
    const chunkSize = 100000;
    const chunks = [];
    
    for (let i = 0; i < json.length; i += chunkSize) {
        const chunk = json.substr(i, chunkSize);
        chunks.push(LZString.compressToBase64(chunk));
    }
    
    // Store as chunked data
    return "CHUNKED" + chunks.length + ":" + chunks.join(",");
};

// Matching decompression logic
StorageManager.loadFromWebStorage = function(savefileId) {
    const key = this.webStorageKey(savefileId);
    const data = localStorage.getItem(key);
    
    if (data) {
        // Check if data was stored in chunks
        if (data.startsWith("CHUNKED")) {
            return this.decompressChunkedData(data);
        } else {
            return LZString.decompressFromBase64(data);
        }
    } else {
        return null;
    }
};

// Decompress chunked data
StorageManager.decompressChunkedData = function(data) {
    // Parse chunk info
    const header = data.match(/CHUNKED(\d+):/)[0];
    const chunks = data.slice(header.length).split(",");
    
    // Reconstruct data from chunks
    let result = "";
    for (const chunk of chunks) {
        result += LZString.decompressFromBase64(chunk);
    }
    
    return result;
};
```

## Garbage Collection Optimization

RPG Maker MZ works to minimize garbage collection pauses.

### Object Pooling

```javascript
// Sprite pool to reduce GC pressure
Spriteset_Map.prototype.createCharacters = function() {
    this._characterSprites = [];
    this._characterSpritePool = [];
    this._characterSpritesMaxSize = 100; // Reasonable max
    
    // Create initial pool of sprites
    for (let i = 0; i < 20; i++) {
        this._characterSpritePool.push(new Sprite_Character(null));
    }
    
    // Create active sprites
    for (const event of $gameMap.events()) {
        this._characterSprites.push(this.createCharacterSprite(event));
    }
    
    // Player and followers
    for (const vehicle of $gameMap.vehicles()) {
        this._characterSprites.push(this.createCharacterSprite(vehicle));
    }
    
    this._characterSprites.push(this.createCharacterSprite($gamePlayer));
    
    for (const follower of $gamePlayer.followers().reverseData()) {
        this._characterSprites.push(this.createCharacterSprite(follower));
    }
    
    for (const sprite of this._characterSprites) {
        this._tilemap.addChild(sprite);
    }
};

// Get sprite from pool or create new one
Spriteset_Map.prototype.createCharacterSprite = function(character) {
    if (this._characterSpritePool.length > 0) {
        const sprite = this._characterSpritePool.pop();
        sprite.setCharacter(character);
        return sprite;
    } else {
        return new Sprite_Character(character);
    }
};

// Return sprite to pool
Spriteset_Map.prototype.removeCharacterSprite = function(sprite) {
    this._tilemap.removeChild(sprite);
    
    // Reset sprite for reuse
    sprite.setCharacter(null);
    
    // Add to pool if not full
    if (this._characterSpritePool.length < this._characterSpritesMaxSize) {
        this._characterSpritePool.push(sprite);
    }
};
```

### Manual Reference Clearing

```javascript
// Manual reference clearing to help garbage collection
Scene_Base.prototype.terminate = function() {
    // Clear references before scene change
    this._active = false;
    this._fadeSign = 0;
    this._fadeDuration = 0;
    this._fadeSprite = null;
    this._windowLayer = null;
    this._colorFilter = null;
};

// Dispose resources for tilemap
Tilemap.prototype.destroy = function() {
    // Clear tilemap data to release memory
    const options = { children: true, texture: true };
    PIXI.Container.prototype.destroy.call(this, options);
    
    // Clear tilemap data
    this._mapData = null;
    this._bitmaps = [];
    
    // Clear layer references
    if (this._lowerLayer) {
        this._lowerLayer.destroy();
        this._lowerLayer = null;
    }
    
    if (this._upperLayer) {
        this._upperLayer.destroy();
        this._upperLayer = null;
    }
};
```

## Map Data Optimization

### Tile Caching

```javascript
// Tile renderer optimization
ShaderTilemap.prototype._updateLayerTextures = function() {
    // Only update layers that have changed
    if (this._needsTextureUpdate) {
        this._lowerLayer.setBitmaps(this._bitmaps);
        this._lowerLayer.clearFrames();
        this._upperLayer.setBitmaps(this._bitmaps);
        this._upperLayer.clearFrames();
        this._needsTextureUpdate = false;
    }
    
    // Only redraw layers that have changed
    if (this._needsLowerUpdate) {
        this._lowerLayer.addRect(this._upperViewportRect);
        this._needsLowerUpdate = false;
    }
    
    if (this._needsUpperUpdate) {
        this._upperLayer.addRect(this._upperViewportRect);
        this._needsUpperUpdate = false;
    }
};

// Optimized tilemap drawing with dirty rectangle management
Tilemap.prototype._paintAllTiles = function(startX, startY) {
    // Draw region
    const tileCols = Math.ceil(this._width / this._tileWidth) + 1;
    const tileRows = Math.ceil(this._height / this._tileHeight) + 1;
    
    // Track changed regions
    if (!this._lastStartX) {
        this._lastStartX = startX;
        this._lastStartY = startY;
        this._dirtyRegions = [];
    } else if (this._lastStartX !== startX || this._lastStartY !== startY) {
        // Only redraw regions that have changed
        const deltaX = this._lastStartX - startX;
        const deltaY = this._lastStartY - startY;
        
        if (Math.abs(deltaX) <= tileCols && Math.abs(deltaY) <= tileRows) {
            // Redraw just the exposed regions
            if (deltaX !== 0) {
                const region = {
                    x: deltaX > 0 ? tileCols - deltaX : 0,
                    y: 0,
                    width: Math.abs(deltaX),
                    height: tileRows
                };
                this._dirtyRegions.push(region);
            }
            
            if (deltaY !== 0) {
                const region = {
                    x: 0,
                    y: deltaY > 0 ? tileRows - deltaY : 0,
                    width: tileCols,
                    height: Math.abs(deltaY)
                };
                this._dirtyRegions.push(region);
            }
        } else {
            // Full redraw needed
            this._dirtyRegions = [{
                x: 0,
                y: 0,
                width: tileCols,
                height: tileRows
            }];
        }
        
        this._lastStartX = startX;
        this._lastStartY = startY;
    }
    
    // Only draw tiles in dirty regions
    for (const region of this._dirtyRegions) {
        this._paintTilesInRegion(startX, startY, region);
    }
    
    this._dirtyRegions = [];
};
```

## Data Loading Optimizations

### Progressive Loading

```javascript
// Progressive loading for large maps
Scene_Map.prototype.onMapLoaded = function() {
    if (this._transfer) {
        // Prioritize player area first for fast map transitions
        this.prioritizePlayerArea();
        
        $gamePlayer.performTransfer();
        this._transfer = false;
    }
    
    this.createDisplayObjects();
    this.loadRemainingMapAssets();
};

// Prioritize loading tiles around player first
Scene_Map.prototype.prioritizePlayerArea = function() {
    const playerX = $gamePlayer.x;
    const playerY = $gamePlayer.y;
    const priorityRadius = 10;
    
    // Calculate priority region
    const startX = Math.max(0, playerX - priorityRadius);
    const startY = Math.max(0, playerY - priorityRadius);
    const endX = Math.min($gameMap.width(), playerX + priorityRadius);
    const endY = Math.min($gameMap.height(), playerY + priorityRadius);
    
    // Pre-load tiles around player
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tileId1 = $gameMap.tileId(x, y, 0);
            const tileId2 = $gameMap.tileId(x, y, 1);
            const tileId3 = $gameMap.tileId(x, y, 2);
            const tileId4 = $gameMap.tileId(x, y, 3);
            
            // Pre-decode important tiles
            this.preTileDecode(tileId1);
            this.preTileDecode(tileId2);
            this.preTileDecode(tileId3);
            this.preTileDecode(tileId4);
        }
    }
};

// Load remaining assets in background
Scene_Map.prototype.loadRemainingMapAssets = function() {
    // Load remaining tileset images
    const tileset = $gameMap.tileset();
    for (const name of tileset.tilesetNames) {
        if (name) {
            ImageManager.loadTileset(name);
        }
    }
    
    // Load character sets
    // Process in background to avoid frame drops
    this._remainingEventsToLoad = $gameMap.events().slice();
    this._characterLoadTimer = 3;
};

// Update loading of character assets
Scene_Map.prototype.updateAssetLoading = function() {
    if (this._characterLoadTimer > 0) {
        this._characterLoadTimer--;
        return;
    }
    
    // Load a batch of characters each frame
    const batchSize = 5;
    const batch = this._remainingEventsToLoad.splice(0, batchSize);
    
    for (const event of batch) {
        if (event && event.characterName()) {
            ImageManager.loadCharacter(event.characterName());
        }
    }
    
    // Reset timer for next batch
    if (this._remainingEventsToLoad.length > 0) {
        this._characterLoadTimer = 1;
    }
};
```

## JSON Processing Optimizations

```javascript
// Optimized JSON processing
JsonEx._decode = function(value) {
    // Handle simple types directly
    if (value === null || value === undefined || 
        typeof value === "number" || 
        typeof value === "string" || 
        typeof value === "boolean") {
        return value;
    }
    
    // Quick handling of arrays
    if (Array.isArray(value)) {
        const result = [];
        for (let i = 0; i < value.length; i++) {
            result[i] = this._decode(value[i]);
        }
        return result;
    }
    
    // Object processing
    if (typeof value === "object") {
        // Check if this is a special encoded object
        if (value[this._specialKey]) {
            const constructorName = value[this._specialKey];
            
            // Handle special cases directly
            if (constructorName === "RPG.Map") {
                return this._decodeMap(value);
            }
            
            // Handle special classes efficiently
            const constructor = this._registry[constructorName];
            if (constructor) {
                const obj = new constructor();
                for (const key in value) {
                    if (key !== this._specialKey) {
                        obj[key] = this._decode(value[key]);
                    }
                }
                return obj;
            }
        }
        
        // Regular object
        const obj = {};
        for (const key in value) {
            obj[key] = this._decode(value[key]);
        }
        return obj;
    }
    
    // Fallback
    return value;
};

// Specialized map decoding for performance
JsonEx._decodeMap = function(value) {
    const obj = new Game_Map();
    
    // Directly set large data arrays instead of decoding each element
    if (value.data && Array.isArray(value.data) && value.data.length > 1000) {
        obj.data = value.data.slice(); // Fast array copy
    }
    
    // Process other properties
    for (const key in value) {
        if (key !== this._specialKey && key !== "data") {
            obj[key] = this._decode(value[key]);
        }
    }
    
    return obj;
};
```

## Mobile Optimizations

```javascript
// Mobile-specific optimizations
TouchInput._setupEventHandlers = function() {
    const isMobileDevice = Utils.isMobileDevice();
    
    // Different event handlers based on platform
    if (isMobileDevice) {
        // Optimized mobile touch handlers
        document.addEventListener("touchstart", this._onTouchStart.bind(this));
        document.addEventListener("touchmove", this._onTouchMove.bind(this));
        document.addEventListener("touchend", this._onTouchEnd.bind(this));
        document.addEventListener("touchcancel", this._onTouchCancel.bind(this));
        
        // Disable some features on mobile for performance
        this._analogMove = false; // Simplify input processing
        this._touchDragThreshold = 10; // Higher threshold to reduce processing
    } else {
        // Full desktop handlers
        document.addEventListener("mousedown", this._onMouseDown.bind(this));
        document.addEventListener("mousemove", this._onMouseMove.bind(this));
        document.addEventListener("mouseup", this._onMouseUp.bind(this));
        document.addEventListener("wheel", this._onWheel.bind(this));
        
        this._analogMove = true;
        this._touchDragThreshold = 5;
    }
};

// Mobile graphics optimizations
Graphics._createRenderer = function() {
    const options = {
        view: this._canvas,
        transparent: true,
        autoDensity: true
    };
    
    // Mobile-specific rendering options
    if (Utils.isMobileDevice()) {
        options.resolution = this.getOptimalResolution();
        options.antialias = false; // Disable antialiasing on mobile
        this._skipCount = 1; // Skip some frames on mobile
    } else {
        options.antialias = this._antialias;
    }
    
    try {
        this._renderer = new PIXI.Renderer(options);
    } catch (e) {
        this._renderer = new PIXI.CanvasRenderer(options);
    }
};

// Get optimal resolution based on device
Graphics.getOptimalResolution = function() {
    // Calculate based on device pixel ratio and performance
    const pixelRatio = window.devicePixelRatio || 1;
    const performance = window.performance || { memory: {} };
    
    // Limit resolution on low-memory devices
    if (performance.memory && performance.memory.jsHeapSizeLimit) {
        const memory = performance.memory.jsHeapSizeLimit / 1048576; // MB
        if (memory < 200) {
            return Math.min(pixelRatio, 1.5);
        } else if (memory < 500) {
            return Math.min(pixelRatio, 2);
        }
    }
    
    return pixelRatio;
};
```