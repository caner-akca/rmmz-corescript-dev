# Event Generator for Procedural RPG Maker MZ Development

This document outlines the design of an Event Generator system that creates game events based on location and context in RPG Maker MZ.

## Core Concepts

The Event Generator creates interactive elements (NPCs, treasure chests, puzzles, etc.) for your procedurally generated maps, handling:

1. Context-aware event placement
2. Event behavior scripting
3. Event template management
4. Map-specific interaction rules
5. Narrative integration points

## Data Structures

### Event Template System

```javascript
// Event template data structure
class EventTemplateRegistry {
  constructor() {
    this.templates = new Map(); // templateId -> EventTemplate
    this.categories = new Map(); // category -> Array of templateIds
  }
  
  // Event template structure
  // templateId: String - unique identifier
  // category: String - "npc", "chest", "puzzle", "door", etc.
  // data: {
  //   name: String - template name
  //   description: String - human-readable description
  //   tags: Array - special properties ["shop", "quest", "hostile", etc.]
  //   appearance: Object - visual representation data
  //   behavior: Object - behavior patterns
  //   pages: Array - event pages with conditions and commands
  //   parameters: Object - customizable parameters
  //   placementRules: Object - where this can be placed
  // }
}
```

### Event Appearance System

```javascript
// Appearance templates for events
const appearanceTypes = {
  npc: {
    characterName: String, // Character sheet name
    characterIndex: Number, // Index in character sheet (0-7)
    direction: Number, // Initial direction (2=down, 4=left, 6=right, 8=up)
    pattern: Number, // Animation pattern (0-2)
    moveType: Number, // Movement pattern (0=fixed, 1=random, 2=approach, 3=custom)
    moveSpeed: Number, // Movement speed (1-6)
    moveFrequency: Number, // Movement frequency (1-5)
    priorityType: Number, // Display priority (0=below, 1=same, 2=above)
    stepAnime: Boolean, // Always animate even when not moving
    walkAnime: Boolean, // Animate when moving
    directionFix: Boolean, // Fixed direction
    through: Boolean // Can move through other events
  },
  object: {
    characterName: String,
    characterIndex: Number,
    direction: Number,
    pattern: Number,
    priorityType: Number,
    stepAnime: Boolean,
    directionFix: Boolean
  },
  tile: {
    tileId: Number
  }
}
```

### Event Command Library

```javascript
// Command builders for event logic
const commandBuilders = {
  showText: (text, faceImage = "", faceIndex = 0, background = 0, position = 2, speakerName = "") => {
    const commands = [];
    
    commands.push({
      code: 101,
      indent: 0,
      parameters: [faceImage, faceIndex, background, position, speakerName]
    });
    
    // Split text into lines
    const lines = Array.isArray(text) ? text : text.split('\n');
    
    for (const line of lines) {
      commands.push({
        code: 401,
        indent: 0,
        parameters: [line]
      });
    }
    
    return commands;
  },
  
  showChoices: (choices, cancelType = 0, defaultType = 0, position = 2, background = 0) => {
    return [{
      code: 102,
      indent: 0,
      parameters: [choices, cancelType, defaultType, position, background]
    }];
  },
  
  choiceCase: (choiceIndex, choiceText, commands) => {
    const result = [{
      code: 402,
      indent: 0,
      parameters: [choiceIndex, choiceText]
    }];
    
    // Add commands with increased indent
    for (const command of commands) {
      result.push({
        ...command,
        indent: command.indent + 1
      });
    }
    
    result.push({
      code: 0,
      indent: 1,
      parameters: []
    });
    
    return result;
  },
  
  conditionalBranch: (condition, params, thenCommands, elseCommands = []) => {
    const result = [{
      code: 111,
      indent: 0,
      parameters: [condition, ...params]
    }];
    
    // Add 'then' commands with increased indent
    for (const command of thenCommands) {
      result.push({
        ...command,
        indent: command.indent + 1
      });
    }
    
    // Add 'else' branch if provided
    if (elseCommands.length > 0) {
      result.push({
        code: 411,
        indent: 0,
        parameters: []
      });
      
      // Add 'else' commands with increased indent
      for (const command of elseCommands) {
        result.push({
          ...command,
          indent: command.indent + 1
        });
      }
    }
    
    // Close conditional branch
    result.push({
      code: 412,
      indent: 0,
      parameters: []
    });
    
    return result;
  },
  
  changeItems: (itemId, operation, operandType, operand) => {
    return [{
      code: 126,
      indent: 0,
      parameters: [itemId, operation, operandType, operand]
    }];
  },
  
  changeGold: (operation, operandType, operand) => {
    return [{
      code: 125,
      indent: 0,
      parameters: [operation, operandType, operand]
    }];
  },
  
  controlSwitches: (switchId, switchId2, value) => {
    return [{
      code: 121,
      indent: 0,
      parameters: [switchId, switchId2, value]
    }];
  },
  
  controlVariables: (variableId, variableId2, operation, operandType, operand) => {
    return [{
      code: 122,
      indent: 0,
      parameters: [variableId, variableId2, operation, operandType, operand]
    }];
  },
  
  playSound: (soundName, volume = 90, pitch = 100, pan = 0) => {
    return [{
      code: 250,
      indent: 0,
      parameters: [{name: soundName, volume, pitch, pan}]
    }];
  },
  
  // Add more command builders for other event commands
};
```

## Implementation

```javascript
class EventGenerator {
  constructor(options = {}) {
    this.registry = new EventTemplateRegistry();
    this.random = new Random(); // Seeded random number generator
    
    // Load built-in templates
    this.loadBuiltInTemplates();
  }
  
  // Register an event template
  registerTemplate(template) {
    this.registry.templates.set(template.id, template);
    
    // Add to category
    if (template.category) {
      if (!this.registry.categories.has(template.category)) {
        this.registry.categories.set(template.category, []);
      }
      this.registry.categories.get(template.category).push(template.id);
    }
    
    return template.id;
  }
  
  // Generate an event from a template
  generateEvent(templateId, params = {}, seed = null) {
    const template = this.registry.templates.get(templateId);
    if (!template) return null;
    
    // Set random seed if provided
    if (seed) this.random.setSeed(seed);
    
    // Create event from template
    const event = this.createEventFromTemplate(template, params);
    
    return event;
  }
  
  // Create an event from a template
  createEventFromTemplate(template, params) {
    // Start with a copy of the template
    const event = {
      id: params.id || 0,
      name: template.data.name,
      note: template.data.description || "",
      x: params.x || 0,
      y: params.y || 0,
      pages: []
    };
    
    // Process template parameters
    const finalParams = { ...template.data.parameters, ...params };
    
    // Create appearance data based on type
    const appearance = this.createAppearance(template.data.appearance, finalParams);
    
    // Create event pages
    for (const pageTemplate of template.data.pages) {
      const page = this.createEventPage(pageTemplate, appearance, finalParams);
      event.pages.push(page);
    }
    
    return event;
  }
  
  // Create appearance data
  createAppearance(appearanceTemplate, params) {
    if (appearanceTemplate.type === 'npc') {
      // For NPCs, handle character selection
      return {
        characterName: this.processParameter(appearanceTemplate.characterName, params),
        characterIndex: this.processParameter(appearanceTemplate.characterIndex, params),
        direction: this.processParameter(appearanceTemplate.direction, params) || 2,
        pattern: this.processParameter(appearanceTemplate.pattern, params) || 1,
        tileId: 0
      };
    } else if (appearanceTemplate.type === 'tile') {
      // For tile-based events
      return {
        characterName: "",
        characterIndex: 0,
        direction: 2,
        pattern: 0,
        tileId: this.processParameter(appearanceTemplate.tileId, params)
      };
    } else {
      // Default
      return {
        characterName: "",
        characterIndex: 0,
        direction: 2,
        pattern: 0,
        tileId: 0
      };
    }
  }
  
  // Create an event page from a template
  createEventPage(pageTemplate, appearance, params) {
    // Start with basic page structure
    const page = {
      conditions: this.createPageConditions(pageTemplate.conditions, params),
      directionFix: this.processParameter(pageTemplate.directionFix, params) || false,
      image: { ...appearance },
      list: [],
      moveFrequency: this.processParameter(pageTemplate.moveFrequency, params) || 3,
      moveRoute: this.createMoveRoute(pageTemplate.moveRoute, params),
      moveSpeed: this.processParameter(pageTemplate.moveSpeed, params) || 3,
      moveType: this.processParameter(pageTemplate.moveType, params) || 0,
      priorityType: this.processParameter(pageTemplate.priorityType, params) || 1,
      stepAnime: this.processParameter(pageTemplate.stepAnime, params) || false,
      through: this.processParameter(pageTemplate.through, params) || false,
      trigger: this.processParameter(pageTemplate.trigger, params) || 0,
      walkAnime: this.processParameter(pageTemplate.walkAnime, params) || true
    };
    
    // Process command list
    page.list = this.processCommandList(pageTemplate.commands, params);
    
    // Ensure command list ends with end-event command
    if (page.list.length === 0 || page.list[page.list.length - 1].code !== 0) {
      page.list.push({ code: 0, indent: 0, parameters: [] });
    }
    
    return page;
  }
  
  // Process command list with parameter substitution
  processCommandList(commandList, params) {
    if (!commandList) return [{ code: 0, indent: 0, parameters: [] }];
    
    // Process each command
    return commandList.map(command => {
      // Deep clone to avoid modifying the original
      const processedCommand = JSON.parse(JSON.stringify(command));
      
      // Process parameters if they contain template variables
      if (processedCommand.parameters) {
        processedCommand.parameters = processedCommand.parameters.map(param => {
          if (typeof param === 'string' && param.includes('{{')) {
            return this.processParameter(param, params);
          }
          return param;
        });
      }
      
      return processedCommand;
    });
  }
  
  // Process a parameterized value
  processParameter(value, params) {
    // Handle string template parameters
    if (typeof value === 'string' && value.includes('{{')) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
      });
    }
    
    // Handle function parameters
    if (typeof value === 'function') {
      return value(params, this.random);
    }
    
    // Handle array parameters (random selection)
    if (Array.isArray(value)) {
      const index = this.random.nextInt(0, value.length - 1);
      return this.processParameter(value[index], params);
    }
    
    // Return as is
    return value;
  }
  
  // Create page conditions
  createPageConditions(conditionsTemplate, params) {
    return {
      actorId: this.processParameter(conditionsTemplate?.actorId, params) || 1,
      actorValid: this.processParameter(conditionsTemplate?.actorValid, params) || false,
      itemId: this.processParameter(conditionsTemplate?.itemId, params) || 1,
      itemValid: this.processParameter(conditionsTemplate?.itemValid, params) || false,
      selfSwitchCh: this.processParameter(conditionsTemplate?.selfSwitchCh, params) || "A",
      selfSwitchValid: this.processParameter(conditionsTemplate?.selfSwitchValid, params) || false,
      switch1Id: this.processParameter(conditionsTemplate?.switch1Id, params) || 1,
      switch1Valid: this.processParameter(conditionsTemplate?.switch1Valid, params) || false,
      switch2Id: this.processParameter(conditionsTemplate?.switch2Id, params) || 1,
      switch2Valid: this.processParameter(conditionsTemplate?.switch2Valid, params) || false,
      variableId: this.processParameter(conditionsTemplate?.variableId, params) || 1,
      variableValid: this.processParameter(conditionsTemplate?.variableValid, params) || false,
      variableValue: this.processParameter(conditionsTemplate?.variableValue, params) || 0
    };
  }
  
  // Create move route
  createMoveRoute(moveRouteTemplate, params) {
    // Default move route
    const defaultMoveRoute = {
      list: [{ code: 0, parameters: [] }],
      repeat: true,
      skippable: false,
      wait: false
    };
    
    if (!moveRouteTemplate) return defaultMoveRoute;
    
    // Process move route
    return {
      list: moveRouteTemplate.list || defaultMoveRoute.list,
      repeat: this.processParameter(moveRouteTemplate.repeat, params) ?? true,
      skippable: this.processParameter(moveRouteTemplate.skippable, params) ?? false,
      wait: this.processParameter(moveRouteTemplate.wait, params) ?? false
    };
  }
  
  // Place events on a map based on context
  placeEvents(mapData, context) {
    const events = [];
    const eventCoordinates = new Set(); // Track used coordinates
    
    // Try to place each event type specified in context
    for (const placement of context.eventPlacements) {
      const { categoryOrTemplate, count, placementStrategy, params } = placement;
      
      // Determine templates to use
      const templates = this.getTemplates(categoryOrTemplate);
      
      // Skip if no templates found
      if (templates.length === 0) continue;
      
      // Place events based on strategy
      for (let i = 0; i < count; i++) {
        // Select a template (randomly if multiple)
        const templateIndex = this.random.nextInt(0, templates.length - 1);
        const template = templates[templateIndex];
        
        // Find a suitable location
        const location = this.findLocation(mapData, template, placementStrategy, eventCoordinates);
        
        // Skip if no suitable location found
        if (!location) continue;
        
        // Mark location as used
        eventCoordinates.add(`${location.x},${location.y}`);
        
        // Generate the event
        const event = this.generateEvent(template.id, {
          ...params,
          id: events.length + 1,
          x: location.x,
          y: location.y,
          mapId: mapData.id
        });
        
        // Add to events list
        events.push(event);
      }
    }
    
    return events;
  }
  
  // Get templates based on category or specific template ID
  getTemplates(categoryOrTemplate) {
    if (this.registry.templates.has(categoryOrTemplate)) {
      // It's a specific template ID
      return [this.registry.templates.get(categoryOrTemplate)];
    } else if (this.registry.categories.has(categoryOrTemplate)) {
      // It's a category
      return this.registry.categories.get(categoryOrTemplate)
        .map(id => this.registry.templates.get(id))
        .filter(template => template !== undefined);
    }
    
    return [];
  }
  
  // Find a suitable location for an event
  findLocation(mapData, template, strategy, usedCoordinates) {
    // Different placement strategies
    switch (strategy) {
      case 'random':
        return this.findRandomLocation(mapData, template, usedCoordinates);
        
      case 'nearWall':
        return this.findLocationNearWall(mapData, template, usedCoordinates);
        
      case 'inRoom':
        return this.findLocationInRoom(mapData, template, usedCoordinates);
        
      case 'nearEntrance':
        return this.findLocationNearEntrance(mapData, template, usedCoordinates);
        
      case 'nearExit':
        return this.findLocationNearExit(mapData, template, usedCoordinates);
        
      default:
        return this.findRandomLocation(mapData, template, usedCoordinates);
    }
  }
  
  // Example implementation for finding a random valid location
  findRandomLocation(mapData, template, usedCoordinates) {
    // Maximum attempts to find a location
    const maxAttempts = 100;
    
    for (let i = 0; i < maxAttempts; i++) {
      // Generate random coordinates
      const x = this.random.nextInt(1, mapData.width - 2);
      const y = this.random.nextInt(1, mapData.height - 2);
      
      // Check if location is already used
      if (usedCoordinates.has(`${x},${y}`)) continue;
      
      // Check if location is valid (e.g., walkable tile)
      if (this.isValidLocation(mapData, x, y, template)) {
        return { x, y };
      }
    }
    
    return null; // No suitable location found
  }
  
  // Check if a location is valid for an event
  isValidLocation(mapData, x, y, template) {
    // Get tile ID at this location (simplified example)
    const tileId = this.getTileIdAt(mapData, x, y);
    
    // Check template placement rules
    const rules = template.data.placementRules || {};
    
    // Check if tile is walkable (depends on your tile system)
    if (rules.requireWalkable !== false) {
      if (!this.isWalkableTile(tileId)) return false;
    }
    
    // Check for allowed/disallowed tile types
    if (rules.allowedTiles && !rules.allowedTiles.includes(tileId)) return false;
    if (rules.disallowedTiles && rules.disallowedTiles.includes(tileId)) return false;
    
    return true;
  }
  
  // Get tile ID at location (simplified)
  getTileIdAt(mapData, x, y) {
    // In a real implementation, you would access the appropriate layer
    // This is a simplified example
    const index = (y * mapData.width) + x;
    return mapData.data[index] || 0;
  }
  
  // Check if a tile is walkable (simplified)
  isWalkableTile(tileId) {
    // In a real implementation, you would check against your tileset configuration
    // This is a simplified example
    return tileId === 2; // Assuming 2 is a floor tile
  }
  
  // Load built-in templates
  loadBuiltInTemplates() {
    // NPC Templates
    this.registerTemplate({
      id: 'npc_villager',
      category: 'npc',
      data: {
        name: 'Villager',
        description: 'A basic village NPC',
        tags: ['village', 'neutral'],
        appearance: {
          type: 'npc',
          characterName: 'People1',
          characterIndex: [0, 1, 2, 3, 4, 5, 6, 7], // Random selection
          direction: 2,
          pattern: 1
        },
        behavior: {
          moveType: 1, // Random movement
          moveSpeed: 3,
          moveFrequency: 3
        },
        pages: [
          {
            conditions: {},
            trigger: 0, // Action button
            directionFix: false,
            moveType: 1,
            moveSpeed: 3,
            moveFrequency: 3,
            walkAnime: true,
            stepAnime: false,
            through: false,
            priorityType: 1,
            commands: [
              ...commandBuilders.showText([
                "{{dialogLine1}}",
                "{{dialogLine2}}"
              ], 'People1', '{{faceIndex}}')
            ]
          }
        ],
        parameters: {
          dialogLine1: [
            "Nice weather we're having!",
            "Welcome to our village!",
            "Have you visited the shop yet?",
            "Be careful if you go outside at night."
          ],
          dialogLine2: [
            "I've lived here all my life.",
            "Things have been peaceful lately.",
            "I wonder what's for dinner today?",
            ""
          ],
          faceIndex: (params, random) => random.nextInt(0, 7)
        },
        placementRules: {
          requireWalkable: true,
          // Prefer to be in towns, villages
        }
      }
    });
    
    // Treasure Chest Template
    this.registerTemplate({
      id: 'object_treasure_chest',
      category: 'chest',
      data: {
        name: 'Treasure Chest',
        description: 'A chest containing items or gold',
        tags: ['treasure', 'reward'],
        appearance: {
          type: 'object',
          characterName: 'Object1',
          characterIndex: 0,
          direction: 2,
          pattern: 0
        },
        pages: [
          {
            // Unopened chest
            conditions: {
              selfSwitchCh: "A",
              selfSwitchValid: true,
              switch1Id: 1,
              switch1Valid: false
            },
            trigger: 0, // Action button
            directionFix: true,
            moveType: 0, // Fixed
            stepAnime: false,
            through: false,
            priorityType: 1,
            commands: [
              ...commandBuilders.playSound('Chest1'),
              ...commandBuilders.showText("You found {{itemName}}!"),
              ...commandBuilders.changeItems('{{itemId}}', 0, 0, '{{itemAmount}}'),
              ...commandBuilders.controlSwitches(1, 1, 0), // Turn self switch A ON
              { code: 123, indent: 0, parameters: ["A", 0] },
              ...commandBuilders.showText("Obtained {{itemName}}!"),
            ]
          },
          {
            // Opened chest
            conditions: {
              selfSwitchCh: "A",
              selfSwitchValid: true,
              switch1Id: 1,
              switch1Valid: false
            },
            trigger: 0, // Action button
            directionFix: true,
            moveType: 0, // Fixed
            stepAnime: false,
            through: false,
            priorityType: 1,
            commands: [
              ...commandBuilders.showText("The chest is empty.")
            ]
          }
        ],
        parameters: {
          itemId: 1, // Default item ID
          itemAmount: 1, // Default amount
          itemName: "Potion" // Default item name
        },
        placementRules: {
          requireWalkable: true,
          // Preferable near walls
        }
      }
    });
    
    // Add more built-in templates
  }
}
```

## Usage Example

```javascript
// Create event generator
const eventGenerator = new EventGenerator();

// Register a custom NPC template
eventGenerator.registerTemplate({
  id: 'npc_quest_giver',
  category: 'npc',
  data: {
    name: 'Quest Giver',
    description: 'NPC that gives quests to the player',
    tags: ['quest', 'important'],
    appearance: {
      type: 'npc',
      characterName: 'Actor2',
      characterIndex: 0,
      direction: 2,
      pattern: 1
    },
    pages: [
      {
        // Quest not started
        conditions: {
          switch1Id: '{{questSwitchId}}',
          switch1Valid: true
        },
        trigger: 0,
        commands: [
          ...commandBuilders.showText([
            "{{questIntro1}}",
            "{{questIntro2}}",
            "Will you help me?"
          ], 'Actor2', 0, 0, 2, '{{npcName}}'),
          ...commandBuilders.showChoices(["Yes", "No"]),
          ...commandBuilders.choiceCase(0, "Yes", [
            ...commandBuilders.showText("Thank you! {{questDetails}}"),
            ...commandBuilders.controlSwitches('{{questSwitchId}}', '{{questSwitchId}}', 1),
          ]),
          ...commandBuilders.choiceCase(1, "No", [
            ...commandBuilders.showText("Perhaps another time then.")
          ])
        ]
      },
      {
        // Quest in progress
        conditions: {
          switch1Id: '{{questSwitchId}}',
          switch1Valid: true,
          switch2Id: '{{questCompleteSwitchId}}',
          switch2Valid: true
        },
        trigger: 0,
        commands: [
          ...commandBuilders.showText("Have you completed your task yet?")
        ]
      },
      {
        // Quest completed
        conditions: {
          switch1Id: '{{questCompleteSwitchId}}',
          switch1Valid: true
        },
        trigger: 0,
        commands: [
          ...commandBuilders.showText("Thank you for your help!"),
          ...commandBuilders.showText("Please take this reward."),
          ...commandBuilders.changeGold(0, 0, '{{rewardGold}}'),
          ...commandBuilders.showText("Received {{rewardGold}} gold!")
        ]
      }
    ],
    parameters: {
      npcName: "Quest Giver",
      questSwitchId: 5,
      questCompleteSwitchId: 6,
      questIntro1: "Hello there, adventurer!",
      questIntro2: "I have a task for you.",
      questDetails: "Please defeat 5 slimes in the nearby forest.",
      rewardGold: 100
    },
    placementRules: {
      requireWalkable: true
    }
  }
});

// Generate a specific NPC event
const questGiver = eventGenerator.generateEvent('npc_quest_giver', {
  npcName: "Elder Thom",
  questIntro1: "Our village is in dire need of help!",
  questIntro2: "Monsters have taken over the mines.",
  questDetails: "Please clear out the monsters from the eastern mines.",
  rewardGold: 500,
  questSwitchId: 10,
  questCompleteSwitchId: 11
});

// Place events on a map
const mapContext = {
  eventPlacements: [
    {
      categoryOrTemplate: 'npc',
      count: 5,
      placementStrategy: 'inRoom',
      params: {}
    },
    {
      categoryOrTemplate: 'chest',
      count: 3,
      placementStrategy: 'nearWall',
      params: {
        itemId: 3,
        itemAmount: 1,
        itemName: "Healing Potion"
      }
    },
    {
      categoryOrTemplate: 'npc_quest_giver',
      count: 1,
      placementStrategy: 'nearEntrance',
      params: {
        npcName: "Mayor Wilkins",
        questIntro1: "Our village needs your help, brave one!",
        questDetails: "Goblins have been raiding our farms. Please defeat their leader."
      }
    }
  ]
};

// Map data would come from your map generator
const mapData = {
  id: 1,
  width: 50,
  height: 40,
  data: [...] // Tile data
};

// Place events on the map
const events = eventGenerator.placeEvents(mapData, mapContext);

// Now 'events' contains an array of event objects that can be added to the map
```

## Integration with RPG Maker MZ

The Event Generator can be integrated with RPG Maker MZ in several ways:

1. **Map Generation Pipeline**: Include event generation as part of map creation
2. **Event Templates**: Create a library of templates from existing events
3. **Variable Substitution**: Allow templates to be parameterized with game variables
4. **Event Factory Methods**: Expose commonly used event types as simple factory methods

## Next Steps

1. **Advanced Placement Strategies**: More sophisticated algorithms for event placement
2. **Event Relationships**: Create related events that interact with each other
3. **Dynamic Event Modification**: Modify events based on game state
4. **Event Testing Tools**: Validate that generated events work as expected
5. **Quest Integration**: Connect events to the quest system