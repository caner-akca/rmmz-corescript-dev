# RPG Maker MZ - Event Interpreter System

The Event Interpreter system in RPG Maker MZ is responsible for executing event commands from map events, common events, battle events, and troop events.

## Core Components

### Game_Interpreter
- Located in `rmmz_objects/Game_Interpreter.js`
- Main class that processes and executes event commands
- Maintains execution state including position, indentation, and branch conditions
- Handles command arguments and parameter processing
- Manages wait conditions and parallel execution

## Interpreter Structure

### Interpreter Initialization
```javascript
// Create interpreter for event execution
const interpreter = new Game_Interpreter();

// Setup interpreter with command list and event ID
interpreter.setup(commandList, eventId);

// Set depth for nested interpreters (for common events)
interpreter._depth = depth;
```

### Command List Structure
Event commands are stored as arrays of command objects:

```javascript
// Command list structure
[
    {
        code: 101,       // Command code (e.g., 101 = Show Text)
        indent: 0,       // Indentation level (for conditional branches)
        parameters: []   // Command parameters (varies by command)
    },
    {
        code: 401,       // Text content command
        indent: 0,
        parameters: ["This is a message."]
    },
    // More commands...
]
```

### Execution Process
The interpreter processes commands sequentially:

```javascript
// Main update method (called each frame)
Game_Interpreter.prototype.update = function() {
    while (this.isRunning()) {
        if (this.updateChild() || this.updateWait()) {
            break;
        }
        if (SceneManager.isSceneChanging()) {
            break;
        }
        if (!this.executeCommand()) {
            break;
        }
        if (this.checkFreeze()) {
            break;
        }
    }
};

// Execute a single command
Game_Interpreter.prototype.executeCommand = function() {
    const command = this.currentCommand();
    if (command) {
        this._indent = command.indent;
        const methodName = "command" + command.code;
        if (typeof this[methodName] === "function") {
            if (!this[methodName](command.parameters)) {
                return false;
            }
        }
        this._index++;
    } else {
        this.terminate();
    }
    return true;
};
```

## Command Processing

### Command Methods
Each command code has a corresponding method in Game_Interpreter:

```javascript
// Show Text command (code 101)
Game_Interpreter.prototype.command101 = function(params) {
    if ($gameMessage.isBusy()) {
        return false;
    }
    $gameMessage.setFaceImage(params[0], params[1]);
    $gameMessage.setBackground(params[2]);
    $gameMessage.setPositionType(params[3]);
    $gameMessage.setSpeakerName(params[4]);
    while (this.nextEventCode() === 401) {
        this._index++;
        $gameMessage.add(this.currentCommand().parameters[0]);
    }
    switch (this.nextEventCode()) {
        case 102: // Show Choices
            this._index++;
            this.setupChoices(this.currentCommand().parameters);
            break;
        case 103: // Input Number
            this._index++;
            this.setupNumInput(this.currentCommand().parameters);
            break;
        case 104: // Select Item
            this._index++;
            this.setupItemChoice(this.currentCommand().parameters);
            break;
    }
    this.setWaitMode("message");
    return true;
};
```

### Command Codes
The most important command codes include:

- **101**: Show Text
- **102**: Show Choices
- **103**: Input Number
- **104**: Select Item
- **105**: Show Scrolling Text
- **108/408**: Comment
- **111**: Conditional Branch
- **112**: Loop
- **113**: Break Loop
- **115**: Exit Event Processing
- **117**: Common Event
- **121**: Control Switches
- **122**: Control Variables
- **201**: Transfer Player
- **231**: Show Picture
- **301**: Battle Processing
- **355/655**: Script

## Flow Control Management

### Conditional Branches
The interpreter handles conditional logic:

```javascript
// Conditional Branch command (111)
Game_Interpreter.prototype.command111 = function(params) {
    let result = false;
    switch (params[0]) {
        case 0: // Switch
            result = $gameSwitches.value(params[1]) === (params[2] === 0);
            break;
        case 1: // Variable
            const value1 = $gameVariables.value(params[1]);
            let value2;
            if (params[2] === 0) {
                value2 = params[3];
            } else {
                value2 = $gameVariables.value(params[3]);
            }
            switch (params[4]) {
                case 0:  // Equal to
                    result = value1 === value2;
                    break;
                case 1:  // Greater than or equal to
                    result = value1 >= value2;
                    break;
                case 2:  // Less than or equal to
                    result = value1 <= value2;
                    break;
                case 3:  // Greater than
                    result = value1 > value2;
                    break;
                case 4:  // Less than
                    result = value1 < value2;
                    break;
                case 5:  // Not equal to
                    result = value1 !== value2;
                    break;
            }
            break;
        // ... many more condition types
    }
    this._branch[this._indent] = result;
    if (this._branch[this._indent]) {
        this.executeCommand();
    } else {
        this.skipBranch();
    }
    return true;
};
```

### Loops and Jump Control
```javascript
// Loop command (112)
Game_Interpreter.prototype.command112 = function() {
    this._loop[this._indent] = true;
    return true;
};

// Break Loop command (113)
Game_Interpreter.prototype.command113 = function() {
    this._loop[this._indent] = false;
    return this.command115(); // Exit Event Processing
};

// Skip branches to matching Else or End
Game_Interpreter.prototype.skipBranch = function() {
    while (this._index < this._list.length) {
        const command = this.currentCommand();
        if (command.indent < this._indent) {
            break;
        }
        if (command.indent === this._indent) {
            if (command.code === 411) { // Else
                this._index++;
                return;
            }
            if (command.code === 412) { // End
                this._index++;
                return;
            }
        }
        this._index++;
    }
};
```

## Wait Conditions

### Wait Mode Management
The interpreter can pause execution for various reasons:

```javascript
// Check if interpreter is waiting
Game_Interpreter.prototype.updateWait = function() {
    return this.updateWaitCount() || this.updateWaitMode();
};

// Update wait mode based on condition
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
            waiting = this._character.isMoveRouteForcing();
            break;
        case "animation":
            waiting = this._character.isAnimationPlaying();
            break;
        case "balloon":
            waiting = this._character.isBalloonPlaying();
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
```

### Frame Wait
```javascript
// Wait command (230)
Game_Interpreter.prototype.command230 = function(params) {
    this.setWaitMode("wait");
    this._waitCount = params[0];
    return true;
};

// Update wait count
Game_Interpreter.prototype.updateWaitCount = function() {
    if (this._waitCount > 0) {
        this._waitCount--;
        return true;
    }
    return false;
};
```

## Common Event Handling

### Common Event Calls
```javascript
// Call Common Event command (117)
Game_Interpreter.prototype.command117 = function(params) {
    const commonEvent = $dataCommonEvents[params[0]];
    if (commonEvent) {
        const eventId = this.isOnCurrentMap() ? this._eventId : 0;
        this.setupChild(commonEvent.list, eventId);
    }
    return true;
};

// Setup child interpreter
Game_Interpreter.prototype.setupChild = function(list, eventId) {
    this._childInterpreter = new Game_Interpreter(this._depth + 1);
    this._childInterpreter.setup(list, eventId);
};

// Update child interpreter
Game_Interpreter.prototype.updateChild = function() {
    if (this._childInterpreter) {
        this._childInterpreter.update();
        if (this._childInterpreter.isRunning()) {
            return true;
        } else {
            this._childInterpreter = null;
        }
    }
    return false;
};
```

## Script and Plugin Command Execution

### Script Commands
```javascript
// Script command (355/655)
Game_Interpreter.prototype.command355 = function() {
    let script = this.currentCommand().parameters[0] + "\n";
    while (this.nextEventCode() === 655) {
        this._index++;
        script += this.currentCommand().parameters[0] + "\n";
    }
    eval(script);
    return true;
};
```

### Plugin Commands
```javascript
// Plugin Command (for MV plugins - code 356)
Game_Interpreter.prototype.command356 = function(params) {
    const args = params[0].split(" ");
    const command = args.shift();
    this.pluginCommand(command, args);
    return true;
};

// Plugin Command MZ (for MZ plugins - code 357)
Game_Interpreter.prototype.command357 = function(params) {
    const pluginName = params[0];
    const commandName = params[1];
    const args = params[3] || {};
    PluginManager.callCommand(this, pluginName, commandName, args);
    return true;
};
```

## Parallel Event Processing

### Parallelism Support
Interpreters can run in parallel threads for simultaneous execution:

```javascript
// Check if interpreter should continue running
Game_Interpreter.prototype.isBusy = function() {
    return this._busy;
};

// Setup parallel execution flag
Game_Interpreter.prototype.setupParallel = function(eventId) {
    this._eventId = eventId;
    this._parallel = true;
};

// Update method modified for parallel events
const _Game_Interpreter_update = Game_Interpreter.prototype.update;
Game_Interpreter.prototype.update = function() {
    if (this._parallel) {
        this.updateParallel();
    } else {
        _Game_Interpreter_update.call(this);
    }
};

// Special update for parallel events
Game_Interpreter.prototype.updateParallel = function() {
    if (!this.isRunning()) return;
    
    if (this.updateChild() || this.updateWait()) {
        return;
    }
    
    // Only process one command per frame for parallel events
    if (this.executeCommand()) {
        this.checkFreeze();
    }
};
```

## Custom Interpreter Extensions

### Adding New Commands
Plugins can add new command types:

```javascript
// Add a custom command type
Game_Interpreter.prototype.command999 = function(params) {
    // Custom command implementation
    console.log("Custom command executed with parameters:", params);
    return true;
};
```

### Enhancing Existing Commands
```javascript
// Enhance existing command
const _Game_Interpreter_command101 = Game_Interpreter.prototype.command101;
Game_Interpreter.prototype.command101 = function(params) {
    // Pre-processing
    console.log("About to show text:", params);
    
    // Call original implementation
    const result = _Game_Interpreter_command101.call(this, params);
    
    // Post-processing
    console.log("Text command processed");
    
    return result;
};
```