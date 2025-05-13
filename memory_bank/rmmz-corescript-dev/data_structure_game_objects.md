# RPG Maker MZ - Game Object System

This document details the runtime game objects in RPG Maker MZ that represent the active game state and their relationship to the database templates.

## Game Objects vs Database Objects

RPG Maker MZ uses two distinct types of data structures:

1. **Database Objects** (`$data*`) - Static template data loaded from JSON files
2. **Game Objects** (`$game*`) - Dynamic runtime instances that represent the current game state

While database objects provide the templates, game objects manage the active state during gameplay, including all modifications that occur during a playthrough.

## Core Game Object Architecture

### Base Game Object Classes

All game objects follow a similar pattern with initialization, update methods, and state management.

```javascript
// Game_Temp - Temporary data not saved to game files
function Game_Temp() {
    this.initialize(...arguments);
}

Game_Temp.prototype.initialize = function() {
    this._isPlaytest = Utils.isOptionValid("test");
    this._commonEventId = 0;
    this._destinationX = null;
    this._destinationY = null;
};

// Game_System - Manages system-related data
function Game_System() {
    this.initialize(...arguments);
}

Game_System.prototype.initialize = function() {
    this._saveEnabled = true;
    this._menuEnabled = true;
    this._encounterEnabled = true;
    this._formationEnabled = true;
    this._battleCount = 0;
    this._winCount = 0;
    this._escapeCount = 0;
    this._saveCount = 0;
    this._versionId = 0;
    this._framesOnSave = 0;
    this._bgmOnSave = null;
    this._bgsOnSave = null;
    this._windowTone = null;
    this._battleBgm = null;
    this._victoryMe = null;
    this._defeatMe = null;
    this._savedBgm = null;
    this._walkingBgm = null;
};
```

## Game State Management Objects

### Switches and Variables

```javascript
// Game_Switches - Manages all game switches
function Game_Switches() {
    this.initialize(...arguments);
}

Game_Switches.prototype.initialize = function() {
    this.clear();
};

Game_Switches.prototype.clear = function() {
    this._data = [];
};

Game_Switches.prototype.value = function(switchId) {
    return !!this._data[switchId];
};

Game_Switches.prototype.setValue = function(switchId, value) {
    if (switchId > 0 && switchId < $dataSystem.switches.length) {
        this._data[switchId] = value;
        this.onChange();
    }
};

// Game_Variables - Manages all game variables
function Game_Variables() {
    this.initialize(...arguments);
}

Game_Variables.prototype.initialize = function() {
    this.clear();
};

Game_Variables.prototype.clear = function() {
    this._data = [];
};

Game_Variables.prototype.value = function(variableId) {
    return this._data[variableId] || 0;
};

Game_Variables.prototype.setValue = function(variableId, value) {
    if (variableId > 0 && variableId < $dataSystem.variables.length) {
        if (typeof value === "number") {
            value = Math.floor(value);
        }
        this._data[variableId] = value;
        this.onChange();
    }
};
```

### Self Switches

```javascript
// Game_SelfSwitches - Manages event-specific self switches
function Game_SelfSwitches() {
    this.initialize(...arguments);
}

Game_SelfSwitches.prototype.initialize = function() {
    this.clear();
};

Game_SelfSwitches.prototype.clear = function() {
    this._data = {};
};

Game_SelfSwitches.prototype.value = function(key) {
    return !!this._data[key];
};

Game_SelfSwitches.prototype.setValue = function(key, value) {
    this._data[key] = value;
    this.onChange();
};

// Key format: [mapId, eventId, switchLetter]
Game_SelfSwitches.prototype.key = function(mapId, eventId, letter) {
    return [mapId, eventId, letter].join(",");
};
```

## Character-Related Game Objects

### Game_Actors System

```javascript
// Game_Actors - Container for all Game_Actor instances
function Game_Actors() {
    this.initialize(...arguments);
}

Game_Actors.prototype.initialize = function() {
    this._data = [];
};

Game_Actors.prototype.actor = function(actorId) {
    if ($dataActors[actorId]) {
        if (!this._data[actorId]) {
            this._data[actorId] = new Game_Actor(actorId);
        }
        return this._data[actorId];
    }
    return null;
};

// Game_Actor - Individual actor instance
function Game_Actor() {
    this.initialize(...arguments);
}

Game_Actor.prototype = Object.create(Game_Battler.prototype);
Game_Actor.prototype.constructor = Game_Actor;

Game_Actor.prototype.initialize = function(actorId) {
    Game_Battler.prototype.initialize.call(this);
    this.setup(actorId);
};

Game_Actor.prototype.setup = function(actorId) {
    const actor = $dataActors[actorId];
    this._actorId = actorId;
    this._name = actor.name;
    this._nickname = actor.nickname;
    this._classId = actor.classId;
    this._level = actor.initialLevel;
    this._characterName = actor.characterName;
    this._characterIndex = actor.characterIndex;
    this._faceName = actor.faceName;
    this._faceIndex = actor.faceIndex;
    this._battlerName = actor.battlerName;
    this.clearParamPlus();
    this.initExp();
    this.initSkills();
    this.initEquips(actor.equips);
    this.clearStatesCoreValues();
    this.recoverAll();
};
```

### Game_Party System

```javascript
// Game_Party - Manages the player's party
function Game_Party() {
    this.initialize(...arguments);
}

Game_Party.prototype = Object.create(Game_Unit.prototype);
Game_Party.prototype.constructor = Game_Party;

Game_Party.prototype.initialize = function() {
    Game_Unit.prototype.initialize.call(this);
    this._gold = 0;
    this._steps = 0;
    this._lastItem = new Game_Item();
    this._menuActorId = 0;
    this._targetActorId = 0;
    this._actors = [];
    this.initAllItems();
};

// Setup the starting party members
Game_Party.prototype.setupStartingMembers = function() {
    this._actors = [];
    for (const actorId of $dataSystem.partyMembers) {
        if ($gameActors.actor(actorId)) {
            this._actors.push(actorId);
        }
    }
};

// Add an actor to the party
Game_Party.prototype.addActor = function(actorId) {
    if (!this._actors.includes(actorId)) {
        this._actors.push(actorId);
        $gamePlayer.refresh();
        $gameMap.requestRefresh();
        $gameTemp.requestBattleRefresh();
        if (this.inBattle()) {
            const actor = $gameActors.actor(actorId);
            if (this.battleMembers().includes(actor)) {
                actor.onBattleStart();
            }
        }
    }
};

// Get inventory items
Game_Party.prototype.items = function() {
    return this.allItems().filter(item => DataManager.isItem(item));
};
```

### Game_Troop System

```javascript
// Game_Troop - Manages enemy troops in battle
function Game_Troop() {
    this.initialize(...arguments);
}

Game_Troop.prototype = Object.create(Game_Unit.prototype);
Game_Troop.prototype.constructor = Game_Troop;

Game_Troop.prototype.initialize = function() {
    Game_Unit.prototype.initialize.call(this);
    this._interpreter = new Game_Interpreter();
    this.clear();
};

Game_Troop.prototype.clear = function() {
    this._troopId = 0;
    this._eventFlags = {};
    this._enemies = [];
    this._turnCount = 0;
    this._namesCount = {};
};

// Setup a troop for battle
Game_Troop.prototype.setup = function(troopId) {
    this.clear();
    this._troopId = troopId;
    this._enemies = [];
    
    // Create enemy instances based on troop data
    for (const member of this.troop().members) {
        if ($dataEnemies[member.enemyId]) {
            const enemyId = member.enemyId;
            const x = member.x;
            const y = member.y;
            const enemy = new Game_Enemy(enemyId, x, y);
            if (member.hidden) {
                enemy.hide();
            }
            this._enemies.push(enemy);
        }
    }
    
    this.makeUniqueNames();
};
```

## Map-Related Game Objects

### Game_Map System

```javascript
// Game_Map - Manages the game map
function Game_Map() {
    this.initialize(...arguments);
}

Game_Map.prototype.initialize = function() {
    this._mapId = 0;
    this._tilesetId = 0;
    this._events = [];
    this._commonEvents = [];
    this._vehicles = [];
    this._displayX = 0;
    this._displayY = 0;
    this._nameDisplay = true;
    this._scrollDirection = 2;
    this._scrollRest = 0;
    this._scrollSpeed = 4;
    this._parallaxName = "";
    this._parallaxZero = false;
    this._parallaxLoopX = false;
    this._parallaxLoopY = false;
    this._parallaxSx = 0;
    this._parallaxSy = 0;
    this._parallaxX = 0;
    this._parallaxY = 0;
    this._battleback1Name = null;
    this._battleback2Name = null;
    this.createVehicles();
};

// Setup a map
Game_Map.prototype.setup = function(mapId) {
    if (!$dataMap) {
        throw new Error("The map data is not available");
    }
    
    this._mapId = mapId;
    this._tilesetId = $dataMap.tilesetId;
    this._displayX = 0;
    this._displayY = 0;
    
    this.refereshVehicles();
    this.setupEvents();
    this.setupScroll();
    this.setupParallax();
    this.setupBattleback();
    
    this._needsRefresh = false;
};

// Setup events on the map
Game_Map.prototype.setupEvents = function() {
    this._events = [];
    this._commonEvents = [];
    
    for (let i = 0; i < $dataMap.events.length; i++) {
        if ($dataMap.events[i]) {
            this._events[i] = new Game_Event(this._mapId, i);
        }
    }
    
    for (let i = 0; i < $dataCommonEvents.length; i++) {
        if ($dataCommonEvents[i]) {
            if ($dataCommonEvents[i].trigger === 2) {
                this._commonEvents.push(new Game_CommonEvent(i));
            }
        }
    }
    
    this.refreshTileEvents();
};
```

### Game_CharacterBase and Derived Classes

```javascript
// Game_CharacterBase - Base class for map characters
function Game_CharacterBase() {
    this.initialize(...arguments);
}

Game_CharacterBase.prototype.initialize = function() {
    this.initMembers();
};

Game_CharacterBase.prototype.initMembers = function() {
    this._x = 0;
    this._y = 0;
    this._realX = 0;
    this._realY = 0;
    this._moveSpeed = 4;
    this._moveFrequency = 6;
    this._opacity = 255;
    this._blendMode = 0;
    this._direction = 2;
    this._pattern = 1;
    this._priorityType = 1;
    this._tileId = 0;
    this._characterName = "";
    this._characterIndex = 0;
    this._isObjectCharacter = false;
    this._walkAnime = true;
    this._stepAnime = false;
    this._directionFix = false;
    this._through = false;
    this._transparent = false;
    this._bushDepth = 0;
    this._animationId = 0;
    this._balloonId = 0;
    this._animationPlaying = false;
    this._balloonPlaying = false;
    this._animationCount = 0;
    this._stopCount = 0;
    this._jumpCount = 0;
    this._jumpPeak = 0;
    this._movementSuccess = true;
};

// Game_Character - Extended character with movement routes
function Game_Character() {
    this.initialize(...arguments);
}

Game_Character.prototype = Object.create(Game_CharacterBase.prototype);
Game_Character.prototype.constructor = Game_Character;

// Game_Player - The player character
function Game_Player() {
    this.initialize(...arguments);
}

Game_Player.prototype = Object.create(Game_Character.prototype);
Game_Player.prototype.constructor = Game_Player;

// Game_Follower - Party followers
function Game_Follower() {
    this.initialize(...arguments);
}

Game_Follower.prototype = Object.create(Game_Character.prototype);
Game_Follower.prototype.constructor = Game_Follower;

// Game_Event - Map events
function Game_Event() {
    this.initialize(...arguments);
}

Game_Event.prototype = Object.create(Game_Character.prototype);
Game_Event.prototype.constructor = Game_Event;
```

## Battle-Related Game Objects

### Game_Battler System

```javascript
// Game_Battler - Base class for battle participants
function Game_Battler() {
    this.initialize(...arguments);
}

Game_Battler.prototype = Object.create(Game_BattlerBase.prototype);
Game_Battler.prototype.constructor = Game_Battler;

Game_Battler.prototype.initialize = function() {
    Game_BattlerBase.prototype.initialize.call(this);
    this._actions = [];
    this._speed = 0;
    this._result = new Game_ActionResult();
    this._actionState = "";
    this._lastTargetIndex = 0;
    this._damagePopup = false;
    this._effectType = null;
    this._motionType = null;
    this._weaponImageId = 0;
    this._motionRefresh = false;
    this._selected = false;
};

// Game_Enemy - Individual enemy in battle
function Game_Enemy() {
    this.initialize(...arguments);
}

Game_Enemy.prototype = Object.create(Game_Battler.prototype);
Game_Enemy.prototype.constructor = Game_Enemy;

Game_Enemy.prototype.initialize = function(enemyId, x, y) {
    Game_Battler.prototype.initialize.call(this);
    this.setup(enemyId, x, y);
};

Game_Enemy.prototype.setup = function(enemyId, x, y) {
    this._enemyId = enemyId;
    this._original = new Game_Enemy(enemyId, x, y);
    this._x = x;
    this._y = y;
    this._gold = $dataEnemies[enemyId].gold;
    this._exp = $dataEnemies[enemyId].exp;
    this._letter = "";
    this._plural = false;
    this._screenX = 0;
    this._screenY = 0;
};
```

## Interpreter and Action Game Objects

### Game_Interpreter

```javascript
// Game_Interpreter - Executes event commands
function Game_Interpreter() {
    this.initialize(...arguments);
}

Game_Interpreter.prototype.initialize = function(depth) {
    this._depth = depth || 0;
    this.clear();
};

Game_Interpreter.prototype.clear = function() {
    this._mapId = 0;
    this._eventId = 0;
    this._list = null;
    this._index = 0;
    this._waitCount = 0;
    this._waitMode = "";
    this._comments = [];
    this._indent = 0;
    this._branch = {};
    this._choices = [];
    this._params = [];
    this._charaData = null;
};

Game_Interpreter.prototype.setup = function(list, eventId) {
    this.clear();
    this._mapId = $gameMap.mapId();
    this._eventId = eventId || 0;
    this._list = list;
    
    // Process code if available
    if (list && list.length > 0) {
        this._startBattle = false;
    }
};
```

### Game_Action

```javascript
// Game_Action - Manages battle actions
function Game_Action() {
    this.initialize(...arguments);
}

Game_Action.prototype.initialize = function(subject, forcing) {
    this._subjectActorId = 0;
    this._subjectEnemyIndex = -1;
    this._forcing = forcing || false;
    this.clear();
    if (subject) {
        if (subject.isActor()) {
            this._subjectActorId = subject.actorId();
        } else {
            this._subjectEnemyIndex = subject.index();
        }
        this.setAttack();
    }
};

Game_Action.prototype.clear = function() {
    this._item = new Game_Item();
    this._targetIndex = -1;
};

Game_Action.prototype.setSkill = function(skillId) {
    this._item.setObject($dataSkills[skillId]);
};

Game_Action.prototype.setItem = function(itemId) {
    this._item.setObject($dataItems[itemId]);
};

Game_Action.prototype.setItemObject = function(item) {
    this._item.setObject(item);
};
```

## Memory Management in Game Objects

Game objects need to properly manage references to avoid memory leaks:

```javascript
// Clear references when cleaning up
Game_Map.prototype.clearEvents = function() {
    // Clear event references
    if (this._events) {
        for (const event of this._events) {
            if (event) {
                event.clearStartingFlag();
            }
        }
        this._events = [];
    }
    
    // Clear common event references
    if (this._commonEvents) {
        this._commonEvents = [];
    }
};

// Clean actor data
Game_Actor.prototype.clearStates = function() {
    Game_Battler.prototype.clearStates.call(this);
    this._stateSteps = {};
};
```

## Global Game Object Instances

The following global instances are created when a new game starts or a saved game is loaded:

```javascript
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

## Object Serialization for Save Data

Game objects need to be properly serialized when saving and loading game data:

```javascript
// Make save data contents
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

// Extract save contents
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

## Prototypal Inheritance in Game Objects

RPG Maker MZ uses prototype-based inheritance for game objects:

```javascript
// Inheritance chain example
Game_CharacterBase → Game_Character → Game_Player
Game_CharacterBase → Game_Character → Game_Event
Game_CharacterBase → Game_Character → Game_Follower
Game_CharacterBase → Game_Character → Game_Vehicle

Game_BattlerBase → Game_Battler → Game_Actor
Game_BattlerBase → Game_Battler → Game_Enemy

Game_Unit → Game_Party
Game_Unit → Game_Troop
```

## Extension of Game Objects by Plugins

Plugins can extend game objects to add new functionality:

```javascript
// Example of extending Game_Actor with a plugin
(function() {
    // Store original method
    const _Game_Actor_setup = Game_Actor.prototype.setup;
    
    // Override method
    Game_Actor.prototype.setup = function(actorId) {
        // Call original method
        _Game_Actor_setup.call(this, actorId);
        
        // Add new property
        this._customStatPoints = 0;
        
        // Initialize from note tags if available
        const actor = $dataActors[actorId];
        if (actor.meta.StatPoints) {
            this._customStatPoints = Number(actor.meta.StatPoints);
        }
    };
    
    // Add new method
    Game_Actor.prototype.addStatPoints = function(points) {
        this._customStatPoints += points;
    };
    
    // Add new method
    Game_Actor.prototype.customStatPoints = function() {
        return this._customStatPoints;
    };
})();
```