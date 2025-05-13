# RPG Maker MZ - Save/Load System

The save/load system in RPG Maker MZ allows players to save their progress and resume gameplay later.

## Core Components

### StorageManager
- Handles the actual saving and loading of game data
- Determines storage method (localStorage or files)
- Manages file paths and naming for save files
- Handles data compression and encryption

### DataManager
- Manages what data gets saved and loaded
- Creates save content objects
- Handles save file metadata
- Manages database loading and map setup

### Scene_File, Scene_Save, Scene_Load
- UI scenes for save/load operations
- Display save file list and information
- Handle player input during save/load operations

## Save Data Structure

A save file contains the following data:

```javascript
// Save contents structure
{
    system:      $gameSystem,        // System settings
    screen:      $gameScreen,        // Screen effects
    timer:       $gameTimer,         // Game timer
    switches:    $gameSwitches,      // Game switches
    variables:   $gameVariables,     // Game variables
    selfSwitches: $gameSelfSwitches, // Event self switches
    actors:      $gameActors,        // Actors
    party:       $gameParty,         // Party
    map:         $gameMap,           // Map
    player:      $gamePlayer         // Player
}
```

## Save File Information

Each save file also contains metadata:

```javascript
// Save file info structure
{
    title:      title,              // Game title
    characters: characters,         // Party character data
    faces:      faces,              // Party face graphics
    playtime:   playtime,           // Play time
    timestamp:  timestamp           // Save timestamp
}
```

## Save/Load Process

### Saving
1. `DataManager.saveGame(savefileId)` is called
2. Game objects are gathered into a save contents object
3. Save file info is created and added
4. Data is converted to JSON
5. JSON data is optionally compressed/encrypted
6. Data is written to storage via `StorageManager.saveObject()`

### Loading
1. `DataManager.loadGame(savefileId)` is called
2. Data is read from storage via `StorageManager.loadObject()`
3. Data is decompressed/decrypted if necessary
4. JSON data is parsed into a save contents object
5. Each game object is extracted and set to global variables
6. The map is reloaded with player position and state

## Storage Methods

RPG Maker MZ can use two storage methods:

1. **File Storage**: Save data as files in a local directory (desktop/downloaded games)
2. **Web Storage**: Save data in localStorage (browser-based games)

The appropriate method is chosen automatically based on the platform.

## Security and Compatibility

- Save data can be encrypted to prevent easy editing
- MVZ automatically handles differences in game data between versions
- Save files contain version information to help with compatibility