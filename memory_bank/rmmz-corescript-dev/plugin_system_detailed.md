# RPG Maker MZ - Plugin System (Detailed)

The plugin system in RPG Maker MZ enables developers to extend and modify the engine's functionality without altering the core code.

## Plugin Manager

### PluginManager
- Located in `rmmz_managers/PluginManager.js`
- Responsible for loading and initializing plugins
- Parses plugin parameters and commands
- Registers plugin commands for use in events

```javascript
// Core plugin loading method
PluginManager.setup = function(plugins) {
    for (const plugin of plugins) {
        if (plugin.status && !this._scripts.includes(plugin.name)) {
            this.setParameters(plugin.name, plugin.parameters);
            this.loadScript(plugin.name);
            this._scripts.push(plugin.name);
        }
    }
};
```

## Plugin Structure

### Header Comments
The header defines plugin metadata and parameters:

```javascript
/*:
 * @target MZ
 * @plugindesc A description of what the plugin does
 * @author Your Name
 * @url http://your.website.com
 * 
 * @param paramId
 * @text Display Name
 * @desc Parameter description
 * @default defaultValue
 * @type string
 * 
 * @param numParam
 * @text Number Parameter
 * @desc A number parameter
 * @type number
 * @min 0
 * @max 100
 * @default 50
 * 
 * @param listParam
 * @text List Parameter
 * @desc A list parameter
 * @type select
 * @option Option 1
 * @value 1
 * @option Option 2
 * @value 2
 * @default 1
 * 
 * @help
 * This is the help text displayed in the plugin manager.
 * 
 * Terms of Use:
 * Free for both commercial and non-commercial use.
 */
```

### Parameter Types
- `string`: Text input
- `number`: Numerical value
- `boolean`: True/false toggle
- `select`: Dropdown menu
- `combo`: Dropdown with custom input
- `file`: File selection
- `note`: Multiline text
- `struct`: Object with multiple properties
- `array`: List of items

### Plugin Body
The main plugin code typically uses an IIFE (Immediately Invoked Function Expression) for scope isolation:

```javascript
(function() {
    "use strict";
    
    // Get plugin parameters
    const pluginName = "YourPluginName";
    const parameters = PluginManager.parameters(pluginName);
    
    // Parse parameters (convert string values if needed)
    const paramValue = String(parameters['paramId'] || "");
    const numValue = Number(parameters['numParam'] || 50);
    
    // Override existing methods
    const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        // Add your plugin commands here
    };
})();
```

## Plugin Commands

MZ introduces a new structured way to register plugin commands:

```javascript
// Register plugin commands
PluginManager.registerCommand(pluginName, "commandName", args => {
    // args is an object containing the parameters
    const targetId = Number(args.targetId);
    const value = String(args.value);
    
    // Command implementation
    $gameSystem.doSomething(targetId, value);
});
```

In the plugin parameters, you define the command structure:

```
@command commandName
@text Display Name
@desc Command description

@arg targetId
@text Target ID
@desc Description of the target
@type number
@default 1

@arg value
@text Value
@desc Description of the value
@type string
@default ""
```

## Advanced Techniques

### Aliasing Methods

To extend existing functionality:

```javascript
// Store the original method
const _ClassName_methodName = ClassName.prototype.methodName;

// Override the method
ClassName.prototype.methodName = function() {
    // Call original method
    _ClassName_methodName.call(this);
    
    // Add additional functionality
    this.additionalBehavior();
};
```

### Monkey Patching

To completely replace functionality:

```javascript
// Replace an existing method
ClassName.prototype.methodName = function() {
    // All new implementation
    return calculatedValue;
};
```

### Adding New Properties

```javascript
// Add a new property with getter/setter
Object.defineProperty(ClassName.prototype, "newProperty", {
    get: function() {
        return this._newProperty;
    },
    set: function(value) {
        this._newProperty = value;
    },
    configurable: true
});
```

### Creating New Classes

```javascript
// Create a new game object class
function Game_CustomObject() {
    this.initialize(...arguments);
}

Game_CustomObject.prototype.initialize = function() {
    // Initialization code
};

Game_CustomObject.prototype.update = function() {
    // Update logic
};
```

## Plugin Compatibility

Tips for creating compatible plugins:

1. **Use unique variable names** with plugin name as prefix
2. **Check if functions exist** before aliasing
3. **Access properties through getters/setters** when possible
4. **Create compatibility patches** for popular plugins
5. **Use namespaces** to organize code:

```javascript
var Imported = Imported || {};
Imported.YourPluginName = true;

var YourNamespace = YourNamespace || {};
YourNamespace.PluginName = YourNamespace.PluginName || {};
```