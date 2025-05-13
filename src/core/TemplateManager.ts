/**
 * TemplateManager for the Agentic RPG Maker MZ Development System
 * 
 * Manages loading, storing, and retrieving templates for maps, events,
 * quests, stories, and project structures.
 */

import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger';

export interface Template {
  id: string;
  type: string;
  name: string;
  description: string;
  data: any;
}

export class TemplateManager {
  private logger: Logger;
  private templates: Map<string, Template>;
  private templateDirectories: {
    base: string;
    projects: string;
    maps: string;
    events: string;
    quests: string;
    story: string;
  };
  
  constructor() {
    this.logger = new Logger('TemplateManager');
    this.templates = new Map<string, Template>();
    
    // Set template directories
    const baseDir = path.resolve(process.cwd(), 'templates');
    this.templateDirectories = {
      base: baseDir,
      projects: path.join(baseDir, 'projects'),
      maps: path.join(baseDir, 'maps'),
      events: path.join(baseDir, 'events'),
      quests: path.join(baseDir, 'quests'),
      story: path.join(baseDir, 'story')
    };
    
    // Ensure template directories exist
    this.ensureTemplateDirectories();
    
    // Load all templates
    this.loadAllTemplates();
  }
  
  /**
   * Ensure all template directories exist
   */
  private async ensureTemplateDirectories(): Promise<void> {
    try {
      for (const dir of Object.values(this.templateDirectories)) {
        await fs.ensureDir(dir);
      }
      this.logger.info('Template directories created');
    } catch (error) {
      this.logger.error(`Failed to create template directories: ${error}`);
      throw error;
    }
  }
  
  /**
   * Load all templates from all directories
   */
  private async loadAllTemplates(): Promise<void> {
    try {
      // Clear existing templates
      this.templates.clear();
      
      // Load templates from each category
      await this.loadTemplatesFromDirectory(this.templateDirectories.projects, 'project');
      await this.loadTemplatesFromDirectory(this.templateDirectories.maps, 'map');
      await this.loadTemplatesFromDirectory(this.templateDirectories.events, 'event');
      await this.loadTemplatesFromDirectory(this.templateDirectories.quests, 'quest');
      await this.loadTemplatesFromDirectory(this.templateDirectories.story, 'story');
      
      // Create default templates if none exist
      await this.createDefaultTemplates();
      
      this.logger.info(`Loaded ${this.templates.size} templates`);
    } catch (error) {
      this.logger.error(`Failed to load templates: ${error}`);
      // Create defaults in case of failure
      await this.createDefaultTemplates();
    }
  }
  
  /**
   * Load templates from a specific directory
   * @param directory Directory to load templates from
   * @param type Template type
   */
  private async loadTemplatesFromDirectory(directory: string, type: string): Promise<void> {
    try {
      if (!fs.existsSync(directory)) {
        await fs.ensureDir(directory);
        return;
      }
      
      const files = await fs.readdir(directory);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(directory, file);
          const data = await fs.readFile(filePath, 'utf8');
          const template = JSON.parse(data) as Template;
          
          // Ensure template has required fields
          if (!template.id || !template.name) {
            this.logger.warn(`Template in ${file} missing required fields, skipping`);
            continue;
          }
          
          // Add type if not present
          template.type = template.type || type;
          
          // Store template
          this.templates.set(`${type}:${template.id}`, template);
          this.logger.debug(`Loaded template: ${type}:${template.id}`);
        } catch (error) {
          this.logger.error(`Failed to load template from ${file}: ${error}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to load templates from ${directory}: ${error}`);
    }
  }
  
  /**
   * Create default templates if they don't exist
   */
  private async createDefaultTemplates(): Promise<void> {
    try {
      // Check if we have a default project template
      if (!this.templates.has('project:default')) {
        const defaultProjectTemplate: Template = {
          id: 'default',
          type: 'project',
          name: 'Default Project',
          description: 'Basic RPG Maker MZ project structure',
          data: {
            structure: {
              audio: ['bgm', 'bgs', 'me', 'se'],
              data: [],
              fonts: [],
              icon: [],
              img: ['characters', 'faces', 'parallaxes', 'pictures', 'sv_actors', 'sv_enemies', 'system', 'tilesets', 'titles1', 'titles2'],
              js: ['libs', 'plugins'],
              movies: []
            },
            system: {
              gameTitle: 'New RPG Game',
              currencyUnit: 'G',
              winWidth: 816,
              winHeight: 624,
              hasEncryptedImages: false,
              hasEncryptedAudio: false,
              titleCommandWindow: {
                background: 0,
                offsetX: 0,
                offsetY: 0
              }
            }
          }
        };
        
        // Save default project template
        await this.saveTemplate(defaultProjectTemplate);
      }
      
      // Create default map templates
      if (!this.templates.has('map:dungeon_default')) {
        const defaultDungeonTemplate: Template = {
          id: 'dungeon_default',
          type: 'map',
          name: 'Default Dungeon',
          description: 'Basic dungeon map template',
          data: {
            type: 'dungeon',
            width: 50,
            height: 50,
            tilesetId: 1,
            scrollType: 0,
            encounterStep: 30,
            tileset: 'dungeon',
            bgm: { name: 'Dungeon', pan: 0, pitch: 100, volume: 90 },
            autoTileRules: {
              floor: [0, 1, 2, 3],
              wall: [4, 5, 6, 7, 8, 9, 10, 11],
              decoration: [12, 13, 14, 15]
            },
            roomSettings: {
              minSize: 3,
              maxSize: 8,
              minRooms: 5,
              maxRooms: 10
            }
          }
        };
        
        await this.saveTemplate(defaultDungeonTemplate);
      }
      
      // Create default event template
      if (!this.templates.has('event:npc_basic')) {
        const defaultNpcTemplate: Template = {
          id: 'npc_basic',
          type: 'event',
          name: 'Basic NPC',
          description: 'Generic NPC with dialog',
          data: {
            type: 'npc',
            appearance: {
              characterName: 'Actor1',
              characterIndex: 0,
              direction: 2,
              pattern: 1
            },
            moveType: 0,
            moveSpeed: 3,
            moveFrequency: 3,
            walkAnime: true,
            stepAnime: false,
            directionFix: false,
            through: false,
            priority: 1,
            trigger: 0,
            dialogTemplate: {
              text: ['Hello! I am an NPC.'],
              choices: []
            }
          }
        };
        
        await this.saveTemplate(defaultNpcTemplate);
      }
      
      // Create default quest template
      if (!this.templates.has('quest:fetch_default')) {
        const defaultQuestTemplate: Template = {
          id: 'fetch_default',
          type: 'quest',
          name: 'Fetch Quest',
          description: 'Basic item fetch quest',
          data: {
            type: 'fetch',
            title: 'Fetch {item}',
            description: '{npc} needs you to collect {count} {item}(s).',
            difficulty: 'medium',
            minLevel: 1,
            objectives: [
              {
                type: 'collect',
                description: 'Collect {count} {item}(s)',
                data: {
                  itemId: 1,
                  itemName: '{item}',
                  count: '{count}'
                }
              },
              {
                type: 'talk',
                description: 'Return to {npc}',
                data: {
                  npcId: '{npcId}',
                  npcName: '{npc}'
                }
              }
            ],
            rewards: [
              {
                type: 'gold',
                description: '{gold} gold',
                data: {
                  amount: '{gold}'
                }
              },
              {
                type: 'exp',
                description: '{exp} experience',
                data: {
                  amount: '{exp}'
                }
              }
            ]
          }
        };
        
        await this.saveTemplate(defaultQuestTemplate);
      }
      
      // Create default story template
      if (!this.templates.has('story:hero_journey')) {
        const defaultStoryTemplate: Template = {
          id: 'hero_journey',
          type: 'story',
          name: 'Hero\'s Journey',
          description: 'Classic hero\'s journey story structure',
          data: {
            theme: 'classic_hero',
            archetypes: [
              {
                role: 'hero',
                description: 'The protagonist who goes on the adventure',
                traits: ['brave', 'determined', 'growth']
              },
              {
                role: 'mentor',
                description: 'Wise figure who guides the hero',
                traits: ['wise', 'experienced', 'mysterious']
              },
              {
                role: 'villain',
                description: 'Main antagonist opposing the hero',
                traits: ['powerful', 'threatening', 'ambitious']
              },
              {
                role: 'ally',
                description: 'Friend or companion who helps the hero',
                traits: ['loyal', 'skilled', 'supportive']
              }
            ],
            plotStructure: [
              {
                stage: 'ordinary_world',
                description: 'The hero\'s normal life before the adventure',
                requiredElements: ['hometown', 'daily_life', 'inciting_incident']
              },
              {
                stage: 'call_to_adventure',
                description: 'The hero is presented with a challenge or quest',
                requiredElements: ['quest_giver', 'motivation', 'stakes']
              },
              {
                stage: 'refusal',
                description: 'Initial hesitation or refusal of the call',
                requiredElements: ['doubt', 'fear', 'complication']
              },
              {
                stage: 'meeting_the_mentor',
                description: 'The hero gains guidance from a mentor figure',
                requiredElements: ['mentor_character', 'wisdom', 'gift']
              },
              {
                stage: 'crossing_the_threshold',
                description: 'The hero leaves the ordinary world for the adventure',
                requiredElements: ['boundary_crossing', 'new_territory', 'commitment']
              },
              {
                stage: 'tests_allies_enemies',
                description: 'The hero faces challenges and makes allies and enemies',
                requiredElements: ['first_challenge', 'ally_meeting', 'enemy_encounter']
              },
              {
                stage: 'approach',
                description: 'Preparation for the major challenge',
                requiredElements: ['planning', 'training', 'gathering_resources']
              },
              {
                stage: 'ordeal',
                description: 'The central life-or-death crisis',
                requiredElements: ['major_conflict', 'darkest_moment', 'transformation']
              },
              {
                stage: 'reward',
                description: 'The hero seizes the reward of the quest',
                requiredElements: ['treasure', 'achievement', 'celebration']
              },
              {
                stage: 'road_back',
                description: 'The hero begins the journey back to ordinary life',
                requiredElements: ['return_journey', 'pursuit', 'consequences']
              },
              {
                stage: 'resurrection',
                description: 'Final test where the hero must use all they\'ve learned',
                requiredElements: ['final_battle', 'sacrifice', 'rebirth']
              },
              {
                stage: 'return',
                description: 'The hero returns transformed with the power to help others',
                requiredElements: ['homecoming', 'mastery', 'new_life']
              }
            ]
          }
        };
        
        await this.saveTemplate(defaultStoryTemplate);
      }
      
      this.logger.info('Default templates created');
    } catch (error) {
      this.logger.error(`Failed to create default templates: ${error}`);
    }
  }
  
  /**
   * Save a template to its appropriate directory
   * @param template Template to save
   */
  async saveTemplate(template: Template): Promise<void> {
    try {
      // Determine directory based on type
      let directory: string;
      switch (template.type) {
        case 'project':
          directory = this.templateDirectories.projects;
          break;
        case 'map':
          directory = this.templateDirectories.maps;
          break;
        case 'event':
          directory = this.templateDirectories.events;
          break;
        case 'quest':
          directory = this.templateDirectories.quests;
          break;
        case 'story':
          directory = this.templateDirectories.story;
          break;
        default:
          throw new Error(`Unknown template type: ${template.type}`);
      }
      
      // Ensure directory exists
      await fs.ensureDir(directory);
      
      // Save template to file
      const filePath = path.join(directory, `${template.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');
      
      // Add to in-memory cache
      this.templates.set(`${template.type}:${template.id}`, template);
      
      this.logger.info(`Template saved: ${template.type}:${template.id}`);
    } catch (error) {
      this.logger.error(`Failed to save template: ${error}`);
      throw error;
    }
  }
  
  /**
   * Get a project template by ID
   * @param templateId Template ID
   */
  async getProjectTemplate(templateId: string): Promise<Template> {
    return this.getTemplate('project', templateId);
  }
  
  /**
   * Get a map template by ID
   * @param templateId Template ID
   */
  async getMapTemplate(templateId: string): Promise<Template> {
    return this.getTemplate('map', templateId);
  }
  
  /**
   * Get an event template by ID
   * @param templateId Template ID
   */
  async getEventTemplate(templateId: string): Promise<Template> {
    return this.getTemplate('event', templateId);
  }
  
  /**
   * Get a quest template by ID
   * @param templateId Template ID
   */
  async getQuestTemplate(templateId: string): Promise<Template> {
    return this.getTemplate('quest', templateId);
  }
  
  /**
   * Get a story template by ID
   * @param templateId Template ID
   */
  async getStoryTemplate(templateId: string): Promise<Template> {
    return this.getTemplate('story', templateId);
  }
  
  /**
   * Get a template by type and ID
   * @param type Template type
   * @param templateId Template ID
   */
  private async getTemplate(type: string, templateId: string): Promise<Template> {
    const key = `${type}:${templateId}`;
    
    // Check if template is already loaded
    if (this.templates.has(key)) {
      return this.templates.get(key)!;
    }
    
    // Try to load the template
    try {
      let directory: string;
      switch (type) {
        case 'project':
          directory = this.templateDirectories.projects;
          break;
        case 'map':
          directory = this.templateDirectories.maps;
          break;
        case 'event':
          directory = this.templateDirectories.events;
          break;
        case 'quest':
          directory = this.templateDirectories.quests;
          break;
        case 'story':
          directory = this.templateDirectories.story;
          break;
        default:
          throw new Error(`Unknown template type: ${type}`);
      }
      
      const filePath = path.join(directory, `${templateId}.json`);
      
      if (!fs.existsSync(filePath)) {
        // If template doesn't exist and it's a 'default' template, create it
        if (templateId === 'default') {
          await this.createDefaultTemplates();
          if (this.templates.has(key)) {
            return this.templates.get(key)!;
          }
        }
        
        throw new Error(`Template not found: ${key}`);
      }
      
      const data = await fs.readFile(filePath, 'utf8');
      const template = JSON.parse(data) as Template;
      
      // Store template
      this.templates.set(key, template);
      
      return template;
    } catch (error) {
      this.logger.error(`Failed to get template ${key}: ${error}`);
      throw new Error(`Template not found: ${key}`);
    }
  }
  
  /**
   * Get all templates of a specific type
   * @param type Template type
   */
  getAllTemplatesByType(type: string): Template[] {
    const templates: Template[] = [];
    
    for (const [key, template] of this.templates.entries()) {
      if (key.startsWith(`${type}:`)) {
        templates.push(template);
      }
    }
    
    return templates;
  }
}
