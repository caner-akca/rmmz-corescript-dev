# RPG Maker MZ - Command-line Integration and Automation

This document explores approaches for integrating RPG Maker MZ with command-line tools and automation processes, enabling programmatic game development without using the UI.

## Understanding RPG Maker MZ's Architecture

RPG Maker MZ is built on the following technologies:
- **NW.js** (previously Node-Webkit): A runtime for building desktop applications with web technologies
- **Pixi.js**: For rendering graphics
- **Web technologies**: HTML, CSS, and JavaScript

This architecture provides several advantages for automation:
1. Access to Node.js capabilities for file system operations
2. Ability to create external tools using JavaScript/Node.js
3. Ability to use npm packages and command-line tools

## Command-line Integration Approaches

### 1. Direct Manipulation of Project Files

The simplest approach is to directly manipulate the JSON files in the `data/` directory:

```javascript
// example-script.js
const fs = require('fs');
const path = require('path');

// Project path
const PROJECT_PATH = '/path/to/your/rmmz/project';
const DATA_PATH = path.join(PROJECT_PATH, 'data');

// Read a data file
function readDataFile(filename) {
    const filePath = path.join(DATA_PATH, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data;
}

// Write a data file
function writeDataFile(filename, data) {
    const filePath = path.join(DATA_PATH, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Example: Adding a new item
function addNewItem(name, description, price) {
    // Read items data
    const items = readDataFile('Items.json');
    
    // Find the next available ID
    const maxId = items.reduce((max, item) => {
        if (!item) return max;
        return Math.max(max, item.id);
    }, 0);
    
    // Create the new item
    const newItem = {
        id: maxId + 1,
        name: name,
        description: description,
        price: price,
        iconIndex: 16, // Default icon
        effects: [],
        damage: {
            critical: false,
            elementId: 0,
            formula: "0",
            type: 0,
            variance: 20
        },
        note: "",
        occasion: 0,
        repeats: 1,
        scope: 7,
        speed: 0,
        successRate: 100,
        tpGain: 0
    };
    
    // Add to the items array
    items.push(newItem);
    
    // Write back to the file
    writeDataFile('Items.json', items);
    
    return newItem;
}

// Usage: Add a new potion
addNewItem('Super Potion', 'Restores 500 HP', 200);
```

Run this script with Node.js:
```bash
node example-script.js
```

### 2. Creating a Command-line Interface

You can build a more sophisticated CLI to interact with your RPG Maker MZ projects:

```javascript
// cli.js
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { program } = require('commander'); // npm install commander

program
    .version('1.0.0')
    .description('RPG Maker MZ Command Line Interface');

// Create a new project
program
    .command('create <name>')
    .description('Create a new RPG Maker MZ project')
    .option('-t, --template <template>', 'Template to use', 'default')
    .action((name, options) => {
        console.log(`Creating project ${name} with template ${options.template}`);
        // Implementation would copy a template project structure
    });

// Add a new map
program
    .command('add-map <project> <name>')
    .description('Add a new map to the project')
    .option('-w, --width <width>', 'Map width', '17')
    .option('-h, --height <height>', 'Map height', '13')
    .option('-t, --tileset <id>', 'Tileset ID to use', '1')
    .action((project, name, options) => {
        // Implementation would create a new map file
        console.log(`Adding map "${name}" (${options.width}x${options.height}) to ${project}`);
    });

// Add an item
program
    .command('add-item <project> <name>')
    .description('Add a new item to the project')
    .option('-d, --description <text>', 'Item description')
    .option('-p, --price <price>', 'Item price', '0')
    .option('-i, --icon <index>', 'Icon index', '16')
    .action((project, name, options) => {
        // Implementation would add the item to Items.json
        console.log(`Adding item "${name}" to ${project}`);
    });

// Export data
program
    .command('export <project> <type>')
    .description('Export data from the project')
    .option('-f, --format <format>', 'Output format', 'json')
    .option('-o, --output <file>', 'Output file')
    .action((project, type, options) => {
        // Implementation would export data to the specified format
        console.log(`Exporting ${type} data from ${project} as ${options.format}`);
    });

program.parse(process.argv);
```

Install dependencies and run:
```bash
npm install commander
node cli.js add-map my-project "Forest Dungeon" --width 20 --height 15
```

### 3. Scriptable Plugin System

Create a plugin that exposes API functions for command-line scripts:

```javascript
/*:
 * @target MZ
 * @plugindesc v1.0.0 Scriptable API for external tools
 * @author Your Name
 *
 * @help
 * This plugin creates a scriptable API for external tools.
 * It exposes functions through the global ScriptableAPI object.
 */

(() => {
    'use strict';
    
    // Create global API
    window.ScriptableAPI = {
        createActor: function(data) {
            // Implementation
        },
        
        createMap: function(data) {
            // Implementation
        },
        
        createEvent: function(mapId, data) {
            // Implementation
        },
        
        importData: function(type, path) {
            // Implementation
        },
        
        exportData: function(type, path) {
            // Implementation
        }
    };
    
    // Add command-line argument parsing for automation
    if (Utils.isNwjs()) {
        const args = process.argv.slice(2);
        if (args.length > 0) {
            // Command-line mode
            const command = args[0];
            
            switch (command) {
                case 'import':
                    // Handle import command
                    break;
                case 'export':
                    // Handle export command
                    break;
                case 'batch':
                    // Execute batch file
                    break;
            }
            
            // Optionally exit when done
            if (args.includes('--exit')) {
                setTimeout(() => {
                    window.close();
                }, 100);
            }
        }
    }
})();
```

Then create a batch script to interact with the plugin:

```javascript
// batch-script.js
const { exec } = require('child_process');
const path = require('path');

// Path to RPG Maker MZ project
const PROJECT_PATH = '/path/to/your/rmmz/project';
const GAME_PATH = path.join(PROJECT_PATH, 'game.exe');

// Execute RPG Maker MZ with command-line arguments
function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        const commandArgs = [command, ...args, '--exit'];
        const cmdString = `"${GAME_PATH}" ${commandArgs.join(' ')}`;
        
        exec(cmdString, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}

// Example: Export all data
async function exportAllData() {
    try {
        await runCommand('export', ['all', '--format', 'json', '--output', 'data_export.json']);
        console.log('Data exported successfully');
    } catch (error) {
        console.error('Export failed:', error);
    }
}

exportAllData();
```

## 4. External Data Processor

Create external tools that process data files without launching RPG Maker MZ:

```javascript
// data-processor.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // npm install js-yaml

// Project path
const PROJECT_PATH = '/path/to/your/rmmz/project';
const DATA_PATH = path.join(PROJECT_PATH, 'data');

// Convert between YAML and JSON
function convertYamlToJson(yamlFile, jsonFile) {
    try {
        // Read YAML
        const yamlContent = fs.readFileSync(yamlFile, 'utf8');
        const data = yaml.load(yamlContent);
        
        // Write JSON
        fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
        console.log(`Converted ${yamlFile} to ${jsonFile}`);
    } catch (error) {
        console.error('Conversion failed:', error);
    }
}

function convertJsonToYaml(jsonFile, yamlFile) {
    try {
        // Read JSON
        const jsonContent = fs.readFileSync(jsonFile, 'utf8');
        const data = JSON.parse(jsonContent);
        
        // Write YAML
        const yamlContent = yaml.dump(data, {
            indent: 2,
            lineWidth: -1,
            noRefs: true
        });
        fs.writeFileSync(yamlFile, yamlContent);
        console.log(`Converted ${jsonFile} to ${yamlFile}`);
    } catch (error) {
        console.error('Conversion failed:', error);
    }
}

// Convert all data files to YAML for easier editing
function convertAllToYaml() {
    const files = fs.readdirSync(DATA_PATH);
    
    for (const file of files) {
        if (file.endsWith('.json')) {
            const jsonFile = path.join(DATA_PATH, file);
            const yamlFile = path.join(DATA_PATH, file.replace('.json', '.yaml'));
            convertJsonToYaml(jsonFile, yamlFile);
        }
    }
}

// After editing YAML files, convert them back to JSON
function convertAllToJson() {
    const files = fs.readdirSync(DATA_PATH);
    
    for (const file of files) {
        if (file.endsWith('.yaml')) {
            const yamlFile = path.join(DATA_PATH, file);
            const jsonFile = path.join(DATA_PATH, file.replace('.yaml', '.json'));
            convertYamlToJson(yamlFile, jsonFile);
        }
    }
}

// Usage
if (process.argv[2] === 'to-yaml') {
    convertAllToYaml();
} else if (process.argv[2] === 'to-json') {
    convertAllToJson();
}
```

## Designing a Complete Automation Workflow

To create a fully automated game development workflow:

### 1. Version Control Setup

Use Git to manage your project:

```bash
# Initialize repository
cd /path/to/your/rmmz/project
git init

# Create .gitignore
cat > .gitignore << EOL
*.rpgproject
save/
node_modules/
EOL

# Initial commit
git add .
git commit -m "Initial commit"
```

### 2. Project Structure for Automation

Create a more automation-friendly structure:

```
ProjectName/
├── game/              # Actual RPG Maker MZ project
│   ├── data/          # Game data JSON files
│   ├── js/            # JavaScript code files
│   └── ...
├── scripts/           # Automation scripts
│   ├── cli.js         # Command-line interface
│   ├── generators/    # Content generators
│   └── utilities/     # Helper functions
├── content/           # Source content in easier-to-edit formats
│   ├── maps/          # Map definitions in YAML
│   ├── events/        # Event scripts
│   ├── items/         # Item definitions
│   └── quests/        # Quest definitions
├── package.json       # Node.js project file
└── README.md          # Documentation
```

### 3. Automation Script Examples

#### Build Script for Game Generation

```javascript
// scripts/build.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONTENT_PATH = path.join(__dirname, '../content');
const GAME_PATH = path.join(__dirname, '../game');
const DATA_PATH = path.join(GAME_PATH, 'data');

// Process map definitions
function processMaps() {
    const mapsPath = path.join(CONTENT_PATH, 'maps');
    const mapFiles = fs.readdirSync(mapsPath).filter(f => f.endsWith('.yaml'));
    
    let mapInfos = [];
    if (fs.existsSync(path.join(DATA_PATH, 'MapInfos.json'))) {
        mapInfos = JSON.parse(fs.readFileSync(path.join(DATA_PATH, 'MapInfos.json'), 'utf8'));
    }
    
    for (const file of mapFiles) {
        const mapData = yaml.load(fs.readFileSync(path.join(mapsPath, file), 'utf8'));
        const mapId = mapData.id;
        
        // Update MapInfos.json
        while (mapInfos.length <= mapId) {
            mapInfos.push(null);
        }
        
        mapInfos[mapId] = {
            id: mapId,
            name: mapData.name,
            order: mapData.order || mapId,
            parentId: mapData.parentId || 0,
            scrollX: mapData.scrollX || 0,
            scrollY: mapData.scrollY || 0,
            expanded: mapData.expanded || false
        };
        
        // Generate Map data file
        const mapFile = `Map${String(mapId).padStart(3, '0')}.json`;
        fs.writeFileSync(path.join(DATA_PATH, mapFile), JSON.stringify(processMapData(mapData), null, 2));
    }
    
    // Write MapInfos.json
    fs.writeFileSync(path.join(DATA_PATH, 'MapInfos.json'), JSON.stringify(mapInfos, null, 2));
    console.log(`Processed ${mapFiles.length} maps`);
}

// Process map data (simplified example)
function processMapData(mapData) {
    // Transform the user-friendly YAML structure into RPG Maker MZ format
    // This would be much more complex in a real implementation
    return {
        autoplayBgm: mapData.autoplayBgm || false,
        autoplayBgs: mapData.autoplayBgs || false,
        battleback1Name: mapData.battleback1 || "",
        battleback2Name: mapData.battleback2 || "",
        bgm: mapData.bgm || {name: "", pan: 0, pitch: 100, volume: 90},
        bgs: mapData.bgs || {name: "", pan: 0, pitch: 100, volume: 90},
        disableDashing: mapData.disableDashing || false,
        displayName: mapData.displayName || "",
        encounterList: mapData.encounters || [],
        encounterStep: mapData.encounterStep || 30,
        height: mapData.height || 13,
        note: mapData.note || "",
        parallaxLoopX: mapData.parallaxLoopX || false,
        parallaxLoopY: mapData.parallaxLoopY || false,
        parallaxName: mapData.parallax || "",
        parallaxShow: mapData.showParallax || true,
        parallaxSx: mapData.parallaxSx || 0,
        parallaxSy: mapData.parallaxSy || 0,
        scrollType: mapData.scrollType || 0,
        specifyBattleback: mapData.specifyBattleback || false,
        tilesetId: mapData.tilesetId || 1,
        width: mapData.width || 17,
        data: mapData.data || generateEmptyMapData(mapData.width || 17, mapData.height || 13),
        events: processMapEvents(mapData.events || [])
    };
}

// Generate empty map data
function generateEmptyMapData(width, height) {
    // 6 layers of map data (3 tile layers, shadows, regions, events)
    const size = width * height * 6;
    return new Array(size).fill(0);
}

// Process map events
function processMapEvents(events) {
    const result = [null]; // Event index starts at 1
    
    for (const event of events) {
        result.push(processEvent(event));
    }
    
    return result;
}

// Process a single event
function processEvent(event) {
    // Implementation would convert from user-friendly format to RPG Maker MZ format
    // This is simplified
    return {
        id: event.id,
        name: event.name,
        note: event.note || "",
        pages: event.pages || [{
            conditions: {
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
            list: [{code: 0, indent: 0, parameters: []}],
            moveFrequency: 3,
            moveRoute: {
                list: [{code: 0, parameters: []}],
                repeat: true,
                skippable: false,
                wait: false
            },
            moveSpeed: 3,
            moveType: 0,
            priorityType: 0,
            stepAnime: false,
            through: false,
            trigger: 0,
            walkAnime: true
        }],
        x: event.x,
        y: event.y
    };
}

// Process items
function processItems() {
    const itemsPath = path.join(CONTENT_PATH, 'items');
    if (!fs.existsSync(itemsPath)) return;
    
    const itemFiles = fs.readdirSync(itemsPath).filter(f => f.endsWith('.yaml'));
    
    let items = [null]; // Item index starts at 1
    
    for (const file of itemFiles) {
        const itemData = yaml.load(fs.readFileSync(path.join(itemsPath, file), 'utf8'));
        items.push(processItem(itemData));
    }
    
    fs.writeFileSync(path.join(DATA_PATH, 'Items.json'), JSON.stringify(items, null, 2));
    console.log(`Processed ${itemFiles.length} items`);
}

// Process a single item
function processItem(item) {
    // Transform user-friendly format to RPG Maker MZ format
    return {
        id: item.id,
        name: item.name,
        description: item.description || "",
        iconIndex: item.iconIndex || 0,
        price: item.price || 0,
        consumable: item.consumable !== undefined ? item.consumable : true,
        itypeId: item.type || 1,
        effects: item.effects || [],
        damage: item.damage || { critical: false, elementId: 0, formula: "0", type: 0, variance: 20 },
        note: item.note || "",
        occasion: item.occasion || 0,
        repeats: item.repeats || 1,
        scope: item.scope || 7,
        speed: item.speed || 0,
        successRate: item.successRate || 100,
        tpGain: item.tpGain || 0
    };
}

// Main build function
function buildGame() {
    console.log('Building game...');
    
    // Process each content type
    processMaps();
    processItems();
    // Process other content types...
    
    console.log('Build complete!');
}

buildGame();
```

### 4. Quest System Generator

Here's a simple quest generator:

```javascript
// scripts/generators/quests.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONTENT_PATH = path.join(__dirname, '../../content');
const GAME_PATH = path.join(__dirname, '../../game');
const DATA_PATH = path.join(GAME_PATH, 'data');

// Generate quests from definitions
function generateQuests() {
    const questsPath = path.join(CONTENT_PATH, 'quests');
    if (!fs.existsSync(questsPath)) return;
    
    const questFiles = fs.readdirSync(questsPath).filter(f => f.endsWith('.yaml'));
    
    // Process each quest
    for (const file of questFiles) {
        const questData = yaml.load(fs.readFileSync(path.join(questsPath, file), 'utf8'));
        generateQuest(questData);
    }
    
    console.log(`Generated ${questFiles.length} quests`);
}

// Generate a single quest
function generateQuest(quest) {
    // Create common event for quest logic
    createQuestCommonEvent(quest);
    
    // Create quest giver NPC
    if (quest.questGiver) {
        updateMapEvent(quest.questGiver.mapId, quest.questGiver.eventId, createQuestGiverEvent(quest));
    }
    
    // Create quest targets
    if (quest.targets) {
        for (const target of quest.targets) {
            updateMapEvent(target.mapId, target.eventId, createQuestTargetEvent(quest, target));
        }
    }
}

// Create quest common event
function createQuestCommonEvent(quest) {
    // Read CommonEvents.json
    let commonEvents = [null];
    if (fs.existsSync(path.join(DATA_PATH, 'CommonEvents.json'))) {
        commonEvents = JSON.parse(fs.readFileSync(path.join(DATA_PATH, 'CommonEvents.json'), 'utf8'));
    }
    
    // Create common event object
    const commonEvent = {
        id: quest.commonEventId || commonEvents.length,
        name: `Quest: ${quest.title}`,
        trigger: 0,
        switchId: 1,
        list: createQuestLogicCommands(quest)
    };
    
    // Add to common events
    while (commonEvents.length <= commonEvent.id) {
        commonEvents.push(null);
    }
    commonEvents[commonEvent.id] = commonEvent;
    
    // Write CommonEvents.json
    fs.writeFileSync(path.join(DATA_PATH, 'CommonEvents.json'), JSON.stringify(commonEvents, null, 2));
}

// Create commands for quest logic
function createQuestLogicCommands(quest) {
    // Simplistic implementation for example purposes
    const commands = [];
    
    // Add quest logic
    commands.push({ code: 108, indent: 0, parameters: [`==== Quest: ${quest.title} ====`] });
    commands.push({ code: 408, indent: 0, parameters: ["Quest logic would be implemented here"] });
    
    // End of event
    commands.push({ code: 0, indent: 0, parameters: [] });
    
    return commands;
}

// Create quest giver event
function createQuestGiverEvent(quest) {
    // Would create all the event pages for the quest giver
    // Simplified for this example
    return {
        // Event details would go here
    };
}

// Create quest target event
function createQuestTargetEvent(quest, target) {
    // Would create all the event pages for the quest target
    // Simplified for this example
    return {
        // Event details would go here
    };
}

// Update an event on a map
function updateMapEvent(mapId, eventId, eventData) {
    // Read map file
    const mapFile = `Map${String(mapId).padStart(3, '0')}.json`;
    const mapPath = path.join(DATA_PATH, mapFile);
    
    if (!fs.existsSync(mapPath)) {
        console.error(`Map file ${mapFile} does not exist`);
        return;
    }
    
    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    
    // Update event
    if (!mapData.events) {
        mapData.events = [null];
    }
    
    while (mapData.events.length <= eventId) {
        mapData.events.push(null);
    }
    
    // Preserve existing event properties and update with new data
    const existingEvent = mapData.events[eventId] || {};
    mapData.events[eventId] = {...existingEvent, ...eventData};
    
    // Write map file
    fs.writeFileSync(mapPath, JSON.stringify(mapData, null, 2));
}

// Export functions
module.exports = {
    generateQuests
};
```

### 5. Create a Build Pipeline

Set up npm scripts in `package.json`:

```json
{
  "name": "rmmz-game-generator",
  "version": "1.0.0",
  "description": "Automated RPG Maker MZ game generator",
  "scripts": {
    "build": "node scripts/build.js",
    "clean": "node scripts/clean.js",
    "dev": "nodemon --watch content --ext yaml,json,js --exec 'npm run build'",
    "export": "node scripts/export.js",
    "import": "node scripts/import.js",
    "quests": "node scripts/generators/quests.js",
    "maps": "node scripts/generators/maps.js",
    "start": "cd game && nw ."
  },
  "dependencies": {
    "commander": "^8.0.0",
    "js-yaml": "^4.1.0",
    "nodemon": "^2.0.12"
  }
}
```

### 6. Continuous Integration

For team development, set up GitHub Actions:

```yaml
# .github/workflows/build.yml
name: Build Game

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build game
      run: npm run build
      
    - name: Validate output
      run: node scripts/validate.js
      
    - name: Create artifact
      uses: actions/upload-artifact@v2
      with:
        name: game-files
        path: game/
```

## Conclusion and Best Practices

For effective scriptable RPG Maker MZ development:

1. **Use Source Control**: Treat your game as a software project, using Git for version control.

2. **Separate Content from Engine**: Use simplified, human-readable formats like YAML for content that gets compiled to RPG Maker MZ JSON.

3. **Script Everything**: Create automation scripts for repetitive tasks like:
   - Map generation
   - Event creation
   - Database population
   - Batch updates

4. **Build a Content Pipeline**: Treat game development like a compilation process:
   ```
   Source Content (YAML, CSV, etc.) → Processors → RPG Maker MZ Files → Game
   ```

5. **Create Domain-Specific Tools**: Build specialized generators for:
   - Dungeon generation
   - NPC placement
   - Quest systems
   - Dialog trees

6. **Use Node.js**: Leverage the Node.js ecosystem for tools and libraries.

7. **Validate Everything**: Create validation scripts to catch errors before they break your game.

8. **Document Your Process**: Document your automation tools to build institutional knowledge.

By following these approaches, you can create a fully scriptable RPG Maker MZ workflow that enables programmatic game development without using the UI.