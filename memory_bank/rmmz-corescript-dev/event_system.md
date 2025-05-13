# RPG Maker MZ - Event System

The event system is the primary way to create interactive elements and scripted sequences in RPG Maker MZ games.

## Event Components

### Game_Event
- Defined in `Game_Event.js`
- Represents map events and handles their behavior
- Controls event movement, appearance, and execution of event commands

### Game_Interpreter
- Defined in `Game_Interpreter.js`
- Executes event commands (the "brain" of the event system)
- Translates event command codes into actual game behaviors

### Game_CommonEvent
- Defined in `Game_CommonEvent.js`
- Handles common events that can be called from multiple places
- Manages automatic execution of common events

## Event Pages

Each event can have multiple pages with different conditions and commands:
- **Conditions**: Requirements for a page to be active (switches, variables, etc.)
- **Graphic**: Visual representation of the event
- **Trigger**: How the event is activated (player touch, action button, autorun, etc.)
- **Move Type**: How the event moves on the map
- **Priority**: Whether the event is below, same level as, or above the player
- **Commands**: Actions the event performs when triggered

## Event Commands

The event system includes various commands for creating game logic:

### Flow Control
- Conditional Branches
- Loops and Labels
- Common Event Calls
- Comment Blocks

### Message and Display
- Show Text
- Show Choices
- Input Number
- Show Scrolling Text
- Show Picture
- Move Picture

### Game Progression
- Transfer Player
- Change Items/Weapons/Armors
- Change Party Members
- Change Experience/Level
- Change Variables/Switches
- Control Self Switches

### Battle and Movement
- Battle Processing
- Shop Processing
- Change Transparency
- Change Movement Route
- Wait for Movement

### Audio and Visual
- Play BGM/BGS/ME/SE
- Screen Tint
- Flash Screen
- Shake Screen
- Weather Effects

## Event Script Calls

Script calls allow for direct code execution from events using the "Script" command:
- Call JavaScript code directly
- Access and modify game state
- Create complex behaviors beyond standard commands