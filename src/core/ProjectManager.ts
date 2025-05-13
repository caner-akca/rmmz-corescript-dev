/**
 * ProjectManager for the Agentic RPG Maker MZ Development System
 * 
 * Handles RPG Maker MZ project file operations, including:
 * - Creating and initializing new projects
 * - Loading and saving project data
 * - Managing maps, events, and other game data
 */

import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger';
import { Template } from './TemplateManager';

interface MapData {
  displayName: string;
  height: number;
  width: number;
  data: number[];
  events: any[];
  autoplayBgm: boolean;
  autoplayBgs: boolean;
  battleback1Name: string;
  battleback2Name: string;
  bgm: { name: string; pan: number; pitch: number; volume: number };
  bgs: { name: string; pan: number; pitch: number; volume: number };
  disableDashing: boolean;
  encounterList: any[];
  encounterStep: number;
  parallaxLoopX: boolean;
  parallaxLoopY: boolean;
  parallaxName: string;
  parallaxShow: boolean;
  parallaxSx: number;
  parallaxSy: number;
  scrollType: number;
  specifyBattleback: boolean;
  tilesetId: number;
  [key: string]: any;
}

interface QuestData {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  minLevel: number;
  objectives: any[];
  rewards: any[];
  [key: string]: any;
}

export class ProjectManager {
  private logger: Logger;
  private currentProjectPath: string | null;
  
  constructor() {
    this.logger = new Logger('ProjectManager');
    this.currentProjectPath = null;
  }
  
  /**
   * Initialize a new RPG Maker MZ project
   * @param projectPath Path to create the project
   * @param template Project template to use
   * @param options Additional project options
   */
  async initializeProject(projectPath: string, template: Template, options: any): Promise<void> {
    try {
      this.logger.info(`Initializing project at ${projectPath}`);
      
      // Ensure project directory exists
      await fs.ensureDir(projectPath);
      
      // Create directory structure based on template
      const structure = template.data.structure;
      
      for (const [dir, subdirs] of Object.entries(structure)) {
        const dirPath = path.join(projectPath, dir);
        await fs.ensureDir(dirPath);
        
        // Create subdirectories if any
        if (Array.isArray(subdirs)) {
          for (const subdir of subdirs as string[]) {
            await fs.ensureDir(path.join(dirPath, subdir));
          }
        }
      }
      
      // Create basic project files
      await this.createProjectFiles(projectPath, template, options);
      
      // Set current project path
      this.currentProjectPath = projectPath;
      
      this.logger.info('Project initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize project: ${error}`);
      throw error;
    }
  }
  
  /**
   * Create basic RPG Maker MZ project files
   * @param projectPath Project directory path
   * @param template Project template
   * @param options Project options
   */
  private async createProjectFiles(projectPath: string, template: Template, options: any): Promise<void> {
    try {
      const dataDir = path.join(projectPath, 'data');
      
      // Create package.json for RPG Maker MZ
      const packageJson = {
        name: options.name.toLowerCase().replace(/\s+/g, '-'),
        private: true,
        version: '1.0.0',
        description: options.description || 'RPG Maker MZ Game',
        license: 'UNLICENSED',
        dependencies: {}
      };
      
      await fs.writeFile(
        path.join(projectPath, 'package.json'),
        JSON.stringify(packageJson, null, 2),
        'utf8'
      );
      
      // Create index.html
      const indexHtml = `<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="viewport" content="user-scalable=no">
        <link rel="icon" href="icon/icon.png" type="image/png">
        <link rel="apple-touch-icon" href="icon/icon.png">
        <link rel="stylesheet" type="text/css" href="css/game.css">
        <title>${options.name}</title>
    </head>
    <body>
        <script type="text/javascript" src="js/main.js"></script>
    </body>
</html>`;
      
      await fs.writeFile(path.join(projectPath, 'index.html'), indexHtml, 'utf8');
      
      // Create system.json
      const systemData = {
        ...template.data.system,
        gameTitle: options.name,
        currencyUnit: options.currencyUnit || template.data.system.currencyUnit,
        elements: ['', 'Physical', 'Fire', 'Ice', 'Thunder', 'Water', 'Earth', 'Wind', 'Light', 'Darkness'],
        equipTypes: ['', 'Weapon', 'Shield', 'Head', 'Body', 'Accessory'],
        skillTypes: ['', 'Magic', 'Special'],
        weaponTypes: ['', 'Axe', 'Claw', 'Spear', 'Sword', 'Katana', 'Bow', 'Dagger', 'Hammer', 'Staff', 'Gun'],
        terms: {
          basic: ['Level', 'Lv', 'HP', 'HP', 'MP', 'MP', 'TP', 'TP', 'EXP', 'EXP'],
          commands: ['Fight', 'Escape', 'Attack', 'Guard', 'Item', 'Skill', 'Equip', 'Status', 'Formation', 'Save', 'Game End', 'Options', 'Weapon', 'Armor', 'Key Item', 'Equip', 'Optimize', 'Clear', 'New Game', 'Continue', null, 'To Title', 'Cancel', null, 'Buy', 'Sell'],
          params: ['Max HP', 'Max MP', 'Attack', 'Defense', 'M.Attack', 'M.Defense', 'Agility', 'Luck', 'Hit', 'Evasion'],
          messages: {
            alwaysDash: 'Always Dash',
            commandRemember: 'Command Remember',
            touchUI: 'Touch UI',
            bgmVolume: 'BGM Volume',
            bgsVolume: 'BGS Volume',
            meVolume: 'ME Volume',
            seVolume: 'SE Volume',
            possession: 'Possession',
            expTotal: 'Current %1',
            expNext: 'To Next %1',
            saveMessage: 'Which file would you like to save to?',
            loadMessage: 'Which file would you like to load?',
            file: 'File',
            autosave: 'Autosave',
            partyName: '%1\'s Party',
            emerge: '%1 emerged!',
            preemptive: '%1 got the upper hand!',
            surprise: '%1 was surprised!',
            escapeStart: '%1 has started to escape!',
            escapeFailure: 'However, it was unable to escape!',
            victory: '%1 was victorious!',
            defeat: '%1 was defeated.',
            obtainExp: '%1 %2 received!',
            obtainGold: '%1\\G found!',
            obtainItem: '%1 found!',
            levelUp: '%1 is now %2 %3!',
            obtainSkill: '%1 learned!',
            useItem: '%1 uses %2!',
            criticalToEnemy: 'An excellent hit!!',
            criticalToActor: 'A painful blow!!',
            actorDamage: '%1 took %2 damage!',
            actorRecovery: '%1 recovered %2 %3!',
            actorGain: '%1 gained %2 %3!',
            actorLoss: '%1 lost %2 %3!',
            actorDrain: '%1 was drained of %2 %3!',
            actorNoDamage: '%1 took no damage!',
            actorNoHit: 'Miss! %1 took no damage!',
            enemyDamage: '%1 took %2 damage!',
            enemyRecovery: '%1 recovered %2 %3!',
            enemyGain: '%1 gained %2 %3!',
            enemyLoss: '%1 lost %2 %3!',
            enemyDrain: '%1 was drained of %2 %3!',
            enemyNoDamage: '%1 took no damage!',
            enemyNoHit: 'Miss! %1 took no damage!',
            evasion: '%1 evaded the attack!',
            magicEvasion: '%1 nullified the magic!',
            magicReflection: '%1 reflected the magic!',
            counterAttack: '%1 counterattacked!',
            substitute: '%1 protected %2!',
            buffAdd: '%1\'s %2 went up!',
            debuffAdd: '%1\'s %2 went down!',
            buffRemove: '%1\'s %2 returned to normal!',
            actionFailure: 'There was no effect on %1!'
          }
        }
      };
      
      await fs.writeFile(
        path.join(dataDir, 'System.json'),
        JSON.stringify(systemData, null, 2),
        'utf8'
      );
      
      // Create empty MapInfos.json
      const mapInfos = {};
      await fs.writeFile(
        path.join(dataDir, 'MapInfos.json'),
        JSON.stringify(mapInfos, null, 2),
        'utf8'
      );
      
      // Create empty Actors.json
      const actors = [null];
      await fs.writeFile(
        path.join(dataDir, 'Actors.json'),
        JSON.stringify(actors, null, 2),
        'utf8'
      );
      
      // Create basic CommonEvents.json
      const commonEvents = [null];
      await fs.writeFile(
        path.join(dataDir, 'CommonEvents.json'),
        JSON.stringify(commonEvents, null, 2),
        'utf8'
      );
      
      // Create empty Items.json, Weapons.json, Armors.json
      const items = [null];
      await fs.writeFile(
        path.join(dataDir, 'Items.json'),
        JSON.stringify(items, null, 2),
        'utf8'
      );
      
      await fs.writeFile(
        path.join(dataDir, 'Weapons.json'),
        JSON.stringify(items, null, 2),
        'utf8'
      );
      
      await fs.writeFile(
        path.join(dataDir, 'Armors.json'),
        JSON.stringify(items, null, 2),
        'utf8'
      );
      
      // Create a basic Map001.json
      await this.createEmptyMap(projectPath, 1, 'New Map', 20, 15);
      
      // Update MapInfos.json with the new map
      const updatedMapInfos = {
        "1": {
          "id": 1,
          "expanded": false,
          "name": "New Map",
          "order": 1,
          "parentId": 0,
          "scrollX": 400,
          "scrollY": 300
        }
      };
      
      await fs.writeFile(
        path.join(dataDir, 'MapInfos.json'),
        JSON.stringify(updatedMapInfos, null, 2),
        'utf8'
      );
      
      // Create custom quest data file
      const questsData = {
        quests: [],
        questRegistry: {}
      };
      
      await fs.writeFile(
        path.join(dataDir, 'Quests.json'),
        JSON.stringify(questsData, null, 2),
        'utf8'
      );
      
      this.logger.info('Project files created successfully');
    } catch (error) {
      this.logger.error(`Failed to create project files: ${error}`);
      throw error;
    }
  }
  
  /**
   * Create an empty map file
   * @param projectPath Project directory path
   * @param mapId Map ID
   * @param displayName Display name of the map
   * @param width Map width
   * @param height Map height
   */
  private async createEmptyMap(
    projectPath: string, 
    mapId: number, 
    displayName: string,
    width: number,
    height: number
  ): Promise<void> {
    try {
      const mapData: MapData = {
        autoplayBgm: false,
        autoplayBgs: false,
        battleback1Name: '',
        battleback2Name: '',
        bgm: { name: '', pan: 0, pitch: 100, volume: 90 },
        bgs: { name: '', pan: 0, pitch: 100, volume: 90 },
        disableDashing: false,
        displayName,
        encounterList: [],
        encounterStep: 30,
        height,
        width,
        parallaxLoopX: false,
        parallaxLoopY: false,
        parallaxName: '',
        parallaxShow: true,
        parallaxSx: 0,
        parallaxSy: 0,
        scrollType: 0,
        specifyBattleback: false,
        tilesetId: 1,
        data: [],
        events: []
      };
      
      // Initialize map data array
      // First width * height * 6 elements are for map tiles
      // The number 6 represents the number of map layers in RPG Maker MZ
      const tileDataLength = width * height * 6;
      mapData.data = new Array(tileDataLength).fill(0);
      
      // Initialize with some basic floor tiles for visualization
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Set the base layer (index 0) to a basic floor tile (tile ID 2816)
          // In RPG Maker MZ, tile IDs start at 0, and 2816 is typically a basic floor tile
          const index = y * width + x;
          mapData.data[index] = 2816;
        }
      }
      
      // Save the map file
      const mapFilePath = path.join(projectPath, 'data', `Map${mapId.toString().padStart(3, '0')}.json`);
      await fs.writeFile(mapFilePath, JSON.stringify(mapData, null, 2), 'utf8');
      
      this.logger.info(`Created empty map: ${mapFilePath}`);
    } catch (error) {
      this.logger.error(`Failed to create empty map: ${error}`);
      throw error;
    }
  }
  
  /**
   * Load a map from the current project
   * @param mapId Map ID or file path
   */
  async loadMap(mapId: string | number): Promise<MapData> {
    try {
      if (!this.currentProjectPath) {
        throw new Error('No project is currently loaded');
      }
      
      let mapFilePath: string;
      
      if (typeof mapId === 'string' && mapId.endsWith('.json')) {
        // If mapId is a file path
        mapFilePath = path.resolve(this.currentProjectPath, 'data', mapId);
      } else {
        // If mapId is a number or numeric string
        const mapIdNum = typeof mapId === 'string' ? parseInt(mapId, 10) : mapId;
        mapFilePath = path.join(
          this.currentProjectPath,
          'data',
          `Map${mapIdNum.toString().padStart(3, '0')}.json`
        );
      }
      
      if (!fs.existsSync(mapFilePath)) {
        throw new Error(`Map file not found: ${mapFilePath}`);
      }
      
      const mapData = await fs.readFile(mapFilePath, 'utf8');
      return JSON.parse(mapData) as MapData;
    } catch (error) {
      this.logger.error(`Failed to load map: ${error}`);
      throw error;
    }
  }
  
  /**
   * Save a map to the current project
   * @param mapData Map data
   * @param mapIdOrPath Map ID or file path
   */
  async saveMap(mapData: MapData, mapIdOrPath: string | number): Promise<void> {
    try {
      if (!this.currentProjectPath) {
        throw new Error('No project is currently loaded');
      }
      
      let mapFilePath: string;
      
      if (typeof mapIdOrPath === 'string' && mapIdOrPath.endsWith('.json')) {
        // If mapIdOrPath is a file path
        mapFilePath = path.resolve(this.currentProjectPath, 'data', mapIdOrPath);
      } else {
        // If mapIdOrPath is a number or numeric string
        const mapId = typeof mapIdOrPath === 'string' ? parseInt(mapIdOrPath, 10) : mapIdOrPath;
        mapFilePath = path.join(
          this.currentProjectPath,
          'data',
          `Map${mapId.toString().padStart(3, '0')}.json`
        );
      }
      
      await fs.writeFile(mapFilePath, JSON.stringify(mapData, null, 2), 'utf8');
      
      // Update MapInfos.json if necessary
      if (typeof mapIdOrPath === 'number' || (typeof mapIdOrPath === 'string' && !mapIdOrPath.endsWith('.json'))) {
        await this.updateMapInfos(mapData, mapIdOrPath);
      }
      
      this.logger.info(`Map saved successfully: ${mapFilePath}`);
    } catch (error) {
      this.logger.error(`Failed to save map: ${error}`);
      throw error;
    }
  }
  
  /**
   * Update MapInfos.json with new map information
   * @param mapData Map data
   * @param mapId Map ID
   */
  private async updateMapInfos(mapData: MapData, mapId: string | number): Promise<void> {
    try {
      if (!this.currentProjectPath) {
        throw new Error('No project is currently loaded');
      }
      
      const mapIdNum = typeof mapId === 'string' ? parseInt(mapId, 10) : mapId;
      const mapInfosPath = path.join(this.currentProjectPath, 'data', 'MapInfos.json');
      
      let mapInfos: Record<string, any> = {};
      
      if (fs.existsSync(mapInfosPath)) {
        const data = await fs.readFile(mapInfosPath, 'utf8');
        mapInfos = JSON.parse(data);
      }
      
      // Update or add map info
      mapInfos[mapIdNum] = {
        id: mapIdNum,
        expanded: mapInfos[mapIdNum]?.expanded || false,
        name: mapData.displayName,
        order: mapInfos[mapIdNum]?.order || Object.keys(mapInfos).length + 1,
        parentId: mapInfos[mapIdNum]?.parentId || 0,
        scrollX: 400,
        scrollY: 300
      };
      
      await fs.writeFile(mapInfosPath, JSON.stringify(mapInfos, null, 2), 'utf8');
      
      this.logger.info(`MapInfos.json updated for map ${mapIdNum}`);
    } catch (error) {
      this.logger.error(`Failed to update MapInfos.json: ${error}`);
      throw error;
    }
  }
  
  /**
   * Save a quest to the current project
   * @param quest Quest data
   */
  async saveQuest(quest: QuestData): Promise<void> {
    try {
      if (!this.currentProjectPath) {
        throw new Error('No project is currently loaded');
      }
      
      const questsPath = path.join(this.currentProjectPath, 'data', 'Quests.json');
      
      let questsData: { quests: QuestData[]; questRegistry: Record<string, any> } = {
        quests: [],
        questRegistry: {}
      };
      
      if (fs.existsSync(questsPath)) {
        const data = await fs.readFile(questsPath, 'utf8');
        questsData = JSON.parse(data);
      }
      
      // Check if quest already exists
      const existingQuestIndex = questsData.quests.findIndex(q => q.id === quest.id);
      
      if (existingQuestIndex >= 0) {
        // Update existing quest
        questsData.quests[existingQuestIndex] = quest;
      } else {
        // Add new quest
        questsData.quests.push(quest);
      }
      
      // Update quest registry
      questsData.questRegistry[quest.id] = {
        title: quest.title,
        type: quest.type,
        difficulty: quest.difficulty
      };
      
      await fs.writeFile(questsPath, JSON.stringify(questsData, null, 2), 'utf8');
      
      this.logger.info(`Quest saved successfully: ${quest.id}`);
    } catch (error) {
      this.logger.error(`Failed to save quest: ${error}`);
      throw error;
    }
  }
  
  /**
   * Load a project
   * @param projectPath Path to the project
   */
  async loadProject(projectPath: string): Promise<void> {
    try {
      // Verify that this is an RPG Maker MZ project
      const dataDir = path.join(projectPath, 'data');
      const systemPath = path.join(dataDir, 'System.json');
      
      if (!fs.existsSync(dataDir) || !fs.existsSync(systemPath)) {
        throw new Error('Not a valid RPG Maker MZ project');
      }
      
      this.currentProjectPath = projectPath;
      this.logger.info(`Project loaded: ${projectPath}`);
    } catch (error) {
      this.logger.error(`Failed to load project: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get the current project path
   */
  getCurrentProjectPath(): string | null {
    return this.currentProjectPath;
  }
}
