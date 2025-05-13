# RPG Maker MZ - Script Call System

The script call system in RPG Maker MZ allows developers to execute JavaScript code directly from event commands, providing powerful customization capabilities without requiring full plugins.

## Script Call Basics

### Available Methods

Script calls can access all game objects and their methods, including:

- **$gameSystem**: Game system settings
- **$gameScreen**: Screen effects
- **$gameTimer**: Game timer
- **$gameMessage**: Message display
- **$gameSwitches**: Game switches
- **$gameVariables**: Game variables
- **$gameActors**: Actors collection
- **$gameParty**: Player party
- **$gameTroop**: Enemy troop
- **$gameMap**: Game map
- **$gamePlayer**: Player character
- **$gameTemp**: Temporary data

### Execution Context

Script calls are executed within the context of the current `Game_Interpreter` instance, giving access to:

- `this._eventId`: Current event ID
- `this._mapId`: Current map ID (if different from current)
- `this._index`: Current command index
- `this._params`: Parameters of the current command

## Common Script Call Categories

### Player and Party Management

```javascript
// Move player to specific coordinates
$gamePlayer.setPosition(x, y);

// Change player direction (2=down, 4=left, 6=right, 8=up)
$gamePlayer.setDirection(8);

// Add/remove party members
$gameParty.addActor(actorId);
$gameParty.removeActor(actorId);

// Modify gold
$gameParty.gainGold(amount);
$gameParty.loseGold(amount);

// Add/remove items
$gameParty.gainItem($dataItems[itemId], amount);
$gameParty.gainWeapon($dataWeapons[weaponId], amount);
$gameParty.gainArmor($dataArmors[armorId], amount);

// Heal party
$gameParty.members().forEach(actor => {
    actor.setHp(actor.mhp);
    actor.setMp(actor.mmp);
});
```

### Character Management

```javascript
// Reference to event (eventId of 0 is player, -1 is the event running the script)
const event = eventId > 0 ? $gameMap.event(eventId) : $gamePlayer;

// Move character
event.moveStraight(direction);
event.moveRandom();
event.moveToward($gamePlayer);
event.jump(xOffset, yOffset);

// Change character properties
event.setImage(characterName, characterIndex);
event.setPriorityType(priorityType); // 0=below, 1=same as, 2=above
event.setStepAnime(true); // Enable stepping animation
event.setWalkAnime(false); // Disable walking animation
event.setDirectionFix(true); // Fix direction

// Show animations and balloons
event.requestAnimation(animationId);
event.requestBalloon(balloonId);
```

### Map and Camera Control

```javascript
// Scroll map
$gameMap.startScroll(direction, distance, speed);

// Set map zoom
$gameScreen.startZoom(x, y, scale, duration);

// Weather effects
$gameScreen.changeWeather(type, power, duration); // type: 'none', 'rain', 'storm', 'snow'

// Fog effects
$gameMap.setFog(opacityLevel, red, green, blue);
$gameMap.clearFog();

// Transfer to different map
$gamePlayer.reserveTransfer(mapId, x, y, direction, fadeType);
```

### Game State and Variables

```javascript
// Access variables
const value = $gameVariables.value(variableId);
$gameVariables.setValue(variableId, newValue);

// Get variable from another variable
const varId = $gameVariables.value(1);
const value = $gameVariables.value(varId);

// Access switches
const state = $gameSwitches.value(switchId);
$gameSwitches.setValue(switchId, true);

// Conditional execution
if ($gameSwitches.value(switchId)) {
    // Do something
} else {
    // Do something else
}

// Loop through a range
for (let i = 1; i <= 10; i++) {
    $gameVariables.setValue(i, i * 10);
}
```

### Battle System Control

```javascript
// Start battle
BattleManager.setup(troopId, canEscape, canLose);
SceneManager.push(Scene_Battle);

// Add battle rewards
$gameTroop.setupEscapeRatio(); // Must call this first
$gameTroop.addGold(amount);
$gameTroop.addExp(amount);
$gameTroop.addDropItem($dataItems[itemId]);

// Manipulate actors
const actor = $gameActors.actor(actorId);
actor.changeExp(newExp, show);
actor.changeClass(classId, keepExp);
actor.learnSkill(skillId);
actor.forgetSkill(skillId);
```

### UI and Display Control

```javascript
// Show pictures
$gameScreen.showPicture(pictureId, name, origin, x, y, scaleX, scaleY, opacity, blendMode);
$gameScreen.movePicture(pictureId, origin, x, y, scaleX, scaleY, opacity, blendMode, duration);
$gameScreen.erasePicture(pictureId);

// Screen effects
$gameScreen.startTint([r, g, b, gray], duration); // RGB values -255 to 255, gray 0 to 255
$gameScreen.startFlash([r, g, b, a], duration); // RGB values 0 to 255, alpha 0 to 255
$gameScreen.startShake(power, speed, duration);

// Timer control
$gameTimer.start(frames); // 60 frames = 1 second
$gameTimer.stop();

// Open menus
SceneManager.push(Scene_Menu);
SceneManager.push(Scene_Item);
SceneManager.push(Scene_Skill);
SceneManager.push(Scene_Status);
SceneManager.push(Scene_Options);
```

## Advanced Script Calls

### Chaining Object Methods

```javascript
// Find an actor, add a state, and learn a skill
$gameActors.actor(1).addState(4).learnSkill(25);

// Modify an event and start a custom route
$gameMap.event(3)
    .setImage("Actor1", 0)
    .setMoveSpeed(5)
    .forceMoveRoute({
        list: [
            { code: 1 }, // Move down
            { code: 3 }, // Move right
            { code: 0 }  // End of route
        ]
    });
```

### Conditional Event Processing

```javascript
// Advanced conditional processing
const actor = $gameActors.actor(1);
if (actor.hp < actor.mhp * 0.5 && !actor.isStateAffected(1)) {
    actor.addState(1);
    $gameMessage.add(actor.name() + " is wounded!");
}

// Find a specific enemy and target it
const enemies = $gameTroop.aliveMembers();
const target = enemies.find(enemy => enemy.hp < enemy.mhp * 0.3);
if (target) {
    target.addState(4); // Add death state to low HP enemy
}
```

### Creating Complex Movement Patterns

```javascript
// Create a spiral movement pattern for an event
const event = $gameMap.event(5);
const route = { list: [], repeat: false, skippable: false };

for (let i = 0; i < 5; i++) {
    // Add steps in each direction, increasing by iteration
    for (let j = 0; j <= i; j++) route.list.push({ code: 2 }); // Up
    for (let j = 0; j <= i; j++) route.list.push({ code: 6 }); // Right
    for (let j = 0; j <= i; j++) route.list.push({ code: 1 }); // Down
    for (let j = 0; j <= i; j++) route.list.push({ code: 4 }); // Left
}
route.list.push({ code: 0 }); // End

event.forceMoveRoute(route);
```

### Custom Action Sequences

```javascript
// Create a custom action sequence for a skill
function executeCustomSkill(actorId, targetId) {
    const actor = $gameActors.actor(actorId);
    const target = $gameMap.event(targetId);
    
    // Play animation on actor
    actor.requestAnimation(24);
    
    // Wait for animation (approximate)
    for (let i = 0; i < 30; i++) {
        if (i === 15) {
            // Midpoint: send projectile (picture) from actor to target
            const ax = actor.screenX();
            const ay = actor.screenY();
            const tx = target.screenX();
            const ty = target.screenY();
            
            $gameScreen.showPicture(1, "Projectile", 1, ax, ay, 100, 100, 255, 0);
            $gameScreen.movePicture(1, 1, tx, ty, 100, 100, 255, 0, 15);
        }
        if (i === 29) {
            // End: play impact animation and erase picture
            target.requestAnimation(14);
            $gameScreen.erasePicture(1);
        }
    }
}
```

### Math and Random Functions

```javascript
// Random number between min and max
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Set variable to random number
$gameVariables.setValue(1, randomBetween(1, 100));

// Random chance calculation
if (Math.random() < 0.25) { // 25% chance
    $gameSwitches.setValue(1, true);
}

// Distance calculation between player and event
function distanceBetween(event1, event2) {
    const dx = Math.abs(event1.x - event2.x);
    const dy = Math.abs(event1.y - event2.y);
    return Math.sqrt(dx * dx + dy * dy);
}

const distance = distanceBetween($gamePlayer, $gameMap.event(3));
$gameVariables.setValue(2, Math.floor(distance));
```

### Storing and Retrieving Custom Data

```javascript
// Store custom data in game system
if (!$gameSystem._customData) {
    $gameSystem._customData = {};
}

// Save data
$gameSystem._customData.lastVisitedMap = $gameMap.mapId();
$gameSystem._customData.playTime = Graphics.frameCount;
$gameSystem._customData.discoveries = $gameSystem._customData.discoveries || [];
$gameSystem._customData.discoveries.push("Cave of Wonders");

// Retrieve data
const lastMap = $gameSystem._customData.lastVisitedMap;
$gameVariables.setValue(10, lastMap);

// List all discoveries
const discoveries = $gameSystem._customData.discoveries || [];
let message = "Discoveries:\n";
discoveries.forEach((discovery, index) => {
    message += (index + 1) + ". " + discovery + "\n";
});
$gameMessage.add(message);
```

## Script Call Best Practices

### Performance Considerations

1. **Limit loop iterations**: Keep loops small to prevent freezing
2. **Cache results**: Store values rather than recalculating
3. **Avoid creating unneeded objects**: Reuse existing objects when possible
4. **Minimize scene changes**: Scene transitions are expensive

```javascript
// BAD: Inefficient looping
for (let i = 0; i < 1000; i++) {
    $gameScreen.startFlash([255, 0, 0, 128], 1);
}

// GOOD: Controlled timing
function flashSequence(count) {
    if (count <= 0) return;
    
    $gameScreen.startFlash([255, 0, 0, 128], 1);
    
    // Store count in temp for continuation
    $gameTemp._flashCount = count - 1;
    
    // Set a switch to continue on next frame
    $gameSwitches.setValue(100, true);
}

// Then use another event triggered by switch 100 to continue the sequence
if ($gameSwitches.setValue(100, false) && $gameTemp._flashCount > 0) {
    flashSequence($gameTemp._flashCount);
}
```

### Error Handling

```javascript
// Simple error handling
try {
    // Potentially risky code
    const event = $gameMap.event($gameVariables.value(1));
    event.setDirection(2);
} catch (e) {
    // Handle errors gracefully
    console.error("Script call error:", e);
    $gameMessage.add("Error: Could not find the specified event.");
}

// Check for valid objects before using them
const actorId = $gameVariables.value(1);
if ($gameActors.actor(actorId)) {
    $gameActors.actor(actorId).recoverAll();
} else {
    $gameMessage.add("Invalid actor ID!");
}
```

### Documentation in Comments

```javascript
/**
 * Creates a formation of events around the player
 * @param {number} eventId - Base event to copy pattern from
 * @param {number} count - Number of events in formation
 * @param {number} radius - Distance from player
 */
function createFormation(eventId, count, radius) {
    const baseEvent = $gameMap.event(eventId);
    if (!baseEvent) return;
    
    // Calculate positions around player in a circle
    for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * (i / count);
        const x = $gamePlayer.x + Math.round(Math.cos(angle) * radius);
        const y = $gamePlayer.y + Math.round(Math.sin(angle) * radius);
        
        // Create an event at calculated position (via plugin or other means)
        // ...
    }
}
```