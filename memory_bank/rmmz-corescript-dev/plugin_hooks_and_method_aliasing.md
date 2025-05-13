# RPG Maker MZ - Plugin Hooks and Method Aliasing

This document explains how plugins integrate with RPG Maker MZ through hook points and method aliasing, crucial techniques that allow plugins to modify or extend the engine's core functionality.

## Method Aliasing Fundamentals

Method aliasing is the primary technique used by plugin developers to modify existing functionality in RPG Maker MZ. It involves saving a reference to an original method and then replacing it with a new method that calls the original while adding custom functionality.

### Basic Method Aliasing Pattern

```javascript
(function() {
    // Store reference to the original method
    const _Game_Actor_setup = Game_Actor.prototype.setup;
    
    // Replace with extended version
    Game_Actor.prototype.setup = function(actorId) {
        // Call original method
        _Game_Actor_setup.call(this, actorId);
        
        // Add plugin-specific functionality
        this._customParam = 100;
    };
})();
```

### IIFE Scope Protection

Note the use of an Immediately Invoked Function Expression (IIFE) in the example above. This creates a closure that protects the original method reference from being modified by other plugins:

```javascript
(function() {
    // Code in here gets its own scope
    // Original method references are protected from other plugins
})();
```

## Method Aliasing Patterns

Different aliasing patterns are used depending on the integration needs:

### Pre-Processing Pattern

This pattern executes custom code before the original method:

```javascript
// Execute code before the original method
Game_Actor.prototype.refresh = function() {
    // Custom pre-processing
    this.updateCustomAttributes();
    
    // Call original method
    _Game_Actor_refresh.call(this);
};
```

### Post-Processing Pattern

This pattern executes custom code after the original method:

```javascript
// Execute code after the original method
Game_Actor.prototype.levelUp = function() {
    // Call original method
    _Game_Actor_levelUp.call(this);
    
    // Custom post-processing
    this.gainCustomPoints(10);
    this.showCustomLevelUpMessage();
};
```

### Replacement Pattern

This pattern completely replaces the original method but might still call it conditionally:

```javascript
// Completely replace the original method
Game_Actor.prototype.paramBase = function(paramId) {
    // Special case for custom parameters
    if (paramId >= 8) {
        return this.calculateCustomParam(paramId);
    }
    
    // Call original method for standard parameters
    return _Game_Actor_paramBase.call(this, paramId);
};
```

### Wrapper Pattern

This pattern wraps the original method with additional functionality:

```javascript
// Wrap original method with additional functionality
Game_Actor.prototype.gainExp = function(exp) {
    // Apply experience modifiers
    const modifiedExp = this.applyExpModifiers(exp);
    
    // Call original with modified values
    _Game_Actor_gainExp.call(this, modifiedExp);
    
    // Track experience gain in custom systems
    this.updateExpHistory(exp, modifiedExp);
};
```

## Core Plugin Hooks

RPG Maker MZ provides several strategic hook points designed for plugin integration.

### SceneManager Hooks

The SceneManager offers hooks for the game initialization and update cycle:

```javascript
// SceneManager.initialize hook
const _SceneManager_initialize = SceneManager.initialize;
SceneManager.initialize = function() {
    _SceneManager_initialize.call(this);
    
    // Initialize plugin systems
    CustomPlugin.initialize();
};

// SceneManager.update hook
const _SceneManager_update = SceneManager.update;
SceneManager.update = function() {
    _SceneManager_update.call(this);
    
    // Update plugin systems
    CustomPlugin.update();
};
```

### DataManager Hooks

Hooks into the data loading system to process custom data:

```javascript
// Hook into data loading
const _DataManager_onLoad = DataManager.onLoad;
DataManager.onLoad = function(object) {
    _DataManager_onLoad.call(this, object);
    
    // Process custom data
    if (object === $dataItems) {
        CustomItemSystem.processItems(object);
    } else if (object === $dataMap) {
        CustomMapSystem.processMap(object);
    }
};
```

### Scene Class Hooks

Hooks into Scene classes to add custom windows or functionality:

```javascript
// Add to scene startup
const _Scene_Map_start = Scene_Map.prototype.start;
Scene_Map.prototype.start = function() {
    _Scene_Map_start.call(this);
    
    // Display custom UI elements
    this.showCustomOverlay();
};

// Create custom windows
const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
Scene_Menu.prototype.createCommandWindow = function() {
    _Scene_Menu_createCommandWindow.call(this);
    
    // Add custom command
    this._commandWindow.setHandler("custom", this.commandCustom.bind(this));
};
```

## Method Aliasing Best Practices

### Preserving Method Context

Always call the original method with the correct context:

```javascript
// GOOD: Preserves 'this' context
_Game_Actor_levelUp.call(this);

// BAD: Loses 'this' context
_Game_Actor_levelUp();
```

### Handling Return Values

Don't forget to return values from the original method when needed:

```javascript
// Return value from original method
Game_Actor.prototype.paramBase = function(paramId) {
    // For custom parameters, use custom logic
    if (paramId >= 8) {
        return this.customParamBase(paramId);
    }
    
    // Otherwise return the original result
    return _Game_Actor_paramBase.call(this, paramId);
};
```

### Plugin Order Compatibility

Consider how your plugin will interact with others that might modify the same methods:

```javascript
// More compatible approach - add functionality without assumptions
const _Game_Actor_changeExp = Game_Actor.prototype.changeExp;
Game_Actor.prototype.changeExp = function(exp, show) {
    // Calculate experience modifiers
    const expModifier = this.getCustomExpModifier();
    
    // Apply modifier and call original method
    _Game_Actor_changeExp.call(this, exp * expModifier, show);
};
```

## Advanced Hook Systems

### Plugin Hook Manager

Creating a centralized hook system can make plugins more compatible:

```javascript
// Hook Manager System
const HookManager = {
    _hooks: {},
    
    // Add a hook
    addHook: function(hookName, handler, priority = 10) {
        if (!this._hooks[hookName]) {
            this._hooks[hookName] = [];
        }
        
        this._hooks[hookName].push({
            handler: handler,
            priority: priority
        });
        
        // Sort by priority (higher numbers run first)
        this._hooks[hookName].sort((a, b) => b.priority - a.priority);
    },
    
    // Execute all hooks
    executeHook: function(hookName, ...args) {
        if (!this._hooks[hookName]) {
            return;
        }
        
        let result;
        for (const hook of this._hooks[hookName]) {
            result = hook.handler(...args);
            
            // If a hook returns false, stop processing
            if (result === false) {
                return false;
            }
        }
        
        return true;
    },
    
    // Remove hooks
    removeHook: function(hookName, handler) {
        if (!this._hooks[hookName]) {
            return;
        }
        
        this._hooks[hookName] = this._hooks[hookName].filter(
            hook => hook.handler !== handler
        );
    }
};

// Example usage
// First, set up hooks in the base system
const _Game_Actor_levelUp = Game_Actor.prototype.levelUp;
Game_Actor.prototype.levelUp = function() {
    // Run pre-level up hooks
    if (HookManager.executeHook('pre_level_up', this) !== false) {
        // Call original method
        _Game_Actor_levelUp.call(this);
        
        // Run post-level up hooks
        HookManager.executeHook('post_level_up', this);
    }
};

// Then, plugins can add hooks without directly aliasing
// Plugin A
HookManager.addHook('post_level_up', function(actor) {
    actor.gainCustomPoints(5);
});

// Plugin B can hook the same event
HookManager.addHook('post_level_up', function(actor) {
    actor.showCustomAnimation(101);
});
```

### Filter Hooks

Filter hooks allow plugins to modify values:

```javascript
// Create filter system
const FilterManager = {
    _filters: {},
    
    // Add a filter
    addFilter: function(filterName, handler, priority = 10) {
        if (!this._filters[filterName]) {
            this._filters[filterName] = [];
        }
        
        this._filters[filterName].push({
            handler: handler,
            priority: priority
        });
        
        // Sort by priority
        this._filters[filterName].sort((a, b) => b.priority - a.priority);
    },
    
    // Apply all filters
    applyFilters: function(filterName, value, ...args) {
        if (!this._filters[filterName]) {
            return value;
        }
        
        let result = value;
        for (const filter of this._filters[filterName]) {
            result = filter.handler(result, ...args);
        }
        
        return result;
    },
    
    // Remove filter
    removeFilter: function(filterName, handler) {
        if (!this._filters[filterName]) {
            return;
        }
        
        this._filters[filterName] = this._filters[filterName].filter(
            filter => filter.handler !== handler
        );
    }
};

// Example usage in base system
const _Game_Actor_gainExp = Game_Actor.prototype.gainExp;
Game_Actor.prototype.gainExp = function(exp) {
    // Apply filters to the experience value
    const filteredExp = FilterManager.applyFilters('exp_gain', exp, this);
    
    // Call original with filtered value
    _Game_Actor_gainExp.call(this, filteredExp);
};

// Plugins can add filters
// Plugin A: Double EXP on weekends
FilterManager.addFilter('exp_gain', function(exp, actor) {
    const now = new Date();
    const day = now.getDay();
    
    // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
        return exp * 2;
    }
    
    return exp;
}, 20); // Higher priority

// Plugin B: Cap EXP at 100
FilterManager.addFilter('exp_gain', function(exp, actor) {
    return Math.min(exp, 100);
}, 10); // Lower priority, runs after weekend bonus
```

## Class Prototype Extension

Adding new methods to existing classes:

```javascript
// Add new methods to Game_Actor prototype
Game_Actor.prototype.getCustomStat = function(statId) {
    if (!this._customStats) {
        this._customStats = [];
    }
    return this._customStats[statId] || 0;
};

Game_Actor.prototype.setCustomStat = function(statId, value) {
    if (!this._customStats) {
        this._customStats = [];
    }
    this._customStats[statId] = value;
};
```

## Life Cycle Hooks

Adding hooks for object life cycles:

```javascript
// Add initialization hooks
const _Game_Actor_initialize = Game_Actor.prototype.initialize;
Game_Actor.prototype.initialize = function(actorId) {
    _Game_Actor_initialize.call(this, actorId);
    
    // Initialize custom systems
    this.initializeCustomElements();
};

Game_Actor.prototype.initializeCustomElements = function() {
    this._customStats = [];
    this._specialMoves = [];
    this._expHistory = [];
};
```

## Scene Flow Hooks

Hooking into scene transitions:

```javascript
// Hook scene transitions
const _SceneManager_goto = SceneManager.goto;
SceneManager.goto = function(sceneClass) {
    // Custom processing before scene change
    const prevSceneClass = this._scene ? this._scene.constructor : null;
    
    // Call transition handlers
    if (this._scene) {
        HookManager.executeHook('scene_exit', this._scene, sceneClass);
    }
    
    HookManager.executeHook('scene_transition', prevSceneClass, sceneClass);
    
    // Proceed with transition
    _SceneManager_goto.call(this, sceneClass);
};

// Hook scene initialization
const _Scene_Base_initialize = Scene_Base.prototype.initialize;
Scene_Base.prototype.initialize = function() {
    _Scene_Base_initialize.call(this);
    
    // Execute scene init hooks
    HookManager.executeHook('scene_init', this);
};

// Hook scene start
const _Scene_Base_start = Scene_Base.prototype.start;
Scene_Base.prototype.start = function() {
    _Scene_Base_start.call(this);
    
    // Execute scene start hooks
    HookManager.executeHook('scene_start', this);
};
```

## Update Cycle Hooks

Hooking into the game update cycle:

```javascript
// Hook main update
const _SceneManager_updateMain = SceneManager.updateMain;
SceneManager.updateMain = function() {
    // Pre-update hooks
    HookManager.executeHook('pre_update');
    
    // Call original update
    _SceneManager_updateMain.call(this);
    
    // Post-update hooks
    HookManager.executeHook('post_update');
};

// Register frame-based plugins
HookManager.addHook('post_update', function() {
    // Update custom weather effects
    CustomWeatherSystem.update();
});

HookManager.addHook('post_update', function() {
    // Update custom timers
    CustomTimerSystem.update();
});
```

## Dependency Management

Managing plugin dependencies with hook timing:

```javascript
// Plugin initialization system with dependencies
const PluginInitManager = {
    _plugins: [],
    _initialized: {},
    
    // Register a plugin
    register: function(pluginName, dependencies, initFunction) {
        this._plugins.push({
            name: pluginName,
            dependencies: dependencies,
            initFunction: initFunction
        });
    },
    
    // Initialize all plugins in correct order
    initializeAll: function() {
        // Keep trying until all plugins are initialized or progress stops
        let initializedThisPass;
        do {
            initializedThisPass = 0;
            
            for (const plugin of this._plugins) {
                // Skip already initialized
                if (this._initialized[plugin.name]) {
                    continue;
                }
                
                // Check dependencies
                const dependenciesMet = plugin.dependencies.every(
                    dep => this._initialized[dep]
                );
                
                if (dependenciesMet) {
                    // Initialize plugin
                    plugin.initFunction();
                    this._initialized[plugin.name] = true;
                    initializedThisPass++;
                    
                    console.log(`Initialized plugin: ${plugin.name}`);
                }
            }
        } while (initializedThisPass > 0);
        
        // Check for uninitialized plugins
        const uninitialized = this._plugins.filter(
            plugin => !this._initialized[plugin.name]
        );
        
        if (uninitialized.length > 0) {
            console.error("Could not initialize plugins due to missing dependencies:", 
                uninitialized.map(p => p.name));
        }
    }
};

// Example usage
PluginInitManager.register("CoreExtensions", [], function() {
    // No dependencies, initialize first
    console.log("Initializing core extensions");
});

PluginInitManager.register("CustomBattleSystem", ["CoreExtensions"], function() {
    // Depends on CoreExtensions
    console.log("Initializing custom battle system");
});

PluginInitManager.register("AdvancedWeapons", ["CoreExtensions", "CustomBattleSystem"], function() {
    // Depends on both previous plugins
    console.log("Initializing advanced weapons");
});

// Initialize everything
document.addEventListener("DOMContentLoaded", function() {
    PluginInitManager.initializeAll();
});
```

## Mobile Integration Hooks

Special hooks for mobile platform integration:

```javascript
// Mobile platform detection
const isMobileDevice = function() {
    return Utils.isMobileDevice();
};

// Add mobile-specific hooks
const _TouchInput_initialize = TouchInput.initialize;
TouchInput.initialize = function() {
    _TouchInput_initialize.call(this);
    
    // Setup additional mobile-specific handlers
    if (isMobileDevice()) {
        this._setupMobileHandlers();
    }
};

TouchInput._setupMobileHandlers = function() {
    // Custom mobile handlers
    document.addEventListener("touchstart", this._onMobileTouchStart.bind(this));
    document.addEventListener("touchmove", this._onMobileTouchMove.bind(this));
    document.addEventListener("touchend", this._onMobileTouchEnd.bind(this));
    
    // Execute mobile setup hooks
    HookManager.executeHook('mobile_setup', this);
};

// Add mobile-specific UI
HookManager.addHook('mobile_setup', function(touchInput) {
    // Create virtual gamepad for mobile
    const virtualGamepad = new VirtualGamepad();
    document.body.appendChild(virtualGamepad.element);
});
```

## Debug and Development Hooks

Hooks for debugging and development:

```javascript
// Debug mode detection
const isDebugMode = function() {
    return Utils.isOptionValid('test');
};

// Add debug hooks
const _Scene_Boot_start = Scene_Boot.prototype.start;
Scene_Boot.prototype.start = function() {
    _Scene_Boot_start.call(this);
    
    // Initialize debug features
    if (isDebugMode()) {
        this._setupDebugFeatures();
    }
};

Scene_Boot.prototype._setupDebugFeatures = function() {
    // Setup debug console
    const debugConsole = new Window_DebugConsole();
    SceneManager._scene.addChild(debugConsole);
    
    // Execute debug setup hooks
    HookManager.executeHook('debug_setup');
};

// Add debug commands
HookManager.addHook('debug_setup', function() {
    // Register debug commands
    DebugConsole.registerCommand("giveItem", function(itemId, amount = 1) {
        $gameParty.gainItem($dataItems[itemId], amount);
        return `Added ${amount} of item ${itemId}`;
    });
});
```

## Compatibility Layer Hooks

Hooks to maintain compatibility with older plugins:

```javascript
// MV compatibility layer
const MVCompatibility = {
    initialize: function() {
        this.addAliases();
        this.addCompatibilityMethods();
    },
    
    addAliases: function() {
        // MV used ImageManager.loadBitmap, MZ uses loadBitmapFromUrl
        if (!ImageManager.loadBitmap) {
            ImageManager.loadBitmap = function(folder, filename, hue, smooth) {
                return this.loadBitmapFromUrl(folder + filename + ".png");
            };
        }
    },
    
    addCompatibilityMethods: function() {
        // MV compatibility for Window_Base methods
        if (!Window_Base.prototype.drawActorHp) {
            Window_Base.prototype.drawActorHp = function(actor, x, y, width) {
                this.placeGauge(actor, "hp", x, y);
            };
        }
    }
};

// Initialize compatibility layer
MVCompatibility.initialize();
```

## Performance Considerations

Guidelines for efficient method aliasing:

```javascript
// INEFFICIENT: Creating closures in loops
for (let i = 0; i < $gameParty.members().length; i++) {
    const actor = $gameParty.members()[i];
    
    // This creates a new function for every iteration
    const _battler_gainHp = actor.gainHp;
    actor.gainHp = function(value) {
        _battler_gainHp.call(this, value);
        console.log("HP changed!");
    };
}

// EFFICIENT: Alias once at the prototype level
const _Game_Battler_gainHp = Game_Battler.prototype.gainHp;
Game_Battler.prototype.gainHp = function(value) {
    _Game_Battler_gainHp.call(this, value);
    console.log("HP changed!");
};

// INEFFICIENT: Excessive alias chaining
// Plugin A
const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    // Plugin A code
};

// Plugin B (creates nested call chain)
const _Scene_Map_update2 = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_update2.call(this);
    // Plugin B code
};

// EFFICIENT: Use hook system instead
const HookManager = {/* implementation */};

// Base alias only done once
const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    HookManager.executeHook('scene_map_update', this);
};

// Plugins use hooks instead of aliasing
HookManager.addHook('scene_map_update', function(scene) {
    // Plugin A code
});

HookManager.addHook('scene_map_update', function(scene) {
    // Plugin B code
});
```