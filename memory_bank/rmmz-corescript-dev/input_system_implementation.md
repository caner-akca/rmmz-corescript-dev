# RPG Maker MZ - Input System Implementation

This document details the input system architecture in RPG Maker MZ, covering keyboard, touch, and gamepad input processing and how they integrate with the game.

## Core Components

### Input Class
- Located in `rmmz_core/Input.js`
- Handles keyboard and gamepad input
- Manages key state tracking and mapping
- Provides standardized input interface for game objects

### TouchInput Class
- Located in `rmmz_core/TouchInput.js`
- Manages mouse and touch input
- Tracks positions, movements, and gestures
- Normalizes touch and mouse events across platforms

## Key Input Implementation

### Input Initialization
```javascript
// Initialize input system
Input.initialize = function() {
    this.clear();
    this._wrapNwjsAlert();
    this._setupEventHandlers();
    this._updateDirection();
};

// Clear input states
Input.clear = function() {
    this._currentState = {};
    this._previousState = {};
    this._gamepadStates = [];
    this._latestButton = null;
    this._pressedTime = 0;
    this._dir4 = 0;
    this._dir8 = 0;
    this._preferredAxis = "";
    this._date = 0;
};
```

### Event Handler Setup
```javascript
// Set up event handlers
Input._setupEventHandlers = function() {
    document.addEventListener("keydown", this._onKeyDown.bind(this));
    document.addEventListener("keyup", this._onKeyUp.bind(this));
    window.addEventListener("blur", this._onLostFocus.bind(this));
};

// Handle key down events
Input._onKeyDown = function(event) {
    if (this._shouldPreventDefault(event.keyCode)) {
        event.preventDefault();
    }
    if (event.keyCode === 144) {    // Numlock
        this.clear();
    }
    const buttonName = this.keyMapper[event.keyCode];
    if (buttonName) {
        this._currentState[buttonName] = true;
    }
};

// Handle key up events
Input._onKeyUp = function(event) {
    const buttonName = this.keyMapper[event.keyCode];
    if (buttonName) {
        this._currentState[buttonName] = false;
    }
};
```

### Key Mapping System
```javascript
// Default key mapping
Input.keyMapper = {
    9: "tab",       // tab
    13: "ok",       // enter
    16: "shift",    // shift
    17: "control",  // control
    18: "control",  // alt
    27: "escape",   // escape
    32: "ok",       // space
    33: "pageup",   // pageup
    34: "pagedown", // pagedown
    37: "left",     // left arrow
    38: "up",       // up arrow
    39: "right",    // right arrow
    40: "down",     // down arrow
    45: "escape",   // insert
    81: "pageup",   // Q
    87: "pagedown", // W
    88: "escape",   // X
    90: "ok",       // Z
    96: "escape",   // numpad 0
    98: "down",     // numpad 2
    100: "left",    // numpad 4
    102: "right",   // numpad 6
    104: "up",      // numpad 8
    120: "debug"    // F9
};

// Game pad mapping
Input.gamepadMapper = {
    0: "ok",        // A
    1: "cancel",    // B
    2: "shift",     // X
    3: "menu",      // Y
    4: "pageup",    // LB
    5: "pagedown",  // RB
    12: "up",       // D-pad up
    13: "down",     // D-pad down
    14: "left",     // D-pad left
    15: "right",    // D-pad right
};
```

### Input State Management
```javascript
// Update input states
Input.update = function() {
    this._pollGamepads();
    if (this._latestButton) {
        this._pressedTime++;
    }
    this._updateDirection();
    this._updateGamepadState();
    this._previousState = this._currentState;
    this._currentState = {};
    
    // Copy gamepad input to current state
    for (const name in this._gamepadStates) {
        if (this._gamepadStates[name]) {
            this._currentState[name] = true;
        }
    }
    
    // Copy keyboard input to current state
    for (const name in this._keyboardState) {
        if (this._keyboardState[name]) {
            this._currentState[name] = true;
        }
    }
};

// Check if button is pressed
Input.isPressed = function(keyName) {
    return !!this._currentState[keyName];
};

// Check if button was just triggered
Input.isTriggered = function(keyName) {
    return this._currentState[keyName] && !this._previousState[keyName];
};

// Check if button is being repeated
Input.isRepeated = function(keyName) {
    if (this.isPressed(keyName)) {
        this._latestButton = keyName;
        this._pressedTime++;
        return (
            this._pressedTime === 1 ||
            (this._pressedTime >= this.keyRepeatWait &&
                this._pressedTime % this.keyRepeatInterval === 0)
        );
    } else {
        return false;
    }
};

// Check if button was just released
Input.isReleased = function(keyName) {
    return !this._currentState[keyName] && !!this._previousState[keyName];
};
```

### Directional Input Processing
```javascript
// Update 4-direction and 8-direction states
Input._updateDirection = function() {
    let x = this._signX();
    let y = this._signY();
    
    this._dir8 = this._makeNumpadDirection(x, y);
    this._dir4 = this._dir8 === 0 ? 0 : 2 * (this._dir8 - 1) % 8 + 1;
};

// Get 4-direction input (up, right, down, left)
Input.dir4 = function() {
    return this._dir4;
};

// Get 8-direction input (includes diagonals)
Input.dir8 = function() {
    return this._dir8;
};

// Convert x/y vectors to numpad-style direction
Input._makeNumpadDirection = function(x, y) {
    if (x === 0 && y === 0) {
        return 0;  // No direction
    } else if (x === 0 && y === -1) {
        return 8;  // Up
    } else if (x === 1 && y === -1) {
        return 9;  // Up-right
    } else if (x === 1 && y === 0) {
        return 6;  // Right
    } else if (x === 1 && y === 1) {
        return 3;  // Down-right
    } else if (x === 0 && y === 1) {
        return 2;  // Down
    } else if (x === -1 && y === 1) {
        return 1;  // Down-left
    } else if (x === -1 && y === 0) {
        return 4;  // Left
    } else if (x === -1 && y === -1) {
        return 7;  // Up-left
    }
    return 0;
};
```

## Touch Input Implementation

### TouchInput Initialization
```javascript
// Initialize touch input system
TouchInput.initialize = function() {
    this.clear();
    this._setupEventHandlers();
};

// Clear touch input states
TouchInput.clear = function() {
    this._mousePressed = false;
    this._screenPressed = false;
    this._pressedTime = 0;
    this._clicked = false;
    this._newState = this._createNewState();
    this._currentState = this._createNewState();
    this._x = 0;
    this._y = 0;
    this._triggerX = 0;
    this._triggerY = 0;
    this._moved = false;
    this._date = 0;
};
```

### Touch/Mouse Event Handlers
```javascript
// Set up event listeners
TouchInput._setupEventHandlers = function() {
    const isSupportPassive = Utils.isSupportPassiveEvent();
    const passive = isSupportPassive ? { passive: false } : false;
    
    document.addEventListener("mousedown", this._onMouseDown.bind(this));
    document.addEventListener("mousemove", this._onMouseMove.bind(this));
    document.addEventListener("mouseup", this._onMouseUp.bind(this));
    document.addEventListener("touchstart", this._onTouchStart.bind(this), passive);
    document.addEventListener("touchmove", this._onTouchMove.bind(this), passive);
    document.addEventListener("touchend", this._onTouchEnd.bind(this));
    document.addEventListener("touchcancel", this._onTouchCancel.bind(this));
    document.addEventListener("pointerdown", this._onPointerDown.bind(this));
    window.addEventListener("blur", this._onLostFocus.bind(this));
};

// Handle mouse down events
TouchInput._onMouseDown = function(event) {
    // Only trigger if left button is pressed
    if (event.button === 0) {
        this._onLeftButtonDown(event);
    } else if (event.button === 1) {
        this._onMiddleButtonDown(event);
    } else if (event.button === 2) {
        this._onRightButtonDown(event);
    }
};

// Handle left mouse button events
TouchInput._onLeftButtonDown = function(event) {
    const x = Graphics.pageToCanvasX(event.pageX);
    const y = Graphics.pageToCanvasY(event.pageY);
    
    if (Graphics.isInsideCanvas(x, y)) {
        this._mousePressed = true;
        this._pressedTime = 0;
        this._onPressed(x, y);
    }
};

// Handle touch start events
TouchInput._onTouchStart = function(event) {
    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const x = Graphics.pageToCanvasX(touch.pageX);
        const y = Graphics.pageToCanvasY(touch.pageY);
        
        if (Graphics.isInsideCanvas(x, y)) {
            event.preventDefault();
            this._screenPressed = true;
            this._pressedTime = 0;
            this._onPressed(x, y);
            break;
        }
    }
};
```

### Touch/Mouse State Management
```javascript
// Update touch states
TouchInput.update = function() {
    this._currentState = this._newState;
    this._newState = this._createNewState();
    this._updateTimer();
};

// Create a new state object
TouchInput._createNewState = function() {
    return {
        triggered: false,
        cancelled: false,
        moved: false,
        released: false,
        wheelX: 0,
        wheelY: 0
    };
};

// Check if screen is being touched/clicked
TouchInput.isPressed = function() {
    return this._mousePressed || this._screenPressed;
};

// Check if touch/click was just triggered
TouchInput.isTriggered = function() {
    return this._currentState.triggered;
};

// Check if touch/click was just released
TouchInput.isReleased = function() {
    return this._currentState.released;
};

// Check if touch/click was cancelled
TouchInput.isCancelled = function() {
    return this._currentState.cancelled;
};

// Check if touch has moved
TouchInput.isMoved = function() {
    return this._currentState.moved;
};

// Get the current X position
TouchInput.x = function() {
    return this._x;
};

// Get the current Y position
TouchInput.y = function() {
    return this._y;
};
```

### Gesture Recognition
```javascript
// Update timer for long press detection
TouchInput._updateTimer = function() {
    if (this._pressedTime >= 0) {
        if (this.isPressed()) {
            this._pressedTime++;
        } else {
            this._pressedTime = -1;
        }
    }
};

// Check for long press
TouchInput.isLongPressed = function() {
    return this._pressedTime >= this.keyRepeatWait;
};

// Reset moved flag when releasing
TouchInput._onMouseUp = function(event) {
    if (event.button === 0) {
        const x = Graphics.pageToCanvasX(event.pageX);
        const y = Graphics.pageToCanvasY(event.pageY);
        this._mousePressed = false;
        this._onReleased(x, y);
    }
};

// Handle touch move events
TouchInput._onTouchMove = function(event) {
    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const x = Graphics.pageToCanvasX(touch.pageX);
        const y = Graphics.pageToCanvasY(touch.pageY);
        
        this._onMoved(x, y);
    }
};
```

## Gamepad Input Implementation

### Gamepad Detection
```javascript
// Poll for connected gamepads
Input._pollGamepads = function() {
    if (navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        if (gamepads) {
            for (const gamepad of gamepads) {
                if (gamepad && gamepad.connected) {
                    this._updateGamepadState(gamepad);
                }
            }
        }
    }
};

// Update gamepad state
Input._updateGamepadState = function(gamepad) {
    const lastState = this._gamepadStates[gamepad.index] || [];
    const newState = [];
    
    // Process button inputs
    const buttons = gamepad.buttons;
    for (let i = 0; i < buttons.length; i++) {
        newState[i] = buttons[i].pressed;
    }
    
    // Process axes (analog sticks)
    const axes = gamepad.axes;
    if (axes[0] < -0.5) {
        newState[14] = true;    // Left
    }
    if (axes[0] > 0.5) {
        newState[15] = true;    // Right
    }
    if (axes[1] < -0.5) {
        newState[12] = true;    // Up
    }
    if (axes[1] > 0.5) {
        newState[13] = true;    // Down
    }
    
    // Map gamepad buttons to input names
    for (let j = 0; j < newState.length; j++) {
        if (newState[j] && !lastState[j]) {
            const buttonName = this.gamepadMapper[j];
            if (buttonName) {
                this._currentState[buttonName] = true;
            }
        }
    }
    
    this._gamepadStates[gamepad.index] = newState;
};
```

### Vibration Feedback API
```javascript
// Vibrate gamepad if supported
Input.vibrate = function(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
    
    // Try gamepad vibration if available
    if (navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        if (gamepads) {
            for (const gamepad of gamepads) {
                if (gamepad && gamepad.connected && gamepad.vibrationActuator) {
                    gamepad.vibrationActuator.playEffect("dual-rumble", {
                        startDelay: 0,
                        duration: 100,
                        weakMagnitude: 0.5,
                        strongMagnitude: 0.5
                    });
                }
            }
        }
    }
};
```

## Input Configuration System

### Key Remapping
```javascript
// Change key mapping
Input.changeKeyMapping = function(keyCode, buttonName) {
    this.keyMapper[keyCode] = buttonName;
};

// Set up default key mappings
Input.setupDefaultKeyMapping = function() {
    this.keyMapper = {
        9: "tab",       // tab
        13: "ok",       // enter
        16: "shift",    // shift
        17: "control",  // control
        18: "control",  // alt
        27: "escape",   // escape
        // ... other defaults
    };
};

// Load custom key mappings from config
Input.loadKeyConfig = function(config) {
    if (config && config.keyMapper) {
        for (const keyCode in config.keyMapper) {
            this.keyMapper[keyCode] = config.keyMapper[keyCode];
        }
    }
};

// Save current key mappings to config
Input.saveKeyConfig = function() {
    const config = {
        keyMapper: this.keyMapper,
        gamepadMapper: this.gamepadMapper
    };
    return config;
};
```

## Cross-Platform Input Handling

### Mobile-Specific Adaptations
```javascript
// Adjust for mobile platforms
TouchInput._setupEventHandlers = function() {
    const isSupportPassive = Utils.isSupportPassiveEvent();
    const passive = isSupportPassive ? { passive: false } : false;
    
    document.addEventListener("mousedown", this._onMouseDown.bind(this));
    document.addEventListener("mousemove", this._onMouseMove.bind(this));
    document.addEventListener("mouseup", this._onMouseUp.bind(this));
    document.addEventListener("wheel", this._onWheel.bind(this));
    document.addEventListener("touchstart", this._onTouchStart.bind(this), passive);
    document.addEventListener("touchmove", this._onTouchMove.bind(this), passive);
    document.addEventListener("touchend", this._onTouchEnd.bind(this));
    document.addEventListener("touchcancel", this._onTouchCancel.bind(this));
    
    // Add pointer events for Surface and similar devices
    document.addEventListener("pointerdown", this._onPointerDown.bind(this));
    
    // Prevent zooming on mobile platforms
    if (Utils.isMobileDevice()) {
        document.addEventListener("touchmove", this._onTouchMovePreventDefault.bind(this), passive);
    }
};

// Prevent default behavior to stop zooming
TouchInput._onTouchMovePreventDefault = function(event) {
    if (event.touches.length >= 2) {
        event.preventDefault();
    }
};
```

### Browser Compatibility Adjustments
```javascript
// Detect passive event support
Utils.isSupportPassiveEvent = function() {
    if (Utils._supportPassiveEvent === undefined) {
        Utils._supportPassiveEvent = false;
        try {
            const opts = Object.defineProperty({}, "passive", {
                get: function() {
                    Utils._supportPassiveEvent = true;
                }
            });
            window.addEventListener("test", null, opts);
            window.removeEventListener("test", null, opts);
        } catch (e) {
            // Browser doesn't support passive events
        }
    }
    return Utils._supportPassiveEvent;
};

// Internet Explorer compatibility detection
Input._setupEventHandlers = function() {
    document.addEventListener("keydown", this._onKeyDown.bind(this));
    document.addEventListener("keyup", this._onKeyUp.bind(this));
    
    // Use different event for IE
    if (Utils.isAnyVersionOfIE()) {
        window.addEventListener("blur", this._onLostFocusIE.bind(this));
    } else {
        window.addEventListener("blur", this._onLostFocus.bind(this));
    }
};
```

## Integration with Game Objects

### Player Movement Control
```javascript
// Game_Player movement based on input
Game_Player.prototype.moveByInput = function() {
    if (!this.isMoving() && this.canMove()) {
        let direction = this.getInputDirection();
        if (direction > 0) {
            this.executeMove(direction);
        }
    }
};

// Get input direction for player movement
Game_Player.prototype.getInputDirection = function() {
    return Input.dir4;
};

// Process player movement based on direction
Game_Player.prototype.executeMove = function(direction) {
    this.moveStraight(direction);
};
```

### Menu Navigation
```javascript
// Window base input handling
Window_Base.prototype.update = function() {
    Window.prototype.update.call(this);
    this.updateTone();
    this.updateOpen();
    this.updateClose();
    this.updateBackOpacity();
    this.updateInputData();
};

// Window selection input handling
Window_Selectable.prototype.updateInputData = function() {
    this._scrollX = this.origin.x;
    this._scrollY = this.origin.y;
    this._lastCursor = this._index;
    
    // Process input-based cursor movement
    if (this.isCursorMovable()) {
        if (Input.isRepeated("down")) {
            this.cursorDown(Input.isTriggered("down"));
        }
        if (Input.isRepeated("up")) {
            this.cursorUp(Input.isTriggered("up"));
        }
        if (Input.isRepeated("right")) {
            this.cursorRight(Input.isTriggered("right"));
        }
        if (Input.isRepeated("left")) {
            this.cursorLeft(Input.isTriggered("left"));
        }
        
        // Page navigation
        if (Input.isTriggered("pagedown")) {
            this.cursorPagedown();
        }
        if (Input.isTriggered("pageup")) {
            this.cursorPageup();
        }
    }
    
    // Process selection/cancellation
    if (this.isHandled("ok")) {
        if (Input.isTriggered("ok")) {
            this.processOk();
        }
    }
    if (this.isHandled("cancel")) {
        if (Input.isTriggered("cancel")) {
            this.processCancel();
        }
    }
};
```

### Touch UI Interaction
```javascript
// Check if touch is over a window
Window_Base.prototype.isHovered = function() {
    if (this.isMouseOver() && this.isOpen()) {
        return true;
    }
    return false;
};

// Check if touch/mouse is over window
Window_Base.prototype.isMouseOver = function() {
    return (
        TouchInput.x >= this.x &&
        TouchInput.x < this.x + this.width &&
        TouchInput.y >= this.y &&
        TouchInput.y < this.y + this.height
    );
};

// Handle touch input in selectable windows
Window_Selectable.prototype.processTouch = function() {
    if (TouchInput.isTriggered() && this.isMouseOver()) {
        const touchPos = this.getLocalTouchPos();
        const index = this.hitIndex(touchPos.x, touchPos.y);
        if (index >= 0) {
            this.select(index);
            if (this.isHoverEnabled() && TouchInput.isTriggered()) {
                this.processOk();
            }
        }
    }
};
```