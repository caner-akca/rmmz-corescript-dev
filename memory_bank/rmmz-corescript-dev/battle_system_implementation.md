# RPG Maker MZ - Battle System Implementation

This document details the internal implementation of the battle system in RPG Maker MZ, covering the battle flow, action execution, damage calculation, and more.

## Core Components

### BattleManager
- Located in `rmmz_managers/BattleManager.js`
- Acts as the central controller for the entire battle system
- Manages battle state, turn processing, and action execution
- Responsible for setup, execution, and cleanup of battles

### Scene_Battle
- Located in `rmmz_scenes/Scene_Battle.js`
- Handles the visual and interactive aspects of battle
- Creates and manages all battle windows and UI
- Processes player inputs and updates BattleManager accordingly

### Game_ActionResult
- Located in `rmmz_objects/Game_ActionResult.js`
- Stores the results of actions (damage, healing, states, etc.)
- Used to apply and display effects on battlers

### Game_Action
- Located in `rmmz_objects/Game_Action.js`
- Represents a single action (attack, skill, item)
- Calculates effects, damage, and applies results to targets

## Battle Flow Details

### Battle Initialization
```javascript
// Battle setup
BattleManager.setup = function(troopId, canEscape, canLose) {
    this.initMembers();
    this._canEscape = canEscape;
    this._canLose = canLose;
    $gameTroop.setup(troopId);
    $gameScreen.onBattleStart();
    this.makeEscapeRatio();
};

// Initialize system
BattleManager.initMembers = function() {
    this._phase = "init";
    this._inputting = false;
    this._canEscape = false;
    this._canLose = false;
    this._battleTest = false;
    this._eventCallback = null;
    this._preemptive = false;
    this._surprise = false;
    this._currentActor = null;
    this._actionForcedBattler = null;
    this._mapBgm = null;
    this._mapBgs = null;
    this._actionBattlers = [];
    this._subject = null;
    this._action = null;
    this._targets = [];
    this._logWindow = null;
    this._spriteset = null;
    this._escapeRatio = 0;
    this._escaped = false;
    this._rewards = {};
    this._tpbNeedsPartyCommand = true;
};
```

### Battle State Machine
BattleManager uses a state machine with different phases to control battle flow:

- **init**: Initialization phase
- **start**: Battle start phase
- **input**: Player input phase
- **turn**: Turn processing phase
- **action**: Action execution phase
- **turnEnd**: End of turn phase
- **battleEnd**: Battle end phase

```javascript
// Main update method
BattleManager.update = function(timeActive) {
    if (!this.isBusy() && !this.updateEvent()) {
        this.updatePhase(timeActive);
    }
    if (this.isTpb()) {
        this.updateTpbInput();
    }
};

// Phase transitions
BattleManager.updatePhase = function(timeActive) {
    switch (this._phase) {
        case "init":
            this.updateInit();
            break;
        case "start":
            this.updateStart();
            break;
        case "turn":
            this.updateTurn(timeActive);
            break;
        case "action":
            this.updateAction();
            break;
        case "turnEnd":
            this.updateTurnEnd();
            break;
        case "battleEnd":
            this.updateBattleEnd();
            break;
    }
};
```

### Action Execution
```javascript
// Process an action
BattleManager.startAction = function() {
    const subject = this._subject;
    const action = subject.currentAction();
    const targets = action.makeTargets();
    this._phase = "action";
    this._action = action;
    this._targets = targets;
    subject.useItem(action.item());
    this._action.applyGlobal();
    this._logWindow.startAction(subject, action, targets);
};

// Apply action effects to target
BattleManager.invokeAction = function(subject, target) {
    this._logWindow.push("performActionStart", subject, action);
    this._logWindow.push("performAction", subject, action);
    this._logWindow.push("showAnimation", subject, targets.clone(), itemId);
    this._logWindow.displayAction(subject, target);
};

// Invoke action on each target
BattleManager.invokeNormalAction = function(subject, target) {
    const realTarget = this.applySubstitute(target);
    this._action.apply(realTarget);
    this._logWindow.pushNormalActionResults(realTarget);
};
```

## Damage Calculation System

### Action Application
The Game_Action class is responsible for applying effects to targets:

```javascript
// Apply action to target
Game_Action.prototype.apply = function(target) {
    const result = target.result();
    this.subject().clearResult();
    result.clear();
    result.used = this.testApply(target);
    result.missed = !result.used || result.evaded || result.physical && this.isMiss(target);
    result.evaded = !result.missed && (result.physical && this.isEvasion(target) ||
                                       result.magicial && this.isMagicEvasion(target));
    
    if (result.isHit()) {
        if (this.item().damage.type > 0) {
            result.critical = this.isCritical(target);
            const value = this.makeDamageValue(target, result.critical);
            this.executeDamage(target, value);
        }
        
        for (const effect of this.item().effects) {
            this.applyItemEffect(target, effect);
        }
        
        this.applyItemUserEffect(target);
    }
    
    this.updateLastTarget(target);
};
```

### Damage Value Calculation
```javascript
// Calculate damage value
Game_Action.prototype.makeDamageValue = function(target, critical) {
    const item = this.item();
    const baseValue = this.evalDamageFormula(target);
    let value = baseValue * this.calcElementRate(target);
    
    if (this.isPhysical()) {
        value *= target.pdr;
    }
    if (this.isMagical()) {
        value *= target.mdr;
    }
    
    if (baseValue < 0) {
        value *= target.rec;
    }
    
    if (critical) {
        value = this.applyCritical(value);
    }
    
    value = this.applyVariance(value, item.damage.variance);
    value = this.applyGuard(value, target);
    value = Math.round(value);
    
    return value;
};

// Evaluate damage formula
Game_Action.prototype.evalDamageFormula = function(target) {
    try {
        const item = this.item();
        const a = this.subject(); // attacker
        const b = target;         // target
        const v = $gameVariables._data;
        const sign = item.damage.type >= 0 ? 1 : -1;
        const value = Math.max(eval(item.damage.formula), 0) * sign;
        
        return isNaN(value) ? 0 : value;
    } catch (e) {
        console.error(e);
        return 0;
    }
};
```

### Critical Hits and Special Cases
```javascript
// Critical hit determination
Game_Action.prototype.isCritical = function(target) {
    const cri = this.itemCri(target);
    return Math.random() < cri;
};

// Apply critical damage multiplier
Game_Action.prototype.applyCritical = function(damage) {
    return damage * 3;
};

// Apply damage variance
Game_Action.prototype.applyVariance = function(damage, variance) {
    const amp = Math.floor(Math.max(Math.abs(damage) * variance / 100, 0));
    const v = Math.randomInt(amp + 1) + Math.randomInt(amp + 1) - amp;
    return damage >= 0 ? damage + v : damage - v;
};

// Apply guard effect
Game_Action.prototype.applyGuard = function(damage, target) {
    return damage / (damage > 0 && target.isGuard() ? 2 * target.grd : 1);
};
```

## TPB (Time Progress Battle) Implementation

RPG Maker MZ introduces a new battle system called TPB, which is a hybrid of turn-based and active-time battle:

```javascript
// TPB initialization
BattleManager.initTpbActors = function() {
    for (const actor of $gameParty.members()) {
        actor.initTpbChargeTime(this.startCheck(actor));
    }
};

// Update TPB for a battler
BattleManager.updateTpb = function() {
    $gameParty.updateTpb();
    $gameTroop.updateTpb();
    this.updateAllTpbBattlers();
    this.checkTpbTurnEnd();
};

// Update all TPB battlers
BattleManager.updateAllTpbBattlers = function() {
    for (const battler of this.allBattleMembers()) {
        this.updateTpbBattler(battler);
    }
};

// Update TPB for a single battler
BattleManager.updateTpbBattler = function(battler) {
    if (battler.isTpbCharged() && !battler.isTpbTurnEnd()) {
        this.startTpbAction(battler);
    }
};

// Start TPB action for a battler
BattleManager.startTpbAction = function(battler) {
    battler.startTpbAction();
    this._subject = battler;
    this.processAction();
};
```

## Status Effect System

### State Application
The battle system handles application of states and buffs:

```javascript
// Apply item effect to target
Game_Action.prototype.applyItemEffect = function(target, effect) {
    switch (effect.code) {
        case Game_Action.EFFECT_RECOVER_HP:
            this.itemEffectRecoverHp(target, effect);
            break;
        case Game_Action.EFFECT_RECOVER_MP:
            this.itemEffectRecoverMp(target, effect);
            break;
        case Game_Action.EFFECT_GAIN_TP:
            this.itemEffectGainTp(target, effect);
            break;
        case Game_Action.EFFECT_ADD_STATE:
            this.itemEffectAddState(target, effect);
            break;
        case Game_Action.EFFECT_REMOVE_STATE:
            this.itemEffectRemoveState(target, effect);
            break;
        case Game_Action.EFFECT_ADD_BUFF:
            this.itemEffectAddBuff(target, effect);
            break;
        case Game_Action.EFFECT_ADD_DEBUFF:
            this.itemEffectAddDebuff(target, effect);
            break;
        case Game_Action.EFFECT_REMOVE_BUFF:
            this.itemEffectRemoveBuff(target, effect);
            break;
        case Game_Action.EFFECT_REMOVE_DEBUFF:
            this.itemEffectRemoveDebuff(target, effect);
            break;
        case Game_Action.EFFECT_SPECIAL:
            this.itemEffectSpecial(target, effect);
            break;
        case Game_Action.EFFECT_GROW:
            this.itemEffectGrow(target, effect);
            break;
        case Game_Action.EFFECT_LEARN_SKILL:
            this.itemEffectLearnSkill(target, effect);
            break;
        case Game_Action.EFFECT_COMMON_EVENT:
            this.itemEffectCommonEvent(target, effect);
            break;
    }
};

// Apply state addition
Game_Action.prototype.itemEffectAddState = function(target, effect) {
    if (effect.dataId === 0) {
        this.itemEffectAddAttackState(target, effect);
    } else {
        this.itemEffectAddNormalState(target, effect);
    }
};

// State resistance check
Game_Action.prototype.itemEffectAddNormalState = function(target, effect) {
    const chance = effect.value1;
    if (Math.random() < chance) {
        target.addState(effect.dataId);
        this.makeSuccess(target);
    }
};
```

## Enemy AI System

### AI Decision Making
Enemy actions are determined through the Game_Enemy class:

```javascript
// Select action for enemy
Game_Enemy.prototype.makeActions = function() {
    Game_Battler.prototype.makeActions.call(this);
    
    if (this.numActions() > 0) {
        const actionList = this.enemy().actions.filter(a => this.isActionValid(a));
        if (actionList.length > 0) {
            this.selectAllActions(actionList);
        }
    }
};

// Check if action is valid
Game_Enemy.prototype.isActionValid = function(action) {
    // Check rating
    if (action.rating < 1) {
        return false;
    }
    
    // Check condition type
    switch (action.conditionType) {
        case 1:  // Always
            return true;
        case 2:  // Turn count
            const turns = this.turnCount();
            return turns >= action.conditionParam1 && turns <= action.conditionParam2;
        case 3:  // HP
            const hp = this.hpRate() * 100;
            return hp >= action.conditionParam1 && hp <= action.conditionParam2;
        case 4:  // MP
            const mp = this.mpRate() * 100;
            return mp >= action.conditionParam1 && mp <= action.conditionParam2;
        case 5:  // State
            return this.isStateAffected(action.conditionParam1);
        case 6:  // Party Level
            const level = $gameParty.highestLevel();
            return level >= action.conditionParam1;
        case 7:  // Switch
            return $gameSwitches.value(action.conditionParam1);
    }
    return false;
};

// Select actions based on ratings
Game_Enemy.prototype.selectAllActions = function(actionList) {
    const ratingMax = Math.max(...actionList.map(a => a.rating));
    const ratingZero = ratingMax - 3;
    actionList = actionList.filter(a => a.rating > ratingZero);
    
    for (let i = 0; i < this.numActions(); i++) {
        this.selectAction(actionList, ratingZero);
    }
};

// Select an action considering ratings
Game_Enemy.prototype.selectAction = function(actionList, ratingZero) {
    const sum = actionList.reduce((r, a) => r + a.rating - ratingZero, 0);
    if (sum > 0) {
        let value = Math.randomInt(sum);
        for (const action of actionList) {
            value -= action.rating - ratingZero;
            if (value < 0) {
                return this.setAction(0, new Game_Action(this, true, action.skillId));
            }
        }
    }
    return this.setAction(0, new Game_Action(this));
};
```

## Battle Event System

RPG Maker MZ allows events to trigger during battle:

```javascript
// Check battle event triggers
BattleManager.updateEventMain = function() {
    $gameTroop.updateInterpreter();
    
    if ($gameTroop.isEventRunning()) {
        return true;
    }
    
    if (this.checkBattleEnd()) {
        return true;
    }
    
    if (this.processAction()) {
        return true;
    }
    
    if (this.checkBattleAbort()) {
        return true;
    }
    
    return this.checkBattleTriggerMain();
};

// Check specific trigger conditions
BattleManager.checkBattleTriggerMain = function() {
    if (this.checkBattleTriggerTurnEnd()) {
        return true;
    }
    
    if (this.checkBattleTriggerTurn()) {
        return true;
    }
    
    return false;
};

// Check turn triggers
BattleManager.checkBattleTriggerTurn = function() {
    if ($gameTroop.turnCount() === 0) {
        return false;
    }
    
    if (this._eventCallback) {
        this._eventCallback(this._actionBattlers);
        this._eventCallback = null;
    }
    
    return $gameTroop.isTurnEventValid();
};
```

## Battle UI Integration

### UI Components
The battle system integrates with several UI windows:

```javascript
// Battle scene setup
Scene_Battle.prototype.create = function() {
    Scene_Message.prototype.create.call(this);
    this.createDisplayObjects();
};

// Create battle UI elements
Scene_Battle.prototype.createDisplayObjects = function() {
    this.createSpriteset();
    this.createWindowLayer();
    this.createAllWindows();
    this.createButtons();
    this.createBattleField();
    BattleManager.setLogWindow(this._logWindow);
    BattleManager.setSpriteset(this._spriteset);
    this._logWindow.setSpriteset(this._spriteset);
};

// Create battle windows
Scene_Battle.prototype.createAllWindows = function() {
    this.createLogWindow();
    this.createStatusWindow();
    this.createPartyCommandWindow();
    this.createActorCommandWindow();
    this.createHelpWindow();
    this.createSkillWindow();
    this.createItemWindow();
    this.createActorWindow();
    this.createEnemyWindow();
};
```

### Action Selection Flow
```javascript
// Actor command window setup
Scene_Battle.prototype.createActorCommandWindow = function() {
    const rect = this.actorCommandWindowRect();
    this._actorCommandWindow = new Window_ActorCommand(rect);
    this._actorCommandWindow.setHandler("attack", this.commandAttack.bind(this));
    this._actorCommandWindow.setHandler("skill", this.commandSkill.bind(this));
    this._actorCommandWindow.setHandler("guard", this.commandGuard.bind(this));
    this._actorCommandWindow.setHandler("item", this.commandItem.bind(this));
    this._actorCommandWindow.setHandler("cancel", this.commandCancel.bind(this));
    this.addWindow(this._actorCommandWindow);
};

// Command handlers
Scene_Battle.prototype.commandAttack = function() {
    const action = BattleManager.inputtingAction();
    action.setAttack();
    this.onSelectAction();
};

Scene_Battle.prototype.commandSkill = function() {
    this._skillWindow.setActor(BattleManager.actor());
    this._skillWindow.setStypeId(this._actorCommandWindow.currentExt());
    this._skillWindow.refresh();
    this._skillWindow.show();
    this._skillWindow.activate();
};

// Target selection
Scene_Battle.prototype.onSelectAction = function() {
    const action = BattleManager.inputtingAction();
    if (!action.needsSelection()) {
        this.selectNextCommand();
    } else if (action.isForOpponent()) {
        this.selectEnemySelection();
    } else {
        this.selectActorSelection();
    }
};
```

## Custom Battle Systems

### Action Sequencing
A custom action sequence system can be implemented by extending the BattleManager:

```javascript
// Custom action sequencing
BattleManager.processActionSequence = function() {
    if (!this._action || !this._subject) return false;
    
    const item = this._action.item();
    if (!item.actionSequence) return false;
    
    // Parse sequence data
    const sequence = JSON.parse(item.actionSequence);
    this._sequenceIndex = 0;
    this._actionSequence = sequence;
    this._waitCount = 0;
    
    return true;
};

// Process sequence steps
BattleManager.updateActionSequence = function() {
    if (this._waitCount > 0) {
        this._waitCount--;
        return true;
    }
    
    if (this._actionSequence && this._sequenceIndex < this._actionSequence.length) {
        const step = this._actionSequence[this._sequenceIndex];
        this.executeSequenceStep(step);
        this._sequenceIndex++;
        return true;
    }
    
    this._actionSequence = null;
    return false;
};

// Execute a sequence step
BattleManager.executeSequenceStep = function(step) {
    switch (step.type) {
        case "animation":
            this._spriteset.showAnimation(
                this._subject, this._targets, step.animationId
            );
            this._waitCount = step.wait || 60;
            break;
        case "damage":
            for (const target of this._targets) {
                const result = target.result();
                const value = step.formula ? 
                    this.evalSequenceFormula(step.formula, target) : 
                    this._action.makeDamageValue(target, false);
                this._action.executeDamage(target, value);
                target.startDamagePopup();
            }
            this._waitCount = step.wait || 30;
            break;
        case "effect":
            for (const target of this._targets) {
                this._action.itemEffectAddState(target, {
                    dataId: step.stateId,
                    value1: step.chance || 1
                });
            }
            this._waitCount = step.wait || 30;
            break;
        case "motion":
            if (step.battler === "subject") {
                this._subject.requestMotion(step.motion);
            } else {
                for (const target of this._targets) {
                    target.requestMotion(step.motion);
                }
            }
            this._waitCount = step.wait || 12;
            break;
        case "wait":
            this._waitCount = step.frames || 60;
            break;
    }
};
```

### Chain Skills System
A skill chaining system can be implemented by tracking previous skills:

```javascript
// Initialize chain system
Game_Battler.prototype.initSkillChains = function() {
    this._skillChainCount = 0;
    this._lastSkillId = 0;
    this._skillChainBonus = 1.0;
};

// Register skill use in chain
Game_Battler.prototype.registerSkillChain = function(skillId) {
    const skill = $dataSkills[skillId];
    if (!skill) return;
    
    if (skill.meta.chainGroup && this._lastChainGroup === skill.meta.chainGroup) {
        // Part of a chain group
        this._skillChainCount++;
        // Increase damage bonus with each chain
        this._skillChainBonus = Math.min(2.0, 1.0 + (this._skillChainCount * 0.1));
    } else {
        // Reset chain
        this._skillChainCount = 1;
        this._skillChainBonus = 1.0;
    }
    
    this._lastSkillId = skillId;
    this._lastChainGroup = skill.meta.chainGroup;
    
    // Show chain visual effect
    if (this._skillChainCount > 1) {
        $gameScreen.startFlash([255, 255, 0, 128], 5); // Yellow flash
        $gameScreen.startShake(this._skillChainCount, 5, 5);
    }
};

// Apply chain bonus to damage
const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
Game_Action.prototype.makeDamageValue = function(target, critical) {
    let value = _Game_Action_makeDamageValue.call(this, target, critical);
    
    if (this.isSkill() && this.subject()._skillChainBonus > 1.0) {
        value = Math.floor(value * this.subject()._skillChainBonus);
        // Display chain message
        BattleManager._logWindow.push('addText', 
            `Chain x${this.subject()._skillChainCount}! (${Math.floor((this.subject()._skillChainBonus - 1) * 100)}% bonus)`);
    }
    
    return value;
};
```

### Break System
A weakness/break system similar to modern RPGs can be implemented:

```javascript
// Initialize break system
Game_Battler.prototype.initBreakSystem = function() {
    this._breakGauge = {};
    this._breakState = false;
    
    // Initialize gauges for each element
    for (let i = 1; i < $dataSystem.elements.length; i++) {
        this._breakGauge[i] = 0;
    }
};

// Add break damage
Game_Battler.prototype.addBreakDamage = function(elementId, value) {
    if (!this._breakGauge) this.initBreakSystem();
    
    // Only add break if not already broken
    if (!this._breakState) {
        this._breakGauge[elementId] = (this._breakGauge[elementId] || 0) + value;
        
        // Check if break threshold reached
        if (this._breakGauge[elementId] >= 100) {
            this.applyBreak(elementId);
        }
    }
};

// Apply break state
Game_Battler.prototype.applyBreak = function(elementId) {
    this._breakState = true;
    this._breakElementId = elementId;
    this._breakDuration = 2; // Last for 2 turns
    
    // Apply break effects
    this.addState(15); // Break state (needs to be defined in database)
    
    // Visual effects
    $gameScreen.startFlash([255, 0, 0, 192], 30);
    
    // Log message
    BattleManager._logWindow.push('addText', 
        `${this.name()}'s ${$dataSystem.elements[elementId]} resistance BROKE!`);
};

// Recover from break
Game_Battler.prototype.updateBreakState = function() {
    if (this._breakState) {
        if (this._breakDuration > 0) {
            this._breakDuration--;
        } else {
            this.removeBreak();
        }
    }
};

// Remove break state
Game_Battler.prototype.removeBreak = function() {
    this._breakState = false;
    this.removeState(15); // Break state
    
    // Reset all break gauges
    for (let i = 1; i < $dataSystem.elements.length; i++) {
        this._breakGauge[i] = 0;
    }
    
    // Log message
    BattleManager._logWindow.push('addText', 
        `${this.name()} recovered from BREAK!`);
};
```