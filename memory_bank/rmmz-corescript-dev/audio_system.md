# RPG Maker MZ - Audio System

The audio system in RPG Maker MZ handles all game sounds including background music, sound effects, and voice clips.

## Audio Types

### BGM (Background Music)
- Longer tracks that play continuously
- Typically used for maps, battles, and menu screens
- Can fade in/out during transitions
- Usually OGG or M4A format

### BGS (Background Sounds)
- Ambient sounds that play continuously
- Used for environmental effects like rain, wind, crowds
- Can be layered with BGM
- Usually OGG or M4A format

### ME (Music Effects)
- Short musical segments
- Used for important events like level ups, game overs
- Temporarily interrupts BGM, which resumes afterward
- Usually OGG or M4A format

### SE (Sound Effects)
- Short sound clips
- Used for actions like button clicks, attacks, item usage
- Can play multiple SE simultaneously
- Usually OGG or M4A format

## Audio Management

### AudioManager
- Central controller for all audio playback
- Handles loading, playing, stopping, and fading audio
- Manages audio buffer caching
- Controls volume levels for each audio type

### WebAudio
- Core audio playback system
- Handles actual sound loading and playback
- Implements fade in/out effects
- Controls audio timing and loops

### SoundManager
- Provides simplified interface for common sound effects
- Used for system sounds like cursor movement, confirmations, cancellations
- References AudioManager to actually play sounds

## Audio Methods

### Playing Audio
```javascript
// Play background music
AudioManager.playBgm({
    name: "Battle1",   // Filename without extension
    volume: 90,        // Volume (0-100)
    pitch: 100,        // Pitch (50-150)
    pan: 0             // Pan (-100 to 100)
});

// Play sound effect
AudioManager.playSe({
    name: "Attack1",   // Filename without extension
    volume: 90,        // Volume (0-100)
    pitch: 100,        // Pitch (50-150)
    pan: 0             // Pan (-100 to 100)
});
```

### Stopping Audio
```javascript
AudioManager.stopBgm();      // Stop background music
AudioManager.stopBgs();      // Stop background sounds
AudioManager.stopMe();       // Stop music effect
AudioManager.stopSe();       // Stop all sound effects
```

### Fading Audio
```javascript
AudioManager.fadeOutBgm(3);  // Fade out BGM over 3 seconds
AudioManager.fadeInBgm(3);   // Fade in BGM over 3 seconds
```

## Audio Configuration

- Players can adjust volumes in the Options menu
- Volume settings are saved in the `ConfigManager`
- Default volume levels can be set in the System database

## Audio Files

- Audio files are stored in the game project:
  - `audio/bgm/`: Background music
  - `audio/bgs/`: Background sounds
  - `audio/me/`: Music effects
  - `audio/se/`: Sound effects