# RPG Maker MZ - Event System for Scriptable Development

This document focuses on understanding and programmatically manipulating the event system in RPG Maker MZ, which is essential for creating games without using the UI.

## Event Structure Overview

Events are the primary way to create game logic, interactions, and story progression in RPG Maker MZ. Each event consists of:

1. **Basic Properties**: ID, name, position (x, y)
2. **Pages**: Different states/behaviors of the event
3. **Commands**: Actions that execute when the event runs

## Event Data Structure

Here's the JSON structure of an event:

```json
{
  "id": 1,
  "name": "EventName",
  "note": "",
  "pages": [
    {
      "conditions": {
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
        "variableId": 1,
        "variableValid": false,
        "variableValue": 0
      },
      "directionFix": false,
      "image": {
        "characterIndex": 0,
        "characterName": "Actor1",
        "direction": 2,
        "pattern": 1,
        "tileId": 0
      },
      "list": [
        {"code": 101, "indent": 0, "parameters": ["", 0, 0, 2]},
        {"code": 401, "indent": 0, "parameters": ["Hello World!"]},
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
```

## Event Page Properties

Key properties of event pages:

- **conditions**: When this page becomes active
  - `switch1Valid`, `switch1Id`: Activate based on a game switch
  - `variableValid`, `variableId`, `variableValue`: Activate based on variable value
  - `selfSwitchValid`, `selfSwitchCh`: Activate based on self switch
  - `itemValid`, `itemId`: Activate if party has specific item
  - `actorValid`, `actorId`: Activate if specific actor is in party

- **image**: Visual representation
  - `characterName`: Sprite sheet name
  - `characterIndex`: Index in the sprite sheet (0-7)
  - `direction`: Direction (2=down, 4=left, 6=right, 8=up)
  - `pattern`: Animation frame (0-2)
  - `tileId`: For tile-based events instead of character sprites

- **trigger**: How the event activates
  - `0`: Action Button (player presses interact button while facing event)
  - `1`: Player Touch (player walks into event)
  - `2`: Event Touch (event touches player during movement)
  - `3`: Autorun (runs automatically when page conditions are met)
  - `4`: Parallel (runs continuously while page conditions are met)

- **moveType**: Movement pattern
  - `0`: Fixed (doesn't move)
  - `1`: Random (moves randomly)
  - `2`: Approach (moves toward player)
  - `3`: Custom (follows custom move route)

## Event Commands

The `list` property contains the event commands. Each command has:

- **code**: Numeric identifier for the command type
- **indent**: Nesting level for control flow
- **parameters**: Command-specific parameters

### Core Event Command Codes

| Code | Command                | Description |
|------|------------------------|-------------|
| 0    | End Processing         | Marks the end of an event/branch |
| 101  | Show Text              | Displays text box with message |
| 102  | Show Choices           | Displays choice options |
| 103  | Input Number           | Prompts player for numeric input |
| 104  | Select Item            | Opens item selection window |
| 105  | Show Scrolling Text    | Shows scrolling text window |
| 108  | Comment                | Developer comment (no effect) |
| 111  | Conditional Branch     | If/else logic structure |
| 112  | Loop                   | Start of a loop block |
| 113  | Break Loop             | Exit from current loop |
| 115  | Exit Event Processing  | Immediately end event |
| 117  | Call Common Event      | Execute a common event |
| 119  | Label                  | Define a jump label |
| 121  | Control Switches       | Turn switches on/off |
| 122  | Control Variables      | Set variable values |
| 126  | Change Items           | Add/remove items |
| 127  | Change Weapons         | Add/remove weapons |
| 128  | Change Armor           | Add/remove armor |
| 129  | Change Party Member    | Add/remove actors |
| 132  | Change Battle BGM      | Set battle background music |
| 133  | Change Victory ME      | Set victory music |
| 201  | Transfer Player        | Move player to different map/position |
| 203  | Set Event Location     | Move event to new position |
| 221  | Fade Out Screen        | Screen transition effect |
| 222  | Fade In Screen         | Screen transition effect |
| 230  | Wait                   | Pause event execution |
| 231  | Show Picture           | Display image on screen |
| 235  | Erase Picture          | Remove displayed picture |
| 250  | Play BGM               | Play background music |
| 251  | Fade Out BGM           | Gradually stop BGM |
| 261  | Play Movie             | Play video file |
| 301  | Battle Processing      | Start a battle |
| 302  | Shop Processing        | Open shop menu |
| 303  | Name Input Processing  | Prompt for character name |
| 311  | Change HP              | Modify actor HP |
| 312  | Change MP              | Modify actor MP |
| 313  | Change State           | Add/remove status effects |
| 322  | Change Experience      | Modify actor EXP |
| 323  | Change Level           | Modify actor level |
| 324  | Change Parameters      | Modify actor base stats |
| 325  | Change Skills          | Add/remove skills |
| 326  | Change Equipment       | Modify actor equipment |
| 355  | Script                 | Execute custom JavaScript |
| 356  | Plugin Command         | Call plugin command |
| 401  | Show Text (cont.)      | Additional lines for code 101 |
| 402  | When [**] Chosen       | Choice option branch |
| 657  | Video Settings         | Configure video playback |

### Command Parameter Patterns

Different commands require different parameter structures:

#### Show Text (101)
```json
{"code": 101, "indent": 0, "parameters": ["Face", FaceIndex, BackgroundType, PositionType, SpeakerName]}
```
- `Face`: Faceset image name
- `FaceIndex`: Index in faceset (0-7)
- `BackgroundType`: Window type (0=normal, 1=dim, 2=transparent)
- `PositionType`: Window position (0=top, 1=middle, 2=bottom)
- `SpeakerName`: Name displayed for the speaker

#### Show Text Continuation (401)
```json
{"code": 401, "indent": 0, "parameters": ["Text line"]}
```
- Each code 401 represents one line of text

#### Show Choices (102)
```json
{"code": 102, "indent": 0, "parameters": [["Choice1", "Choice2", "Choice3"], CancelType, DefaultType, PositionType, BackgroundType]}
```
- First parameter is an array of choice texts
- `CancelType`: Button behavior (0-5, determines cancel action)
- `DefaultType`: Default selected choice (0=first choice, 1=second, etc.)
- `PositionType`: Window position
- `BackgroundType`: Window background

#### Conditional Branch (111)
```json
{"code": 111, "indent": 0, "parameters": [ConditionType, ...additional parameters depending on condition]}
```
- `ConditionType`: Type of condition (0=switch, 1=variable, 2=self switch, etc.)
- Additional parameters vary by condition type

#### Control Switches (121)
```json
{"code": 121, "indent": 0, "parameters": [StartID, EndID, Value]}
```
- `StartID`: First switch to modify
- `EndID`: Last switch to modify (can be same as StartID)
- `Value`: 0=OFF, 1=ON

#### Control Variables (122)
```json
{"code": 122, "indent": 0, "parameters": [StartID, EndID, OperationType, ...additional parameters]}
```
- `StartID`, `EndID`: Range of variables to change
- `OperationType`: How to change (0=set, 1=add, 2=subtract, etc.)
- Additional parameters depend on operation type

#### Transfer Player (201)
```json
{"code": 201, "indent": 0, "parameters": [TransferType, MapID, X, Y, Direction, FadeType]}
```
- `TransferType`: 0=same map, 1=different map, 2=different map w/designation
- `MapID`: Target map ID
- `X`, `Y`: Coordinates on target map
- `Direction`: Player direction after transfer (0=retain, 2=down, etc.)
- `FadeType`: Transition effect (0=black, 1=white, 2=none)

## Building Complex Event Sequences

When programmatically creating events, you'll need to assemble commands into logical sequences. Here are common patterns:

### Dialogue Scene
```javascript
// Basic conversation
const dialogue = [
    {"code": 101, "indent": 0, "parameters": ["Actor1", 0, 0, 2, "Harold"]},
    {"code": 401, "indent": 0, "parameters": ["I've been waiting for you."]},
    {"code": 401, "indent": 0, "parameters": ["The journey ahead will be difficult."]},
    {"code": 102, "indent": 0, "parameters": [["I'm ready", "Not yet"], 0, 0]},
    {"code": 402, "indent": 0, "parameters": [0, "I'm ready"]},
    {"code": 101, "indent": 1, "parameters": ["Actor1", 0, 0, 2, "Harold"]},
    {"code": 401, "indent": 1, "parameters": ["Then let us proceed!"]},
    {"code": 121, "indent": 1, "parameters": [5, 5, 0]},  // Switch 5 OFF
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 402, "indent": 0, "parameters": [1, "Not yet"]},
    {"code": 101, "indent": 1, "parameters": ["Actor1", 0, 0, 2, "Harold"]},
    {"code": 401, "indent": 1, "parameters": ["Come back when you are prepared."]},
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 0, "indent": 0, "parameters": []}
];
```

### Quest Assignment
```javascript
// Quest giver NPC
const questAssignment = [
    {"code": 101, "indent": 0, "parameters": ["Actor1", 0, 0, 2, "Quest Giver"]},
    {"code": 401, "indent": 0, "parameters": ["I need your help with something."]},
    {"code": 401, "indent": 0, "parameters": ["Can you defeat 5 slimes for me?"]},
    {"code": 102, "indent": 0, "parameters": [["Accept", "Decline"], 0, 0]},
    {"code": 402, "indent": 0, "parameters": [0, "Accept"]},
    // Accept path
    {"code": 101, "indent": 1, "parameters": ["Actor1", 0, 0, 2, "Quest Giver"]},
    {"code": 401, "indent": 1, "parameters": ["Thank you! Return when you're done."]},
    {"code": 121, "indent": 1, "parameters": [10, 10, 1]},  // Quest accepted switch ON
    {"code": 122, "indent": 1, "parameters": [5, 5, 0, 0, 0]},  // Set variable 5 to 0 (slime counter)
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 402, "indent": 0, "parameters": [1, "Decline"]},
    // Decline path
    {"code": 101, "indent": 1, "parameters": ["Actor1", 0, 0, 2, "Quest Giver"]},
    {"code": 401, "indent": 1, "parameters": ["I understand. Maybe next time."]},
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 0, "indent": 0, "parameters": []}
];
```

### Quest Status Check
```javascript
// Quest progress checking
const questStatus = [
    {"code": 111, "indent": 0, "parameters": [0, 10, 0]},  // If quest accepted switch is ON
    // Quest active path
    {"code": 111, "indent": 1, "parameters": [1, 5, 0, 5, 0]},  // If variable 5 >= 5 (slimes defeated)
    // Quest completed path
    {"code": 101, "indent": 2, "parameters": ["Actor1", 0, 0, 2, "Quest Giver"]},
    {"code": 401, "indent": 2, "parameters": ["You've defeated all the slimes!"]},
    {"code": 401, "indent": 2, "parameters": ["Here's your reward."]},
    {"code": 125, "indent": 2, "parameters": [0, 0, 100]},  // Give 100 gold
    {"code": 126, "indent": 2, "parameters": [5, 0, 0, 2]},  // Give 2 potions
    {"code": 121, "indent": 2, "parameters": [10, 10, 0]},  // Quest accepted switch OFF
    {"code": 121, "indent": 2, "parameters": [11, 11, 1]},  // Quest completed switch ON
    {"code": 0, "indent": 2, "parameters": []},
    {"code": 411, "indent": 1, "parameters": []},  // Else
    // Quest in progress path
    {"code": 101, "indent": 2, "parameters": ["Actor1", 0, 0, 2, "Quest Giver"]},
    {"code": 401, "indent": 2, "parameters": ["How's it going? You've defeated \\v[5] slimes."]},
    {"code": 401, "indent": 2, "parameters": ["Please defeat 5 slimes in total."]},
    {"code": 0, "indent": 2, "parameters": []},
    {"code": 412, "indent": 1, "parameters": []},  // End If
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 411, "indent": 0, "parameters": []},  // Else
    // Quest not started path
    {"code": 101, "indent": 1, "parameters": ["Actor1", 0, 0, 2, "Quest Giver"]},
    {"code": 401, "indent": 1, "parameters": ["I have a quest for you."]},
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 412, "indent": 0, "parameters": []},  // End If
    {"code": 0, "indent": 0, "parameters": []}
];
```

### Store/Shop
```javascript
// Item shop
const shop = [
    {"code": 101, "indent": 0, "parameters": ["Actor1", 0, 0, 2, "Shopkeeper"]},
    {"code": 401, "indent": 0, "parameters": ["Welcome! Would you like to shop?"]},
    {"code": 102, "indent": 0, "parameters": [["Buy", "Sell", "Cancel"], 2, 2]},
    {"code": 402, "indent": 0, "parameters": [0, "Buy"]},
    {"code": 302, "indent": 1, "parameters": [0, 1, 0, 2, false]},  // Shop type 0 (items), sell at 100%
    {"code": 605, "indent": 1, "parameters": [1]},  // Item ID 1
    {"code": 605, "indent": 1, "parameters": [2]},  // Item ID 2
    {"code": 605, "indent": 1, "parameters": [3]},  // Item ID 3
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 402, "indent": 0, "parameters": [1, "Sell"]},
    {"code": 302, "indent": 1, "parameters": [1, 1, 0, 2, false]},  // Shop type 1 (sell only)
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 402, "indent": 0, "parameters": [2, "Cancel"]},
    {"code": 101, "indent": 1, "parameters": ["Actor1", 0, 0, 2, "Shopkeeper"]},
    {"code": 401, "indent": 1, "parameters": ["Please come again!"]},
    {"code": 0, "indent": 1, "parameters": []},
    {"code": 0, "indent": 0, "parameters": []}
];
```

### Cutscene
```javascript
// Event cutscene
const cutscene = [
    {"code": 223, "indent": 0, "parameters": [[0, 0, 0, 0], 60, true]},  // Fade to black
    {"code": 230, "indent": 0, "parameters": [60]},  // Wait 60 frames
    {"code": 101, "indent": 0, "parameters": ["", 0, 2, 2]},
    {"code": 401, "indent": 0, "parameters": ["The next morning..."]},
    {"code": 230, "indent": 0, "parameters": [90]},  // Wait 90 frames
    {"code": 201, "indent": 0, "parameters": [0, 3, 8, 6, 2, 0]},  // Transfer player
    {"code": 222, "indent": 0, "parameters": [[255, 255, 255, 0], 60, true]},  // Fade in
    {"code": 230, "indent": 0, "parameters": [60]},  // Wait 60 frames
    {"code": 101, "indent": 0, "parameters": ["Actor1", 0, 0, 2, "Harold"]},
    {"code": 401, "indent": 0, "parameters": ["We've arrived at the castle."]},
    {"code": 250, "indent": 0, "parameters": [{"name": "Theme2", "volume": 90, "pitch": 100, "pan": 0}]},
    {"code": 0, "indent": 0, "parameters": []}
];
```

## Programmatically Manipulating Events

Here's a JavaScript utility function for creating event structures:

```javascript
/**
 * Creates an event object that can be added to a map
 * @param {number} id - Event ID
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} name - Event name
 * @param {Array} commands - Event commands
 * @param {Object} image - Character appearance
 * @param {number} trigger - Event trigger type
 * @returns {Object} Complete event object
 */
function createEvent(id, x, y, name, commands, image = null, trigger = 0) {
    // Default image if none provided
    if (!image) {
        image = {
            characterIndex: 0,
            characterName: "",
            direction: 2,
            pattern: 1,
            tileId: 0
        };
    }
    
    // Ensure commands end with a termination code
    if (commands.length === 0 || commands[commands.length - 1].code !== 0) {
        commands.push({"code": 0, "indent": 0, "parameters": []});
    }
    
    return {
        id: id,
        name: name,
        note: "",
        pages: [
            {
                conditions: {
                    actorId: 1,
                    actorValid: false,
                    itemId: 1,
                    itemValid: false,
                    selfSwitchCh: "A",
                    selfSwitchValid: false,
                    switch1Id: 1,
                    switch1Valid: false,
                    switch2Id: 1,
                    switch2Valid: false,
                    variableId: 1,
                    variableValid: false,
                    variableValue: 0
                },
                directionFix: false,
                image: image,
                list: commands,
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
                trigger: trigger,
                walkAnime: true
            }
        ],
        x: x,
        y: y
    };
}
```

### Helper Functions for Common Event Patterns

```javascript
/**
 * Creates a message dialog command sequence
 * @param {string} faceName - Face image name
 * @param {number} faceIndex - Face image index
 * @param {string} speakerName - Speaker name
 * @param {Array<string>} lines - Lines of dialog
 * @returns {Array} Command sequence
 */
function createMessageCommands(faceName, faceIndex, speakerName, lines) {
    const commands = [];
    
    // Add initial message command
    commands.push({
        "code": 101, 
        "indent": 0, 
        "parameters": [faceName, faceIndex, 0, 2, speakerName]
    });
    
    // Add each line
    for (const line of lines) {
        commands.push({
            "code": 401,
            "indent": 0,
            "parameters": [line]
        });
    }
    
    return commands;
}

/**
 * Creates a choice dialog command sequence
 * @param {Array<string>} choices - Choice options
 * @param {Function} generateChoiceHandler - Function that generates commands for each choice
 * @returns {Array} Command sequence
 */
function createChoiceCommands(choices, generateChoiceHandler) {
    const commands = [];
    
    // Add choice command
    commands.push({
        "code": 102,
        "indent": 0,
        "parameters": [choices, 0, 0]
    });
    
    // Add handlers for each choice
    for (let i = 0; i < choices.length; i++) {
        // Add branch start
        commands.push({
            "code": 402,
            "indent": 0,
            "parameters": [i, choices[i]]
        });
        
        // Add handler commands for this choice
        const handlerCommands = generateChoiceHandler(i, choices[i]);
        for (const cmd of handlerCommands) {
            // Increase indent level for all commands in the handler
            const indentedCmd = {...cmd};
            indentedCmd.indent = cmd.indent + 1;
            commands.push(indentedCmd);
        }
        
        // Add branch end
        commands.push({
            "code": 0,
            "indent": 1,
            "parameters": []
        });
    }
    
    return commands;
}

/**
 * Creates a conditional branch command sequence
 * @param {number} conditionType - Type of condition (0=switch, 1=variable, etc.)
 * @param {Array} conditionParams - Parameters for the condition
 * @param {Array} trueCommands - Commands to execute if condition is true
 * @param {Array} falseCommands - Commands to execute if condition is false
 * @returns {Array} Command sequence
 */
function createConditionalCommands(conditionType, conditionParams, trueCommands, falseCommands = []) {
    const commands = [];
    
    // Add condition start
    commands.push({
        "code": 111,
        "indent": 0,
        "parameters": [conditionType, ...conditionParams]
    });
    
    // Add true branch commands
    for (const cmd of trueCommands) {
        const indentedCmd = {...cmd};
        indentedCmd.indent = cmd.indent + 1;
        commands.push(indentedCmd);
    }
    
    // Add false branch if provided
    if (falseCommands.length > 0) {
        // Add else statement
        commands.push({
            "code": 411,
            "indent": 0,
            "parameters": []
        });
        
        // Add false branch commands
        for (const cmd of falseCommands) {
            const indentedCmd = {...cmd};
            indentedCmd.indent = cmd.indent + 1;
            commands.push(indentedCmd);
        }
    }
    
    // Add branch end
    commands.push({
        "code": 412,
        "indent": 0,
        "parameters": []
    });
    
    return commands;
}
```

## Practical Example: Quest System Generator

Here's a more complex example that shows how to programmatically generate a complete quest system:

```javascript
/**
 * Creates a quest system with multiple NPCs and events
 * @param {Object} quest - Quest definition
 * @param {Object} locations - Map locations for NPCs
 * @returns {Object} Generated events and data
 */
function generateQuestSystem(quest, locations) {
    const events = {};
    
    // Create quest giver NPC
    const questGiverCommands = createQuestGiverCommands(quest);
    events.questGiver = createEvent(
        locations.questGiver.id,
        locations.questGiver.x,
        locations.questGiver.y,
        quest.questGiver.name,
        questGiverCommands,
        quest.questGiver.image,
        0  // Action button trigger
    );
    
    // Create target NPCs or objects
    if (quest.type === 'collection' || quest.type === 'delivery') {
        events.targets = [];
        for (let i = 0; i < quest.targets.length; i++) {
            const target = quest.targets[i];
            const targetCommands = createQuestTargetCommands(quest, target, i);
            
            events.targets.push(createEvent(
                locations.targets[i].id,
                locations.targets[i].x,
                locations.targets[i].y,
                target.name,
                targetCommands,
                target.image,
                target.trigger || 0
            ));
        }
    }
    
    // Create quest completion tracker
    if (quest.type === 'monster') {
        // Create an invisible event that tracks monster defeats
        const trackerCommands = createMonsterTrackerCommands(quest);
        events.tracker = createEvent(
            locations.tracker.id,
            locations.tracker.x,
            locations.tracker.y,
            "QuestTracker",
            trackerCommands,
            { characterIndex: 0, characterName: "", direction: 2, pattern: 0, tileId: 0 },
            4  // Parallel process trigger
        );
    }
    
    return events;
}

/**
 * Example quest definition:
 */
const sampleQuest = {
    id: 1,
    type: 'collection',  // 'collection', 'delivery', 'monster', 'escort'
    title: "Herb Collection",
    description: "Collect 5 rare herbs for the healer.",
    questGiver: {
        name: "Village Healer",
        image: { characterIndex: 0, characterName: "Actor1", direction: 2, pattern: 1 },
        dialog: {
            introduction: [
                "Hello there!",
                "I'm running low on medicinal herbs.",
                "Could you collect 5 rare herbs for me?"
            ],
            inProgress: [
                "How is the herb collection going?",
                "Remember, I need 5 rare herbs."
            ],
            completion: [
                "Wonderful! These herbs will help many patients.",
                "Please take this potion as thanks."
            ]
        }
    },
    targets: [
        {
            name: "Rare Herb Patch",
            image: { characterIndex: 0, characterName: "", direction: 2, pattern: 0, tileId: 96 },
            dialog: {
                examine: ["You found a rare herb!"]
            },
            itemId: 7,  // ID of herb item
            quantity: 1,
            respawnTime: 300  // Frames until respawn
        }
    ],
    rewards: {
        gold: 100,
        items: [{ id: 3, quantity: 1 }],  // Potion
        exp: 50
    },
    switchIds: {
        accepted: 5,
        completed: 6
    },
    variableIds: {
        progress: 8  // Stores collection progress
    }
};
```

## Next Steps

Now that you understand RPG Maker MZ's event system and how to manipulate it programmatically, you can:

1. **Build an Event Generator**: Create a library that generates events based on high-level descriptions
2. **Create Quest Systems**: Build a quest generation system that handles all the complex event logic
3. **Implement Dialog Trees**: Create rich, branching dialog with tracking of player choices
4. **Design Cutscene Engines**: Generate complex cutscenes from simpler descriptions
5. **Develop Content Validation**: Create tools to validate that generated events are playable and bug-free

For a comprehensive scriptable development approach, combine this with the data structure knowledge from the previous document to build a complete game generation pipeline.