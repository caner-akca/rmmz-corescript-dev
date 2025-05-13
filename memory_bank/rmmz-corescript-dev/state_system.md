# RPG Maker MZ - State and Buff System

The state and buff system in RPG Maker MZ handles status effects, buffs, and debuffs that can be applied to battlers during combat.

## State Data Structure

### Base State Structure
```javascript
{
    id: 1,                  // Unique identifier
    name: "Poison",         // State name
    iconIndex: 1,           // Icon image index
    restriction: 0,         // Action restriction (0=none, 1=attack enemy only, etc.)
    priority: 100,          // Display priority (lower shows first)
    motion: 3,              // Battler motion (0=none, 1=dying, 2=sleep, etc.)
    overlay: 1,             // State overlay image (0=none, 1-8=overlay images)
    
    // Removal conditions
    removeAtBattleEnd: true,  // Remove when battle ends
    removeByRestriction: false, // Remove by restriction
    autoRemovalTiming: 2,    // When to check removal (0=none, 1=end of action, 2=end of turn)
    minTurns: 1,            // Minimum turns state lasts
    maxTurns: 5,            // Maximum turns state lasts
    removeByDamage: false,  // Chance to remove by damage
    chanceByDamage: 100,    // % chance of removal by damage
    removeByWalking: false, // Remove by walking
    stepsToRemove: 100,     // Steps to remove state
    
    // Message display
    message1: "%1 was poisoned!",  // Add state message
    message2: "%1 is taking damage from poison!", // During state message
    message3: "%1 is no longer poisoned!", // Remove state message
    message4: "%1 is still poisoned!",    // No effect message
    
    // Effects
    traits: [],             // Traits applied by state
    note: ""                // Custom note field for plugins
}
```

### State Restriction Values
- `0`: None (no restriction)
- `1`: Attack Only (can only use attack command)
- `2`: Guard Only (can only use guard command)
- `3`: Cannot Move (cannot take actions)
- `4`: Cannot Use Magic (cannot use magic)
- `5`: Cannot Use Skills (cannot use any skills)
- `6`: Cannot Use Items (cannot use items)
- `7`: Attack Only and Cannot Use Skills/Magic/Items

## Buff/Debuff System

RPG Maker MZ manages parameter buffs and debuffs separately from states:

- **Buffs**: Temporary positive stat modifications (+25% per stack)
- **Debuffs**: Temporary negative stat modifications (-25% per stack)
- Both can stack up to 2 times (configurable)
- Automatically expire after a set number of turns

```javascript
// Parameter IDs for buffs/debuffs
// 0: MaxHP
// 1: MaxMP
// 2: Attack
// 3: Defense
// 4: Magic Attack
// 5: Magic Defense
// 6: Agility
// 7: Luck
```

## State and Buff Management

### Game_BattlerBase
- Located in `rmmz_objects/Game_BattlerBase.js`
- Base class that implements state and buff functionality
- Handles state addition, removal, and expiration
- Manages buff stacks and duration

### Adding and Removing States
```javascript
// Add a state
battler.addState(stateId);

// Remove a state
battler.removeState(stateId);

// Remove all states
battler.clearStates();

// Check if has state
const hasState = battler.isStateAffected(stateId);

// Check state restriction
const restricted = battler.isRestricted();
```

### Managing Buffs and Debuffs
```javascript
// Add a buff (+25% per stack)
battler.addBuff(paramId, turns);    // paramId 0-7

// Add a debuff (-25% per stack)
battler.addDebuff(paramId, turns);

// Remove a single buff/debuff
battler.removeBuff(paramId);

// Remove all buffs/debuffs
battler.removeAllBuffs();

// Check if buffed/debuffed
const isBuffed = battler.isBuffAffected(paramId);
const isDebuffed = battler.isDebuffAffected(paramId);
```

## State Application Process

When states are applied, this process occurs:

1. **Check State Resistance**: Check if target is immune
2. **Apply State**: Add state to target's state list
3. **Setup Duration**: Set random duration within min/max
4. **Display Message**: Show appropriate message
5. **Apply Effects**: Apply stat changes, restrictions, etc.
6. **Update Display**: Update state icons and overlays

```javascript
// From Game_Battler
Game_Battler.prototype.addState = function(stateId) {
    if (this.isStateAddable(stateId)) {
        if (!this.isStateAffected(stateId)) {
            this.addNewState(stateId);
            this.refresh();
        }
        this.resetStateCounts(stateId);
        this._result.pushAddedState(stateId);
    }
};

Game_Battler.prototype.addNewState = function(stateId) {
    this._states.push(stateId);
    this._stateTurns[stateId] = this.skillEffectiveness(stateId);
    this.sortStates();
    
    // Auto-add restriction states
    const restriction = this.strictestStateRestriction();
    this.setRestriction(restriction);
};
```

## State Removal Process

States can be removed in several ways:

1. **Manual Removal**: By using a skill or item
2. **Turn Expiration**: After a set number of turns
3. **Damage Removal**: Random chance when taking damage
4. **Battle End**: States marked to end with battle
5. **Walking**: After a certain number of steps (field only)

```javascript
// Turn-based state update
Game_Battler.prototype.updateStateTurns = function() {
    for (const stateId of this._states) {
        if (this._stateTurns[stateId] > 0) {
            this._stateTurns[stateId]--;
        }
    }
};

// Check for state removal at turn end
Game_Battler.prototype.removeStatesAuto = function(timing) {
    for (const stateId of this.states()) {
        if (this.isStateExpired(stateId) && $dataStates[stateId].autoRemovalTiming === timing) {
            this.removeState(stateId);
        }
    }
};
```

## State and Buff Effects

### State Traits
States can apply traits that modify character capabilities:

```javascript
// Example poison state traits
state.traits = [
    {
        code: 22,     // Ex-Parameter (hit rate, evasion, etc.)
        dataId: 7,    // HIT rate
        value: 0.8    // 80% of normal (reduction)
    },
    {
        code: 23,     // Sp-Parameter (crit rate, guard, recovery, etc.)
        dataId: 1,    // GRD (damage reduction)
        value: 0.8    // 80% of normal (reduction)
    }
];
```

### Buff Parameter Modification
```javascript
// Calculate buff/debuff multiplier
Game_BattlerBase.prototype.paramBuffRate = function(paramId) {
    const buffLevel = this._buffs[paramId];
    const buffRates = [1.0, 0.75, 0.5, 1.25, 1.5, 1.75];
    return buffRates[3 + buffLevel]; // 3 is the offset for 0
};

// Get final parameter value with buffs applied
Game_BattlerBase.prototype.param = function(paramId) {
    const value = this.paramBase(paramId) + this.paramPlus(paramId);
    const multiplier = this.paramRate(paramId) * this.paramBuffRate(paramId);
    const maxValue = this.paramMax(paramId);
    const minValue = this.paramMin(paramId);
    return Math.round(value * multiplier).clamp(minValue, maxValue);
};
```

## State Display

### Icons
- States and buffs are displayed as icons in battle
- Icons are organized by priority order
- Multiple states can be shown at once

```javascript
// Get all state/buff icons to display
Game_BattlerBase.prototype.allIcons = function() {
    const icons = [];
    // Add state icons
    for (const state of this.states()) {
        if (state.iconIndex > 0) {
            icons.push(state.iconIndex);
        }
    }
    // Add buff/debuff icons
    for (let i = 0; i < this._buffs.length; i++) {
        const buffLevel = this._buffs[i];
        if (buffLevel !== 0) {
            icons.push(this.buffIconIndex(buffLevel, i));
        }
    }
    return icons;
};
```

### State Animations
- **State Overlay**: Displays over battler (e.g., poison animation)
- **Motion Change**: Changes battler animation (e.g., sleep pose)
- **Turn Display**: Shows remaining turns in battle

## Passive States

RPG Maker MZ can implement passive states through equipment or class traits:

```javascript
// Trait for adding a passive state
{
    code: 63,     // State Resist (can also be used to force states)
    dataId: 4,    // State ID
    value: 1      // 1 means 100% chance to be affected (passive)
}
```

To make a state truly passive:
1. Set auto-removal timing to "None"
2. Set min/max turns to high values
3. Disable removal by damage/walking/etc.
4. Add appropriate traits with code 63
5. Use note tags for plugin compatibility