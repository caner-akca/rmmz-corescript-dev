# RPG Maker MZ - Plugin Parameter Handling

This document details how RPG Maker MZ handles plugin parameters, including parameter types, configuration, access, and advanced parameter techniques.

## Parameter Definition System

RPG Maker MZ provides a sophisticated parameter system that allows plugin developers to create configurable options with various data types.

### Parameter Declaration

Parameters are declared in the plugin's header comment block using a special annotation format:

```javascript
/*:
 * @target MZ
 * @plugindesc Plugin description
 * @author Author Name
 * 
 * @param stringParam
 * @text Display Name
 * @desc This is a text parameter
 * @default Hello World
 * @type string
 * 
 * @param numberParam
 * @text Number Parameter
 * @desc This is a number parameter
 * @default 42
 * @type number
 * @min 0
 * @max 100
 * @decimals 2
 * 
 * @param booleanParam
 * @text On/Off Switch
 * @desc This is a boolean parameter
 * @default true
 * @type boolean
 * @on Enabled
 * @off Disabled
 */
```

## Parameter Types

RPG Maker MZ supports many parameter types to provide rich configuration options.

### Basic Types

```javascript
/*:
 * @param stringParam
 * @type string
 * 
 * @param numberParam
 * @type number
 * 
 * @param booleanParam
 * @type boolean
 */
```

### Select Types

```javascript
/*:
 * @param selectParam
 * @text Dropdown Selection
 * @type select
 * @option Option 1
 * @value 1
 * @option Option 2
 * @value 2
 * @option Option 3
 * @value 3
 * @default 1
 * 
 * @param comboParam
 * @text Combo Box
 * @type combo
 * @option Option 1
 * @option Option 2
 * @option Option 3
 * @default Option 1
 */
```

### File Types

```javascript
/*:
 * @param imageParam
 * @text Select Image
 * @type file
 * @dir img/pictures
 * @require 1
 * 
 * @param audioParam
 * @text Select Audio
 * @type file
 * @dir audio/bgm
 * @require 1
 */
```

### Complex Types

```javascript
/*:
 * @param actorParam
 * @text Select Actor
 * @type actor
 * 
 * @param enemyParam
 * @text Select Enemy
 * @type enemy
 * 
 * @param skillParam
 * @text Select Skill
 * @type skill
 * 
 * @param weaponParam
 * @text Select Weapon
 * @type weapon
 * 
 * @param armorParam
 * @text Select Armor
 * @type armor
 * 
 * @param stateParam
 * @text Select State
 * @type state
 * 
 * @param animationParam
 * @text Select Animation
 * @type animation
 * 
 * @param tilesetParam
 * @text Select Tileset
 * @type tileset
 * 
 * @param commonEventParam
 * @text Select Common Event
 * @type common_event
 */
```

### Array Types

```javascript
/*:
 * @param arrayParam
 * @text Array Parameter
 * @type string[]
 * @default ["Item 1", "Item 2", "Item 3"]
 * 
 * @param numberArrayParam
 * @text Number Array
 * @type number[]
 * @default [10, 20, 30]
 * @min 0
 * @max 100
 */
```

### Structure Types

```javascript
/*:
 * @param structParam
 * @text Structure Parameter
 * @type struct<CustomStruct>
 * @default {"name":"Default Name","value":10,"enabled":true}
 */

/*~struct~CustomStruct:
 * @param name
 * @text Name
 * @type string
 * @default Untitled
 * 
 * @param value
 * @text Value
 * @type number
 * @default 0
 * 
 * @param enabled
 * @text Enabled
 * @type boolean
 * @default true
 */
```

### List Types

```javascript
/*:
 * @param listParam
 * @text List Parameter
 * @type struct<CustomStruct>[]
 * @default ["{\"name\":\"Item 1\",\"value\":10,\"enabled\":true}","{\"name\":\"Item 2\",\"value\":20,\"enabled\":false}"]
 */

/*~struct~CustomStruct:
 * @param name
 * @text Name
 * @type string
 * @default Untitled
 * 
 * @param value
 * @text Value
 * @type number
 * @default 0
 * 
 * @param enabled
 * @text Enabled
 * @type boolean
 * @default true
 */
```

### Note Parameters

```javascript
/*:
 * @param noteParam
 * @text Note Parameter
 * @type note
 * @default "This is a multi-line\ntext parameter that can\nspan several lines."
 */
```

## Parameter Storage and Access

Parameters are stored and accessed through the `PluginManager` class.

### Parameters Storage

When plugins are loaded, parameters are stored in the `PluginManager`:

```javascript
// Store plugin parameters
PluginManager.setParameters = function(name, parameters) {
    this._parameters[name.toLowerCase()] = parameters;
};
```

### Accessing Parameters

Parameters can be accessed using the `parameters` method:

```javascript
// Get plugin parameters
PluginManager.parameters = function(name) {
    return this._parameters[name.toLowerCase()] || {};
};

// Usage in a plugin
(function() {
    // Get parameters for this plugin
    const params = PluginManager.parameters('MyPlugin');
    
    // Access individual parameters
    const stringValue = params.stringParam;
    const numberValue = Number(params.numberParam);
    const boolValue = params.booleanParam === 'true';
})();
```

### Parameter Parsing Helpers

Most plugins include helper functions to parse parameters correctly:

```javascript
// Parameter parsing utility function
function parsePluginParameters(parameters) {
    const result = {};
    
    for (const [key, value] of Object.entries(parameters)) {
        // Handle arrays and objects
        if (value.match(/^\[.*\]$/) || value.match(/^\{.*\}$/)) {
            try {
                result[key] = JSON.parse(value);
            } catch (e) {
                console.error("Error parsing parameter:", key, value);
                result[key] = value;
            }
        }
        // Handle numbers
        else if (!isNaN(value) && value.trim() !== '') {
            result[key] = Number(value);
        }
        // Handle booleans
        else if (value === 'true') {
            result[key] = true;
        }
        else if (value === 'false') {
            result[key] = false;
        }
        // Handle strings
        else {
            result[key] = value;
        }
    }
    
    return result;
}

// Parse nested structures
function parseStructArrays(params) {
    // Parse array type parameters with structures
    for (const key in params) {
        if (params[key] && typeof params[key] === 'object' && Array.isArray(params[key])) {
            // Try to parse each element in array
            for (let i = 0; i < params[key].length; i++) {
                if (typeof params[key][i] === 'string') {
                    try {
                        params[key][i] = JSON.parse(params[key][i]);
                    } catch (e) {
                        // Not a valid JSON string, leave as is
                    }
                }
                
                // Recursively parse nested arrays/objects
                if (typeof params[key][i] === 'object') {
                    parseStructArrays(params[key][i]);
                }
            }
        } else if (params[key] && typeof params[key] === 'object') {
            // Recursively parse nested objects
            parseStructArrays(params[key]);
        }
    }
    
    return params;
}
```

## Advanced Parameter Techniques

### Conditional Parameters

Some plugins implement conditional parameters that appear or hide based on other parameter values:

```javascript
/*:
 * @param useCustomSystem
 * @text Use Custom System
 * @type boolean
 * @default false
 * 
 * @param customSettings
 * @text Custom Settings
 * @type struct<CustomSettings>
 * @default {"option1":"value1","option2":"value2"}
 * @desc Custom settings configuration
 * @parent useCustomSystem
 */

// In plugin code
(function() {
    const params = parsePluginParameters(PluginManager.parameters('ConditionalPlugin'));
    
    // Only apply custom settings if enabled
    if (params.useCustomSystem) {
        applyCustomSettings(params.customSettings);
    } else {
        applyDefaultSettings();
    }
})();
```

### Dynamic Parameter Updates

Some plugins allow parameters to be changed during runtime:

```javascript
// Dynamic parameter management
const MyPlugin = {
    params: parsePluginParameters(PluginManager.parameters('MyPlugin')),
    
    // Update a parameter at runtime
    setParameter: function(paramName, value) {
        this.params[paramName] = value;
        this.onParameterChanged(paramName);
    },
    
    // Handle parameter change
    onParameterChanged: function(paramName) {
        console.log("Parameter changed:", paramName);
        
        // Apply effects of parameter change
        switch (paramName) {
            case "displayMode":
                this.updateDisplayMode();
                break;
            case "effectPower":
                this.recalculateEffects();
                break;
        }
    },
    
    // Save modified parameters
    saveParameters: function() {
        // Cannot actually save to plugins.json at runtime
        // This would be part of a save/load extension
        $gameSystem.setCustomPluginParameters('MyPlugin', this.params);
    }
};

// Store custom parameters in save data
Game_System.prototype.setCustomPluginParameters = function(pluginName, parameters) {
    if (!this._customPluginParameters) {
        this._customPluginParameters = {};
    }
    this._customPluginParameters[pluginName] = parameters;
};

Game_System.prototype.getCustomPluginParameters = function(pluginName) {
    if (!this._customPluginParameters) {
        return null;
    }
    return this._customPluginParameters[pluginName];
};
```

### Parameter Validation

Advanced plugins often include parameter validation:

```javascript
// Validate parameters on plugin load
(function() {
    const params = parsePluginParameters(PluginManager.parameters('ValidatingPlugin'));
    
    // Validate numberic parameters
    if (isNaN(params.damageMultiplier) || params.damageMultiplier <= 0) {
        console.error("ValidatingPlugin: damageMultiplier must be a positive number");
        params.damageMultiplier = 1.0; // Set default value
    }
    
    // Validate range
    if (params.critRate < 0 || params.critRate > 1) {
        console.error("ValidatingPlugin: critRate must be between 0 and 1");
        params.critRate = 0.05; // Set default value
    }
    
    // Validate required parameters
    if (!params.requiredImage) {
        console.error("ValidatingPlugin: requiredImage parameter is required");
        params.requiredImage = "DefaultImage"; // Set fallback
    }
})();
```

### Parameter Dependency Management

Handling dependencies between parameters:

```javascript
// Check parameter dependencies
function validateParameterDependencies(params) {
    let valid = true;
    
    // Check dependency chain
    if (params.useCustomBattleSystem) {
        if (!params.customBattleSettings) {
            console.error("When useCustomBattleSystem is enabled, customBattleSettings must be configured");
            valid = false;
        }
        
        if (params.customBattleSettings.useCustomDamageFormula && !params.customBattleSettings.damageFormula) {
            console.error("When useCustomDamageFormula is enabled, damageFormula must be provided");
            params.customBattleSettings.damageFormula = "a.atk * 2 - b.def"; // Default formula
            valid = false;
        }
    }
    
    return valid;
}
```

## Plugin Parameter Storage in Save Data

How to save plugin-specific parameters in save files:

```javascript
// Capture plugin settings in save data
(function() {
    // Store original methods
    const _DataManager_makeSaveContents = DataManager.makeSaveContents;
    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    
    // Add plugin data to save contents
    DataManager.makeSaveContents = function() {
        // Get base save contents
        const contents = _DataManager_makeSaveContents.call(this);
        
        // Add plugin data
        contents.pluginData = {};
        contents.pluginData.MyPlugin = {
            customSettings: MyPlugin.params,
            runtimeData: MyPlugin.getRuntimeData()
        };
        
        return contents;
    };
    
    // Extract plugin data from save contents
    DataManager.extractSaveContents = function(contents) {
        // Extract base save contents
        _DataManager_extractSaveContents.call(this, contents);
        
        // Extract plugin data
        if (contents.pluginData && contents.pluginData.MyPlugin) {
            const data = contents.pluginData.MyPlugin;
            
            // Restore plugin state
            MyPlugin.params = data.customSettings;
            MyPlugin.setRuntimeData(data.runtimeData);
        }
    };
})();
```

## Parameter UI Configuration

The parameter UI in the plugin manager can be customized with additional annotations:

```javascript
/*:
 * @param paramGroup1
 * @text Basic Settings
 * @default ---------------------------------
 * 
 * @param displayName
 * @text Display Name
 * @desc The name shown in-game
 * @type string
 * @default Untitled
 * @parent paramGroup1
 * 
 * @param paramGroup2
 * @text Advanced Settings
 * @default ---------------------------------
 * 
 * @param advancedOption1
 * @text Advanced Option 1
 * @desc An advanced plugin setting
 * @type number
 * @default 50
 * @min 0
 * @max 100
 * @parent paramGroup2
 */
```

## Handling Multilingual Parameters

Supporting multiple languages in plugin parameters:

```javascript
/*:
 * @param defaultText
 * @text Default Text
 * @desc Default text in English
 * @default Hello World
 * 
 * @param jaText
 * @text Japanese Text
 * @desc The text to use when game is in Japanese
 * @default こんにちは世界
 */

/*:ja
 * @param defaultText
 * @text デフォルトテキスト
 * @desc 英語のデフォルトテキスト
 * @default Hello World
 * 
 * @param jaText
 * @text 日本語テキスト
 * @desc ゲームが日本語の場合に使用するテキスト
 * @default こんにちは世界
 */

// Plugin code to handle language-specific parameters
(function() {
    const params = parsePluginParameters(PluginManager.parameters('MultilingualPlugin'));
    
    // Determine which text to use based on current language
    const text = $gameSystem && $gameSystem.isJapanese() ? params.jaText : params.defaultText;
    
    // Use the appropriate text
    console.log("Current text:", text);
})();
```

## Plugin Parameter Import/Export

Some plugins provide functionality to import and export parameter configurations:

```javascript
// Plugin parameter export utility
function exportPluginParameters(pluginName) {
    const params = PluginManager.parameters(pluginName);
    const json = JSON.stringify(params, null, 2);
    
    // In NW.js environment, this could save to file
    if (Utils.isNwjs() && window.require) {
        const fs = require('fs');
        const path = require('path');
        const desktopPath = process.env.HOME || process.env.HOMEPATH;
        const filePath = path.join(desktopPath, 'Desktop', `${pluginName}_settings.json`);
        
        fs.writeFileSync(filePath, json);
        return filePath;
    }
    
    // In browser, return for copy-paste
    return json;
}

// Plugin parameter import utility
function importPluginParameters(pluginName, jsonString) {
    try {
        const params = JSON.parse(jsonString);
        
        // Store in temporary runtime storage
        if (!window.$pluginTemp) {
            window.$pluginTemp = {};
        }
        
        window.$pluginTemp[pluginName] = params;
        
        // Note: This doesn't permanently change the parameters in plugins.json
        // That would require editor integration
        
        return true;
    } catch (e) {
        console.error("Failed to import plugin parameters:", e);
        return false;
    }
}

// Access imported parameters
function getActiveParameters(pluginName) {
    // Check for imported parameters first
    if (window.$pluginTemp && window.$pluginTemp[pluginName]) {
        return window.$pluginTemp[pluginName];
    }
    
    // Fall back to regular parameters
    return PluginManager.parameters(pluginName);
}
```