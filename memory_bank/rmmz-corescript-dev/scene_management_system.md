# RPG Maker MZ - Scene Management System

The scene management system in RPG Maker MZ controls how different game screens are loaded, displayed, and transitioned between.

## Core Components

### SceneManager
- Located in `rmmz_managers/SceneManager.js`
- Controls the game scene stack and transitions
- Manages scene initialization and termination
- Handles the game loop for updates and rendering
- Deals with error handling and game resumption

### Scene Base Classes
- **Scene_Base**: Foundation for all scenes (`rmmz_scenes/Scene_Base.js`)
- **Scene_MenuBase**: Base for menu-type scenes (`rmmz_scenes/Scene_MenuBase.js`)
- **Scene_Message**: Base for scenes with message windows (`rmmz_scenes/Scene_Message.js`)

## Scene Lifecycle

A scene in RPG Maker MZ follows this lifecycle:

1. **Creation**: `SceneManager.push(Scene_Class)` is called
2. **Initialization**: `scene.initialize()` sets up basic properties
3. **Creation Phase**: `scene.create()` creates windows and visual elements
4. **Start Phase**: `scene.start()` begins scene activity
5. **Update Loop**: `scene.update()` runs repeatedly each frame
6. **Termination**: `scene.terminate()` when transitioning away
7. **Destruction**: Scene is removed and garbage collected

```javascript
// Typical scene implementation
class Scene_Custom extends Scene_Base {
    constructor() {
        super();
        this.initialize(...arguments);
    }

    initialize() {
        super.initialize();
        // Initialize properties
    }

    create() {
        super.create();
        // Create windows and sprites
        this.createBackgroundLayer();
        this.createWindowLayer();
        this.createCustomWindows();
    }

    start() {
        super.start();
        // Setup initial window states
        this.startFadeIn(this.fadeSpeed(), false);
    }

    update() {
        super.update();
        // Custom update logic
    }

    terminate() {
        super.terminate();
        // Cleanup if needed
    }
}
```

## Scene Navigation

### Scene Stack
RPG Maker MZ uses a scene stack system:
- **Push**: Add a new scene on top of the stack (previous scene is paused)
- **Pop**: Remove the current scene and return to the previous scene
- **Goto**: Replace the current scene with a new one

```javascript
// Push a scene (previous scene is preserved underneath)
SceneManager.push(Scene_Menu);

// Pop a scene (return to previous scene)
SceneManager.pop();

// Goto a scene (replace current scene completely)
SceneManager.goto(Scene_Map);
```

### Scene Transitions
Transitions between scenes include fade effects and potentially custom transitions:

```javascript
// Start a fade-in transition
this.startFadeIn(30, false); // 30 frames, no white fade

// Start a fade-out transition
this.startFadeOut(30, false); // 30 frames, no white fade

// Check if scene is ready to transition
if (this.isFaded()) {
    this.executeTransition();
}
```

## The Game Loop

### Main Update Cycle
The main game loop is controlled by SceneManager:

```javascript
// Core update loop (simplified)
SceneManager.updateMain = function() {
    try {
        this.updateFrameCount();
        this.updateInputData();
        this.updateEffekseer();
        this.updateScene();
        this.renderScene();
        this.requestUpdate();
    } catch (e) {
        this.onError(e);
    }
};
```

### Scene-specific Updates
Each scene handles its own update cycle:

```javascript
// Base scene update (simplified)
Scene_Base.prototype.update = function() {
    this.updateFade();     // Handle fade transitions
    this.updateChildren(); // Update all child objects
    
    // Additional custom updates
    this.updateCustomLogic();
};
```

## Scene Composition

### Layers and Containers
Scenes are organized in visual layers:

1. **Base Layer**: Background visuals
2. **Spriteset Layer**: Game world visuals (map, characters, etc.)
3. **Window Layer**: UI windows and interfaces
4. **Foreground Layer**: Overlays and effects

```javascript
// Creating layers
Scene_Base.prototype.createWindowLayer = function() {
    this._windowLayer = new WindowLayer();
    this._windowLayer.x = (Graphics.width - Graphics.boxWidth) / 2;
    this._windowLayer.y = (Graphics.height - Graphics.boxHeight) / 2;
    this.addChild(this._windowLayer);
};
```

### Adding Windows
Windows are added to the window layer:

```javascript
// Adding a window to the scene
Scene_Base.prototype.addWindow = function(window) {
    this._windowLayer.addChild(window);
};

// Creating a specific window
Scene_Menu.prototype.createCommandWindow = function() {
    const rect = this.commandWindowRect();
    this._commandWindow = new Window_MenuCommand(rect);
    this._commandWindow.setHandler("item", this.commandItem.bind(this));
    // Set up more command handlers...
    this.addWindow(this._commandWindow);
};
```

## Key Scenes and Flow

### Standard Game Flow
The normal flow of an RPG Maker MZ game:

1. **Scene_Boot**: Initial loading and setup
2. **Scene_Title**: Title screen
3. **Scene_Map**: Main gameplay on maps
4. **Scene_Battle**: Combat encounters
5. **Scene_Menu**: Main menu access
   - **Scene_Item/Skill/Equip/etc.**: Submenu screens
6. **Scene_Gameover**: Game over handling

```javascript
// Simplified initial boot sequence
SceneManager.goto(Scene_Boot);

// Boot scene transition to title
Scene_Boot.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    this.startNormalGame();
};

Scene_Boot.prototype.startNormalGame = function() {
    this.checkPlayerLocation();
    DataManager.setupNewGame();
    SceneManager.goto(Scene_Title);
};
```

## Custom Scene Development

### Creating a New Scene
Basic steps to create a custom scene:

1. Define a new scene class extending an appropriate base
2. Implement required methods (create, start, update)
3. Create any needed windows or sprites
4. Setup command handlers and transitions
5. Call the scene from where needed

```javascript
// Example custom scene
class Scene_Credits extends Scene_Base {
    constructor() {
        super();
        this.initialize(...arguments);
    }

    initialize() {
        super.initialize();
        this._credits = [
            "Game Director: Person A",
            "Art: Person B",
            "Music: Person C"
        ];
        this._creditIndex = 0;
        this._waitCount = 0;
    }

    create() {
        super.create();
        this.createBackground();
        this.createWindowLayer();
        this.createCreditWindow();
    }

    createCreditWindow() {
        const rect = this.creditWindowRect();
        this._creditWindow = new Window_Base(rect);
        this.addWindow(this._creditWindow);
        this.updateCreditText();
    }

    creditWindowRect() {
        const ww = Graphics.boxWidth * 0.8;
        const wh = Graphics.boxHeight * 0.2;
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = (Graphics.boxHeight - wh) / 2;
        return new Rectangle(wx, wy, ww, wh);
    }

    update() {
        super.update();
        this._waitCount++;
        if (this._waitCount >= 180) { // 3 seconds
            this._waitCount = 0;
            this.nextCredit();
        }
        if (Input.isTriggered("cancel")) {
            this.popScene();
        }
    }

    nextCredit() {
        this._creditIndex++;
        if (this._creditIndex >= this._credits.length) {
            this.popScene();
        } else {
            this.updateCreditText();
        }
    }

    updateCreditText() {
        this._creditWindow.contents.clear();
        const text = this._credits[this._creditIndex];
        const rect = this._creditWindow.innerRect;
        this._creditWindow.drawText(text, 0, rect.height / 2 - this._creditWindow.lineHeight() / 2, 
                                   rect.width, "center");
    }
}
```

### Using the Scene

```javascript
// Call the scene from a menu command
SceneManager.push(Scene_Credits);

// Or register it as a plugin command
PluginManager.registerCommand("YourPlugin", "ShowCredits", () => {
    SceneManager.push(Scene_Credits);
});
```