# RPG Maker MZ - Animation System

RPG Maker MZ includes a powerful animation system for battle effects, character interactions, and visual feedback.

## Animation Types

RPG Maker MZ supports two types of animations:

### Effekseer Animations (Native MZ)
- 3D particle-based animations
- Created with the Effekseer tool
- Higher visual quality and performance
- Stored as `.efkefc` files in the `effects/` folder
- Support for rotation, scaling, and complex effects

### Legacy MV Animations
- 2D sprite-based animations
- Created using animation sheets
- Compatible with MV resources
- Defined in the database with frames and cell positioning
- Support for flashing, sound effects, and screen shaking

## Animation Components

### Sprite_Animation
- Handles modern Effekseer animations
- Manages the loading and display of effect files
- Controls animation timing and positioning
- Handles target-based positioning

### Sprite_AnimationMV
- Handles legacy MV-style animations
- Displays frame-by-frame sprite animations
- Manages animation cells, timing, and rotation
- Controls screen flash effects and SE playback

## Animation Methods

```javascript
// Play an animation on a target sprite
const animationId = 3; // ID from the database
const mirror = false;  // Mirror the animation
const delay = 0;       // Delay before playing
target.startAnimation(animationId, mirror, delay);

// Play an animation at a position on the screen
const animation = $dataAnimations[animationId];
const screen = true; // Not targeting a specific sprite
const baseDelay = 0;
const spriteset = SceneManager._scene._spriteset;
spriteset.createAnimation([targets], animationId, mirror, delay);
```

## Animation Settings

Animations have several configurable properties:

- **Position**: Controls where the animation plays relative to the target (center, head, feet)
- **Rotation**: Whether the animation should rotate based on target direction
- **Scale**: Size multiplier for the animation
- **Sound Effects**: Audio that plays during specific frames
- **Flash Effects**: Color flashes that occur during specific frames

## Handling Multiple Targets

When an animation targets multiple battlers (like area attacks):

1. **MV Style**: The animation can be displayed on each target or centered between them
2. **Effekseer Style**: The animation can be displayed on each target or as a single instance

## Custom Animations

Plugins can create custom animations by:

1. Extending the existing animation classes
2. Creating animations dynamically at runtime
3. Defining new animation types with custom rendering

```javascript
// Create a dynamic animation (example)
const sprite = new Sprite_Animation();
sprite.targetObjects = [target];
sprite.setup([target], animationId, false, 0);
parent.addChild(sprite);
```

## Debugging Animations

- Animations can be previewed in the database editor
- Test play mode allows viewing animations in-game
- Animation IDs can be referenced in event commands and script calls