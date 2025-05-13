# RPG Maker MZ - Window System Internals

The window system in RPG Maker MZ builds on PIXI.js to provide a comprehensive UI framework for game interfaces. This document details the internal implementation of windows, their rendering process, and customization options.

## Core Window Classes

### Window Base Classes
- **Window**: Located in `rmmz_core/Window.js`
  - Base window container with frame rendering
  - Handles background, frame, and cursor drawing
  - Manages opening/closing animations
- **Window_Base**: Located in `rmmz_windows/Window_Base.js`
  - Extends Window with RPG-specific functionality
  - Provides text rendering, icon drawing, and formatting
  - Implements standardized layout metrics
- **Window_Scrollable**: Located in `rmmz_windows/Window_Scrollable.js`
  - Adds scrolling functionality to windows
  - Manages scroll position and touch scrolling
- **Window_Selectable**: Located in `rmmz_windows/Window_Selectable.js`
  - Implements item selection and cursor movement
  - Handles keyboard, gamepad, and touch input for selection
  - Manages item highlighting and cursor animation
- **Window_Command**: Located in `rmmz_windows/Window_Command.js`
  - Specialized for command menus
  - Manages command list creation and handling

## Window Rendering Process

### Window Creation
```javascript
// Basic window creation
const rect = new Rectangle(x, y, width, height);
const window = new Window_Base(rect);

// Window initialization process
Window_Base.prototype.initialize = function(rect) {
    Window.prototype.initialize.call(this);
    this.loadWindowskin();
    this.checkRectObject(rect);
    this.move(rect.x, rect.y, rect.width, rect.height);
    this.updatePadding();
    this.updateBackOpacity();
    this.updateTone();
    this.createContents();
    this._opening = false;
    this._closing = false;
    this._dimmerSprite = null;
};
```

### Visual Components
A window consists of several visual layers:

```javascript
// Window frame setup
Window.prototype._createAllParts = function() {
    this._windowSpriteContainer = new PIXI.Container();
    this._windowBackSprite = new Sprite();
    this._windowCursorSprite = new Sprite();
    this._windowFrameSprite = new Sprite();
    this._windowContentsSprite = new Sprite();
    this._downArrowSprite = new Sprite();
    this._upArrowSprite = new Sprite();
    this._windowPauseSignSprite = new Sprite();
    this._windowBackSprite.bitmap = new Bitmap(1, 1);
    this._windowBackSprite.alpha = 192 / 255;
    this.addChild(this._windowSpriteContainer);
    this._windowSpriteContainer.addChild(this._windowBackSprite);
    this._windowSpriteContainer.addChild(this._windowFrameSprite);
    this.addChild(this._windowContentsSprite);
    this.addChild(this._windowCursorSprite);
    this.addChild(this._downArrowSprite);
    this.addChild(this._upArrowSprite);
    this.addChild(this._windowPauseSignSprite);
};
```

### Drawing Process
Windows use a bitmap-based drawing system:

```javascript
// Create content bitmap
Window_Base.prototype.createContents = function() {
    const width = this.contentsWidth();
    const height = this.contentsHeight();
    this.destroyContents();
    this.contents = new Bitmap(width, height);
    this.resetFontSettings();
    this.contentsBack = new Bitmap(width, height);
    this._windowContentsSprite.bitmap = this.contents;
};

// Draw text in window
Window_Base.prototype.drawText = function(text, x, y, maxWidth, align) {
    this.contents.drawText(text, x, y, maxWidth, this.lineHeight(), align);
};

// Update window content
Window_Base.prototype.refresh = function() {
    // Clear contents
    this.contents.clear();
    
    // Draw new content
    this.drawAllItems();
};
```

## Text Processing System

### Text Drawing
```javascript
// Draw text with control characters
Window_Base.prototype.drawTextEx = function(text, x, y, width) {
    this.resetFontSettings();
    const textState = this.createTextState(text, x, y, width);
    this.processAllText(textState);
    return textState.outputWidth;
};

// Process all text
Window_Base.prototype.processAllText = function(textState) {
    while (textState.index < textState.text.length) {
        this.processCharacter(textState);
    }
    return textState;
};

// Process individual character
Window_Base.prototype.processCharacter = function(textState) {
    const c = textState.text[textState.index++];
    if (c.charCodeAt(0) < 0x20) {
        this.flushTextState(textState);
        this.processControlCharacter(textState, c);
    } else {
        textState.buffer += c;
    }
};
```

### Control Character Processing
```javascript
// Process control characters like \C[n], \I[n], etc.
Window_Base.prototype.processEscapeCharacter = function(code, textState) {
    switch (code) {
        case "C":
            this.processColorChange(this.obtainEscapeParam(textState));
            break;
        case "I":
            this.processDrawIcon(this.obtainEscapeParam(textState), textState);
            break;
        case "{":
            this.makeFontBigger();
            break;
        case "}":
            this.makeFontSmaller();
            break;
        case "PX":
            textState.x = this.obtainEscapeParam(textState);
            break;
        case "PY":
            textState.y = this.obtainEscapeParam(textState);
            break;
        case "FS":
            this.contents.fontSize = this.obtainEscapeParam(textState);
            break;
    }
};

// Extract numeric parameter from escape code
Window_Base.prototype.obtainEscapeParam = function(textState) {
    const regExp = /^\[\d+\]/;
    const arr = regExp.exec(textState.text.slice(textState.index));
    if (arr) {
        textState.index += arr[0].length;
        return parseInt(arr[0].slice(1));
    } else {
        return 0;
    }
};
```

## Selection System

### Cursor Management
```javascript
// Update cursor for selection
Window_Selectable.prototype.refreshCursor = function() {
    const rect = this.cursorRect();
    this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
};

// Set cursor position
Window_Selectable.prototype.setCursorRect = function(x, y, width, height) {
    Window.prototype.setCursorRect.call(this, x, y, width, height);
    this._cursorRect.x = x;
    this._cursorRect.y = y;
    this._cursorRect.width = width;
    this._cursorRect.height = height;
    this._refreshCursor();
};

// Move cursor
Window_Selectable.prototype.select = function(index) {
    this._index = index;
    this._stayCount = 0;
    this.ensureCursorVisible();
    this.updateCursor();
    this.callUpdateHelp();
};
```

### Item Selection
```javascript
// Handle selection input
Window_Selectable.prototype.processHandling = function() {
    if (this.isOpenAndActive()) {
        if (this.isOkEnabled() && this.isOkTriggered()) {
            return this.processOk();
        }
        if (this.isCancelEnabled() && this.isCancelTriggered()) {
            return this.processCancel();
        }
        if (this.isHandled("pagedown") && Input.isTriggered("pagedown")) {
            return this.processPagedown();
        }
        if (this.isHandled("pageup") && Input.isTriggered("pageup")) {
            return this.processPageup();
        }
    }
    return false;
};

// Set command handler
Window_Selectable.prototype.setHandler = function(symbol, method) {
    this._handlers[symbol] = method;
};

// Process OK selection
Window_Selectable.prototype.processOk = function() {
    if (this.isCurrentItemEnabled()) {
        this.playOkSound();
        this.updateInputData();
        this.deactivate();
        this.callHandler("ok");
    } else {
        this.playBuzzerSound();
    }
};
```

## Window Layouts and Metrics

### Layout Calculation
```javascript
// Calculate content width
Window_Base.prototype.contentsWidth = function() {
    return this.innerWidth;
};

// Calculate content height
Window_Base.prototype.contentsHeight = function() {
    return this.innerHeight;
};

// Calculate inner width (accounting for padding)
Object.defineProperty(Window.prototype, "innerWidth", {
    get: function() {
        return Math.max(0, this._width - this._padding * 2);
    },
    configurable: true
});

// Calculate inner height (accounting for padding)
Object.defineProperty(Window.prototype, "innerHeight", {
    get: function() {
        return Math.max(0, this._height - this._padding * 2);
    },
    configurable: true
});

// Calculate line height
Window_Base.prototype.lineHeight = function() {
    return 36;
};

// Update window padding
Window_Base.prototype.updatePadding = function() {
    this.padding = $gameSystem.windowPadding();
};
```

### Item Layout
```javascript
// Calculate item width
Window_Selectable.prototype.itemWidth = function() {
    return Math.floor(this.innerWidth / this.maxCols());
};

// Calculate item height
Window_Selectable.prototype.itemHeight = function() {
    return 66; // 1.8 * line height (36)
};

// Calculate item rect for specific index
Window_Selectable.prototype.itemRect = function(index) {
    const maxCols = this.maxCols();
    const itemWidth = this.itemWidth();
    const itemHeight = this.itemHeight();
    const colSpacing = this.colSpacing();
    const rowSpacing = this.rowSpacing();
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);
    const x = col * itemWidth + colSpacing / 2 - this.scrollBaseX();
    const y = row * itemHeight + rowSpacing / 2 - this.scrollBaseY();
    const width = itemWidth - colSpacing;
    const height = itemHeight - rowSpacing;
    return new Rectangle(x, y, width, height);
};
```

## Window Animation

### Opening and Closing
```javascript
// Open window
Window.prototype.open = function() {
    if (!this._opening) {
        this._opening = true;
        this._closing = false;
        this._openness = 0;
    }
};

// Close window
Window.prototype.close = function() {
    if (!this._closing) {
        this._closing = true;
        this._opening = false;
    }
};

// Update openness animation
Window.prototype.updateOpenness = function() {
    if (this._opening) {
        this._openness = Math.min(this._openness + 32, 255);
        if (this._openness >= 255) {
            this._opening = false;
        }
    }
    if (this._closing) {
        this._openness = Math.max(this._openness - 32, 0);
        if (this._openness <= 0) {
            this._closing = false;
        }
    }
};
```

### Cursor Animation
```javascript
// Update cursor flashing
Window.prototype._updateCursor = function() {
    this._cursorSprite.alpha = this._makeCursorAlpha();
    this._cursorSprite.visible = this.isOpen() && this.cursorVisible;
    this._cursorSprite.x = this._cursorRect.x;
    this._cursorSprite.y = this._cursorRect.y;
};

// Calculate cursor alpha for flashing effect
Window.prototype._makeCursorAlpha = function() {
    const blinkCount = this._animationCount % 40;
    const baseAlpha = this.contentsOpacity / 255;
    if (this.active) {
        if (blinkCount < 20) {
            return baseAlpha - blinkCount / 32;
        } else {
            return baseAlpha - (40 - blinkCount) / 32;
        }
    }
    return baseAlpha;
};
```

## Touch Controls

### Touch Input
```javascript
// Process touch input
Window_Selectable.prototype.processTouch = function() {
    if (this.isOpenAndActive()) {
        if (this.isTouchedInsideFrame() && this.isTouchOkEnabled()) {
            const touchIndex = this.touchIndex();
            if (touchIndex >= 0) {
                this.select(touchIndex);
                if (this.isTouchOkEnabled() && TouchInput.isTriggered()) {
                    this.processOk();
                }
            }
            if (this._stayCount >= 10 && TouchInput.isPressed()) {
                this.cursorPagedown();
            }
        }
        if (TouchInput.isCancelled()) {
            if (this.isCancelEnabled()) {
                this.processCancel();
            }
        }
    }
};

// Get touch index
Window_Selectable.prototype.touchIndex = function() {
    const touchPos = new Point(TouchInput.x, TouchInput.y);
    const localPos = this.worldTransform.applyInverse(touchPos);
    return this.hitIndex(localPos.x, localPos.y);
};

// Get index at position
Window_Selectable.prototype.hitIndex = function(x, y) {
    if (this.innerRect.contains(x, y)) {
        const cx = this.origin.x + x - this.innerX;
        const cy = this.origin.y + y - this.innerY;
        const maxCols = this.maxCols();
        const maxItems = this.maxItems();
        for (let index = 0; index < maxItems; index++) {
            const rect = this.itemRect(index);
            if (rect.contains(cx, cy)) {
                return index;
            }
        }
    }
    return -1;
};
```

## Window Skinning System

### Window Skin
```javascript
// Load window skin
Window_Base.prototype.loadWindowskin = function() {
    this.windowskin = ImageManager.loadSystem("Window");
};

// Draw window skin parts
Window.prototype._refreshFrame = function() {
    const w = this._width;
    const h = this._height;
    const m = 24;
    const bitmap = new Bitmap(w, h);

    this._windowFrameSprite.bitmap = bitmap;
    this._windowFrameSprite.setFrame(0, 0, w, h);

    if (w > 0 && h > 0 && this._windowskin) {
        // Draw the window frame
        const skin = this._windowskin;
        
        // Top-left corner
        bitmap.blt(skin, 0, 0, m, m, 0, 0, m, m);
        // Top-right corner
        bitmap.blt(skin, skin.width - m, 0, m, m, w - m, 0, m, m);
        // Bottom-left corner
        bitmap.blt(skin, 0, skin.height - m, m, m, 0, h - m, m, m);
        // Bottom-right corner
        bitmap.blt(skin, skin.width - m, skin.height - m, m, m, w - m, h - m, m, m);
        
        // Top border
        bitmap.blt(skin, m, 0, skin.width - m * 2, m, m, 0, w - m * 2, m);
        // Bottom border
        bitmap.blt(skin, m, skin.height - m, skin.width - m * 2, m, m, h - m, w - m * 2, m);
        // Left border
        bitmap.blt(skin, 0, m, m, skin.height - m * 2, 0, m, m, h - m * 2);
        // Right border
        bitmap.blt(skin, skin.width - m, m, m, skin.height - m * 2, w - m, m, m, h - m * 2);
    }
};
```

### Color and Tone Settings
```javascript
// Update window background color
Window.prototype._refreshBack = function() {
    const w = this._width;
    const h = this._height;
    const bitmap = new Bitmap(w, h);

    this._windowBackSprite.bitmap = bitmap;
    this._windowBackSprite.setFrame(0, 0, w, h);

    if (w > 0 && h > 0 && this._windowskin) {
        // Draw the background color
        const p = 96;
        bitmap.blt(this._windowskin, 0, p, p, p, 0, 0, w, h);
    }
};

// Set window color tone
Window.prototype.setTone = function(r, g, b) {
    const tone = this._colorTone;
    if (r !== tone[0] || g !== tone[1] || b !== tone[2]) {
        this._colorTone = [r, g, b, 0];
        this._refreshBack();
        this._refreshFrame();
    }
};

// Update window tone
Window_Base.prototype.updateTone = function() {
    const tone = $gameSystem.windowTone();
    this.setTone(tone[0], tone[1], tone[2]);
};
```

## Custom Window Implementations

### Creating Custom Windows
```javascript
// Create a custom window class
class Window_Custom extends Window_Base {
    constructor(rect) {
        super(rect);
        this.initialize(...arguments);
    }

    initialize(rect) {
        super.initialize(rect);
        this.refresh();
    }

    refresh() {
        this.contents.clear();
        this.drawCustomContent();
    }

    drawCustomContent() {
        // Draw title
        this.drawText("Custom Window", 0, 0, this.contentsWidth(), 'center');
        
        // Draw content
        this.changeTextColor(ColorManager.systemColor());
        this.drawText("Status:", 0, this.lineHeight(), 120);
        this.resetTextColor();
        this.drawText("Active", 120, this.lineHeight(), 120);
        
        // Draw an icon
        this.drawIcon(87, 0, this.lineHeight() * 2);
        this.drawText("Power", 32, this.lineHeight() * 2, 120);
    }
}
```

### Interactive Custom Windows
```javascript
// Creating a selection window
class Window_CustomSelection extends Window_Selectable {
    constructor(rect) {
        super(rect);
        this.initialize(...arguments);
    }

    initialize(rect) {
        super.initialize(rect);
        this._data = [];
        this.refresh();
        this.select(0);
        this.activate();
    }

    maxItems() {
        return this._data ? this._data.length : 0;
    }

    maxCols() {
        return 1;
    }

    setData(data) {
        this._data = data;
        this.refresh();
    }

    item() {
        return this._data && this.index() >= 0 ? this._data[this.index()] : null;
    }

    drawItem(index) {
        const item = this._data[index];
        const rect = this.itemLineRect(index);
        this.resetTextColor();
        this.drawText(item.name, rect.x, rect.y, rect.width);
    }

    updateHelp() {
        if (this.item()) {
            this._helpWindow.setText(this.item().description);
        }
    }
}
```

### Automatic Layout Adjustments
```javascript
// Responsive window layout
Window_Base.prototype.adjustWindowSize = function() {
    const uiAreaWidth = Graphics.boxWidth;
    const uiAreaHeight = Graphics.boxHeight;
    
    // Set size proportionally to screen size
    const newWidth = Math.floor(uiAreaWidth * this._widthRatio);
    const newHeight = Math.floor(uiAreaHeight * this._heightRatio);
    
    // Ensure minimum size
    const minWidth = this._minWidth || 100;
    const minHeight = this._minHeight || 100;
    
    // Set new dimensions
    this.width = Math.max(newWidth, minWidth);
    this.height = Math.max(newHeight, minHeight);
    
    // Center the window
    if (this._center) {
        this.x = Math.floor((uiAreaWidth - this.width) / 2);
        this.y = Math.floor((uiAreaHeight - this.height) / 2);
    }
    
    // Recreate contents at new size
    this.createContents();
    this.refresh();
};
```

## Window Optimization Techniques

### Bitmap Caching
```javascript
// Content caching to improve performance
Window_Base.prototype.enableContentsCaching = function() {
    this._contentsCache = {};
    this._contentsNeedRefresh = true;
};

Window_Base.prototype.cacheContents = function(key, drawMethod) {
    if (!this._contentsCache) this.enableContentsCaching();
    
    if (!this._contentsCache[key] || this._contentsNeedRefresh) {
        // Create temporary bitmap for drawing
        const tempBitmap = new Bitmap(this.contentsWidth(), this.contentsHeight());
        
        // Draw on temporary bitmap
        drawMethod.call(this, tempBitmap);
        
        // Cache the result
        this._contentsCache[key] = tempBitmap;
        this._contentsNeedRefresh = false;
    }
    
    // Draw cached bitmap to contents
    this.contents.blt(
        this._contentsCache[key], 
        0, 0, 
        this._contentsCache[key].width, this._contentsCache[key].height, 
        0, 0
    );
};
```

### Partial Updates
```javascript
// Partial window updates for better performance
Window_Base.prototype.refreshPartial = function(region) {
    // Clear only the region that needs updating
    this.contents.clearRect(
        region.x, 
        region.y, 
        region.width, 
        region.height
    );
    
    // Refresh only the specified region
    this.drawRegionContents(region);
};

// Drawing specific region
Window_Base.prototype.drawRegionContents = function(region) {
    // Example specific region drawing
    if (region.id === "header") {
        this.drawHeader();
    } else if (region.id === "stats") {
        this.drawStats();
    } else if (region.id === "equipment") {
        this.drawEquipment();
    }
};
```