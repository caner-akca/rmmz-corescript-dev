# RPG Maker MZ - Data Loading System

This document details how RPG Maker MZ loads, processes, and manages game data from JSON files, including the database structures and their relationships.

## Core Components

### DataManager
- Located in `rmmz_managers/DataManager.js`
- Responsible for loading and managing all game data files
- Handles save/load operations
- Manages database objects and their relationships

### Database Objects
- Global variables for database data (e.g., `$dataActors`, `$dataItems`)
- File-based data structures for all game elements
- JSON format for all data files

## Data Loading Architecture

### Initialization and Loading Process
```javascript
// Initialize database
DataManager.init = function() {
    this._globalInfo = null;
    this._errors = [];
    this._databaseFiles = [
        { name: "$dataActors", src: "Actors.json" },
        { name: "$dataClasses", src: "Classes.json" },
        { name: "$dataSkills", src: "Skills.json" },
        { name: "$dataItems", src: "Items.json" },
        { name: "$dataWeapons", src: "Weapons.json" },
        { name: "$dataArmors", src: "Armors.json" },
        { name: "$dataEnemies", src: "Enemies.json" },
        { name: "$dataTroops", src: "Troops.json" },
        { name: "$dataStates", src: "States.json" },
        { name: "$dataAnimations", src: "Animations.json" },
        { name: "$dataTilesets", src: "Tilesets.json" },
        { name: "$dataCommonEvents", src: "CommonEvents.json" },
        { name: "$dataSystem", src: "System.json" },
        { name: "$dataMapInfos", src: "MapInfos.json" }
    ];
    this._mapLoaded = false;
    this._tilesetLoaded = false;
};

// Load database files
DataManager.loadDatabase = function() {
    const errorMessages = [];
    for (const file of this._databaseFiles) {
        const name = file.name;
        const src = file.src;
        
        this.loadDataFile(name, src);
    }
};

// Load individual data file
DataManager.loadDataFile = function(name, src) {
    const xhr = new XMLHttpRequest();
    const url = "data/" + src;
    
    xhr.open("GET", url);
    xhr.overrideMimeType("application/json");
    
    xhr.onload = () => {
        if (xhr.status < 400) {
            try {
                window[name] = JSON.parse(xhr.responseText);
                this.onLoad(window[name]);
            } catch (e) {
                this.onError(name, e);
            }
        } else {
            this.onError(name, null);
        }
    };
    
    xhr.onerror = () => this.onError(name, null);
    xhr.send();
};

// Process loaded data
DataManager.onLoad = function(object) {
    // Process extra data and references in loaded data
    if (object === $dataMap) {
        this.onLoadMap();
    } else if (object === $dataTilesets) {
        this.onLoadTilesets();
    }
};
```

### Database Preparation
```javascript
// Check if database is loaded
DataManager.isDatabaseLoaded = function() {
    return this.isMapLoaded() && this.isTilesetLoaded();
};

// Check if map data is loaded
DataManager.isMapLoaded = function() {
    this._mapLoaded = this._mapLoaded || !!$dataMap;
    return this._mapLoaded;
};

// Check if tileset data is loaded
DataManager.isTilesetLoaded = function() {
    this._tilesetLoaded = this._tilesetLoaded || !!$dataTilesets;
    return this._tilesetLoaded;
};

// Process map data after loading
DataManager.onLoadMap = function() {
    this.extractMetadata($dataMap);
    this.extractArrayMetadata($dataMap.events);
    
    // Set up map structure
    const array = $dataMap.events;
    if (array) {
        for (let i = 0; i < array.length; i++) {
            const data = array[i];
            if (data && data.note !== undefined) {
                this.extractMetadata(data);
            }
        }
    }

    // Process map events
    for (const event of $dataMap.events.filter(event => !!event)) {
        for (const page of event.pages) {
            this.extractMetadata(page);
        }
    }
};

// Process tileset data after loading
DataManager.onLoadTilesets = function() {
    for (const tileset of $dataTilesets) {
        if (tileset) {
            this.extractMetadata(tileset);
        }
    }
};
```

## Metadata and Notes Processing

### Metadata Extraction
```javascript
// Extract metadata from note fields
DataManager.extractMetadata = function(data) {
    if (!data.note) return;
    
    const re = /<([^<>:]+)(?::([^>]*))?>/g;
    data.meta = {};
    
    let match;
    while (match = re.exec(data.note)) {
        const key = match[1].trim();
        const value = match[2] ? match[2].trim() : true;
        
        // Store in meta object
        data.meta[key] = value;
    }
};

// Extract metadata from array elements
DataManager.extractArrayMetadata = function(array) {
    if (array) {
        for (const data of array) {
            if (data && data.note !== undefined) {
                this.extractMetadata(data);
            }
        }
    }
};
```

### Additional Data Processing
```javascript
// Process all database objects
DataManager.checkError = function() {
    if (this._errors.length > 0) {
        const error = this._errors.shift();
        const retry = () => {
            this.loadDataFile(error.name, error.src);
        };
        throw new Error(`Failed to load ${error.name}: ${error.error}\nPress F5 to retry.`);
    }
    
    return false;
};

// Process loaded database for efficient access
DataManager.processDatabase = function() {
    // Process all database objects for lookup and relationships
    this.processItems();
    this.processSkills();
    this.processStates();
    this.processTilesets();
};

// Process item data relationships
DataManager.processItems = function() {
    // Set up initial item references
    for (const item of $dataItems) {
        if (item) {
            item.stypeId = 0;  // Set type for filtering
            item.itypeId = 1;
        }
    }
    
    // Set up weapon references
    for (const weapon of $dataWeapons) {
        if (weapon) {
            weapon.stypeId = 0;  // Set type for filtering
            weapon.wtypeId = weapon.wtypeId || 0;
        }
    }
    
    // Set up armor references
    for (const armor of $dataArmors) {
        if (armor) {
            armor.stypeId = 0;  // Set type for filtering
            armor.atypeId = armor.atypeId || 0;
        }
    }
};

// Process skill data relationships
DataManager.processSkills = function() {
    for (const skill of $dataSkills) {
        if (skill) {
            skill.stypeId = skill.stypeId || 0;
            skill.itypeId = 0;  // Set type for filtering
            skill.damage.type = skill.damage.type || 0;
        }
    }
};

// Process state data
DataManager.processStates = function() {
    for (const state of $dataStates) {
        if (state) {
            state.iconIndex = state.iconIndex || 0;
            state.priority = state.priority || 0;
        }
    }
};

// Process tileset data
DataManager.processTilesets = function() {
    for (const tileset of $dataTilesets) {
        if (tileset) {
            tileset.flags = tileset.flags || [];
            tileset.tilesetNames = tileset.tilesetNames || [];
        }
    }
};
```

## Map Data Loading

### Map Data Structure
```javascript
// Structure of map data
/*
$dataMap = {
    autoplayBgm: boolean,
    autoplayBgs: boolean,
    battleback1Name: string,
    battleback2Name: string,
    bgm: AudioFile,
    bgs: AudioFile,
    disableDashing: boolean,
    displayName: string,
    encounterList: array,
    encounterStep: number,
    events: array,
    height: number,
    note: string,
    parallaxLoopX: boolean,
    parallaxLoopY: boolean,
    parallaxName: string,
    parallaxShow: boolean,
    parallaxSx: number,
    parallaxSy: number,
    scrollType: number,
    specifyBattleback: boolean,
    tilesetId: number,
    width: number,
    data: array,
    meta: object
};
*/

// Load map data
DataManager.loadMapData = function(mapId) {
    if (mapId > 0) {
        const filename = "Map%1.json".format(mapId.padZero(3));
        this.loadDataFile("$dataMap", filename);
    } else {
        // Create an empty map
        this.makeEmptyMap();
    }
};

// Create empty map when no map is loaded
DataManager.makeEmptyMap = function() {
    $dataMap = {};
    $dataMap.events = [];
    $dataMap.width = 100;
    $dataMap.height = 100;
    $dataMap.data = [];
    
    // Fill map with empty data
    const size = $dataMap.width * $dataMap.height;
    for (let i = 0; i < size; i++) {
        $dataMap.data.push(0);
    }
};
```

### Map and Events Relationships
```javascript
// Get map information
DataManager.getMapInfo = function(mapId) {
    return $dataMapInfos[mapId];
};

// Load map event data
Game_Map.prototype.setupEvents = function() {
    this._events = [];
    this._commonEvents = [];
    
    // Create map events from data
    for (let i = 0; i < $dataMap.events.length; i++) {
        if ($dataMap.events[i]) {
            this._events[i] = new Game_Event(this._mapId, i);
        }
    }
    
    // Create common events
    this.refreshTileEvents();
    this._needsRefresh = false;
};

// Process event data
Game_Event.prototype.setupPageSettings = function() {
    const page = this.page();
    if (page) {
        this.setImage(page.image.characterName, page.image.characterIndex);
        this.setMoveSpeed(page.moveSpeed);
        this.setMoveFrequency(page.moveFrequency);
        this.setPriorityType(page.priorityType);
        this.setWalkAnime(page.walkAnime);
        this.setStepAnime(page.stepAnime);
        this.setDirectionFix(page.directionFix);
        this.setThrough(page.through);
        this.setMoveRoute(page.moveRoute);
        
        // Set up trigger conditions
        this._trigger = page.trigger;
        this._triggerCondition = page.conditions;
        
        // Set up event commands
        if (this._trigger === 4) {
            // Parallel trigger
            this._interpreter = new Game_Interpreter();
            this._interpreter.setup(page.list, this._eventId);
        }
    }
};
```

## Database Structure Relationships

### Actor Data

```javascript
// Structure of actor data
/*
$dataActors[id] = {
    id: number,
    name: string,
    nickname: string,
    classId: number,
    initialLevel: number,
    maxLevel: number,
    characterName: string,
    characterIndex: number,
    faceName: string,
    faceIndex: number,
    traits: array,
    profile: string,
    meta: object
};
*/

// Set up actor from database data
Game_Actor.prototype.setup = function(actorId) {
    const actor = $dataActors[actorId];
    this._actorId = actorId;
    this._name = actor.name;
    this._nickname = actor.nickname;
    this._profile = actor.profile;
    this._classId = actor.classId;
    this._level = actor.initialLevel;
    
    // Set up actor appearance
    this.initImages();
    this.initExp();
    this.initSkills();
    this.initEquips(actor.equips);
    this.clearParamPlus();
    this.recoverAll();
};

// Initialize actor images
Game_Actor.prototype.initImages = function() {
    const actor = $dataActors[this._actorId];
    this._characterName = actor.characterName;
    this._characterIndex = actor.characterIndex;
    this._faceName = actor.faceName;
    this._faceIndex = actor.faceIndex;
    this._battlerName = actor.battlerName;
};
```

### Item, Weapon, and Armor Data
```javascript
// Structure of item data
/*
$dataItems[id] = {
    id: number,
    animationId: number,
    consumable: boolean,
    damage: Damage,
    description: string,
    effects: array,
    hitType: number,
    iconIndex: number,
    itypeId: number,
    name: string,
    note: string,
    occasion: number,
    price: number,
    repeats: number,
    scope: number,
    speed: number,
    successRate: number,
    meta: object
};
*/

// Process item effects
Game_Action.prototype.applyItemEffect = function(target, effect) {
    switch (effect.code) {
        case Game_Action.EFFECT_RECOVER_HP:
            this.itemEffectRecoverHp(target, effect);
            break;
        case Game_Action.EFFECT_RECOVER_MP:
            this.itemEffectRecoverMp(target, effect);
            break;
        case Game_Action.EFFECT_GAIN_TP:
            this.itemEffectGainTp(target, effect);
            break;
        case Game_Action.EFFECT_ADD_STATE:
            this.itemEffectAddState(target, effect);
            break;
        case Game_Action.EFFECT_REMOVE_STATE:
            this.itemEffectRemoveState(target, effect);
            break;
        case Game_Action.EFFECT_ADD_BUFF:
            this.itemEffectAddBuff(target, effect);
            break;
        case Game_Action.EFFECT_ADD_DEBUFF:
            this.itemEffectAddDebuff(target, effect);
            break;
        case Game_Action.EFFECT_REMOVE_BUFF:
            this.itemEffectRemoveBuff(target, effect);
            break;
        case Game_Action.EFFECT_REMOVE_DEBUFF:
            this.itemEffectRemoveDebuff(target, effect);
            break;
        case Game_Action.EFFECT_SPECIAL:
            this.itemEffectSpecial(target, effect);
            break;
        case Game_Action.EFFECT_GROW:
            this.itemEffectGrow(target, effect);
            break;
        case Game_Action.EFFECT_LEARN_SKILL:
            this.itemEffectLearnSkill(target, effect);
            break;
        case Game_Action.EFFECT_COMMON_EVENT:
            this.itemEffectCommonEvent(target, effect);
            break;
    }
};

// Check item type
Game_Item.prototype.isItem = function() {
    return this.itypeId() > 0;
};

Game_Item.prototype.isWeapon = function() {
    return this.itypeId() === 0 && this._dataClass === "weapon";
};

Game_Item.prototype.isArmor = function() {
    return this.itypeId() === 0 && this._dataClass === "armor";
};
```

### Skill Data
```javascript
// Structure of skill data
/*
$dataSkills[id] = {
    id: number,
    animationId: number,
    damage: Damage,
    description: string,
    effects: array,
    hitType: number,
    iconIndex: number,
    message1: string,
    message2: string,
    mpCost: number,
    name: string,
    note: string,
    occasion: number,
    repeats: number,
    requiredWtypeId1: number,
    requiredWtypeId2: number,
    scope: number,
    speed: number,
    stypeId: number,
    successRate: number,
    tpCost: number,
    tpGain: number,
    meta: object
};
*/

// Check if actor can use skill
Game_Actor.prototype.canUse = function(item) {
    if (!item) {
        return false;
    }
    
    // Check item or skill availability
    if (DataManager.isSkill(item)) {
        return this.canUseSkill(item) && this.isSkillWtypeOk(item);
    } else {
        return this.canUseItem(item);
    }
};

// Check if skill is available
Game_Actor.prototype.canUseSkill = function(skill) {
    return (
        this.isSkillWtypeOk(skill) &&
        this.skillTpCost(skill) <= this.tp() &&
        this.skillMpCost(skill) <= this.mp() &&
        !this.isSkillSealed(skill.id) &&
        !this.isSkillTypeSealed(skill.stypeId)
    );
};
```

### Enemy and Troop Data
```javascript
// Structure of enemy data
/*
$dataEnemies[id] = {
    id: number,
    actions: array,
    battlerHue: number,
    battlerName: string,
    dropItems: array,
    exp: number,
    gold: number,
    name: string,
    note: string,
    params: array,
    traits: array,
    meta: object
};
*/

// Structure of troop data
/*
$dataTroops[id] = {
    id: number,
    members: array,
    name: string,
    note: string,
    pages: array,
    meta: object
};
*/

// Set up enemy from database
Game_Enemy.prototype.setup = function(enemyId, x, y) {
    this._enemyId = enemyId;
    this._screenX = x;
    this._screenY = y;
    
    const enemy = $dataEnemies[enemyId];
    this._battlerName = enemy.battlerName;
    this._battlerHue = enemy.battlerHue;
    
    // Copy traits from database
    this.setPlural(false);
    this.recoverAll();
};

// Set up troop for battle
Game_Troop.prototype.setup = function(troopId) {
    this.clear();
    this._troopId = troopId;
    
    // Get troop data
    const troop = $dataTroops[troopId];
    
    // Set up enemies in the troop
    for (const member of troop.members) {
        if ($dataEnemies[member.enemyId]) {
            const enemyData = $dataEnemies[member.enemyId];
            const enemy = new Game_Enemy(member.enemyId, member.x, member.y);
            
            // Check if hidden
            if (member.hidden) {
                enemy.hide();
            }
            
            this._enemies.push(enemy);
        }
    }
    
    // Set up troop event pages
    this.makeUniqueNames();
    this.setupBattleEvent();
};
```

## Data Object Management

### Game Object References
```javascript
// Global game objects
window.$gameTemp        = null;
window.$gameSystem      = null;
window.$gameScreen      = null;
window.$gameTimer       = null;
window.$gameMessage     = null;
window.$gameSwitches    = null;
window.$gameVariables   = null;
window.$gameSelfSwitches = null;
window.$gameActors      = null;
window.$gameParty       = null;
window.$gameTroop       = null;
window.$gameMap         = null;
window.$gamePlayer      = null;

// Create game objects
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

// Setup new game with initial data
DataManager.setupNewGame = function() {
    this.createGameObjects();
    this.selectSavefileForNewGame();
    $gameParty.setupStartingMembers();
    $gamePlayer.setupForNewGame();
    Graphics.frameCount = 0;
};
```

### Object Serialization
```javascript
// Save game data to JSON
DataManager.makeSaveContents = function() {
    // Create a snapshot of all game objects
    const contents = {};
    contents.system        = $gameSystem;
    contents.screen        = $gameScreen;
    contents.timer         = $gameTimer;
    contents.switches      = $gameSwitches;
    contents.variables     = $gameVariables;
    contents.selfSwitches  = $gameSelfSwitches;
    contents.actors        = $gameActors;
    contents.party         = $gameParty;
    contents.map           = $gameMap;
    contents.player        = $gamePlayer;
    
    return contents;
};

// Extract save data into game objects
DataManager.extractSaveContents = function(contents) {
    $gameSystem        = contents.system;
    $gameScreen        = contents.screen;
    $gameTimer         = contents.timer;
    $gameSwitches      = contents.switches;
    $gameVariables     = contents.variables;
    $gameSelfSwitches  = contents.selfSwitches;
    $gameActors        = contents.actors;
    $gameParty         = contents.party;
    $gameMap           = contents.map;
    $gamePlayer        = contents.player;
    
    // Restore references
    $gameTemp = new Game_Temp();
    $gameMessage = new Game_Message();
    $gameTroop = new Game_Troop();
};
```

## Data Type Utilities

### Data Type Detection
```javascript
// Check data types
DataManager.isSkill = function(item) {
    return item && item.itypeId === 0 && item.stypeId > 0;
};

DataManager.isItem = function(item) {
    return item && item.itypeId > 0;
};

DataManager.isWeapon = function(item) {
    return item && item.wtypeId > 0;
};

DataManager.isArmor = function(item) {
    return item && item.atypeId > 0;
};

// Get database object by type and ID
DataManager.getDataItem = function(type, id) {
    switch (type) {
        case "item":
            return $dataItems[id];
        case "weapon":
            return $dataWeapons[id];
        case "armor":
            return $dataArmors[id];
        case "skill":
            return $dataSkills[id];
        case "state":
            return $dataStates[id];
        case "enemy":
            return $dataEnemies[id];
    }
    return null;
};
```

### Object Creation
```javascript
// Create game item object from data
DataManager.createGameItem = function(type, id) {
    const item = new Game_Item();
    
    if (type === "item") {
        item.setObject($dataItems[id]);
    } else if (type === "weapon") {
        item.setObject($dataWeapons[id]);
    } else if (type === "armor") {
        item.setObject($dataArmors[id]);
    } else if (type === "skill") {
        item.setObject($dataSkills[id]);
    }
    
    return item;
};

// Create battler from enemy data
DataManager.createGameEnemy = function(id, x, y) {
    if ($dataEnemies[id]) {
        return new Game_Enemy(id, x, y);
    }
    return null;
};

// Create actor from actor data
DataManager.createGameActor = function(id) {
    if ($dataActors[id]) {
        $gameActors.actor(id).setup(id);
        return $gameActors.actor(id);
    }
    return null;
};
```