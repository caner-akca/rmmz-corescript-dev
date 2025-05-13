# Quest System Design for Procedural RPG Maker MZ Development

This document outlines the design of a Quest System that connects NPCs, locations, and objectives for your procedurally generated RPG Maker MZ games.

## Core Concepts

The Quest System serves as a framework for creating, tracking, and completing gameplay objectives, handling:

1. Quest definition and structure
2. NPC and location connectivity
3. Progress tracking and state management
4. Reward distribution
5. Quest generation from templates

## Data Structures

### Quest Registry

```javascript
class QuestRegistry {
  constructor() {
    this.quests = new Map(); // questId -> QuestData
    this.activeQuests = new Set(); // Set of active questIds
    this.completedQuests = new Set(); // Set of completed questIds
    this.failedQuests = new Set(); // Set of failed questIds
  }
  
  // Quest data structure
  // questId: String - unique identifier
  // title: String - display name
  // description: String - quest description
  // type: String - "main", "side", "guild", etc.
  // difficulty: Number - difficulty level
  // minLevel: Number - minimum player level
  // isHidden: Boolean - hidden until requirements met
  // isFailable: Boolean - can be failed
  // expiresAfter: Number - game days until expiration (0 = never)
  // startConditions: Array of Condition objects
  // failConditions: Array of Condition objects
  // objectives: Array of Objective objects
  // rewards: Array of Reward objects
  // giver: NPCReference
  // turnIn: NPCReference
  // relatedMaps: Array of MapReference
  // tags: Array of String
  // state: "inactive", "active", "completed", "failed", "expired"
}
```

### Objectives

```javascript
// Objective Types and Structure
const objectiveTypes = {
  kill: {
    targetId: Number, // Enemy ID
    targetName: String, // Enemy name
    count: Number, // Required kills
    mapId: Number, // Specific map or 0 for any
    regionId: Number // Specific region or 0 for any
  },
  
  collect: {
    itemId: Number, // Item ID
    itemName: String, // Item name
    count: Number, // Required items
    sourceType: String, // "drop", "chest", "gather", etc.
    sourceId: Number // Specific source ID or 0 for any
  },
  
  talk: {
    npcId: Number, // NPC ID
    npcName: String, // NPC name
    mapId: Number, // Map ID
    dialogKey: String // Specific dialog to trigger
  },
  
  escort: {
    npcId: Number, // NPC to escort
    npcName: String, // NPC name
    startMapId: Number, // Starting point
    endMapId: Number, // Destination
    maxTime: Number // Time limit in game minutes
  },
  
  location: {
    mapId: Number, // Target map
    mapName: String, // Map name
    x: Number, // X coordinate (0 for any)
    y: Number, // Y coordinate (0 for any)
    regionId: Number // Region ID (0 for any)
  },
  
  interact: {
    targetId: Number, // Event ID
    targetName: String, // Event name
    mapId: Number, // Map ID
    action: String // "examine", "activate", etc.
  },
  
  custom: {
    key: String, // Custom objective identifier
    value: Number, // Target value
    description: String, // Human-readable description
    evalFunction: String // Custom evaluation code
  }
}
```

### Rewards

```javascript
// Reward Types and Structure
const rewardTypes = {
  gold: {
    amount: Number
  },
  
  exp: {
    amount: Number
  },
  
  item: {
    itemId: Number,
    itemName: String,
    count: Number
  },
  
  weapon: {
    weaponId: Number,
    weaponName: String,
    count: Number
  },
  
  armor: {
    armorId: Number,
    armorName: String,
    count: Number
  },
  
  skill: {
    skillId: Number,
    skillName: String
  },
  
  relationship: {
    npcId: Number,
    npcName: String,
    amount: Number // Positive or negative value
  },
  
  unlockQuest: {
    questId: Number,
    questTitle: String
  },
  
  unlockMap: {
    mapId: Number,
    mapName: String
  },
  
  custom: {
    key: String,
    value: String,
    description: String,
    execFunction: String // Custom execution code
  }
}
```

### Quest Template System

```javascript
// Quest template structure
class QuestTemplateRegistry {
  constructor() {
    this.templates = new Map(); // templateId -> QuestTemplate
    this.categories = new Map(); // category -> Array of templateIds
  }
  
  // Template data structure
  // templateId: String - unique identifier
  // category: String - "fetch", "kill", "rescue", etc.
  // data: {
  //   title: String or Function - quest title or function to generate it
  //   description: String or Function - quest description
  //   type: String - quest type
  //   difficulty: Number or Function - difficulty level
  //   objectives: Array or Function - objective templates
  //   rewards: Array or Function - reward templates
  //   requirements: Object - requirements for using this template
  //   tags: Array - categorization tags
  //   variants: Array - variations of this quest
  // }
}
```

## Implementation

```javascript
class QuestSystem {
  constructor(options = {}) {
    this.registry = new QuestRegistry();
    this.templates = new QuestTemplateRegistry();
    this.progressManager = new QuestProgressManager();
    this.questLog = new QuestLog();
    this.random = new Random(); // Seeded random number generator
    
    // Integration with other systems
    this.mapManager = options.mapManager;
    this.eventGenerator = options.eventGenerator;
    this.gameState = options.gameState;
    
    // Load built-in templates
    this.loadQuestTemplates();
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  // Register a quest template
  registerTemplate(template) {
    this.templates.templates.set(template.id, template);
    
    // Add to category
    if (template.category) {
      if (!this.templates.categories.has(template.category)) {
        this.templates.categories.set(template.category, []);
      }
      this.templates.categories.get(template.category).push(template.id);
    }
    
    return template.id;
  }
  
  // Generate a quest from a template
  generateQuest(templateId, params = {}, seed = null) {
    const template = this.templates.templates.get(templateId);
    if (!template) return null;
    
    // Set random seed if provided
    if (seed) this.random.setSeed(seed);
    
    // Create quest from template
    const quest = this.createQuestFromTemplate(template, params);
    
    // Register the quest
    this.registerQuest(quest);
    
    return quest;
  }
  
  // Create a quest from a template
  createQuestFromTemplate(template, params) {
    const questId = this.getNextQuestId();
    
    // Process template functions and arrays
    const processField = (field, defaultValue) => {
      if (typeof field === 'function') {
        return field(params, this.random);
      } else if (Array.isArray(field) && field.length > 0) {
        const index = this.random.nextInt(0, field.length - 1);
        return field[index];
      } else {
        return field || defaultValue;
      }
    };
    
    // Create quest object
    const quest = {
      questId,
      title: processField(template.data.title, `Quest ${questId}`),
      description: processField(template.data.description, ''),
      type: processField(template.data.type, 'side'),
      difficulty: processField(template.data.difficulty, 1),
      minLevel: processField(template.data.minLevel, 1),
      isHidden: processField(template.data.isHidden, false),
      isFailable: processField(template.data.isFailable, false),
      expiresAfter: processField(template.data.expiresAfter, 0),
      startConditions: [],
      failConditions: [],
      objectives: [],
      rewards: [],
      giver: null,
      turnIn: null,
      relatedMaps: [],
      tags: [...(template.data.tags || [])],
      state: 'inactive'
    };
    
    // Apply parameter overrides
    for (const key in params) {
      if (quest.hasOwnProperty(key)) {
        quest[key] = params[key];
      }
    }
    
    // Generate objectives
    const objectiveTemplates = processField(template.data.objectives, []);
    quest.objectives = this.generateObjectives(objectiveTemplates, params);
    
    // Generate rewards
    const rewardTemplates = processField(template.data.rewards, []);
    quest.rewards = this.generateRewards(rewardTemplates, params);
    
    // Setup quest NPCs and locations
    this.setupQuestEntities(quest, params);
    
    return quest;
  }
  
  // Generate objectives from templates
  generateObjectives(objectiveTemplates, params) {
    return objectiveTemplates.map(template => {
      const objective = {
        type: template.type,
        description: template.description,
        isHidden: template.isHidden || false,
        isBonus: template.isBonus || false,
        isCompleted: false,
        progress: 0,
        target: template.target || 1,
        ...template.data
      };
      
      // Apply parameter overrides for this objective
      if (params.objectiveOverrides && params.objectiveOverrides[objective.type]) {
        Object.assign(objective, params.objectiveOverrides[objective.type]);
      }
      
      return objective;
    });
  }
  
  // Generate rewards from templates
  generateRewards(rewardTemplates, params) {
    return rewardTemplates.map(template => {
      const reward = {
        type: template.type,
        description: template.description,
        isHidden: template.isHidden || false,
        isClaimed: false,
        ...template.data
      };
      
      // Apply parameter overrides for this reward
      if (params.rewardOverrides && params.rewardOverrides[reward.type]) {
        Object.assign(reward, params.rewardOverrides[reward.type]);
      }
      
      return reward;
    });
  }
  
  // Setup NPCs and locations for the quest
  setupQuestEntities(quest, params) {
    // Quest giver
    if (params.giver) {
      quest.giver = params.giver;
    } else if (params.generateGiver) {
      quest.giver = this.generateQuestGiver(quest);
    }
    
    // Turn-in NPC
    if (params.turnIn) {
      quest.turnIn = params.turnIn;
    } else if (params.generateTurnIn) {
      quest.turnIn = params.generateTurnIn === 'same' ? quest.giver : this.generateQuestReceiver(quest);
    } else {
      // Default to same as giver
      quest.turnIn = quest.giver;
    }
    
    // Related maps
    if (params.relatedMaps) {
      quest.relatedMaps = params.relatedMaps;
    } else {
      // Generate related maps based on objectives
      quest.relatedMaps = this.generateRelatedMaps(quest);
    }
  }
  
  // Register a quest in the system
  registerQuest(quest) {
    this.registry.quests.set(quest.questId, quest);
    
    // Setup quest in the game
    this.setupQuestInGame(quest);
    
    return quest.questId;
  }
  
  // Setup the quest in the game world
  setupQuestInGame(quest) {
    // Create quest giver event
    if (quest.giver && this.eventGenerator) {
      this.setupQuestGiverEvent(quest);
    }
    
    // Create turn-in event
    if (quest.turnIn && quest.turnIn !== quest.giver && this.eventGenerator) {
      this.setupQuestTurnInEvent(quest);
    }
    
    // Create objective-related events
    this.setupObjectiveEvents(quest);
    
    // Setup switch and variable tracking
    this.setupQuestVariables(quest);
  }
  
  // Setup the quest giver event
  setupQuestGiverEvent(quest) {
    // If the event already exists, we'll modify it
    // Otherwise, we'll create a new one
    
    // Quest giver dialog
    const giverDialog = this.generateQuestGiverDialog(quest);
    
    // Create or update event
    if (this.eventGenerator) {
      // Generate quest giver event
      const eventParams = {
        mapId: quest.giver.mapId,
        x: quest.giver.x,
        y: quest.giver.y,
        questId: quest.questId,
        questTitle: quest.title,
        questDescription: quest.description,
        dialog: giverDialog,
        questSwitchId: this.getQuestSwitchId(quest, 'active'),
        questCompleteSwitchId: this.getQuestSwitchId(quest, 'complete')
      };
      
      // Ask the event generator to create or update the event
      this.eventGenerator.generateEvent('npc_quest_giver', eventParams);
    }
  }
  
  // Generate dialog for quest giver
  generateQuestGiverDialog(quest) {
    // Basic dialog structure
    return {
      intro: [
        `I have a task for you, adventurer.`,
        `${quest.title}`
      ],
      details: quest.description,
      objectives: quest.objectives.map(obj => obj.description).join('\n'),
      rewards: `Complete this task and you'll be rewarded.`,
      accept: `Will you help me?`,
      acceptResponse: `Thank you! I'll await your return.`,
      declineResponse: `Perhaps another adventurer will help instead.`,
      inProgress: `Have you completed your task yet?`,
      completed: `Thank you for your help!`
    };
  }
  
  // Setup the quest turn-in event
  setupQuestTurnInEvent(quest) {
    // Similar to setupQuestGiverEvent but for turn-in
    // In a full implementation, would create or update the turn-in NPC event
  }
  
  // Setup events related to objectives
  setupObjectiveEvents(quest) {
    // For each objective, setup necessary events
    for (const objective of quest.objectives) {
      switch (objective.type) {
        case 'talk':
          this.setupTalkObjectiveEvent(quest, objective);
          break;
        case 'interact':
          this.setupInteractObjectiveEvent(quest, objective);
          break;
        case 'location':
          this.setupLocationObjectiveEvent(quest, objective);
          break;
        // Other objective types would have their own setup
      }
    }
  }
  
  // Setup tracking variables for the quest
  setupQuestVariables(quest) {
    // Assign switches for quest states
    const activeSwitch = this.getQuestSwitchId(quest, 'active');
    const completeSwitch = this.getQuestSwitchId(quest, 'complete');
    const failedSwitch = this.getQuestSwitchId(quest, 'failed');
    
    // Assign variables for objective progress
    for (let i = 0; i < quest.objectives.length; i++) {
      const objective = quest.objectives[i];
      objective.variableId = this.getQuestVariableId(quest, `objective_${i}`);
    }
  }
  
  // Get switch ID for quest state
  getQuestSwitchId(quest, state) {
    // In a real implementation, would maintain a mapping of quest states to switch IDs
    // For simplicity, we'll use a formula
    const baseId = 100; // Starting ID for quest switches
    const questNum = parseInt(quest.questId.replace('quest_', ''));
    
    switch (state) {
      case 'active': return baseId + (questNum * 3);
      case 'complete': return baseId + (questNum * 3) + 1;
      case 'failed': return baseId + (questNum * 3) + 2;
      default: return 0;
    }
  }
  
  // Get variable ID for quest tracking
  getQuestVariableId(quest, key) {
    // Similar to switch ID allocation, would maintain a mapping
    const baseId = 100; // Starting ID for quest variables
    const questNum = parseInt(quest.questId.replace('quest_', ''));
    
    // Simple formula for this example
    return baseId + (questNum * 10) + key.hashCode() % 10;
  }
  
  // Update quest progress
  updateQuestProgress(questId, objectiveType, targetId, amount = 1) {
    const quest = this.registry.quests.get(questId);
    if (!quest || quest.state !== 'active') return false;
    
    // Find matching objectives
    const objectives = quest.objectives.filter(obj => 
      obj.type === objectiveType && 
      (obj.targetId === targetId || targetId === 0) &&
      !obj.isCompleted
    );
    
    if (objectives.length === 0) return false;
    
    // Update each matching objective
    let updated = false;
    
    for (const objective of objectives) {
      const oldProgress = objective.progress;
      objective.progress += amount;
      
      // Cap progress at target
      if (objective.progress > objective.target) {
        objective.progress = objective.target;
      }
      
      // Check if newly completed
      if (oldProgress < objective.target && objective.progress >= objective.target) {
        objective.isCompleted = true;
        this.onObjectiveCompleted(quest, objective);
      }
      
      // Update in-game variable
      if (objective.variableId) {
        this.gameState.setVariable(objective.variableId, objective.progress);
      }
      
      updated = true;
    }
    
    // Check if all required objectives are complete
    if (updated) {
      this.checkQuestCompletion(quest);
    }
    
    return updated;
  }
  
  // Check if a quest is completed
  checkQuestCompletion(quest) {
    // If already completed or failed, do nothing
    if (quest.state === 'completed' || quest.state === 'failed') return false;
    
    // Check if all non-bonus objectives are completed
    const requiredObjectives = quest.objectives.filter(obj => !obj.isBonus);
    const allCompleted = requiredObjectives.every(obj => obj.isCompleted);
    
    if (allCompleted) {
      this.completeQuest(quest.questId);
      return true;
    }
    
    return false;
  }
  
  // Complete a quest
  completeQuest(questId) {
    const quest = this.registry.quests.get(questId);
    if (!quest || quest.state === 'completed') return false;
    
    // Update quest state
    quest.state = 'completed';
    this.registry.activeQuests.delete(questId);
    this.registry.completedQuests.add(questId);
    
    // Update in-game switches
    const completeSwitch = this.getQuestSwitchId(quest, 'complete');
    if (completeSwitch) {
      this.gameState.setSwitch(completeSwitch, true);
    }
    
    const activeSwitch = this.getQuestSwitchId(quest, 'active');
    if (activeSwitch) {
      this.gameState.setSwitch(activeSwitch, false);
    }
    
    // Trigger completion events
    this.onQuestCompleted(quest);
    
    return true;
  }
  
  // When an objective is completed
  onObjectiveCompleted(quest, objective) {
    // In a full implementation:
    // - Display notification
    // - Update quest log
    // - Trigger any events linked to this objective
    console.log(`Objective completed: ${objective.description}`);
  }
  
  // When a quest is completed
  onQuestCompleted(quest) {
    // In a full implementation:
    // - Display notification
    // - Update quest log
    // - Give rewards
    // - Trigger any follow-up quests
    console.log(`Quest completed: ${quest.title}`);
    
    // Give rewards
    this.giveQuestRewards(quest);
  }
  
  // Give quest rewards
  giveQuestRewards(quest) {
    for (const reward of quest.rewards) {
      if (reward.isClaimed) continue;
      
      switch (reward.type) {
        case 'gold':
          this.gameState.gainGold(reward.amount);
          break;
        case 'exp':
          this.gameState.gainExp(reward.amount);
          break;
        case 'item':
          this.gameState.gainItem(reward.itemId, reward.count);
          break;
        case 'weapon':
          this.gameState.gainWeapon(reward.weaponId, reward.count);
          break;
        case 'armor':
          this.gameState.gainArmor(reward.armorId, reward.count);
          break;
        case 'skill':
          this.gameState.learnSkill(reward.skillId);
          break;
        case 'unlockQuest':
          this.activateQuest(reward.questId);
          break;
        case 'unlockMap':
          if (this.mapManager) {
            this.mapManager.unlockMap(reward.mapId);
          }
          break;
        case 'custom':
          if (reward.execFunction) {
            try {
              eval(reward.execFunction);
            } catch (e) {
              console.error(`Error executing custom reward: ${e}`);
            }
          }
          break;
      }
      
      reward.isClaimed = true;
    }
  }
  
  // Setup event listeners
  setupEventListeners() {
    // In a full implementation, would listen for game events like:
    // - Enemies defeated
    // - Items collected
    // - Map changes
    // - Event interactions
    // And call updateQuestProgress accordingly
  }
  
  // Get next quest ID
  getNextQuestId() {
    return `quest_${this.registry.quests.size + 1}`;
  }
  
  // Load quest templates
  loadQuestTemplates() {
    // Here you would load built-in quest templates
    // Similar to how we did with the event templates
    
    // Example template for a simple fetch quest
    this.registerTemplate({
      id: 'fetch_quest',
      category: 'fetch',
      data: {
        title: params => `Retrieve ${params.itemName || 'the item'}`,
        description: params => `${params.npcName || 'Someone'} needs you to find ${params.itemName || 'an item'} ${params.locationDesc ? `from ${params.locationDesc}` : ''}.`,
        type: 'side',
        difficulty: params => params.itemDifficulty || 1,
        objectives: [
          {
            type: 'collect',
            description: params => `Collect ${params.itemCount || 1} ${params.itemName || 'item(s)'}`,
            data: {
              itemId: params => params.itemId || 1,
              itemName: params => params.itemName || 'Item',
              count: params => params.itemCount || 1
            }
          },
          {
            type: 'talk',
            description: params => `Return to ${params.npcName || 'the quest giver'}`,
            data: {
              npcId: params => params.npcId || 1,
              npcName: params => params.npcName || 'NPC'
            }
          }
        ],
        rewards: [
          {
            type: 'gold',
            description: params => `${params.rewardGold || 100} gold`,
            data: {
              amount: params => params.rewardGold || 100
            }
          },
          {
            type: 'exp',
            description: params => `${params.rewardExp || 50} experience`,
            data: {
              amount: params => params.rewardExp || 50
            }
          }
        ],
        tags: ['fetch', 'item']
      }
    });
  }
}

// Helper to create hash code for strings
String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};
```

## Usage Example

```javascript
// Create quest system with dependencies
const questSystem = new QuestSystem({
  mapManager: mapManager,
  eventGenerator: eventGenerator,
  gameState: gameState
});

// Generate a fetch quest
const fetchQuest = questSystem.generateQuest('fetch_quest', {
  itemId: 7,
  itemName: 'Healing Herb',
  itemCount: 5,
  itemDifficulty: 2,
  npcName: 'Healer Galen',
  locationDesc: 'the western forest',
  rewardGold: 150,
  rewardExp: 75,
  
  // NPC information
  giver: {
    mapId: 1,
    x: 10,
    y: 8,
    eventId: 5
  },
  
  // Use same NPC for turn-in
  generateTurnIn: 'same'
});

// Activate the quest
questSystem.activateQuest(fetchQuest.questId);

// Update quest progress when player collects herbs
// This would be called by event handlers in the actual game
questSystem.updateQuestProgress(fetchQuest.questId, 'collect', 7, 1);

// Update quest progress when player talks to the NPC
questSystem.updateQuestProgress(fetchQuest.questId, 'talk', 5, 1);
```

## Quest Chain Generation

The quest system can generate interconnected quest chains:

```javascript
// Generate a quest chain
const generateQuestChain = (params) => {
  const { length, difficulty, questType, startingNPC, location } = params;
  
  const questIds = [];
  let prevQuest = null;
  
  // Create each quest in the chain
  for (let i = 0; i < length; i++) {
    // Progressively increase difficulty
    const stepDifficulty = difficulty + Math.floor(i / 2);
    
    // Generate quest parameters
    const questParams = {
      difficulty: stepDifficulty,
      chainPosition: i,
      chainLength: length,
      previousQuestId: prevQuest ? prevQuest.questId : null,
      isChainStart: i === 0,
      isChainEnd: i === length - 1,
      ...params
    };
    
    // Choose a template based on quest type and position
    let templateId;
    if (i === 0) {
      templateId = `${questType}_start`;
    } else if (i === length - 1) {
      templateId = `${questType}_end`;
    } else {
      templateId = `${questType}_middle`;
    }
    
    // Fall back to generic template if specific one doesn't exist
    if (!questSystem.templates.templates.has(templateId)) {
      templateId = questType;
    }
    
    // Generate the quest
    const quest = questSystem.generateQuest(templateId, questParams);
    
    // If this isn't the first quest, make it dependent on the previous one
    if (prevQuest) {
      // Add start condition that requires previous quest completion
      quest.startConditions.push({
        type: 'questCompleted',
        questId: prevQuest.questId
      });
      
      // Setup quest variables for the condition
      const prevQuestCompleteSwitch = questSystem.getQuestSwitchId(prevQuest, 'complete');
      if (prevQuestCompleteSwitch) {
        quest.conditions = quest.conditions || {};
        quest.conditions.switch1Id = prevQuestCompleteSwitch;
        quest.conditions.switch1Valid = true;
      }
    }
    
    questIds.push(quest.questId);
    prevQuest = quest;
  }
  
  return questIds;
};

// Example usage
const mainQuestChain = generateQuestChain({
  length: 5,
  difficulty: 3,
  questType: 'main_story',
  startingNPC: {
    mapId: 1,
    x: 15,
    y: 10,
    eventId: 3
  },
  location: 'kingdom_capital'
});
```

## Integration with RPG Maker MZ

The Quest System can be integrated with RPG Maker MZ in several ways:

1. **Plugin System**: Implement as a plugin with configuration options
2. **Common Events**: Connect to common events for global progress tracking
3. **Game_System Extension**: Extend the Game_System class to include quest data
4. **Custom Scenes**: Create a custom quest log scene (Scene_QuestLog)

## Next Steps

1. **Advanced Quest Logic**: Add branching and conditional quest paths
2. **Time-based Quests**: Quests that change based on in-game time
3. **Reputation System**: Tie quests to faction/NPC relationship levels
4. **Procedural Quest Generation**: More sophisticated quest generation algorithms
5. **Quest Visualization**: Tools to visualize quest chains and dependencies