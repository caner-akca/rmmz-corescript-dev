# RPG Maker MZ - Character System

The character system in RPG Maker MZ encompasses all entities that can appear on maps, including the player, event characters, and followers.

## Character Hierarchy

### Game_CharacterBase
- Located in `rmmz_objects/Game_CharacterBase.js`
- Base class for all map-based characters
- Handles basic movement, animation, and collision
- Manages character sprites and movement speed

### Game_Character
- Located in `rmmz_objects/Game_Character.js`
- Extends Game_CharacterBase with more complex behavior
- Handles route movement and pathing
- Manages character direction and turning

### Game_Player
- Located in `rmmz_objects/Game_Player.js`
- Controls the player character
- Handles map scrolling and interaction with events
- Manages vehicle boarding and dismounting
- Controls encounter processing

### Game_Follower / Game_Followers
- Located in `rmmz_objects/Game_Follower.js` and `Game_Followers.js`
- Manages party members that follow the leader
- Handles smooth following behavior
- Controls visibility and gathering

### Game_Event
- Located in `rmmz_objects/Game_Event.js`
- Represents event characters on maps
- Handles event page conditions and switching
- Manages autonomous movement and triggers

### Game_Vehicle
- Located in `rmmz_objects/Game_Vehicle.js`
- Special character type for boats, ships, and airships
- Handles unique movement rules (water/land passability)
- Manages boarding and landing locations

## Character Properties

### Position and Movement
```javascript
// Position on the map
character.x         // X coordinate (tile-based)
character.y         // Y coordinate (tile-based)
character._realX    // Precise X position for smooth movement
character._realY    // Precise Y position for smooth movement
character._moveSpeed // Movement speed (1-6)
character._moveFrequency // How often autonomous movement occurs (1-5)

// Character appearance
character._characterName    // Character sheet filename
character._characterIndex   // Index on character sheet (0-7)
character._direction        // Facing direction (2=down, 4=left, 6=right, 8=up)
character._pattern          // Animation pattern (0-2)
character._priorityType     // Draw priority (0=below, 1=same as, 2=above player)
character._transparent      // Whether character is invisible
```

## Movement Methods

### Basic Movement
```javascript
// Move one step in a direction
character.moveStraight(direction); // 2=down, 4=left, 6=right, 8=up

// Diagonal movement
character.moveDiagonally(horz, vert); // e.g., (4, 2) for down-left

// Random and target-based movement
character.moveRandom();             // Move randomly one step
character.moveToward(X, Y);         // Move one step toward coordinates
character.moveAwayFromCharacter(target); // Move away from another character

// Check if movement is possible
character.canPass(x, y, direction); // Can move from (x,y) in direction?
```

### Route Management
```javascript
// Set a detailed movement route
character.forceMoveRoute({
    list: [
        { code: 1 },       // Move down
        { code: 3 },       // Move right
        { code: 39, parameters: [10] }, // Change speed to 5
        { code: 17 },      // Turn 90° right
        { code: 29 },      // Jump forward
        { code: 0 }        // End of route
    ],
    repeat: false,         // Don't loop
    skippable: false,      // Don't skip if blocked
    wait: true             // Wait for completion
});

// Movement route codes
// 0 = End of route
// 1-4 = Move in direction (down, left, right, up)
// 5-8 = Move toward/away from player
// 9 = Move randomly
// 10-13 = Move forward/backward
// 14-17 = Turn in direction
// 18-19 = Turn random/toward player
// 20 = Switch ON
// 21 = Switch OFF
// 22 = Change speed
// 23 = Change frequency
// 24-27 = Change appearance
// 28-29 = Jump
// 30 = Wait
// (and more)
```

## Event System Integration

### Event Triggers
- **Touch**: Triggered when player touches the event
- **Player Touch**: Triggered when event touches the player
- **Action Button**: Triggered when player presses action button facing event
- **Autorun**: Triggered automatically when conditions are met
- **Parallel**: Runs continuously in parallel with other events

### Condition Checking
```javascript
// Game_Event checks conditions for changing pages
Game_Event.prototype.meetsConditions = function(page) {
    const c = page.conditions;
    if (c.switch1Valid && !$gameSwitches.value(c.switch1Id)) {
        return false;
    }
    if (c.switch2Valid && !$gameSwitches.value(c.switch2Id)) {
        return false;
    }
    if (c.variableValid && $gameVariables.value(c.variableId) < c.variableValue) {
        return false;
    }
    if (c.selfSwitchValid && !$gameSelfSwitches.value([this._mapId, this._eventId, c.selfSwitchCh])) {
        return false;
    }
    if (c.itemValid && !$gameParty.hasItem($dataItems[c.itemId])) {
        return false;
    }
    if (c.actorValid && !$gameParty.members().some(actor => actor.actorId() === c.actorId)) {
        return false;
    }
    return true;
};
```

## Character Sprite Representation

### Sprite_Character
- Located in `rmmz_sprites/Sprite_Character.js`
- Visual representation of characters on screen
- Handles character sheet image loading and cropping
- Controls animation patterns and direction display

```javascript
// How character images are calculated
Sprite_Character.prototype.characterBlockX = function() {
    const index = this._character.characterIndex();
    return (index % 4) * 3;
};

Sprite_Character.prototype.characterBlockY = function() {
    const index = this._character.characterIndex();
    return Math.floor(index / 4) * 4;
};

Sprite_Character.prototype.characterPatternX = function() {
    return this._character.pattern();
};

Sprite_Character.prototype.characterPatternY = function() {
    return (this._character.direction() - 2) / 2;
};
```

## Advanced Character Techniques

### Custom Movement Paths
```javascript
// Calculate a path using A* algorithm (simplified)
Game_Character.prototype.findDirectionTo = function(goalX, goalY) {
    const searchLimit = 12;
    const mapWidth = $gameMap.width();
    const nodeList = [];
    const openList = [];
    const closedList = [];
    const start = {};
    let best = start;
    
    // A* search initialization and processing
    // ...
    
    // Return the first direction in the optimal path
    // or 0 if no path found
    return best.direction;
};
```

### Event Page System
```javascript
// Setup event from event data
Game_Event.prototype.setupPage = function() {
    if (this._pageIndex >= 0) {
        const page = this.page();
        this.setupPageSettings();
        
        // Setup event commands list for interpreter
        if (this._trigger === 4) {
            this._interpreter = new Game_Interpreter();
            this._interpreter.setup(this.list(), this._eventId);
        }
    }
};

// Process triggered event
Game_Event.prototype.start = function() {
    const list = this.list();
    if (list && list.length > 1) {
        this._starting = true;
        if (this.isTriggerIn([0, 1, 2])) {
            this.lock();
        }
    }
};
```

### Character Sheet Structure
Standard character sheets contain:
- 8 characters (arranged in a 4×2 grid)
- Each character has 12 patterns (3 frames × 4 directions)
- Total size: 576×384 pixels (12 tiles width × 8 tiles height)
- Individual frame size: 48×48 pixels