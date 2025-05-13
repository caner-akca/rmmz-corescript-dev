# RPG Maker MZ - Core Game Loop Architecture

This document details the core game loop architecture in RPG Maker MZ, covering initialization, update cycle, scene management, and timing control that drive the entire game engine.

## Core Components

### Main Game Structure
- `SceneManager`: Controls scene flow and main update loop
- `Graphics`: Manages rendering and timing
- `Input`: Processes player input within the loop
- Scenes: Structured container objects for game states

## Initialization Process

### Engine Startup
```javascript
// Initial setup when game loads
window.addEventListener("load", function() {
    // Create the Graphics and PIXI renderer
    Graphics.initialize();
    Graphics.setTickHandler(SceneManager.update.bind(SceneManager));
    
    // Initialize core components
    Input.initialize();
    TouchInput.initialize();
    AudioManager.initialize();
    
    // Initialize game data
    DataManager.loadDatabase();
    ConfigManager.load();
    
    // Start the game loop
    SceneManager.run(Scene_Boot);
});
```

### Boot Sequence
```javascript
// Scene_Boot class
function Scene_Boot() {
    this.initialize(...arguments);
}

Scene_Boot.prototype = Object.create(Scene_Base.prototype);
Scene_Boot.prototype.constructor = Scene_Boot;

// Boot scene initialization
Scene_Boot.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
    this._startDate = Date.now();
};

// Boot scene creation process
Scene_Boot.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    DataManager.checkError();
    this.loadSystemImages();
    this.loadPlayerData();
    this.loadGameFonts();
};

// Start the actual game
Scene_Boot.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    
    // Ensure minimum loading time for splash
    if (Date.now() - this._startDate < 1000) {
        this.wait(1000 - (Date.now() - this._startDate));
    }
    
    // Check if player data exists
    if (DataManager.isAnySavefileExists()) {
        // Go to title screen
        SceneManager.goto(Scene_Title);
    } else {
        // Auto start with new game
        this.checkPlayerLocation();
        DataManager.setupNewGame();
        SceneManager.goto(Scene_Map);
    }
};
```

## Main Game Loop

### Game Loop Structure
```javascript
// Main game loop in SceneManager
SceneManager.update = function() {
    try {
        // Get frame timing
        const newTime = this._getTimeInMs();
        const fTime = (newTime - this._currentTime) / 1000;
        if (fTime > 0) {
            // Store new time
            this._accumulator += fTime;
            this._currentTime = newTime;
            
            // Run frame updates
            this._updateInputData();
            this._updateMain();
        }
    } catch (e) {
        this.catchException(e);
    }
};

// Main update logic
SceneManager._updateMain = function() {
    // Calculate how many game ticks to process (for steady timing)
    const maxTicks = Math.floor(this._accumulator / this._tickLength);
    for (let i = 0; i < maxTicks; i++) {
        this._updateGameTick();
        this._accumulator -= this._tickLength;
    }
    
    // Update graphics with remaining accumulator time
    this._updateRender(this._accumulator / this._tickLength);
};

// Update single game tick
SceneManager._updateGameTick = function() {
    // Update InputManager
    Input.update();
    TouchInput.update();
    
    // Update AudioManager
    if (this._shouldUpdateAudio()) {
        AudioManager.update();
    }
    
    // Update all game objects
    if (this._scene) {
        this._scene.updateGameTick();
    }
    
    // Check for scene transitions
    this._updateScene();
};

// Render the current state
SceneManager._updateRender = function(deltaTime) {
    if (this._scene) {
        // Handle scene transitions with smooth rendering
        if (this._transitionProgress > 0) {
            this._updateTransition();
        }
        
        // Render the scene
        Graphics.render(this._scene);
    }
};
```

### Fixed Timestep Implementation
```javascript
// Setting up fixed timestep variables
SceneManager.initialize = function() {
    this._scene = null;
    this._nextScene = null;
    this._stack = [];
    this._exiting = false;
    
    // Fixed timestep variables
    this._currentTime = 0;
    this._accumulator = 0;
    this._tickLength = 1.0 / 60.0; // 60 fps target
};

// Get current time in milliseconds
SceneManager._getTimeInMs = function() {
    return performance.now();
};

// Start the game loop
SceneManager.run = function(sceneClass) {
    try {
        this.initialize();
        this.goto(sceneClass);
        
        // Get initial time
        this._currentTime = this._getTimeInMs();
        this._accumulator = 0;
        
        // Start the game loop
        Graphics.startGameLoop();
    } catch (e) {
        this.catchException(e);
    }
};
```

## Scene Management in Game Loop

### Scene Processing
```javascript
// Process scene change during update
SceneManager._updateScene = function() {
    if (this._scene.isSceneChangeOk()) {
        if (this._nextScene) {
            if (this._nextScene.isReady()) {
                this._sceneStarted = false;
                this._scene.terminate();
                this._previousScene = this._scene;
                this._scene = this._nextScene;
                this._nextScene = null;
            }
        } else if (this._exiting) {
            this.terminate();
        }
    }
};

// Change to a different scene
SceneManager.goto = function(sceneClass) {
    if (sceneClass) {
        // Create the new scene
        this._nextScene = new sceneClass();
        
        // Handle scene transitions
        if (this._scene) {
            if (this._nextScene.needsFadeIn()) {
                this._nextScene.startFadeIn();
            }
            if (this._scene.needsFadeOut()) {
                this._scene.startFadeOut();
            }
        }
    }
};

// Push scene to stack and go to a new scene
SceneManager.push = function(sceneClass) {
    if (this._scene) {
        this._stack.push(this._scene.constructor);
    }
    this.goto(sceneClass);
};

// Pop scene from stack and return to previous scene
SceneManager.pop = function() {
    if (this._stack.length > 0) {
        this.goto(this._stack.pop());
    } else {
        this.exit();
    }
};
```

### Scene Lifecycle in Game Loop
```javascript
// Scene_Base update methods
Scene_Base.prototype.update = function() {
    this.updateFade();
    this.updateChildren();
    
    // Handle automatic timeout transitions
    if (this._fadeSign > 0 && this._fadeOpacity === 255) {
        this.onFadeIn();
    } else if (this._fadeSign < 0 && this._fadeOpacity === 0) {
        this.onFadeOut();
    }
};

// Update during a game tick in the fixed timestep
Scene_Base.prototype.updateGameTick = function() {
    this.update();
};

// Check if ready for scene transition
Scene_Base.prototype.isSceneChangeOk = function() {
    if (this._fadeDuration > 0) {
        // Don't change during a fade transition
        return false;
    }
    return true;
};

// Start a scene when it's ready
Scene_Base.prototype.start = function() {
    this._started = true;
    this._active = true;
};

// Terminate a scene when leaving
Scene_Base.prototype.terminate = function() {
    this._active = false;
};
```

## Input Processing in Game Loop

### Input Update Cycle
```javascript
// Update input at the start of each frame
SceneManager._updateInputData = function() {
    // Update all input states
    Input.update();
    TouchInput.update();
};

// Main Input update function
Input.update = function() {
    // Current and previous state tracking
    this._lastGamepad = this._gamepad;
    this._gamepad = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    
    // Clear states and update from devices
    this._latestButton = null;
    this._updateGamepadState();
    this._updateKeyState();
    
    // Process directional inputs
    this._updateDirection();
};

// Check for triggering a button
Input.isTriggered = function(keyName) {
    if (this._isEscapeCompatible(keyName) && this.isTriggered("escape")) {
        return true;
    } else {
        return this._latestButton === keyName && this._pressedTime === 0;
    }
};

// Check for repeating a button hold
Input.isRepeated = function(keyName) {
    if (this._isEscapeCompatible(keyName) && this.isRepeated("escape")) {
        return true;
    } else {
        return (
            (this._latestButton === keyName &&
                this._pressedTime >= this.keyRepeatWait &&
                this._pressedTime % this.keyRepeatInterval === 0) ||
            this._pressedTime === 0 && this._latestButton === keyName
        );
    }
};
```

### Touch Input Handling
```javascript
// Update touch input state
TouchInput.update = function() {
    this._triggered = this._createTrigger();
    this._cancelled = this._createCancel();
    this._moved = this._createMove();
    this._released = this._createRelease();
    this._wheelX = this._createScrollX();
    this._wheelY = this._createScrollY();
    this._states = {};
};

// Check for a touch/click press
TouchInput.isPressed = function() {
    return this._mousePressed || this._screenPressed;
};

// Check for a triggered touch/click
TouchInput.isTriggered = function() {
    return this._triggered;
};

// Check for movement during touch
TouchInput.isMoved = function() {
    return this._moved;
};

// Get current position
TouchInput.x = function() {
    return this._x;
};

TouchInput.y = function() {
    return this._y;
};
```

## Game Timing Control

### Frame Rate Management
```javascript
// Create FPS counter
Graphics._createFPSCounter = function() {
    this._fpsMeter = new FPSMeter({
        decimals: 0,
        graph: true,
        theme: "transparent",
        left: "auto",
        right: "5px",
        position: "fixed"
    });
    this._fpsMeter.hide();
};

// Measure current FPS
Graphics._updateFPSCounter = function() {
    if (this._fpsMeter) {
        this._fpsMeter.tick();
    }
};

// Show or hide FPS meter
Graphics.showFps = function() {
    if (this._fpsMeter) {
        this._fpsMeter.show();
    }
};

Graphics.hideFps = function() {
    if (this._fpsMeter) {
        this._fpsMeter.hide();
    }
};

// Set target frame rate
Graphics.setFrameLimit = function(limit) {
    this._maxFps = Math.max(1, limit);
};

// Get performance measurement
Graphics.averageFps = function() {
    if (this._fpsMeter) {
        return this._fpsMeter.fps;
    }
    return 0;
};
```

### Time Management
```javascript
// In-game timer system
Game_Timer.prototype.update = function(sceneActive) {
    if (sceneActive && this._working && this._frames > 0) {
        this._frames--;
        if (this._frames === 0) {
            this.onExpire();
        }
    }
};

// Set a timer in frames
Game_Timer.prototype.start = function(count) {
    this._frames = count;
    this._working = true;
};

// Stop the timer
Game_Timer.prototype.stop = function() {
    this._working = false;
};

// Process when timer expires
Game_Timer.prototype.onExpire = function() {
    BattleManager.abort();
};

// Get current time in seconds
Game_Timer.prototype.seconds = function() {
    return Math.floor(this._frames / 60);
};
```

### Game Time vs. Real Time
```javascript
// Track in-game playtime
Game_System.prototype.updatePlaytime = function() {
    // Only update if not paused
    if (this._framesOnPause <= 0) {
        this._playtime += 1;
    }
};

// Format playtime for display
Game_System.prototype.playtimeText = function() {
    const hour = Math.floor(this._playtime / 60 / 60);
    const min = Math.floor(this._playtime / 60) % 60;
    const sec = this._playtime % 60;
    return hour.padZero(2) + ":" + min.padZero(2) + ":" + sec.padZero(2);
};

// Wait specific frames (blocking the event interpreter)
Game_Interpreter.prototype.wait = function(duration) {
    this._waitCount = duration;
};

// Update wait count during interpreter update
Game_Interpreter.prototype.updateWait = function() {
    if (this._waitCount > 0) {
        this._waitCount--;
        return true;
    }
    return false;
};
```

## Performance Optimization in Game Loop

### Update Throttling
```javascript
// Skip rendering frames when not needed
Graphics.render = function(stage) {
    if (this._skipCount <= 0) {
        // Only render when needed
        if (stage) {
            this._renderer.render(stage);
        }
        this._skipCount = 0;
    } else {
        // Skip this frame for performance
        this._skipCount--;
    }
    this.frameCount++;
};

// Determine if need to skip frames
Graphics._updateSkip = function() {
    const now = Date.now();
    const elapsed = now - this._lastUpdate;
    
    // Target milliseconds per frame
    const targetFPS = this._maxFps || 60;
    const targetFrameTime = 1000 / targetFPS;
    
    // Skip frames if falling behind
    if (elapsed > targetFrameTime * 3) {
        // Calculate how many frames to skip
        this._skipCount = Math.min(Math.floor(elapsed / targetFrameTime), 3);
    }
    
    this._lastUpdate = now;
};
```

### Frame Rate Adjustment
```javascript
// Dynamic frame rate adjustment based on performance
Graphics._updateRealScale = function() {
    if (this._realtimeTarget) {
        const elapsed = performance.now() - this._lastRenderUpdate;
        
        // Too slow, reduce rendering quality
        if (elapsed > 150) {
            const newScale = Math.max(this._realScale - 0.1, 0.5);
            this._realScale = newScale;
        }
        // Fast enough, increase quality
        else if (elapsed < 35 && this._realScale < 1.0) {
            this._realScale = Math.min(this._realScale + 0.05, 1.0);
        }
    }
    
    // Apply scaling
    this._renderer.resolution = this._realScale;
};

// Limit rendering to needed instances
SceneManager._updateScene = function() {
    // Only render when active or changing scenes
    if (this._scene.isActive() || this._nextScene) {
        // Handle scene change
        if (this._scene.isSceneChangeOk()) {
            this._changeScene();
        }
        
        // Request rendering
        Graphics.requestRender();
    }
};
```

### Battery and Performance Modes
```javascript
// Enable battery saving mode
Graphics.enableLowPowerMode = function() {
    this._lowPowerMode = true;
    this._skipCount = 2; // Render only 1/3 of frames
    this._maxFps = 30;
};

// Disable battery saving mode
Graphics.disableLowPowerMode = function() {
    this._lowPowerMode = false;
    this._skipCount = 0;
    this._maxFps = 60;
};

// Check if using low power mode
Graphics.isLowPowerMode = function() {
    return this._lowPowerMode;
};

// Handle being in background
document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        // Reduce updates when tab is in background
        Graphics.enableLowPowerMode();
    } else {
        // Full speed in foreground
        Graphics.disableLowPowerMode();
    }
});
```

## Error Handling in Game Loop

### Exception Catching
```javascript
// Catching errors during game loop
SceneManager.catchException = function(e) {
    if (e instanceof Error) {
        this.catchNormalError(e);
    } else if (e instanceof Array && e[0] === "LoadError") {
        this.catchLoadError(e);
    } else {
        this.catchUnknownError(e);
    }
    this.stop();
};

// Handle normal JavaScript errors
SceneManager.catchNormalError = function(e) {
    Graphics.printError("Error", e.message);
    console.error(e.stack);
    AudioManager.stopAll();
    
    // Show error screen
    this.displayErrorScreen();
};

// Handle resource loading errors
SceneManager.catchLoadError = function(e) {
    const url = e[1];
    Graphics.printError("Failed to load", url);
    console.error("Failed to load: " + url);
    AudioManager.stopAll();
    
    // Show error screen
    this.displayErrorScreen();
};

// Display error screen
SceneManager.displayErrorScreen = function() {
    // Create error sprite
    const bitmap = new Bitmap(Graphics.width, Graphics.height);
    const x = Graphics.width / 2;
    const y = Graphics.height / 2;
    const width = Graphics.width - 8;
    const height = Graphics.height - 8;
    
    // Draw error background
    bitmap.fillRect(4, 4, width, height, "#000000");
    
    // Draw error text
    bitmap.drawText("Error Occurred", 0, y - 60, width, 30, "center");
    bitmap.drawText("See the console for details", 0, y - 30, width, 30, "center");
    bitmap.drawText("Press F5 to restart", 0, y, width, 30, "center");
    
    // Create and show the error sprite
    const sprite = new Sprite(bitmap);
    sprite.opacity = 210;
    this._errorSprite = sprite;
    Graphics.setErrorScreen(sprite);
};
```

### Error Recovery
```javascript
// Auto-recover from WebGL errors
Graphics._restoreWebGLContext = function() {
    if (this._renderer && this._renderer.context && this._renderer.context.isContextLost()) {
        if (this._webglContextRestored) {
            // Only try once
            return;
        }
        
        try {
            // Recreate the renderer
            this._renderer.context.restoreContext();
            this._webglContextRestored = true;
        } catch (e) {
            // Failed to restore, log error
            console.error("Failed to restore WebGL context:", e);
        }
    }
};

// Handle WebGL context loss
Graphics._onWebGLContextLost = function(event) {
    event.preventDefault();
    this._webglContextLost = true;
    
    // Notify with a warning
    console.warn("WebGL context lost");
    
    // Schedule recovery attempt
    setTimeout(this._restoreWebGLContext.bind(this), 500);
};

// Re-initialize after context restoral
Graphics._onWebGLContextRestored = function() {
    this._webglContextLost = false;
    this._webglContextRestored = true;
    
    // Reinitialize all textures
    if (this._renderer) {
        this._renderer.destroy();
    }
    
    // Create new renderer with restored context
    this._createRenderer();
    this._rendererReady = true;
    
    // Reload all textures and reinitialize scene
    ImageManager.reload();
    SceneManager.reloadCurrentScene();
};
```

## Game State Management

### Save/Load Integration
```javascript
// Autosave in game loop
SceneManager.updateAutosave = function() {
    if ($gameSystem && $gameSystem.isAutosaveEnabled() && this._lastAutosaveTime + 300000 < Date.now()) {
        this._lastAutosaveTime = Date.now();
        $gameSystem.onBeforeSave();
        DataManager.saveGame(0); // Autosave to slot 0
    }
};

// Save game data
DataManager.saveGame = function(savefileId) {
    try {
        StorageManager.backup(savefileId);
        
        // Save game contents
        const json = JsonEx.stringify(this.makeSaveContents());
        StorageManager.save(savefileId, json);
        this._lastAccessedId = savefileId;
        
        // Save global info
        const globalInfo = this.loadGlobalInfo() || [];
        globalInfo[savefileId] = this.makeSavefileInfo();
        this.saveGlobalInfo(globalInfo);
        
        return true;
    } catch (e) {
        console.error(e);
        try {
            StorageManager.remove(savefileId);
            StorageManager.restoreBackup(savefileId);
        } catch (e2) {
            // Silent catch
        }
        return false;
    }
};

// Load game data
DataManager.loadGame = function(savefileId) {
    try {
        const json = StorageManager.load(savefileId);
        const contents = JsonEx.parse(json);
        
        // Extract game data
        this.extractSaveContents(contents);
        
        // Prepare map data
        this.correctDataErrors();
        
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};
```

### Pause and Resume
```javascript
// Game state management for pause/resume
Scene_Map.prototype.stop = function() {
    Scene_Message.prototype.stop.call(this);
    
    // Save player location and trigger autosave
    $gamePlayer.straighten();
    $gameMap.updateInterpreter();
    this._spriteset.update();
    
    if ($gameSystem.isAutosaveEnabled() && !SceneManager.isNextScene(Scene_Battle)) {
        DataManager.autoSaveGame();
    }
};

// Resume from pause
Scene_Map.prototype.start = function() {
    Scene_Message.prototype.start.call(this);
    
    // Resume scene elements
    this._spriteset.refresh();
    this.startEncounterEffect();
    this.startFadeIn(this.fadeSpeed(), false);
};

// Window focus/blur events
window.addEventListener("focus", () => {
    // Resume when window gets focus
    AudioManager.checkWebAudioUnlocked();
    
    // Resume timers
    if ($gameTimer) {
        $gameTimer.resume();
    }
});

window.addEventListener("blur", () => {
    // Pause timers when window loses focus
    if ($gameTimer) {
        $gameTimer.pause();
    }
});
```

## Main Scene Types

### Map Scene Loop
```javascript
// Map scene update
Scene_Map.prototype.update = function() {
    Scene_Message.prototype.update.call(this);
    
    // Update map elements
    if (!this.isBusy()) {
        this.updateMain();
    }
    
    // Check for scene transitions
    if (this.isSceneChangeOk()) {
        this.updateScene();
    }
    
    // Update encounter effects
    this.updateEncounterEffect();
};

// Main map update
Scene_Map.prototype.updateMain = function() {
    // Check game timer
    $gameTimer.update(this.isActive());
    
    // Update map displays
    $gameScreen.update();
    
    // Update player and map objects
    if (this.isActive()) {
        this.updateActiveElements();
    }
};

// Update active map elements
Scene_Map.prototype.updateActiveElements = function() {
    $gameMap.update(this.isActive());
    $gamePlayer.update(this.isActive());
    $gameTimer.update(this.isActive());
    
    // Update all game objects
    this._spriteset.update();
    this._mapNameWindow.update();
    this._windowLayer.update();
};
```

### Battle Scene Loop
```javascript
// Battle scene update
Scene_Battle.prototype.update = function() {
    // Inherited updates
    Scene_Message.prototype.update.call(this);
    
    // Update battle elements
    if (!this.isBusy()) {
        this.updateBattleProcess();
    }
    
    // Check for scene change
    if (this.isSceneChangeOk()) {
        this.updateScene();
    }
};

// Update battle process
Scene_Battle.prototype.updateBattleProcess = function() {
    // Skip if busy with windows
    if (this.isAnyInputWindowActive() || BattleManager.isAborting() || BattleManager.isBattleEnd()) {
        return;
    }
    
    // Process based on battle phase
    if (BattleManager.isInputting()) {
        // Handle player input
        this.startActorCommandSelection();
    } else if (BattleManager.isPhase("turn")) {
        // Process turn when ready
        BattleManager.processTurn();
    }
};

// BattleManager turn processing
BattleManager.processTurn = function() {
    // Change phase
    const subject = this._subject;
    
    // Handle end of turn
    const currentAction = subject.currentAction();
    if (!currentAction) {
        // End this battler's turn
        this.endAction();
        this._subject = this.getNextSubject();
    } else {
        // Process the next action
        this.startAction();
    }
};
```

### Menu Scene Loop
```javascript
// Menu scene update
Scene_Menu.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
    
    // Update windows
    this._commandWindow.update();
    this._goldWindow.update();
    this._statusWindow.update();
    
    // Check for scene change requests
    if (this._commandWindow.isOpenAndActive()) {
        // Process menu commands
        this.updateMenuCommand();
    }
};

// Command window update
Window_Command.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    
    // Process cursor selection
    if (this.isOpenAndActive()) {
        // Process input
        this.updateCursor();
        this.updateInput();
    }
};

// Menu command processing
Scene_Menu.prototype.updateMenuCommand = function() {
    // Check input to handle command selection
    if (Input.isTriggered("cancel")) {
        this.popScene();
    } else if (Input.isTriggered("ok")) {
        // Execute selected command
        const index = this._commandWindow.index();
        this.executeCommand(index);
    }
};
```

## Debugging and Testing

### Debug Mode
```javascript
// Initialize debug mode
SceneManager.initialize = function() {
    this._scene = null;
    this._nextScene = null;
    this._stack = [];
    this._exiting = false;
    this._debugMode = Utils.isOptionValid("test");
    
    this._screenWidth = Graphics.width;
    this._screenHeight = Graphics.height;
    this._boxWidth = Graphics.boxWidth;
    this._boxHeight = Graphics.boxHeight;
    
    this.initializeEffekseer();
};

// Check for debug mode
SceneManager.isDebugMode = function() {
    return this._debugMode;
};

// Show debug menu
Scene_Map.prototype.updateDebugMenu = function() {
    if (SceneManager.isDebugMode() && Input.isTriggered("debug")) {
        SceneManager.push(Scene_Debug);
    }
};

// Debug features activation
Graphics.debug = function(name, value) {
    if (SceneManager.isDebugMode()) {
        // Show debug values
        if (arguments.length === 2) {
            this._errorPrinter.style.display = "block";
            this._errorPrinter.innerHTML = this._makeDebugHtml(name, value);
        }
        // Hide debug display
        if (arguments.length === 0) {
            this._errorPrinter.style.display = "none";
        }
    }
};
```

### Performance Monitoring
```javascript
// Performance measurement
SceneManager.updatePerformanceMonitor = function() {
    if (this._debugMode) {
        this._perfFrameCount++;
        const now = Date.now();
        
        // Measure every second
        if (this._perfFrameCount === 180) {
            const elapsed = now - this._perfStart;
            this._perfFrameCount = 0;
            this._perfStart = now;
            
            // Calculate and log performance
            const averageFrameTime = elapsed / 180;
            const fps = 1000 / averageFrameTime;
            Graphics.debug("FPS", fps.toFixed(2));
        }
    }
};

// Draw performance information
Graphics._makeDebugHtml = function(name, value) {
    return (
        "<span style='color: #aaaaff'>" + 
        name + 
        "</span>: " + 
        String(value)
    );
};
```