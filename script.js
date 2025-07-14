// Core player state
const playerState = {
    playlist: [],
    currentTrackIndex: 0,
    isPlaying: false,
    isShuffled: false,
    shuffledIndices: [],
    shufflePosition: 0,
    player: null,
    isPlayerReady: false
};

// DOM element cache for better performance
const elements = {
    playPauseBtn: null,
    songTitle: null,
    channelName: null,
    volumeSlider: null,
    volumeValue: null,
    shuffleBtn: null
};

// Constants
const YOUTUBE_API_URL = 'https://www.youtube.com/iframe_api';
const DEFAULT_VOLUME = 50;
const PLAYLIST_FILE = 'music.yaml';

/**
 * Console Logger with beautiful formatting
 */
const Logger = {
    colors: {
        primary: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c',
        info: '#9b59b6',
        muted: '#7f8c8d'
    },

    /**
     * Display app header with ASCII art
     */
    displayHeader() {
        console.clear();

        this.info('🚀 Application is starting...'); // Original: '🚀 Aplikace se spouští...'
        this.info('📱 This is the developer console - you will see all system messages here'); // Original: '📱 Toto je konzole pro vývojáře - zde uvidíte všechny systémové zprávy'
        this.separator();
    },

    /**
     * Log success message
     */
    success(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] ✅ ${message}`, `color: ${this.colors.success}; font-weight: bold`);
        if (data) {
            console.log(`%c└─ Data:`, `color: ${this.colors.muted}`, data);
        }
    },

    /**
     * Log info message
     */
    info(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] ℹ️  ${message}`, `color: ${this.colors.info}; font-weight: bold`);
        if (data) {
            console.log(`%c└─ Data:`, `color: ${this.colors.muted}`, data);
        }
    },

    /**
     * Log warning message
     */
    warning(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] ⚠️  ${message}`, `color: ${this.colors.warning}; font-weight: bold`);
        if (data) {
            console.log(`%c└─ Data:`, `color: ${this.colors.muted}`, data);
        }
    },

    /**
     * Log error message
     */
    error(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] ❌ ${message}`, `color: ${this.colors.error}; font-weight: bold`);
        if (data) {
            console.log(`%c└─ Error:`, `color: ${this.colors.muted}`, data);
        }
    },

    /**
     * Log track information
     */
    track(action, track) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] 🎵 ${action}`, `color: ${this.colors.primary}; font-weight: bold`);
        console.log(`%c├─ Title: ${track.title}`, `color: ${this.colors.muted}`); // Original: '├─ Název: ${track.title}'
        console.log(`%c├─ Channel: ${track.channel}`, `color: ${this.colors.muted}`); // Original: '├─ Kanál: ${track.channel}'
        console.log(`%c└─ URL: ${track.url}`, `color: ${this.colors.muted}`);
    },

    /**
     * Log playlist information
     */
    playlist(action, count, details = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] 📋 ${action} (${count} tracks)`, `color: ${this.colors.primary}; font-weight: bold`); // Original: 'Playlist načten (${count} skladeb)'
        if (details) {
            console.log(`%c└─ Detail:`, `color: ${this.colors.muted}`, details);
        }
    },

    /**
     * Log player state changes
     */
    playerState(state, details = null) {
        const timestamp = new Date().toLocaleTimeString();
        const stateEmojis = {
            'PLAYING': '▶️',
            'PAUSED': '⏸️',
            'STOPPED': '⏹️',
            'ENDED': '🔚',
            'READY': '✅',
            'LOADING': '⏳',
            'ERROR': '❌'
        };

        const emoji = stateEmojis[state] || '🔄';
        console.log(`%c[${timestamp}] ${emoji} Player: ${state}`, `color: ${this.colors.primary}; font-weight: bold`);
        if (details) {
            console.log(`%c└─ Detail:`, `color: ${this.colors.muted}`, details);
        }
    },

    /**
     * Log shuffle information
     */
    shuffle(enabled, order = null) {
        const timestamp = new Date().toLocaleTimeString();
        const status = enabled ? 'ON' : 'OFF'; // Original: 'ZAPNUTO' : 'VYPNUTO'
        const emoji = enabled ? '🔀' : '📋';
        console.log(`%c[${timestamp}] ${emoji} Shuffle: ${status}`, `color: ${this.colors.primary}; font-weight: bold`);
        if (order && enabled) {
            console.log(`%c└─ New order:`, `color: ${this.colors.muted}`, order); // Original: '└─ Nové pořadí:'
        }
    },

    /**
     * Display separator
     */
    separator() {
        console.log('%c' + '─'.repeat(120), `color: ${this.colors.muted}`);
    },

    /**
     * Display current status
     */
    status() {
        this.separator();
        console.log(`%c📊 CURRENT PLAYER STATUS`, `color: ${this.colors.primary}; font-weight: bold; font-size: 14px`); // Original: '📊 AKTUÁLNÍ STAV PŘEHRÁVAČE'
        console.log(`%c├─ Playlist: ${playerState.playlist.length} tracks`, `color: ${this.colors.muted}`); // Original: '├─ Playlist: ${playerState.playlist.length} skladeb'
        console.log(`%c├─ Current index: ${playerState.currentTrackIndex + 1}/${playerState.playlist.length}`, `color: ${this.colors.muted}`); // Original: '├─ Aktuální index: ${playerState.currentTrackIndex + 1}/${playerState.playlist.length}'
        console.log(`%c├─ Playing: ${playerState.isPlaying ? 'YES' : 'NO'}`, `color: ${this.colors.muted}`); // Original: '├─ Přehrává: ${playerState.isPlaying ? 'ANO' : 'NE'}'
        console.log(`%c├─ Shuffle: ${playerState.isShuffled ? 'ON' : 'OFF'}`, `color: ${this.colors.muted}`); // Original: '├─ Shuffle: ${playerState.isShuffled ? 'ZAPNUTO' : 'VYPNUTO'}'
        console.log(`%c└─ API connected: ${playerState.isPlayerReady ? 'YES' : 'NO'}`, `color: ${this.colors.muted}`); // Original: '└─ API připojeno: ${playerState.isPlayerReady ? 'ANO' : 'NE'}'
        this.separator();
    }
};

/**
 * Initialize DOM elements cache
 */
function initializeElements() {
    Logger.info('🔧 Initializing DOM elements...'); // Original: '🔧 Inicializuji DOM elementy...'

    elements.playPauseBtn = document.getElementById('playPauseBtn');
    elements.songTitle = document.getElementById('songTitle');
    elements.channelName = document.getElementById('channelName');
    elements.volumeSlider = document.getElementById('volumeSlider');
    elements.volumeValue = document.getElementById('volumeValue');
    elements.shuffleBtn = document.getElementById('shuffleBtn');

    const foundElements = Object.values(elements).filter(el => el !== null).length;
    Logger.success(`🎯 Found ${foundElements}/${Object.keys(elements).length} DOM elements`); // Original: '🎯 Nalezeno ${foundElements}/${Object.keys(elements).length} DOM elementů'
}

/**
 * YouTube API ready callback
 */
function onYouTubeIframeAPIReady() {
    Logger.info('🔌 YouTube API is ready, creating player...'); // Original: '🔌 YouTube API je připravené, vytvářím přehrávač...'

    playerState.player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
        }
    });

    Logger.success('🎮 YouTube player has been created'); // Original: '🎮 YouTube přehrávač byl vytvořen'
}

/**
 * Player ready event handler
 */
function onPlayerReady(event) {
    playerState.isPlayerReady = true;
    Logger.playerState('READY', `Default volume set to ${DEFAULT_VOLUME}%`); // Original: `Výchozí hlasitost nastavena na ${DEFAULT_VOLUME}%`
    playerState.player.setVolume(DEFAULT_VOLUME);
    Logger.status();
}

/**
 * Player state change event handler
 */
function onPlayerStateChange(event) {
    const states = {
        [YT.PlayerState.ENDED]: 'ENDED',
        [YT.PlayerState.PLAYING]: 'PLAYING',
        [YT.PlayerState.PAUSED]: 'PAUSED',
        [YT.PlayerState.BUFFERING]: 'LOADING',
        [YT.PlayerState.CUED]: 'READY'
    };

    const currentState = states[event.data] || 'UNKNOWN';

    switch (event.data) {
        case YT.PlayerState.ENDED:
            Logger.playerState('ENDED', 'Moving to the next track'); // Original: 'Přecházím na další skladbu'
            nextTrack();
            break;
        case YT.PlayerState.PLAYING:
            Logger.playerState('PLAYING');
            updatePlayButton(true);
            break;
        case YT.PlayerState.PAUSED:
            Logger.playerState('PAUSED');
            updatePlayButton(false);
            break;
        case YT.PlayerState.BUFFERING:
            Logger.playerState('LOADING', 'Loading video data...'); // Original: 'Načítám video data...'
            break;
    }
}

/**
 * Player error event handler
 */
function onPlayerError(event) {
    const errorMessages = {
        2: 'Invalid video ID', // Original: 'Neplatné video ID'
        5: 'HTML5 player cannot play the video', // Original: 'HTML5 přehrávač nedokáže přehrát video'
        100: 'Video not found', // Original: 'Video nebylo nalezeno'
        101: 'Video owner has forbidden playback in embedded player', // Original: 'Majitel videa zakázal přehrávání v embedded přehrávači'
        150: 'Video owner has forbidden playback in embedded player' // Original: 'Majitel videa zakázal přehrávání v embedded přehrávači'
    };

    const errorMsg = errorMessages[event.data] || `Unknown error (${event.data})`; // Original: `Neznámá chyba (${event.data})`
    Logger.error(`Youtubeer: ${errorMsg}`);
    Logger.info('⏭️ Skipping to the next track...'); // Original: '⏭️ Přeskakuji na další skladbu...'
    nextTrack();
}

/**
 * Update play/pause button state
 */
function updatePlayButton(isPlaying) {
    playerState.isPlaying = isPlaying;
    if (elements.playPauseBtn) {
        elements.playPauseBtn.innerHTML = isPlaying
            ? '<i class="fa-solid fa-pause"></i>'
            : '<i class="fa-solid fa-play"></i>';
    }
}

/**
 * Load YouTube API script
 */
function loadYouTubeAPI() {
    Logger.info('📡 Loading YouTube API...'); // Original: '📡 Načítám YouTube API...'

    const tag = document.createElement('script');
    tag.src = YOUTUBE_API_URL;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    Logger.success('✅ YouTube API script has been added to the page'); // Original: '✅ YouTube API script byl přidán do stránky'
}

/**
 * Load playlist from YAML file
 */
async function loadPlaylist() {
    Logger.info(`📁 Loading playlist from file: ${PLAYLIST_FILE}`); // Original: `📁 Načítám playlist ze souboru: ${PLAYLIST_FILE}`

    try {
        const response = await fetch(PLAYLIST_FILE);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        if (!data?.playlist || !Array.isArray(data.playlist)) {
            throw new Error('Invalid YAML format - playlist array not found'); // Original: 'Neplatný formát YAML - playlist array nebyl nalezen'
        }

        playerState.playlist = data.playlist;
        initializeShuffleIndices();

        Logger.playlist('Playlist loaded', playerState.playlist.length, { // Original: 'Playlist načten'
            'First track': playerState.playlist[0]?.title || 'N/A', // Original: 'První skladba'
            'Last track': playerState.playlist[playerState.playlist.length - 1]?.title || 'N/A' // Original: 'Poslední skladba'
        });

        if (playerState.playlist.length > 0) {
            updateTrackInfo();
        }

        Logger.status();
    } catch (error) {
        Logger.error('Error loading playlist', error); // Original: 'Chyba při načítání playlistu'
    }
}

/**
 * Initialize shuffle indices array
 */
function initializeShuffleIndices() {
    playerState.shuffledIndices = Array.from({ length: playerState.playlist.length }, (_, i) => i);
    playerState.shufflePosition = 0;
    Logger.info('🔢 Initializing shuffle indices', playerState.shuffledIndices); // Original: '🔢 Inicializuji shuffle indexy'
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleIndices() {
    const indices = playerState.shuffledIndices;
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    Logger.info('🎲 Playlist was shuffled using the Fisher-Yates algorithm'); // Original: '🎲 Playlist byl zamíchán pomocí Fisher-Yates algoritmu'
}

/**
 * Setup volume control slider
 */
function setupVolumeControl() {
    if (!elements.volumeSlider || !elements.volumeValue) {
        Logger.warning('🔊 Volume controls were not found in DOM'); // Original: '🔊 Volume kontroly nebyly nalezeny v DOM'
        return;
    }

    Logger.info('🔊 Setting up volume control...'); // Original: '🔊 Nastavuji ovládání hlasitosti...'

    elements.volumeSlider.addEventListener('input', (event) => {
        const volume = parseInt(event.target.value);
        elements.volumeValue.textContent = volume;

        if (playerState.isPlayerReady) {
            playerState.player.setVolume(volume);
            Logger.info(`🔊 Volume changed to ${volume}%`); // Original: `🔊 Hlasitost změněna na ${volume}%`
        }
    });

    // Set initial volume display
    elements.volumeValue.textContent = DEFAULT_VOLUME;
    Logger.success('🔊 Volume control has been set up'); // Original: '🔊 Ovládání hlasitosti bylo nastaveno'
}

/**
 * Play specific track by index
 */
function playTrack(index) {
    if (index < 0 || index >= playerState.playlist.length) {
        Logger.error(`❌ Invalid track index: ${index}`); // Original: `❌ Neplatný index skladby: ${index}`
        return;
    }

    playerState.currentTrackIndex = index;

    // Update shuffle position if shuffle is enabled
    if (playerState.isShuffled) {
        playerState.shufflePosition = playerState.shuffledIndices.indexOf(index);
    }

    updateTrackInfo();

    if (playerState.isPlayerReady) {
        const currentTrack = playerState.playlist[index];
        const videoId = extractVideoId(currentTrack.url);

        if (videoId) {
            playerState.player.loadVideoById(videoId);
            playerState.player.playVideo();
            Logger.track('Playing track', currentTrack); // Original: 'Přehrávám skladbu'
        } else {
            Logger.error('Invalid video ID', currentTrack.url); // Original: 'Neplatné video ID'
            Logger.info('⏭️ Skipping to the next track...'); // Original: '⏭️ Přeskakuji na další skladbu...'
            nextTrack();
        }
    } else {
        Logger.warning('⏳ Player is not ready yet'); // Original: '⏳ Přehrávač ještě není připraven'
    }
}

/**
 * Update track information display
 */
function updateTrackInfo() {
    const currentTrack = playerState.playlist[playerState.currentTrackIndex];
    if (!currentTrack) {
        Logger.warning('❌ Current track not found'); // Original: '❌ Aktuální skladba nebyla nalezena'
        return;
    }

    if (elements.songTitle) {
        elements.songTitle.textContent = currentTrack.title;
    }
    if (elements.channelName) {
        elements.channelName.textContent = currentTrack.channel;
    }

    Logger.info(`🎵 Current track: ${currentTrack.title} - ${currentTrack.channel}`); // Original: `🎵 Aktuální skladba: ${currentTrack.title} - ${currentTrack.channel}`
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

/**
 * Toggle play/pause state
 */
function togglePlayPause() {
    if (!playerState.isPlayerReady) {
        Logger.warning('⏳ Player is not ready yet'); // Original: '⏳ Přehrávač ještě není připraven'
        return;
    }

    if (playerState.isPlaying) {
        Logger.info('⏸️ Pausing playback'); // Original: '⏸️ Pozastavuji přehrávání'
        playerState.player.pauseVideo();
    } else {
        // If no video is loaded, start playing current track
        if (playerState.player.getPlayerState() === -1) {
            Logger.info('▶️ Starting current track'); // Original: '▶️ Spouštím aktuální skladbu'
            playTrack(playerState.currentTrackIndex);
        } else {
            Logger.info('▶️ Resuming playback'); // Original: '▶️ Obnovuji přehrávání'
            playerState.player.playVideo();
        }
    }
}

/**
 * Play next track
 */
function nextTrack() {
    if (playerState.playlist.length === 0) {
        Logger.warning('📭 Playlist is empty'); // Original: '📭 Playlist je prázdný'
        return;
    }

    if (playerState.isShuffled) {
        playerState.shufflePosition = (playerState.shufflePosition + 1) % playerState.shuffledIndices.length;

        // Re-shuffle when we complete a cycle
        if (playerState.shufflePosition === 0) {
            shuffleIndices();
            Logger.info('🔄 One cycle completed - playlist was re-shuffled'); // Original: '🔄 Dokončen jeden cyklus - playlist byl znovu zamíchán'
        }

        playerState.currentTrackIndex = playerState.shuffledIndices[playerState.shufflePosition];
    } else {
        playerState.currentTrackIndex = (playerState.currentTrackIndex + 1) % playerState.playlist.length;
    }

    Logger.info(`⏭️ Moving to the next track (${playerState.currentTrackIndex + 1}/${playerState.playlist.length})`); // Original: `⏭️ Přecházím na další skladbu (${playerState.currentTrackIndex + 1}/${playerState.playlist.length})`
    playTrack(playerState.currentTrackIndex);
}

/**
 * Play previous track
 */
function previousTrack() {
    if (playerState.playlist.length === 0) {
        Logger.warning('📭 Playlist is empty'); // Original: '📭 Playlist je prázdný'
        return;
    }

    if (playerState.isShuffled) {
        playerState.shufflePosition = playerState.shufflePosition === 0
            ? playerState.shuffledIndices.length - 1
            : playerState.shufflePosition - 1;
        playerState.currentTrackIndex = playerState.shuffledIndices[playerState.shufflePosition];
    } else {
        playerState.currentTrackIndex = playerState.currentTrackIndex === 0
            ? playerState.playlist.length - 1
            : playerState.currentTrackIndex - 1;
    }

    Logger.info(`⏮️ Moving to the previous track (${playerState.currentTrackIndex + 1}/${playerState.playlist.length})`); // Original: `⏮️ Přecházím na předchozí skladbu (${playerState.currentTrackIndex + 1}/${playerState.playlist.length})`
    playTrack(playerState.currentTrackIndex);
}

/**
 * Toggle shuffle mode
 */
function toggleShuffle() {
    playerState.isShuffled = !playerState.isShuffled;

    if (!elements.shuffleBtn) {
        Logger.warning('🔀 Shuffle button not found'); // Original: '🔀 Shuffle tlačítko nebylo nalezeno'
        return;
    }

    if (playerState.isShuffled) {
        // Enable shuffle
        shuffleIndices();
        playerState.shufflePosition = playerState.shuffledIndices.indexOf(playerState.currentTrackIndex);

        elements.shuffleBtn.textContent = '🔀 Shuffle ON';
        elements.shuffleBtn.style.background = 'rgba(0, 255, 0, 0.3)';

        Logger.shuffle(true, playerState.shuffledIndices);
    } else {
        // Disable shuffle
        elements.shuffleBtn.textContent = '🔀 Shuffle';
        elements.shuffleBtn.style.background = 'rgba(255, 255, 255, 0.2)';

        Logger.shuffle(false);
    }

    updateTrackInfo();
}

/**
 * Initialize the music player
 */
function initializePlayer() {
    Logger.displayHeader();

    Logger.info('🚀 Starting player initialization...'); // Original: '🚀 Spouštím inicializaci přehrávače...'

    initializeElements();
    loadYouTubeAPI();
    loadPlaylist();
    setupVolumeControl();

    Logger.success('✅ Initialization completed!'); // Original: '✅ Inicializace dokončena!'
}

// Initialize player when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlayer);
} else {
    initializePlayer();
}