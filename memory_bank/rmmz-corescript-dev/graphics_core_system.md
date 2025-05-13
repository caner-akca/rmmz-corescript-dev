# RPG Maker MZ - Graphics Core System

This document details the fundamental graphics architecture of RPG Maker MZ, focusing on the rendering infrastructure, PIXI.js integration, and the core rendering loop.

## Core Components

### Graphics Class
- Located in `rmmz_core/Graphics.js`
- Manages the game canvas and rendering context
- Initializes and maintains the PIXI.js renderer
- Controls the game screen size and scaling

### PIXI.js Integration
- RPG Maker MZ uses PIXI.js v5 as its WebGL/Canvas rendering engine
- Provides hardware-accelerated 2D graphics capabilities
- Enables advanced visual effects, filters, and optimized batch rendering

### Renderer Configuration
```javascript
// Initialize PIXI renderer
Graphics._createRenderer = function() {
    const options = { 
        view: this._canvas,
        width: this._width,
        height: this._height,
        transparent: this._transparent,
        autoDensity: true
    };
    
    try {
        // Try WebGL first
        this._renderer = new PIXI.Renderer(options);
    } catch (e) {
        // Fall back to Canvas renderer if WebGL not available
        this._renderer = new PIXI.CanvasRenderer(options);
    }
};

// Set renderer background color
Graphics._updateRenderScale = function() {
    const renderer = this._renderer;
    renderer.resolution = this._resourceResolution;
    renderer.resize(this._width, this._height);
};
```

## Rendering Loop

### Game Loop Implementation
```javascript
// Start the game loop
Graphics.startGameLoop = function() {
    if (!this._gameLoop) {
        this._gameLoop = new PIXI.Ticker();
        this._gameLoop.maxFPS = 60;
        this._gameLoop.add(this._onTick, this);
        this._gameLoop.start();
    }
};

// Ticker callback function
Graphics._onTick = function(deltaTime) {
    this._fpsCounter.startTick();
    this._tickHandler(deltaTime);
    this._fpsCounter.endTick();
};

// Main tick handler that triggers SceneManager update
Graphics._tickHandler = function() {
    SceneManager.update();
    this.render();
    if (this._isExitRequested) {
        this._gameLoop.stop();
    }
};
```

### Rendering Process
```javascript
// Render the current scene
Graphics.render = function(stage) {
    this._renderer.render(stage);
    this._needRender = false;
};

// Flag to optimize rendering (only render when needed)
Graphics.isNeedRender = function() {
    return this._needRender;
};

// Request a render on next frame
Graphics.requestRender = function() {
    this._needRender = true;
};
```

## Screen and Resolution Management

### Screen Size and Scaling
```javascript
// Default screen dimensions
Graphics._defaultWidth = 816;
Graphics._defaultHeight = 624;
Graphics._boxWidth = 816;
Graphics._boxHeight = 624;

// Update game screen size
Graphics.resize = function(width, height) {
    this._width = width;
    this._height = height;
    this._updateAllElements();
};

// Apply scaling for different screen sizes
Graphics._updateAllElements = function() {
    this._updateRealScale();
    this._updateErrorPrinter();
    this._updateCanvas();
    this._updateVideo();
    this._updateRenderer();
};
```

### Fullscreen Management
```javascript
// Request fullscreen mode
Graphics._requestFullScreen = function() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullScreen) {
        element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
};

// Exit fullscreen mode
Graphics._cancelFullScreen = function() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
};
```

## Performance Optimization

### FPS Management
```javascript
// FPS Counter implementation
Graphics._createFPSCounter = function() {
    this._fpsCounter = new FPSCounter();
};

// FPS Counter class
function FPSCounter() {
    this._fps = 0;
    this._frameCount = 0;
    this._lastTime = 0;
}

// Update FPS calculation
FPSCounter.prototype.startTick = function() {
    this._frameCount++;
    const now = Date.now();
    if (now - this._lastTime >= 1000) {
        this._fps = this._frameCount;
        this._frameCount = 0;
        this._lastTime = now;
    }
};

// Get current FPS
FPSCounter.prototype.fps = function() {
    return this._fps;
};
```

### Rendering Optimizations
```javascript
// Optimize rendering when game is idle or not in focus
Graphics._onTick = function(deltaTime) {
    if (document.visibilityState === "visible") {
        this._tickHandler(deltaTime);
    }
};

// Skip frames when performance issues are detected
Graphics._skipFrameThreshold = 100;  // ms
Graphics._skipCount = 0;

Graphics._updateSkipCount = function() {
    const currentTime = Date.now();
    const elapsed = currentTime - this._lastTime;
    
    // If a frame takes too long, skip some frames
    if (elapsed > this._skipFrameThreshold) {
        this._skipCount = Math.min(Math.floor(elapsed / 16) - 5, 10);
    }
    
    this._lastTime = currentTime;
};
```

## WebGL Support and Fallbacks

### WebGL Detection
```javascript
// Check for WebGL support
Graphics.hasWebGL = function() {
    try {
        const canvas = document.createElement("canvas");
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
    } catch (e) {
        return false;
    }
};

// Renderer initialization with fallback
Graphics._createRenderer = function() {
    const options = {
        view: this._canvas,
        width: this._width,
        height: this._height,
        transparent: this._transparent
    };
    
    try {
        // Try creating WebGL renderer
        this._renderer = new PIXI.Renderer(options);
    } catch (e) {
        // Fall back to Canvas renderer if WebGL fails
        options.forceCanvas = true;
        this._renderer = new PIXI.CanvasRenderer(options);
    }
};
```

### Hardware Acceleration Settings
```javascript
// Configuration to enable/disable hardware acceleration
Graphics.setRendererType = function(type) {
    if (type === "canvas") {
        this._rendererType = type;
    } else if (type === "webgl" && this.hasWebGL()) {
        this._rendererType = type;
    } else {
        this._rendererType = "auto";
    }
};

// Apply renderer preferences
Graphics._createRenderer = function() {
    const options = {
        view: this._canvas,
        width: this._width,
        height: this._height
    };
    
    // Apply renderer type preference
    if (this._rendererType === "canvas") {
        options.forceCanvas = true;
    }
    
    this._renderer = new PIXI.Renderer(options);
};
```

## Device Support

### Mobile Device Adaptations
```javascript
// Check if running on mobile device
Graphics.isMobileDevice = function() {
    return Utils.isMobileDevice();
};

// Apply mobile-specific optimizations
Graphics._createRenderer = function() {
    const options = {
        view: this._canvas,
        width: this._width,
        height: this._height
    };
    
    // Mobile optimizations
    if (this.isMobileDevice()) {
        options.powerPreference = "high-performance";
        options.antialias = false;
    }
    
    this._renderer = new PIXI.Renderer(options);
};
```

### Touch Input Support
```javascript
// Handle touch events for mobile
Graphics._setupEventHandlers = function() {
    window.addEventListener("resize", this._onWindowResize.bind(this));
    window.addEventListener("keydown", this._onKeyDown.bind(this));
    
    // Touch support
    if (Utils.isMobileDevice()) {
        this._canvas.addEventListener("touchstart", this._onTouchStart.bind(this));
        this._canvas.addEventListener("touchmove", this._onTouchMove.bind(this));
        this._canvas.addEventListener("touchend", this._onTouchEnd.bind(this));
        this._canvas.addEventListener("touchcancel", this._onTouchCancel.bind(this));
    }
};
```

## Error Handling

### Graphics Error Management
```javascript
// Create error handler display
Graphics._createErrorPrinter = function() {
    this._errorPrinter = document.createElement("div");
    this._errorPrinter.style.fontSize = "20px";
    this._errorPrinter.style.fontFamily = "Helvetica, Arial, sans-serif";
    this._errorPrinter.style.color = "#fff";
    this._errorPrinter.style.backgroundColor = "#444";
    this._errorPrinter.style.position = "absolute";
    this._errorPrinter.style.pointerEvents = "none";
    this._errorPrinter.style.zIndex = 99;
    this._errorPrinter.style.boxShadow = "black 0px 0px 8px";
    this._errorPrinter.style.whiteSpace = "pre-wrap";
    this._errorPrinter.style.padding = "10px";
    this._errorPrinter.style.opacity = 0;
    document.body.appendChild(this._errorPrinter);
};

// Display error message
Graphics.printError = function(name, message) {
    this._errorPrinter.innerHTML = this._makeErrorHtml(name, message);
    this._errorPrinter.style.opacity = 1;
    this._wasError = true;
};

// Create error HTML formatting
Graphics._makeErrorHtml = function(name, message) {
    return "<font color='yellow'><b>" + name + "</b></font><br>" + 
           "<font color='white'>" + message + "</font><br>";
};
```

## Graphics Context Restoration

### WebGL Context Loss Recovery
```javascript
// Handle WebGL context loss
Graphics._setupEventHandlers = function() {
    // ... other event listeners
    
    // WebGL context loss handling
    this._canvas.addEventListener("webglcontextlost", this._onWebGLContextLost.bind(this));
    this._canvas.addEventListener("webglcontextrestored", this._onWebGLContextRestored.bind(this));
};

// Context lost handler
Graphics._onWebGLContextLost = function(event) {
    event.preventDefault();
    this._wasWebGLContextLost = true;
};

// Context restored handler
Graphics._onWebGLContextRestored = function() {
    this._wasWebGLContextLost = false;
    PIXI.Texture.removeAll();  // Clear all texture references
    
    // Rebuild renderer
    this._createRenderer();
    
    // Ask scenes to reload resources
    SceneManager.reloadScene();
};
```