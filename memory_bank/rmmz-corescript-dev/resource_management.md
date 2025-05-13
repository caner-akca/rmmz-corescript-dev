# RPG Maker MZ - Resource Management

This document details how RPG Maker MZ manages resources like images, audio, and other assets, including loading processes, caching mechanisms, and memory optimization techniques.

## Core Components

### ImageManager
- Located in `rmmz_managers/ImageManager.js`
- Handles loading and caching of all game images
- Manages preloading, on-demand loading, and purging
- Supports various image categories (characters, tilesets, etc.)

### AudioManager
- Located in `rmmz_managers/AudioManager.js`
- Manages audio loading and playback
- Handles BGM (background music), BGS (background sounds), ME (music effects), and SE (sound effects)

### FontManager
- Located in `rmmz_managers/FontManager.js`
- Handles loading and initialization of custom fonts
- Ensures fonts are loaded before they're needed for text rendering

### EffectManager
- Located in `rmmz_managers/EffectManager.js`
- Manages loading and playback of Effekseer animations (MZ's animation system)

## Image Resource Management

### Image Loading System
```javascript
// Load different image types
ImageManager.loadAnimation = function(filename) {
    return this.loadBitmap("img/animations/", filename);
};

ImageManager.loadBattleback1 = function(filename) {
    return this.loadBitmap("img/battlebacks1/", filename);
};

ImageManager.loadCharacter = function(filename) {
    return this.loadBitmap("img/characters/", filename);
};

ImageManager.loadFace = function(filename) {
    return this.loadBitmap("img/faces/", filename);
};

ImageManager.loadParallax = function(filename) {
    return this.loadBitmap("img/parallaxes/", filename);
};

ImageManager.loadPicture = function(filename) {
    return this.loadBitmap("img/pictures/", filename);
};

ImageManager.loadSvActor = function(filename) {
    return this.loadBitmap("img/sv_actors/", filename);
};

ImageManager.loadSvEnemy = function(filename) {
    return this.loadBitmap("img/sv_enemies/", filename);
};

ImageManager.loadSystem = function(filename) {
    return this.loadBitmap("img/system/", filename);
};

ImageManager.loadTileset = function(filename) {
    return this.loadBitmap("img/tilesets/", filename);
};

ImageManager.loadTitle1 = function(filename) {
    return this.loadBitmap("img/titles1/", filename);
};

ImageManager.loadTitle2 = function(filename) {
    return this.loadBitmap("img/titles2/", filename);
};
```

### Bitmap Loading and Caching
```javascript
// Core bitmap loading function
ImageManager.loadBitmap = function(folder, filename) {
    if (filename) {
        const url = folder + Utils.encodeURI(filename) + ".png";
        return this.loadNormalBitmap(url);
    } else {
        return this.loadEmptyBitmap();
    }
};

// Load a bitmap and cache it
ImageManager.loadNormalBitmap = function(url) {
    const cache = this._imageCache;
    const bitmap = cache.get(url);
    if (!bitmap) {
        // Create and cache new bitmap if not in cache
        const newBitmap = new Bitmap(0, 0);
        newBitmap.addLoadListener(() => this._callCreationHook(newBitmap));
        newBitmap._url = url;
        newBitmap._baseTexture.loadSource(newBitmap);
        cache.add(url, newBitmap);
        return newBitmap;
    } else {
        // Return bitmap from cache
        return bitmap;
    }
};

// Use a placeholder for empty bitmaps
ImageManager.loadEmptyBitmap = function() {
    let bitmap;
    if (!this._emptyBitmap) {
        bitmap = new Bitmap(1, 1);
        this._emptyBitmap = bitmap;
    } else {
        bitmap = this._emptyBitmap;
    }
    return bitmap;
};
```

### Image Cache System
```javascript
// Image cache implementation
function ImageCache() {
    this.initialize(...arguments);
}

ImageCache.prototype.initialize = function() {
    this._items = {};
    this._limit = 10 * 1000 * 1000; // 10MB
    this._lastRemovedUrl = null;
};

// Add bitmap to cache
ImageCache.prototype.add = function(key, value) {
    this._items[key] = {
        bitmap: value,
        touch: Date.now(),
        key: key
    };
    
    this._truncateCache();
};

// Get bitmap from cache
ImageCache.prototype.get = function(key) {
    if (this._items[key]) {
        const item = this._items[key];
        item.touch = Date.now();
        return item.bitmap;
    }
    return null;
};

// Remove least recently used items when cache is full
ImageCache.prototype._truncateCache = function() {
    const items = this._items;
    let sizeLeft = this._limit;
    
    let keys = Object.keys(items);
    for (const key of keys) {
        const bitmap = items[key].bitmap;
        if (bitmap.isReady()) {
            sizeLeft -= bitmap.width * bitmap.height * 4; // 4 bytes per pixel (RGBA)
        }
    }
    
    if (sizeLeft < 0) {
        // Remove least recently used bitmaps
        keys = Object.keys(items);
        keys.sort((a, b) => {
            return items[a].touch - items[b].touch;
        });
        
        while (sizeLeft < 0 && keys.length > 0) {
            const key = keys.shift();
            if (items[key]) {
                const bitmap = items[key].bitmap;
                if (bitmap.isReady()) {
                    sizeLeft += bitmap.width * bitmap.height * 4;
                }
                delete items[key];
                this._lastRemovedUrl = key;
            }
        }
    }
};
```

### Bitmap Class Implementation
```javascript
// Initialize a bitmap
Bitmap.prototype.initialize = function(width, height) {
    this._canvas = null;
    this._context = null;
    this._baseTexture = null;
    this._image = null;
    this._url = "";
    this._paintOpacity = 255;
    this._smooth = true;
    this._loadListeners = [];
    this._loadingState = "none";
    
    if (width > 0 && height > 0) {
        this._createCanvas(width, height);
    }
    
    // Create PIXI texture for rendering
    this._createBaseTexture(this._canvas);
    this._createPIXITexture();
};

// Load image
Bitmap.prototype._startLoading = function() {
    this._image = new Image();
    this._image.onload = this._onLoad.bind(this);
    this._image.onerror = this._onError.bind(this);
    this._destroyCanvas();
    this._loadingState = "loading";
    this._image.src = this._url;
};

// Handle image load complete
Bitmap.prototype._onLoad = function() {
    this._loadingState = "loaded";
    
    const image = this._image;
    if (image) {
        this._createCanvas(image.width, image.height);
        this._context.drawImage(image, 0, 0);
        this._setDirty();
    }
    
    this._callLoadListeners();
};

// Create PIXI base texture from image data
Bitmap.prototype._createBaseTexture = function(source) {
    this._baseTexture = new PIXI.BaseTexture(source);
    this._baseTexture.mipmap = false;
    this._baseTexture.width = source.width;
    this._baseTexture.height = source.height;
};
```

## Audio Resource Management

### Audio Loading System
```javascript
// Load and setup audio
AudioManager.createBuffer = function(folder, name) {
    const ext = this.audioFileExt();
    const url = this._path + folder + "/" + Utils.encodeURI(name) + ext;
    const buffer = new WebAudio(url);
    buffer.name = name;
    buffer.folder = folder;
    return buffer;
};

// Get audio file extension based on browser support
AudioManager.audioFileExt = function() {
    if (Utils.canPlayOgg() && !Utils.isAnyVersionOfIE()) {
        return ".ogg";
    } else {
        return ".m4a";
    }
};
```

### Audio Cache Management
```javascript
// Initialize audio cache
AudioManager.initialize = function() {
    this._path = "audio/";
    this._bgmVolume = 100;
    this._bgsVolume = 100;
    this._meVolume = 100;
    this._seVolume = 100;
    this._currentBgm = null;
    this._currentBgs = null;
    this._bgmBuffer = null;
    this._bgsBuffer = null;
    this._meBuffer = null;
    this._seBuffers = [];
    this._staticBuffers = [];
    this._replayFadeTime = 0.5;
    this._currentMe = null;
    this._audioCache = new Map();
};

// Get or create audio buffer with caching
AudioManager.createBuffer = function(folder, name) {
    const key = folder + ":" + name;
    let buffer = this._audioCache.get(key);
    if (!buffer) {
        const ext = this.audioFileExt();
        const url = this._path + folder + "/" + Utils.encodeURI(name) + ext;
        buffer = new WebAudio(url);
        buffer.name = name;
        buffer.folder = folder;
        this._audioCache.set(key, buffer);
    }
    return buffer;
};
```

### WebAudio Implementation
```javascript
// Initialize WebAudio
WebAudio.prototype.initialize = function(url) {
    this.clear();
    this._url = url;
    this._startLoading();
};

// Clear WebAudio data
WebAudio.prototype.clear = function() {
    this.stop();
    this._buffer = null;
    this._sourceNode = null;
    this._gainNode = null;
    this._pannerNode = null;
    this._totalTime = 0;
    this._sampleRate = 0;
    this._loopStart = 0;
    this._loopLength = 0;
    this._startTime = 0;
    this._volume = 1;
    this._pan = 0;
    this._pitch = 1;
    this._endTimer = null;
    this._loadListeners = [];
    this._stopListeners = [];
    this._hasError = false;
    this._autoPlay = false;
};

// Start loading audio file
WebAudio.prototype._startLoading = function() {
    if (WebAudio._context) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", this._url);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => this._onXhrLoad(xhr);
        xhr.onerror = this._onError.bind(this);
        xhr.send();
    }
};

// Process loaded audio data
WebAudio.prototype._onXhrLoad = function(xhr) {
    if (xhr.status < 400) {
        this._readLoopComments(new Uint8Array(xhr.response));
        WebAudio._context.decodeAudioData(
            xhr.response,
            buffer => this._onDecode(buffer),
            this._onError.bind(this)
        );
    } else {
        this._onError();
    }
};
```

## Font Management

### Font Loading and Detection
```javascript
// Initialize FontManager
FontManager.initialize = function() {
    this._urls = {};
    this._states = {};
};

// Load font file
FontManager.load = function(family, filename) {
    if (this._states[family] !== "loaded") {
        if (filename) {
            const url = "fonts/" + Utils.encodeURI(filename);
            if (this._states[family] !== "loading") {
                this._states[family] = "loading";
                this._urls[family] = url;
                this._createFontFace(family, url);
            }
        } else {
            this._states[family] = "loaded";
        }
    }
};

// Create CSS @font-face rule
FontManager._createFontFace = function(family, url) {
    // Create style element
    const style = document.createElement("style");
    const fontFace = `@font-face {
        font-family: "${family}";
        src: url("${url}");
    }`;
    style.textContent = fontFace;
    document.head.appendChild(style);
    
    // Create a span element with the font to start loading it
    const spanElement = document.createElement("span");
    spanElement.style.fontFamily = family;
    spanElement.style.visibility = "hidden";
    spanElement.style.position = "absolute";
    spanElement.innerHTML = ".";
    document.body.appendChild(spanElement);
    
    // Check font loading status
    this._checkFontLoaded(family, spanElement);
};

// Check if font is loaded
FontManager._checkFontLoaded = function(family, element) {
    if (!this._getFontLoadingStatus(family)) {
        setTimeout(this._checkFontLoaded.bind(this, family, element), 60);
    } else {
        this._states[family] = "loaded";
        document.body.removeChild(element);
    }
};
```

### Pre-loading Required Fonts
```javascript
// Load all fonts used in the game
FontManager.loadGameFonts = function() {
    // MZ default fonts
    this.load("GameFont");
    this.load("MainFont");
    this.load("NumberFont");
    
    // Load custom fonts from settings
    if ($dataSystem && $dataSystem.fonts) {
        for (const font of $dataSystem.fonts) {
            if (font.name && font.file) {
                this.load(font.name, font.file);
            }
        }
    }
};

// Check if all fonts are loaded
FontManager.isReady = function() {
    // Check each font's state
    for (const family in this._states) {
        if (this._states[family] !== "loaded") {
            return false;
        }
    }
    return true;
};
```

## Effect Management (Effekseer)

### Effekseer Integration
```javascript
// Initialize EffectManager
EffectManager.initialize = function() {
    this._cache = {};
    this._errorUrls = [];
};

// Load an effect
EffectManager.load = function(filename) {
    if (filename) {
        const url = this._makeUrl(filename);
        const cache = this._cache;
        if (!cache[url] && Graphics.effekseer) {
            cache[url] = Graphics.effekseer.loadEffect(url);
        }
        return cache[url];
    }
    return null;
};

// Create URL for an effect
EffectManager._makeUrl = function(filename) {
    return "effects/" + Utils.encodeURI(filename) + ".efkefc";
};

// Check if effects are ready
EffectManager.isReady = function() {
    for (const url in this._cache) {
        const effect = this._cache[url];
        if (!effect.isLoaded && !this._errorUrls.includes(url)) {
            return false;
        }
    }
    return true;
};
```

## Preloading Systems

### DataManager Preloading
```javascript
// Preload system images
DataManager.loadSystemImages = function() {
    // Preload essential system images
    ImageManager.loadSystem("Window");
    ImageManager.loadSystem("IconSet");
    ImageManager.loadSystem("Balloon");
    ImageManager.loadSystem("Shadow1");
    ImageManager.loadSystem("Shadow2");
    ImageManager.loadSystem("Damage");
    ImageManager.loadSystem("States");
    ImageManager.loadSystem("Weapons1");
    ImageManager.loadSystem("Weapons2");
    ImageManager.loadSystem("Weapons3");
    ImageManager.loadSystem("ButtonSet");
};

// Load map resources
DataManager.loadMapData = function(mapId) {
    if (mapId > 0) {
        const filename = "Map%1.json".format(mapId.padZero(3));
        this._mapLoader = ResourceHandler.createLoader("data/" + filename, this._loadMapData.bind(this, mapId));
        this.loadDataFile("$dataMap", filename);
    } else {
        this.makeEmptyMap();
    }
};
```

### Scene Preloading
```javascript
// Scene_Boot loading processes
Scene_Boot.prototype.loadSystemImages = function() {
    // Load system images
    DataManager.loadSystemImages();
    
    // Load title screens
    if ($dataSystem.title1Name) {
        ImageManager.loadTitle1($dataSystem.title1Name);
    }
    if ($dataSystem.title2Name) {
        ImageManager.loadTitle2($dataSystem.title2Name);
    }
};

// Scene_Map preloading
Scene_Map.prototype.loadPlayerSprite = function() {
    // Preload player character image
    const characterName = $gamePlayer.characterName();
    ImageManager.loadCharacter(characterName);
    
    // Preload followers' character images
    for (const follower of $gamePlayer.followers().data()) {
        const followerName = follower.characterName();
        ImageManager.loadCharacter(followerName);
    }
};

// Scene_Battle preloading
Scene_Battle.prototype.loadImages = function() {
    // Load battlebacks
    if ($gameSystem.isSideView()) {
        ImageManager.loadSvActor(this._actor.battlerName());
    } else {
        ImageManager.loadEnemy(this._enemy.battlerName());
    }
    
    // Load battlebacks
    if ($gameMap.battleback1Name()) {
        ImageManager.loadBattleback1($gameMap.battleback1Name());
    }
    if ($gameMap.battleback2Name()) {
        ImageManager.loadBattleback2($gameMap.battleback2Name());
    }
};
```

## Memory Management

### Resource Cache Control
```javascript
// Clear unused caches
ResourceHandler.clear = function() {
    this._reserver.clear();
    this._loader.clear();
};

// Clear image cache
ImageManager.clear = function() {
    this._imageCache = new ImageCache();
};

// Check if cache is ready
ImageManager.isReady = function() {
    return this._imageCache.isReady();
};

// Clear specific cache types
ImageManager.clearRequest = function(requestId) {
    this._imageCache.clearRequest(requestId);
};
```

### Garbage Collection
```javascript
// Force garbage collection if platform supports it
Graphics._callGC = function() {
    if (window.VConsole) {
        // Try to call the garbage collector
        if (typeof collectGarbage === "function") {
            collectGarbage();
        }
    }
};

// Release unused textures
Graphics._renderClearAll = function() {
    // Release references to textures
    const renderTexture = PIXI.RenderTexture.EMPTY;
    const renderer = Graphics._renderer;
    renderer.batch.clear();
    renderer.framebuffer.clear();
    renderer.clear();
};
```

### Texture Memory Management
```javascript
// Clear texture cache when transitioning scenes
SceneManager.snapForBackground = function() {
    this._backgroundBitmap = this.snap();
    
    // Clear unused PIXI textures
    PIXI.Texture.removeFromCache(this._backgroundBitmap);
};

// Optimize texture usage
Bitmap.prototype.destroy = function() {
    if (this._baseTexture) {
        this._baseTexture.destroy();
        this._baseTexture = null;
    }
    this._destroyCanvas();
};
```

## Resource Loading Hooks

### Resource Handler
```javascript
// Create a promise-based loader
ResourceHandler.createLoader = function(url, loadingMethod, errorMethod) {
    const loader = {
        url: url,
        _loadingMethod: loadingMethod,
        _errorMethod: errorMethod,
        _resource: null,
        _promise: null
    };
    
    // Loading method
    loader.load = function() {
        if (this._resource) {
            return this._resource;
        }
        if (this._promise) {
            return this._promise;
        }
        
        this._promise = new Promise((resolve, reject) => {
            this._resource = this._loadingMethod();
            if (this._resource) {
                resolve(this._resource);
                this._promise = null;
            } else {
                reject();
                if (this._errorMethod) {
                    this._errorMethod();
                }
            }
        });
        
        return this._promise;
    };
    
    return loader;
};
```

### Loading Progress Indication
```javascript
// Show loading progress
Scene_Boot.prototype.updateDocumentTitle = function() {
    document.title = $dataSystem.gameTitle;
};

// Show loading sprites
Scene_Base.prototype.createLoadingSprite = function() {
    this._loadingSprite = new Sprite();
    this._loadingSprite.bitmap = ImageManager.loadSystem("Loading");
    this._loadingSprite.x = Graphics.width / 2;
    this._loadingSprite.y = Graphics.height / 2;
    this._loadingSprite.anchor.x = 0.5;
    this._loadingSprite.anchor.y = 0.5;
    this.addChild(this._loadingSprite);
};

// Show progress bar
Scene_Boot.prototype.createProgressBar = function() {
    const width = Graphics.boxWidth;
    const height = 10;
    const x = (Graphics.width - width) / 2;
    const y = Graphics.height / 2 - height / 2;
    
    this._progressBar = new Rectangle(x, y, width, height);
    this._progressBarWidth = 0;
};

// Update progress bar
Scene_Boot.prototype.updateProgressBar = function() {
    const maxValue = $dataSystem.tilesets.length + 
                     $dataSystem.animations.length +
                     $dataSystem.enemies.length +
                     $dataActors.length;
    const value = this._loadCount;
    this._progressBarWidth = Math.floor((value / maxValue) * Graphics.boxWidth);
    this.drawProgressBar();
};
```

## Cross-Platform Resource Handling

### Platform-Specific Adjustments
```javascript
// Detect platform for resource management
Utils.isMobileDevice = function() {
    return Utils.isMobileSafari() || Utils.isAndroidChrome();
};

// Mobile Safari detection
Utils.isMobileSafari = function() {
    const agent = navigator.userAgent;
    return !!agent.match(/iPhone|iPad|iPod/i);
};

// Android Chrome detection
Utils.isAndroidChrome = function() {
    const agent = navigator.userAgent;
    return !!agent.match(/Android/i) && !!agent.match(/Chrome/i);
};

// Apply platform-specific optimizations
ImageManager.loadNormalBitmap = function(url) {
    const bitmap = this._imageCache.get(url);
    if (!bitmap) {
        // Mobile texture size limit check
        if (Utils.isMobileDevice()) {
            const canvas = document.createElement("canvas");
            canvas.width = 4096;
            canvas.height = 4096;
            // Check if max texture size is supported
            const gl = canvas.getContext("webgl");
            if (gl) {
                const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                if (maxSize < 4096) {
                    // Scale down images larger than supported size
                    this._imageReductionEnabled = true;
                }
            }
        }
        
        const newBitmap = new Bitmap();
        newBitmap._url = url;
        newBitmap._loadingState = "loading";
        
        if (Utils.hasEncryptedImages() && url.includes(".png")) {
            // Handle encrypted images
            this._loadEncryptedBitmap(newBitmap, url);
        } else {
            newBitmap._image = new Image();
            newBitmap._image.src = url;
            newBitmap._image.onload = function() {
                newBitmap._onLoad();
            };
            newBitmap._image.onerror = function() {
                newBitmap._onError();
            };
        }
        
        this._imageCache.add(url, newBitmap);
        return newBitmap;
    } else {
        return bitmap;
    }
};
```

### Encrypted Asset Handling
```javascript
// Load encrypted images
ImageManager._loadEncryptedBitmap = function(bitmap, url) {
    // Load encrypted data
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.onload = function() {
        if (xhr.status < 400) {
            const arrayBuffer = xhr.response;
            // Decrypt data
            const decryptedBuffer = Utils.decryptArrayBuffer(arrayBuffer);
            // Create blob from decrypted data
            const blob = new Blob([decryptedBuffer], { type: "image/png" });
            // Create URL from blob
            const url = URL.createObjectURL(blob);
            // Load decrypted image
            bitmap._image = new Image();
            bitmap._image.src = url;
            bitmap._image.onload = function() {
                bitmap._onLoad();
                URL.revokeObjectURL(url); // Free memory
            };
            bitmap._image.onerror = function() {
                bitmap._onError();
                URL.revokeObjectURL(url); // Free memory
            };
        } else {
            bitmap._onError();
        }
    };
    xhr.onerror = function() {
        bitmap._onError();
    };
    xhr.send();
};

// Check for encrypted assets
Utils.hasEncryptedImages = function() {
    return !!this._encryptionKey;
};

// Set encryption key
Utils.setEncryptionInfo = function(encryptionKey, encryptionIv) {
    this._encryptionKey = encryptionKey;
    this._encryptionIv = encryptionIv;
};

// Decrypt array buffer
Utils.decryptArrayBuffer = function(arrayBuffer) {
    // Create view of the encrypted data
    const encryptedData = new Uint8Array(arrayBuffer);
    
    // Get the key and initialization vector
    const key = this._encryptionKey;
    const iv = this._encryptionIv;
    
    // Create the AES decrypter
    const crypto = window.crypto || window.msCrypto;
    const subtle = crypto.subtle || crypto.webkitSubtle;
    
    // Use Web Crypto API for decryption
    return subtle.decrypt(
        {
            name: "AES-CBC",
            iv: new Uint8Array(iv)
        },
        key,
        encryptedData
    );
};
```