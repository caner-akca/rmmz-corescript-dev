/**
 * Cave Generator for RPG Maker MZ
 * Uses Cellular Automata algorithm to create organic cave layouts
 */

class CaveGenerator {
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;
    
    this.options = {
      fillProbability: 0.45, // Initial fill probability
      iterations: 4,         // Number of CA iterations
      birthLimit: 4,         // Rules for cell birth
      deathLimit: 3,         // Rules for cell death
      smoothingIterations: 2, // Post-processing smoothing
      ensureConnectivity: true, // Make sure all open areas are connected
      ...options
    };
    
    this.initializeMapData();
  }
  
  // Initialize map data with random fill
  initializeMapData() {
    const size = this.width * this.height * 6;
    this.mapData = new Array(size).fill(0);
    
    // Initialize CA grid
    this.grid = new Array(this.width * this.height).fill(0);
    
    // Randomly fill the map
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Leave a border of walls
        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
          this.setTile(x, y, 1); // Wall
        } else {
          // Random fill
          const isWall = Math.random() < this.options.fillProbability;
          this.setTile(x, y, isWall ? 1 : 0);
        }
      }
    }
  }
  
  // Set a tile value
  setTile(x, y, value) {
    const index = (y * this.width) + x;
    this.grid[index] = value;
  }
  
  // Get a tile value
  getTile(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return 1; // Out of bounds is wall
    }
    const index = (y * this.width) + x;
    return this.grid[index];
  }
  
  // Count neighbors
  countNeighbors(x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        
        if (this.getTile(x + i, y + j) === 1) {
          count++;
        }
      }
    }
    return count;
  }
  
  // Perform cellular automata iteration
  doSimulationStep() {
    const newGrid = new Array(this.width * this.height).fill(0);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const neighbors = this.countNeighbors(x, y);
        const currentTile = this.getTile(x, y);
        
        // Apply cellular automata rules
        if (currentTile === 1) {
          // Currently a wall
          newGrid[(y * this.width) + x] = (neighbors < this.options.deathLimit) ? 0 : 1;
        } else {
          // Currently empty
          newGrid[(y * this.width) + x] = (neighbors > this.options.birthLimit) ? 1 : 0;
        }
        
        // Keep border as walls
        if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
          newGrid[(y * this.width) + x] = 1;
        }
      }
    }
    
    // Update grid
    this.grid = newGrid;
  }
  
  // Main generation method
  generate() {
    // Run cellular automata for specified iterations
    for (let i = 0; i < this.options.iterations; i++) {
      this.doSimulationStep();
    }
    
    // Smooth the results
    for (let i = 0; i < this.options.smoothingIterations; i++) {
      this.smoothMap();
    }
    
    // Ensure all open areas are connected
    if (this.options.ensureConnectivity) {
      this.connectCaves();
    }
    
    // Convert to RPG Maker MZ format (0 = empty, 1 = wall becomes floor/wall)
    this.convertToRPGMakerFormat();
    
    // Add cave features
    this.addFeatures();
    
    return {
      width: this.width,
      height: this.height,
      data: this.mapData
    };
  }
  
  // Smooth out the cave to remove single-tile irregularities
  smoothMap() {
    const newGrid = [...this.grid];
    
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const neighbors = this.countNeighbors(x, y);
        const index = (y * this.width) + x;
        
        // Remove single wall tiles (surrounded by floors)
        if (this.grid[index] === 1 && neighbors <= 1) {
          newGrid[index] = 0;
        }
        
        // Fill single floor tiles (surrounded by walls)
        if (this.grid[index] === 0 && neighbors >= 7) {
          newGrid[index] = 1;
        }
      }
    }
    
    this.grid = newGrid;
  }
  
  // Connect disconnected cave sections
  connectCaves() {
    // Identify distinct cave regions
    const regions = this.identifyRegions();
    
    if (regions.size <= 1) {
      return; // Already connected
    }
    
    // Find the largest region
    const regionSizes = new Map();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = (y * this.width) + x;
        const region = regions.get(index);
        if (region > 0) {
          regionSizes.set(region, (regionSizes.get(region) || 0) + 1);
        }
      }
    }
    
    // Sort regions by size, largest first
    const sortedRegions = [...regionSizes.entries()].sort((a, b) => b[1] - a[1]);
    const mainRegion = sortedRegions[0][0];
    
    // Connect other regions to the main region
    for (let i = 1; i < sortedRegions.length; i++) {
      const regionToConnect = sortedRegions[i][0];
      this.connectRegions(mainRegion, regionToConnect, regions);
    }
  }
  
  // Identify distinct regions using flood fill
  identifyRegions() {
    const regions = new Map();
    let currentRegion = 0;
    
    // Initialize all cells to no region
    for (let i = 0; i < this.grid.length; i++) {
      regions.set(i, 0);
    }
    
    // Flood fill to identify regions
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const index = (y * this.width) + x;
        
        // If this is an open cell with no region yet
        if (this.grid[index] === 0 && regions.get(index) === 0) {
          currentRegion++;
          this.floodFill(x, y, currentRegion, regions);
        }
      }
    }
    
    return regions;
  }
  
  // Flood fill algorithm to fill a region
  floodFill(startX, startY, regionId, regions) {
    const stack = [{x: startX, y: startY}];
    
    while (stack.length > 0) {
      const {x, y} = stack.pop();
      const index = (y * this.width) + x;
      
      // If already processed or is a wall, skip
      if (regions.get(index) !== 0 || this.grid[index] === 1) {
        continue;
      }
      
      // Mark as part of this region
      regions.set(index, regionId);
      
      // Add neighbors to the stack
      stack.push({x: x+1, y});
      stack.push({x: x-1, y});
      stack.push({x, y: y+1});
      stack.push({x, y: y-1});
    }
  }
  
  // Connect two regions by creating a tunnel
  connectRegions(region1, region2, regions) {
    // Find closest points between regions
    let minDistance = Infinity;
    let bestPair = null;
    
    for (let y1 = 1; y1 < this.height - 1; y1++) {
      for (let x1 = 1; x1 < this.width - 1; x1++) {
        const index1 = (y1 * this.width) + x1;
        
        if (regions.get(index1) !== region1) continue;
        
        for (let y2 = 1; y2 < this.height - 1; y2++) {
          for (let x2 = 1; x2 < this.width - 1; x2++) {
            const index2 = (y2 * this.width) + x2;
            
            if (regions.get(index2) !== region2) continue;
            
            const distance = Math.abs(x1 - x2) + Math.abs(y1 - y2);
            if (distance < minDistance) {
              minDistance = distance;
              bestPair = {x1, y1, x2, y2};
            }
          }
        }
      }
    }
    
    if (bestPair) {
      this.createTunnel(bestPair.x1, bestPair.y1, bestPair.x2, bestPair.y2);
    }
  }
  
  // Create a tunnel between two points
  createTunnel(x1, y1, x2, y2) {
    // Create a simple L-shaped tunnel
    const horizontalFirst = Math.random() > 0.5;
    
    if (horizontalFirst) {
      // Move horizontally first, then vertically
      this.createHorizontalTunnel(x1, x2, y1);
      this.createVerticalTunnel(y1, y2, x2);
    } else {
      // Move vertically first, then horizontally
      this.createVerticalTunnel(y1, y2, x1);
      this.createHorizontalTunnel(x1, x2, y2);
    }
  }
  
  // Create a horizontal tunnel
  createHorizontalTunnel(x1, x2, y) {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    
    for (let x = start; x <= end; x++) {
      const index = (y * this.width) + x;
      this.grid[index] = 0; // Open cell
    }
  }
  
  // Create a vertical tunnel
  createVerticalTunnel(y1, y2, x) {
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);
    
    for (let y = start; y <= end; y++) {
      const index = (y * this.width) + x;
      this.grid[index] = 0; // Open cell
    }
  }
  
  // Convert the cellular automata grid to RPG Maker MZ format
  convertToRPGMakerFormat() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = (y * this.width) + x;
        const isWall = this.grid[index] === 1;
        
        // Update all layers
        for (let layer = 0; layer < 6; layer++) {
          const mapIndex = (layer * this.height * this.width) + index;
          
          if (layer === 0) { // Bottom layer - main tiles
            this.mapData[mapIndex] = isWall ? 1 : 2; // 1 = wall, 2 = floor
          } else {
            this.mapData[mapIndex] = 0; // Empty for other layers
          }
        }
      }
    }
  }
  
  // Add cave features like water, stalagmites, etc.
  addFeatures() {
    // Add water pools in some open areas
    this.addWaterFeatures();
    
    // Add cave decorations (stalagmites, crystals, etc.)
    this.addCaveDecorations();
    
    // Add entrance and exit
    this.addEntranceAndExit();
  }
  
  // Add water features to the cave
  addWaterFeatures() {
    // In a full implementation, you would:
    // 1. Identify low points in the cave
    // 2. Add small pools of water
    // 3. Maybe even create underground rivers
    
    // Simple implementation: random water pools
    const numPools = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numPools; i++) {
      // Find a suitable location (open area)
      let x, y;
      let attempts = 0;
      
      do {
        x = Math.floor(Math.random() * (this.width - 10)) + 5;
        y = Math.floor(Math.random() * (this.height - 10)) + 5;
        attempts++;
      } while (this.grid[(y * this.width) + x] !== 0 && attempts < 50);
      
      if (attempts >= 50) continue; // Couldn't find a suitable spot
      
      // Create a small water pool
      const poolSize = Math.floor(Math.random() * 3) + 2;
      
      for (let dy = -poolSize; dy <= poolSize; dy++) {
        for (let dx = -poolSize; dx <= poolSize; dx++) {
          // Only place water in open areas within circular-ish shape
          if (dx*dx + dy*dy <= poolSize*poolSize) {
            const tx = x + dx;
            const ty = y + dy;
            
            if (tx > 0 && tx < this.width - 1 && ty > 0 && ty < this.height - 1) {
              const index = (ty * this.width) + tx;
              
              if (this.grid[index] === 0) { // If it's an open area
                // Place water (layer 0)
                const mapIndex = index; // Layer 0
                this.mapData[mapIndex] = 3; // Water tile
              }
            }
          }
        }
      }
    }
  }
  
  // Add cave decorations
  addCaveDecorations() {
    // In a full implementation:
    // 1. Add stalagmites/stalactites near walls
    // 2. Add crystal formations
    // 3. Add mushrooms or other cave flora
    
    // Simple implementation: random decorations
    const numDecorations = Math.floor((this.width * this.height) * 0.01); // 1% of tiles
    
    for (let i = 0; i < numDecorations; i++) {
      // Find a suitable location (open area)
      let x, y;
      let attempts = 0;
      
      do {
        x = Math.floor(Math.random() * (this.width - 4)) + 2;
        y = Math.floor(Math.random() * (this.height - 4)) + 2;
        attempts++;
      } while (this.grid[(y * this.width) + x] !== 0 && attempts < 20);
      
      if (attempts >= 20) continue; // Couldn't find a suitable spot
      
      // Place decoration (on layer 1 for objects)
      const mapIndex = (1 * this.height * this.width) + (y * this.width) + x;
      this.mapData[mapIndex] = 10 + Math.floor(Math.random() * 5); // Random decoration tile
    }
  }
  
  // Add entrance and exit to the cave
  addEntranceAndExit() {
    // Find suitable entrance location (near edge)
    let entranceX, entranceY;
    let attempts = 0;
    
    // Try to place entrance near top edge
    do {
      entranceX = Math.floor(Math.random() * (this.width - 10)) + 5;
      entranceY = 3 + Math.floor(Math.random() * 3);
      attempts++;
    } while (this.grid[(entranceY * this.width) + entranceX] !== 0 && attempts < 50);
    
    if (attempts < 50) {
      // Place entrance stairs
      const entranceIndex = (entranceY * this.width) + entranceX;
      this.mapData[entranceIndex] = 4; // Entrance stairs tile
    }
    
    // Find suitable exit location (in a distant open area)
    let exitX, exitY;
    attempts = 0;
    
    // Try to place exit near bottom edge
    do {
      exitX = Math.floor(Math.random() * (this.width - 10)) + 5;
      exitY = this.height - 5 + Math.floor(Math.random() * 3);
      attempts++;
    } while (this.grid[(exitY * this.width) + exitX] !== 0 && attempts < 50);
    
    if (attempts < 50) {
      // Place exit stairs
      const exitIndex = (exitY * this.width) + exitX;
      this.mapData[exitIndex] = 5; // Exit stairs tile
    }
  }
  
  // Export to RPG Maker MZ map format
  exportToRMMZ(mapId, displayName) {
    return {
      autoplayBgm: false,
      autoplayBgs: false,
      battleback1Name: "Cave",
      battleback2Name: "Cave",
      bgm: {name: "", pan: 0, pitch: 100, volume: 90},
      bgs: {name: "Cave", pan: 0, pitch: 100, volume: 80},
      disableDashing: false,
      displayName: displayName || `Cave B${mapId}F`,
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
      specifyBattleback: true,
      tilesetId: 3, // Cave tileset (should be configurable)
      width: this.width,
      data: this.mapData,
      events: [] // Events would be added separately
    };
  }
}

// Export the generator
module.exports = CaveGenerator;