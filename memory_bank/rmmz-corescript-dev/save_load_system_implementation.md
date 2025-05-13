# RPG Maker MZ - Save/Load System Implementation

The save/load system in RPG Maker MZ handles game persistence, allowing players to save their progress and resume later. This document details the internal implementation, serialization process, and storage mechanisms.

## Core Components

### StorageManager
- Located in `rmmz_managers/StorageManager.js`
- Handles low-level storage operations
- Manages file system and localStorage interactions
- Ensures cross-platform compatibility

### DataManager
- Located in `rmmz_managers/DataManager.js`
- Manages save data content and structure
- Handles database loading, verification, and compatibility
- Processes game objects for saving/loading

### Scene_File, Scene_Save, Scene_Load
- UI scenes for save/load operations
- Located in `rmmz_scenes/Scene_File.js`, `Scene_Save.js`, and `Scene_Load.js`
- Manage user interaction with the save/load system

## Save Data Structure

### Global Object Structure
The save system preserves the state of these global game objects:

```javascript
// Objects saved in save files
DataManager.makeSaveContents = function() {
    // A list of the variables that will be saved
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

### Save Contents Extraction
When loading, the global objects are restored from the saved data:

```javascript
// Extract save contents to global variables
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
};
```

### Save File Information
Each save file includes metadata for display in the save/load menu:

```javascript
// Create save file info
DataManager.makeSavefileInfo = function() {
    const info = {};
    info.title = $dataSystem.gameTitle;
    info.characters = $gameParty.charactersForSavefile();
    info.faces = $gameParty.facesForSavefile();
    info.playtime = $gameSystem.playtimeText();
    info.timestamp = Date.now();
    info.mapname = this.makeSavefileDisplayMapname();
    info.gold = $gameParty.gold();
    info.level = $gameParty.highestLevel();
    info.saveCount = $gameSystem.saveCount();
    return info;
};
```

## Serialization Process

### JSON Serialization
Game data is serialized to JSON format:

```javascript
// Save game data
DataManager.saveGame = function(savefileId) {
    try {
        StorageManager.backup(savefileId);
        const json = JsonEx.stringify(this.makeSaveContents());
        StorageManager.save(savefileId, json);
        this._lastAccessedId = savefileId;
        const globalInfo = this.loadGlobalInfo() || [];
        globalInfo[savefileId] = this.makeSavefileInfo();
        this.saveGlobalInfo(globalInfo);
        return true;
    } catch (e) {
        console.error(e);
        try {
            StorageManager.remove(savefileId);
            StorageManager.restoreBackup(savefileId);
        } catch (e2) {
            //
        }
        return false;
    }
};
```

### Circular Reference Handling
JSON doesn't natively support circular references, so RPG Maker MZ uses a custom serializer:

```javascript
// JsonEx circular reference handling (simplified)
JsonEx.stringify = function(object) {
    this._state = { objects: [], indexes: [] };
    const json = JSON.stringify(this.encode(object, 0));
    this._state = null;
    return json;
};

JsonEx.encode = function(value, depth) {
    depth = depth || 0;
    if (depth >= 100) {
        return null;
    }
    
    if (value === undefined) {
        return this.encodeUndefined();
    } else if (value === null) {
        return this.encodeNull();
    } else if (value.constructor === Array) {
        return this.encodeArray(value, depth);
    } else if (value.constructor === Object) {
        return this.encodeObject(value, depth);
    } else if (typeof value === "number") {
        return this.encodeNumber(value);
    } else {
        return value;
    }
};

// Handle circular references
JsonEx.encode = function(value, depth) {
    // Previous implementation...
    
    if (value && typeof value === "object") {
        const index = this._state.objects.indexOf(value);
        if (index >= 0) {
            return { "@r": index };
        }
        this._state.objects.push(value);
        this._state.indexes.push(this._state.objects.length - 1);
    }
    
    // Continue with encoding...
};

// Restoring circular references during parsing
JsonEx.parse = function(json) {
    this._state = { objects: [], indexes: [] };
    const parsed = JSON.parse(json);
    const value = this.decode(parsed);
    this._state = null;
    return value;
};

JsonEx.decode = function(value) {
    if (value && typeof value === "object") {
        if (value["@r"] !== undefined) {
            return this._state.objects[value["@r"]];
        }
        
        this._state.objects.push(value);
        this._state.indexes.push(this._state.objects.length - 1);
        
        // Decode the object...
    }
    
    return value;
};
```

## Storage Mechanisms

### Multiple Storage Methods
StorageManager supports multiple storage methods to work across platforms:

```javascript
// Detect storage method
StorageManager.isLocalMode = function() {
    return Utils.isNwjs();
};

// Save to storage
StorageManager.save = function(savefileId, json) {
    if (this.isLocalMode()) {
        this.saveToLocalFile(savefileId, json);
    } else {
        this.saveToWebStorage(savefileId, json);
    }
};

// Load from storage
StorageManager.load = function(savefileId) {
    if (this.isLocalMode()) {
        return this.loadFromLocalFile(savefileId);
    } else {
        return this.loadFromWebStorage(savefileId);
    }
};
```

### File System Storage
For desktop platforms (using NW.js), the game uses the file system:

```javascript
// Save to local file
StorageManager.saveToLocalFile = function(savefileId, json) {
    const filePath = this.filePath(savefileId);
    const backupFilePath = this.backupFilePath(savefileId);
    try {
        this.fsMkdir(this.dirPath());
        this.fsRename(filePath, backupFilePath);
        this.fsWriteFile(filePath, json);
        this.fsUnlink(backupFilePath);
    } catch (e) {
        console.error(e);
        throw e;
    }
};

// Load from local file
StorageManager.loadFromLocalFile = function(savefileId) {
    const filePath = this.filePath(savefileId);
    const backupFilePath = this.backupFilePath(savefileId);
    let data = null;
    try {
        data = this.fsReadFile(filePath);
    } catch (e) {
        try {
            data = this.fsReadFile(backupFilePath);
        } catch (e2) {
            throw e;
        }
    }
    return data;
};
```

### Web Storage
For browser-based play, localStorage is used:

```javascript
// Save to web storage
StorageManager.saveToWebStorage = function(savefileId, json) {
    const key = this.webStorageKey(savefileId);
    const backupKey = this.webStorageKey(savefileId) + "backup";
    try {
        localStorage.setItem(backupKey, localStorage.getItem(key));
        localStorage.setItem(key, json);
        localStorage.removeItem(backupKey);
    } catch (e) {
        console.error(e);
        throw e;
    }
};

// Load from web storage
StorageManager.loadFromWebStorage = function(savefileId) {
    const key = this.webStorageKey(savefileId);
    const backupKey = this.webStorageKey(savefileId) + "backup";
    let data = null;
    try {
        data = localStorage.getItem(key);
    } catch (e) {
        try {
            data = localStorage.getItem(backupKey);
        } catch (e2) {
            throw e;
        }
    }
    return data;
};
```

## Backup and Recovery

### Built-in Backup System
RPG Maker MZ implements a backup system to prevent save file corruption:

```javascript
// Backup save file
StorageManager.backup = function(savefileId) {
    if (this.exists(savefileId)) {
        if (this.isLocalMode()) {
            const data = this.loadFromLocalFile(savefileId);
            this.fsWriteFile(this.backupFilePath(savefileId), data);
        } else {
            const data = this.loadFromWebStorage(savefileId);
            localStorage.setItem(this.webStorageKey(savefileId) + "backup", data);
        }
    }
};

// Restore from backup
StorageManager.restoreBackup = function(savefileId) {
    if (this.backupExists(savefileId)) {
        if (this.isLocalMode()) {
            const data = this.fsReadFile(this.backupFilePath(savefileId));
            this.fsWriteFile(this.filePath(savefileId), data);
            this.fsUnlink(this.backupFilePath(savefileId));
        } else {
            const data = localStorage.getItem(this.webStorageKey(savefileId) + "backup");
            localStorage.setItem(this.webStorageKey(savefileId), data);
            localStorage.removeItem(this.webStorageKey(savefileId) + "backup");
        }
    }
};
```

## Global Save Information

### Save List Management
Global save information is stored separately from individual save files:

```javascript
// Save global info
DataManager.saveGlobalInfo = function(info) {
    StorageManager.saveObject("global", info);
};

// Load global info
DataManager.loadGlobalInfo = function() {
    if (!this._globalInfo) {
        this._globalInfo = StorageManager.loadObject("global") || [];
    }
    return this._globalInfo;
};
```

### Global Object Storage
The StorageManager handles global objects separately:

```javascript
// Save global object
StorageManager.saveObject = function(name, object) {
    const json = JsonEx.stringify(object);
    if (this.isLocalMode()) {
        this.saveToLocalFile(name, json);
    } else {
        this.saveToWebStorage(name, json);
    }
};

// Load global object
StorageManager.loadObject = function(name) {
    let json;
    try {
        if (this.isLocalMode()) {
            json = this.loadFromLocalFile(name);
        } else {
            json = this.loadFromWebStorage(name);
        }
    } catch (e) {
        console.error(e);
        return null;
    }
    if (json) {
        return JsonEx.parse(json);
    } else {
        return null;
    }
};
```

## Save/Load UI Implementation

### Save Interface
The Save and Load screens are implemented in Scene_File and its derivatives:

```javascript
// Create file list window
Scene_File.prototype.createListWindow = function() {
    const rect = this.listWindowRect();
    this._listWindow = new Window_SavefileList(rect);
    this._listWindow.select(this.firstSavefileId());
    this._listWindow.setHandler("ok", this.onSavefileOk.bind(this));
    this._listWindow.setHandler("cancel", this.popScene.bind(this));
    this._listWindow.refresh();
    this.addWindow(this._listWindow);
};

// Handle savefile selection
Scene_Save.prototype.onSavefileOk = function() {
    const savefileId = this.savefileId();
    this.executeSave(savefileId);
};

// Save execution
Scene_Save.prototype.executeSave = function(savefileId) {
    $gameSystem.setSavefileId(savefileId);
    $gameSystem.onBeforeSave();
    if (DataManager.saveGame(savefileId)) {
        this.onSaveSuccess();
    } else {
        this.onSaveFailure();
    }
};
```

### Load Interface
Loading implementation:

```javascript
// Handle load file selection
Scene_Load.prototype.onSavefileOk = function() {
    const savefileId = this.savefileId();
    this.executeLoad(savefileId);
};

// Load execution
Scene_Load.prototype.executeLoad = function(savefileId) {
    if (DataManager.loadGame(savefileId)) {
        this.onLoadSuccess();
    } else {
        this.onLoadFailure();
    }
};

// After successful load
Scene_Load.prototype.onLoadSuccess = function() {
    SoundManager.playLoad();
    this.fadeOutAll();
    this.reloadMapIfUpdated();
    SceneManager.goto(Scene_Map);
    $gameSystem.onAfterLoad();
};
```

## Compression and Encryption

### Data Compression
RPG Maker MZ supports compression for save data:

```javascript
// Compress save data
StorageManager.compress = function(data) {
    if (this.isCompressed() && data.length > 0) {
        return pako.deflate(data, { to: "string", level: 1 });
    } else {
        return data;
    }
};

// Decompress save data
StorageManager.decompress = function(data) {
    if (this.isCompressed() && data.length > 0) {
        return pako.inflate(data, { to: "string" });
    } else {
        return data;
    }
};

// Check if compression is enabled
StorageManager.isCompressed = function() {
    return true; // Can be changed in configuration
};
```

### Save Data Encryption
Basic encryption can be implemented for save data:

```javascript
// Encrypt save data
StorageManager.encrypt = function(data) {
    if (this.isEncrypted()) {
        // XOR with a simple key for basic encryption
        const key = "RPG_MAKER_MZ";
        let result = "";
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(
                data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    } else {
        return data;
    }
};

// Decrypt save data
StorageManager.decrypt = function(data) {
    if (this.isEncrypted()) {
        // XOR operates the same way for decryption
        return this.encrypt(data);
    } else {
        return data;
    }
};

// Check if encryption is enabled
StorageManager.isEncrypted = function() {
    return false; // Default: disabled
};
```

## Version Compatibility

### Version Management
RPG Maker MZ handles version compatibility for save files:

```javascript
// Check version ID
DataManager.isVersionIdChanged = function() {
    return Utils.RPGMAKER_VERSION !== $dataSystem.versionId;
};

// Check save compatibility
DataManager.loadGameWithoutRescue = function(savefileId) {
    const globalInfo = this.loadGlobalInfo();
    if (this.isThisGameFile(savefileId)) {
        const json = StorageManager.load(savefileId);
        const contents = JsonEx.parse(json);
        this.extractSaveContents(contents);
        this.correctDataErrors();
        return true;
    } else {
        return false;
    }
};

// Check file integrity
DataManager.isThisGameFile = function(savefileId) {
    const globalInfo = this.loadGlobalInfo();
    if (globalInfo && globalInfo[savefileId]) {
        const savefile = globalInfo[savefileId];
        return (
            savefile.globalId === this._globalId &&
            savefile.title === $dataSystem.gameTitle
        );
    }
    return false;
};
```

### Data Error Correction
RPG Maker MZ attempts to fix data errors in save files:

```javascript
// Correct data errors
DataManager.correctDataErrors = function() {
    // Ensure essential objects exist
    $gameParty.removeInvalidMembers();
    
    // Ensure map exists
    if (!$gameMap.mapId()) {
        $gamePlayer.reserveTransfer(this.defaultMapId(), 0, 0, 2, 0);
    }
    
    // Fix any changes in database structure
    for (const actor of $gameActors._data) {
        if (actor && actor.isEquipChangeOk()) {
            actor.releaseUnequippableItems(true);
            actor.refresh();
        }
    }
};
```

## Advanced Save System Features

### Auto-Save Implementation
RPG Maker MZ supports auto-saving capabilities:

```javascript
// Auto-save handling
DataManager.autoSaveGame = function() {
    if (this.isEventTest() || this.isBattleTest()) return;
    if (!$gameSystem.isSaveEnabled()) return;
    if ($gameMap && $gameMap.mapId() > 0) {
        $gameSystem.onBeforeSave();
        this.saveGame(this.autoSavefileId());
    }
};

// Get auto-save ID
DataManager.autoSavefileId = function() {
    return 0; // Auto-save slot is typically 0
};

// Check if auto-save enabled
$gameSystem.isAutoSaveEnabled = function() {
    return this._autoSaveEnabled;
};

// Enable/disable auto-save
$gameSystem.enableAutoSave = function() {
    this._autoSaveEnabled = true;
};

// Auto-save on map transition
Scene_Map.prototype.stop = function() {
    Scene_Message.prototype.stop.call(this);
    if ($gameSystem.isAutoSaveEnabled() && 
        !SceneManager.isNextScene(Scene_Battle)) {
        DataManager.autoSaveGame();
    }
};
```

### Save Thumbnail Generation
A save thumbnail system can be implemented:

```javascript
// Generate screenshot for save file
DataManager.createSaveThumbnail = function() {
    const bitmap = this.makeSaveThumbnail();
    return bitmap.toDataURL("image/png");
};

// Create a screenshot bitmap
DataManager.makeSaveThumbnail = function() {
    const width = 160;
    const height = 90;
    const bitmap = new Bitmap(width, height);
    
    // Scale the screen to thumbnail size
    const renderTexture = PIXI.RenderTexture.create({
        width: width,
        height: height
    });
    
    if (SceneManager._scene) {
        const stage = SceneManager._scene;
        Graphics.app.renderer.render(stage, renderTexture);
        
        // Convert PIXI texture to bitmap
        const canvas = Graphics.app.renderer.extract.canvas(renderTexture);
        bitmap.context.drawImage(canvas, 0, 0);
    }
    
    return bitmap;
};

// Save thumbnail with save data
DataManager.makeSavefileInfo = function() {
    const info = {
        // Other fields...
        thumbnail: this.createSaveThumbnail()
    };
    return info;
};
```

### Save File Management
Features for handling multiple save files:

```javascript
// Copy save file
DataManager.copySaveFile = function(srcId, destId) {
    if (this.exists(srcId)) {
        const json = StorageManager.load(srcId);
        StorageManager.save(destId, json);
        
        // Update global info
        const globalInfo = this.loadGlobalInfo();
        globalInfo[destId] = globalInfo[srcId];
        this.saveGlobalInfo(globalInfo);
        
        return true;
    }
    return false;
};

// Delete save file
DataManager.deleteSaveFile = function(savefileId) {
    StorageManager.remove(savefileId);
    
    // Update global info
    const globalInfo = this.loadGlobalInfo();
    delete globalInfo[savefileId];
    this.saveGlobalInfo(globalInfo);
};

// Backup all save files
DataManager.backupAllSavefiles = function() {
    const globalInfo = this.loadGlobalInfo();
    for (const id in globalInfo) {
        if (globalInfo[id]) {
            StorageManager.backup(parseInt(id));
        }
    }
};
```