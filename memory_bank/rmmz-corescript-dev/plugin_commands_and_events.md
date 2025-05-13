# RPG Maker MZ - Plugin Commands and Event Integration

This document details how plugins integrate with the RPG Maker MZ event system, focusing on plugin commands, event handling, and integration with the event interpreter.

## Plugin Command System Overview

RPG Maker MZ introduces a significantly improved plugin command system that provides a structured way for event scripts to communicate with plugins. This feature enables game developers to access plugin functionality directly from events without writing JavaScript code.

## Plugin Command Structure

### Command Registration

Plugin commands are registered through the `PluginManager.registerCommand` method:

```javascript
// Register a plugin command
PluginManager.registerCommand("MyPlugin", "DoSomething", function(args) {
    // Command implementation goes here
    const value = Number(args.value);
    const target = String(args.target);
    
    // Perform the plugin functionality
    this.performSpecialAction(value, target);
});
```

This registers a command called "DoSomething" for the plugin "MyPlugin". When called from an event, the function will be executed with the provided arguments.

### Command Arguments

Plugin commands can define structured arguments for better organization and validation:

```javascript
/*:
 * @command ChangeStatus
 * @text Change Status
 * @desc Modify a character's status effects.
 *
 * @arg actorId
 * @text Actor ID
 * @desc The ID of the actor to modify.
 * @type actor
 * @default 1
 *
 * @arg statusId
 * @text Status ID
 * @desc The ID of the status effect to apply.
 * @type state
 * @default 1
 *
 * @arg operation
 * @text Operation
 * @desc What to do with the status.
 * @type select
 * @option Add Status
 * @value add
 * @option Remove Status
 * @value remove
 * @default add
 */
```

These argument definitions appear in the event editor's plugin command interface, making it easier for users to input the correct values.

## Plugin Command Implementation

### Command Registration in Plugin Code

Here's an example of how to register and implement plugin commands in a full plugin context:

```javascript
//=============================================================================
// StatusEffectPlugin.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc Provides enhanced status effect management.
 * @author Plugin Developer
 * 
 * @command ChangeStatus
 * @text Change Status
 * @desc Modify a character's status effects.
 *
 * @arg actorId
 * @text Actor ID
 * @desc The ID of the actor to modify.
 * @type actor
 * @default 1
 *
 * @arg statusId
 * @text Status ID
 * @desc The ID of the status effect to apply.
 * @type state
 * @default 1
 *
 * @arg operation
 * @text Operation
 * @desc What to do with the status.
 * @type select
 * @option Add Status
 * @value add
 * @option Remove Status
 * @value remove
 * @default add
 *
 * @command BatchStatus
 * @text Batch Status Change
 * @desc Change status for multiple actors at once.
 *
 * @arg actorIds
 * @text Actor IDs
 * @desc The IDs of the actors to modify.
 * @type actor[]
 * @default [1]
 *
 * @arg statusId
 * @text Status ID
 * @desc The ID of the status effect to apply.
 * @type state
 * @default 1
 *
 * @arg operation
 * @text Operation
 * @desc What to do with the status.
 * @type select
 * @option Add Status
 * @value add
 * @option Remove Status
 * @value remove
 * @default add
 */

(function() {
    // Register command to change status for a single actor
    PluginManager.registerCommand("StatusEffectPlugin", "ChangeStatus", function(args) {
        const actorId = Number(args.actorId);
        const statusId = Number(args.statusId);
        const operation = String(args.operation);
        
        // Get the actor
        const actor = $gameActors.actor(actorId);
        if (!actor) return;
        
        // Apply the status effect
        if (operation === "add") {
            actor.addState(statusId);
        } else if (operation === "remove") {
            actor.removeState(statusId);
        }
    });
    
    // Register command to change status for multiple actors
    PluginManager.registerCommand("StatusEffectPlugin", "BatchStatus", function(args) {
        const actorIds = JSON.parse(args.actorIds);
        const statusId = Number(args.statusId);
        const operation = String(args.operation);
        
        // Process each actor
        for (const actorId of actorIds) {
            const actor = $gameActors.actor(Number(actorId));
            if (!actor) continue;
            
            // Apply the status effect
            if (operation === "add") {
                actor.addState(statusId);
            } else if (operation === "remove") {
                actor.removeState(statusId);
            }
        }
    });
})();
```

### Accessing Arguments

The plugin command system automatically converts and passes arguments to your handler function. These arguments are parsed from the event command's parameters:

```javascript
// Game_Interpreter command for plugin commands (Code 357)
Game_Interpreter.prototype.command357 = function(params) {
    const pluginName = params[0];
    const commandName = params[1];
    
    // Handle MV-style plugin commands (backwards compatibility)
    if (this.shouldConvertNameMV(pluginName, commandName)) {
        const command = { code: 357, indent: this._indent, parameters: params };
        const mvCommand = this.convertNameMV(command);
        return this.pluginCommand(mvCommand.parameters[0], mvCommand.parameters.slice(1));
    }
    
    // Execute the registered plugin command
    const key = pluginName + ":" + commandName;
    const func = PluginManager._commands[key];
    if (typeof func === "function") {
        func.bind(this)(PluginManager.convertAllParamsMZ(params[3]));
        return true;
    }
    
    return true;
};
```

## Event Integration

### Event Context in Plugin Commands

Plugin commands run in the context of the `Game_Interpreter` that executes them, giving access to various event-related methods:

```javascript
PluginManager.registerCommand("MapPlugin", "ModifyEvent", function(args) {
    const eventId = Number(args.eventId) || this.eventId(); // Get calling event ID if not specified
    const x = Number(args.x);
    const y = Number(args.y);
    
    // Access the event
    const event = eventId > 0 ? $gameMap.event(eventId) : null;
    if (!event) return;
    
    // Modify the event
    event.setPosition(x, y);
    
    // Wait for movement to complete (uses Game_Interpreter context)
    this.setWaitMode("route");
});
```

### Integration with Event Interpreter

Plugins can directly extend the `Game_Interpreter` class to add new command handlers or modify existing ones:

```javascript
// Add custom event command handling by extending Game_Interpreter
(function() {
    // Alias the command400 method (Branch End processing)
    const _Game_Interpreter_command400 = Game_Interpreter.prototype.command400;
    
    // Override with custom functionality
    Game_Interpreter.prototype.command400 = function() {
        // Add custom logging
        console.log("Branch ended at indent level: " + this._indent);
        
        // Call original method
        return _Game_Interpreter_command400.call(this);
    };
    
    // Add a new custom command
    Game_Interpreter.prototype.commandCustom = function(params) {
        // Process custom command
        // ...
        return true;
    };
})();
```

## Advanced Plugin Command Techniques

### Asynchronous Plugin Commands

For operations that take time, like animations or complex processing, you can make the interpreter wait:

```javascript
// Asynchronous plugin command with wait
PluginManager.registerCommand("AnimationPlugin", "ShowSpecialAnimation", function(args) {
    const targetId = Number(args.targetId);
    const animationId = Number(args.animationId);
    
    // Get the target
    let target = null;
    if (args.targetType === "event") {
        target = $gameMap.event(targetId);
    } else if (args.targetType === "player") {
        target = $gamePlayer;
    }
    
    if (!target) return;
    
    // Start animation
    target.requestAnimation(animationId);
    
    // Set wait mode so the interpreter pauses until animation completes
    this._waitMode = "animation";
    this._waitingAnimation = targetId;
    
    // This is important to return false for asynchronous processing
    return false;
});

// Update the interpreter to handle our custom wait mode
(function() {
    // Alias the updateWaitMode method
    const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    
    // Override with custom handling
    Game_Interpreter.prototype.updateWaitMode = function() {
        // Handle custom animation wait mode
        if (this._waitMode === "animation" && this._waitingAnimation > 0) {
            const target = this._waitingAnimation === -1 ? 
                $gamePlayer : $gameMap.event(this._waitingAnimation);
                
            // Check if animation is complete
            if (!target || !target.isAnimationPlaying()) {
                this._waitMode = "";
                this._waitingAnimation = 0;
                return false;
            }
            return true;
        }
        
        // Call original method for other wait modes
        return _Game_Interpreter_updateWaitMode.call(this);
    };
})();
```

### Nested Plugin Commands

You can implement commands that call other commands for complex operations:

```javascript
// Main command that calls other commands
PluginManager.registerCommand("BattlePlugin", "StartSpecialBattle", function(args) {
    const troopId = Number(args.troopId);
    const canEscape = args.canEscape === "true";
    const specialRules = JSON.parse(args.specialRules);
    
    // Setup pre-battle effects
    this.command117([1]); // Common Event for pre-battle setup
    
    // Apply special rules
    for (const rule of specialRules) {
        // Call another plugin command internally
        const ruleArgs = {
            ruleType: rule.type,
            ruleValue: rule.value
        };
        
        // Get the function directly and call it
        const applyRuleFunc = PluginManager._commands["BattlePlugin:ApplyRule"];
        if (typeof applyRuleFunc === "function") {
            applyRuleFunc.bind(this)(ruleArgs);
        }
    }
    
    // Start the battle
    this.command301([0, troopId, canEscape, false]); // Battle Processing command
    
    // Return false to wait for battle completion
    return false;
});

// Rule application command (can be called directly or by other commands)
PluginManager.registerCommand("BattlePlugin", "ApplyRule", function(args) {
    const ruleType = String(args.ruleType);
    const ruleValue = String(args.ruleValue);
    
    // Apply the rule to the upcoming battle
    $gameSystem.setBattleRule(ruleType, ruleValue);
    
    return true;
});
```

## Custom Event Command Creation

Some plugins go beyond plugin commands to implement entirely new event command types:

```javascript
// Add custom event command processing
(function() {
    // Command code for our custom command
    const CUSTOM_COMMAND_CODE = 357; // Use plugin command code for custom handling
    
    // Store original command357 method
    const _Game_Interpreter_command357 = Game_Interpreter.prototype.command357;
    
    // Override command357 to handle our custom command
    Game_Interpreter.prototype.command357 = function(params) {
        // Check if this is our custom command
        if (params[0] === "CUSTOM" && params[1] === "MySpecialCommand") {
            return this.processMySpecialCommand(params[3]);
        }
        
        // Otherwise, use default plugin command processing
        return _Game_Interpreter_command357.call(this, params);
    };
    
    // Implement our custom command
    Game_Interpreter.prototype.processMySpecialCommand = function(params) {
        // Process the command...
        console.log("Executing special command with params:", params);
        
        // Return true to continue interpreter, false to wait
        return true;
    };
})();
```

## Plugin Event Handlers

Beyond commands, plugins often need to respond to various event-driven actions in the game:

```javascript
// Add event handlers for game events
(function() {
    // Alias Game_Event initialize
    const _Game_Event_initialize = Game_Event.prototype.initialize;
    
    // Extended initialize with custom tracking
    Game_Event.prototype.initialize = function(mapId, eventId) {
        // Call original method
        _Game_Event_initialize.call(this, mapId, eventId);
        
        // Register this event for custom tracking
        if (this.event().note.includes("<CustomTracking>")) {
            if (!$gameSystem._trackedEvents) {
                $gameSystem._trackedEvents = [];
            }
            $gameSystem._trackedEvents.push({
                mapId: mapId,
                eventId: eventId
            });
        }
    };
    
    // Handle map transfer events
    const _Game_Player_performTransfer = Game_Player.prototype.performTransfer;
    
    Game_Player.prototype.performTransfer = function() {
        // Track old map
        const oldMapId = $gameMap.mapId();
        
        // Call original transfer method
        _Game_Player_performTransfer.call(this);
        
        // Check if map changed
        if (oldMapId !== $gameMap.mapId()) {
            // Fire custom "mapChanged" handlers
            if (window.CustomEventSystem && typeof window.CustomEventSystem.onMapChanged === "function") {
                window.CustomEventSystem.onMapChanged(oldMapId, $gameMap.mapId());
            }
        }
    };
})();

// Define custom event system
window.CustomEventSystem = {
    // Event handlers
    _eventHandlers: {},
    
    // Register an event handler
    on: function(eventName, handler) {
        if (!this._eventHandlers[eventName]) {
            this._eventHandlers[eventName] = [];
        }
        this._eventHandlers[eventName].push(handler);
    },
    
    // Trigger an event
    trigger: function(eventName, ...args) {
        if (this._eventHandlers[eventName]) {
            for (const handler of this._eventHandlers[eventName]) {
                handler(...args);
            }
        }
    },
    
    // Map change handler (called from aliased function above)
    onMapChanged: function(oldMapId, newMapId) {
        this.trigger("mapChanged", oldMapId, newMapId);
    }
};

// Usage in another plugin
(function() {
    // Register event handlers
    CustomEventSystem.on("mapChanged", function(oldMapId, newMapId) {
        console.log(`Map changed from ${oldMapId} to ${newMapId}`);
        
        // Do something when map changes
        if (newMapId === 5) {
            // Special processing for map 5
            $gameScreen.startTint([0, 0, 0, 0], 60);
        }
    });
})();
```

## Event Interpreter Hooks

Advanced plugins may add hooks to the event interpreter update cycle:

```javascript
// Add hooks to the interpreter update cycle
(function() {
    // Store original methods
    const _Game_Interpreter_initialize = Game_Interpreter.prototype.initialize;
    const _Game_Interpreter_update = Game_Interpreter.prototype.update;
    const _Game_Interpreter_executeCommand = Game_Interpreter.prototype.executeCommand;
    
    // Hook into initialization
    Game_Interpreter.prototype.initialize = function(depth) {
        _Game_Interpreter_initialize.call(this, depth);
        this._preCommandHooks = [];
        this._postCommandHooks = [];
    };
    
    // Hook into update cycle
    Game_Interpreter.prototype.update = function() {
        // Call original update
        _Game_Interpreter_update.call(this);
        
        // Run post-update hooks if we're the root interpreter
        if (this._depth === 0 && this.isRunning()) {
            this._runPostUpdateHooks();
        }
    };
    
    // Hook into command execution
    Game_Interpreter.prototype.executeCommand = function() {
        // Run pre-command hooks
        this._runPreCommandHooks();
        
        // Execute the command
        const result = _Game_Interpreter_executeCommand.call(this);
        
        // Run post-command hooks
        this._runPostCommandHooks();
        
        return result;
    };
    
    // Add hook methods
    Game_Interpreter.prototype.addPreCommandHook = function(hookFunction) {
        this._preCommandHooks.push(hookFunction);
    };
    
    Game_Interpreter.prototype.addPostCommandHook = function(hookFunction) {
        this._postCommandHooks.push(hookFunction);
    };
    
    // Run hooks
    Game_Interpreter.prototype._runPreCommandHooks = function() {
        for (const hook of this._preCommandHooks) {
            hook.call(this);
        }
    };
    
    Game_Interpreter.prototype._runPostCommandHooks = function() {
        for (const hook of this._postCommandHooks) {
            hook.call(this);
        }
    };
    
    Game_Interpreter.prototype._runPostUpdateHooks = function() {
        // Custom logic that runs after each update
    };
})();

// Usage in a plugin
PluginManager.registerCommand("DebugPlugin", "StartDebugging", function(args) {
    // Add a command tracer to the interpreter
    this.addPreCommandHook(function() {
        if (this._list && this._list[this._index]) {
            console.log("About to execute command:", this._list[this._index]);
        }
    });
    
    // Add a post-command hook
    this.addPostCommandHook(function() {
        console.log("Command executed. Next index:", this._index);
    });
});
```

## Plugin Event Metadata

Using event note tags and metadata to control plugin behavior:

```javascript
// Process event note tags for plugin functionality
(function() {
    // Alias map setup to scan events
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    
    Game_Map.prototype.setupEvents = function() {
        // Call original setup
        _Game_Map_setupEvents.call(this);
        
        // Process event metadata for plugin features
        for (const event of this._events) {
            if (event) {
                processEventMetadata(event);
            }
        }
    };
    
    // Process event metadata
    function processEventMetadata(event) {
        const note = event.event().note || "";
        
        // Extract metadata using regular expressions
        const metadataRegex = /<CustomBehavior:(.+?)>/i;
        const match = note.match(metadataRegex);
        
        if (match) {
            const behaviorType = match[1].trim();
            
            // Apply custom behavior based on metadata
            switch (behaviorType) {
                case "Follower":
                    applyFollowerBehavior(event);
                    break;
                case "Patroller":
                    applyPatrollerBehavior(event);
                    break;
                case "Interactive":
                    applyInteractiveBehavior(event);
                    break;
            }
        }
    }
    
    // Apply different behaviors
    function applyFollowerBehavior(event) {
        // Modify event to follow player
        const _update = event.update;
        
        event.update = function() {
            _update.call(this);
            
            // Only move when player has moved
            if ($gamePlayer.isMoving() && !this.isMoving()) {
                // Follow with a delay
                const playerX = $gamePlayer._x;
                const playerY = $gamePlayer._y;
                
                // Calculate direction to move
                const deltaX = playerX - this._x;
                const deltaY = playerY - this._y;
                
                // Only move if within follow distance
                const distance = Math.abs(deltaX) + Math.abs(deltaY);
                if (distance <= 5 && distance > 1) {
                    this.moveTowardCharacter($gamePlayer);
                }
            }
        };
    }
    
    function applyPatrollerBehavior(event) {
        // Set up a patrol route
        const _update = event.update;
        
        event.update = function() {
            _update.call(this);
            
            // Only move when not already moving and not interacting
            if (!this.isMoving() && !this.isStarting()) {
                // Pick a random direction if no specific route
                this.moveStraight(2 + Math.randomInt(4) * 2);
            }
        };
    }
    
    function applyInteractiveBehavior(event) {
        // Make event turn toward player when nearby
        const _update = event.update;
        
        event.update = function() {
            _update.call(this);
            
            // Turn toward player when nearby
            const playerX = $gamePlayer._x;
            const playerY = $gamePlayer._y;
            const distance = Math.abs(playerX - this._x) + Math.abs(playerY - this._y);
            
            if (distance === 1) {
                this.turnTowardCharacter($gamePlayer);
            }
        };
    }
})();
```

## Custom Command Parameter Windows

Some plugins create custom parameter windows for plugin commands in the editor:

```javascript
// Example of plugin with custom parameter UI (conceptual example)
/*:
 * @command ShowCustomDialog
 * @text Show Custom Dialog
 * @desc Shows a custom dialog with advanced options.
 * 
 * @arg dialogSettings
 * @text Dialog Settings
 * @type struct<DialogSettings>
 * @default {"text":"Hello World","portrait":"Actor1","portraitIndex":"0"}
 * 
 * @arg dialogChoices
 * @text Dialog Choices
 * @type struct<DialogChoice>[]
 * @default ["{\"text\":\"Yes\",\"value\":\"yes\"}","{\"text\":\"No\",\"value\":\"no\"}"]
 */

/*~struct~DialogSettings:
 * @param text
 * @text Dialog Text
 * @type text
 * @default Hello World
 * 
 * @param portrait
 * @text Portrait Image
 * @type file
 * @dir img/faces
 * @default Actor1
 * 
 * @param portraitIndex
 * @text Portrait Index
 * @type number
 * @min 0
 * @max 7
 * @default 0
 */

/*~struct~DialogChoice:
 * @param text
 * @text Choice Text
 * @type text
 * @default Option 1
 * 
 * @param value
 * @text Choice Value
 * @type text
 * @default option1
 * 
 * @param condition
 * @text Show Condition
 * @type text
 * @default true
 */

// Plugin implementation
(function() {
    // Register the command
    PluginManager.registerCommand("CustomDialogPlugin", "ShowCustomDialog", function(args) {
        // Parse command arguments
        const dialogSettings = JSON.parse(args.dialogSettings);
        const dialogChoices = JSON.parse(args.dialogChoices).map(choice => JSON.parse(choice));
        
        // Show dialog with the specified settings
        showCustomDialog(dialogSettings, dialogChoices);
        
        // Return false to wait for dialog completion
        return false;
    });
    
    // Show dialog implementation
    function showCustomDialog(settings, choices) {
        // Create custom dialog window
        const dialog = new Window_CustomDialog(settings, choices);
        
        // Add to scene
        SceneManager._scene.addWindow(dialog);
        
        // Set up dialog completion handling
        dialog.setHandler('ok', () => {
            // Get selected choice
            const selectedValue = dialog.currentValue();
            
            // Store in game variables
            $gameVariables.setValue(1, selectedValue);
            
            // Close dialog and continue interpreter
            dialog.close();
            dialog.hide();
            
            // Resume event processing
            setTimeout(() => {
                SceneManager._scene.removeWindow(dialog);
                $gameMap._interpreter._waitMode = '';
            }, 100);
        });
        
        // Show dialog
        dialog.open();
        dialog.show();
        dialog.activate();
        
        // Set interpreter to wait mode
        $gameMap._interpreter._waitMode = 'customDialog';
    }
})();
```

## Event Queue Management

Advanced plugins may implement event queuing systems:

```javascript
// Event queue system for plugin events
const EventQueueSystem = {
    // Event queue
    _queue: [],
    
    // Current event being processed
    _currentEvent: null,
    
    // Add event to queue
    enqueue: function(eventData) {
        this._queue.push(eventData);
    },
    
    // Process next event in queue
    processNext: function() {
        if (this._currentEvent) {
            return false; // Still processing an event
        }
        
        if (this._queue.length === 0) {
            return false; // Nothing to process
        }
        
        // Get next event
        this._currentEvent = this._queue.shift();
        
        // Process based on event type
        switch (this._currentEvent.type) {
            case "message":
                this.showMessage(this._currentEvent);
                break;
            case "animation":
                this.showAnimation(this._currentEvent);
                break;
            case "transfer":
                this.performTransfer(this._currentEvent);
                break;
            default:
                // Unknown event type, just clear it
                this._currentEvent = null;
                this.processNext();
                break;
        }
        
        return true;
    },
    
    // Update the event system
    update: function() {
        // Check if current event is complete
        if (this._currentEvent) {
            const complete = this.checkEventComplete();
            if (complete) {
                this._currentEvent = null;
                // Process next event in queue
                this.processNext();
            }
        } else {
            // Try to process next event
            this.processNext();
        }
    },
    
    // Check if current event is complete
    checkEventComplete: function() {
        if (!this._currentEvent) {
            return true;
        }
        
        switch (this._currentEvent.type) {
            case "message":
                return !$gameMessage.isBusy();
            case "animation":
                const target = this.getTargetCharacter(this._currentEvent.targetId);
                return !target || !target.isAnimationPlaying();
            case "transfer":
                return !$gamePlayer.isTransferring();
            default:
                return true;
        }
    },
    
    // Show message
    showMessage: function(eventData) {
        $gameMessage.setFaceImage(eventData.face, eventData.faceIndex);
        $gameMessage.setBackground(eventData.background || 0);
        $gameMessage.setPositionType(eventData.position || 2);
        $gameMessage.add(eventData.text);
    },
    
    // Show animation
    showAnimation: function(eventData) {
        const target = this.getTargetCharacter(eventData.targetId);
        if (target) {
            target.requestAnimation(eventData.animationId);
        } else {
            // No valid target, mark as complete
            this._currentEvent = null;
        }
    },
    
    // Perform transfer
    performTransfer: function(eventData) {
        $gamePlayer.reserveTransfer(
            eventData.mapId,
            eventData.x,
            eventData.y,
            eventData.direction || 0,
            eventData.fadeType || 0
        );
    },
    
    // Get character by ID
    getTargetCharacter: function(targetId) {
        if (targetId === -1) {
            return $gamePlayer;
        } else if (targetId === 0) {
            return this._eventSubject; // Custom tracking for subject
        } else {
            return $gameMap.event(targetId);
        }
    }
};

// Add update hook to Scene_Map
(function() {
    // Alias Scene_Map update method
    const _Scene_Map_update = Scene_Map.prototype.update;
    
    Scene_Map.prototype.update = function() {
        // Call original update
        _Scene_Map_update.call(this);
        
        // Update event queue
        EventQueueSystem.update();
    };
})();

// Register plugin command to queue events
PluginManager.registerCommand("EventQueuePlugin", "QueueEvent", function(args) {
    const eventType = args.eventType;
    
    // Create event data based on type
    let eventData = {
        type: eventType
    };
    
    // Add type-specific properties
    switch (eventType) {
        case "message":
            eventData.face = args.face || "";
            eventData.faceIndex = Number(args.faceIndex || 0);
            eventData.background = Number(args.background || 0);
            eventData.position = Number(args.position || 2);
            eventData.text = args.text || "";
            break;
        case "animation":
            eventData.targetId = Number(args.targetId || -1);
            eventData.animationId = Number(args.animationId || 1);
            break;
        case "transfer":
            eventData.mapId = Number(args.mapId || 0);
            eventData.x = Number(args.x || 0);
            eventData.y = Number(args.y || 0);
            eventData.direction = Number(args.direction || 0);
            eventData.fadeType = Number(args.fadeType || 0);
            break;
    }
    
    // Add to queue
    EventQueueSystem.enqueue(eventData);
    
    // Continue interpreter
    return true;
});
```