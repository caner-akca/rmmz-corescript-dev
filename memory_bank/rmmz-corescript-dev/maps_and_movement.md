# RPG Maker MZ - Maps and Movement System

The map system in RPG Maker MZ controls how the game world is rendered and how characters move within it.

## Map Structure

### Map Data
- Maps are stored as JSON files in the `data/` folder (`Map001.json`, `Map002.json`, etc.)
- Each map contains:
  - Tileset ID
  - Width and height (in tiles)
  - Encounter list
  - Background type
  - Layer data (3 tile layers + 1 shadow layer + 1 region layer)
  - Event data

### Tileset System
- Tilesets define the visual appearance of map tiles
- Tiles are categorized as A1-A5 (autotiles), B-E (manual tiles)
- Each tile has properties like passability, terrain tag, and ladder/bush/counter flags

### Coordinates System
- Maps use a grid-based coordinate system
- Each tile is 48x48 pixels by default
- Characters can have in-tile positions for smooth movement

## Character Movement

### Game_CharacterBase
- Base class for all map-based characters
- Handles basic movement and collision detection
- Controls animation patterns and direction

### Game_Character
- Extends Game_CharacterBase
- Handles more complex movement patterns
- Controls events like character interaction and triggering

### Game_Player
- Player-specific movement handling
- Controls map scrolling based on player position
- Handles player collision with events and terrain
- Manages vehicle boarding/unboarding

### Game_Event
- Map event movement and behavior
- Triggers event processing based on conditions
- Can follow complex movement routes

### Game_Vehicle
- Special movement for boats, ships, and airships
- Different passability rules for each vehicle type

## Movement Methods

### Basic Movement
```javascript
character.moveStraight(direction); // Move one step in direction
character.moveRandom();            // Move randomly in any direction
character.moveToward(targetX, targetY); // Move toward coordinates
character.moveAway(targetX, targetY);   // Move away from coordinates
```

### Route Movement
```javascript
// Set a detailed movement route
character.forceMoveRoute({
    list: [
        { code: 1 }, // Move down
        { code: 3 }, // Move right
        { code: 2 }, // Move up
        { code: 4 }, // Move left
        { code: 0 }  // End of route
    ],
    repeat: false,
    skippable: false,
    wait: true
});
```

## Collision Detection

- `Game_Map.isPassable(x, y, d)`: Checks if a tile is passable from direction `d`
- `Game_CharacterBase.isCollidedWithCharacters(x, y)`: Checks for character collisions
- `Game_CharacterBase.isMapPassable(x, y, d)`: Combines tile and event passability

## Map Scrolling

- The map viewport follows the player character
- Scrolling can be adjusted based on screen size and map size
- Can be controlled with `Game_Map.scrollDown(distance)`, `scrollLeft()`, etc.
- Can be set to specific coordinates with `Game_Map.setDisplayPos(x, y)`