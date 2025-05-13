# RPG Maker MZ - Input System

The input system in RPG Maker MZ handles player input from keyboard, gamepad, and touch devices.

## Key Components

### Input
- Handles keyboard and gamepad input
- Maps physical inputs to logical game controls
- Tracks key states (pressed, released, repeated)
- Handles input configurations

### TouchInput
- Handles mouse and touch input
- Tracks coordinates and button states
- Manages long press and pinch-to-zoom gestures
- Provides trigger and repeat functionality similar to keyboard

## Input Mapping

RPG Maker MZ defines standard input controls:

```javascript
// Default key mappings
Input.keyMapper = {
    9: 'tab',       // Tab
    13: 'ok',       // Enter
    16: 'shift',    // Shift
    17: 'control',  // Control
    18: 'control',  // Alt
    27: 'escape',   // Escape
    32: 'ok',       // Space
    33: 'pageup',   // Page Up
    34: 'pagedown', // Page Down
    37: 'left',     // Left arrow
    38: 'up',       // Up arrow
    39: 'right',    // Right arrow
    40: 'down',     // Down arrow
    45: 'escape',   // Insert
    81: 'pageup',   // Q
    87: 'pagedown', // W
    88: 'escape',   // X
    90: 'ok',       // Z
    96: 'escape',   // Numpad 0
    98: 'down',     // Numpad 2
    100: 'left',    // Numpad 4
    102: 'right',   // Numpad 6
    104: 'up',      // Numpad 8
    120: 'debug'    // F9
};

// Default gamepad mappings
Input.gamepadMapper = {
    0: 'ok',        // A
    1: 'cancel',    // B
    2: 'shift',     // X
    3: 'menu',      // Y
    4: 'pageup',    // LB
    5: 'pagedown',  // RB
    12: 'up',       // D-pad up
    13: 'down',     // D-pad down
    14: 'left',     // D-pad left
    15: 'right'     // D-pad right
};
```

## Input Methods

### Checking Input

```javascript
// Check if a button was just pressed
if (Input.isTriggered('ok')) {
    // OK button was just pressed
}

// Check if a button is being held down
if (Input.isPressed('shift')) {
    // Shift is being held down
}

// Check if a button is repeatedly active (for cursor movement)
if (Input.isRepeated('left')) {
    // Left button is repeatedly active
}

// Check if a button was just released
if (Input.isReleased('cancel')) {
    // Cancel button was just released
}
```

### Touch Input

```javascript
// Check if the screen was just touched/clicked
if (TouchInput.isTriggered()) {
    // Screen was just touched
}

// Check if touch/click is being held
if (TouchInput.isPressed()) {
    // Touch is being held
}

// Get touch coordinates
const x = TouchInput.x;
const y = TouchInput.y;
```

## Input Configuration

Players can reconfigure keyboard controls through the Options menu. The configurations are stored in `ConfigManager` and saved with the game.

## Custom Input Handling

Plugins can add custom input handling by:

1. Adding custom keys to the `Input.keyMapper`
2. Checking for specific key codes directly
3. Creating new control systems for unique gameplay mechanics

```javascript
// Adding a custom key mapping
Input.keyMapper[65] = 'special'; // 'A' key for special action

// Checking for the custom input
if (Input.isTriggered('special')) {
    // Special action triggered
}
```