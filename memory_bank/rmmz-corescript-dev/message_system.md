# RPG Maker MZ - Message System

The message system in RPG Maker MZ handles all in-game text display, including dialogue, narration, and choices.

## Core Components

### Game_Message
- Located in `rmmz_objects/Game_Message.js`
- Stores the current message content, choices, and settings
- Manages message queuing and processing
- Controls text speed, positioning, and background

### Window_Message
- Located in `rmmz_windows/Window_Message.js`
- Renders the message box and text content
- Handles text processing including character-by-character display
- Manages input waiting and message advancement

### Window_ChoiceList
- Located in `rmmz_windows/Window_ChoiceList.js`
- Displays and handles selection from choice options
- Positions itself relative to the message window
- Passes selection results back to the interpreter

### Window_NameBox
- Located in `rmmz_windows/Window_NameBox.js`
- Shows character names for dialogue
- Positions itself relative to the message window

## Message Display Process

1. **Event Command**: A "Show Text" event command is executed
2. **Message Setup**: `Game_Message` stores the text and settings
3. **Scene Processing**: `Scene_Map` detects active message and calls message window
4. **Text Processing**: `Window_Message` processes text codes and formats message
5. **Display**: Text is drawn character-by-character with specified speed
6. **Wait**: System waits for player input to continue
7. **Advance**: After input, message continues or closes

## Text Codes

RPG Maker MZ supports various text codes for formatting and special functions:

| Code | Description | Example |
|------|-------------|---------|
| `\C[n]` | Change text color | `\C[3]Red Text` |
| `\I[n]` | Display icon | `Found \I[176]!` |
| `\{` | Increase text size | `\{Big Text\}` |
| `\}` | Decrease text size | `\}Small Text\}` |
| `\.` | Wait 1/4 second | `Wait\.\.\.` |
| `\|` | Wait 1 second | `One\|Two\|Three` |
| `\!` | Wait for input | `Press any key\!` |
| `\>` | Display remaining text instantly | `\>Skip wait` |
| `\<` | Cancel skip text | `\<Resume waiting` |
| `\$` | Open gold window | `You paid \$` |
| `\\` | Display backslash | `\\C[3] shows as \C[3]` |
| `\V[n]` | Display variable value | `Score: \V[1]` |
| `\N[n]` | Display actor name | `\N[1] joins!` |
| `\P[n]` | Display party member name | `\P[1] attacks!` |
| `\G` | Display currency unit | `50\G earned` |

## Text Processing Implementation

```javascript
// From Window_Message
Window_Base.prototype.processEscapeCharacter = function(code, textState) {
    switch (code) {
        case "C":
            this.processColorChange(this.obtainEscapeParam(textState));
            break;
        case "I":
            this.processDrawIcon(this.obtainEscapeParam(textState), textState);
            break;
        case "PX":
            textState.x = this.obtainEscapeParam(textState);
            break;
        case "PY":
            textState.y = this.obtainEscapeParam(textState);
            break;
        case "FS":
            this.contents.fontSize = this.obtainEscapeParam(textState);
            break;
        // ... more cases for other codes
    }
};
```

## Message Settings

### Appearance
- **Background**: Transparent, Dim, or Window
- **Position**: Top, Middle, or Bottom
- **Face Image**: Character portrait display
- **Text Speed**: Auto-advance or manual advance

### Programming Control
```javascript
// Show a message
$gameMessage.add("This is a message.");

// Set message settings
$gameMessage.setFaceImage("Actor1", 0);
$gameMessage.setBackground(1); // 0=Normal, 1=Dim, 2=Transparent
$gameMessage.setPositionType(1); // 0=Top, 1=Center, 2=Bottom

// Add choices
$gameMessage.setChoices(["Yes", "No", "Maybe"], 0, -1);
$gameMessage.setChoiceCallback(n => {
    // Handle choice selection
    switch (n) {
        case 0: // Yes
            break;
        case 1: // No
            break;
        case 2: // Maybe
            break;
    }
});
```

## Advanced Message Features

### Name Windows
```javascript
// Show speaker name
$gameMessage.setSpeakerName("Hero");
```

### Scrolling Text
```javascript
// Use scroll text command for narrative text
$gameMessage.setScroll(5, false, "Once upon a time...");
```

### Message Styles
Different styles can be set through plugin parameters:
- Font face and size
- Text color
- Window opacity
- Window skin

### Message Queuing
```javascript
// Multiple messages are queued
$gameMessage.add("First message");
$gameMessage.add("Second message");
// They will display one after another
```

## Custom Text Processing

Plugins can extend the text code system by adding custom codes:

```javascript
// Add a custom text code \M[x] to show monster names
const _Window_Base_processEscapeCharacter = 
    Window_Base.prototype.processEscapeCharacter;
    
Window_Base.prototype.processEscapeCharacter = function(code, textState) {
    if (code === "M") {
        const monsterId = this.obtainEscapeParam(textState);
        const monsterName = $dataEnemies[monsterId].name;
        this.drawText(monsterName, textState.x, textState.y);
        const width = this.textWidth(monsterName);
        textState.x += width;
    } else {
        _Window_Base_processEscapeCharacter.call(this, code, textState);
    }
};
```