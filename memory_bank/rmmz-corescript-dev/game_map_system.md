# RPG Maker MZ - Game_Map System

The Game_Map class in RPG Maker MZ manages the current map, its events, and all map-related functionality including scrolling, encounters, and terrain.

## Core Structure

### Class Information
- Located in `rmmz_objects/Game_Map.js`
- Instantiated as a single global object `$gameMap`
- Represents the currently loaded map and all its components

## Map Data and Properties

### Basic Map Properties
```javascript
// Map identification
$gameMap.mapId();        // Get current map ID
$gameMap.displayName();  // Get display name
$gameMap.width();        // Get map width (in tiles)
$gameMap.height();       // Get map height (in tiles)
$gameMap.data();         // Get map data array
$gameMap.isLoopHorizontal(); // Check if horizontal looping
$gameMap.isLoopVertical(); // Check if vertical looping
$gameMap.isDashDisabled(); // Check if dashing is disabled
$gameMap.encounterList(); // Get encounter list
$gameMap.encounterStep(); // Get steps between encounters
$gameMap.isOverworld();   // Check if map is the overworld

// Loading a map
$gameMap.setup(mapId);   // Setup map with specified ID
```

### Map Coordinate Calculations
```javascript
// Convert between coordinate systems
$gameMap.xWithDirection(x, d);  // Get x-coordinate in direction d
$gameMap.yWithDirection(y, d);  // Get y-coordinate in direction d
$gameMap.roundXWithDirection(x, d); // Round x-coordinate in direction d
$gameMap.roundYWithDirection(y, d); // Round y-coordinate in direction d

// Handle wrapping/looping coordinates
$gameMap.deltaX(x1, x2); // Calculate x-distance considering loops
$gameMap.deltaY(y1, y2); // Calculate y-distance considering loops
$gameMap.distance(x1, y1, x2, y2); // Calculate total distance

// Adjust for map edges
$gameMap.adjustX(x);      // Adjust x for map boundary
$gameMap.adjustY(y);      // Adjust y for map boundary
$gameMap.roundX(x);       // Round x coordinate for loop maps
$gameMap.roundY(y);       // Round y coordinate for loop maps
$gameMap.canvasToMapX(x); // Convert canvas X to map X
$gameMap.canvasToMapY(y); // Convert canvas Y to map Y
```

## Map Scrolling and Display

### Scrolling Methods
```javascript
// Check scrolling state
$gameMap.isScrolling();   // Check if map is currently scrolling

// Start scrolling
$gameMap.startScroll(direction, distance, speed);
$gameMap.scrollDown(distance);
$gameMap.scrollLeft(distance);
$gameMap.scrollRight(distance);
$gameMap.scrollUp(distance);

// Update scrolling
$gameMap.updateScroll(); // Update scroll progress
$gameMap.setDisplayPos(x, y); // Set display position
$gameMap.parallaxOx();   // Get parallax x-offset
$gameMap.parallaxOy();   // Get parallax y-offset
```

### Map Display Management
```javascript
// Display position
$gameMap.displayX();     // Get display X position
$gameMap.displayY();     // Get display Y position

// Parallax background
$gameMap.parallaxName(); // Get parallax image name
$gameMap.requestRefresh(); // Request map refresh
$gameMap.changeParallax(name, loopX, loopY, sx, sy); // Change parallax
$gameMap.updateParallax(); // Update parallax position

// Tileset information
$gameMap.tileset();      // Get current tileset
$gameMap.tilesetFlags(); // Get tileset flags
$gameMap.tilsetFlags()[tileId]; // Get flags for specific tile
$gameMap.tileId(x, y, z); // Get tile ID at coordinates
```

## Events and Characters

### Event Management
```javascript
// Get events
$gameMap.events();       // Get all events
$gameMap.event(eventId); // Get event by ID
$gameMap.eventsXy(x, y); // Get events at coordinates
$gameMap.eventsXyNt(x, y); // Get events at coordinates (normal priority)
$gameMap.tileEventsXy(x, y); // Get tile events at coordinates

// Event processing
$gameMap.autorunCommonEvents(); // Process autorun common events
$gameMap.updateInterpreter(); // Update map event interpreter
$gameMap.unlockEvent(eventId); // Unlock event
$gameMap.setupEvents();  // Setup all map events
$gameMap.setupAutorunCommonEvent(); // Setup autorun common event
```

### Character Management
```javascript
// Character collections
$gameMap.boats();        // Get all boats
$gameMap.ship();         // Get ship
$gameMap.airship();      // Get airship
$gameMap.vehicles();     // Get all vehicles
$gameMap.characterIsEvent(character); // Check if character is an event
$gameMap.findDirectionTo(fromX, fromY, toX, toY); // Pathfind direction

// Character checks
$gameMap.exitX();        // Get map exit X coordinate
$gameMap.exitY();        // Get map exit Y coordinate
$gameMap.isAnyEventStarting(); // Check if any event is starting
$gameMap.isEventRunning(); // Check if any event is running
$gameMap.vehicle(type);  // Get vehicle by type
```

## Passability and Collision

### Passability Checks
```javascript
// Basic passability
$gameMap.checkPassage(x, y, bit); // Check passage with bit flag
$gameMap.isPassable(x, y, d); // Check if passable from direction
$gameMap.isBoatPassable(x, y); // Check if boat can pass
$gameMap.isShipPassable(x, y); // Check if ship can pass
$gameMap.isAirshipPassable(x, y); // Check if airship can land
$gameMap.isAirshipLandOk(x, y); // Check if airship can land at position

// Passage flags
// 0x01: Impassable down
// 0x02: Impassable left
// 0x04: Impassable right
// 0x08: Impassable up
// 0x10: Cannot land airship
// 0x20: Bush
// 0x40: Counter
// 0x80: Damage floor

// Terrain tags
$gameMap.terrainTag(x, y); // Get terrain tag at coordinates
$gameMap.regionId(x, y);  // Get region ID at coordinates
$gameMap.isLadder(x, y);  // Check if position has ladder
$gameMap.isBush(x, y);    // Check if position has bush
$gameMap.isCounter(x, y); // Check if position has counter
$gameMap.isDamageFloor(x, y); // Check if position has damage floor
```

### Collision Management
```javascript
// Character collision checking
$gameMap.isEventTriggered(); // Check if event is triggered
$gameMap.updateEventMovement(); // Update event movement
$gameMap.moveEvent(eventId, x, y); // Move event to coordinates

// Example: Check if position is occupied by character
function isPositionOccupied(x, y) {
    return $gameMap.eventsXy(x, y).length > 0 || 
           $gamePlayer.pos(x, y) ||
           $gameMap.vehicles().some(vehicle => vehicle.pos(x, y));
}
```

## Battle Encounters

### Encounter Management
```javascript
// Encounter mechanics
$gameMap.encounterRate(); // Get current encounter rate
$gameMap.setEncounterList(list); // Set encounter list
$gameMap.setEncounterStep(steps); // Set steps between encounters
$gameMap.encounterRate();         // Get encounter rate
$gameMap.updateEncounter();       // Update encounter progress

// Check for encounters
$gameMap.checkEncounter(); // Check if encounter should occur
$gameMap.setupStartingEvent(); // Setup starting event or encounter
$gameMap.setupBattleEvent();  // Setup a battle event

// Encounter related
$gameMap.makeEncounterCount(); // Set initial encounter count
$gameMap.makeEncounterTroopId(); // Determine which troop to encounter
$gameMap.encounterProgressValue(); // Get encounter progress value
```

## Weather and Lighting

### Weather Effects
```javascript
// Weather control
$gameMap.isValid();      // Check if the map is valid
$gameMap.screenTileX();  // Get screen tile width
$gameMap.screenTileY();  // Get screen tile height
$gameMap.refresh();      // Refresh the map

// Weather through $gameScreen
$gameScreen.changeWeather(type, power, duration);
// type: 'none', 'rain', 'storm', 'snow'
// power: 0-9
// duration: frames to transition
```

### Time and Lighting
```javascript
// Custom time system example
$gameMap.setTimeOfDay = function(hour, minute) {
    this._hour = hour;
    this._minute = minute;
    this.updateLighting();
};

$gameMap.updateLighting = function() {
    // Example implementation
    const hour = this._hour || 12;
    
    // Set tint based on time
    if (hour >= 6 && hour < 8) {
        // Dawn - orange tint
        $gameScreen.startTint([20, -20, -40, 68], 30);
    } else if (hour >= 8 && hour < 18) {
        // Daytime - normal
        $gameScreen.startTint([0, 0, 0, 0], 30);
    } else if (hour >= 18 && hour < 20) {
        // Dusk - orange tint
        $gameScreen.startTint([20, -10, -30, 68], 30);
    } else {
        // Night - blue tint
        $gameScreen.startTint([-68, -68, 0, 68], 30);
    }
};
```

## Map Internals

### Map Data Structure
```javascript
// Map data organization
// $dataMap.data: 3D array [z, y, x] where z:
// 0: Lower tiles layer 1
// 1: Lower tiles layer 2
// 2: Lower tiles layer 3
// 3: Lower tiles layer 4
// 4: Upper tiles layer 1
// 5: Upper tiles layer 2
// 6: Shadow layer
// 7: Region ID layer

// Get tile from data array
Game_Map.prototype.layeredTiles = function(x, y) {
    const tiles = [];
    for (let i = 0; i < 4; i++) {
        const tileId = this.tileId(x, y, 3 - i);
        if (tileId > 0) {
            tiles.push(tileId);
        }
    }
    return tiles;
};
```

### Map Update Cycle
```javascript
// Main update method
Game_Map.prototype.update = function(sceneActive) {
    this.refreshIfNeeded();
    if (sceneActive) {
        this.updateInterpreter();
    }
    this.updateScroll();
    this.updateEvents();
    this.updateVehicles();
    this.updateParallax();
};

// Refresh handling
Game_Map.prototype.refresh = function() {
    this.refreshTileEvents();
    this._needsRefresh = false;
};

Game_Map.prototype.refreshIfNeeded = function() {
    if (this._needsRefresh) {
        this.refresh();
    }
};
```

## Advanced Map Features

### Custom Map Properties
```javascript
// Add custom map metadata
Game_Map.prototype.setMetadata = function() {
    if (!$dataMap.meta) return;
    
    this._dungeonType = $dataMap.meta.dungeonType || "none";
    this._dangerLevel = Number($dataMap.meta.dangerLevel || 0);
    this._forbidSaving = $dataMap.meta.forbidSaving === "true";
    
    // Parse custom BGM if defined
    if ($dataMap.meta.customBgm) {
        const bgmData = JSON.parse($dataMap.meta.customBgm);
        if (bgmData) {
            AudioManager.playBgm(bgmData);
        }
    }
};
```

### Map Grid Path Finding
```javascript
// A* pathfinding algorithm implementation
Game_Map.prototype.findPath = function(startX, startY, goalX, goalY, maxIterations = 100) {
    // Implementation of A* pathfinding algorithm
    const openList = [{ x: startX, y: startY, g: 0, f: 0, parent: null }];
    const closedList = [];
    let iterations = 0;
    
    while (openList.length > 0 && iterations < maxIterations) {
        iterations++;
        
        // Find node with lowest f value
        let currentIndex = 0;
        for (let i = 1; i < openList.length; i++) {
            if (openList[i].f < openList[currentIndex].f) {
                currentIndex = i;
            }
        }
        
        const current = openList[currentIndex];
        
        // Check if reached goal
        if (current.x === goalX && current.y === goalY) {
            // Reconstruct path
            const path = [];
            let temp = current;
            while (temp.parent) {
                path.unshift({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            return path;
        }
        
        // Move current to closed list
        openList.splice(currentIndex, 1);
        closedList.push(current);
        
        // Check each adjacent tile
        for (let d = 2; d <= 8; d += 2) { // 2, 4, 6, 8 directions
            const nx = this.roundXWithDirection(current.x, d);
            const ny = this.roundYWithDirection(current.y, d);
            
            // Skip if not passable or in closed list
            if (!this.isPassable(current.x, current.y, d) ||
                closedList.some(node => node.x === nx && node.y === ny)) {
                continue;
            }
            
            // Calculate g value (cost from start)
            const g = current.g + 1;
            
            // Check if this path to neighbor is better
            const existingNeighbor = openList.find(node => node.x === nx && node.y === ny);
            if (existingNeighbor && g >= existingNeighbor.g) {
                continue;
            }
            
            // Add neighbor to open list
            const h = Math.abs(nx - goalX) + Math.abs(ny - goalY); // Manhattan distance
            const f = g + h;
            
            if (!existingNeighbor) {
                openList.push({ x: nx, y: ny, g: g, f: f, parent: current });
            } else {
                existingNeighbor.g = g;
                existingNeighbor.f = f;
                existingNeighbor.parent = current;
            }
        }
    }
    
    // No path found
    return null;
};
```

### Dynamic Map Changes
```javascript
// Change map tile at runtime
Game_Map.prototype.changeTile = function(x, y, z, tileId) {
    if (x >= 0 && x < this.width() && y >= 0 && y < this.height() && z >= 0 && z < 8) {
        const index = this.tileIndex(x, y, z);
        this._data[index] = tileId;
        this.refresh();
    }
};

// Change map dimensions at runtime
Game_Map.prototype.changeDimensions = function(width, height) {
    const oldWidth = this.width();
    const oldHeight = this.height();
    const oldData = this._data.slice();
    
    // Create new data array
    const newData = new Array(width * height * 8);
    for (let z = 0; z < 8; z++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (x < oldWidth && y < oldHeight) {
                    // Copy existing data
                    const oldIndex = (z * oldHeight + y) * oldWidth + x;
                    const newIndex = (z * height + y) * width + x;
                    newData[newIndex] = oldData[oldIndex];
                } else {
                    // Fill new areas with 0 (empty)
                    const newIndex = (z * height + y) * width + x;
                    newData[newIndex] = 0;
                }
            }
        }
    }
    
    // Update map properties
    this._width = width;
    this._height = height;
    this._data = newData;
    this.refresh();
};
```