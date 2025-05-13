# RPG Maker MZ - Event Key Commands

This document details the implementation of key event commands in RPG Maker MZ, focusing on movement, message, battle, party management, and other important command types.

## Movement and Character Commands

### Player Transfer
```javascript
// Command 201: Transfer Player
Game_Interpreter.prototype.command201 = function(params) {
    if ($gameParty.inBattle() || $gameMessage.isBusy()) {
        return false;
    }
    
    let mapId, x, y;
    if (params[0] === 0) {  // Direct designation
        mapId = params[1];
        x = params[2];
        y = params[3];
    } else {  // Designation with variables
        mapId = $gameVariables.value(params[1]);
        x = $gameVariables.value(params[2]);
        y = $gameVariables.value(params[3]);
    }
    
    const direction = params[4];
    const fadeType = params[5];
    
    $gamePlayer.reserveTransfer(mapId, x, y, direction, fadeType);
    this.setWaitMode("transfer");
    
    return true;
};
```

### Set Movement Route
```javascript
// Command 205: Set Movement Route
Game_Interpreter.prototype.command205 = function(params) {
    const character = this.character(params[0]);
    if (character) {
        const route = params[1];
        character.forceMoveRoute(route);
        if (params[1].wait) {
            this._character = character;
            this.setWaitMode("route");
        }
    }
    return true;
};

// Process movement commands within a route
Game_Character.prototype.processMoveCommand = function(command) {
    const params = command.parameters;
    switch (command.code) {
        case 0:  // Move Down
            this.moveStraight(2);
            break;
        case 1:  // Move Left
            this.moveStraight(4);
            break;
        case 2:  // Move Right
            this.moveStraight(6);
            break;
        case 3:  // Move Up
            this.moveStraight(8);
            break;
        case 4:  // Move Lower Left
            this.moveDiagonally(4, 2);
            break;
        case 5:  // Move Lower Right
            this.moveDiagonally(6, 2);
            break;
        case 6:  // Move Upper Left
            this.moveDiagonally(4, 8);
            break;
        case 7:  // Move Upper Right
            this.moveDiagonally(6, 8);
            break;
        case 8:  // Move at Random
            this.moveRandom();
            break;
        case 9:  // Move toward Player
            this.moveTowardPlayer();
            break;
        case 10:  // Move away from Player
            this.moveAwayFromPlayer();
            break;
        case 11:  // Move Forward
            this.moveForward();
            break;
        case 12:  // Move Backward
            this.moveBackward();
            break;
        case 13:  // Jump
            this.jump(params[0], params[1]);
            break;
        case 14:  // Wait
            this._waitCount = params[0] - 1;
            break;
        case 15:  // Turn Down
            this.setDirection(2);
            break;
        case 16:  // Turn Left
            this.setDirection(4);
            break;
        case 17:  // Turn Right
            this.setDirection(6);
            break;
        case 18:  // Turn Up
            this.setDirection(8);
            break;
        case 19:  // Turn 90° Right
            this.turnRight90();
            break;
        case 20:  // Turn 90° Left
            this.turnLeft90();
            break;
        case 21:  // Turn 180°
            this.turn180();
            break;
        case 22:  // Turn 90° Right or Left
            this.turnRightOrLeft90();
            break;
        case 23:  // Turn at Random
            this.turnRandom();
            break;
        case 24:  // Turn toward Player
            this.turnTowardPlayer();
            break;
        case 25:  // Turn away from Player
            this.turnAwayFromPlayer();
            break;
        case 26:  // Switch ON
            $gameSwitches.setValue(params[0], true);
            break;
        case 27:  // Switch OFF
            $gameSwitches.setValue(params[0], false);
            break;
        case 28:  // Change Speed
            this.setMoveSpeed(params[0]);
            break;
        case 29:  // Change Frequency
            this.setMoveFrequency(params[0]);
            break;
        case 30:  // Walking Animation ON
            this.setWalkAnime(true);
            break;
        case 31:  // Walking Animation OFF
            this.setWalkAnime(false);
            break;
        case 32:  // Stepping Animation ON
            this.setStepAnime(true);
            break;
        case 33:  // Stepping Animation OFF
            this.setStepAnime(false);
            break;
        case 34:  // Direction Fix ON
            this.setDirectionFix(true);
            break;
        case 35:  // Direction Fix OFF
            this.setDirectionFix(false);
            break;
        case 36:  // Through ON
            this.setThrough(true);
            break;
        case 37:  // Through OFF
            this.setThrough(false);
            break;
        case 38:  // Transparent ON
            this.setTransparent(true);
            break;
        case 39:  // Transparent OFF
            this.setTransparent(false);
            break;
        case 40:  // Change Image
            this.setImage(params[0], params[1]);
            break;
        case 41:  // Change Opacity
            this.setOpacity(params[0]);
            break;
        case 42:  // Change Blend Mode
            this.setBlendMode(params[0]);
            break;
        case 43:  // Play SE
            AudioManager.playSe(params[0]);
            break;
        case 44:  // Script
            eval(params[0]);
            break;
    }
};
```

### Scroll Map
```javascript
// Command 204: Scroll Map
Game_Interpreter.prototype.command204 = function(params) {
    const direction = params[0];
    const distance = params[1];
    const speed = params[2];
    
    $gameMap.startScroll(direction, distance, speed);
    this.setWaitMode("scroll");
    
    return true;
};

// Map scrolling implementation
Game_Map.prototype.startScroll = function(direction, distance, speed) {
    this._scrollDirection = direction;
    this._scrollRest = distance;
    this._scrollSpeed = speed;
};

// Update map scrolling
Game_Map.prototype.updateScroll = function() {
    if (this._scrollRest > 0) {
        const lastScrolledX = this._scrolledX;
        const lastScrolledY = this._scrolledY;
        this.doScroll(this._scrollDirection, this.scrollDistance());
        if (this._scrolledX !== lastScrolledX || this._scrolledY !== lastScrolledY) {
            this._scrollRest -= this.scrollDistance();
        } else {
            this._scrollRest = 0;
        }
    }
};

// Check if map is currently scrolling
Game_Map.prototype.isScrolling = function() {
    return this._scrollRest > 0;
};
```

### Get On/Off Vehicle
```javascript
// Command 206: Get On/Off Vehicle
Game_Interpreter.prototype.command206 = function() {
    $gamePlayer.getOnOffVehicle();
    return true;
};

// Player vehicle interaction
Game_Player.prototype.getOnOffVehicle = function() {
    if (this.isInVehicle()) {
        // Get off vehicle
        this.getOffVehicle();
    } else {
        // Get on vehicle
        this.getOnVehicle();
    }
};

// Get on a vehicle
Game_Player.prototype.getOnVehicle = function() {
    const direction = this.direction();
    const x1 = this.x;
    const y1 = this.y;
    const x2 = $gameMap.roundXWithDirection(x1, direction);
    const y2 = $gameMap.roundYWithDirection(y1, direction);
    
    if ($gameMap.airship().pos(x1, y1)) {
        this._vehicleType = "airship";
    } else if ($gameMap.ship().pos(x2, y2)) {
        this._vehicleType = "ship";
    } else if ($gameMap.boat().pos(x2, y2)) {
        this._vehicleType = "boat";
    }
    
    if (this._vehicleType) {
        const vehicle = this.vehicle();
        vehicle.getOn();
    }
};

// Get off current vehicle
Game_Player.prototype.getOffVehicle = function() {
    if (this.isInAirship()) {
        this.setDirection(2); // Down
    }
    
    this._vehicleGetOffX = this.x;
    this._vehicleGetOffY = this.y;
    this._vehicleType = "walk";
    
    this.setTransparent(false);
    this.setMoveSpeed(4);
    this.setThrough(false);
    
    const vehicle = this.vehicle();
    if (vehicle) {
        vehicle.getOff();
    }
};
```

## Message and Dialog Commands

### Show Text
```javascript
// Command 101: Show Text
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
        const textCommand = this.currentCommand();
        $gameMessage.add(textCommand.parameters[0]);
    }
    
    // Check for choice commands after the message
    this.setupChoices(this.nextEventCode() === 102);
    this.setupNumInput(this.nextEventCode() === 103);
    this.setupItemChoice(this.nextEventCode() === 104);
    
    this.setWaitMode("message");
    return false;
};

// Process text data
Game_Interpreter.prototype.command401 = function(params) {
    // This is called for text content lines 
    // Already processed by command101
    return true;
};
```

### Show Choices
```javascript
// Command 102: Show Choices
Game_Interpreter.prototype.command102 = function(params) {
    if ($gameMessage.isBusy()) {
        return false;
    }
    
    const choices = params[0].clone();
    const cancelType = params[1];
    
    // Set up choices in the message system
    $gameMessage.setChoices(choices, cancelType);
    $gameMessage.setChoiceBackground(params[2]);
    $gameMessage.setChoicePositionType(params[3]);
    $gameMessage.setChoiceCallback(n => {
        this._branch[this._indent] = n;
    });
    
    this.setWaitMode("message");
    return false;
};

// Process choice branch
Game_Interpreter.prototype.command402 = function(params) {
    if (this._branch[this._indent] !== params[0]) {
        this.skipBranch();
    }
    return true;
};

// Process choice cancel handler
Game_Interpreter.prototype.command403 = function() {
    if (this._branch[this._indent] >= 0) {
        this.skipBranch();
    }
    return true;
};
```

### Input Number
```javascript
// Command 103: Input Number
Game_Interpreter.prototype.command103 = function(params) {
    if ($gameMessage.isBusy()) {
        return false;
    }
    
    const variableId = params[0];
    const digits = params[1];
    
    $gameMessage.setNumberInput(variableId, digits);
    this.setWaitMode("message");
    
    return false;
};
```

### Show Scrolling Text
```javascript
// Command 105: Show Scrolling Text
Game_Interpreter.prototype.command105 = function(params) {
    if ($gameMessage.isBusy()) {
        return false;
    }
    
    // Set scrolling text parameters
    $gameMessage.setScroll(params[0], params[1]);
    
    // Process text lines
    while (this.nextEventCode() === 405) {
        this._index++;
        const textCommand = this.currentCommand();
        $gameMessage.add(textCommand.parameters[0]);
    }
    
    this.setWaitMode("message");
    return false;
};

// Process scrolling text data
Game_Interpreter.prototype.command405 = function(params) {
    // Already processed by command105
    return true;
};
```

## Battle and Party Commands

### Battle Processing
```javascript
// Command 301: Battle Processing
Game_Interpreter.prototype.command301 = function(params) {
    if ($gameParty.inBattle()) {
        return true;
    }
    
    let troopId;
    
    if (params[0] === 0) {  // Direct designation
        troopId = params[1];
    } else if (params[0] === 1) {  // Designation with variable
        troopId = $gameVariables.value(params[1]);
    } else {  // Random encounter
        troopId = this.randomEncounter();
    }
    
    if ($dataTroops[troopId]) {
        BattleManager.setup(troopId, params[2], params[3]);
        BattleManager.setEventCallback(result => {
            this._branch[this._indent] = result;
        });
        $gamePlayer.makeEncounterCount();
        SceneManager.push(Scene_Battle);
    }
    
    return true;
};

// Process battle result branch
Game_Interpreter.prototype.command601 = function() {
    // When Battle is Won
    if (this._branch[this._indent] !== 0) {
        this.skipBranch();
    }
    return true;
};

Game_Interpreter.prototype.command602 = function() {
    // When Battle is Escaped
    if (this._branch[this._indent] !== 1) {
        this.skipBranch();
    }
    return true;
};

Game_Interpreter.prototype.command603 = function() {
    // When Battle is Lost
    if (this._branch[this._indent] !== 2) {
        this.skipBranch();
    }
    return true;
};
```

### Shop Processing
```javascript
// Command 302: Shop Processing
Game_Interpreter.prototype.command302 = function(params) {
    if ($gameParty.inBattle()) {
        return true;
    }
    
    const goods = [params];
    while (this.nextEventCode() === 605) {
        this._index++;
        const goodsCommand = this.currentCommand();
        goods.push(goodsCommand.parameters);
    }
    
    SceneManager.push(Scene_Shop);
    SceneManager.prepareNextScene(goods, params[4]);
    
    return true;
};

// Process shop goods data
Game_Interpreter.prototype.command605 = function(params) {
    // Already processed by command302
    return true;
};
```

### Change Party Member
```javascript
// Command 129: Change Party Member
Game_Interpreter.prototype.command129 = function(params) {
    const actor = $gameActors.actor(params[0]);
    if (actor) {
        if (params[1] === 0) {  // Add
            if (params[2]) {  // Initialize
                $gameActors.actor(params[0]).setup(params[0]);
            }
            $gameParty.addActor(params[0]);
        } else {  // Remove
            $gameParty.removeActor(params[0]);
        }
    }
    return true;
};
```

## Control Structure Commands

### Conditional Branch
```javascript
// Command 111: Conditional Branch
Game_Interpreter.prototype.command111 = function(params) {
    let result = false;
    
    // Evaluate condition
    switch (params[0]) {
        case 0:  // Switch
            result = $gameSwitches.value(params[1]) === (params[2] === 0);
            break;
        case 1:  // Variable
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
            // ... Additional condition types ...
    }
    
    this._branch[this._indent] = result;
    
    if (!result) {
        this.skipBranch();
    }
    
    return true;
};
```

### Loop
```javascript
// Command 112: Loop
Game_Interpreter.prototype.command112 = function() {
    this._loop[this._indent] = true;
    return true;
};

// Command 413: Repeat Above
Game_Interpreter.prototype.command413 = function() {
    // Jump back to the last loop start
    do {
        this._index--;
        const command = this.currentCommand();
        if (command && command.code === 112 && command.indent === this._indent) {
            break;
        }
    } while (this._index > 0);
    
    return true;
};

// Command 113: Break Loop
Game_Interpreter.prototype.command113 = function() {
    // Jump to the matching loop end
    const indent = this._indent;
    while (this._index < this._list.length) {
        this._index++;
        const command = this.currentCommand();
        if (command && command.code === 413 && command.indent === indent) {
            break;
        }
    }
    
    return true;
};
```

### Control Switches and Variables

```javascript
// Command 121: Control Switches
Game_Interpreter.prototype.command121 = function(params) {
    const startId = params[0];
    const endId = params[1];
    const value = params[2] === 0;
    
    for (let i = startId; i <= endId; i++) {
        $gameSwitches.setValue(i, value);
    }
    
    return true;
};

// Command 122: Control Variables
Game_Interpreter.prototype.command122 = function(params) {
    const startId = params[0];
    const endId = params[1];
    const operationType = params[2];
    const operand = params[3];
    
    let value = 0;
    let randomMax = 1;
    
    switch (operand) {
        case 0:  // Constant
            value = params[4];
            break;
        case 1:  // Variable
            value = $gameVariables.value(params[4]);
            break;
        case 2:  // Random
            value = params[4];
            randomMax = params[5] - params[4] + 1;
            randomMax = Math.max(randomMax, 1);
            break;
        case 3:  // Game Data
            value = this.gameDataOperand(params[4], params[5], params[6]);
            break;
        case 4:  // Script
            try {
                // Evaluate custom value calculation
                value = eval(params[4]);
            } catch (e) {
                console.error("Error in variable script:", e);
                value = 0;
            }
            break;
    }
    
    for (let i = startId; i <= endId; i++) {
        if (operand === 2) {
            // Generate new random value for each variable
            value = Math.randomInt(randomMax) + params[4];
        }
        
        // Apply the operation
        this.operateVariable(i, operationType, value);
    }
    
    return true;
};

// Perform operation on a variable
Game_Interpreter.prototype.operateVariable = function(variableId, operationType, value) {
    try {
        const oldValue = $gameVariables.value(variableId);
        let newValue = oldValue;
        
        switch (operationType) {
            case 0:  // Set
                newValue = value;
                break;
            case 1:  // Add
                newValue = oldValue + value;
                break;
            case 2:  // Subtract
                newValue = oldValue - value;
                break;
            case 3:  // Multiply
                newValue = oldValue * value;
                break;
            case 4:  // Divide
                if (value === 0) {
                    newValue = 0; // Prevent division by zero
                } else {
                    newValue = oldValue / value;
                }
                break;
            case 5:  // Modulo
                if (value === 0) {
                    newValue = 0; // Prevent modulo by zero
                } else {
                    newValue = oldValue % value;
                }
                break;
        }
        
        // Set the calculated value
        $gameVariables.setValue(variableId, newValue);
    } catch (e) {
        console.error("Error operating on variable: " + variableId, e);
    }
};
```

## Screen and Visual Commands

### Screen Fading
```javascript
// Command 221: Fade Out Screen
Game_Interpreter.prototype.command221 = function() {
    if ($gameMessage.isBusy()) {
        return false;
    }
    
    $gameScreen.startFadeOut(this.fadeSpeed());
    this.wait(this.fadeSpeed());
    
    return true;
};

// Command 222: Fade In Screen
Game_Interpreter.prototype.command222 = function() {
    if ($gameMessage.isBusy()) {
        return false;
    }
    
    $gameScreen.startFadeIn(this.fadeSpeed());
    this.wait(this.fadeSpeed());
    
    return true;
};
```

### Tint Screen
```javascript
// Command 223: Tint Screen
Game_Interpreter.prototype.command223 = function(params) {
    if ($gameMessage.isBusy()) {
        return false;
    }
    
    const r = params[0];
    const g = params[1];
    const b = params[2];
    const gray = params[3];
    const duration = params[4];
    
    // Wait if specified
    const wait = params[5];
    
    // Apply tint
    $gameScreen.startTint([r, g, b, gray], duration);
    
    if (wait) {
        this.wait(duration);
    }
    
    return true;
};
```

### Flash Screen
```javascript
// Command 224: Flash Screen
Game_Interpreter.prototype.command224 = function(params) {
    if ($gameMessage.isBusy()) {
        return false;
    }
    
    const r = params[0];
    const g = params[1];
    const b = params[2];
    const intensity = params[3];
    const duration = params[4];
    
    // Wait if specified
    const wait = params[5];
    
    // Apply flash
    $gameScreen.startFlash([r, g, b, intensity], duration);
    
    if (wait) {
        this.wait(duration);
    }
    
    return true;
};
```

### Show/Change/Erase Picture
```javascript
// Command 231: Show Picture
Game_Interpreter.prototype.command231 = function(params) {
    const pictureId = params[0];
    const name = params[1];
    const origin = params[2];
    
    // Position can be direct or variable-based
    let x, y;
    if (params[3] === 0) {  // Direct designation
        x = params[4];
        y = params[5];
    } else {  // Designation with variables
        x = $gameVariables.value(params[4]);
        y = $gameVariables.value(params[5]);
    }
    
    const scaleX = params[6];
    const scaleY = params[7];
    const opacity = params[8];
    const blendMode = params[9];
    
    // Show the picture
    $gameScreen.showPicture(
        pictureId, name, origin, x, y, scaleX, scaleY, opacity, blendMode
    );
    
    return true;
};

// Command 232: Move Picture
Game_Interpreter.prototype.command232 = function(params) {
    const pictureId = params[0];
    const origin = params[1];
    
    // Position can be direct or variable-based
    let x, y;
    if (params[2] === 0) {  // Direct designation
        x = params[3];
        y = params[4];
    } else {  // Designation with variables
        x = $gameVariables.value(params[3]);
        y = $gameVariables.value(params[4]);
    }
    
    const scaleX = params[5];
    const scaleY = params[6];
    const opacity = params[7];
    const blendMode = params[8];
    const duration = params[9];
    
    // Wait if specified
    const wait = params[10];
    
    // Set up picture movement
    $gameScreen.movePicture(
        pictureId, origin, x, y, scaleX, scaleY, opacity, blendMode, duration
    );
    
    if (wait) {
        this.wait(duration);
    }
    
    return true;
};
```

## System Commands

### Change Timer
```javascript
// Command 230: Wait
Game_Interpreter.prototype.command230 = function(params) {
    this.wait(params[0]);
    return true;
};

// Command 235: Wait for Movement
Game_Interpreter.prototype.command235 = function() {
    this.setWaitMode("route");
    return true;
};

// Command 236: Wait for Animation
Game_Interpreter.prototype.command236 = function() {
    this.setWaitMode("animation");
    return true;
};

// Command 237: Wait for Balloon
Game_Interpreter.prototype.command237 = function() {
    this.setWaitMode("balloon");
    return true;
};
```

### Scene Control
```javascript
// Command 303: Name Input Processing
Game_Interpreter.prototype.command303 = function(params) {
    if ($gameParty.inBattle()) {
        return true;
    }
    
    const actorId = params[0];
    const maxLength = params[1];
    
    // Show the name input dialog
    if ($dataActors[actorId]) {
        SceneManager.push(Scene_Name);
        SceneManager.prepareNextScene(actorId, maxLength);
    }
    
    return true;
};

// Command 354: Game Over
Game_Interpreter.prototype.command354 = function() {
    SceneManager.goto(Scene_Gameover);
    return true;
};

// Command 355: Return to Title Screen
Game_Interpreter.prototype.command354 = function() {
    SceneManager.goto(Scene_Title);
    return true;
};
```

### Save/Load Control
```javascript
// Command 352: Save Game
Game_Interpreter.prototype.command352 = function() {
    const savefileId = $gameSystem.savefileId();
    
    // Check if save is available at this point
    if (!$gameSystem.isSaveEnabled()) {
        return true;
    }
    
    $gameSystem.onBeforeSave();
    DataManager.saveGame(savefileId);
    
    return true;
};

// Command 353: Load Game
Game_Interpreter.prototype.command353 = function() {
    const savefileId = $gameSystem.savefileId();
    
    // Check if load is available at this point 
    if (DataManager.loadGame(savefileId)) {
        SceneManager.goto(Scene_Map);
        $gamePlayer.reserveTransfer(
            $gameMap.mapId(),
            $gamePlayer.x,
            $gamePlayer.y,
            $gamePlayer.direction(),
            2  // Fade in after loading
        );
        $gamePlayer.requestMapReload();
    }
    
    return true;
};
```

## Plugin Commands

### Call Plugin Command
```javascript
// Command 357: Plugin Command (MZ style)
Game_Interpreter.prototype.command357 = function(params) {
    const pluginName = params[0];
    const commandName = params[1];
    
    // Call plugin command via PluginManager
    PluginManager.callCommand(this, pluginName, commandName, params[2]);
    
    return true;
};

// Command 356: Plugin Command (MV style - legacy support)
Game_Interpreter.prototype.command356 = function(params) {
    const args = params[0].split(" ");
    const command = args.shift();
    
    // Call the plugin command via legacy interface
    this.pluginCommand(command, args);
    
    return true;
};

// Legacy plugin command handling (for compatibility with MV plugins)
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    // Empty default implementation for backwards compatibility
    // Plugin developers can monkey patch this method
};
```