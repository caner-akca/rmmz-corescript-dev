# RPG Maker MZ - Game_Party System

The Game_Party class in RPG Maker MZ manages the player's party, including party members, inventory, and party-wide functionality.

## Core Structure

### Class Information
- Located in `rmmz_objects/Game_Party.js`
- Instantiated as a single global object `$gameParty`
- Extends `Game_Unit` (located in `rmmz_objects/Game_Unit.js`)

## Party Management

### Party Members
```javascript
// Party member access
$gameParty.members();          // Get all party members
$gameParty.battleMembers();    // Get battle members
$gameParty.maxBattleMembers(); // Get max battle members (default: 4)
$gameParty.leader();           // Get party leader (first member)
$gameParty.size();             // Get party size
$gameParty.isEmpty();          // Check if party is empty

// Add/remove party members
$gameParty.addActor(actorId);     // Add actor to party
$gameParty.removeActor(actorId);  // Remove actor from party
$gameParty.swapOrder(index1, index2); // Swap member positions

// Member location
$gameParty.allMembers();       // Get all party members
$gameParty.frontRowMembers();  // Get front row members
$gameParty.backRowMembers();   // Get back row members
```

### Party Position
```javascript
// Formation control
$gameParty.makeMenuActorNext(); // Select next actor in menu
$gameParty.makeMenuActorPrevious(); // Select previous actor in menu
$gameParty.targetActor();      // Get target actor

// Battle position
$gameParty.isAllDead();        // Check if all members are dead
$gameParty.onBattleStart();    // Called when battle starts
$gameParty.onBattleEnd();      // Called when battle ends
```

## Inventory Management

### Item Management
```javascript
// Item access
$gameParty.items();             // Get all items
$gameParty.weapons();           // Get all weapons
$gameParty.armors();            // Get all armors
$gameParty.equipItems();        // Get all equippable items
$gameParty.allItems();          // Get all items, weapons, and armors

// Item quantity
$gameParty.numItems(item);      // Get quantity of item
$gameParty.maxItems(item);      // Get max quantity of item
$gameParty.hasMaxItems(item);   // Check if at max quantity
$gameParty.hasItem(item, includeEquip); // Check if party has item

// Item modification
$gameParty.gainItem(item, amount, includeEquip); // Add items
$gameParty.loseItem(item, amount, includeEquip); // Remove items
$gameParty.discardAllItems();   // Discard all items

// Item quantity limits
Game_Party.prototype.maxItems = function(item) {
    return 99;
};
```

### Gold Management
```javascript
// Gold access
$gameParty.gold();              // Get party gold
$gameParty.maxGold();           // Get max gold (default: 99999999)

// Gold modification
$gameParty.gainGold(amount);    // Add gold
$gameParty.loseGold(amount);    // Remove gold
$gameParty.setGold(amount);     // Set gold to specific amount
```

### Steps Management
```javascript
// Step counting
$gameParty.steps();             // Get step count
$gameParty.increaseSteps();     // Increase step count
```

## Battle-Related Functions

### Party Status
```javascript
// Party status
$gameParty.onPlayerWalk();      // Called when player walks
$gameParty.isPartialRefresh();  // Check if partial refresh needed
$gameParty.allBattleMembers();  // Get all battle members
```

### Menu Selection
```javascript
// Menu actor selection
$gameParty.menuActor();         // Get selected menu actor
$gameParty.setMenuActor(actor); // Set selected menu actor
$gameParty.makeMenuActorNext(); // Select next menu actor
$gameParty.makeMenuActorPrevious(); // Select previous menu actor
$gameParty.targetActor();       // Get target actor
```

### Battle Status
```javascript
// In-battle functions
$gameParty.requestMotionRefresh(); // Request motion refresh
$gameParty.aliveBattleMembers(); // Get alive battle members
$gameParty.isValidTarget(unit, type); // Check valid target
$gameParty.idleMotion();        // Get idle motion
$gameParty.getCommonEventIds(); // Get common event IDs

// Battle status checking
$gameParty.tgrSum();            // Get sum of target rate
$gameParty.randomTarget();      // Get random target
$gameParty.randomDeadTarget();  // Get random dead target
$gameParty.smoothTarget(index); // Get target at index
$gameParty.smoothDeadTarget(index); // Get dead target at index
```

## Party Formation and Configuration

### Battle Formation
```javascript
// Battle position
$gameParty.isBattleMember(actor); // Check if actor is in battle
$gameParty.setByIndex = true;   // Set by index flag

// Battle formation
$gameParty.battleMembers = function() {
    if (this._battleMembers) {
        return this._battleMembers.slice(0);
    } else {
        return this.allMembers().slice(0, this.maxBattleMembers());
    }
};

// Custom battle formations
$gameParty.setFormation = function(formationId) {
    this._formationId = formationId;
    this.refreshFormationPositions();
};

$gameParty.refreshFormationPositions = function() {
    const positions = this.formationPositions();
    for (let i = 0; i < this.battleMembers().length; i++) {
        const actor = this.battleMembers()[i];
        if (positions[i]) {
            actor.setScreenPosition(positions[i].x, positions[i].y);
        }
    }
};
```

### Party Items and Sorting
```javascript
// Sort party items
$gameParty.initAllItems = function() {
    this._items = {};
    this._weapons = {};
    this._armors = {};
};

$gameParty.items = function() {
    return Object.keys(this._items).map(id => $dataItems[id]);
};

// Sort items by various methods
$gameParty.sortItems = function(method) {
    switch (method) {
        case "id":
            this.sortItemsById();
            break;
        case "type":
            this.sortItemsByType();
            break;
        case "name":
            this.sortItemsByName();
            break;
        default:
            // Default sorting
            break;
    }
};
```

## Custom Party Systems

### Party Limit Breaking
```javascript
// Extend max battle members
Game_Party.prototype.maxBattleMembers = function() {
    // Check if party has limit break item
    if (this.hasItem($dataItems[10])) {
        return 6; // Increased party size
    }
    return 4; // Default party size
};

// Implement party-wide limit break
Game_Party.prototype.limitBreak = function() {
    // Give all members special state
    for (const member of this.members()) {
        member.addState(15); // Limit break state
    }
    
    // Play limit break effect
    $gameScreen.startFlash([255, 0, 0, 128], 30);
    AudioManager.playSe({
        name: "Limit",
        volume: 90,
        pitch: 100,
        pan: 0
    });
    
    // Set timer for limit break duration
    this._limitBreakTurns = 3;
};

// Check if party is in limit break
Game_Party.prototype.isLimitBreak = function() {
    return this._limitBreakTurns > 0;
};

// Update limit break status at turn end
Game_Party.prototype.updateLimitBreak = function() {
    if (this._limitBreakTurns > 0) {
        this._limitBreakTurns--;
        if (this._limitBreakTurns === 0) {
            // End limit break
            for (const member of this.members()) {
                member.removeState(15);
            }
        }
    }
};
```

### Party Relationship System
```javascript
// Initialize relationship values
Game_Party.prototype.initializeRelationships = function() {
    this._relationships = {};
    
    // Create relationship grid for all actors
    for (let i = 1; i < $dataActors.length; i++) {
        this._relationships[i] = {};
        for (let j = 1; j < $dataActors.length; j++) {
            if (i !== j) {
                this._relationships[i][j] = 50; // Default relationship value
            }
        }
    }
};

// Increase relationship between actors
Game_Party.prototype.increaseRelationship = function(actorId1, actorId2, amount) {
    if (this._relationships && actorId1 !== actorId2) {
        this._relationships[actorId1][actorId2] += amount;
        this._relationships[actorId2][actorId1] += amount;
        
        // Cap at 0-100
        this._relationships[actorId1][actorId2] = 
            this._relationships[actorId1][actorId2].clamp(0, 100);
        this._relationships[actorId2][actorId1] = 
            this._relationships[actorId2][actorId1].clamp(0, 100);
        
        return true;
    }
    return false;
};

// Get relationship value
Game_Party.prototype.getRelationship = function(actorId1, actorId2) {
    if (this._relationships && actorId1 !== actorId2) {
        return this._relationships[actorId1][actorId2];
    }
    return 0;
};

// Get relationship level description
Game_Party.prototype.getRelationshipLevel = function(actorId1, actorId2) {
    const value = this.getRelationship(actorId1, actorId2);
    
    if (value >= 90) return "Best Friends";
    if (value >= 75) return "Close Friends";
    if (value >= 50) return "Friends";
    if (value >= 25) return "Acquaintances";
    if (value >= 10) return "Distant";
    return "Strangers";
};

// Relationship battle benefits
Game_Party.prototype.getRelationshipBonus = function(actorId1, actorId2) {
    const level = this.getRelationship(actorId1, actorId2);
    return Math.floor(level / 20); // 0-5 bonus based on relationship
};
```

### Party Quest System
```javascript
// Initialize quest system
Game_Party.prototype.initializeQuests = function() {
    this._quests = [];
    this._activeQuestId = 0;
    this._completedQuests = [];
};

// Add a quest
Game_Party.prototype.addQuest = function(questId) {
    if (!this.hasQuest(questId)) {
        this._quests.push({
            id: questId,
            data: $dataQuests[questId], // Assuming custom $dataQuests
            progress: 0, 
            objectives: this.initializeQuestObjectives(questId),
            startTime: Graphics.frameCount
        });
        
        // Auto-activate if no active quest
        if (this._activeQuestId === 0) {
            this._activeQuestId = questId;
        }
        
        return true;
    }
    return false;
};

// Check if has quest
Game_Party.prototype.hasQuest = function(questId) {
    return this._quests.some(q => q.id === questId) || 
           this._completedQuests.includes(questId);
};

// Update quest progress
Game_Party.prototype.updateQuestProgress = function(questId, objectiveId, value) {
    const quest = this._quests.find(q => q.id === questId);
    if (quest && quest.objectives[objectiveId]) {
        quest.objectives[objectiveId].current += value;
        
        // Cap at target value
        const target = quest.objectives[objectiveId].target;
        quest.objectives[objectiveId].current = 
            Math.min(quest.objectives[objectiveId].current, target);
        
        // Update overall progress
        this.updateOverallQuestProgress(quest);
        
        // Check for completion
        if (quest.progress >= 100) {
            this.completeQuest(questId);
        }
        
        return true;
    }
    return false;
};

// Complete a quest
Game_Party.prototype.completeQuest = function(questId) {
    const questIndex = this._quests.findIndex(q => q.id === questId);
    if (questIndex >= 0) {
        const quest = this._quests[questIndex];
        
        // Give rewards
        this.giveQuestRewards(quest);
        
        // Move to completed list
        this._completedQuests.push(questId);
        this._quests.splice(questIndex, 1);
        
        // Update active quest if needed
        if (this._activeQuestId === questId) {
            this._activeQuestId = this._quests.length > 0 ? this._quests[0].id : 0;
        }
        
        return true;
    }
    return false;
};
```

### Party Camping and Rest System
```javascript
// Initialize camping system
Game_Party.prototype.initializeCamping = function() {
    this._lastCampTime = 0;
    this._campingSupplies = 3; // Start with 3 camping supplies
    this._campCount = 0;
};

// Set up camp
Game_Party.prototype.camp = function() {
    if (this._campingSupplies > 0) {
        // Record camping time
        this._lastCampTime = $gameSystem.playtime();
        this._campCount++;
        
        // Use supplies
        this._campingSupplies--;
        
        // Heal party (partial recovery)
        for (const member of this.members()) {
            member.setHp(member.mhp * 0.5 + member.hp * 0.5);
            member.setMp(member.mmp * 0.3 + member.mp * 0.7);
            
            // Remove certain states
            for (const stateId of this.campCurableStates()) {
                member.removeState(stateId);
            }
        }
        
        // Trigger camping events
        this.processCampingEvents();
        
        return true;
    }
    return false;
};

// Define states curable by camping
Game_Party.prototype.campCurableStates = function() {
    return [1, 4, 5, 6]; // State IDs curable by camping
};

// Process special camping events
Game_Party.prototype.processCampingEvents = function() {
    // Check for special dialogue based on party members
    for (const member of this.members()) {
        // Check for special camping dialogue
        if (member.actor().meta.campDialog) {
            // 20% chance for each character to speak
            if (Math.random() < 0.2) {
                const dialogId = Number(member.actor().meta.campDialog);
                // Trigger a common event with the dialogue
                $gameTemp.reserveCommonEvent(dialogId);
            }
        }
    }
    
    // Special events based on camping count
    if (this._campCount === 5) {
        // Special event after 5 camps
        $gameTemp.reserveCommonEvent(10);
    }
};
```

### Party Reputation System
```javascript
// Initialize reputation system
Game_Party.prototype.initializeReputation = function() {
    this._reputation = {};
    
    // Initialize reputation for each faction
    this._reputation.kingdom = 50;
    this._reputation.rebels = 50;
    this._reputation.merchants = 50;
    this._reputation.wilds = 50;
};

// Change reputation
Game_Party.prototype.changeReputation = function(faction, amount) {
    if (this._reputation[faction] !== undefined) {
        this._reputation[faction] += amount;
        this._reputation[faction] = this._reputation[faction].clamp(0, 100);
        
        // Check for reputation thresholds
        this.checkReputationThresholds(faction);
        
        return true;
    }
    return false;
};

// Get reputation level
Game_Party.prototype.getReputationLevel = function(faction) {
    const rep = this._reputation[faction];
    
    if (rep >= 90) return "Exalted";
    if (rep >= 75) return "Honored";
    if (rep >= 50) return "Friendly";
    if (rep >= 25) return "Neutral";
    if (rep >= 10) return "Unfriendly";
    return "Hostile";
};

// Check for reputation thresholds
Game_Party.prototype.checkReputationThresholds = function(faction) {
    const rep = this._reputation[faction];
    
    // Reputation-based switch triggers
    switch (faction) {
        case "kingdom":
            if (rep >= 75 && !$gameSwitches.value(10)) {
                $gameSwitches.setValue(10, true); // Kingdom high rep switch
            } else if (rep < 75 && $gameSwitches.value(10)) {
                $gameSwitches.setValue(10, false);
            }
            
            if (rep <= 25 && !$gameSwitches.value(11)) {
                $gameSwitches.setValue(11, true); // Kingdom low rep switch
            } else if (rep > 25 && $gameSwitches.value(11)) {
                $gameSwitches.setValue(11, false);
            }
            break;
            
        // Similar checks for other factions...
    }
};
```