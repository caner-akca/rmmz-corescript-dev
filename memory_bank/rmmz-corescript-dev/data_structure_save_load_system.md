# RPG Maker MZ - Save/Load System

This document details how RPG Maker MZ handles game state persistence through its save and load system.

## Overview

The save/load system in RPG Maker MZ enables players to preserve their game progress and resume gameplay from specific points. It handles serialization of game state, manages save files, and provides interfaces for saving and loading games through both the menu system and programmatic approaches.

## Save Data Structure

### Save Content Architecture

When a game is saved, the following objects are serialized into a JSON structure:

```javascript
// Structure of save file contents
DataManager.makeSaveContents = function() {
    // Contents of save file
    const contents = {};
    contents.system = $gameSystem;
    contents.screen = $gameScreen;
    contents.timer = $gameTimer;
    contents.switches = $gameSwitches;
    contents.variables = $gameVariables;
    contents.selfSwitches = $gameSelfSwitches;
    contents.actors = $gameActors;
    contents.party = $gameParty;
    contents.map = $gameMap;
    contents.player = $gamePlayer;
    return contents;
};
```

### Save File Metadata

Each save file also includes metadata about the save, stored in a global info array:

```javascript
// Create save file info
DataManager.makeSavefileInfo = function() {
    const info = {};
    info.title = $dataSystem.gameTitle;
    info.characters = $gameParty.charactersForSavefile();
    info.faces = $gameParty.facesForSavefile();
    info.playtime = $gameSystem.playtimeText();
    info.timestamp = Date.now();
    
    // Optional custom info added by plugins
    if (this._customSavefileInfoCallbacks) {
        for (const callback of this._customSavefileInfoCallbacks) {
            callback(info);
        }
    }
    
    return info;
};
```

## Storage System

### Storage Manager

The `StorageManager` class is responsible for interfacing with the device's storage system:

```javascript
// StorageManager - Handles save file storage
StorageManager.save = function(savefileId, json) {
    if (this.isLocalMode()) {
        this.saveToLocalFile(savefileId, json);
    } else {
        this.saveToWebStorage(savefileId, json);
    }
};

StorageManager.load = function(savefileId) {
    if (this.isLocalMode()) {
        return this.loadFromLocalFile(savefileId);
    } else {
        return this.loadFromWebStorage(savefileId);
    }
};

// Check if running in local mode (Electron/NW.js) or browser
StorageManager.isLocalMode = function() {
    return Utils.isNwjs() || Utils.isElectron();
};
```

### Web Storage Implementation

When running in a browser, the game uses localStorage:

```javascript
// Web storage methods
StorageManager.saveToWebStorage = function(savefileId, json) {
    const key = this.webStorageKey(savefileId);
    const data = LZString.compressToBase64(json);
    localStorage.setItem(key, data);
};

StorageManager.loadFromWebStorage = function(savefileId) {
    const key = this.webStorageKey(savefileId);
    const data = localStorage.getItem(key);
    if (data) {
        return LZString.decompressFromBase64(data);
    } else {
        return null;
    }
};

// Generate storage key in format "RPG MZ Save[savefileId]"
StorageManager.webStorageKey = function(savefileId) {
    if (savefileId < 0) {
        return "RPG MZ Temp";
    } else {
        return "RPG MZ Save" + savefileId;
    }
};
```

### Local File System Implementation

When running in desktop environments (NW.js/Electron), the game uses the file system:

```javascript
// Local file system methods
StorageManager.saveToLocalFile = function(savefileId, json) {
    const fs = require("fs");
    const filePath = this.filePath(savefileId);
    const backupFilePath = this.backupFilePath(savefileId);
    
    // Temporary write file path for safe saving
    const tmpFilePath = filePath + ".tmp";
    
    fs.writeFileSync(tmpFilePath, json);
    
    // Check for existing file and backup
    if (fs.existsSync(filePath)) {
        if (fs.existsSync(backupFilePath)) {
            fs.unlinkSync(backupFilePath);
        }
        fs.renameSync(filePath, backupFilePath);
    }
    
    // Rename temp file to actual save file
    fs.renameSync(tmpFilePath, filePath);
};

StorageManager.loadFromLocalFile = function(savefileId) {
    const fs = require("fs");
    const filePath = this.filePath(savefileId);
    const backupFilePath = this.backupFilePath(savefileId);
    
    // Try loading from main file
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, { encoding: "utf8" });
    }
    
    // Try loading from backup file if main file is corrupted/missing
    if (fs.existsSync(backupFilePath)) {
        return fs.readFileSync(backupFilePath, { encoding: "utf8" });
    }
    
    return null;
};

// Get file paths
StorageManager.filePath = function(savefileId) {
    const name = this.filename(savefileId);
    return this.fileDirectoryPath() + name;
};

StorageManager.backupFilePath = function(savefileId) {
    const name = this.backupFilename(savefileId);
    return this.fileDirectoryPath() + name;
};

// Get file paths based on platform
StorageManager.fileDirectoryPath = function() {
    let path = window.location.pathname.replace(/\/[^/]*$/, "/save/");
    if (path.match(/^\/([A-Z]:)/)) {
        path = path.slice(1);
    }
    return decodeURIComponent(path);
};
```

## Data Serialization

### JSON Serialization

RPG Maker MZ uses a custom JSON serializer to handle circular references:

```javascript
// JsonEx - Extended JSON serializer
JsonEx.stringify = function(object) {
    return JSON.stringify(this._encode(object));
};

JsonEx.parse = function(json) {
    return this._decode(JSON.parse(json));
};

// Handle circular references
JsonEx._encode = function(value) {
    if (value === undefined) {
        return null;
    } else if (value === null) {
        return value;
    } else if (value.constructor === Array) {
        return value.map(element => this._encode(element));
    } else if (value.constructor === Object) {
        const encodedObj = {};
        for (const key of Object.keys(value)) {
            encodedObj[key] = this._encode(value[key]);
        }
        return encodedObj;
    } else if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
        return value;
    } else {
        // Handle non-primitive types
        return this._encodeSpecialObject(value);
    }
};

// Special handling for non-JSON serializable objects
JsonEx._encodeSpecialObject = function(value) {
    if (value instanceof Game_Temp) {
        // Game_Temp is not saved
        return undefined;
    } else {
        const constructorName = value.constructor.name;
        if (constructorName === "Boolean" || constructorName === "Number" || constructorName === "String") {
            return value;
        } else {
            const encodedObj = {
                [JsonEx._specialKey]: constructorName
            };
            for (const key of Object.keys(value)) {
                if (key !== JsonEx._specialKey) {
                    encodedObj[key] = this._encode(value[key]);
                }
            }
            return encodedObj;
        }
    }
};
```

### Compression

To reduce file size, save data is compressed using LZString:

```javascript
// Save with compression
StorageManager.saveToWebStorage = function(savefileId, json) {
    const key = this.webStorageKey(savefileId);
    const data = LZString.compressToBase64(json);
    localStorage.setItem(key, data);
};

// Load with decompression
StorageManager.loadFromWebStorage = function(savefileId) {
    const key = this.webStorageKey(savefileId);
    const data = localStorage.getItem(key);
    if (data) {
        return LZString.decompressFromBase64(data);
    } else {
        return null;
    }
};
```

## Save/Load Operations

### Save Game Process

The save operation follows several steps:

```javascript
// Save game to a specific slot
DataManager.saveGame = function(savefileId) {
    try {
        StorageManager.backup(savefileId);
        
        // Pre-save callbacks
        $gameSystem.onBeforeSave();
        
        // Create and save JSON data
        const json = JsonEx.stringify(this.makeSaveContents());
        StorageManager.save(savefileId, json);
        this._lastAccessedId = savefileId;
        
        // Update global info
        const globalInfo = this.loadGlobalInfo() || [];
        globalInfo[savefileId] = this.makeSavefileInfo();
        this.saveGlobalInfo(globalInfo);
        
        return true;
    } catch (e) {
        console.error(e);
        try {
            // Restore backup in case of error
            StorageManager.remove(savefileId);
            StorageManager.restoreBackup(savefileId);
        } catch (e2) {
            // Silent failure on backup restoration
        }
        return false;
    }
};

// Create save content structure
DataManager.makeSaveContents = function() {
    // Contents of save file
    const contents = {};
    contents.system = $gameSystem;
    contents.screen = $gameScreen;
    contents.timer = $gameTimer;
    contents.switches = $gameSwitches;
    contents.variables = $gameVariables;
    contents.selfSwitches = $gameSelfSwitches;
    contents.actors = $gameActors;
    contents.party = $gameParty;
    contents.map = $gameMap;
    contents.player = $gamePlayer;
    return contents;
};
```

### Load Game Process

The load operation follows these steps:

```javascript
// Load game from a specific slot
DataManager.loadGame = function(savefileId) {
    try {
        // Read data from storage
        const json = StorageManager.load(savefileId);
        if (json) {
            // Parse JSON data
            const contents = JsonEx.parse(json);
            
            // Extract game objects from save data
            this.extractSaveContents(contents);
            
            // Record which save was loaded
            this._lastAccessedId = savefileId;
            return true;
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
        return false;
    }
};

// Extract save contents into game objects
DataManager.extractSaveContents = function(contents) {
    $gameSystem = contents.system;
    $gameScreen = contents.screen;
    $gameTimer = contents.timer;
    $gameSwitches = contents.switches;
    $gameVariables = contents.variables;
    $gameSelfSwitches = contents.selfSwitches;
    $gameActors = contents.actors;
    $gameParty = contents.party;
    $gameMap = contents.map;
    $gamePlayer = contents.player;
    
    // Post-load callbacks
    $gameSystem.onAfterLoad();
    
    // Fix any data errors/corruptions
    this.correctDataErrors();
};
```

### Auto-Save System

RPG Maker MZ includes an autosave feature:

```javascript
// Autosave the game
DataManager.autoSaveGame = function() {
    if (!this.isEventTest() && $gameSystem.isAutosaveEnabled()) {
        // Save to the autosave slot (0)
        this.saveGame(0);
    }
};

// Scene_Map autosave implementation
Scene_Map.prototype.stop = function() {
    Scene_Base.prototype.stop.call(this);
    $gamePlayer.straighten();
    
    // Trigger autosave unless going to battle
    if ($gameSystem.isAutosaveEnabled() && !SceneManager.isNextScene(Scene_Battle)) {
        DataManager.autoSaveGame();
    }
};
```

## Save File Management

### Global Info

RPG Maker MZ maintains a global info file that contains metadata about all save files:

```javascript
// Load global info (metadata about all save files)
DataManager.loadGlobalInfo = function() {
    if (StorageManager.exists(-1)) {
        const json = StorageManager.load(-1);
        return JSON.parse(json);
    } else {
        return null;
    }
};

// Save global info
DataManager.saveGlobalInfo = function(info) {
    StorageManager.save(-1, JSON.stringify(info));
};

// Get save file info
DataManager.savefileInfo = function(savefileId) {
    const globalInfo = this.loadGlobalInfo();
    return globalInfo ? globalInfo[savefileId] : null;
};
```

### Save File Enumeration

To list available save files:

```javascript
// Check for existing save files
DataManager.isAnySavefileExists = function() {
    return this.savefileIds().length > 0;
};

// Get IDs of existing save files
DataManager.savefileIds = function() {
    if (this._globalInfo === null) {
        this._globalInfo = this.loadGlobalInfo() || [];
    }
    
    const ids = [];
    for (let i = 0; i < this.maxSavefiles(); i++) {
        if (this.isThisGameFile(i)) {
            ids.push(i);
        }
    }
    
    return ids;
};

// Get max number of save files
DataManager.maxSavefiles = function() {
    return 20;
};

// Check if a savefile belongs to current game
DataManager.isThisGameFile = function(savefileId) {
    const globalInfo = this._globalInfo;
    return (
        globalInfo &&
        globalInfo[savefileId] &&
        globalInfo[savefileId].title === $dataSystem.gameTitle
    );
};
```

## UI Integration

### Save/Load Scenes

RPG Maker MZ provides UI scenes for save and load operations:

```javascript
// Scene_Save - UI for saving games
function Scene_Save() {
    this.initialize(...arguments);
}

Scene_Save.prototype = Object.create(Scene_File.prototype);
Scene_Save.prototype.constructor = Scene_Save;

Scene_Save.prototype.initialize = function() {
    Scene_File.prototype.initialize.call(this);
    this._mode = "save";
};

Scene_Save.prototype.executeSave = function(savefileId) {
    $gameSystem.onBeforeSave();
    if (DataManager.saveGame(savefileId)) {
        this.onSaveSuccess();
    } else {
        this.onSaveFailure();
    }
};

// Scene_Load - UI for loading games
function Scene_Load() {
    this.initialize(...arguments);
}

Scene_Load.prototype = Object.create(Scene_File.prototype);
Scene_Load.prototype.constructor = Scene_Load;

Scene_Load.prototype.initialize = function() {
    Scene_File.prototype.initialize.call(this);
    this._mode = "load";
};

Scene_Load.prototype.executeLoad = function(savefileId) {
    if (DataManager.loadGame(savefileId)) {
        this.onLoadSuccess();
    } else {
        this.onLoadFailure();
    }
};
```

### Save List Windows

The UI displays save file information using specialized windows:

```javascript
// Window_SavefileList - Displays save files
function Window_SavefileList() {
    this.initialize(...arguments);
}

Window_SavefileList.prototype = Object.create(Window_Selectable.prototype);
Window_SavefileList.prototype.constructor = Window_SavefileList;

Window_SavefileList.prototype.drawItem = function(index) {
    const savefileId = this.indexToSavefileId(index);
    const info = DataManager.savefileInfo(savefileId);
    const rect = this.itemRect(index);
    
    // Draw file ID
    this.drawFileId(savefileId, rect.x, rect.y);
    
    if (info) {
        // Draw save information if file exists
        const bottom = rect.y + rect.height;
        
        // Draw game title
        this.drawGameTitle(info, rect.x + 192, rect.y);
        
        // Draw party characters
        this.drawPartyCharacters(info, rect.x + 220, bottom - 4);
        
        // Draw playtime
        this.drawPlaytime(info, rect.x, bottom - this.lineHeight());
    }
};
```

## Backup and Recovery

The system includes backup mechanisms to prevent data loss:

```javascript
// Create backup before saving
StorageManager.backup = function(savefileId) {
    if (this.exists(savefileId)) {
        if (this.isLocalMode()) {
            this.backupLocalFile(savefileId);
        } else {
            this.backupWebStorage(savefileId);
        }
    }
};

// Restore backup if save failed
StorageManager.restoreBackup = function(savefileId) {
    if (this.backupExists(savefileId)) {
        if (this.isLocalMode()) {
            this.restoreLocalBackup(savefileId);
        } else {
            this.restoreWebStorageBackup(savefileId);
        }
    }
};

// Check if backup exists
StorageManager.backupExists = function(savefileId) {
    if (this.isLocalMode()) {
        return this.localBackupExists(savefileId);
    } else {
        return this.webStorageBackupExists(savefileId);
    }
};
```

## Save/Load Hooks

The system provides hooks for pre-save and post-load operations:

```javascript
// Pre-save hook in Game_System
Game_System.prototype.onBeforeSave = function() {
    this._saveCount++;
    this._versionId = $dataSystem.versionId;
    this._framesOnSave = Graphics.frameCount;
    this._bgmOnSave = AudioManager.saveBgm();
    this._bgsOnSave = AudioManager.saveBgs();
};

// Post-load hook in Game_System
Game_System.prototype.onAfterLoad = function() {
    Graphics.frameCount = this._framesOnSave;
    AudioManager.playBgm(this._bgmOnSave);
    AudioManager.playBgs(this._bgsOnSave);
};
```

## Plugin Integration

The save/load system allows plugins to integrate with it:

```javascript
// Register custom save info callback
DataManager.addCustomSavefileInfoCallback = function(callback) {
    if (!this._customSavefileInfoCallbacks) {
        this._customSavefileInfoCallbacks = [];
    }
    this._customSavefileInfoCallbacks.push(callback);
};

// Example plugin integration
const ExampleSaveExtension = {
    initialize: function() {
        // Register callback to add custom save info
        DataManager.addCustomSavefileInfoCallback(this.addSavefileInfo.bind(this));
    },
    
    addSavefileInfo: function(info) {
        // Add additional info to save file metadata
        info.level = $gameParty.highestLevel();
        info.gold = $gameParty.gold();
        info.location = $gameMap.displayName();
    }
};

ExampleSaveExtension.initialize();
```

## Cloud Save Support

RPG Maker MZ can be extended to support cloud saves through plugins:

```javascript
// Example cloud save implementation structure
const CloudSaveManager = {
    // Initialize cloud save system
    initialize: function() {
        this._isCloudEnabled = false;
        this._cloudProvider = null;
        this._pendingUploads = {};
        this._pendingDownloads = {};
        
        // Override StorageManager methods
        this._hookStorageManager();
    },
    
    // Set up cloud provider
    setupCloudProvider: function(providerName, credentials) {
        // Implementation depends on specific cloud provider
        switch (providerName) {
            case "googleDrive":
                this._cloudProvider = new GoogleDriveProvider(credentials);
                break;
            case "dropbox":
                this._cloudProvider = new DropboxProvider(credentials);
                break;
            default:
                return false;
        }
        
        this._isCloudEnabled = true;
        return true;
    },
    
    // Hook into StorageManager
    _hookStorageManager: function() {
        // Store original methods
        const originalSave = StorageManager.save;
        const originalLoad = StorageManager.load;
        
        // Override save method
        StorageManager.save = function(savefileId, json) {
            // Call original method
            originalSave.call(this, savefileId, json);
            
            // Upload to cloud if enabled
            if (CloudSaveManager._isCloudEnabled) {
                CloudSaveManager.uploadSaveFile(savefileId, json);
            }
        };
        
        // Override load method
        StorageManager.load = function(savefileId) {
            // Try to get from cloud first if enabled
            if (CloudSaveManager._isCloudEnabled) {
                const cloudData = CloudSaveManager.downloadSaveFile(savefileId);
                if (cloudData) {
                    return cloudData;
                }
            }
            
            // Fall back to original method
            return originalLoad.call(this, savefileId);
        };
    }
};
```

## Cross-Platform Considerations

Special considerations are needed for different platforms:

```javascript
// Mobile web browser storage quotas
StorageManager.updateStorageQuota = function() {
    // Check available storage (implementation varies by browser)
    let availableStorage = 0;
    
    try {
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                const percentUsed = Math.floor((estimate.usage / estimate.quota) * 100);
                if (percentUsed > 80) {
                    console.warn("Storage usage high: " + percentUsed + "%");
                    // Alert user if extremely high
                    if (percentUsed > 95) {
                        this.onQuotaExceeded();
                    }
                }
            });
        }
    } catch (e) {
        console.error("Could not check storage quota:", e);
    }
};

// Quota exceeded handler
StorageManager.onQuotaExceeded = function() {
    const scene = SceneManager._scene;
    if (scene._savefileId && scene instanceof Scene_Save) {
        scene.onSaveFailure();
    }
    
    // Show storage warning
    if (!this._quotaWarningShown) {
        alert("Warning: Storage space is running low. You may not be able to save your game. Please free up some space by deleting old save files.");
        this._quotaWarningShown = true;
    }
};
```