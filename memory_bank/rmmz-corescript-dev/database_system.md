# RPG Maker MZ - Database System

The database system in RPG Maker MZ defines all the game's assets, parameters, and configurations that make up the game world.

## Database Structure

The database is divided into several categories, each containing different types of game data:

### Actors & Classes
- **Actors**: Playable characters with names, initial equipment, and parameters
- **Classes**: Character classes with level progression, skills, and parameter curves

### Items & Equipment
- **Items**: Consumable items with effects and usage conditions
- **Weapons**: Character equipment that affects attack power and other parameters
- **Armors**: Defensive equipment that affects defense power and other parameters

### Enemies & Troops
- **Enemies**: Individual enemy definitions with parameters and actions
- **Troops**: Groups of enemies arranged for battle, with battle events

### States & Effects
- **States**: Status conditions (poison, sleep, etc.) with effects and durations
- **Animations**: Visual effects used for skills, items, and other actions

### System & Maps
- **Tilesets**: Defines the visual and passability properties of map tiles
- **Common Events**: Reusable event sequences that can be called from anywhere
- **System**: Global game settings, colors, sounds, and party configuration

## Data Access

Game data is loaded at startup and accessible through global variables:

```javascript
// Access actor data
const actor = $dataActors[1]; // First actor in database

// Access a skill
const skill = $dataSkills[7]; // Skill with ID 7

// Access an item
const item = $dataItems[3]; // Item with ID 3

// Check enemy parameters
const enemy = $dataEnemies[5]; // Enemy with ID 5
const hp = enemy.params[0]; // Max HP of this enemy
```

## Data Structure Examples

### Actor Data
```javascript
{
    id: 1,
    name: "Hero",
    nickname: "The Brave",
    classId: 1,
    initialLevel: 1,
    maxLevel: 99,
    profile: "A young hero...",
    traits: [...],
    equips: [1, 1, 2, 3, 0],
    faceIndex: 0,
    faceName: "Actor1",
    characterIndex: 0,
    characterName: "Actor1"
}
```

### Skill Data
```javascript
{
    id: 7,
    animationId: 41,
    damage: {
        critical: true,
        elementId: 0,
        formula: "a.atk * 4 - b.def * 2",
        type: 1,
        variance: 20
    },
    description: "Attacks an enemy with fire.",
    effects: [...],
    hitType: 1,
    iconIndex: 64,
    message1: "%1 casts %2!",
    message2: "Flames engulf %1!",
    mpCost: 5,
    name: "Fire",
    note: "",
    occasion: 1,
    repeats: 1,
    requiredWtypeId1: 0,
    requiredWtypeId2: 0,
    scope: 1,
    speed: 0,
    stypeId: 1,
    successRate: 100,
    tpCost: 0
}
```

## Note Tags

Each database entry can contain custom note tags for plugins to read:

```
<CustomTag: Value>
<AnotherTag>
MultiLine
Content
</AnotherTag>
```

These are accessed through the `note` property of database objects and often parsed by plugins:

```javascript
// Parse note tags
const notedata = item.note.split(/[\r\n]+/);
for (const line of notedata) {
    if (line.match(/<CustomTag:[ ](.*)>/i)) {
        const value = RegExp.$1;
        // Process the value
    }
}
```

## Database Modification

The database is generally read-only during gameplay, but plugins can:

1. Modify database entries at load time through the `DataManager` load hooks
2. Create dynamic database entries at runtime
3. Override specific properties of database entries for temporary effects