# RPG Maker MZ - Game_Actor System

The Game_Actor class in RPG Maker MZ represents playable characters and manages their attributes, equipment, skills, and level progression.

## Core Structure

### Class Hierarchy
- **Game_BattlerBase**: Foundation for all battler functionality
  - **Game_Battler**: Common battler methods for both actors and enemies
    - **Game_Actor**: Actor-specific implementation

### File Location
- Located in `rmmz_objects/Game_Actor.js`

## Actor Initialization

```javascript
// Create a new actor instance
const actor = new Game_Actor(actorId);

// Actor initialization process
Game_Actor.prototype.initialize = function(actorId) {
    Game_Battler.prototype.initialize.call(this);
    this.setup(actorId);
};

// Actor setup from database
Game_Actor.prototype.setup = function(actorId) {
    const actor = $dataActors[actorId];
    this._actorId = actorId;
    this._name = actor.name;
    this._nickname = actor.nickname;
    this._profile = actor.profile;
    this._classId = actor.classId;
    this._level = actor.initialLevel;
    this.initImages();
    this.initExp();
    this.initSkills();
    this.initEquips(actor.equips);
    this.clearParamPlus();
    this.recoverAll();
};
```

## Actor Properties

### Basic Properties
```javascript
// Access basic properties
actor.actorId();      // Get actor ID
actor.name();         // Get name
actor.setName(name);  // Set name
actor.nickname();     // Get nickname
actor.setNickname(nick); // Set nickname
actor.profile();      // Get profile
actor.setProfile(profile); // Set profile
actor.characterName(); // Get map character image filename
actor.characterIndex(); // Get index on character sheet
actor.faceName();     // Get face image filename
actor.faceIndex();    // Get index on face sheet
actor.battlerName();  // Get battle image filename

// Change actor images
actor.setCharacterImage(name, index);
actor.setFaceImage(name, index);
actor.setBattlerImage(name);
```

### Level and Parameters
```javascript
// Level properties
actor.level;          // Current level
actor.currentClass(); // Returns $dataClasses[actor._classId]
actor.isMaxLevel();   // Check if at max level
actor.maxLevel();     // Get max possible level

// Experience points
actor.currentExp();   // Current EXP
actor.currentLevelExp(); // EXP needed for current level
actor.nextLevelExp(); // EXP needed for next level
actor.nextRequiredExp(); // EXP needed to level up

// Change level and experience
actor.changeLevel(level, show); // Change level (show message if true)
actor.levelUp();      // Level up
actor.levelDown();    // Level down
actor.gainExp(exp);   // Gain experience points
actor.changeExp(exp, show); // Set experience (show message if true)

// Parameters (stats)
actor.paramBase(paramId);  // Base value for parameter
actor.paramPlus(paramId);  // Bonus from equipment and states
actor.attackElements();    // Elements added to attacks
actor.attackStates();      // States that can be added by attacks
actor.attackStatesRate(stateId); // Chance of adding state
actor.attackSpeed();       // Speed modifier for attacks
actor.attackTimesAdd();    // Additional number of attacks
```

## Skills and Class System

### Skills Management
```javascript
// Skill access and learning
actor.skills();          // Get all skills
actor.usableSkills();    // Get skills that can be used now
actor.isLearnedSkill(skillId); // Check if skill is learned
actor.learnSkill(skillId); // Learn a skill
actor.forgetSkill(skillId); // Forget a skill

// Skill types
actor.skillTypes();      // Get available skill types
actor.skills().filter(skill => skill.stypeId === typeId); // Filter by type

// Skill learning through level up
Game_Actor.prototype.levelUp = function() {
    this._level++;
    for (const learning of this.currentClass().learnings) {
        if (learning.level === this._level) {
            this.learnSkill(learning.skillId);
        }
    }
};
```

### Class System
```javascript
// Class management
actor.currentClass(); // Get current class data
actor.changeClass(classId, keepExp); // Change class

// Class-based parameter growth
Game_Actor.prototype.paramBase = function(paramId) {
    const classParam = this.currentClass().params[paramId][this._level];
    return Math.floor(classParam * this.paramBaseMultiplier(paramId));
};

// Class-based trait acquisition
Game_Actor.prototype.traitObjects = function() {
    const objects = Game_Battler.prototype.traitObjects.call(this);
    objects.push(this.actor(), this.currentClass());
    for (const item of this.equips()) {
        if (item) {
            objects.push(item);
        }
    }
    return objects;
};
```

## Equipment System

### Equipment Slots
```javascript
// Equipment management
actor.equips();         // Get all equipment
actor.weapons();        // Get equipped weapons
actor.armors();         // Get equipped armors
actor.hasWeapon(weapon); // Check if specific weapon is equipped
actor.hasArmor(armor);  // Check if specific armor is equipped

// Equipment slots
actor.equipSlots();     // Get available equipment slots
actor.isEquipChangeOk(slotId); // Check if equipment can be changed
actor.changeEquip(slotId, item); // Change equipment
actor.forceChangeEquip(slotId, item); // Change equipment (ignoring restrictions)
actor.discardEquip(item); // Remove specific equipment
actor.releaseUnequippableItems(forcing); // Remove invalid equipment

// Equipment initialization
Game_Actor.prototype.initEquips = function(equips) {
    const slots = this.equipSlots();
    const maxSlots = slots.length;
    this._equips = [];
    for (let i = 0; i < maxSlots; i++) {
        this._equips[i] = new Game_Item();
    }
    for (let j = 0; j < equips.length; j++) {
        if (j < maxSlots) {
            this._equips[j].setEquip(slots[j] === 1, equips[j]);
        }
    }
    this.refresh();
};
```

### Equipment Compatibility
```javascript
// Compatibility checks
actor.canEquip(item);    // Check if actor can equip item
actor.canEquipWeapon(item); // Check if actor can equip weapon
actor.canEquipArmor(item); // Check if actor can equip armor

Game_Actor.prototype.canEquipWeapon = function(item) {
    return (
        this.wtypeOk(item.wtypeId) &&
        !this.isEquipTypeSealed(item.etypeId)
    );
};

Game_Actor.prototype.canEquipArmor = function(item) {
    return (
        this.atypeOk(item.atypeId) &&
        !this.isEquipTypeSealed(item.etypeId)
    );
};

// Weapon/armor type compatibility
Game_Actor.prototype.wtypeOk = function(wtypeId) {
    return this.traits(Game_BattlerBase.TRAIT_EQUIP_WTYPE).some(
        trait => trait.dataId === wtypeId
    );
};

Game_Actor.prototype.atypeOk = function(atypeId) {
    return this.traits(Game_BattlerBase.TRAIT_EQUIP_ATYPE).some(
        trait => trait.dataId === atypeId
    );
};
```

## Party Management

### Party Membership
```javascript
// Check party membership
actor.isFormationChangeOk(); // Can change formation
actor.currentExp();          // Get current experience
actor.friendsUnit();         // Get party unit
actor.onBattleStart();       // Called when battle starts
actor.onBattleEnd();         // Called when battle ends
actor.onAllActionsEnd();     // Called when all actions end
actor.onTurnEnd();           // Called at end of turn
actor.onDamage(value);       // Called when taking damage

// Party-based state checking
actor.restrictedSkillTypes(); // Get restricted skill types
actor.addedSkillTypes();      // Get added skill types
```

## Action and Battle System

### Action Handling
```javascript
// Action methods
actor.makeActionList();      // Create list of possible actions
actor.makeAutoBattleActions(); // Auto-battle action selection
actor.makeConfusionActions(); // Confused action selection
actor.makeActions();         // Create action set for turn
actor.action(index);         // Get specific action
actor.setAction(index, action); // Set specific action
actor.clearActions();        // Remove all actions

// Action decision-making
Game_Actor.prototype.makeActionList = function() {
    const list = [];
    const skills = this.usableSkills();
    for (const skill of skills) {
        list.push({
            name: skill.name,
            item: skill,
            itemCnt: 1,
            value: this.evaluateSkill(skill)
        });
    }
    list.sort((a, b) => b.value - a.value);
    return list;
};
```

### Battle Status
```javascript
// Battle methods
actor.basicFloorDamage();    // Damage from floor effects
actor.clearResult();         // Clear action results
actor.clearActions();        // Clear all actions
actor.gainSilentTp(value);   // Gain TP (without message)
actor.isAnimationRequested(); // Check if animation is requested
actor.startAnimation(animationId, mirror, delay); // Start animation
actor.performDamage();       // Execute damage animation
actor.performAttack();       // Execute attack animation
actor.performEvasion();      // Execute evasion animation
actor.performMagicEvasion(); // Execute magic evasion animation
actor.performCounter();      // Execute counter animation
actor.performReflection();   // Execute reflection animation
actor.performCollapse();     // Execute collapse animation
```

## Actor Growth and Progression

### Experience and Level Management
```javascript
// Experience curve calculation
Game_Actor.prototype.expForLevel = function(level) {
    const c = this.currentClass();
    const basis = c.expParams[0];
    const extra = c.expParams[1];
    const acc_a = c.expParams[2];
    const acc_b = c.expParams[3];
    return Math.round(
        (basis * Math.pow(level - 1, 0.9 + acc_a / 250) * level * (level + 1)) /
            (6 + Math.pow(level, 2) / 50 / acc_b) +
            (level - 1) * extra
    );
};

// Initialize experience points
Game_Actor.prototype.initExp = function() {
    this._exp = {};
    this._exp[this._classId] = this.currentLevelExp();
};

// Change experience
Game_Actor.prototype.changeExp = function(exp, show) {
    exp = Math.max(exp, 0);
    const lastLevel = this._level;
    const lastSkills = this.skills();
    this._exp[this._classId] = exp;
    while (!this.isMaxLevel() && this.currentExp() >= this.nextLevelExp()) {
        this.levelUp();
    }
    while (this.currentExp() < this.currentLevelExp()) {
        this.levelDown();
    }
    if (show && this._level > lastLevel) {
        this.displayLevelUp(this.findNewSkills(lastSkills));
    }
    this.refresh();
};
```

### Stat Growth Management
```javascript
// Parameter calculations
Game_Actor.prototype.paramBase = function(paramId) {
    const classParams = this.currentClass().params[paramId][this._level];
    return Math.floor(classParams * this.paramBaseMultiplier(paramId));
};

Game_Actor.prototype.paramPlus = function(paramId) {
    let value = Game_Battler.prototype.paramPlus.call(this, paramId);
    for (const item of this.equips()) {
        if (item) {
            value += item.params[paramId];
        }
    }
    return value;
};

// Growth rate modifiers
Game_Actor.prototype.paramBaseMultiplier = function(paramId) {
    let multiplier = 100; 
    
    // Get growth traits
    const growthTraits = this.traits(Game_BattlerBase.TRAIT_PARAM_GROWTH);
    for (const trait of growthTraits) {
        if (trait.dataId === paramId) {
            multiplier *= trait.value;
        }
    }
    
    return multiplier / 100;
};
```

## Advanced Actor Features

### Custom State Management
```javascript
// Custom state handling
Game_Actor.prototype.stateResistSet = function() {
    return this.traits(Game_BattlerBase.TRAIT_STATE_RESIST).map(trait => trait.dataId);
};

Game_Actor.prototype.stateRate = function(stateId) {
    let rate = Game_Battler.prototype.stateRate.call(this, stateId);
    
    // Add class & equipment state rates
    for (const obj of [this.actor(), this.currentClass()]) {
        const note = obj.note || "";
        const match = note.match(new RegExp(`<${stateId} Rate: (\\d+)%>`));
        if (match) {
            rate *= parseInt(match[1]) / 100;
        }
    }
    
    return rate;
};
```

### Custom Parameter Calculations
```javascript
// Advanced parameter calculations
Game_Actor.prototype.specialParameter = function(paramName) {
    let value = 0;
    
    // Base from class
    const baseValue = this.currentClass().specialParams[paramName] || 0;
    value += baseValue;
    
    // Equipment bonuses
    for (const item of this.equips()) {
        if (item && item.specialParams) {
            value += item.specialParams[paramName] || 0;
        }
    }
    
    // State modifiers
    for (const state of this.states()) {
        if (state.specialParams) {
            value += state.specialParams[paramName] || 0;
        }
    }
    
    return value;
};
```

### Custom Growth Systems
```javascript
// Advanced growth system example
Game_Actor.prototype.distributionPoints = function() {
    return this._distributionPoints || 0;
};

Game_Actor.prototype.gainDistributionPoints = function(points) {
    this._distributionPoints = (this._distributionPoints || 0) + points;
};

Game_Actor.prototype.levelUp = function() {
    this._level++;
    this.gainDistributionPoints(5); // Gain 5 distribution points on level up
    
    // Learn skills as normal
    const newSkills = [];
    for (const learning of this.currentClass().learnings) {
        if (learning.level === this._level) {
            this.learnSkill(learning.skillId);
            newSkills.push($dataSkills[learning.skillId]);
        }
    }
    
    return newSkills;
};

Game_Actor.prototype.distributePoints = function(paramId, points) {
    if (this._distributionPoints >= points) {
        this._paramPlus[paramId] = (this._paramPlus[paramId] || 0) + points;
        this._distributionPoints -= points;
        this.refresh();
        return true;
    }
    return false;
};
```