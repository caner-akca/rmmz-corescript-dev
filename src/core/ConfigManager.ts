/**
 * ConfigManager for the Agentic RPG Maker MZ Development System
 * 
 * Handles loading, saving, and accessing configuration settings
 * throughout the application.
 */

import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger';

export class ConfigManager {
  private logger: Logger;
  private config: Record<string, any>;
  private configPath: string;
  
  constructor() {
    this.logger = new Logger('ConfigManager');
    this.config = {};
    this.configPath = path.resolve(process.cwd(), 'config.json');
    
    // Load configuration
    this.loadConfig();
  }
  
  /**
   * Load configuration from file
   */
  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
        this.logger.info('Configuration loaded successfully');
      } else {
        // Create default configuration
        this.config = this.getDefaultConfig();
        this.saveConfig();
        this.logger.info('Default configuration created');
      }
    } catch (error) {
      this.logger.error(`Failed to load configuration: ${error}`);
      this.config = this.getDefaultConfig();
    }
  }
  
  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      this.logger.info('Configuration saved successfully');
    } catch (error) {
      this.logger.error(`Failed to save configuration: ${error}`);
    }
  }
  
  /**
   * Get default configuration
   */
  private getDefaultConfig(): Record<string, any> {
    return {
      version: '0.1.0',
      projectDefaults: {
        outputPath: './output',
        template: 'default'
      },
      mapGeneration: {
        defaultSize: 'medium',
        defaultDifficulty: 'medium',
        defaultTheme: 'fantasy',
        tileSets: {
          fantasy: 1,
          sci_fi: 2,
          modern: 3,
          historical: 4
        }
      },
      eventGeneration: {
        defaultDensity: 'normal',
        densitySettings: {
          sparse: 0.3,
          normal: 0.6,
          dense: 0.9
        }
      },
      questGeneration: {
        defaultType: 'fetch',
        defaultDifficulty: 'medium',
        rewardScaling: {
          easy: 0.7,
          medium: 1.0,
          hard: 1.5
        }
      },
      storyGeneration: {
        defaultTheme: 'classic_hero',
        defaultLength: 'medium',
        themeSettings: {
          classic_hero: {
            archetypes: ['hero', 'mentor', 'villain', 'ally'],
            plotPoints: ['call_to_adventure', 'trials', 'abyss', 'transformation', 'atonement', 'return']
          },
          tragedy: {
            archetypes: ['tragic_hero', 'temptation', 'foil', 'authority'],
            plotPoints: ['hubris', 'nemesis', 'anagnorisis', 'peripeteia', 'catharsis']
          },
          mystery: {
            archetypes: ['detective', 'victim', 'suspect', 'witness'],
            plotPoints: ['crime', 'investigation', 'red_herrings', 'twist', 'revelation']
          }
        }
      }
    };
  }
  
  /**
   * Get a configuration value
   * @param key Configuration key (supports dot notation)
   * @param defaultValue Default value if key not found
   */
  get<T>(key: string, defaultValue?: T): T {
    try {
      const keys = key.split('.');
      let value = this.config;
      
      for (const k of keys) {
        if (value[k] === undefined) {
          return defaultValue as T;
        }
        value = value[k];
      }
      
      return value as T;
    } catch (error) {
      this.logger.error(`Failed to get configuration value for key ${key}: ${error}`);
      return defaultValue as T;
    }
  }
  
  /**
   * Set a configuration value
   * @param key Configuration key (supports dot notation)
   * @param value Value to set
   */
  set<T>(key: string, value: T): void {
    try {
      const keys = key.split('.');
      let config = this.config;
      
      // Navigate to the right depth
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (config[k] === undefined) {
          config[k] = {};
        }
        config = config[k];
      }
      
      // Set the value
      config[keys[keys.length - 1]] = value;
      
      // Save the updated configuration
      this.saveConfig();
    } catch (error) {
      this.logger.error(`Failed to set configuration value for key ${key}: ${error}`);
    }
  }
  
  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    this.logger.info('Configuration reset to defaults');
  }
}
