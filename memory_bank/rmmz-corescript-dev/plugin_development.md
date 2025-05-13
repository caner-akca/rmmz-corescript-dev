# RPG Maker MZ - Plugin Development Guide

RPG Maker MZ uses a JavaScript-based plugin system to extend the engine's functionality. Understanding how to develop plugins requires knowledge of both JavaScript and the engine's architecture.

## Plugin Structure

A typical RPG Maker MZ plugin follows this structure:

```javascript
/*:
 * @target MZ
 * @plugindesc Description of what the plugin does
 * @author Your Name
 * @url http://your.website
 * 
 * @param paramName
 * @text Parameter Display Name
 * @desc Description of the parameter
 * @default defaultValue
 * 
 * @help
 * This is the help section that appears in the plugin manager.
 * Describe how to use your plugin here.
 */

(function() {
    // Plugin code goes here
    
    // Parameter handling
    const pluginName = "YourPluginName";
    const parameters = PluginManager.parameters(pluginName);
    const paramName = parameters['paramName'];
    
    // Function overrides
    const oldFunctionName = ClassName.prototype.functionName;
    ClassName.prototype.functionName = function() {
        // Your code before original function
        const result = oldFunctionName.call(this, ...arguments);
        // Your code after original function
        return result;
    };
    
    // New functionality
    ClassName.prototype.newFunction = function() {
        // Your new functionality
    };
})();
```

## Plugin Parameters

Plugins can define parameters that can be configured in the Plugin Manager:

- Text parameters: Simple string inputs
- Number parameters: Numerical values
- Boolean parameters: True/false options
- Select parameters: Dropdown selections
- Array parameters: Lists of items
- JSON parameters: Complex structured data

## Common Extension Points

Common places to extend functionality:

1. **Scene classes**: Add new screens or modify existing ones
2. **Window classes**: Create custom UI elements
3. **Game_* classes**: Modify game mechanics and data handling
4. **Sprite classes**: Change visual representations
5. **Manager classes**: Adjust system-level behavior

## Plugin Commands

RPG Maker MZ supports plugin commands that can be called from events:

```javascript
PluginManager.registerCommand(pluginName, "commandName", args => {
    // Command implementation
});
```

## Best Practices

1. Use IIFE (Immediately Invoked Function Expression) to avoid polluting the global namespace
2. Always backup original methods when overriding
3. Use descriptive parameter names and provide helpful documentation
4. Test compatibility with other popular plugins
5. Optimize for performance, especially for operations done frequently