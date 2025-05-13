# RPG Maker MZ - Debug Mode and Developer Tools

This document describes how to effectively use debug mode and developer tools when creating and testing plugins for RPG Maker MZ.

## Built-in Debug Features

### Accessing Test/Debug Mode

RPG Maker MZ provides a built-in test/debug mode that can be accessed in several ways:

1. **From the Editor**: Use the "Playtest" button or press F12
2. **From Command Line**: Add the `test` parameter to the URL or command line
   ```
   Game.exe test
   ```
   or in web browser:
   ```
   https://your-game-url.com/index.html?test
   ```

3. **Check for Debug Mode in Code**:
   ```javascript
   if (Utils.isOptionValid('test')) {
       // Debug-only code here
   }
   ```

### Debug Console

When in test mode, RPG Maker MZ provides a debug console that can be accessed by pressing F8:

- **Debug Console Features**:
  - Switch/Variable Control: Change game switches and variables
  - Teleport: Move to any map
  - Battle Test: Start battle with specific enemies
  - Items: Add or remove items from inventory
  - Actors: Modify actor stats and equipment

### Developer Features in Core Engine

Key developer features built into the engine:

- **FPS Display**: Press F2 to show/hide FPS counter
- **Display Stats**: Available in test mode (Graphics.printStats())
- **Screen Errors**: Engine displays errors directly on screen in test mode

## Browser Developer Tools

### Chrome/Firefox Developer Console

Access browser dev tools by pressing F12 in the browser:

- **Console Tab**: View JavaScript errors and log messages
- **Elements Tab**: Inspect and modify the HTML/CSS structure
- **Network Tab**: Monitor resource loading and timing
- **Sources Tab**: Set breakpoints and step through code
- **Performance Tab**: Profile performance bottlenecks
- **Memory Tab**: Identify memory leaks

### Console Logging Techniques

Effective use of console for debugging:

```javascript
// Basic logging
console.log('Variable value:', variableName);

// Formatted logging
console.log('%cImportant Message', 'color: red; font-weight: bold;', data);

// Object inspection
console.dir(complexObject);

// Grouping related logs
console.group('Battle Processing');
console.log('Action:', action);
console.log('Target:', target);
console.log('Result:', result);
console.groupEnd();

// Performance timing
console.time('Operation');
// ... code to measure ...
console.timeEnd('Operation');

// Stack trace
console.trace('Trace point');

// Conditional logging
console.assert(condition, 'This will log only if condition is false');

// Table format for arrays/objects
console.table(arrayOfObjects);
```

## Creating Custom Debug Tools

### Custom Debug Windows

Creating a debugging window in your plugin:

```javascript
// Create a debug window class
function Window_Debug() {
    this.initialize(...arguments);
}

Window_Debug.prototype = Object.create(Window_Base.prototype);
Window_Debug.prototype.constructor = Window_Debug;

Window_Debug.prototype.initialize = function(rect) {
    Window_Base.prototype.initialize.call(this, rect);
    this.opacity = 200;
    this.backOpacity = 200;
    this._data = [];
    this.refresh();
    
    // Only show in debug mode
    this.visible = Utils.isOptionValid('test');
};

Window_Debug.prototype.refresh = function() {
    this.contents.clear();
    this.drawTitle();
    this.drawData();
};

Window_Debug.prototype.drawTitle = function() {
    this.drawText('Debug Information', 0, 0, this.width - 40, 'center');
    this.drawHorzLine(32);
};

Window_Debug.prototype.drawData = function() {
    let y = 40;
    for (const item of this._data) {
        this.drawText(item.name + ':', 0, y, 200);
        this.drawText(String(item.value), 210, y, 200);
        y += 32;
    }
};

Window_Debug.prototype.drawHorzLine = function(y) {
    const lineY = y + this.lineHeight() / 2 - 1;
    this.contents.fillRect(0, lineY, this.contentsWidth(), 2, this.systemColor());
};

Window_Debug.prototype.setData = function(data) {
    this._data = data;
    this.refresh();
};

// Update data
Window_Debug.prototype.update = function() {
    Window_Base.prototype.update.call(this);
    this.updateData();
};

Window_Debug.prototype.updateData = function() {
    // Example: Update once per second
    if (Graphics.frameCount % 60 === 0) {
        this.setData([
            { name: 'FPS', value: Math.round(Graphics.averageFps()) },
            { name: 'Map ID', value: $gameMap ? $gameMap.mapId() : 0 },
            { name: 'Events', value: $gameMap ? $gameMap.events().length : 0 },
            { name: 'Player X', value: $gamePlayer ? $gamePlayer.x : 0 },
            { name: 'Player Y', value: $gamePlayer ? $gamePlayer.y : 0 }
        ]);
    }
};
```

### Integrating with Scene Classes

Adding debug windows to scenes:

```javascript
// Add debug window to Scene_Map
const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
Scene_Map.prototype.createAllWindows = function() {
    _Scene_Map_createAllWindows.call(this);
    
    if (Utils.isOptionValid('test')) {
        this.createDebugWindow();
    }
};

Scene_Map.prototype.createDebugWindow = function() {
    const rect = new Rectangle(10, 10, 400, 200);
    this._debugWindow = new Window_Debug(rect);
    this.addWindow(this._debugWindow);
};
```

### Debug Keyboard Shortcuts

Adding custom debug hotkeys:

```javascript
// Setup debug hotkeys
const _Scene_Map_updateDebugKeys = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_updateDebugKeys.call(this);
    
    if (Utils.isOptionValid('test')) {
        this.updateDebugKeys();
    }
};

Scene_Map.prototype.updateDebugKeys = function() {
    // Press D to toggle debug window
    if (Input.isTriggered('debug') || Input.isTriggered('d')) {
        if (this._debugWindow) {
            this._debugWindow.visible = !this._debugWindow.visible;
        }
    }
    
    // Press R to reload map
    if (Input.isTriggered('r')) {
        $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
    }
    
    // Press F to fill HP/MP
    if (Input.isTriggered('f')) {
        for (const actor of $gameParty.members()) {
            actor.setHp(actor.mhp);
            actor.setMp(actor.mmp);
        }
    }
};
```

## State Inspection Tools

### Game Object Inspection

Tools for examining game state:

```javascript
// Game state inspector
const GameInspector = {
    // Display variable info
    logVariables: function(pattern = null) {
        const variables = $gameVariables._data;
        const names = $dataSystem.variables;
        
        for (let i = 1; i < variables.length; i++) {
            if (variables[i] !== 0 && (!pattern || String(names[i]).match(pattern))) {
                console.log(`Variable ${i} (${names[i]}): ${variables[i]}`);
            }
        }
    },
    
    // Display switch info
    logSwitches: function(pattern = null) {
        const switches = $gameSwitches._data;
        const names = $dataSystem.switches;
        
        for (let i = 1; i < switches.length; i++) {
            if (switches[i] === true && (!pattern || String(names[i]).match(pattern))) {
                console.log(`Switch ${i} (${names[i]}): ON`);
            }
        }
    },
    
    // Display actor stats
    logActorStats: function(actorId) {
        const actor = $gameActors.actor(actorId);
        if (!actor) return;
        
        console.group(`Actor ${actorId}: ${actor.name()}`);
        console.log(`Level: ${actor.level}`);
        console.log(`HP: ${actor.hp}/${actor.mhp}`);
        console.log(`MP: ${actor.mp}/${actor.mmp}`);
        console.log('Parameters:');
        for (let i = 0; i < 8; i++) {
            console.log(`- ${TextManager.param(i)}: ${actor.param(i)}`);
        }
        console.log('Equipment:');
        for (const item of actor.equips()) {
            if (item) console.log(`- ${item.name}`);
        }
        console.groupEnd();
    },
    
    // Display map data
    logMapInfo: function() {
        console.group(`Map: ${$gameMap.mapId()} (${$dataMapInfos[$gameMap.mapId()].name})`);
        console.log(`Display: ${$gameMap.displayX()}, ${$gameMap.displayY()}`);
        console.log(`Size: ${$gameMap.width()}x${$gameMap.height()}`);
        console.log(`Tileset: ${$dataMap.tilesetId} (${$dataTilesets[$dataMap.tilesetId].name})`);
        console.log(`Events: ${$gameMap.events().length}`);
        console.groupEnd();
    },
    
    // Examine event info
    logEventInfo: function(eventId = null) {
        if (eventId) {
            // Log specific event
            const event = $gameMap.event(eventId);
            if (!event) return;
            
            console.group(`Event ${eventId}: ${event.event().name}`);
            console.log(`Position: ${event.x}, ${event.y}`);
            console.log(`Page: ${event._pageIndex + 1}`);
            console.log(`Moving: ${event.isMoving()}`);
            console.groupEnd();
        } else {
            // Log all events
            for (const event of $gameMap.events()) {
                console.log(`Event ${event.eventId()}: ${event.event().name} (${event.x}, ${event.y})`);
            }
        }
    }
};

// Add to debug menu
if (Utils.isOptionValid('test')) {
    // Add debug commands to menu
    const addDebugCommands = function(scene) {
        if (!scene._debugWindow) return;
        
        scene._debugWindow.addCommand('Log Variables', function() {
            GameInspector.logVariables();
        });
        
        scene._debugWindow.addCommand('Log Map', function() {
            GameInspector.logMapInfo();
        });
        
        scene._debugWindow.addCommand('Log Party', function() {
            for (const actor of $gameParty.members()) {
                GameInspector.logActorStats(actor.actorId());
            }
        });
    };
}
```

### Visual Data Display

Creating visual displays for debugging:

```javascript
// Visual data display
function Sprite_DebugInfo() {
    this.initialize(...arguments);
}

Sprite_DebugInfo.prototype = Object.create(Sprite.prototype);
Sprite_DebugInfo.prototype.constructor = Sprite_DebugInfo;

Sprite_DebugInfo.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._lastUpdate = 0;
    this._updateInterval = 15; // Update every 15 frames
    this.createBitmap();
    this.update();
};

Sprite_DebugInfo.prototype.createBitmap = function() {
    this.bitmap = new Bitmap(Graphics.width, 48);
    this.bitmap.fontSize = 14;
};

Sprite_DebugInfo.prototype.update = function() {
    Sprite.prototype.update.call(this);
    
    if (Graphics.frameCount - this._lastUpdate >= this._updateInterval) {
        this.refresh();
        this._lastUpdate = Graphics.frameCount;
    }
};

Sprite_DebugInfo.prototype.refresh = function() {
    this.bitmap.clear();
    
    const fps = Math.round(Graphics.averageFps());
    const memory = this.getMemoryInfo();
    const playerInfo = $gamePlayer ? `Map: ${$gameMap.mapId()} (${$gamePlayer.x}, ${$gamePlayer.y})` : 'No map';
    
    this.bitmap.textColor = this.getFpsColor(fps);
    this.bitmap.drawText(`FPS: ${fps}`, 4, 2, 120, 16);
    
    this.bitmap.textColor = ColorManager.normalColor();
    this.bitmap.drawText(memory, 130, 2, 300, 16);
    this.bitmap.drawText(playerInfo, 4, 22, 300, 16);
};

Sprite_DebugInfo.prototype.getMemoryInfo = function() {
    if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        const used = memory.usedJSHeapSize / 1024 / 1024;
        const total = memory.totalJSHeapSize / 1024 / 1024;
        return `Memory: ${Math.round(used * 10) / 10}MB / ${Math.round(total * 10) / 10}MB`;
    }
    return 'Memory: N/A';
};

Sprite_DebugInfo.prototype.getFpsColor = function(fps) {
    if (fps >= 55) return '#80ff80'; // Good FPS
    if (fps >= 30) return '#ffff80'; // Acceptable FPS
    return '#ff8080'; // Poor FPS
};

// Add to scenes
const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
Scene_Map.prototype.createDisplayObjects = function() {
    _Scene_Map_createDisplayObjects.call(this);
    
    if (Utils.isOptionValid('test')) {
        this._debugInfoSprite = new Sprite_DebugInfo();
        this.addChild(this._debugInfoSprite);
    }
};
```

## Plugin-Specific Debug Options

### Debug Parameter Options

Adding debug parameters to plugins:

```javascript
/*:
 * @param Debug Mode
 * @text Debug Settings
 * @default ---------------------------------
 * 
 * @param showDebugWindow
 * @parent Debug Mode
 * @text Show Debug Window
 * @desc Show the debug window when testing
 * @type boolean
 * @default true
 * 
 * @param debugLogLevel
 * @parent Debug Mode
 * @text Debug Log Level
 * @desc Level of detail for debug logging
 * @type select
 * @option None
 * @value 0
 * @option Errors Only
 * @value 1
 * @option Warnings and Errors
 * @value 2
 * @option All Debug Info
 * @value 3
 * @default 2
 */

// Usage in plugin
const parameters = PluginManager.parameters('MyPlugin');

// Parse debug parameters
const debugParams = {
    showDebugWindow: parameters.showDebugWindow === 'true',
    debugLogLevel: Number(parameters.debugLogLevel || 2)
};

// Debug logger
const DebugLogger = {
    ERROR: 1,
    WARNING: 2,
    INFO: 3,
    
    log: function(level, ...args) {
        if (debugParams.debugLogLevel >= level) {
            switch (level) {
                case this.ERROR:
                    console.error('[MyPlugin]', ...args);
                    break;
                case this.WARNING:
                    console.warn('[MyPlugin]', ...args);
                    break;
                case this.INFO:
                    console.log('[MyPlugin]', ...args);
                    break;
            }
        }
    },
    
    error: function(...args) {
        this.log(this.ERROR, ...args);
    },
    
    warn: function(...args) {
        this.log(this.WARNING, ...args);
    },
    
    info: function(...args) {
        this.log(this.INFO, ...args);
    }
};
```

### Debug Commands

Adding plugin commands specifically for testing:

```javascript
// Register debug plugin commands
PluginManager.registerCommand('MyPlugin', 'DebugRefreshCache', function(args) {
    if (!Utils.isOptionValid('test')) return;
    
    DebugLogger.info('Refreshing cache...');
    ImageManager.clear();
    AudioManager.stopAll();
    
    DebugLogger.info('Cache refreshed!');
});

PluginManager.registerCommand('MyPlugin', 'DebugDumpState', function(args) {
    if (!Utils.isOptionValid('test')) return;
    
    const targetFile = args.filename || 'gameState.json';
    
    // Create a simplified game state dump
    const stateDump = {
        system: {
            playtime: $gameSystem.playtimeText(),
            saveCount: $gameSystem.saveCount()
        },
        party: {
            gold: $gameParty.gold(),
            steps: $gameParty.steps(),
            members: $gameParty.members().map(actor => ({
                id: actor.actorId(),
                name: actor.name(),
                level: actor.level,
                hp: actor.hp,
                mp: actor.mp
            }))
        },
        map: {
            id: $gameMap.mapId(),
            name: $dataMapInfos[$gameMap.mapId()].name,
            events: $gameMap.events().length
        }
    };
    
    // In PC version, write to file
    if (Utils.isNwjs()) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), targetFile);
        
        fs.writeFileSync(filePath, JSON.stringify(stateDump, null, 4));
        DebugLogger.info('Game state written to', filePath);
    } else {
        // In browser, just log it
        console.group('Game State Dump');
        console.dir(stateDump);
        console.groupEnd();
    }
});
```

## Debug Mode Configuration

### Debug Config File

Using a debug configuration file:

```javascript
// Debug configuration
const DebugConfig = {
    configFile: 'debug_config.json',
    settings: {
        enabled: true,
        showFPS: true,
        logLevel: 2,
        autoSave: false,
        breakOnError: true,
        customParams: {}
    },
    
    // Load config
    load: function() {
        if (!Utils.isOptionValid('test')) return;
        
        if (Utils.isNwjs()) {
            try {
                const fs = require('fs');
                const path = require('path');
                const filePath = path.join(process.cwd(), this.configFile);
                
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath, { encoding: 'utf8' });
                    const config = JSON.parse(data);
                    this.settings = Object.assign(this.settings, config);
                    console.log('Debug config loaded');
                }
            } catch (e) {
                console.error('Failed to load debug config:', e);
            }
        } else {
            // Try loading from localStorage in browser
            try {
                const data = localStorage.getItem('RPGMZDebugConfig');
                if (data) {
                    const config = JSON.parse(data);
                    this.settings = Object.assign(this.settings, config);
                    console.log('Debug config loaded from localStorage');
                }
            } catch (e) {
                console.error('Failed to load debug config from localStorage:', e);
            }
        }
    },
    
    // Save config
    save: function() {
        if (!Utils.isOptionValid('test')) return;
        
        if (Utils.isNwjs()) {
            try {
                const fs = require('fs');
                const path = require('path');
                const filePath = path.join(process.cwd(), this.configFile);
                
                fs.writeFileSync(filePath, JSON.stringify(this.settings, null, 4));
                console.log('Debug config saved');
            } catch (e) {
                console.error('Failed to save debug config:', e);
            }
        } else {
            // Save to localStorage in browser
            try {
                localStorage.setItem('RPGMZDebugConfig', JSON.stringify(this.settings));
                console.log('Debug config saved to localStorage');
            } catch (e) {
                console.error('Failed to save debug config to localStorage:', e);
            }
        }
    }
};

// Load config at startup
if (Utils.isOptionValid('test')) {
    window.addEventListener('load', function() {
        DebugConfig.load();
    });
}
```

### Debug UI

Creating a debug settings UI:

```javascript
// Debug settings UI
function Scene_DebugSettings() {
    this.initialize(...arguments);
}

Scene_DebugSettings.prototype = Object.create(Scene_MenuBase.prototype);
Scene_DebugSettings.prototype.constructor = Scene_DebugSettings;

Scene_DebugSettings.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

Scene_DebugSettings.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createSettingsWindow();
};

Scene_DebugSettings.prototype.createSettingsWindow = function() {
    const rect = this.settingsWindowRect();
    this._settingsWindow = new Window_DebugSettings(rect);
    this._settingsWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._settingsWindow);
};

Scene_DebugSettings.prototype.settingsWindowRect = function() {
    const ww = Graphics.boxWidth;
    const wh = Graphics.boxHeight;
    const wx = 0;
    const wy = 0;
    return new Rectangle(wx, wy, ww, wh);
};

// Debug settings window
function Window_DebugSettings() {
    this.initialize(...arguments);
}

Window_DebugSettings.prototype = Object.create(Window_Command.prototype);
Window_DebugSettings.prototype.constructor = Window_DebugSettings;

Window_DebugSettings.prototype.initialize = function(rect) {
    Window_Command.prototype.initialize.call(this, rect);
    this.selectLast();
};

Window_DebugSettings.prototype.makeCommandList = function() {
    this.addCommand("Show FPS", "showFPS", true, DebugConfig.settings.showFPS);
    
    const logLevelText = ["None", "Errors Only", "Warnings & Errors", "All Debug Info"][DebugConfig.settings.logLevel];
    this.addCommand(`Log Level: ${logLevelText}`, "logLevel");
    
    this.addCommand("Auto Save", "autoSave", true, DebugConfig.settings.autoSave);
    this.addCommand("Break On Error", "breakOnError", true, DebugConfig.settings.breakOnError);
    
    this.addCommand("Save Settings", "save");
    this.addCommand("Reset Settings", "reset");
};

Window_DebugSettings.prototype.processOk = function() {
    const symbol = this.currentSymbol();
    
    switch (symbol) {
        case 'showFPS':
            DebugConfig.settings.showFPS = !DebugConfig.settings.showFPS;
            this.redrawCurrentItem();
            break;
        case 'logLevel':
            DebugConfig.settings.logLevel = (DebugConfig.settings.logLevel + 1) % 4;
            this.refresh();
            break;
        case 'autoSave':
            DebugConfig.settings.autoSave = !DebugConfig.settings.autoSave;
            this.redrawCurrentItem();
            break;
        case 'breakOnError':
            DebugConfig.settings.breakOnError = !DebugConfig.settings.breakOnError;
            this.redrawCurrentItem();
            break;
        case 'save':
            DebugConfig.save();
            break;
        case 'reset':
            DebugConfig.settings = {
                enabled: true,
                showFPS: true,
                logLevel: 2,
                autoSave: false,
                breakOnError: true,
                customParams: {}
            };
            this.refresh();
            break;
    }
};

// Add to debug menu
if (Utils.isOptionValid('test')) {
    const _Window_DebugCommand_makeCommandList = Window_DebugCommand.prototype.makeCommandList;
    Window_DebugCommand.prototype.makeCommandList = function() {
        _Window_DebugCommand_makeCommandList.call(this);
        
        this.addCommand('Debug Settings', 'debug_settings');
    };
    
    const _Scene_Debug_createCommandWindow = Scene_Debug.prototype.createCommandWindow;
    Scene_Debug.prototype.createCommandWindow = function() {
        _Scene_Debug_createCommandWindow.call(this);
        
        this._commandWindow.setHandler('debug_settings', this.commandDebugSettings.bind(this));
    };
    
    Scene_Debug.prototype.commandDebugSettings = function() {
        SceneManager.push(Scene_DebugSettings);
    };
}