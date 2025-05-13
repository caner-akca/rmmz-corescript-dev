# RPG Maker MZ - Database Object Structures

This document details the structure and organization of database objects in RPG Maker MZ, covering their properties, relationships, and usage throughout the engine.

## Overview of Database System

RPG Maker MZ organizes game data in a series of structured JSON files that define everything from character abilities to map layouts. These database files are loaded at game startup and converted into JavaScript objects that can be accessed during gameplay.

## Main Database Files

The database consists of several JSON files located in the `/data` directory:

- `Actors.json`: Playable character definitions
- `Classes.json`: Character class definitions
- `Skills.json`: Ability/skill definitions
- `Items.json`: Item definitions
- `Weapons.json`: Weapon definitions
- `Armors.json`: Armor definitions
- `Enemies.json`: Enemy character definitions
- `Troops.json`: Enemy group configurations
- `States.json`: Status effect definitions
- `Animations.json`: Animation effect definitions
- `Tilesets.json`: Tileset configurations
- `CommonEvents.json`: Reusable event definitions
- `System.json`: Game system configuration
- `MapInfos.json`: Map metadata
- Individual `Map*.json` files: Map data and events

## Database Object Hierarchy

```
Database
│
├── Meta Objects (provide information about the database)
│   ├── $dataSystem
│   └── $dataMapInfos
│
├── Actor-Related Objects
│   ├── $dataActors
│   ├── $dataClasses
│   └── $dataSkills
│
├── Item-Related Objects
│   ├── $dataItems
│   ├── $dataWeapons
│   └── $dataArmors
│
├── Enemy-Related Objects
│   ├── $dataEnemies
│   └── $dataTroops
│
├── Effect-Related Objects
│   ├── $dataStates
│   └── $dataAnimations
│
└── Map-Related Objects
    ├── $dataTilesets
    ├── $dataCommonEvents
    └── $dataMap (current map)
```

## Common Data Structure Patterns

Most database objects follow a common structure pattern:

```javascript
{
    "id": 1,              // Unique identifier
    "name": "Object Name",// Display name
    "note": "",           // Note field for custom data/tags
    "meta": {},           // Parsed note field data
    ...                   // Object-specific properties
}
```

## Actor Data Structure

```javascript
// Sample Actor object from $dataActors
{
    "id": 1,
    "name": "Harold",
    "nickname": "Hero",
    "classId": 1,         // Reference to a class
    "initialLevel": 1,
    "maxLevel": 99,
    "characterName": "Actor1",    // Sprite sheet reference
    "characterIndex": 0,          // Index in character sheet
    "faceName": "Actor1",         // Face image reference
    "faceIndex": 0,               // Index in face sheet
    "battlerName": "Actor1_1",    // Battler image reference
    "equips": [1, 1, 2, 3, 0],    // Initial equipment [weapon, shield, head, body, accessory]
    "profile": "The main hero.",
    "traits": [                   // Innate traits
        {"code": 43, "dataId": 0, "value": 1}, // Auto Battle
        {"code": 52, "dataId": 1, "value": 0}  // Dual Wield
    ],
    "note": "<some note>",
    "meta": {}                    // Parsed note tags
}
```

## Class Data Structure

```javascript
// Sample Class object from $dataClasses
{
    "id": 1,
    "name": "Hero",
    "expParams": [30, 20, 30, 30], // EXP curve parameters
    "params": [
        [1, 400, 500, 600, 700, 800, 900, 950, 1000, 1100], // Max HP at each level tier
        [0, 80, 100, 120, 140, 160, 180, 200, 220, 240],    // Max MP
        [1, 18, 22, 26, 30, 34, 38, 42, 46, 50],            // Attack
        [1, 16, 20, 24, 28, 32, 36, 40, 44, 48],            // Defense
        [1, 18, 22, 26, 30, 34, 38, 42, 46, 50],            // M.Attack
        [1, 16, 20, 24, 28, 32, 36, 40, 44, 48],            // M.Defense
        [1, 8, 10, 12, 14, 16, 18, 20, 22, 24],             // Agility
        [1, 8, 10, 12, 14, 16, 18, 20, 22, 24]              // Luck
    ],
    "learnings": [                // Skills learned by leveling
        {"level": 1, "skillId": 1, "note": ""},
        {"level": 3, "skillId": 2, "note": ""}
    ],
    "traits": [                   // Class traits
        {"code": 23, "dataId": 0, "value": 1}, // Element Rate
        {"code": 22, "dataId": 2, "value": 0.95} // Parameter Rate
    ],
    "note": "",
    "meta": {}
}
```

## Item Data Structure

```javascript
// Sample Item object from $dataItems
{
    "id": 1,
    "name": "Potion",
    "iconIndex": 176,         // Icon index in IconSet
    "description": "Restores 500 HP to one ally.",
    "itypeId": 1,             // Item category (1=regular, 2=key, etc.)
    "price": 50,              // Shop price
    "consumable": true,       // Whether item is consumed on use
    "effects": [              // Item effects when used
        {"code": 11, "dataId": 0, "value1": 0, "value2": 500} // Restore HP
    ],
    "damage": {               // Damage/healing formula
        "type": 0,            // 0=none, 1=HP damage, 2=MP damage, etc.
        "elementId": 0,       // Element ID applied
        "formula": "0",       // Damage formula (JavaScript)
        "variance": 20,       // Random variance %
        "critical": false     // Can critical hit
    },
    "note": "",
    "meta": {}
}
```

## Weapon Data Structure

```javascript
// Sample Weapon object from $dataWeapons
{
    "id": 1,
    "name": "Bronze Sword",
    "iconIndex": 97,
    "description": "A sword made of bronze.",
    "etypeId": 1,             // Equipment type ID
    "wtypeId": 2,             // Weapon type ID
    "price": 500,
    "params": [0, 0, 10, 0, 0, 0, 0, 0], // Stat bonuses [mhp, mmp, atk, def, mat, mdf, agi, luk]
    "traits": [               // Weapon traits
        {"code": 31, "dataId": 1, "value": 0}, // Attack Element
        {"code": 22, "dataId": 0, "value": 1}  // Parameter Rate
    ],
    "note": "",
    "meta": {}
}
```

## Enemy Data Structure

```javascript
// Sample Enemy object from $dataEnemies
{
    "id": 1,
    "name": "Slime",
    "battlerName": "Slime",   // Battler image name
    "battlerHue": 0,          // Color hue adjustment
    "params": [200, 0, 30, 30, 30, 30, 30, 30], // [mhp, mmp, atk, def, mat, mdf, agi, luk]
    "exp": 10,
    "gold": 5,
    "drop": {                 // Item drops
        "type": 1,            // 0=none, 1=item, 2=weapon, 3=armor
        "dataId": 1,          // ID of the dropped item/weapon/armor
        "denominator": 10     // Drop rate (1/N)
    },
    "actions": [              // Battle actions
        {
            "skillId": 1,     // Skill ID to use
            "conditionType": 1, // When to use: 0=always, 1=turn end, 2=HP%, etc.
            "conditionParam1": 0,
            "conditionParam2": 0,
            "rating": 5       // Priority rating (higher = more likely)
        }
    ],
    "traits": [],
    "note": "",
    "meta": {}
}
```

## State Data Structure

```javascript
// Sample State object from $dataStates
{
    "id": 1,
    "name": "Poison",
    "iconIndex": 1,
    "restriction": 0,         // Action restriction (0=none, 1=attack only, etc.)
    "priority": 100,          // Display priority
    "motion": 3,              // Associated motion animation
    "overlay": 1,             // Overlay effect
    "removeAtBattleEnd": true,// Remove when battle ends
    "removeByDamage": false,  // Can be removed by taking damage
    "removeByWalking": false, // Can be removed by walking
    "removeByRestriction": false, // Remove when restrictions applied
    "autoRemovalTiming": 2,   // 0=none, 1=end of action, 2=end of turn
    "minTurns": 2,            // Minimum turns duration
    "maxTurns": 5,            // Maximum turns duration
    "traits": [               // State traits
        {"code": 22, "dataId": 2, "value": 0.8} // Attack rate decrease
    ],
    "steps": 100,             // Steps until auto-removal (if walking removes)
    "message1": "%1 was poisoned!", // Apply message
    "message2": "%1 is hurt by poison!", // Effect message
    "message3": "%1 is no longer poisoned!", // Remove message
    "message4": "%1 was already poisoned!", // Failed application message
    "note": "",
    "meta": {}
}
```

## Map Data Structure

```javascript
// Sample Map object from a Map*.json file
{
    "displayName": "Forest",
    "width": 20,
    "height": 15,
    "scrollType": 0,          // Scroll type (0=none, 1=loop X, 2=loop Y, 3=both)
    "tilesetId": 3,           // Reference to a tileset
    "data": [                 // Tile data array (width x height x 6 layers)
        0, 0, 0, ...,         // Layer 1 (Autotile A1)
        0, 0, ...,            // Layer 2 (Autotile A2)
        ...
    ],
    "events": {               // Map events
        "1": {                // Event ID
            "id": 1,
            "name": "NPC",
            "x": 10,          // X position on map
            "y": 8,           // Y position on map
            "pages": [        // Event pages
                {
                    "conditions": { // Activation conditions
                        "actorId": 1,
                        "actorValid": false,
                        "itemId": 1,
                        "itemValid": false,
                        "selfSwitchCh": "A",
                        "selfSwitchValid": false,
                        "switch1Id": 1,
                        "switch1Valid": false,
                        "switch2Id": 1,
                        "switch2Valid": false,
                        "variable1Id": 1,
                        "variable1Valid": false,
                        "variable1Value": 0,
                        "variable2Id": 1,
                        "variable2Valid": false,
                        "variable2Value": 0
                    },
                    "directionFix": false,
                    "image": {      // Sprite settings
                        "tileId": 0,
                        "characterName": "Actor1",
                        "direction": 2,
                        "pattern": 1,
                        "characterIndex": 0
                    },
                    "list": [       // Event commands
                        {"code": 101, "indent": 0, "parameters": ["Actor1", 0, 0, 2, "NPC"]},
                        {"code": 401, "indent": 0, "parameters": ["Hello, adventurer!"]},
                        {"code": 0, "indent": 0, "parameters": []}
                    ],
                    "moveFrequency": 3,
                    "moveRoute": {  // Default movement
                        "list": [{"code": 0, "parameters": []}],
                        "repeat": true,
                        "skippable": false,
                        "wait": false
                    },
                    "moveSpeed": 3,
                    "moveType": 0,  // 0=fixed, 1=random, 2=approach
                    "priorityType": 1, // 0=below characters, 1=same as characters, 2=above characters
                    "stepAnime": false,
                    "through": false,
                    "trigger": 0,   // 0=action button, 1=player touch, 2=event touch, 3=autorun, 4=parallel
                    "walkAnime": true
                }
            ],
            "note": ""
        }
    },
    "bgm": {"name": "Forest", "pan": 0, "pitch": 100, "volume": 90},
    "bgs": {"name": "", "pan": 0, "pitch": 100, "volume": 90},
    "parallaxName": "",
    "autoplayBgm": false,
    "autoplayBgs": false,
    "note": ""
}
```

## Note Tags System

RPG Maker MZ includes a powerful meta-data system using note tags. These tags are parsed from the `note` property and converted into the `meta` object.

```javascript
// Example of note tags in a database object
"note": "<ElementRate:Fire:50%>\n<Skill:Double Attack:lvl 5>",

// After parsing, this becomes:
"meta": {
    "ElementRate:Fire": "50%",
    "Skill:Double Attack": "lvl 5"
}
```

To parse note tags, RPG Maker MZ uses the following function:

```javascript
// Parse note tags for database objects
DataManager.extractMetadata = function(data) {
    const re = /<([^<>:]+)(:?)([^>]*)>/g;
    data.meta = {};
    for (;;) {
        const match = re.exec(data.note);
        if (match) {
            if (match[2] === ":") {
                data.meta[match[1]] = match[3];
            } else {
                data.meta[match[1]] = true;
            }
        } else {
            break;
        }
    }
};
```

## Structure Relationships

Database objects maintain relationships through ID references:

- Actors reference Classes through `classId`
- Classes reference Skills through `learnings[].skillId`
- Enemies reference Troops through troop configurations
- Troops reference Enemies through member arrays
- Maps reference Tilesets through `tilesetId`
- Items/Skills reference Animations through animation IDs

The engine accesses these links through the global database objects (`$dataX`) to create the game world.

## Using Database Objects in Code

```javascript
// Getting an actor's name
const actorName = $dataActors[1].name;

// Getting all skills learned by a class
const classSkills = $dataClasses[1].learnings.map(learning => {
    return {
        level: learning.level,
        skill: $dataSkills[learning.skillId]
    };
});

// Checking if an item restores HP
const item = $dataItems[1];
const restoresHP = item.effects.some(effect => effect.code === 11 && effect.dataId === 0);

// Getting enemy drop information
const enemy = $dataEnemies[1];
if (enemy.drop.type > 0) {
    let dropItem;
    switch (enemy.drop.type) {
        case 1: dropItem = $dataItems[enemy.drop.dataId]; break;
        case 2: dropItem = $dataWeapons[enemy.drop.dataId]; break;
        case 3: dropItem = $dataArmors[enemy.drop.dataId]; break;
    }
    const dropRate = 1 / enemy.drop.denominator;
}
```

## Database Extension and Plugin Integration

Plugins can extend the database structure by adding new properties to the standard objects or by creating entirely new data types:

```javascript
// Example of extending database objects via plugin
PluginManager.registerCommand("MyPlugin", "ExtendActor", args => {
    const actorId = Number(args.actorId);
    if ($dataActors[actorId]) {
        // Add custom property if not present
        if (!$dataActors[actorId].customStats) {
            $dataActors[actorId].customStats = {
                charm: Number(args.charm) || 0,
                luck: Number(args.luck) || 0
            };
        }
    }
});
```