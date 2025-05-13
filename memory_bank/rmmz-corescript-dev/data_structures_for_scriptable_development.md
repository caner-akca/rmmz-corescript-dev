# RPG Maker MZ - Data Structures for Scriptable Development

This document provides detailed information about the data structures in RPG Maker MZ, focusing on aspects that are critical for programmatic game creation without using the UI.

## Project Structure Overview

An RPG Maker MZ project consists of the following key directories:

```
ProjectName/
├── audio/         # Audio files (BGM, BGS, ME, SE)
├── data/          # Game data JSON files
├── fonts/         # Font files
├── icon/          # Icons for desktop applications
├── img/           # Image resources
│   ├── animations/
│   ├── battlebacks1/
│   ├── battlebacks2/
│   ├── characters/
│   ├── enemies/
│   ├── faces/
│   ├── parallaxes/
│   ├── pictures/
│   ├── sv_actors/
│   ├── sv_enemies/
│   ├── system/
│   ├── tilesets/
│   └── titles1/
├── js/            # JavaScript code files
│   ├── libs/      # Library files
│   ├── plugins/   # Plugin files
├── movies/        # Video files
├── save/          # Save files (created during gameplay)
├── effects/       # Effect resources
├── index.html     # Main HTML file
└── package.json   # Project metadata
```

For scriptable development, the `data/` directory is the most critical, as it contains all the game design information in JSON format.

## Core Data Files

All game data is stored in JSON files in the `data/` directory. Here are the key files and their structures:

### System.json

This file contains global game settings:

```json
{
  "airship": { "bgm": {...}, "characterIndex": 3, "characterName": "Vehicle", "startMapId": 0, "startX": 0, "startY": 0 },
  "armorTypes": ["", "General Armor", "Magic Armor", "Light Armor", "Heavy Armor", "Small Shield", "Large Shield"],
  "attackMotions": [{ "type": 0, "weaponImageId": 0 }, { "type": 1, "weaponImageId": 1 }, ...],
  "battleBgm": { "name": "Battle1", "pan": 0, "pitch": 100, "volume": 90 },
  "battleback1Name": "Grassland",
  "battleback2Name": "Grassland",
  "battlerHue": 0,
  "battlerName": "Dragon",
  "boat": { "bgm": {...}, "characterIndex": 0, "characterName": "Vehicle", "startMapId": 0, "startX": 0, "startY": 0 },
  "currencyUnit": "G",
  "defeatMe": { "name": "Defeat1", "pan": 0, "pitch": 100, "volume": 90 },
  "editMapId": 1,
  "elements": ["", "Physical", "Fire", "Ice", "Thunder", "Water", "Earth", "Wind", "Light", "Darkness"],
  "equipTypes": ["", "Weapon", "Shield", "Head", "Body", "Accessory"],
  "gameTitle": "Untitled Game",
  "gameoverMe": { "name": "Gameover1", "pan": 0, "pitch": 100, "volume": 90 },
  "locale": "en_US",
  "magicSkills": [1],
  "menuCommands": [true, true, true, true, true, true],
  "optDisplayTp": true,
  "optDrawTitle": true,
  "optExtraExp": false,
  "optFloorDeath": false,
  "optFollowers": true,
  "optSideView": false,
  "optSlipDeath": false,
  "optTransparent": false,
  "partyMembers": [1, 2, 3, 4],
  "ship": { "bgm": {...}, "characterIndex": 1, "characterName": "Vehicle", "startMapId": 0, "startX": 0, "startY": 0 },
  "skillTypes": ["", "Magic", "Special"],
  "sounds": [
    { "name": "Cursor2", "pan": 0, "pitch": 100, "volume": 90 },
    { "name": "Decision1", "pan": 0, "pitch": 100, "volume": 90 },
    ...
  ],
  "startMapId": 1,
  "startX": 8,
  "startY": 6,
  "switches": ["", "Switch 1", "Switch 2", ...],
  "terms": {
    "basic": ["Level", "Lv", "HP", "HP", "MP", "MP", "TP", "TP", "EXP", "EXP"],
    "commands": ["Fight", "Escape", "Attack", "Guard", "Item", "Skill", "Equip", "Status", "Formation", "Save", "Game End", "Options", "Weapon", "Armor", "Key Item", "Equip", "Optimize", "Clear", "New Game", "Continue", null, "To Title", "Cancel", null, "Buy", "Sell"],
    "params": ["Max HP", "Max MP", "Attack", "Defense", "M.Attack", "M.Defense", "Agility", "Luck", "Hit", "Evasion"],
    "messages": { "alwaysDash": "Always Dash", "commandRemember": "Command Remember", ... }
  },
  "testBattlers": [
    { "actorId": 1, "equips": [1, 1, 2, 3, 0], "level": 1 },
    ...
  ],
  "testTroopId": 4,
  "title1Name": "Castle",
  "title2Name": "",
  "titleBgm": { "name": "Theme6", "pan": 0, "pitch": 100, "volume": 90 },
  "variables": ["", "Variable 1", "Variable 2", ...],
  "versionId": 12345678,
  "victoryMe": { "name": "Victory1", "pan": 0, "pitch": 100, "volume": 90 },
  "weaponTypes": ["", "Axe", "Claw", "Spear", "Sword", "Katana", "Bow", "Dagger", "Hammer", "Staff", "Gun"],
  "windowTone": [0, 0, 0, 0]
}
```

For scriptable development, key areas to focus on:
- `switches` and `variables`: Game state tracking identifiers
- `startMapId`, `startX`, `startY`: Initial player position
- `elements`, `equipTypes`, `skillTypes`: Game mechanics definitions
- `terms`: Text used throughout the game interface

### Actors.json

Contains character data:

```json
[
  null,
  {
    "id": 1,
    "battlerName": "Actor1_1",
    "characterIndex": 0,
    "characterName": "Actor1",
    "classId": 1,
    "equips": [1, 1, 2, 3, 0],
    "faceIndex": 0,
    "faceName": "Actor1",
    "traits": [],
    "initialLevel": 1,
    "maxLevel": 99,
    "name": "Harold",
    "nickname": "",
    "note": "",
    "profile": ""
  },
  {
    "id": 2,
    ...
  }
]
```

Important properties for scriptable development:
- `id`: Unique identifier for the actor
- `characterName` and `characterIndex`: Visual representation on maps
- `faceName` and `faceIndex`: Visual representation in menus and messages
- `classId`: Determines actor's skills and growth patterns
- `equips`: Initial equipment (weapon, shield, head, body, accessory)

### Classes.json

Defines character classes:

```json
[
  null,
  {
    "id": 1,
    "name": "Hero",
    "expParams": [30, 20, 30, 30],
    "traits": [
      {"code": 23, "dataId": 0, "value": 1},
      {"code": 22, "dataId": 0, "value": 0.95},
      {"code": 22, "dataId": 1, "value": 0.05},
      {"code": 22, "dataId": 2, "value": 0.04},
      {"code": 41, "dataId": 1, "value": 0},
      {"code": 51, "dataId": 4, "value": 0},
      {"code": 52, "dataId": 1, "value": 0}
    ],
    "learnings": [
      {"level": 1, "note": "", "skillId": 1},
      {"level": 3, "note": "", "skillId": 2},
      ...
    ],
    "params": [
      [1, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200],  // HP
      [0, 80, 100, 120, 140, 160, 180, 200, 220, 240],     // MP
      [1, 15, 20, 25, 30, 35, 40, 45, 50, 55],             // ATK
      ...
    ]
  }
]
```

Key aspects:
- `traits`: Special characteristics that affect game mechanics
- `learnings`: Skills learned as the character levels up
- `params`: Base stats for each level (HP, MP, ATK, DEF, MAT, MDF, AGI, LUK)

### Map*.json

Map data files (each map has its own file):

```json
{
  "autoplayBgm": false,
  "autoplayBgs": false,
  "battleback1Name": "",
  "battleback2Name": "",
  "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90},
  "bgs": {"name": "", "pan": 0, "pitch": 100, "volume": 90},
  "disableDashing": false,
  "displayName": "Map01",
  "encounterList": [],
  "encounterStep": 30,
  "height": 13,
  "note": "",
  "parallaxLoopX": false,
  "parallaxLoopY": false,
  "parallaxName": "",
  "parallaxShow": true,
  "parallaxSx": 0,
  "parallaxSy": 0,
  "scrollType": 0,
  "specifyBattleback": false,
  "tilesetId": 1,
  "width": 17,
  "data": [0, 0, 0, ...],  // Tile data, length = width * height * 6
  "events": [
    null,
    {
      "id": 1,
      "name": "EV001",
      "note": "",
      "pages": [
        {
          "conditions": {
            "actorId": 1, "actorValid": false,
            "itemId": 1, "itemValid": false,
            "selfSwitchCh": "A", "selfSwitchValid": false,
            "switch1Id": 1, "switch1Valid": false,
            "switch2Id": 1, "switch2Valid": false,
            "variableId": 1, "variableValid": false,
            "variableValue": 0
          },
          "directionFix": false,
          "image": {
            "characterIndex": 0,
            "characterName": "",
            "direction": 2,
            "pattern": 0,
            "tileId": 0
          },
          "list": [
            {"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, "NPC"]},
            {"code": 401, "indent": 0, "parameters": ["Hello, world!"]},
            {"code": 0, "indent": 0, "parameters": []}
          ],
          "moveFrequency": 3,
          "moveRoute": {
            "list": [{"code": 0, "parameters": []}],
            "repeat": true,
            "skippable": false,
            "wait": false
          },
          "moveSpeed": 3,
          "moveType": 0,
          "priorityType": 1,
          "stepAnime": false,
          "through": false,
          "trigger": 0,
          "walkAnime": true
        }
      ],
      "x": 8,
      "y": 6
    }
  ]
}
```

Critical parts for scriptable development:
- `data`: Tile mapping data (complex structure that defines the map layout)
- `events`: Interactive elements on the map
- `encounterList`: Random monster encounters
- `width`, `height`: Map dimensions

### Events and Event Commands

The most complex part of RPG Maker MZ's data structure is the event system. Each event has:

- `id`: Unique identifier
- `name`: Developer reference
- `pages`: Different states/behaviors of the event
- `x`, `y`: Position on the map

Each page contains:
- `conditions`: When this page becomes active
- `image`: Visual representation
- `list`: Commands executed when the event runs
- `trigger`: How the event activates (0=Action Button, 1=Player Touch, 2=Event Touch, 3=Autorun, 4=Parallel)

The `list` property contains the actual event commands, each with a `code` that determines its function:

| Code | Command Type | Parameters |
|------|--------------|------------|
| 101  | Show Text    | [faceset, index, background, position, speakerName] |
| 102  | Show Choices | [choices, cancelType, defaultType] |
| 103  | Input Number | [variableId, maxDigits] |
| 108  | Comment      | [text] |
| 111  | Conditional Branch | [condition, data1, data2, ...] |
| 121  | Control Switches | [switchId, switchId2, value] |
| 122  | Control Variables | [variableId, variableId2, operationType, ...] |
| 126  | Change Items | [itemId, operation, operandType, operand] |
| 132  | Change Battle BGM | [bgm] |
| 201  | Transfer Player | [mapId, x, y, direction, fadeType] |
| 221  | Fade Out Screen | [] |
| 301  | Battle Processing | [troopId, canEscape, canLose] |
| 355  | Script | [scriptLine] |
| 356  | Plugin Command | [command, parameters] |
| 401  | Show Text (continued) | [text] |
| 0    | End of List | [] |

This is a small subset of available commands. For complete scriptable development, you'll need to map all command codes.

## Example: Programmatically Creating a Simple Event

Here's how you might programmatically create a simple NPC event:

```javascript
// Create a basic NPC event
function createNpcEvent(mapId, x, y, characterName, characterIndex, message) {
    // Get the map data
    const fs = require('fs');
    const mapFile = `./data/Map${String(mapId).padStart(3, '0')}.json`;
    const mapData = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
    
    // Find the next available event ID
    const eventIds = mapData.events
        .filter(ev => ev !== null)
        .map(ev => ev.id);
    const nextId = Math.max(0, ...eventIds) + 1;
    
    // Create the event
    const newEvent = {
        id: nextId,
        name: `NPC${nextId}`,
        note: "",
        pages: [
            {
                conditions: {
                    actorId: 1, actorValid: false,
                    itemId: 1, itemValid: false,
                    selfSwitchCh: "A", selfSwitchValid: false,
                    switch1Id: 1, switch1Valid: false,
                    switch2Id: 1, switch2Valid: false,
                    variableId: 1, variableValid: false,
                    variableValue: 0
                },
                directionFix: false,
                image: {
                    characterIndex: characterIndex,
                    characterName: characterName,
                    direction: 2,  // Facing down
                    pattern: 1,
                    tileId: 0
                },
                list: [
                    {"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, "NPC"]},
                    {"code": 401, "indent": 0, "parameters": [message]},
                    {"code": 0, "indent": 0, "parameters": []}
                ],
                moveFrequency: 3,
                moveRoute: {
                    list: [{"code": 0, "parameters": []}],
                    repeat: true,
                    skippable: false,
                    wait: false
                },
                moveSpeed: 3,
                moveType: 0,
                priorityType: 1,
                stepAnime: false,
                through: false,
                trigger: 0,  // Action button
                walkAnime: true
            }
        ],
        x: x,
        y: y
    };
    
    // Add the event to the map
    if (mapData.events[nextId] === undefined) {
        // Extend the events array if needed
        mapData.events[nextId] = null;
    }
    mapData.events[nextId] = newEvent;
    
    // Write the updated map back to file
    fs.writeFileSync(mapFile, JSON.stringify(mapData, null, 2));
    
    return nextId;
}
```

## Common Event Command Sequences

Below are patterns for common event sequences that you'll use in scriptable development:

### Dialog Sequence

```javascript
[
    {"code": 101, "indent": 0, "parameters": ["Actor1", 0, 0, 2, "Harold"]},
    {"code": 401, "indent": 0, "parameters": ["Hello there!"]},
    {"code": 401, "indent": 0, "parameters": ["How are you today?"]},
    {"code": 102, "indent": 0, "parameters": [["Good", "Not so good", "Cancel"], 2]},
    {"code": 402, "indent": 0, "parameters": [0, "Good"]},
    {"code": 401, "indent": 1, "parameters": ["Wonderful!"]},
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 402, "indent": 0, "parameters": [1, "Not so good"]},
    {"code": 401, "indent": 1, "parameters": ["Sorry to hear that."]},
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 402, "indent": 0, "parameters": [2, "Cancel"]},
    {"code": 401, "indent": 1, "parameters": ["Maybe another time."]},
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 0, "indent": 0, "parameters": []}
]
```

### Conditional Branch

```javascript
[
    {"code": 111, "indent": 0, "parameters": [0, 1, 0]},  // If Switch 1 is ON
    {"code": 101, "indent": 1, "parameters": ["", 0, 0, 2]},
    {"code": 401, "indent": 1, "parameters": ["Switch 1 is ON."]},
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 411, "indent": 0, "parameters": []},  // Else
    {"code": 101, "indent": 1, "parameters": ["", 0, 0, 2]},
    {"code": 401, "indent": 1, "parameters": ["Switch 1 is OFF."]},
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 412, "indent": 0, "parameters": []},  // End If
    {"code": 0, "indent": 0, "parameters": []}
]
```

### Shop Processing

```javascript
[
    {"code": 302, "indent": 0, "parameters": [0, 1, 0, 4, false]},  // Shop with weapons
    {"code": 605, "indent": 0, "parameters": [2]},  // Add item ID 2
    {"code": 605, "indent": 0, "parameters": [3]},  // Add item ID 3
    {"code": 0, "indent": 0, "parameters": []}
]
```

### Give Item and Show Message

```javascript
[
    {"code": 126, "indent": 0, "parameters": [1, 0, 0, 1]},  // Give 1 of item ID 1
    {"code": 101, "indent": 0, "parameters": ["", 0, 0, 2]},
    {"code": 401, "indent": 0, "parameters": ["Received Potion!"]},
    {"code": 0, "indent": 0, "parameters": []}
]
```

## Next Steps for Scriptable Development

With this foundation in the data structures, you can build tools to:

1. **Generate Map Files**: Create entire maps with terrain, events, and encounters
2. **Define Game Mechanics**: Set up items, skills, and combat parameters
3. **Write Event Sequences**: Create story events, cutscenes, and interactions
4. **Build Quest Systems**: Create interconnected event chains with conditions

For a fully scriptable approach, consider:

1. Creating a Node.js-based toolchain that can:
   - Read and write RPG Maker MZ JSON files
   - Validate data structures
   - Generate complex content from templates or patterns

2. Building a data model abstraction layer to hide the complex structure details

3. Implementing a DSL (Domain Specific Language) for game creation, which compiles to RPG Maker MZ structures

In the next document, we'll explore the event system in more detail and how to create complex event sequences programmatically.