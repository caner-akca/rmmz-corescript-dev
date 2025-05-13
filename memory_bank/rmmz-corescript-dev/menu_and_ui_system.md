# RPG Maker MZ - Menu and UI System

RPG Maker MZ features a comprehensive menu and UI system for player interaction with game features and information.

## Menu Architecture

### Scene-Based Structure
- Each menu screen is a separate Scene class
- Scene classes manage window creation and interaction flow
- Transitions between menus are handled by SceneManager

### Window Hierarchy
- Multiple windows can exist within a scene
- Windows handle drawing, selection, and input
- Windows are layered on the screen in a specific order

## Key Menu Scenes

### Main Menu (`Scene_Menu`)
- Entry point for menu system from the map
- Contains commands for items, skills, equipment, etc.
- Creates and manages the command window and status display

### Item and Skill Menus (`Scene_Item`, `Scene_Skill`)
- Display and allow usage of items/skills
- Handle item/skill selection and targeting
- Contain category, list, and actor windows

### Equipment Menu (`Scene_Equip`)
- Allows changing character equipment
- Shows stat comparisons for different equipment
- Contains slot selection and item selection windows

### Status Menu (`Scene_Status`)
- Displays detailed character information
- Shows parameters, equipment, and profile
- May include custom character details

## Window Components

### Base Windows
- `Window_Base`: Foundation for all window objects
- `Window_Selectable`: Base for windows with selectable items
- `Window_Command`: Base for command selection windows

### Helper Windows
- `Window_Help`: Shows descriptions for selected items
- `Window_Gold`: Displays the party's gold
- `Window_NameBox`: Shows speaker names for messages

### Dynamic Content
- `Window_DrawItem`: Drawing items in lists
- `Window_Gauge`: HP/MP/TP gauges
- `Window_StatusParams`: Parameter display

## Menu Controls

```javascript
// Open a menu scene
SceneManager.push(Scene_Menu);

// Return to the previous scene
SceneManager.pop();

// Open a specific menu directly
SceneManager.push(Scene_Item);
SceneManager.push(Scene_Skill);
SceneManager.push(Scene_Equip);
SceneManager.push(Scene_Status);
```

## UI Drawing Methods

Windows provide several methods for drawing UI elements:

```javascript
// Draw text
this.drawText("Hello World", x, y, width, alignment);

// Draw icons
this.drawIcon(iconIndex, x, y);

// Draw character faces
this.drawFace(faceName, faceIndex, x, y);

// Draw gauges (HP/MP/TP)
this.drawGauge(x, y, width, rate, color1, color2);

// Draw items with their icons
this.drawItemName(item, x, y, width);
```

## Custom Menu Creation

Creating a custom menu typically involves:

1. Creating a new Scene class extending Scene_MenuBase
2. Defining window creation in the create method
3. Setting up command handlers and window interactions
4. Registering the scene with any necessary plugins

```javascript
// Example of a simple custom menu scene
class Scene_CustomMenu extends Scene_MenuBase {
    create() {
        super.create();
        this.createCommandWindow();
    }
    
    createCommandWindow() {
        const rect = this.commandWindowRect();
        this._commandWindow = new Window_CustomCommand(rect);
        this._commandWindow.setHandler("option1", this.command1.bind(this));
        this._commandWindow.setHandler("option2", this.command2.bind(this));
        this._commandWindow.setHandler("cancel", this.popScene.bind(this));
        this.addWindow(this._commandWindow);
    }
    
    // Command handlers
    command1() {
        // Handle option 1
    }
    
    command2() {
        // Handle option 2
    }
}
```