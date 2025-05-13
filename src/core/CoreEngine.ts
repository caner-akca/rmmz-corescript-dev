/**
 * Core Engine for the Agentic RPG Maker MZ Development System
 * 
 * This class serves as the central orchestration system that manages
 * the workflow and coordinates between all generators and components.
 */

import path from 'path';
import fs from 'fs-extra';
import { Logger } from '../utils/logger';
import { ConfigManager } from './ConfigManager';
import { TemplateManager } from './TemplateManager';
import { ProjectManager } from './ProjectManager';

// Import generators
import { MapGeneratorFactory } from '../generators/maps/MapGeneratorFactory';
import { EventGenerator } from '../generators/events/EventGenerator';
import { QuestGenerator } from '../generators/quests/QuestGenerator';
import { StoryGenerator } from '../generators/story/StoryGenerator';

export class CoreEngine {
  private logger: Logger;
  private configManager: ConfigManager;
  private templateManager: TemplateManager;
  private projectManager: ProjectManager;
  private mapGeneratorFactory: MapGeneratorFactory;
  private eventGenerator: EventGenerator;
  private questGenerator: QuestGenerator;
  private storyGenerator: StoryGenerator;

  constructor() {
    this.logger = new Logger('CoreEngine');
    this.configManager = new ConfigManager();
    this.templateManager = new TemplateManager();
    this.projectManager = new ProjectManager();
    this.mapGeneratorFactory = new MapGeneratorFactory();
    this.eventGenerator = new EventGenerator();
    this.questGenerator = new QuestGenerator();
    this.storyGenerator = new StoryGenerator();

    this.logger.info('Core Engine initialized');
  }

  /**
   * Create a new RPG Maker MZ project
   * @param options Project creation options
   */
  async createProject(options: any): Promise<void> {
    this.logger.info(`Creating new project: ${options.name}`);
    
    try {
      // Load project template
      const template = await this.templateManager.getProjectTemplate(options.template);
      
      // Create project directory
      const projectPath = path.resolve(options.output, options.name);
      await fs.ensureDir(projectPath);
      
      // Initialize project structure
      await this.projectManager.initializeProject(projectPath, template, options);
      
      this.logger.info(`Project created at: ${projectPath}`);
      return Promise.resolve();
    } catch (error) {
      this.logger.error(`Failed to create project: ${error}`);
      return Promise.reject(error);
    }
  }

  /**
   * Generate a map based on the provided options
   * @param options Map generation options
   */
  async generateMap(options: any): Promise<void> {
    this.logger.info(`Generating ${options.type} map`);
    
    try {
      // Get the appropriate map generator
      const mapGenerator = this.mapGeneratorFactory.getGenerator(options.type);
      
      // Generate the map
      const map = await mapGenerator.generate({
        size: options.size,
        difficulty: options.difficulty,
        theme: options.theme
      });
      
      // Save the map to file
      await this.projectManager.saveMap(map, options.output);
      
      this.logger.info(`Map generated successfully`);
      return Promise.resolve();
    } catch (error) {
      this.logger.error(`Failed to generate map: ${error}`);
      return Promise.reject(error);
    }
  }

  /**
   * Generate events for a map
   * @param options Event generation options
   */
  async generateEvents(options: any): Promise<void> {
    this.logger.info(`Generating events for map ${options.map}`);
    
    try {
      // Load the map
      const map = await this.projectManager.loadMap(options.map);
      
      // Generate events
      const events = await this.eventGenerator.generateForMap(map, {
        type: options.type,
        density: options.density
      });
      
      // Add events to the map
      map.events = events;
      
      // Save the updated map
      await this.projectManager.saveMap(map, options.map);
      
      this.logger.info(`Events generated successfully`);
      return Promise.resolve();
    } catch (error) {
      this.logger.error(`Failed to generate events: ${error}`);
      return Promise.reject(error);
    }
  }

  /**
   * Generate a quest based on the provided options
   * @param options Quest generation options
   */
  async generateQuest(options: any): Promise<void> {
    this.logger.info(`Generating ${options.type} quest`);
    
    try {
      // Generate the quest
      const quest = await this.questGenerator.generate({
        type: options.type,
        difficulty: options.difficulty,
        minLevel: parseInt(options.level, 10)
      });
      
      // Save the quest
      await this.projectManager.saveQuest(quest);
      
      this.logger.info(`Quest generated successfully`);
      return Promise.resolve();
    } catch (error) {
      this.logger.error(`Failed to generate quest: ${error}`);
      return Promise.reject(error);
    }
  }

  /**
   * Generate a complete world with maps, events, quests, and story
   * @param options World generation options
   */
  async generateWorld(options: any): Promise<void> {
    this.logger.info(`Generating ${options.size} ${options.theme} world`);
    
    try {
      // Generate world structure
      const worldStructure = await this.storyGenerator.generateWorldStructure({
        size: options.size,
        theme: options.theme,
        regions: parseInt(options.regions, 10)
      });
      
      // Generate maps for each region
      for (const region of worldStructure.regions) {
        await this.generateRegion(region);
      }
      
      // Generate main quest line
      await this.questGenerator.generateQuestChain({
        length: 5,
        type: 'main',
        worldStructure
      });
      
      // Generate side quests
      const sideQuestCount = worldStructure.regions.length * 2;
      await this.questGenerator.generateSideQuests(sideQuestCount, worldStructure);
      
      this.logger.info(`World generated successfully`);
      return Promise.resolve();
    } catch (error) {
      this.logger.error(`Failed to generate world: ${error}`);
      return Promise.reject(error);
    }
  }

  /**
   * Generate a region within the world
   * @param region Region data
   */
  private async generateRegion(region: any): Promise<void> {
    this.logger.info(`Generating region: ${region.name}`);
    
    try {
      // Generate the main map for the region
      const mainMap = await this.mapGeneratorFactory.getGenerator(region.type).generate({
        size: region.size,
        difficulty: region.difficulty,
        theme: region.theme
      });
      
      // Save the main map
      await this.projectManager.saveMap(mainMap, `Map${region.id.toString().padStart(3, '0')}.json`);
      
      // Generate events for the main map
      await this.generateEvents({
        map: region.id,
        type: 'all',
        density: 'normal'
      });
      
      // Generate sub-maps if needed
      if (region.subMaps && region.subMaps.length > 0) {
        for (const subMap of region.subMaps) {
          await this.generateMap({
            type: subMap.type,
            size: subMap.size,
            difficulty: subMap.difficulty,
            theme: subMap.theme,
            output: `Map${subMap.id.toString().padStart(3, '0')}.json`
          });
          
          // Generate events for the sub-map
          await this.generateEvents({
            map: subMap.id,
            type: 'all',
            density: subMap.density || 'normal'
          });
        }
      }
      
      this.logger.info(`Region generated successfully`);
      return Promise.resolve();
    } catch (error) {
      this.logger.error(`Failed to generate region: ${error}`);
      return Promise.reject(error);
    }
  }
}
