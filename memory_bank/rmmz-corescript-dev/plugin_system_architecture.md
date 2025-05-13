# RPG Maker MZ - Plugin System Architecture

This document details the plugin system architecture in RPG Maker MZ, explaining how the plugin manager works internally, the hook system, and how plugins can interface with and modify core engine behavior.

## Core Components

### PluginManager
- Located in `rmmz_managers/PluginManager.js`
- Responsible for loading, initializing, and managing plugins
- Handles plugin parameters and command registration
- Provides the interface between plugins and core engine functions

### Plugin Parameter System
- Allows plugins to define and access configuration values
- Provides JSON-based parameter definition and validation
- Supports complex parameter types including structures and arrays

### Plugin Command System
- Enables plugins to register commands accessible from the event editor
- Provides parameter handling for plugin commands
- Connects event commands to plugin functionality

## Plugin Manager Implementation

### Plugin Loading System
```javascript
// Plugin Manager initialization
PluginManager.setup = function(plugins) {
    this._scripts = [];
    this._errorUrls = [];
    this._parameters = {};
    this._commands = {};
    
    // Process plugin entries
    for (const plugin of plugins) {
        if (plugin.status && plugin.name) {
            this.setParameters(plugin.name, plugin.parameters);
            this.loadScript(plugin.name);
        }
    }
    
    // Check for plugin dependencies
    this.checkRpgMakerVersion();
};

// Load plugin script file
PluginManager.loadScript = function(filename) {
    const url = this.makeUrl(filename);
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    script.async = false;
    script.defer = true;
    script.onerror = this.onError.bind(this);
    script._url = url;
    this._scripts.push(script);
    
    // Add script to document to start loading
    document.body.appendChild(script);
};

// Generate plugin URL
PluginManager.makeUrl = function(filename) {
    return "js/plugins/" + Utils.encodeURI(filename) + ".js";
};
```

### Parameter Management
```javascript
// Set parameters for a plugin
PluginManager.setParameters = function(name, parameters) {
    this._parameters[name.toLowerCase()] = parameters;
};

// Get parameters for a plugin
PluginManager.parameters = function(name) {
    return this._parameters[name.toLowerCase()] || {};
};

// Process and convert parameter values from string format
PluginManager.parseParameters = function(params) {
    const result = {};
    for (const name in params) {
        result[name] = JSON.parse(params[name]);
    }
    return result;
};

// Create parameter structure for complex parameters
PluginManager.createParameter = function(pluginName, paramName, defaultValue) {
    const paramValue = this.parameters(pluginName)[paramName];
    return paramValue !== undefined ? JSON.parse(paramValue) : defaultValue;
};
```

### Plugin Command System
```javascript
// Register a plugin command
PluginManager.registerCommand = function(pluginName, commandName, func) {
    const key = pluginName + ":" + commandName;
    this._commands[key] = func;
};

// Call a plugin command from event
PluginManager.callCommand = function(self, pluginName, commandName, args) {
    const key = pluginName + ":" + commandName;
    const func = this._commands[key];
    if (typeof func === "function") {
        func.bind(self)(args);
    }
};

// Process plugin commands from event interpreter
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    // Legacy plugin command support (MV style)
    const pluginName = command;
    PluginManager.callCommand(this, pluginName, args[0], args.slice(1));
};
```

## Plugin Parameter Structure

### Parameter JSON Format
```javascript
// Example plugin parameter structure
/*:
 * @target MZ
 * @plugindesc Example plugin with parameters.
 * @author RPG Maker MZ Developer
 * 
 * @param Number Parameter
 * @desc A simple number parameter
 * @type number
 * @min 0
 * @max 100
 * @default 50
 * 
 * @param String Parameter
 * @desc A simple string parameter
 * @type string
 * @default Hello World
 * 
 * @param Boolean Parameter
 * @desc A simple boolean parameter
 * @type boolean
 * @on Enable
 * @off Disable
 * @default true
 * 
 * @param Select Parameter
 * @desc A dropdown selection parameter
 * @type select
 * @option Option 1
 * @value 1
 * @option Option 2
 * @value 2
 * @default 1
 * 
 * @param Complex Parameter
 * @desc A complex parameter with nested structure
 * @type struct<ComplexType>
 * @default {"name":"Default","value":10}
 * 
 * @param Array Parameter
 * @desc An array of complex parameters
 * @type struct<ComplexType>[]
 * @default [{"name":"Item 1","value":10},{"name":"Item 2","value":20}]
 * 
 * @help
 * This is help text for the plugin.
 */

/*~struct~ComplexType:
 * @param name
 * @desc The name of the item
 * @type string
 * @default Name
 * 
 * @param value
 * @desc The value of the item
 * @type number
 * @default 0
 */
```

### Parameter Access
```javascript
// Access parameters from a plugin
const parameters = PluginManager.parameters('MyPlugin');
const numberParam = Number(parameters['Number Parameter'] || 50);
const stringParam = String(parameters['String Parameter'] || 'Hello World');
const boolParam = parameters['Boolean Parameter'] === 'true';

// Access complex parameters
const complexParam = JSON.parse(parameters['Complex Parameter'] || '{}');
const nameValue = complexParam.name;
const numValue = Number(complexParam.value);

// Access array parameters
const arrayParam = JSON.parse(parameters['Array Parameter'] || '[]');
for (const item of arrayParam) {
    const parsedItem = JSON.parse(item);
    console.log(parsedItem.name, Number(parsedItem.value));
}
```

## Plugin Command System

### Command Registration
```javascript
// Register plugin commands (MZ style)
PluginManager.registerCommand("MyPlugin", "CommandName", function(args) {
    // Parse arguments
    const arg1 = args.firstParameter;
    const arg2 = args.secondParameter;
    
    // Execute command logic
    this.doSomethingWithArguments(arg1, arg2);
});

// Register multiple commands example
PluginManager.registerCommand("MyPlugin", "CommandOne", function(args) {
    // Command one implementation
});

PluginManager.registerCommand("MyPlugin", "CommandTwo", function(args) {
    // Command two implementation
});
```

### Command JSON Format
```javascript
// Example plugin command structure
/*:
 * @target MZ
 * @plugindesc Plugin with custom commands.
 * @author RPG Maker MZ Developer
 * 
 * @command CommandName
 * @desc This is a description of the command.
 * @arg firstParameter
 * @desc Description of first parameter
 * @type number
 * @default 1
 * 
 * @arg secondParameter
 * @desc Description of second parameter
 * @type string
 * @default Text
 * 
 * @command AnotherCommand
 * @desc This is another command.
 * @arg targetId
 * @desc Target ID
 * @type actor
 * 
 * @arg effectType
 * @desc Effect type
 * @type select
 * @option Heal
 * @value heal
 * @option Damage
 * @value damage
 * @default heal
 * 
 * @help
 * This is help text for the plugin commands.
 */
```

### Command Execution
```javascript
// Define plugin command in MZ format
PluginManager.registerCommand("MyPlugin", "HealActor", function(args) {
    // Parse arguments
    const actorId = Number(args.actorId);
    const healAmount = Number(args.amount);
    
    // Execute command logic
    const actor = $gameActors.actor(actorId);
    if (actor) {
        actor.gainHp(healAmount);
        if (Imported.YEP_BattleEngineCore) {
            actor.startDamagePopup();
        }
    }
});

// Example of a complex command with conditional logic
PluginManager.registerCommand("MyPlugin", "ApplyEffect", function(args) {
    const targetId = Number(args.targetId);
    const effectType = String(args.effectType);
    const power = Number(args.power || 0);
    
    let target = null;
    switch (args.targetType) {
        case "actor":
            target = $gameActors.actor(targetId);
            break;
        case "enemy":
            target = $gameTroop.members()[targetId];
            break;
        case "party":
            target = $gameParty.members()[targetId];
            break;
    }
    
    if (target) {
        switch (effectType) {
            case "heal":
                target.gainHp(power);
                break;
            case "damage":
                target.gainHp(-power);
                break;
            case "buff":
                target.addBuff(args.statId, args.turns);
                break;
        }
        
        // Refresh targets if in battle
        if ($gameParty.inBattle()) {
            if (target.isActor()) {
                $gamePlayer.requestAnimation(args.animationId);
            } else {
                target.requestAnimation(args.animationId);
            }
        }
    }
});
```

## Plugin Hooks and Integration

### Method Overriding
```javascript
// Basic method override example
const _Game_Actor_setup = Game_Actor.prototype.setup;
Game_Actor.prototype.setup = function(actorId) {
    // Call original method
    _Game_Actor_setup.call(this, actorId);
    
    // Add custom logic
    this.initCustomParameters();
};

// Override methods with conditional logic
const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    // Call original method
    _Scene_Map_update.call(this);
    
    // Add plugin-specific logic
    if (this.isPluginConditionMet()) {
        this.updatePluginFeatures();
    }
};
```

### Extending Classes
```javascript
// Extend classes with new methods
Game_Actor.prototype.initCustomParameters = function() {
    this._customParam1 = 0;
    this._customParam2 = 100;
};

Game_Actor.prototype.customParam1 = function() {
    return this._customParam1;
};

Game_Actor.prototype.setCustomParam1 = function(value) {
    this._customParam1 = value;
};

// Adding new properties to prototypes
Object.defineProperty(Game_Actor.prototype, "customParam2", {
    get: function() {
        return this._customParam2;
    },
    set: function(value) {
        this._customParam2 = value;
    },
    configurable: true
});
```

### Injecting New Code
```javascript
// Insert code at specific points (aliasing pattern)
const _BattleManager_startAction = BattleManager.startAction;
BattleManager.startAction = function() {
    // Before original method
    this.onCustomActionStart();
    
    // Original method
    _BattleManager_startAction.call(this);
    
    // After original method
    this.onCustomActionEnd();
};

// Create custom hooks
BattleManager.onCustomActionStart = function() {
    // Call plugin-specific pre-action events
    this._actionPreHooks.forEach(hook => hook());
};

BattleManager.onCustomActionEnd = function() {
    // Call plugin-specific post-action events
    this._actionPostHooks.forEach(hook => hook());
};

// Register new hook points
BattleManager.registerPreActionHook = function(func) {
    if (!this._actionPreHooks) {
        this._actionPreHooks = [];
    }
    this._actionPreHooks.push(func);
};
```

## Plugin Communication and Coordination

### Plugin Registration
```javascript
// Plugin registration and versioning
var Imported = Imported || {};
Imported.MyPlugin = true;
Imported.MyPlugin_Version = "1.0.0";

// Plugin namespace to avoid conflicts
var MyPlugin = MyPlugin || {};
MyPlugin.Parameters = PluginManager.parameters('MyPlugin');
MyPlugin.Settings = {};
MyPlugin.Settings.Option1 = Number(MyPlugin.Parameters['Option1']);
```

### Cross-Plugin Communication
```javascript
// Plugin dependencies check
if (Imported.RequiredPlugin) {
    // Integration with another plugin
    const requiredVersion = "1.2.0";
    if (MyPlugin.versionAtLeast(Imported.RequiredPlugin_Version, requiredVersion)) {
        // Compatible version, proceed with integration
        MyPlugin.integrationEnabled = true;
    } else {
        console.warn("MyPlugin requires RequiredPlugin v" + requiredVersion + " or later.");
        MyPlugin.integrationEnabled = false;
    }
}

// Version comparison helper
MyPlugin.versionAtLeast = function(currentVersion, requiredVersion) {
    const current = currentVersion.split('.').map(Number);
    const required = requiredVersion.split('.').map(Number);
    
    for (let i = 0; i < required.length; i++) {
        if (current[i] === undefined) return false;
        if (current[i] > required[i]) return true;
        if (current[i] < required[i]) return false;
    }
    
    return true;
};

// Plugin interface for other plugins
MyPlugin.API = {};
MyPlugin.API.doSomething = function(param) {
    // Functionality that other plugins can use
    return MyPlugin.internalFunction(param);
};

// Using another plugin's API
if (Imported.OtherPlugin && OtherPlugin.API) {
    const result = OtherPlugin.API.someFunction("parameter");
    MyPlugin.processResult(result);
}
```

### Plugin Load Order Management
```javascript
// Check if this plugin should load after another one
if (!Imported.CorePlugin) {
    throw new Error("MyPlugin requires CorePlugin to be installed and loaded first");
}

// Plugin initialization based on prerequisites
document.addEventListener("DOMContentLoaded", function() {
    if (MyPlugin.allPrerequisitesMet()) {
        MyPlugin.initialize();
    } else {
        console.error("MyPlugin could not initialize due to missing prerequisites");
    }
});

// Late initialization hook
const _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!_DataManager_isDatabaseLoaded.call(this)) return false;
    
    // Database is loaded, now initialize plugin
    if (!MyPlugin._initialized) {
        MyPlugin.onDatabaseLoaded();
        MyPlugin._initialized = true;
    }
    
    return true;
};
```

## Plugin Configuration UI

### Plugin Options Integration
```javascript
// Add plugin options to the game's options menu
const _Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
Window_Options.prototype.makeCommandList = function() {
    _Window_Options_makeCommandList.call(this);
    
    // Add custom options
    this.addCommand("My Plugin Option 1", "myPluginOption1");
    this.addCommand("My Plugin Option 2", "myPluginOption2");
};

// Process custom options
const _ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function() {
    const config = _ConfigManager_makeData.call(this);
    config.myPluginOption1 = this.myPluginOption1;
    config.myPluginOption2 = this.myPluginOption2;
    return config;
};

// Apply custom options
const _ConfigManager_applyData = ConfigManager.applyData;
ConfigManager.applyData = function(config) {
    _ConfigManager_applyData.call(this, config);
    this.myPluginOption1 = this.readFlag(config, "myPluginOption1", true);
    this.myPluginOption2 = this.readFlag(config, "myPluginOption2", false);
};

// Initialize default values
const _ConfigManager_defaultConfig = ConfigManager.defaultConfig;
ConfigManager.defaultConfig = function() {
    return {
        ...(_ConfigManager_defaultConfig.call(this) || {}),
        myPluginOption1: true,
        myPluginOption2: false
    };
};
```

### Custom Plugin Controls
```javascript
// Create custom scene for plugin configuration
function Scene_PluginConfig() {
    this.initialize.apply(this, arguments);
}

Scene_PluginConfig.prototype = Object.create(Scene_MenuBase.prototype);
Scene_PluginConfig.prototype.constructor = Scene_PluginConfig;

Scene_PluginConfig.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_PluginConfig.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createConfigWindow();
};

Scene_PluginConfig.prototype.createConfigWindow = function() {
    const rect = this.configWindowRect();
    this._configWindow = new Window_PluginConfig(rect);
    this._configWindow.setHandler("cancel", this.popScene.bind(this));
    this._configWindow.setHandler("apply", this.applyConfig.bind(this));
    this.addWindow(this._configWindow);
};

Scene_PluginConfig.prototype.configWindowRect = function() {
    const ww = Graphics.boxWidth;
    const wh = Graphics.boxHeight - this.calcWindowHeight(2, true);
    const wx = 0;
    const wy = this.calcWindowHeight(2, true);
    return new Rectangle(wx, wy, ww, wh);
};

Scene_PluginConfig.prototype.applyConfig = function() {
    MyPlugin.Settings = this._configWindow.getSettings();
    MyPlugin.saveSettings();
    this.popScene();
};
```

## Error Handling and Debugging

### Plugin Error Handling
```javascript
// Safely override methods to prevent cascading errors
MyPlugin.safeOverride = function(object, methodName, newMethod) {
    const oldMethod = object[methodName];
    object[methodName] = function() {
        try {
            return newMethod.apply(this, arguments);
        } catch (e) {
            console.error("Error in MyPlugin override of " + methodName + ":", e);
            // Fall back to original method if override fails
            return oldMethod.apply(this, arguments);
        }
    };
};

// Apply safe override
MyPlugin.safeOverride(Game_Actor.prototype, "setup", function(actorId) {
    // Original functionality
    Game_Battler.prototype.setup.call(this, actorId);
    
    // Custom functionality with error handling
    try {
        this.initCustomParameters();
    } catch (e) {
        console.error("Failed to initialize custom parameters:", e);
    }
    
    // Continue with normal setup
    this._actorId = actorId;
    this._name = $dataActors[actorId].name;
    // ... rest of original method
});
```

### Debug Mode
```javascript
// Plugin debug mode
MyPlugin.isDebugMode = function() {
    return Utils.isOptionValid("test") && 
           (this.Parameters['Debug Mode'] === 'true' ||
            this.Parameters['Debug Mode'] === true);
};

// Debug logging
MyPlugin.debug = function(msg) {
    if (this.isDebugMode()) {
        console.log("[MyPlugin] " + msg);
    }
};

// Monitor performance in debug mode
MyPlugin.startTiming = function(label) {
    if (this.isDebugMode()) {
        console.time("MyPlugin:" + label);
    }
};

MyPlugin.endTiming = function(label) {
    if (this.isDebugMode()) {
        console.timeEnd("MyPlugin:" + label);
    }
};
```

## Plugin Data Persistence

### Saving and Loading Plugin Data
```javascript
// Save plugin data with game save
const _DataManager_makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
    const contents = _DataManager_makeSaveContents.call(this);
    
    // Add plugin data to save contents
    contents.myPlugin = MyPlugin.getSaveData();
    
    return contents;
};

// Load plugin data from save
const _DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    
    // Extract plugin data from save contents
    if (contents.myPlugin) {
        MyPlugin.loadSaveData(contents.myPlugin);
    }
};

// Plugin data management
MyPlugin.getSaveData = function() {
    return {
        version: Imported.MyPlugin_Version,
        playerData: this._playerData,
        customState: this._customState
    };
};

MyPlugin.loadSaveData = function(data) {
    if (data && data.version) {
        this._playerData = data.playerData || {};
        this._customState = data.customState || {};
        
        // Handle version differences if needed
        if (data.version !== Imported.MyPlugin_Version) {
            this._migrateDataFromVersion(data.version);
        }
    } else {
        this.resetData();
    }
};
```

### Global Plugin Settings
```javascript
// Save plugin settings to local storage
MyPlugin.saveSettings = function() {
    const json = JSON.stringify(this.Settings);
    StorageManager.saveObject("myPlugin", this.Settings);
};

// Load plugin settings from local storage
MyPlugin.loadSettings = function() {
    try {
        const settings = StorageManager.loadObject("myPlugin");
        if (settings) {
            this.Settings = {...this.Settings, ...settings};
        }
    } catch (e) {
        console.error("Failed to load MyPlugin settings:", e);
    }
};

// Initialize settings on boot
const _Scene_Boot_start = Scene_Boot.prototype.start;
Scene_Boot.prototype.start = function() {
    _Scene_Boot_start.call(this);
    
    // Load plugin settings
    MyPlugin.loadSettings();
};
```