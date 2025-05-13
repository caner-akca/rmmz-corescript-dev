# RPG Maker MZ - Audio System Architecture

This document details the internal architecture of the audio system in RPG Maker MZ, including how audio is loaded, played, and managed throughout the game.

## Core Components

### WebAudio
- Located in `rmmz_core/WebAudio.js`
- Core audio playback engine using Web Audio API
- Handles the loading, decoding, and playback of audio data
- Manages audio buffers and nodes for all game sounds

### AudioManager
- Located in `rmmz_managers/AudioManager.js`
- High-level manager for all game audio
- Controls BGM, BGS, ME, and SE playback
- Handles volume settings, fades, and caching

### SoundManager
- Located in `rmmz_managers/SoundManager.js`
- Simplified interface for common sound effects
- Handles system sounds like cursor movement, confirmations, etc.
- Uses AudioManager for actual playback

## WebAudio Implementation

### Audio Context Creation
```javascript
// Initialize the audio system
WebAudio._setupEventHandlers = function() {
    const resumeHandler = () => {
        if (this._context && this._context.state === "suspended") {
            this._context.resume();
        }
    };
    document.addEventListener("click", resumeHandler);
    document.addEventListener("touchend", resumeHandler);
    document.addEventListener("keydown", resumeHandler);
};

// Create audio context
WebAudio._createContext = function() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this._context = new AudioContext();
    } catch (e) {
        this._context = null;
    }
};
```

### Audio Loading and Decoding
```javascript
// Load audio file
WebAudio.prototype.load = function(url) {
    if (WebAudio._context) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => this._onXhrLoad(xhr);
        xhr.onerror = this._onError.bind(this);
        xhr.send();
    }
};

// Decode audio data
WebAudio.prototype._onXhrLoad = function(xhr) {
    if (xhr.status < 400) {
        this._readLoopComments(new Uint8Array(xhr.response));
        WebAudio._context.decodeAudioData(
            xhr.response,
            buffer => this._onDecode(buffer),
            this._onError.bind(this)
        );
    } else {
        this._onError();
    }
};
```

### Audio Playback
```javascript
// Play audio
WebAudio.prototype.play = function(loop, offset) {
    this._removeNodes();
    if (this._buffer) {
        const sourceNode = WebAudio._context.createBufferSource();
        const gainNode = WebAudio._context.createGain();
        const pannerNode = WebAudio._context.createPanner();
        sourceNode.buffer = this._buffer;
        sourceNode.loop = loop;
        sourceNode.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(WebAudio._masterGainNode);
        this._sourceNode = sourceNode;
        this._gainNode = gainNode;
        this._pannerNode = pannerNode;
        this._startPlaying(offset);
        this._updateVolume();
        this._updatePanner();
    }
};

// Start playback
WebAudio.prototype._startPlaying = function(offset) {
    if (this._sourceNode) {
        let startTime = WebAudio._context.currentTime;
        if (this._startTime === undefined) {
            this._startTime = startTime;
        }
        this._sourceNode.start(startTime, offset || 0);
    }
};
```

### Volume and Effects
```javascript
// Update volume
WebAudio.prototype._updateVolume = function() {
    if (this._gainNode) {
        const gain = this._volume;
        const currentTime = WebAudio._context.currentTime;
        this._gainNode.gain.setValueAtTime(gain, currentTime);
    }
};

// Update panner (for spatial audio)
WebAudio.prototype._updatePanner = function() {
    if (this._pannerNode) {
        const x = this._pan;
        const z = 1 - Math.abs(x);
        this._pannerNode.position.setValueAtTime(x, 0, z);
    }
};

// Apply fade effect
WebAudio.prototype.fadeIn = function(duration) {
    if (this._gainNode) {
        const currentTime = WebAudio._context.currentTime;
        this._gainNode.gain.setValueAtTime(0, currentTime);
        this._gainNode.gain.linearRampToValueAtTime(
            this._volume,
            currentTime + duration
        );
    }
};
```

## AudioManager Implementation

### Audio Type Management
```javascript
// Play background music
AudioManager.playBgm = function(bgm, pos) {
    if (this.isCurrentBgm(bgm)) {
        this.updateBgmParameters(bgm);
    } else {
        this.stopBgm();
        if (bgm.name) {
            this._bgmBuffer = this.createBuffer("bgm", bgm.name);
            this.updateBgmParameters(bgm);
            if (!this._meBuffer) {
                this._bgmBuffer.play(true, pos || 0);
            }
        }
    }
    this.updateCurrentBgm(bgm, pos);
};

// Play sound effect
AudioManager.playSe = function(se) {
    if (se.name) {
        // Create and cache SE buffer
        this._seBuffers = this._seBuffers.filter(buffer => !buffer.isPlaying());
        const buffer = this.createBuffer("se", se.name);
        this.updateSeParameters(buffer, se);
        buffer.play(false);
        this._seBuffers.push(buffer);
    }
};
```

### Parameter Management
```javascript
// Update BGM parameters
AudioManager.updateBgmParameters = function(bgm) {
    this.updateBufferParameters(this._bgmBuffer, this._bgmVolume, bgm);
};

// Update buffer parameters
AudioManager.updateBufferParameters = function(buffer, configVolume, audio) {
    if (buffer && audio) {
        buffer.volume = (audio.volume || 0) * configVolume / 100;
        buffer.pitch = (audio.pitch || 0) / 100;
        buffer.pan = (audio.pan || 0) / 100;
    }
};
```

### Volume Control
```javascript
// Master volume properties
Object.defineProperty(AudioManager, "masterVolume", {
    get: function() {
        return this._masterVolume;
    },
    set: function(value) {
        this._masterVolume = value;
        WebAudio.setMasterVolume(this._masterVolume);
    },
    configurable: true
});

// BGM volume with master volume modulation
Object.defineProperty(AudioManager, "bgmVolume", {
    get: function() {
        return this._bgmVolume;
    },
    set: function(value) {
        this._bgmVolume = value;
        this.updateBgmParameters(this._currentBgm);
    },
    configurable: true
});
```

### Fade Effects
```javascript
// Fade out BGM
AudioManager.fadeOutBgm = function(duration) {
    if (this._bgmBuffer && this._currentBgm) {
        this._bgmBuffer.fadeOut(duration);
        this._currentBgm = null;
    }
};

// Fade in BGM
AudioManager.fadeInBgm = function(duration) {
    if (this._bgmBuffer && this._currentBgm) {
        this._bgmBuffer.fadeIn(duration);
    }
};
```

## SoundManager Implementation

### System Sound Effects
```javascript
// Play cursor movement sound
SoundManager.playCursor = function() {
    AudioManager.playSe({ name: "Cursor1", volume: 90, pitch: 100, pan: 0 });
};

// Play OK button sound
SoundManager.playOk = function() {
    AudioManager.playSe({ name: "Decision1", volume: 90, pitch: 100, pan: 0 });
};

// Play cancel button sound
SoundManager.playCancel = function() {
    AudioManager.playSe({ name: "Cancel2", volume: 90, pitch: 100, pan: 0 });
};

// Play buzzer sound
SoundManager.playBuzzer = function() {
    AudioManager.playSe({ name: "Buzzer1", volume: 90, pitch: 100, pan: 0 });
};
```

### In-game Sounds
```javascript
// Play battle start sound
SoundManager.playBattleStart = function() {
    AudioManager.playSe({ name: "Battle1", volume: 90, pitch: 100, pan: 0 });
};

// Play escape success sound
SoundManager.playEscape = function() {
    AudioManager.playSe({ name: "Escape", volume: 90, pitch: 100, pan: 0 });
};

// Play enemy attack sound
SoundManager.playEnemyAttack = function() {
    AudioManager.playSe({ name: "Attack3", volume: 90, pitch: 100, pan: 0 });
};

// Play boss collapse sound
SoundManager.playBossCollapse1 = function() {
    AudioManager.playSe({ name: "Collapse1", volume: 90, pitch: 100, pan: 0 });
};
```

## Audio Caching System

### Buffer Management
```javascript
// Create and cache audio buffer
AudioManager.createBuffer = function(folder, name) {
    const ext = this.audioFileExt();
    const url = this._path + folder + "/" + Utils.encodeURI(name) + ext;
    const buffer = new WebAudio(url);
    buffer.name = name;
    buffer.folder = folder;
    return buffer;
};

// Get audio file extension based on browser support
AudioManager.audioFileExt = function() {
    if (Utils.canPlayOgg() && !Utils.isAnyVersionOfIE()) {
        return ".ogg";
    } else {
        return ".m4a";
    }
};
```

### Buffer Reuse
```javascript
// Retrieve and reuse existing buffer if available
AudioManager.createBuffer = function(folder, name) {
    const key = folder + ":" + name;
    let buffer = this._audioCache.get(key);
    if (!buffer) {
        // Create new buffer if not cached
        const ext = this.audioFileExt();
        const url = this._path + folder + "/" + Utils.encodeURI(name) + ext;
        buffer = new WebAudio(url);
        buffer.name = name;
        buffer.folder = folder;
        this._audioCache.set(key, buffer);
    }
    return buffer;
};
```

## Music Looping System

### Loop Detection
```javascript
// Read loop comments from audio file metadata
WebAudio.prototype._readLoopComments = function(array) {
    this._readOggComments(array);
    this._readMp4Comments(array);
};

// Extract loop points from OGG metadata
WebAudio.prototype._readOggComments = function(array) {
    const index = this._searchForOggMetadata(array);
    if (index < 0) return;
    
    // Process vendor string length
    const vendorLength = this._readLittleEndian(array, index);
    let metadataStart = index + 4 + vendorLength;
    
    // Process comment count
    const commentCount = this._readLittleEndian(array, metadataStart);
    metadataStart += 4;
    
    // Process each comment
    for (let i = 0; i < commentCount; i++) {
        const commentLength = this._readLittleEndian(array, metadataStart);
        metadataStart += 4;
        const commentString = this._readUtf8String(array, metadataStart, commentLength);
        metadataStart += commentLength;
        this._readCommentString(commentString);
    }
};
```

### Loop Implementation
```javascript
// Apply loop points during playback
WebAudio.prototype._onDecode = function(buffer) {
    this._buffer = buffer;
    if (this._loopStart || this._loopStart === 0) {
        this._loopStart /= buffer.sampleRate;
    }
    if (this._loopLength) {
        this._loopEnd = (this._loopStart || 0) + this._loopLength / buffer.sampleRate;
    }
    if (this._loopEnd && this._loop) {
        this._sourceNode.loop = true;
        this._sourceNode.loopStart = this._loopStart;
        this._sourceNode.loopEnd = this._loopEnd;
    }
    this._totalTime = buffer.duration;
    this._isReady = true;
    this._onLoad();
};
```

## Integration with Game Objects

### Game_System Audio Settings
```javascript
// Save BGM/BGS for map transition
Game_System.prototype.saveWalkingBgm2 = function() {
    this._walkingBgm = AudioManager.saveBgm();
};

// Replay walking BGM
Game_System.prototype.replayWalkingBgm = function() {
    if (this._walkingBgm) {
        AudioManager.playBgm(this._walkingBgm);
    }
};
```

### Map Settings
```javascript
// Autoplay map BGM/BGS
Game_Map.prototype.autoplay = function() {
    if ($dataMap.autoplayBgm) {
        AudioManager.playBgm($dataMap.bgm);
    }
    if ($dataMap.autoplayBgs) {
        AudioManager.playBgs($dataMap.bgs);
    }
};
```

### Battle Audio
```javascript
// Play battle BGM
BattleManager.playBattleBgm = function() {
    AudioManager.playBgm($gameSystem.battleBgm());
};

// Play victory ME
BattleManager.playVictoryMe = function() {
    AudioManager.playMe($gameSystem.victoryMe());
};

// Play defeat ME
BattleManager.playDefeatMe = function() {
    AudioManager.playMe($gameSystem.defeatMe());
};
```

## Audio Configuration

### Config Manager Integration
```javascript
// Initialize audio configuration
ConfigManager.bgmVolume = 100;
ConfigManager.bgsVolume = 100;
ConfigManager.meVolume = 100;
ConfigManager.seVolume = 100;

// Apply configuration to audio system
ConfigManager.applyData = function(config) {
    this.bgmVolume = this.readVolume(config, "bgmVolume");
    this.bgsVolume = this.readVolume(config, "bgsVolume");
    this.meVolume = this.readVolume(config, "meVolume");
    this.seVolume = this.readVolume(config, "seVolume");
};

// Apply volume settings to audio manager
AudioManager.updateMasterVolume = function() {
    this.masterVolume = ConfigManager.masterVolume || 1;
};

AudioManager.updateBgmVolume = function() {
    this.bgmVolume = ConfigManager.bgmVolume / 100;
};
```

## Dynamic Audio Features

### Pitch Shifting
```javascript
// Modify pitch during gameplay
AudioManager.changePitch = function(buffer, pitch) {
    if (buffer && buffer._sourceNode) {
        buffer._sourceNode.playbackRate.value = pitch / 100;
    }
};

// Effect for slowing time
Game_Screen.prototype.startSlowMotion = function(duration) {
    this._slowMotionDuration = duration;
    if (this._slowMotionDuration > 0) {
        // Slow down BGM
        const bgm = AudioManager._bgmBuffer;
        if (bgm) AudioManager.changePitch(bgm, 70);
        // Slow down BGS
        const bgs = AudioManager._bgsBuffer;
        if (bgs) AudioManager.changePitch(bgs, 70);
    }
};
```

### Spatial Audio
```javascript
// Set up 3D audio positioning
AudioManager.setupSpatialAudio = function(buffer, x, y, radius) {
    if (!buffer || !buffer._pannerNode) return;
    
    // Convert map coordinates to normalized audio space
    const screenX = $gameMap.convertMapToScreenX(x);
    const screenY = $gameMap.convertMapToScreenY(y);
    
    // Calculate relative position to player
    const playerX = $gameMap.convertMapToScreenX($gamePlayer.x);
    const playerY = $gameMap.convertMapToScreenY($gamePlayer.y);
    
    // Calculate distance and direction
    const dx = screenX - playerX;
    const dy = screenY - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate panning (-1 to 1)
    const pan = Math.max(Math.min(dx / radius, 1), -1);
    
    // Calculate volume fade based on distance
    const volumeFade = Math.max(0, 1 - (distance / radius));
    
    // Apply to audio buffer
    buffer.pan = pan;
    buffer.volume = buffer.baseVolume * volumeFade;
};
```