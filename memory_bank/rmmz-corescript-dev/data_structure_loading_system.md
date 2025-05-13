# RPG Maker MZ - Data Loading System

This document details how RPG Maker MZ loads, processes, and manages game data throughout the game lifecycle.

## Data Loading Infrastructure

RPG Maker MZ uses a sophisticated system to load game data from JSON files and transform them into usable JavaScript objects. This process is primarily managed by the `DataManager` class.

## Loading Sequence

### 1. Initial Database Loading

When the game starts, the system loads all database files in a specific sequence:

```javascript
// Database files loading setup
DataManager.loadDatabase = function() {
    const test = this.isBattleTest() || this.isEventTest();
    const prefix = test ? "Test_" : "";
    
    this.loadDataFile("$dataActors", prefix + "Actors.json");
    this.loadDataFile("$dataClasses", prefix + "Classes.json");
    this.loadDataFile("$dataSkills", prefix + "Skills.json");
    this.loadDataFile("$dataItems", prefix + "Items.json");
    this.loadDataFile("$dataWeapons", prefix + "Weapons.json");
    this.loadDataFile("$dataArmors", prefix + "Armors.json");
    this.loadDataFile("$dataEnemies", prefix + "Enemies.json");
    this.loadDataFile("$dataTroops", prefix + "Troops.json");
    this.loadDataFile("$dataStates", prefix + "States.json");
    this.loadDataFile("$dataAnimations", prefix + "Animations.json");
    this.loadDataFile("$dataTilesets", prefix + "Tilesets.json");
    this.loadDataFile("$dataCommonEvents", prefix + "CommonEvents.json");
    this.loadDataFile("$dataSystem", prefix + "System.json");
    this.loadDataFile("$dataMapInfos", prefix + "MapInfos.json");
};
```

### 2. Loading Individual Files

Each file is loaded using XHR requests and handled asynchronously:

```javascript
// Individual file loading
DataManager.loadDataFile = function(name, src) {
    const xhr = new XMLHttpRequest();
    const url = "data/" + src;
    xhr.open("GET", url);
    xhr.overrideMimeType("application/json");
    
    xhr.onload = () => {
        if (xhr.status < 400) {
            window[name] = JSON.parse(xhr.responseText);
            this.onLoad(window[name]);
        }
    };
    
    xhr.onerror = this._mapLoader || function() {
        DataManager._errorUrl = DataManager._errorUrl || url;
    };
    
    window[name] = null;
    xhr.send();
};
```

### 3. Post-Processing

After loading, data objects undergo additional processing:

```javascript
// Process loaded data
DataManager.onLoad = function(object) {
    // Check if this completes loading
    const array = this._databaseFiles.filter(data => {
        return window[data.name] === object;
    });
    
    if (array.length > 0) {
        // Process loaded object (extract metadata, etc)
        this.extractMetadata(object);
        
        // Mark file as loaded
        array[0].loaded = true;
        
        // Check if all files are loaded
        if (this.isMapLoaded()) {
            this.onMapLoaded();
        } else if (this.isDatabaseLoaded()) {
            this.onDatabaseLoaded();
        }
    }
};
```

## Metadata Extraction

After loading, note tags from each database object are parsed into the `meta` property for easier access:

```javascript
// Extract note tag metadata
DataManager.extractMetadata = function(data) {
    for (const dataItem of data) {
        if (dataItem && dataItem.note !== undefined) {
            const re = /<([^<>:]+)(:?)([^>]*)>/g;
            dataItem.meta = {};
            while (true) {
                const match = re.exec(dataItem.note);
                if (match) {
                    if (match[2] === ":") {
                        dataItem.meta[match[1]] = match[3];
                    } else {
                        dataItem.meta[match[1]] = true;
                    }
                } else {
                    break;
                }
            }
        }
    }
};
```

## Map Loading

Maps are loaded on-demand when players enter a new area:

```javascript
// Load map data
DataManager.loadMapData = function(mapId) {
    if (mapId > 0) {
        const filename = "Map%1.json".format(mapId.padZero(3));
        this._mapLoader = ResourceHandler.createLoader(
            "data/" + filename,
            this.loadDataFile.bind(this, "$dataMap", filename)
        );
        this.loadDataFile("$dataMap", filename);
    } else {
        this.makeEmptyMap();
    }
};

// Create empty map when no valid map is available
DataManager.makeEmptyMap = function() {
    $dataMap = {};
    $dataMap.data = [];
    $dataMap.events = [];
    $dataMap.width = 100;
    $dataMap.height = 100;
    $dataMap.scrollType = 3;
};
```

## Loading Status Checks

The system provides methods to check loading progress:

```javascript
// Check if database is fully loaded
DataManager.isDatabaseLoaded = function() {
    return this.isAllDatabaseFilesLoaded() && this._errorUrl === null;
};

// Check if specific database files are loaded
DataManager.isAllDatabaseFilesLoaded = function() {
    return this._databaseFiles.every(data => data.loaded);
};

// Check if map is loaded
DataManager.isMapLoaded = function() {
    return !!$dataMap;
};
```

## Game Object Creation

Once data is loaded, game objects are created based on the data templates:

```javascript
// Setup new game with initial objects
DataManager.setupNewGame = function() {
    this.createGameObjects();
    this.selectSavefileForNewGame();
    $gameParty.setupStartingMembers();
    $gamePlayer.setupForNewGame();
    Graphics.frameCount = 0;
};

// Create base game objects
DataManager.createGameObjects = function() {
    $gameTemp = new Game_Temp();
    $gameSystem = new Game_System();
    $gameScreen = new Game_Screen();
    $gameTimer = new Game_Timer();
    $gameMessage = new Game_Message();
    $gameSwitches = new Game_Switches();
    $gameVariables = new Game_Variables();
    $gameSelfSwitches = new Game_SelfSwitches();
    $gameActors = new Game_Actors();
    $gameParty = new Game_Party();
    $gameTroop = new Game_Troop();
    $gameMap = new Game_Map();
    $gamePlayer = new Game_Player();
};
```

## Save Data Structure

The save data structure encapsulates the game state:

```javascript
// Create save contents
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

// Extract save contents when loading
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

## Data Reference System

During gameplay, database objects are accessed through global reference variables:

| Global Variable | Content |
|-----------------|---------|
| `$dataActors` | Actor templates |
| `$dataClasses` | Class templates |
| `$dataSkills` | Skill templates |
| `$dataItems` | Item templates |
| `$dataWeapons` | Weapon templates |
| `$dataArmors` | Armor templates |
| `$dataEnemies` | Enemy templates |
| `$dataTroops` | Troop templates |
| `$dataStates` | State templates |
| `$dataAnimations` | Animation templates |
| `$dataTilesets` | Tileset templates |
| `$dataCommonEvents` | Common event templates |
| `$dataSystem` | System settings |
| `$dataMapInfos` | Map info list |
| `$dataMap` | Current map data |

## Game Object References

Active game state is managed through these global objects:

| Global Variable | Content |
|-----------------|---------|
| `$gameTemp` | Temporary data |
| `$gameSystem` | System settings |
| `$gameScreen` | Screen effects |
| `$gameTimer` | Game timer |
| `$gameMessage` | Message window |
| `$gameSwitches` | Switches |
| `$gameVariables` | Variables |
| `$gameSelfSwitches` | Self switches |
| `$gameActors` | Actors |
| `$gameParty` | Party |
| `$gameTroop` | Enemy troop |
| `$gameMap` | Map |
| `$gamePlayer` | Player |

## Data Management Workflow

The overall data flow follows this pattern:

1. **Loading**: JSON files are loaded into data objects (`$data*`)
2. **Processing**: Note tags are parsed and additional setup is performed
3. **Instantiation**: Game objects (`$game*`) are created from data templates
4. **Runtime Access**: Game code accesses both data objects (templates) and game objects (instances)
5. **Saving**: Game objects are serialized to save files
6. **Loading**: Game objects are restored from save files

## Error Handling

The system includes robust error handling for data loading issues:

```javascript
// Check for database loading errors
DataManager.checkError = function() {
    if (this._errorUrl) {
        throw new Error("Failed to load: " + this._errorUrl);
    }
};

// Create error handler for resource loading
ResourceHandler.createLoader = function(url, loadMethod, errorMethod) {
    return function() {
        try {
            loadMethod();
            return true;
        } catch (e) {
            if (errorMethod) {
                errorMethod();
            }
            if (url) {
                this._errorUrl = url;
            }
            return false;
        }
    }.bind(this);
};
```

## Asynchronous Loading Management

RPG Maker MZ manages asynchronous loading with callback-based patterns:

```javascript
// Scene_Boot loading process
Scene_Boot.prototype.isReady = function() {
    if (!DataManager.isDatabaseLoaded()) {
        // Wait until database is loaded
        return false;
    }
    
    // Wait for needed resources
    return Scene_Base.prototype.isReady.call(this) &&
        this.isGameFontLoaded();
};

// Font loading check
Scene_Boot.prototype.isGameFontLoaded = function() {
    if (Graphics.isFontLoaded("GameFont")) {
        return true;
    } else {
        // Keep checking until font loads
        const startTime = Date.now();
        if (Date.now() - startTime >= 60000) {
            // Timeout after waiting too long
            throw new Error("Failed to load GameFont");
        }
        return false;
    }
};
```

## Conditional Data Loading

The system can load different data based on testing modes:

```javascript
// Check if in battle test mode
DataManager.isBattleTest = function() {
    return Utils.isOptionValid("btest");
};

// Check if in event test mode
DataManager.isEventTest = function() {
    return Utils.isOptionValid("etest");
};

// Specialized setup for battle test
DataManager.setupBattleTest = function() {
    this.createGameObjects();
    $gameParty.setupBattleTest();
    $gameTroop.setupBattleTest();
    $gameScreen.setup();
};

// Specialized setup for event test
DataManager.setupEventTest = function() {
    this.createGameObjects();
    this.selectSavefileForNewGame();
    $gameParty.setupStartingMembers();
    $gamePlayer.reserveTransfer(-1, 8, 6);
    $gamePlayer.setTransparent(false);
};
```

## Plugin Integration with Data Loading

Plugins can hook into the data loading processes to modify or extend functionality:

```javascript
// Example of a plugin extending the data loading system
PluginManager.registerCommand("CustomData", "LoadCustomData", args => {
    const filename = args.filename;
    
    // Custom data loading function
    const loadCustomData = () => {
        const xhr = new XMLHttpRequest();
        const url = "data/" + filename;
        xhr.open("GET", url);
        xhr.overrideMimeType("application/json");
        
        xhr.onload = () => {
            if (xhr.status < 400) {
                const data = JSON.parse(xhr.responseText);
                // Process custom data
                $gameSystem.setCustomData(data);
            }
        };
        
        xhr.onerror = () => {
            console.error("Failed to load custom data: " + filename);
        };
        
        xhr.send();
    };
    
    loadCustomData();
});
```