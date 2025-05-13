# Map Manager for Procedural RPG Maker MZ Development

This document outlines the design of a Map Manager system that handles relationships between procedurally generated maps in RPG Maker MZ.

## Core Concepts

The Map Manager serves as a central registry for all maps in your game, handling:

1. Map hierarchy and connections
2. Map metadata and tags
3. Map generation triggers
4. Inter-map navigation and transitions
5. Map state persistence

## Data Structure

```javascript
// Map registry data structure
class MapRegistry {
  constructor() {
    this.maps = new Map(); // mapId -> MapData
    this.connections = new Map(); // mapId -> Array of ConnectionData
    this.regions = new Map(); // regionId -> Array of mapIds
    this.currentMapId = 0;
  }
  
  // Map data structure
  // mapId: Number - unique identifier
  // metadata: {
  //   name: String - display name
  //   type: String - "town", "dungeon", "field", etc.
  //   level: Number - difficulty/story level
  //   region: String - geographical region
  //   tags: Array - special properties ["snowy", "haunted", etc.]
  //   generatorType: String - which generator to use
  //   generatorOptions: Object - options for the generator
  //   isGenerated: Boolean - has this map been generated yet
  //   isPersistent: Boolean - keep in memory or regenerate
  // }
}
```

## Map Connection Types

Maps can connect to each other in various ways:

1. **Direct Connections**: Doors, stairs, or map edges that lead to specific coordinates on another map
2. **Regional Connections**: Connected via a world map or region transitions
3. **Hierarchical Connections**: Parent-child relationships (e.g., a town and buildings within it)
4. **Special Connections**: Portals, teleports, or scripted events

```javascript
// Connection data structure
// sourceMapId: Number - origin map
// targetMapId: Number - destination map
// sourceX, sourceY: Number - coordinates on source map
// targetX, targetY: Number - coordinates on target map
// type: String - "door", "stairs", "edge", "portal", etc.
// direction: Number - player facing direction after transition
// conditions: Object - conditions for using this connection
// transitionType: String - "fade", "scroll", etc.
// oneWay: Boolean - can you return through this connection?
```

## Map Generation Strategy

The Map Manager uses a just-in-time generation strategy:

1. **Lazy Generation**: Maps are only generated when needed (approaching a connection)
2. **Caching**: Generated maps are cached based on memory constraints
3. **Persistence Rules**: Some maps always persist (towns, story locations)
4. **Seed-Based**: Consistent regeneration using seeds derived from the map ID and game state

## Implementation

```javascript
class MapManager {
  constructor(options = {}) {
    this.registry = new MapRegistry();
    this.generators = new Map(); // generatorType -> generator function
    this.maxCachedMaps = options.maxCachedMaps || 10;
    this.generationQueue = []; // Maps awaiting generation
    this.persistentMapIds = new Set(); // Maps that should never be unloaded
  }
  
  // Register a map generator type
  registerGenerator(type, generatorFunction) {
    this.generators.set(type, generatorFunction);
  }
  
  // Create a new map entry (without generating it yet)
  registerMap(metadata) {
    const mapId = this.getNextMapId();
    this.registry.maps.set(mapId, {
      id: mapId,
      metadata: { ...metadata, isGenerated: false },
      data: null
    });
    
    // Add to region
    if (metadata.region) {
      if (!this.registry.regions.has(metadata.region)) {
        this.registry.regions.set(metadata.region, []);
      }
      this.registry.regions.get(metadata.region).push(mapId);
    }
    
    return mapId;
  }
  
  // Connect two maps
  connectMaps(sourceMapId, targetMapId, connectionData) {
    if (!this.registry.connections.has(sourceMapId)) {
      this.registry.connections.set(sourceMapId, []);
    }
    
    this.registry.connections.get(sourceMapId).push({
      sourceMapId,
      targetMapId,
      ...connectionData
    });
    
    // Create reverse connection if not one-way
    if (!connectionData.oneWay) {
      if (!this.registry.connections.has(targetMapId)) {
        this.registry.connections.set(targetMapId, []);
      }
      
      this.registry.connections.get(targetMapId).push({
        sourceMapId: targetMapId,
        targetMapId: sourceMapId,
        sourceX: connectionData.targetX,
        sourceY: connectionData.targetY,
        targetX: connectionData.sourceX,
        targetY: connectionData.sourceY,
        type: connectionData.type,
        direction: this.getReverseDirection(connectionData.direction),
        conditions: connectionData.conditions,
        transitionType: connectionData.transitionType,
        oneWay: false
      });
    }
  }
  
  // Generate a map
  generateMap(mapId) {
    const mapData = this.registry.maps.get(mapId);
    if (!mapData) return null;
    
    const generator = this.generators.get(mapData.metadata.generatorType);
    if (!generator) return null;
    
    // Create a seed based on mapId and game state
    const seed = this.createSeed(mapId);
    
    // Generate the map
    const generatedData = generator({
      mapId,
      seed,
      ...mapData.metadata.generatorOptions
    });
    
    // Update map data
    mapData.data = generatedData;
    mapData.metadata.isGenerated = true;
    
    // Add connections to the map
    this.addConnectionsToMap(mapId, generatedData);
    
    return generatedData;
  }
  
  // Add connection events to the map
  addConnectionsToMap(mapId, mapData) {
    if (!this.registry.connections.has(mapId)) return;
    
    const connections = this.registry.connections.get(mapId);
    let eventId = 1;
    
    for (const connection of connections) {
      // Create a transfer event at the connection point
      const event = this.createTransferEvent(
        eventId++,
        connection.sourceX,
        connection.sourceY, 
        connection
      );
      
      // Add to map events
      if (!mapData.events) mapData.events = [];
      mapData.events.push(event);
    }
  }
  
  // Create a transfer event
  createTransferEvent(id, x, y, connection) {
    // Create an event object with transfer player command
    return {
      id: id,
      name: `Transfer to Map ${connection.targetMapId}`,
      note: "",
      pages: [
        {
          conditions: connection.conditions || {
            actorId: 1, actorValid: false,
            itemId: 1, itemValid: false,
            selfSwitchCh: "A", selfSwitchValid: false,
            switch1Id: 1, switch1Valid: false,
            switch2Id: 1, switch2Valid: false,
            variableId: 1, variableValid: false,
            variableValue: 0
          },
          directionFix: false,
          image: {
            characterIndex: 0,
            characterName: "",
            direction: 2,
            pattern: 0,
            tileId: 0
          },
          list: [
            {
              "code": 201, 
              "indent": 0, 
              "parameters": [
                0, // Transfer type (0 = same map)
                connection.targetMapId,
                connection.targetX,
                connection.targetY,
                connection.direction,
                connection.transitionType === "fade" ? 0 : 
                connection.transitionType === "white" ? 1 : 2
              ]
            },
            {"code": 0, "indent": 0, "parameters": []}
          ],
          moveFrequency: 3,
          moveRoute: {
            list: [{"code": 0, "parameters": []}],
            repeat: true,
            skippable: false,
            wait: false
          },
          moveSpeed: 3,
          moveType: 0,
          priorityType: connection.type === "door" ? 1 : 0,
          stepAnime: false,
          through: false,
          trigger: connection.type === "door" ? 0 : 1, // 0 = action button, 1 = player touch
          walkAnime: true
        }
      ],
      x: x,
      y: y
    };
  }
  
  // Handle player transfer between maps
  transferPlayer(sourceMapId, targetMapId, x, y, direction) {
    // Check if map exists
    if (!this.registry.maps.has(targetMapId)) return false;
    
    // Check if map is generated, if not, generate it
    const targetMap = this.registry.maps.get(targetMapId);
    if (!targetMap.metadata.isGenerated) {
      this.generateMap(targetMapId);
    }
    
    // Update current map ID
    this.registry.currentMapId = targetMapId;
    
    // Handle map caching
    this.manageMapCache();
    
    // Send transfer command to RPG Maker MZ
    return {
      mapId: targetMapId,
      x: x,
      y: y,
      direction: direction
    };
  }
  
  // Manage map cache based on memory constraints
  manageMapCache() {
    // Get all generated, non-persistent maps
    const generatedMaps = [...this.registry.maps.values()]
      .filter(map => map.metadata.isGenerated && 
              !this.persistentMapIds.has(map.id) &&
              map.id !== this.registry.currentMapId);
    
    // If we have too many maps, unload some
    if (generatedMaps.length > this.maxCachedMaps) {
      // Sort by distance from current map (conceptually)
      generatedMaps.sort((a, b) => {
        // Implement distance metric - could be graph distance, region, etc.
        return 0; // Placeholder
      });
      
      // Unload the furthest maps
      const mapsToUnload = generatedMaps.slice(this.maxCachedMaps);
      for (const map of mapsToUnload) {
        map.data = null;
        map.metadata.isGenerated = false;
      }
    }
  }
  
  // Get reverse direction (for two-way connections)
  getReverseDirection(direction) {
    // 2 = down, 4 = left, 6 = right, 8 = up
    const reverseMap = { 2: 8, 4: 6, 6: 4, 8: 2 };
    return reverseMap[direction] || direction;
  }
  
  // Create a consistent seed for map generation
  createSeed(mapId) {
    // Combine mapId with game state factors for consistency
    // This could include story progress, player level, etc.
    return `map_${mapId}_${Date.now()}`;
  }
  
  // Get the next available map ID
  getNextMapId() {
    // Find the highest existing map ID and increment
    let maxId = 0;
    for (const mapId of this.registry.maps.keys()) {
      maxId = Math.max(maxId, mapId);
    }
    return maxId + 1;
  }
}
```

## Usage Example

```javascript
// Create map manager
const mapManager = new MapManager();

// Register generators
mapManager.registerGenerator('dungeon', DungeonGenerator);
mapManager.registerGenerator('town', TownGenerator);
mapManager.registerGenerator('field', FieldGenerator);

// Create a town map
const townMapId = mapManager.registerMap({
  name: "Oakvale",
  type: "town",
  level: 1,
  region: "central",
  tags: ["starter"],
  generatorType: "town",
  generatorOptions: {
    width: 50,
    height: 40,
    buildings: 15,
    style: "medieval"
  },
  isPersistent: true
});

// Create a dungeon map
const dungeonMapId = mapManager.registerMap({
  name: "Forgotten Mines",
  type: "dungeon",
  level: 3,
  region: "central",
  tags: ["underground", "monsters"],
  generatorType: "dungeon",
  generatorOptions: {
    width: 80,
    height: 80,
    rooms: 20,
    difficulty: "medium"
  },
  isPersistent: false
});

// Connect the maps
mapManager.connectMaps(townMapId, dungeonMapId, {
  sourceX: 25, 
  sourceY: 35,
  targetX: 10,
  targetY: 5,
  type: "cave",
  direction: 2, // Down
  transitionType: "fade",
  oneWay: false
});

// Generate the town
mapManager.generateMap(townMapId);

// When the player approaches the connection, the dungeon will be generated
// just before the transfer occurs
mapManager.transferPlayer(townMapId, dungeonMapId, 10, 5, 2);
```

## Integration with RPG Maker MZ

The Map Manager can be integrated with RPG Maker MZ in several ways:

1. **Plugin Commands**: Expose key functions as plugin commands
2. **Event Hooks**: Hook into the map loading/unloading process
3. **Data Manager Extensions**: Extend the Data Manager to handle dynamic maps
4. **Scene Overrides**: Override Scene_Map to handle map transitions

## Next Steps

1. **Implement Region Management**: Handle larger world structures
2. **Add Map Evolution**: Allow maps to change over time
3. **Create Visualization Tools**: For debugging and design
4. **Optimize Memory Usage**: More sophisticated caching strategies
5. **Add Metadata Validation**: Ensure map configurations are valid