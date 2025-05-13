# RPG Maker MZ - Resource Management System

The resource management system in RPG Maker MZ handles the loading, caching, and management of game assets like images, audio, and data files.

## Core Components

### ImageManager
- Located in `rmmz_managers/ImageManager.js`
- Manages loading and caching of game images
- Categorizes images by type (characters, tilesets, etc.)
- Handles error states for missing images

### AudioManager
- Located in `rmmz_managers/AudioManager.js`
- Manages loading and playback of audio files
- Controls volume, pitch, and pan for different audio types
- Handles audio buffering and fading effects

### FontManager
- Located in `rmmz_managers/FontManager.js`
- Manages font loading and availability checking
- Handles fallback fonts if primary fonts are unavailable

### DataManager
- Located in `rmmz_managers/DataManager.js`
- Loads and processes game data files
- Manages save/load operations
- Handles database initialization and processing

## Image Resource Management

### Image Categories
RPG Maker MZ organizes images into directories by type:

- `img/animations/`: Animation images
- `img/battlebacks1/`: Battle background (ground) images
- `img/battlebacks2/`: Battle background (wall) images
- `img/characters/`: Character sprite sheets
- `img/enemies/`: Enemy battle sprites
- `img/faces/`: Character face portraits
- `img/parallaxes/`: Parallax background images
- `img/pictures/`: Pictures for events and menus
- `img/sv_actors/`: Side-view actor battler sprites
- `img/sv_enemies/`: Side-view enemy battler sprites
- `img/system/`: System UI images
- `img/tilesets/`: Map tileset images
- `img/titles1/`: Title screen background images
- `img/titles2/`: Title screen foreground images

### Image Loading Methods
```javascript
// Load images by category
const actorBitmap = ImageManager.loadCharacter("Actor1");
const faceBitmap = ImageManager.loadFace("Actor1");
const enemyBitmap = ImageManager.loadEnemy("Slime");
const titleBitmap = ImageManager.loadTitle1("Castle");
const systemBitmap = ImageManager.loadSystem("Window");
const tilesetBitmap = ImageManager.loadTileset("Outside");

// Check if image is ready
if (actorBitmap.isReady()) {
    // Use the bitmap
}

// Register bitmap load callback
actorBitmap.addLoadListener(() => {
    // Do something when bitmap loads
});
```

### Image Cache Management
```javascript
// Clear image cache
ImageManager.clear();

// Clear specific image category
ImageManager.clearRequest("characters");

// Reserve specific image (prevent unloading)
ImageManager.reserveCharacter("Actor1");
```

## Audio Resource Management

### Audio Categories
Audio files are organized into directories by type:

- `audio/bgm/`: Background music
- `audio/bgs/`: Background sounds
- `audio/me/`: Music effects
- `audio/se/`: Sound effects

### Audio Loading and Playback
```javascript
// Play background music
AudioManager.playBgm({
    name: "Battle1",   // Filename without extension
    volume: 90,        // Volume (0-100)
    pitch: 100,        // Pitch (50-150)
    pan: 0             // Pan (-100 to 100)
});

// Play sound effect
AudioManager.playSe({
    name: "Attack1",
    volume: 90,
    pitch: 100,
    pan: 0
});

// Check if specific audio is playing
const isBgmPlaying = AudioManager.isCurrentBgm(bgm);
const isBgsPlaying = AudioManager.isCurrentBgs(bgs);

// Fade audio
AudioManager.fadeOutBgm(3);  // Fade out over 3 seconds
AudioManager.fadeInBgm(3);   // Fade in over 3 seconds
```

### Audio Cache Management
```javascript
// Check audio file existence
const exists = AudioManager.checkWebAudioError();

// Create and cache audio buffer
const buffer = AudioManager.createBuffer(folder, name);

// Clear audio cache
AudioManager.cleanupAll();
```

## Data Resource Management

### Data Categories
RPG Maker MZ loads several JSON data files:

- `data/Actors.json`: Actor data
- `data/Classes.json`: Class data
- `data/Items.json`: Item data
- `data/Weapons.json`: Weapon data
- `data/Armors.json`: Armor data
- `data/Enemies.json`: Enemy data
- `data/Troops.json`: Troop data
- `data/Skills.json`: Skill data
- `data/States.json`: State data
- `data/Animations.json`: Animation data
- `data/Tilesets.json`: Tileset data
- `data/CommonEvents.json`: Common event data
- `data/System.json`: System data
- `data/MapInfos.json`: Map info data
- `data/Map*.json`: Individual map data

### Data Loading Methods
```javascript
// Load game database
DataManager.loadDatabase();

// Load specific data file
DataManager.loadDataFile("$dataItems", "Items.json");

// Check if database is loaded
if (DataManager.isDatabaseLoaded()) {
    // Database ready
}

// Load map data
DataManager.loadMapData(mapId);

// Check if map is loaded
if (DataManager.isMapLoaded()) {
    // Map ready
}
```

## Resource Loading Process

### Loading Sequence
1. **Request Resource**: Call appropriate manager method
2. **Create Placeholder**: Return object that will hold resource
3. **Start Load**: Begin asynchronous loading
4. **Process Load**: When loaded, process the resource
5. **Cache Resource**: Store in memory for future use
6. **Notify Listeners**: Trigger callbacks for loaded resource

```javascript
// Bitmap loading process (simplified)
ImageManager.loadBitmap = function(folder, filename) {
    if (filename) {
        const url = this.createPath(folder, filename);
        const bitmap = this.loadNormalBitmap(url);
        return bitmap;
    } else {
        return this.loadEmptyBitmap();
    }
};

// Load callback system
Bitmap.prototype.addLoadListener = function(listener) {
    if (this.isReady()) {
        listener(this);
    } else {
        this._loadListeners.push(listener);
    }
};
```

## Resource Management Optimization

### Cache Control
```javascript
// Manage image cache size
ImageManager.setCacheLimit(10); // Set max number of items in cache

// Check if resources should be released
ImageManager.shouldReleaseResource();

// Release least recently used resources
ImageManager.releaseLeastRecentlyUsed();
```

### Preloading Resources
```javascript
// Preload commonly used resources
ImageManager.reserveCharacter("Actor1");
ImageManager.reserveCharacter("Actor2");
ImageManager.reserveSystem("IconSet");
ImageManager.reserveFace("Actor1");
AudioManager.preloadBgm("Battle1");

// Preload map resources
Scene_Map.prototype.preloadResources = function() {
    const mapId = $gamePlayer.newMapId();
    DataManager.loadMapData(mapId);
    
    // Preload tileset images
    const tileset = $gameMap.tileset();
    if (tileset) {
        ImageManager.reserveTileset(tileset.tilesetName);
    }
    
    // Preload character images
    for (const event of $gameMap.events()) {
        ImageManager.reserveCharacter(event.characterName());
    }
    
    ImageManager.reserveCharacter($gamePlayer.characterName());
};
```

### Memory Management
```javascript
// Check memory usage
const isLow = ImageManager.isLowMemory();

// Trigger garbage collection (indirectly)
Graphics.callGC();
```

## Custom Resource Extensions

### Adding New Resource Types
```javascript
// Add support for new resource type
ImageManager.loadCustomResource = function(filename) {
    const url = "img/custom/" + Utils.encodeURI(filename) + ".png";
    return this.loadNormalBitmap(url);
};

// Add preload method for the resource
ImageManager.reserveCustomResource = function(filename) {
    this.reserveBitmap("img/custom/", filename);
};
```

### Resource Path Customization
```javascript
// Override resource path creation
ImageManager._createPath = ImageManager.createPath;
ImageManager.createPath = function(folder, filename) {
    if (filename.startsWith("http")) {
        // Allow absolute URLs for external resources
        return filename;
    } else {
        return this._createPath(folder, filename);
    }
};
```