# RPG Maker MZ - Skill and Battle Command System

The skill and battle command system in RPG Maker MZ controls how actors use abilities in battle and how players interact with the battle system.

## Skill Data Structure

### Base Skill Structure
```javascript
{
    id: 1,                  // Unique identifier
    name: "Attack",         // Skill name
    iconIndex: 76,          // Icon image index
    description: "...",     // Skill description
    mpCost: 0,              // MP cost to use
    tpCost: 0,              // TP cost to use
    tpGain: 5,              // TP gained when using
    
    // Skill constraints
    stypeId: 0,             // Skill type ID
    occasion: 1,            // When usable (0=always, 1=battle, 2=menu, 3=never)
    speed: 0,               // Speed modifier (affects action order)
    successRate: 100,       // Success rate percentage
    repeats: 1,             // Number of times to repeat
    
    // Targeting
    scope: 1,               // Target scope (0=none, 1=one enemy, etc.)
    hitType: 1,             // Hit type (0=certain, 1=physical, 2=magical)
    
    // Requirements
    requiredWtypeId1: 0,    // Required weapon type 1
    requiredWtypeId2: 0,    // Required weapon type 2
    
    // Message and Animation
    message1: "%1 attacks!", // User message
    message2: "",           // Target message
    animationId: 1,         // Animation ID to play
    
    // Damage and effects
    damage: {},             // Damage calculation settings
    effects: []             // Special effects when used
}
```

### Scope Values
- `0`: None
- `1`: One Enemy
- `2`: All Enemies
- `3`: One Random Enemy
- `4`: Two Random Enemies
- `5`: Three Random Enemies
- `6`: Four Random Enemies
- `7`: One Ally
- `8`: All Allies
- `9`: One Ally (Dead)
- `10`: All Allies (Dead)
- `11`: The User

### Hit Types
- `0`: Certain Hit (always hits)
- `1`: Physical Attack (affected by hit/evasion)
- `2`: Magical Attack (affected by magical evasion)

## Skill Type System

Skill types are used to categorize skills and control access:

1. Each class can learn skills of specific types (magic, special attacks, etc.)
2. Skill commands in battle are organized by skill type
3. Skill types can be restricted by equipment or states

```javascript
// Default skill types
$dataSystem.skillTypes = [
    "",           // ID 0 (not used)
    "Magic",      // ID 1
    "Special"     // ID 2
    // Additional custom types...
];

// Class skill type access example
$dataClasses[1].traits.push({
    code: 41,       // Skill Type permission
    dataId: 1,      // Skill Type ID (Magic)
    value: 1        // 1=enable, 0=disable
});
```

## Battle Command Structure

Battle commands are determined by:

1. **Base commands** (Attack, Guard, etc.) defined in the database
2. **Skill Type commands** based on what skill types the actor can use
3. **Special commands** added by traits or plugins

### Command Window Setup
```javascript
// From Window_ActorCommand
Window_ActorCommand.prototype.makeCommandList = function() {
    if (this._actor) {
        this.addAttackCommand();
        this.addSkillCommands();
        this.addGuardCommand();
        this.addItemCommand();
    }
};

// Adding skill type commands
Window_ActorCommand.prototype.addSkillCommands = function() {
    const skillTypes = this._actor.skillTypes();
    for (const stypeId of skillTypes) {
        const name = $dataSystem.skillTypes[stypeId];
        this.addCommand(name, "skill", true, stypeId);
    }
};
```

## Skill Learning and Use

### Learning Skills
Actors learn skills through:
1. **Level-based learning**: Skills granted at specific actor levels
2. **Class-based learning**: Skills available to specific classes
3. **Item/event learning**: Skills granted by items or events

```javascript
// Class-based skill learning (in class data)
$dataClasses[1].learnings = [
    {
        level: 5,     // Level to learn skill
        skillId: 9    // Skill ID to learn
    },
    // More skills...
];

// Learning a skill via event/item
actor.learnSkill(skillId); // Add skill to known skills
```

### Checking Skill Availability
```javascript
// Can skill be used right now?
actor.canUse($dataSkills[3]); // Checks MP/TP cost, occasion, etc.

// Does actor know the skill?
actor.isLearnedSkill(skillId);

// Get available skills of a type
actor.skillsOfType(stypeId);
```

## Skill Execution Process

When a skill is used in battle, this process occurs:

1. **Command Selection**: Player selects the skill to use
2. **Target Selection**: Player selects the target(s)
3. **Action Creation**: `Game_Action` instance created with skill
4. **Action Execution**: Skill processing begins in BattleManager
5. **Apply Effects**: Damage calculation and effects applied
6. **Display Results**: Animation and damage numbers shown

```javascript
// Action creation for skill use
const action = new Game_Action(actor);
action.setSkill(skillId);
action.setTarget(targetIndex);

// Applying action effects
action.apply(target);
```

## Custom Skill System Extensions

### Adding New Skill Types
```javascript
// Extend skill types list
const originalSkillTypes = $dataSystem.skillTypes;
$dataSystem.skillTypes = ["", "Magic", "Special", "Techniques", "Summons"];

// Add access to the new skill type to a class
$dataClasses[2].traits.push({
    code: 41,       // Skill Type permission
    dataId: 3,      // New Skill Type ID (Techniques)
    value: 1        // Enable
});
```

### Creating a Skill Combo System
```javascript
// Example of a skill combo tracking system
Game_Actor.prototype.recordSkillUse = function(skillId) {
    this._lastUsedSkills = this._lastUsedSkills || [];
    this._lastUsedSkills.push(skillId);
    
    // Keep only the last 3 skills
    if (this._lastUsedSkills.length > 3) {
        this._lastUsedSkills.shift();
    }
    
    // Check for combos
    this.checkSkillCombos();
};

Game_Actor.prototype.checkSkillCombos = function() {
    // Example combo: Fire (3) -> Wind (4) -> Lightning (5) = Ultimate (10)
    if (this._lastUsedSkills.length === 3 &&
        this._lastUsedSkills[0] === 3 &&
        this._lastUsedSkills[1] === 4 &&
        this._lastUsedSkills[2] === 5) {
        
        // Grant temporary access to the combo skill
        this._comboSkillId = 10;
        
        // Create a turn timer to expire the combo
        this._comboTimer = 1;
    }
};
```

### Skill Cooldown System
```javascript
// Add cooldown tracking
Game_Actor.prototype.initSkillCooldowns = function() {
    this._skillCooldowns = {};
};

Game_Actor.prototype.setSkillCooldown = function(skillId, turns) {
    this._skillCooldowns[skillId] = turns;
};

Game_Actor.prototype.updateSkillCooldowns = function() {
    for (const skillId in this._skillCooldowns) {
        if (this._skillCooldowns[skillId] > 0) {
            this._skillCooldowns[skillId]--;
        }
    }
};

// Override skill availability check
const _Game_Actor_canUse = Game_Actor.prototype.canUse;
Game_Actor.prototype.canUse = function(item) {
    if (item && item.skill) {
        const skillId = item.id;
        if (this._skillCooldowns && this._skillCooldowns[skillId] > 0) {
            return false;
        }
    }
    return _Game_Actor_canUse.call(this, item);
};
```