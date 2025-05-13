# RPG Maker MZ - Game Data Structures

RPG Maker MZ stores game data in JSON files located in the `data/` directory. Understanding these data structures is essential for plugin development and game customization.

## Main Data Files

- **System.json**: Game system settings (window colors, title music, etc.)
- **Actors.json**: Playable character definitions
- **Classes.json**: Character class definitions (skills, parameters, etc.)
- **Skills.json**: Skill definitions
- **Items.json**: Item definitions
- **Weapons.json**: Weapon definitions
- **Armors.json**: Armor definitions
- **Enemies.json**: Enemy definitions
- **Troops.json**: Enemy group definitions for battles
- **States.json**: Status effect definitions
- **Animations.json**: Animation definitions
- **Tilesets.json**: Tileset definitions for maps
- **CommonEvents.json**: Common event definitions
- **MapInfos.json**: List of all maps
- **Map*.json**: Individual map data (events, tiles, etc.)

## Data Access

Game data is accessed through the `$data*` global variables:

- `$dataSystem`: System settings
- `$dataActors`: Actors data
- `$dataClasses`: Classes data
- `$dataSkills`: Skills data
- `$dataItems`: Items data
- `$dataWeapons`: Weapons data
- `$dataArmors`: Armors data
- `$dataEnemies`: Enemies data
- `$dataTroops`: Troops data
- `$dataStates`: States data
- `$dataAnimations`: Animations data
- `$dataTilesets`: Tilesets data
- `$dataCommonEvents`: Common events data
- `$dataMapInfos`: Map list
- `$dataMap`: Current map data

## Game Variables and Switches

Game variables and switches are accessed through:

- `$gameVariables`: Game variables (values set during gameplay)
- `$gameSwitches`: Game switches (boolean flags set during gameplay)

## Saving and Loading

When a game is saved, the following objects are serialized:

- `$gameSystem`: System settings
- `$gameScreen`: Screen effects
- `$gameTimer`: Game timer
- `$gameMessage`: Message display
- `$gameSwitches`: Game switches
- `$gameVariables`: Game variables
- `$gameSelfSwitches`: Event self switches
- `$gameActors`: Actor instances
- `$gameParty`: Player party
- `$gameTroop`: Enemy troop
- `$gameMap`: Game map
- `$gamePlayer`: Player character