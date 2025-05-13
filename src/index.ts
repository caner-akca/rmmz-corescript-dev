#!/usr/bin/env node

/**
 * Agentic RPG Maker MZ Development System
 * Main entry point for the application
 */

import { Command } from 'commander';
import { version } from '../package.json';
import { setupLogger } from './utils/logger';
import { CoreEngine } from './core/CoreEngine';

// Initialize logger
setupLogger();

// Set up command line interface
const program = new Command();

program
  .name('rmmz-agentic')
  .description('Agentic RPG Maker MZ Development System')
  .version(version);

// Initialize core engine
const coreEngine = new CoreEngine();

// Create new project command
program
  .command('new')
  .description('Create a new RPG Maker MZ project')
  .option('-n, --name <name>', 'Project name')
  .option('-t, --template <template>', 'Project template', 'default')
  .option('-o, --output <path>', 'Output directory', './output')
  .action(async (options) => {
    try {
      await coreEngine.createProject(options);
      console.log(`Project ${options.name} created successfully!`);
    } catch (error: any) {
      console.error(`Error creating project: ${error.message}`);
      process.exit(1);
    }
  });

// Generate map command
program
  .command('generate-map')
  .description('Generate a map')
  .option('-t, --type <type>', 'Map type (dungeon, cave, town)', 'dungeon')
  .option('-s, --size <size>', 'Map size (small, medium, large)', 'medium')
  .option('-d, --difficulty <difficulty>', 'Map difficulty (easy, medium, hard)', 'medium')
  .option('-th, --theme <theme>', 'Map theme', 'default')
  .option('-o, --output <path>', 'Output file', 'Map001.json')
  .action(async (options) => {
    try {
      await coreEngine.generateMap(options);
      console.log(`Map generated successfully: ${options.output}`);
    } catch (error: any) {
      console.error(`Error generating map: ${error.message}`);
      process.exit(1);
    }
  });

// Generate events command
program
  .command('generate-events')
  .description('Generate events for a map')
  .option('-m, --map <id>', 'Map ID', '1')
  .option('-t, --type <type>', 'Event type', 'all')
  .option('-d, --density <density>', 'Event density (sparse, normal, dense)', 'normal')
  .action(async (options) => {
    try {
      await coreEngine.generateEvents(options);
      console.log(`Events generated successfully for map ${options.map}`);
    } catch (error: any) {
      console.error(`Error generating events: ${error.message}`);
      process.exit(1);
    }
  });

// Generate quest command
program
  .command('generate-quest')
  .description('Generate a quest')
  .option('-t, --type <type>', 'Quest type', 'fetch')
  .option('-d, --difficulty <difficulty>', 'Quest difficulty (easy, medium, hard)', 'medium')
  .option('-l, --level <level>', 'Minimum player level', '1')
  .action(async (options) => {
    try {
      await coreEngine.generateQuest(options);
      console.log(`Quest generated successfully!`);
    } catch (error: any) {
      console.error(`Error generating quest: ${error.message}`);
      process.exit(1);
    }
  });

// Generate world command
program
  .command('generate-world')
  .description('Generate a complete world')
  .option('-s, --size <size>', 'World size (small, medium, large)', 'medium')
  .option('-t, --theme <theme>', 'World theme', 'fantasy')
  .option('-r, --regions <number>', 'Number of regions', '3')
  .action(async (options) => {
    try {
      await coreEngine.generateWorld(options);
      console.log(`World generated successfully!`);
    } catch (error: any) {
      console.error(`Error generating world: ${error.message}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}
