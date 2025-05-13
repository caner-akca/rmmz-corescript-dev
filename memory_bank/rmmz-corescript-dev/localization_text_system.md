# RPG Maker MZ - Localization and Text System

The localization and text system in RPG Maker MZ handles the display and management of text throughout the game, including support for multiple languages.

## Core Components

### TextManager
- Located in `rmmz_managers/TextManager.js`
- Central repository for game terms and messages
- Provides standard text for commands and system messages
- Supports language-specific text variations

### Window_Base
- Located in `rmmz_windows/Window_Base.js`
- Provides text rendering and processing functionality
- Handles text codes, alignment, and word wrapping
- Renders text with font control and color management

## Text Data Structure

### Terms and Messages
Game terminology is stored in the System database in these categories:

1. **Basic Terms**: Commands like "Items", "Skills", "Equip", etc.
2. **Status Terms**: Parameter names like "MaxHP", "Attack", "Defense", etc.
3. **Message Terms**: Common messages like "Obtained X", "X learned", etc.

```javascript
// System terms structure (simplified)
$dataSystem.terms = {
    basic: ["", "Level", "HP", "MP", "TP", "EXP", ...],
    commands: ["Fight", "Escape", "Attack", "Guard", "Items", ...],
    params: ["MaxHP", "MaxMP", "Attack", "Defense", "M.Attack", ...],
    messages: {
        actionFailure: "%1 couldn't perform the action!",
        actorDamage: "%1 took %2 damage!",
        // ... more message templates
    }
};
```

### Accessing System Text
TextManager provides methods to access these terms:

```javascript
// Getting UI text
const levelText = TextManager.level;       // "Level"
const hpText = TextManager.hp;             // "HP"
const attackText = TextManager.param(2);   // "Attack"

// Getting message text
const battleStartText = TextManager.beginBattle;
const victoryText = TextManager.victory;
const defeatText = TextManager.defeat;
```

## Text Rendering System

### Drawing Text in Windows
```javascript
// Basic text drawing
window.drawText("Hello World", x, y, maxWidth, align);

// Alignment options
// "left" (default), "center", "right"
window.drawText("Centered", x, y, width, "center");

// Text processing with codes
window.drawTextEx("\\C[3]Colored\\C[0] and \\{Large\\} Text", x, y, width);
```

### Font Control
```javascript
// Change font settings
window.contents.fontFace = "Arial";
window.contents.fontSize = 20;
window.contents.fontItalic = true;
window.contents.fontBold = true;
window.contents.textColor = "#FF0000";     // Red text

// Get text dimensions
const width = window.textWidth("Hello");    // Width in pixels
const height = window.lineHeight();         // Line height in pixels
```

### Text Processing
```javascript
// Process text including control codes
const textState = window.createTextState(text, x, y, width);
window.processAllText(textState);

// Process individual control codes
window.processControlCharacter(textState, code);
window.processEscapeCharacter(code, textState);
```

## Localization Support

### Language Settings
RPG Maker MZ supports multiple languages through:

1. **Language Files**: JSON files containing translated terms
2. **Plugin Parameters**: Settings to control active language
3. **Font Changes**: Different fonts for different languages

```javascript
// Example language file structure (en.json)
{
    "base": {
        "terms": {
            "basic": ["", "Level", "HP", "MP", ...],
            "commands": ["Fight", "Escape", "Attack", ...],
            "params": ["MaxHP", "MaxMP", "Attack", ...],
            "messages": {
                "actionFailure": "%1 couldn't perform the action!",
                // ...
            }
        }
    }
}
```

### Language Switching
Languages can be switched at runtime:

```javascript
// Set language (through plugins)
ConfigManager.setLanguage("en");  // English
ConfigManager.setLanguage("jp");  // Japanese
ConfigManager.save();             // Save preference

// Reload language data
TextManager.loadLanguage();
```

### Font Handling for Different Languages
```javascript
// Set language-specific font
FontManager.load("GameFont", "fonts/mplus-1m-regular.ttf");
FontManager.load("Chinese", "fonts/heiti.ttf");

// Change font based on language
Window_Base.prototype.standardFontFace = function() {
    switch (ConfigManager.language) {
        case "zh":
            return "Chinese";
        default:
            return "GameFont";
    }
};
```

## Message Formatting

### Text Codes
RPG Maker MZ supports text formatting with control codes:

```
\C[n] - Change text color (0-31)
\I[n] - Show icon
\{    - Increase text size
\}    - Decrease text size
\$    - Open gold window
\.    - Wait 1/4 second
\|    - Wait 1 second
\!    - Wait for input
\>    - Display remaining text instantly
\<    - Cancel instant display
\^    - Skip to next message
\V[n] - Display value of variable n
\N[n] - Display name of actor n
\P[n] - Display name of party member n
\G    - Display currency unit
\\    - Display backslash character
```

### Text Wrapping and Auto-formatting
```javascript
// Word wrapping
Window_Base.prototype.processWordWrap = function(textState, maxWidth) {
    let text = textState.text.slice(textState.index);
    const lines = text.split('\n');
    const words = lines[0].split(' ');
    
    let result = '';
    let line = '';
    
    for (const word of words) {
        if (this.textWidth(line + word) > maxWidth) {
            if (line.length > 0) {
                result += line + '\n';
                line = word + ' ';
            } else {
                result += word + '\n';
            }
        } else {
            line += word + ' ';
        }
    }
    
    result += line;
    
    // Handle remaining lines
    for (let i = 1; i < lines.length; i++) {
        result += '\n' + lines[i];
    }
    
    return result;
};
```

## Dynamic Text

### Variable Substitution
RPG Maker MZ supports dynamic text with:

1. **Variable Codes**: Insert game variable values with `\V[n]`
2. **Actor Name Codes**: Insert character names with `\N[n]`
3. **Parameter Substitution**: Insert values with `%1`, `%2` placeholders

```javascript
// Text with variable substitution
"You found %1!"           // Item name will replace %1
"\\V[1] gold collected!"  // Variable 1 value will be inserted
"\\N[1] joins the party!" // Actor 1's name will be inserted
```

### Message Template Implementation
```javascript
// Message template system (simplified)
Window_Base.prototype.processCharacter = function(textState) {
    const c = textState.text[textState.index++];
    if (c === '\n') {
        this.processNewLine(textState);
    } else if (c === '\f') {
        this.processNewPage(textState);
    } else if (c === '\x1b') {
        this.processEscapeCharacter(this.obtainEscapeCode(textState), textState);
    } else if (c === '%') {
        this.processVariableCharacter(textState);
    } else {
        this.processNormalCharacter(textState);
    }
};

// Process variable character (%1, %2, etc.)
Window_Base.prototype.processVariableCharacter = function(textState) {
    const index = textState.text[textState.index++];
    if (index >= '1' && index <= '9') {
        const paramIndex = parseInt(index) - 1;
        if (textState.params && textState.params[paramIndex]) {
            this.drawText(textState.params[paramIndex], textState.x, textState.y);
            textState.x += this.textWidth(textState.params[paramIndex]);
        }
    }
};
```

## Custom Font and Text Handling

### Custom Fonts
To add custom fonts to the game:

1. Add font files to the `/fonts/` directory
2. Register fonts using FontManager
3. Update CSS to include the font-face definitions

```javascript
// Register a font
FontManager.load("CustomFont", "fonts/custom-font.ttf");

// Set as default font
Window_Base.prototype.standardFontFace = function() {
    return "CustomFont";
};
```

### Text Width Calculation
```javascript
// Measure text width for proper alignment and wrapping
Window_Base.prototype.textWidth = function(text) {
    this._wordWrap = false;
    text = this.convertEscapeCharacters(text);
    const context = this.contents.context;
    context.font = this.contents.font;
    return context.measureText(text).width;
};
```

### RTL Language Support
For right-to-left languages like Arabic:

```javascript
// Detect if using RTL language
Window_Base.prototype.isRTL = function() {
    return ["ar", "he", "fa"].includes(ConfigManager.language);
};

// Adjust text processing for RTL
Window_Base.prototype.processDrawText = function(text, x, y, maxWidth, align) {
    if (this.isRTL()) {
        // Mirror alignment for RTL
        if (align === "left") align = "right";
        else if (align === "right") align = "left";
        
        // Reverse the text for proper RTL display
        text = text.split("").reverse().join("");
    }
    
    this.contents.drawText(text, x, y, maxWidth, this.lineHeight(), align);
};
```