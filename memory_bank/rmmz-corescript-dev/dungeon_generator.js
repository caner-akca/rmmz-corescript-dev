/**
 * Dungeon Generator for RPG Maker MZ
 * Uses Binary Space Partitioning (BSP) algorithm to create dungeon layouts
 */

class DungeonGenerator {
  constructor(width, height, options = {}) {
    // Map dimensions
    this.width = width;
    this.height = height;
    
    // Default options
    this.options = {
      minRoomSize: 5,
      maxRoomSize: 15,
      padding: 1,
      connectivity: 0.8,  // How connected rooms are (0-1)
      corridorWidth: 3,
      ...options
    };
    
    // Initialize map data (RPG Maker MZ uses a 6-layer system)
    this.initializeMapData();
    
    // Spaces for BSP algorithm
    this.spaces = [];
    this.rooms = [];
    this.corridors = [];
  }
  
  // Initialize empty map data array
  initializeMapData() {
    const size = this.width * this.height * 6; // 6 layers
    this.mapData = new Array(size).fill(0);
    
    // Default to wall tiles for layer 0 (bottom layer)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = this.getMapIndex(x, y, 0);
        this.mapData[index] = 1; // Wall tile (will be replaced with actual tile IDs later)
      }
    }
  }
  
  // Get the index in the map data array for a specific tile
  getMapIndex(x, y, layer) {
    return (layer * this.height * this.width) + (y * this.width) + x;
  }
  
  // Main generation method
  generate() {
    // Start with the entire map as one space
    this.spaces = [{
      x: 0,
      y: 0,
      width: this.width,
      height: this.height
    }];
    
    // Recursively split spaces
    this.splitSpaces(this.options.minRoomSize);
    
    // Create rooms within spaces
    this.createRooms();
    
    // Connect rooms with corridors
    this.connectRooms();
    
    // Add doors
    this.addDoors();
    
    // Add features (stairs, chests, etc.)
    this.addFeatures();
    
    // Apply tileset-specific mappings
    this.applyTilesetMappings();
    
    return {
      width: this.width,
      height: this.height,
      data: this.mapData,
      rooms: this.rooms,
      corridors: this.corridors
    };
  }
  
  // Split spaces recursively using BSP
  splitSpaces(minSize) {
    let didSplit = true;
    
    // Keep splitting until we can't split anymore
    while (didSplit) {
      didSplit = false;
      
      for (let i = 0; i < this.spaces.length; i++) {
        const space = this.spaces[i];
        
        // If this space is already too small, skip it
        if (space.width < minSize * 2 || space.height < minSize * 2) {
          continue;
        }
        
        // Randomly choose split direction (horizontal or vertical)
        const splitHorizontal = Math.random() > 0.5;
        
        if (splitHorizontal && space.height >= minSize * 2) {
          // Split horizontally
          this.splitHorizontally(space, minSize, i);
          didSplit = true;
        } else if (!splitHorizontal && space.width >= minSize * 2) {
          // Split vertically
          this.splitVertically(space, minSize, i);
          didSplit = true;
        }
        
        if (didSplit) {
          break; // We've modified the array, so break and start over
        }
      }
    }
  }
  
  // Split a space horizontally
  splitHorizontally(space, minSize, spaceIndex) {
    // Determine split position
    const splitPosition = Math.floor(minSize + (Math.random() * (space.height - minSize * 2)));
    
    // Create two new spaces
    const space1 = {
      x: space.x,
      y: space.y,
      width: space.width,
      height: splitPosition
    };
    
    const space2 = {
      x: space.x,
      y: space.y + splitPosition,
      width: space.width,
      height: space.height - splitPosition
    };
    
    // Replace original space with the two new ones
    this.spaces.splice(spaceIndex, 1, space1, space2);
  }
  
  // Split a space vertically
  splitVertically(space, minSize, spaceIndex) {
    // Determine split position
    const splitPosition = Math.floor(minSize + (Math.random() * (space.width - minSize * 2)));
    
    // Create two new spaces
    const space1 = {
      x: space.x,
      y: space.y,
      width: splitPosition,
      height: space.height
    };
    
    const space2 = {
      x: space.x + splitPosition,
      y: space.y,
      width: space.width - splitPosition,
      height: space.height
    };
    
    // Replace original space with the two new ones
    this.spaces.splice(spaceIndex, 1, space1, space2);
  }
  
  // Create rooms within each space
  createRooms() {
    for (const space of this.spaces) {
      // Calculate room dimensions (with padding)
      const padding = this.options.padding;
      const roomWidth = Math.floor(Math.random() * 
        (Math.min(space.width, this.options.maxRoomSize) - this.options.minRoomSize)) + 
        this.options.minRoomSize;
      const roomHeight = Math.floor(Math.random() * 
        (Math.min(space.height, this.options.maxRoomSize) - this.options.minRoomSize)) + 
        this.options.minRoomSize;
      
      // Calculate room position (centered in space with some randomness)
      const roomX = space.x + Math.floor((space.width - roomWidth) / 2) + 
        Math.floor(Math.random() * 3) - 1;
      const roomY = space.y + Math.floor((space.height - roomHeight) / 2) + 
        Math.floor(Math.random() * 3) - 1;
      
      // Create room
      const room = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight,
        centerX: Math.floor(roomX + roomWidth / 2),
        centerY: Math.floor(roomY + roomHeight / 2),
        connected: false
      };
      
      this.rooms.push(room);
      
      // Carve out room in map data (set floor tiles)
      for (let y = roomY; y < roomY + roomHeight; y++) {
        for (let x = roomX; x < roomX + roomWidth; x++) {
          const index = this.getMapIndex(x, y, 0);
          this.mapData[index] = 2; // Floor tile
        }
      }
    }
  }
  
  // Connect rooms with corridors
  connectRooms() {
    // First, create minimum spanning tree to ensure connectivity
    const edges = [];
    
    // Generate all possible connections between rooms
    for (let i = 0; i < this.rooms.length; i++) {
      for (let j = i + 1; j < this.rooms.length; j++) {
        const roomA = this.rooms[i];
        const roomB = this.rooms[j];
        
        const distance = Math.abs(roomA.centerX - roomB.centerX) + 
                         Math.abs(roomA.centerY - roomB.centerY);
        
        edges.push({
          roomA: i,
          roomB: j,
          distance: distance
        });
      }
    }
    
    // Sort by distance
    edges.sort((a, b) => a.distance - b.distance);
    
    // Union-find data structure for Kruskal's algorithm
    const parent = this.rooms.map((_, index) => index);
    
    const find = (i) => {
      if (parent[i] !== i) {
        parent[i] = find(parent[i]);
      }
      return parent[i];
    };
    
    const union = (i, j) => {
      parent[find(i)] = find(j);
    };
    
    // Create minimum spanning tree
    for (const edge of edges) {
      const rootA = find(edge.roomA);
      const rootB = find(edge.roomB);
      
      if (rootA !== rootB) {
        // Add this connection (part of MST)
        this.createCorridor(this.rooms[edge.roomA], this.rooms[edge.roomB]);
        this.rooms[edge.roomA].connected = true;
        this.rooms[edge.roomB].connected = true;
        union(edge.roomA, edge.roomB);
      } else if (Math.random() < this.options.connectivity) {
        // Add some extra connections for loops
        this.createCorridor(this.rooms[edge.roomA], this.rooms[edge.roomB]);
      }
    }
    
    // Ensure all rooms are connected
    for (const room of this.rooms) {
      if (!room.connected) {
        // Find nearest connected room
        let minDistance = Infinity;
        let nearestRoom = null;
        
        for (const otherRoom of this.rooms) {
          if (otherRoom.connected && otherRoom !== room) {
            const distance = Math.abs(room.centerX - otherRoom.centerX) + 
                             Math.abs(room.centerY - otherRoom.centerY);
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestRoom = otherRoom;
            }
          }
        }
        
        if (nearestRoom) {
          this.createCorridor(room, nearestRoom);
          room.connected = true;
        }
      }
    }
  }
  
  // Create a corridor between two rooms
  createCorridor(roomA, roomB) {
    const startX = roomA.centerX;
    const startY = roomA.centerY;
    const endX = roomB.centerX;
    const endY = roomB.centerY;
    
    // Create an L-shaped corridor
    const corridorWidth = this.options.corridorWidth;
    const halfWidth = Math.floor(corridorWidth / 2);
    
    // Decide whether to go horizontally or vertically first
    const horizontalFirst = Math.random() > 0.5;
    
    if (horizontalFirst) {
      // Horizontal corridor segment
      this.createHorizontalCorridor(startX, endX, startY, corridorWidth);
      
      // Vertical corridor segment
      this.createVerticalCorridor(endX, startY, endY, corridorWidth);
    } else {
      // Vertical corridor segment
      this.createVerticalCorridor(startX, startY, endY, corridorWidth);
      
      // Horizontal corridor segment
      this.createHorizontalCorridor(startX, endX, endY, corridorWidth);
    }
    
    // Add corridor to list
    this.corridors.push({
      startX, startY, endX, endY, horizontalFirst
    });
  }
  
  // Create a horizontal corridor segment
  createHorizontalCorridor(startX, endX, y, width) {
    const halfWidth = Math.floor(width / 2);
    const fromX = Math.min(startX, endX);
    const toX = Math.max(startX, endX);
    
    for (let x = fromX; x <= toX; x++) {
      for (let offsetY = -halfWidth; offsetY <= halfWidth; offsetY++) {
        const currentY = y + offsetY;
        
        if (currentY >= 0 && currentY < this.height && 
            x >= 0 && x < this.width) {
          const index = this.getMapIndex(x, currentY, 0);
          
          // Only carve if it's a wall (don't overwrite floor)
          if (this.mapData[index] !== 2) {
            this.mapData[index] = 2; // Floor tile
          }
        }
      }
    }
  }
  
  // Create a vertical corridor segment
  createVerticalCorridor(x, startY, endY, width) {
    const halfWidth = Math.floor(width / 2);
    const fromY = Math.min(startY, endY);
    const toY = Math.max(startY, endY);
    
    for (let y = fromY; y <= toY; y++) {
      for (let offsetX = -halfWidth; offsetX <= halfWidth; offsetX++) {
        const currentX = x + offsetX;
        
        if (currentX >= 0 && currentX < this.width && 
            y >= 0 && y < this.height) {
          const index = this.getMapIndex(currentX, y, 0);
          
          // Only carve if it's a wall (don't overwrite floor)
          if (this.mapData[index] !== 2) {
            this.mapData[index] = 2; // Floor tile
          }
        }
      }
    }
  }
  
  // Add doors between rooms and corridors
  addDoors() {
    // Implementation depends on your door placement strategy
    // For simplicity, this is a placeholder
    // In a full implementation, you would:
    // 1. Find corridor-room intersections
    // 2. Place doors at these locations
  }
  
  // Add features like stairs, chests, monsters
  addFeatures() {
    // Select random room for down stairs
    const downStairsRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
    
    // Add down stairs near center of room
    const stairsX = downStairsRoom.centerX;
    const stairsY = downStairsRoom.centerY;
    
    // In a real implementation, you would set the appropriate tile ID for stairs
    const stairsIndex = this.getMapIndex(stairsX, stairsY, 0);
    this.mapData[stairsIndex] = 3; // Stairs tile
    
    // Add up stairs in a different room
    let upStairsRoom;
    do {
      upStairsRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
    } while (upStairsRoom === downStairsRoom);
    
    const upStairsX = upStairsRoom.centerX;
    const upStairsY = upStairsRoom.centerY;
    
    const upStairsIndex = this.getMapIndex(upStairsX, upStairsY, 0);
    this.mapData[upStairsIndex] = 4; // Up stairs tile
  }
  
  // Apply tileset-specific mappings to convert logical map to actual tile IDs
  applyTilesetMappings() {
    // This would use a tileset configuration to map logical tiles to actual tile IDs
    // For simplicity, we're just using placeholder values
    
    // In a real implementation, you would:
    // 1. Load a tileset configuration for the specific tileset you're using
    // 2. Map the logical tiles (0=empty, 1=wall, 2=floor, 3=stairs, etc.) to actual tile IDs
    // 3. Handle autotiling for walls and other complex tile types
  }
  
  // Export to RPG Maker MZ map format
  exportToRMMZ(mapId, displayName) {
    return {
      autoplayBgm: false,
      autoplayBgs: false,
      battleback1Name: "",
      battleback2Name: "",
      bgm: {name: "", pan: 0, pitch: 100, volume: 90},
      bgs: {name: "", pan: 0, pitch: 100, volume: 90},
      disableDashing: false,
      displayName: displayName || `Dungeon B${mapId}F`,
      encounterList: [],
      encounterStep: 30,
      height: this.height,
      note: "",
      parallaxLoopX: false,
      parallaxLoopY: false,
      parallaxName: "",
      parallaxShow: true,
      parallaxSx: 0,
      parallaxSy: 0,
      scrollType: 0,
      specifyBattleback: false,
      tilesetId: 1, // This should be configurable
      width: this.width,
      data: this.mapData,
      events: [] // Events would be added separately
    };
  }
}

// Export the generator
module.exports = DungeonGenerator;