# RPG Maker MZ - Sprite Architecture

This document details the sprite system in RPG Maker MZ, covering the sprite hierarchy, animation system, and visual effects implementation.

## Core Sprite Components

### Sprite Base Class
- Located in `rmmz_core/Sprite.js`
- Extends PIXI.Sprite with RPG Maker-specific functionality
- Provides foundation for all visual game objects

### Bitmap Class
- Located in `rmmz_core/Bitmap.js`
- Manages image data for sprites
- Handles drawing operations, text rendering, and image manipulation

### Main Sprite Types
- `Sprite_Character`: Characters on the map
- `Sprite_Battler`: Base class for battle participants
- `Sprite_Actor`: Player characters in battle
- `Sprite_Enemy`: Enemy characters in battle
- `Sprite_Animation`: Visual effects and animations
- `Sprite_Damage`: Damage numbers display
- `Sprite_Balloon`: Message balloons over characters
- `Sprite_Picture`: Pictures shown on the screen

## Sprite Hierarchy

### Inheritance Structure
```
PIXI.Sprite
└── Sprite
    ├── Sprite_Button
    ├── Sprite_Character
    │   └── Sprite_Player
    │   └── Sprite_Event
    │   └── Sprite_Follower
    │   └── Sprite_Vehicle
    ├── Sprite_Battler
    │   ├── Sprite_Actor
    │   └── Sprite_Enemy
    ├── Sprite_Animation
    ├── Sprite_Damage
    ├── Sprite_Balloon
    ├── Sprite_Picture
    ├── Sprite_Timer
    └── Sprite_Destination
```

### Container Types
```
PIXI.Container
├── Stage
│   ├── Scene_Base (and all Scene classes)
├── Window (and all Window classes)
├── Tilemap
├── WeatherLayer
├── WindowLayer
└── Spriteset_Base
    ├── Spriteset_Map
    └── Spriteset_Battle
```

## Basic Sprite Implementation

### Sprite Creation
```javascript
// Initialize a basic sprite
Sprite.prototype.initialize = function(bitmap) {
    PIXI.Sprite.prototype.initialize.call(this);
    this.bitmap = bitmap;
    this.anchor.x = 0;
    this.anchor.y = 0;
    this._blendColor = [0, 0, 0, 0];
    this._colorTone = [0, 0, 0, 0];
    this._frame = new Rectangle();
    this._hue = 0;
    this._blendMode = PIXI.BLEND_MODES.NORMAL;
};

// Create a sprite and set its bitmap
const sprite = new Sprite();
sprite.bitmap = ImageManager.loadCharacter("Actor1");
```

### Bitmap Management
```javascript
// Changing the bitmap of a sprite
Sprite.prototype.setBitmap = function(bitmap) {
    this.bitmap = bitmap;
    this._frame = new Rectangle(0, 0, 0, 0);
};

// Set the display frame for a sprite (part of the bitmap to show)
Sprite.prototype.setFrame = function(x, y, width, height) {
    this._frame.x = x;
    this._frame.y = y;
    this._frame.width = width;
    this._frame.height = height;
    this._refresh();
};
```

### Update Cycle
```javascript
// Main update function called each frame
Sprite.prototype.update = function() {
    if (this.bitmap) {
        this._refresh();
    }
    this.updateVisibility();
};

// Internal refresh handling
Sprite.prototype._refresh = function() {
    const bitmap = this.bitmap;
    if (bitmap) {
        if (bitmap.isReady()) {
            // Set the texture when bitmap is ready
            this._onBitmapLoad();
        } else {
            // Wait for bitmap to load
            bitmap.addLoadListener(this._onBitmapLoad.bind(this));
        }
    }
};
```

## Character Sprites

### Character Movement
```javascript
// Update character sprite
Sprite_Character.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateBitmap();
    this.updateFrame();
    this.updatePosition();
    this.updateOther();
    this.updateVisibility();
};

// Update character position
Sprite_Character.prototype.updatePosition = function() {
    this.x = this._character.screenX();
    this.y = this._character.screenY();
    this.z = this._character.screenZ();
};

// Update character animation frame
Sprite_Character.prototype.updateFrame = function() {
    const pw = this.patternWidth();
    const ph = this.patternHeight();
    const sx = (this.characterBlockX() + this.characterPatternX()) * pw;
    const sy = (this.characterBlockY() + this.characterPatternY()) * ph;
    this.setFrame(sx, sy, pw, ph);
};
```

### Character Direction and Patterns
```javascript
// Get character block based on direction
Sprite_Character.prototype.characterBlockX = function() {
    // Character sheet has 4 columns for each direction
    // Left (4) = 0, Right (6) = 1, Up (8) = 2, Down (2) = 3
    const direction = this._character.direction();
    return direction === 6 ? 1 : direction === 8 ? 2 : direction === 2 ? 3 : 0;
};

// Get character pattern based on animation frame
Sprite_Character.prototype.characterPatternX = function() {
    // Return pattern (0-2) for the current animation frame
    return this._character.pattern();
};
```

## Battler Sprites

### Actor Sprites
```javascript
// Initialize actor sprite
Sprite_Actor.prototype.initialize = function(battler) {
    Sprite_Battler.prototype.initialize.call(this, battler);
    this.moveToStartPosition();
};

// Setup actor sprites and animations
Sprite_Actor.prototype.initMembers = function() {
    Sprite_Battler.prototype.initMembers.call(this);
    this._battlerName = "";
    this._motion = null;
    this._motionCount = 0;
    this._pattern = 0;
    this.createShadowSprite();
    this.createWeaponSprite();
    this.createStateSprite();
};

// Update actor sprite animations
Sprite_Actor.prototype.updateMotion = function() {
    this.updateMotionCount();
    if (this._motion && this._motion.index === 0) {
        // Idle motion
        if (this._pattern !== 0) {
            this.updatePattern();
        }
    } else if (this._motion) {
        // Non-idle motions
        this.updatePattern();
    }
};
```

### Enemy Sprites
```javascript
// Initialize enemy sprite
Sprite_Enemy.prototype.initialize = function(battler) {
    Sprite_Battler.prototype.initialize.call(this, battler);
    this.createStateIconSprite();
    this._appeared = false;
    this._battlerName = "";
    this._battlerHue = 0;
    this._effectType = null;
    this._effectDuration = 0;
    this._shake = 0;
    this.createStateSprite();
};

// Update enemy sprite
Sprite_Enemy.prototype.update = function() {
    Sprite_Battler.prototype.update.call(this);
    if (this._enemy) {
        this.updateEffect();
        this.updateStateSprite();
    }
};

// Handle enemy visual effects
Sprite_Enemy.prototype.updateEffect = function() {
    this.setupEffect();
    if (this._effectDuration > 0) {
        this._effectDuration--;
        switch (this._effectType) {
            case "appear":
                this.updateAppear();
                break;
            case "whiten":
                this.updateWhiten();
                break;
            case "blink":
                this.updateBlink();
                break;
            case "collapse":
                this.updateCollapse();
                break;
            case "bossCollapse":
                this.updateBossCollapse();
                break;
            case "instantCollapse":
                this.updateInstantCollapse();
                break;
        }
        if (this._effectDuration === 0) {
            this._effectType = null;
        }
    }
};
```

## Animation System

### Animation Sprites
```javascript
// Initialize animation sprite
Sprite_Animation.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.initMembers();
};

// Setup animation properties
Sprite_Animation.prototype.initMembers = function() {
    this._targets = [];
    this._animation = null;
    this._mirror = false;
    this._delay = 0;
    this._rate = 4;
    this._duration = 0;
    this._flashColor = [0, 0, 0, 0];
    this._flashDuration = 0;
    this._screenFlashDuration = 0;
    this._hidingDuration = 0;
    this._hue1 = 0;
    this._hue2 = 0;
    this._bitmap1 = null;
    this._bitmap2 = null;
    this._cellSprites = [];
    this._screenFlashSprite = null;
    this.z = 8;
};

// Setup animation from MV animation data
Sprite_Animation.prototype.setup = function(targets, animation, mirror, delay) {
    this._targets = targets;
    this._animation = animation;
    this._mirror = mirror;
    this._delay = delay;
    
    // If it's a MV animation (image-based)
    if (this.isLegacyAnimation()) {
        this.setupLegacy();
        this.createLegacySprites();
    } else {
        // MZ animation (effekseer)
        this.setupEffekseer();
    }
    
    this.setZ(8);
};

// Update animation frames
Sprite_Animation.prototype.update = function() {
    Sprite.prototype.update.call(this);
    
    if (this._delay > 0) {
        this._delay--;
    } else {
        this._duration--;
        this.updatePosition();
        
        if (this.isLegacyAnimation()) {
            this.updateLegacyAnimation();
        } else {
            this.updateEffekseerAnimation();
        }
        
        if (this._duration <= 0) {
            this.onEnd();
        }
    }
};
```

### MZ's Effekseer Animation Integration
```javascript
// Setup Effekseer animation
Sprite_Animation.prototype.setupEffekseer = function() {
    const animation = this._animation;
    this._duration = animation.effectName ? animation.duration : 0;
    
    // Effekseer effect settings
    if (animation.effectName) {
        this.createEffect();
        this.createSprites();
    }
};

// Create Effekseer effect
Sprite_Animation.prototype.createEffect = function() {
    if (this._handle) {
        this._handle.stop();
    }
    
    this._handle = Graphics.effekseer.play(this._animation.effectName);
    if (this._animation.scale !== 100) {
        this._handle.setScale(this._animation.scale / 100);
    }
    
    if (this._animation.speed !== 100) {
        this._handle.setSpeed(this._animation.speed / 100);
    }
};

// Update Effekseer animation position
Sprite_Animation.prototype.updateEffekseer = function() {
    if (this._handle) {
        this._handle.setLocation(this.targetPosition.x, this.targetPosition.y, 0);
        this._handle.setRotation(0, 0, this._animation.rotation * Math.PI / 180);
    }
};
```

## Visual Effects

### Color Effects
```javascript
// Apply color tone change (screen tint)
Sprite.prototype.setColorTone = function(tone) {
    if (!(tone instanceof Array)) {
        throw new Error("Argument must be an array");
    }
    if (!this._colorTone.equals(tone)) {
        this._colorTone = tone.clone();
        this._refresh();
    }
};

// Apply blend color (overlay color)
Sprite.prototype.setBlendColor = function(color) {
    if (!(color instanceof Array)) {
        throw new Error("Argument must be an array");
    }
    if (!this._blendColor.equals(color)) {
        this._blendColor = color.clone();
        this._refresh();
    }
};

// Apply hue rotation
Sprite.prototype.setHue = function(hue) {
    if (this._hue !== Number(hue)) {
        this._hue = Number(hue);
        this._refresh();
    }
};
```

### Blend Modes
```javascript
// Set blend mode (normal, add, multiply, etc.)
Sprite.prototype.setBlendMode = function(blendMode) {
    this._blendMode = blendMode;
};

// Blend mode constants
PIXI.BLEND_MODES.NORMAL = 0;
PIXI.BLEND_MODES.ADD = 1;
PIXI.BLEND_MODES.MULTIPLY = 2;
PIXI.BLEND_MODES.SCREEN = 3;

// Apply blend mode example
const sprite = new Sprite(bitmap);
sprite.setBlendMode(PIXI.BLEND_MODES.ADD);  // Additive blending
```

### Filters and Effects
```javascript
// Add filter to sprite
Sprite.prototype.addFilter = function(filter) {
    if (!this.filters) {
        this.filters = [];
    }
    this.filters.push(filter);
};

// Create a blur filter
Sprite.prototype.createBlurFilter = function() {
    const filter = new PIXI.filters.BlurFilter();
    filter.blur = 3;
    this.addFilter(filter);
    return filter;
};

// Create a color matrix filter for advanced effects
Sprite.prototype.createColorMatrixFilter = function() {
    const filter = new PIXI.filters.ColorMatrixFilter();
    this.addFilter(filter);
    return filter;
};
```

## Weather Effects

### Weather Layer Implementation
```javascript
// Initialize weather layer
Weather.prototype.initialize = function() {
    PIXI.Container.prototype.initialize.call(this);
    this._width = Graphics.width;
    this._height = Graphics.height;
    this._sprites = [];
    this._rainBitmap = new Bitmap(1, 60);
    this._rainBitmap.fillAll("white");
    this._snowBitmap = new Bitmap(6, 6);
    this._snowBitmap.drawCircle(3, 3, 3, "white");
    this._dimBitmap = new Bitmap(1, 1);
    this._dimBitmap.fillAll("black");
    this._createDimmer();
    this._createSprites();
};

// Create weather sprites
Weather.prototype._createSprites = function() {
    for (let i = 0; i < this._maxSprites; i++) {
        this._sprites[i] = new Sprite(this._rainBitmap);
        this._sprites[i].anchor.x = 0.5;
        this._sprites[i].anchor.y = 0.5;
        this._sprites[i].opacity = 0;
        this.addChild(this._sprites[i]);
    }
};

// Update weather animation
Weather.prototype._updateAllSprites = function() {
    const maxSprites = Math.floor(this.power * 10);
    
    for (let i = 0; i < this._maxSprites; i++) {
        if (i <= maxSprites) {
            this._sprites[i].opacity = 160 + 60 * Math.random();
        } else {
            this._sprites[i].opacity = 0;
        }
    }
    
    switch (this.type) {
        case "rain":
            this._updateRainSprites();
            break;
        case "storm":
            this._updateStormSprites();
            break;
        case "snow":
            this._updateSnowSprites();
            break;
    }
};
```

## Performance Optimizations

### Sprite Pooling
```javascript
// Create a sprite pool for reuse
function SpritePool() {
    this._pool = [];
}

// Get sprite from pool or create new one
SpritePool.prototype.getSprite = function(bitmap) {
    let sprite;
    if (this._pool.length > 0) {
        sprite = this._pool.pop();
        sprite.setBitmap(bitmap);
    } else {
        sprite = new Sprite(bitmap);
    }
    return sprite;
};

// Return sprite to pool when done
SpritePool.prototype.releaseSprite = function(sprite) {
    sprite.visible = false;
    sprite.bitmap = null;
    this._pool.push(sprite);
};
```

### Sprite Visibility Optimization
```javascript
// Update sprite visibility based on screen bounds
Sprite.prototype.updateVisibility = function() {
    const w = this.width || 0;
    const h = this.height || 0;
    const x = this.x - this.anchor.x * w;
    const y = this.y - this.anchor.y * h;
    
    // Only be visible if on screen
    this.visible = (
        x + w > 0 &&
        y + h > 0 &&
        x < Graphics.width &&
        y < Graphics.height
    );
};

// Update children visibility recursively
Sprite.prototype.updateVisibilityRecursive = function() {
    this.updateVisibility();
    if (this.visible && this.children) {
        for (const child of this.children) {
            if (child.updateVisibilityRecursive) {
                child.updateVisibilityRecursive();
            }
        }
    }
};
```

## Specialized Sprite Types

### Damage Sprites
```javascript
// Create damage display sprite
Sprite_Damage.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this._duration = 90;
    this._flashColor = [0, 0, 0, 0];
    this._flashDuration = 0;
    this._damageBitmap = null;
    this._colorType = 0;
};

// Setup damage sprites based on value
Sprite_Damage.prototype.setup = function(target) {
    const result = target.result();
    if (result.missed || result.evaded) {
        this._colorType = 0;
        this.createMiss();
    } else if (result.hpAffected) {
        this._colorType = result.hpDamage >= 0 ? 0 : 1;
        this.createDigits(result.hpDamage);
    } else if (target.isAlive() && result.mpDamage !== 0) {
        this._colorType = result.mpDamage >= 0 ? 2 : 3;
        this.createDigits(result.mpDamage);
    }
    
    if (result.critical) {
        this.setupCriticalEffect();
    }
};
```

### Picture Sprites
```javascript
// Initialize picture sprite
Sprite_Picture.prototype.initialize = function(pictureId) {
    Sprite.prototype.initialize.call(this);
    this._pictureId = pictureId;
    this._pictureName = "";
    this._isPicture = true;
    this.update();
};

// Update picture properties
Sprite_Picture.prototype.update = function() {
    Sprite.prototype.update.call(this);
    this.updateBitmap();
    if (this.visible) {
        this.updateOrigin();
        this.updatePosition();
        this.updateScale();
        this.updateTone();
        this.updateOther();
    }
};

// Update picture position
Sprite_Picture.prototype.updatePosition = function() {
    const picture = this.picture();
    this.x = Math.round(picture.x());
    this.y = Math.round(picture.y());
};
```

### Animation Sprites for Battle
```javascript
// Create animation sprite in battle
Spriteset_Battle.prototype.createAnimation = function(request) {
    const animation = $dataAnimations[request.animationId];
    const targets = this.makeTargetSprites(request.targets);
    const sprite = new Sprite_Animation();
    sprite.setup(targets, animation, request.mirror, request.delay);
    this._animationSprites.push(sprite);
    this._effectsContainer.addChild(sprite);
    this._animation = sprite;
};

// Target multiple battlers with animation
Spriteset_Battle.prototype.makeTargetSprites = function(targets) {
    const targetSprites = [];
    for (const target of targets) {
        const targetSprite = this.findTargetSprite(target);
        if (targetSprite) {
            targetSprites.push(targetSprite);
        }
    }
    return targetSprites;
};
```