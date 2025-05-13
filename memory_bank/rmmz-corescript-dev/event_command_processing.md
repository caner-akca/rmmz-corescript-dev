# RPG Maker MZ - Event Command Processing

This document details the event command processing architecture in RPG Maker MZ, focusing on how commands are parsed, executed, and how parameters are handled.

## Command Structure

### Command Format
```javascript
// Basic structure of an event command object
const command = {
    code: 101,           // Command code (e.g., 101 = Show Text)
    indent: 0,           // Indentation level (for flow control)
    parameters: [        // Parameters specific to the command
        "Actor1",        // Parameter 1 (e.g., face name)
        0,               // Parameter 2 (e.g., face index)
        0,               // Parameter 3 (e.g., background type)
        2                // Parameter 4 (e.g., position type)
    ]
};
```

### Parameter Extraction
```javascript
// Extract parameters by position
Game_Interpreter.prototype.command101 = function(params) {
    // Extract parameters from the params array
    const faceName = params[0];     // First parameter
    const faceIndex = params[1];    // Second parameter
    const background = params[2];   // Third parameter
    const positionType = params[3]; // Fourth parameter
    
    // Use parameters to set up the message
    $gameMessage.setFaceImage(faceName, faceIndex);
    $gameMessage.setBackground(background);
    $gameMessage.setPositionType(positionType);
    
    // Continue processing for this command
    // ...
    
    return false; // Wait for message to finish
};

// Handle array parameters
Game_Interpreter.prototype.command322 = function(params) {
    // Extract actor/party selection
    const targetType = params[0];   // 0 = Actor, 1 = Party
    const targetId = params[1];     // Actor ID or party index
    
    // Extract skill learning info
    const skillId = params[2];      // Skill to learn/forget
    const learn = params[3];        // true = learn, false = forget
    
    // Process command logic
    if (targetType === 0) {
        // Individual actor
        const actor = $gameActors.actor(targetId);
        if (actor) {
            if (learn) {
                actor.learnSkill(skillId);
            } else {
                actor.forgetSkill(skillId);
            }
        }
    } else {
        // Entire party
        for (const actor of $gameParty.members()) {
            if (learn) {
                actor.learnSkill(skillId);
            } else {
                actor.forgetSkill(skillId);
            }
        }
    }
    
    return true; // Command completes immediately
};
```

### Parameter Validation
```javascript
// Validate and clamp numerical parameters
Game_Interpreter.prototype.command122 = function(params) {
    // Extract variable operation parameters
    const startId = params[0];
    const endId = params[1];
    const operationType = params[2];
    const operand = params[3];
    
    // Validate range
    if (startId > endId) {
        return true; // Skip if invalid range
    }
    
    // Validate operation type
    if (operationType < 0 || operationType > 5) {
        return true; // Skip if invalid operation
    }
    
    // Process each variable in range
    for (let i = startId; i <= endId; i++) {
        // Get operand value based on type
        let value = 0;
        switch (operand) {
            case 0: // Constant
                value = params[4];
                break;
            case 1: // Variable
                value = $gameVariables.value(params[4]);
                break;
            // ... other operand types
        }
        
        // Apply operation with validated value
        this.operateVariable(i, operationType, value);
    }
    
    return true;
};

// Make sure values are within safe bounds
Game_Interpreter.prototype.operateVariable = function(id, operation, value) {
    // Ensure game variable exists
    if (id > 0 && id < $dataSystem.variables.length) {
        // Get current value
        const oldValue = $gameVariables.value(id);
        
        // Apply operation
        let newValue;
        switch (operation) {
            case 0: // Set
                newValue = value;
                break;
            case 1: // Add
                newValue = oldValue + value;
                break;
            case 2: // Subtract
                newValue = oldValue - value;
                break;
            case 3: // Multiply
                newValue = oldValue * value;
                break;
            case 4: // Divide
                newValue = oldValue / value;
                break;
            case 5: // Modulo
                newValue = oldValue % value;
                break;
        }
        
        // Clamp to safe integer range to prevent overflow
        if (newValue >= 0x8000000000000000) {
            newValue = 0x7FFFFFFFFFFFFFFF;
        }
        if (newValue <= -0x8000000000000000) {
            newValue = -0x7FFFFFFFFFFFFFFF;
        }
        
        // Set the new value
        $gameVariables.setValue(id, newValue);
    }
};
```

## Command Execution Flow

### Sequential Processing
```javascript
// Process multiple commands in sequence
Game_Interpreter.prototype.processSequentialCommands = function() {
    // Maximum number of commands to process per frame
    const maxCommands = 100;
    let commandCount = 0;
    
    // Process commands until hitting a wait or max limit
    while (this._index < this._list.length && commandCount < maxCommands) {
        const command = this._list[this._index];
        
        // Execute the command
        const methodName = "command" + command.code;
        if (typeof this[methodName] === "function") {
            const result = this[methodName](command.parameters);
            if (result === false) {
                // Command requested a wait, stop processing
                return false;
            }
        }
        
        // Move to next command
        this._index++;
        commandCount++;
    }
    
    // Return true if all commands were processed
    return this._index >= this._list.length;
};

// Update method to process commands over multiple frames
Game_Interpreter.prototype.update = function() {
    // Skip if no active event
    if (!this._list) {
        return false;
    }
    
    // Handle waiting states
    if (this._waitCount > 0) {
        this._waitCount--;
        return true;
    }
    
    // Process commands
    if (this.processSequentialCommands()) {
        // All commands processed, end event
        this._list = null;
        return false;
    }
    
    return true;
};
```

### Parallel Processing
```javascript
// Setup and process parallel events
Game_Map.prototype.updateParallelInterpreters = function() {
    for (const event of this.events()) {
        // Check for parallel process events
        if (event.isParallel()) {
            // Create interpreter if needed
            if (!event._interpreter) {
                event._interpreter = new Game_Interpreter();
                event._interpreter.setup(event.list(), event.eventId());
            }
            // Update the interpreter
            event._interpreter.update();
        }
    }
};

// Check if event is parallel process
Game_Event.prototype.isParallel = function() {
    return this._trigger === 4; // Parallel Process trigger
};

// Process common events in parallel
Game_CommonEvent.prototype.update = function() {
    if (this.isActive()) {
        if (!this._interpreter) {
            this._interpreter = new Game_Interpreter();
            this._interpreter.setup(this.list());
        }
        this._interpreter.update();
    } else {
        this._interpreter = null;
    }
};
```

### Stack and Nested Command Handling
```javascript
// Process nested command lists (like common events)
Game_Interpreter.prototype.setupChild = function(list, eventId) {
    this._childInterpreter = new Game_Interpreter(this._depth + 1);
    this._childInterpreter.setup(list, eventId);
    return this._childInterpreter;
};

// Update parent and child interpreters
Game_Interpreter.prototype.updateWithChildren = function() {
    // Update child first
    if (this._childInterpreter) {
        this._childInterpreter.update();
        if (this._childInterpreter.isRunning()) {
            // Child still running, don't update parent
            return true;
        } else {
            // Child finished, clear it
            this._childInterpreter = null;
        }
    }
    
    // Update this interpreter
    return this.update();
};
```

## Wait and Pause Handling

### Wait Modes
```javascript
// Set up different wait modes
Game_Interpreter.prototype.setWaitMode = function(waitMode) {
    this._waitMode = waitMode;
};

// Wait for message to complete
Game_Interpreter.prototype.command101 = function(params) {
    // ... message setup code ...
    
    // Wait for message to finish
    this.setWaitMode("message");
    return false; // Don't advance to next command yet
};

// Wait for movement to complete
Game_Interpreter.prototype.command205 = function(params) {
    // ... movement route setup ...
    
    // If waiting for completion is selected
    if (params[1]) {
        this.setWaitMode("route");
    }
    
    return true; // Continue processing
};
```

### Specialized Wait Handlers
```javascript
// Update all possible wait modes
Game_Interpreter.prototype.updateWaitMode = function() {
    let waiting = false;
    
    switch (this._waitMode) {
        case "message":
            waiting = $gameMessage.isBusy();
            break;
        case "transfer":
            waiting = $gamePlayer.isTransferring();
            break;
        case "scroll":
            waiting = $gameMap.isScrolling();
            break;
        case "route":
            waiting = this._character && 
                     this._character.isMoveRouteForcing();
            break;
        case "animation":
            waiting = this._character && 
                     this._character.isAnimationPlaying();
            break;
        case "balloon":
            waiting = this._character && 
                     this._character.isBalloonPlaying();
            break;
        case "gather":
            waiting = $gamePlayer.areFollowersGathering();
            break;
        case "action":
            waiting = BattleManager.isActionForced();
            break;
        case "video":
            waiting = Video.isPlaying();
            break;
        case "image":
            waiting = !ImageManager.isReady();
            break;
    }
    
    if (!waiting) {
        this._waitMode = "";
    }
    
    return waiting;
};

// Wait for a specific number of frames
Game_Interpreter.prototype.wait = function(duration) {
    this._waitCount = duration;
};
```

## Message and Text Processing

### Text Command Parsing
```javascript
// Process show text command
Game_Interpreter.prototype.command101 = function(params) {
    if ($gameMessage.isBusy()) {
        return false;
    }
    
    // Setup message settings
    $gameMessage.setFaceImage(params[0], params[1]);
    $gameMessage.setBackground(params[2]);
    $gameMessage.setPositionType(params[3]);
    $gameMessage.setSpeakerName(params[4]);
    
    // Process text contents
    while (this.nextEventCode() === 401) {
        // Get next command (text content)
        this._index++;
        const textCommand = this.currentCommand();
        
        // Add text to message
        $gameMessage.add(textCommand.parameters[0]);
    }
    
    // Check for choice commands following the message
    this.setupChoices(this.nextEventCode() === 102);
    
    // Wait for message processing to complete
    this.setWaitMode("message");
    return false;
};

// Process text content commands
Game_Interpreter.prototype.command401 = function(params) {
    // This is called for text content lines
    // The parameters[0] contains the line of text
    return true;
};
```

### Choice Processing
```javascript
// Process show choices command
Game_Interpreter.prototype.command102 = function(params) {
    if ($gameMessage.isBusy()) {
        return false;
    }
    
    // Extract choice parameters
    const choices = params[0];
    const cancelType = params[1];
    const defaultType = params[2];
    
    // Set up choices in the message system
    $gameMessage.setChoices(choices, cancelType, defaultType);
    $gameMessage.setChoiceBackground(params[3]);
    $gameMessage.setChoicePositionType(params[4]);
    $gameMessage.setChoiceCallback(n => {
        this._branch[this._indent] = n;
    });
    
    // Wait for choice to be made
    this.setWaitMode("message");
    return false;
};

// Process choice branches
Game_Interpreter.prototype.command402 = function(params) {
    // params[0] is the choice branch index
    if (this._branch[this._indent] !== params[0]) {
        // This branch was not selected, skip to next branch or end
        this.skipBranch();
    }
    return true;
};

// Process choice cancel handler
Game_Interpreter.prototype.command403 = function() {
    if (this._branch[this._indent] >= 0) {
        // A choice was selected, not canceled - skip the cancel handler
        this.skipBranch();
    }
    return true;
};
```

## Condition Checking

### Condition Evaluation
```javascript
// Evaluate branch conditions
Game_Interpreter.prototype.checkCondition = function(params) {
    const type = params[0];  // Condition type
    const param1 = params[1]; // First parameter
    const param2 = params[2]; // Second parameter
    
    switch (type) {
        case 0: // Switch
            return $gameSwitches.value(param1) === (param2 === 0);
        
        case 1: // Variable
            const value1 = $gameVariables.value(param1);
            let value2;
            
            if (param2 === 0) {
                // Constant
                value2 = params[3];
            } else {
                // Variable
                value2 = $gameVariables.value(params[3]);
            }
            
            // Compare based on operator
            switch (params[4]) {
                case 0:  // Equal to
                    return value1 === value2;
                case 1:  // Greater than or equal to
                    return value1 >= value2;
                case 2:  // Less than or equal to
                    return value1 <= value2;
                case 3:  // Greater than
                    return value1 > value2;
                case 4:  // Less than
                    return value1 < value2;
                case 5:  // Not equal to
                    return value1 !== value2;
                default:
                    return false;
            }
        
        case 2: // Self Switch
            const key = [this._mapId, this._eventId, param1];
            return $gameSelfSwitches.value(key) === (param2 === 0);
        
        case 3: // Timer
            if ($gameTimer.isWorking()) {
                if (param1 === 0) {
                    // Greater than or equal
                    return $gameTimer.seconds() >= param2;
                } else {
                    // Less than or equal
                    return $gameTimer.seconds() <= param2;
                }
            }
            return false;
        
        case 4: // Actor
            const actor = $gameActors.actor(param1);
            if (actor) {
                switch (param2) {
                    case 0:  // In Party
                        return $gameParty.members().includes(actor);
                    case 1:  // Name
                        return actor.name() === params[3];
                    case 2:  // Class
                        return actor.isClass($dataClasses[params[3]]);
                    case 3:  // Skill
                        return actor.hasSkill(params[3]);
                    case 4:  // Weapon
                        return actor.hasWeapon($dataWeapons[params[3]]);
                    case 5:  // Armor
                        return actor.hasArmor($dataArmors[params[3]]);
                    case 6:  // State
                        return actor.isStateAffected(params[3]);
                    default:
                        return false;
                }
            }
            return false;
        
        case 5: // Enemy
            const enemy = $gameTroop.members()[param1];
            if (enemy) {
                switch (param2) {
                    case 0:  // Appeared
                        return enemy.isAlive();
                    case 1:  // State
                        return enemy.isStateAffected(params[3]);
                    default:
                        return false;
                }
            }
            return false;
        
        case 6: // Character
            const character = this.character(param1);
            if (character) {
                return character.direction() === param2;
            }
            return false;
        
        case 7: // Gold
            switch (param1) {
                case 0:  // Greater than or equal to
                    return $gameParty.gold() >= param2;
                case 1:  // Less than or equal to
                    return $gameParty.gold() <= param2;
                case 2:  // Less than
                    return $gameParty.gold() < param2;
                default:
                    return false;
            }
        
        case 8: // Item
            return $gameParty.hasItem($dataItems[param1], param2);
        
        case 9: // Weapon
            return $gameParty.hasItem($dataWeapons[param1], param2);
        
        case 10: // Armor
            return $gameParty.hasItem($dataArmors[param1], param2);
        
        case 11: // Button
            return Input.isPressed(param1);
        
        case 12: // Script
            // Evaluate custom condition script
            return eval(params[3]);
        
        case 13: // Vehicle
            const vehicle = $gameMap.vehicle(param1);
            if (vehicle) {
                return vehicle.isInCurrentMap();
            }
            return false;
        
        default:
            return false;
    }
};
```

### Script Evaluation
```javascript
// Process script command
Game_Interpreter.prototype.command355 = function() {
    // First line of the script
    let script = this.currentCommand().parameters[0] + "\n";
    
    // Get consecutive script lines
    let index = this._index + 1;
    while (index < this._list.length) {
        const command = this._list[index];
        if (command.code === 655) {
            // Script continuation line
            script += command.parameters[0] + "\n";
        } else {
            // Not a script line, stop
            break;
        }
        index++;
    }
    
    // Skip the collected script lines
    this._index = index - 1;
    
    // Evaluate the script
    try {
        eval(script);
    } catch (e) {
        console.error("Error in event script:", e);
        console.log(script);
    }
    
    return true;
};

// Process script line continuation
Game_Interpreter.prototype.command655 = function() {
    // This is just a continuation line, handled by command355
    return true;
};
```

## Parameter Types and Processing

### Numeric Parameters
```javascript
// Process change gold command (numeric parameters)
Game_Interpreter.prototype.command125 = function(params) {
    const value = this.operateValue(params[0], params[1], params[2]);
    
    // Apply to game party gold
    $gameParty.gainGold(value);
    
    return true;
};

// Calculate a value based on operation type
Game_Interpreter.prototype.operateValue = function(operation, operandType, operand) {
    // Get the base value
    let value = 0;
    switch (operandType) {
        case 0:  // Constant
            value = operand;
            break;
        case 1:  // Variable
            value = $gameVariables.value(operand);
            break;
        case 2:  // Random
            value = Math.randomInt(operand) + 1;
            break;
        case 3:  // Game Data
            value = this.gameDataOperand(operand);
            break;
        case 4:  // Script
            value = eval(operand);
            break;
    }
    
    // Return positive or negative based on operation
    return operation === 0 ? value : -value;
};
```

### Character ID Parameters
```javascript
// Resolve character references
Game_Interpreter.prototype.character = function(param) {
    if ($gameParty.inBattle()) {
        // Battle mode character reference
        return null;
    } else {
        // Map character reference
        if (param < 0) {
            // Predefined characters
            switch (param) {
                case -1:  // Player
                    return $gamePlayer;
                case -2:  // Boat
                    return $gameMap.boat();
                case -3:  // Ship
                    return $gameMap.ship();
                case -4:  // Airship
                    return $gameMap.airship();
                default:
                    return null;
            }
        } else if (param === 0) {
            // This event
            return $gameMap.event(this._eventId);
        } else {
            // Specific event ID
            return $gameMap.event(param);
        }
    }
};

// Process change event location command
Game_Interpreter.prototype.command203 = function(params) {
    const character = this.character(params[0]);
    if (character) {
        if (params[1] === 0) {  // Direct designation
            const x = params[2];
            const y = params[3];
            const direction = params[4];
            
            character.locate(x, y);
            if (direction > 0) {
                character.setDirection(direction);
            }
        } else if (params[1] === 1) {  // Designation with variables
            const x = $gameVariables.value(params[2]);
            const y = $gameVariables.value(params[3]);
            const direction = params[4];
            
            character.locate(x, y);
            if (direction > 0) {
                character.setDirection(direction);
            }
        } else if (params[1] === 2) {  // Exchange with another event
            const target = this.character(params[2]);
            if (target) {
                const x = target.x;
                const y = target.y;
                
                target.locate(character.x, character.y);
                character.locate(x, y);
                
                // Match direction if specified
                if (params[4] > 0) {
                    target.setDirection(character.direction());
                }
            }
        }
    }
    
    return true;
};
```

### Item and Skill Parameters
```javascript
// Process change item command
Game_Interpreter.prototype.command126 = function(params) {
    const itemId = params[0];
    const operation = params[1];
    const operandType = params[2];
    const operand = params[3];
    
    // Skip if item doesn't exist
    if (!$dataItems[itemId]) {
        return true;
    }
    
    // Calculate amount using utility method
    const value = this.operateValue(operation, operandType, operand);
    
    // Add/remove items to party inventory
    $gameParty.gainItem($dataItems[itemId], value);
    
    return true;
};

// Process learn/forget skill command
Game_Interpreter.prototype.command318 = function(params) {
    const actorId = params[0];
    const skillId = params[1];
    const learn = params[2];  // 0 = learn, 1 = forget
    
    // Get target actor
    const actor = $gameActors.actor(actorId);
    
    // Apply skill change
    if (actor) {
        if (learn === 0) {
            actor.learnSkill(skillId);
        } else {
            actor.forgetSkill(skillId);
        }
    }
    
    return true;
};
```