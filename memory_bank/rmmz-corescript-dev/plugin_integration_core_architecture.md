# RPG Maker MZ - Plugin Integration Core Architecture

This document details the core architecture of the plugin system in RPG Maker MZ, explaining how plugins are loaded, initialized, and integrated with the base engine.

## Plugin System Overview

RPG Maker MZ uses a sophisticated plugin system that allows developers to extend, modify, or replace core functionality without directly altering the base code. The system is built around the `PluginManager` class which handles loading, initializing, and managing plugin execution.

## Plugin File Structure

Plugins are JavaScript files stored in the `/js/plugins/` directory with a `.js` extension. The system also relies on a `plugins.json` file to manage the loading order and parameters.

### Plugin File Format

A standard RPG Maker MZ plugin uses a specific header format to define metadata:

```javascript
//=============================================================================
// PluginName.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc This is a description of the plugin functionality.
 * @author Author Name
 * @url http://author-website.com
 * 
 * @param Parameter Name
 * @text Display Name
 * @desc Description of the parameter
 * @default Default Value
 * @type string
 * 
 * @help
 * This section provides documentation for users on how to use the plugin.
 * It's not processed by the engine but is visible in the plugin manager.
 * 
 * Some plugins include detailed usage instructions here.
 */

(function() {
    // Plugin code goes here
})();
```

## Plugin Registration and Loading

### PluginManager Initialization

The `PluginManager` is initialized early in the boot process:

```javascript
// Main entry point initializes plugin system
window.addEventListener("load", function() {
    // Setup core engine components first
    Graphics.initialize();
    Graphics.setTickHandler(SceneManager.update.bind(SceneManager));
    
    // Initialize plugin system
    PluginManager.setup($plugins);
    
    // Continue with engine initialization
    // ...
});
```

### Plugin Definition Loading

Plugins are loaded from the `plugins.json` file and stored in the global `$plugins` array:

```javascript
// Load plugin definitions from plugins.json
PluginManager.loadPluginData = function() {
    const xhr = new XMLHttpRequest();
    const url = "js/plugins/plugins.json";
    xhr.open("GET", url);
    xhr.overrideMimeType("application/json");
    
    xhr.onload = () => {
        if (xhr.status < 400) {
            window.$plugins = JSON.parse(xhr.responseText);
        }
    };
    
    xhr.onerror = () => {
        window.$plugins = [];
    };
    
    window.$plugins = [];
    xhr.send();
};
```

### Plugin Setup Process

The `setup` function processes the plugin list and loads each enabled plugin:

```javascript
// Setup plugins from the plugins list
PluginManager.setup = function(plugins) {
    for (const plugin of plugins) {
        if (plugin.status && !this._scripts.includes(plugin.name)) {
            this.setParameters(plugin.name, plugin.parameters);
            this.loadScript(plugin.name);
            this._scripts.push(plugin.name);
        }
    }
};

// Load a plugin script
PluginManager.loadScript = function(filename) {
    const url = this._path + filename + ".js";
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    script.async = false;
    script.defer = true;
    script.onerror = this.onError.bind(this);
    script._url = url;
    document.body.appendChild(script);
};
```

### Parameter Management

The `PluginManager` stores plugin parameters and provides methods to access them:

```javascript
// Store plugin parameters
PluginManager.setParameters = function(name, parameters) {
    this._parameters[name.toLowerCase()] = parameters;
};

// Get plugin parameters
PluginManager.parameters = function(name) {
    return this._parameters[name.toLowerCase()] || {};
};
```

## Plugin Command System

RPG Maker MZ introduced a more structured plugin command system that allows plugins to register commands that can be called from events.

### Command Registration

```javascript
// Register a plugin command
PluginManager.registerCommand = function(pluginName, commandName, func) {
    if (typeof func !== "function") {
        return;
    }
    
    const key = pluginName + ":" + commandName;
    this._commands[key] = func;
};

// Example usage in a plugin
PluginManager.registerCommand("MyPlugin", "CommandName", function(args) {
    // Command implementation
    const value = Number(args.value);
    $gameSystem.doSomething(value);
});
```

### Command Execution

When an event calls a plugin command, it's processed through the interpreter:

```javascript
// Game_Interpreter command for plugin commands
Game_Interpreter.prototype.command357 = function(params) {
    const pluginName = params[0];
    const commandName = params[1];
    
    // Convert to MZ plugin command format if from MV
    if (this.shouldConvertNameMV(pluginName, commandName)) {
        const command = { code: 357, indent: this._indent, parameters: params };
        const mvCommand = this.convertNameMV(command);
        return this.pluginCommand(mvCommand.parameters[0], mvCommand.parameters.slice(1));
    }
    
    // Execute MZ style plugin command
    const key = pluginName + ":" + commandName;
    const func = PluginManager._commands[key];
    if (typeof func === "function") {
        func(this.convertAllParamsMZ(params[3]));
        return true;
    }
    
    return true;
};

// Convert parameters from editor format to usable objects
PluginManager.convertAllParamsMZ = function(args) {
    const params = {};
    for (const [key, value] of Object.entries(args)) {
        params[key] = this.convertParamMZ(value);
    }
    return params;
};

// Parse parameter values
PluginManager.convertParamMZ = function(param) {
    if (param === "") {
        return "";
    } else if (param === "true") {
        return true;
    } else if (param === "false") {
        return false;
    } else if (param.match(/^\[.*\]$/)) {
        return JSON.parse(param);
    } else if (param.match(/^\{.*\}$/)) {
        return JSON.parse(param);
    } else if (isNaN(param)) {
        return param;
    } else {
        return Number(param);
    }
};
```

## Plugin Lifecycle Hooks

RPG Maker MZ provides specific hooks for plugins to integrate with the engine lifecycle.

### Scene Hooks

Every scene in RPG Maker MZ has specific methods that plugins can override or extend:

```javascript
// Scene lifecycle hooks
Scene_Base.prototype.initialize = function() {
    Stage.prototype.initialize.call(this);
    this._started = false;
    this._active = false;
    this._fadeSign = 0;
    this._fadeDuration = 0;
    this._fadeWhite = 0;
    this._fadeOpacity = 0;
};

Scene_Base.prototype.create = function() {
    // Called when scene is created
};

Scene_Base.prototype.start = function() {
    // Called when scene becomes active
    this._started = true;
    this._active = true;
};

Scene_Base.prototype.update = function() {
    // Called every frame
    this.updateFade();
    this.updateChildren();
};

Scene_Base.prototype.terminate = function() {
    // Called when leaving the scene
    this._active = false;
};
```

### Plugin Extension Patterns

There are several common patterns used by plugins to extend functionality:

#### Method Aliasing

The most common technique is to alias an existing method and extend its functionality:

```javascript
// Method aliasing pattern
(function() {
    // Store the original method
    const _Game_Actor_setup = Game_Actor.prototype.setup;
    
    // Replace with extended version
    Game_Actor.prototype.setup = function(actorId) {
        // Call original method
        _Game_Actor_setup.call(this, actorId);
        
        // Add plugin-specific functionality
        this.initCustomAttributes();
    };
    
    // New method added by plugin
    Game_Actor.prototype.initCustomAttributes = function() {
        this._customStat = 0;
    };
})();
```

#### Prototype Extension

Adding entirely new methods to existing classes:

```javascript
// Add new methods to existing prototypes
(function() {
    // Add new methods to Game_Actor
    Game_Actor.prototype.customMethod = function() {
        // New functionality
        return this._customValue;
    };
    
    // Add new methods to Scene_Map
    Scene_Map.prototype.showCustomUI = function() {
        this._customWindow = new Window_Custom();
        this.addWindow(this._customWindow);
    };
})();
```

#### Class Extension

Creating new classes that inherit from existing ones:

```javascript
// Extending existing classes
function Window_CustomStatus() {
    this.initialize(...arguments);
}

Window_CustomStatus.prototype = Object.create(Window_Status.prototype);
Window_CustomStatus.prototype.constructor = Window_CustomStatus;

Window_CustomStatus.prototype.initialize = function(rect) {
    Window_Status.prototype.initialize.call(this, rect);
    this.setupCustomElements();
};

Window_CustomStatus.prototype.setupCustomElements = function() {
    // Custom initialization code
};
```

## Core Plugin Integration Points

Several key points in the engine are designed for plugin integration:

### Database Loading

```javascript
// DataManager hooks for plugin integration
DataManager.onLoad = function(object) {
    if (object === $dataMap) {
        this.extractMetadata(object);
        this.extractMapMetadata(object);
        
        // Plugin hook for custom map data processing
        if (this.onMapLoad) {
            this.onMapLoad(object);
        }
    } else {
        this.extractMetadata(object);
        
        // Plugin hook for custom data processing
        if (this.onDataLoad) {
            this.onDataLoad(object);
        }
    }
};
```

### Update Cycle

```javascript
// SceneManager update cycle
SceneManager.updateMain = function() {
    // Run plugin pre-update hooks
    if (this.onBeforeUpdate) {
        this.onBeforeUpdate();
    }
    
    // Process frame updates
    const newTime = this._getTimeInMs();
    const fTime = (newTime - this._currentTime) / 1000;
    if (fTime > 0) {
        this._currentTime = newTime;
        this._accumulator += fTime;
        this._updateInputData();
        this._update();
    }
    
    // Run plugin post-update hooks
    if (this.onAfterUpdate) {
        this.onAfterUpdate();
    }
};
```

### Rendering Pipeline

```javascript
// Graphics render hooks
Graphics.render = function(stage) {
    // Plugin pre-render hook
    if (this.onBeforeRender) {
        this.onBeforeRender(stage);
    }
    
    // Render the scene
    if (stage) {
        this._renderer.render(stage);
    }
    
    // Plugin post-render hook
    if (this.onAfterRender) {
        this.onAfterRender(stage);
    }
    
    this._skipCount = 0;
};
```

## Plugin Dependency Management

RPG Maker MZ supports plugin dependencies through the header metadata:

```javascript
/*:
 * @target MZ
 * @plugindesc Depends on other plugins.
 * @author Author Name
 * 
 * @requiredAssets img/pictures/PluginImage
 * @requiredAssets audio/se/PluginSound
 * 
 * @base OtherPlugin1
 * @base OtherPlugin2
 * @orderAfter YetAnotherPlugin
 */
```

The plugins.json file contains information about these dependencies:

```json
[
    {
        "name": "OtherPlugin1",
        "status": true,
        "description": "Base plugin required by others",
        "parameters": {}
    },
    {
        "name": "OtherPlugin2",
        "status": true,
        "description": "Another base plugin",
        "parameters": {}
    },
    {
        "name": "MyPlugin",
        "status": true,
        "description": "This plugin depends on others",
        "parameters": {}
    }
]
```

## Plugin Error Handling

The plugin system includes error handling to prevent one plugin from breaking the entire game:

```javascript
// Error handling for plugin loading
PluginManager.onError = function(e) {
    console.error("Failed to load plugin:", e.target._url);
    console.error(e);
    
    // Add to error queue
    this._errorUrls.push(e.target._url);
    
    // Create user-friendly error if testing
    if (Utils.isOptionValid("test")) {
        this.throwLoadError(e.target._url);
    }
};

// Throw a formatted error
PluginManager.throwLoadError = function(url) {
    const filename = decodeURIComponent(url.substring(url.lastIndexOf("/") + 1, url.length - 3));
    throw new Error("Failed to load: " + filename);
};

// Check for errors during scene initialization
Scene_Boot.prototype.isGameFontLoaded = function() {
    // Check for plugin errors first
    if (PluginManager.checkErrors()) {
        SceneManager.catchException(PluginManager.errors.join("\n"));
        return false;
    }
    
    // Continue with font loading check
    return Font.isReady();
};
```

## Plugin Version Compatibility

RPG Maker MZ provides a target version system to ensure plugins work with the right engine version:

```javascript
/*:
 * @target MZ
 * @minMZVersion 1.4.0
 * @maxMZVersion 1.6.0
 */

// Plugin code that checks version
(function() {
    // Parse current engine version
    const currentVersion = Utils.RPGMAKER_VERSION;
    const [currentMajor, currentMinor, currentPatch] = currentVersion.split(".").map(Number);
    
    // Parse minimum required version
    const minVersion = "1.4.0";
    const [minMajor, minMinor, minPatch] = minVersion.split(".").map(Number);
    
    // Check version compatibility
    if (
        currentMajor < minMajor ||
        (currentMajor === minMajor && currentMinor < minMinor) ||
        (currentMajor === minMajor && currentMinor === minMinor && currentPatch < minPatch)
    ) {
        console.error("This plugin requires RPG Maker MZ version " + minVersion + " or later.");
        return;
    }
    
    // Continue with plugin initialization if version is compatible
    // ...
})();
```

## Plugin Manager UI

The Plugin Manager provides a user interface for managing plugins within the editor:

```javascript
// Plugin manager UI initialization (in editor)
function PluginManagerUI() {
    this.initialize(...arguments);
}

PluginManagerUI.prototype.initialize = function() {
    this._plugins = [];
    this._pluginParams = {};
    this._selectedPlugin = null;
    this.loadPluginList();
    this.createUI();
};

PluginManagerUI.prototype.loadPluginList = function() {
    // Load plugin list from plugins.json
    this._plugins = loadPluginsFromFile();
    
    // Scan plugins directory for new plugins
    this.scanForNewPlugins();
};

PluginManagerUI.prototype.savePluginList = function() {
    // Save plugin list to plugins.json
    savePluginsToFile(this._plugins);
};

PluginManagerUI.prototype.parsePluginMetadata = function(pluginText) {
    // Extract metadata from plugin header
    const metadata = {};
    const commentStart = "/*:";
    const commentEnd = "*/";
    
    // Extract comment block
    const startIdx = pluginText.indexOf(commentStart);
    const endIdx = pluginText.indexOf(commentEnd, startIdx);
    
    if (startIdx >= 0 && endIdx > startIdx) {
        const commentBlock = pluginText.substring(startIdx + commentStart.length, endIdx);
        
        // Parse parameters and other metadata
        for (const line of commentBlock.split("\n")) {
            if (line.match(/^\s*\*\s*@([a-zA-Z0-9]+)(?:\s+(.*))?$/)) {
                const [, key, value] = RegExp.$1, RegExp.$2;
                metadata[key] = value || true;
            }
        }
    }
    
    return metadata;
};
```