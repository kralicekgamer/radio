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

    displayHeader() {
        console.clear();
        this.info('🚀 Application is starting...');
        this.info('📱 This is the developer console - you will see all system messages here');
        this.separator();
    },

    success(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] ✅ ${message}`, `color: ${this.colors.success}; font-weight: bold`);
        if (data) {
            console.log(`%c└─ Data:`, `color: ${this.colors.muted}`, data);
        }
    },

    info(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] ℹ️  ${message}`, `color: ${this.colors.info}; font-weight: bold`);
        if (data) {
            console.log(`%c└─ Data:`, `color: ${this.colors.muted}`, data);
        }
    },

    warning(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] ⚠️  ${message}`, `color: ${this.colors.warning}; font-weight: bold`);
        if (data) {
            console.log(`%c└─ Data:`, `color: ${this.colors.muted}`, data);
        }
    },

    error(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] ❌ ${message}`, `color: ${this.colors.error}; font-weight: bold`);
        if (data) {
            console.log(`%c└─ Error:`, `color: ${this.colors.muted}`, data);
        }
    },

    track(action, track) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] 🎵 ${action}`, `color: ${this.colors.primary}; font-weight: bold`);
        console.log(`%c├─ Title: ${track.title}`, `color: ${this.colors.muted}`);
        console.log(`%c├─ Channel: ${track.channel}`, `color: ${this.colors.muted}`);
        console.log(`%c└─ URL: ${track.url}`, `color: ${this.colors.muted}`);
    },

    playlist(action, count, details = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[${timestamp}] 📋 ${action} (${count} tracks)`, `color: ${this.colors.primary}; font-weight: bold`);
        if (details) {
            console.log(`%c└─ Detail:`, `color: ${this.colors.muted}`, details);
        }
    },

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

    shuffle(enabled, order = null) {
        const timestamp = new Date().toLocaleTimeString();
        const status = enabled ? 'ON' : 'OFF';
        const emoji = enabled ? '🔀' : '📋';
        console.log(`%c[${timestamp}] ${emoji} Shuffle: ${status}`, `color: ${this.colors.primary}; font-weight: bold`);
        if (order && enabled) {
            console.log(`%c└─ New order:`, `color: ${this.colors.muted}`, order);
        }
    },

    separator() {
        console.log('%c' + '─'.repeat(120), `color: ${this.colors.muted}`);
    },

    status() {
        this.separator();
        console.log(`%c📊 CURRENT PLAYER STATUS`, `color: ${this.colors.primary}; font-weight: bold; font-size: 14px`);
        console.log(`%c├─ Playlist: ${playerState.playlist.length} tracks`, `color: ${this.colors.muted}`);
        console.log(`%c├─ Current index: ${playerState.currentTrackIndex + 1}/${playerState.playlist.length}`, `color: ${this.colors.muted}`);
        console.log(`%c├─ Playing: ${playerState.isPlaying ? 'YES' : 'NO'}`, `color: ${this.colors.muted}`);
        console.log(`%c├─ Shuffle: ${playerState.isShuffled ? 'ON' : 'OFF'}`, `color: ${this.colors.muted}`);
        console.log(`%c└─ API connected: ${playerState.isPlayerReady ? 'YES' : 'NO'}`, `color: ${this.colors.muted}`);
        this.separator();
    }
};

/**
 * Initialize DOM elements cache
 */
function initializeElements() {
    Logger.info('🔧 Initializing DOM elements...');

    elements.playPauseBtn = document.getElementById('playPauseBtn');
    elements.songTitle = document.getElementById('songTitle');
    elements.channelName = document.getElementById('channelName');
    elements.volumeSlider = document.getElementById('volumeSlider');
    elements.volumeValue = document.getElementById('volumeValue');
    elements.shuffleBtn = document.getElementById('shuffleBtn');

    const foundElements = Object.values(elements).filter(el => el !== null).length;
    Logger.success(`🎯 Found ${foundElements}/${Object.keys(elements).length} DOM elements`);
}

/**
 * YouTube API ready callback
 */
function onYouTubeIframeAPIReady() {
    Logger.info('🔌 YouTube API is ready, creating player...');

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

    Logger.success('🎮 YouTube player has been created');
}

/**
 * Player ready event handler
 */
function onPlayerReady(event) {
    playerState.isPlayerReady = true;
    Logger.playerState('READY', `Default volume set to ${DEFAULT_VOLUME}%`);
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
            Logger.playerState('ENDED', 'Moving to the next track');
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
            Logger.playerState('LOADING', 'Loading video data...');
            break;
    }
}

/**
 * Player error event handler
 */
function onPlayerError(event) {
    const errorMessages = {
        2: 'Invalid video ID',
        5: 'HTML5 player cannot play the video',
        100: 'Video not found',
        101: 'Video owner has forbidden playback in embedded player',
        150: 'Video owner has forbidden playback in embedded player'
    };

    const errorMsg = errorMessages[event.data] || `Unknown error (${event.data})`;
    Logger.error(`YouTube error: ${errorMsg}`);
    Logger.info('⏭️ Skipping to the next track...');
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
    Logger.info('📡 Loading YouTube API...');

    const tag = document.createElement('script');
    tag.src = YOUTUBE_API_URL;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    Logger.success('✅ YouTube API script has been added to the page');
}

/**
 * Load playlist from YAML file
 */
async function loadPlaylist() {
    Logger.info(`📁 Loading playlist from file: ${PLAYLIST_FILE}`);

    try {
        const response = await fetch(PLAYLIST_FILE);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        if (!data?.playlist || !Array.isArray(data.playlist)) {
            throw new Error('Invalid YAML format - playlist array not found');
        }

        playerState.playlist = data.playlist;
        initializeShuffleIndices();

        Logger.playlist('Playlist loaded', playerState.playlist.length, {
            'First track': playerState.playlist[0]?.title || 'N/A',
            'Last track': playerState.playlist[playerState.playlist.length - 1]?.title || 'N/A'
        });

        if (playerState.playlist.length > 0) {
            updateTrackInfo();
        }

        Logger.status();
    } catch (error) {
        Logger.error('Error loading playlist', error);
    }
}

/**
 * Initialize shuffle indices array
 */
function initializeShuffleIndices() {
    playerState.shuffledIndices = Array.from({ length: playerState.playlist.length }, (_, i) => i);
    playerState.shufflePosition = 0;
    Logger.info('🔢 Initializing shuffle indices', playerState.shuffledIndices);
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
    Logger.info('🎲 Playlist was shuffled using the Fisher-Yates algorithm');
}

/**
 * Setup volume control slider
 */
function setupVolumeControl() {
    if (!elements.volumeSlider || !elements.volumeValue) {
        Logger.warning('🔊 Volume controls were not found in DOM');
        return;
    }

    Logger.info('🔊 Setting up volume control...');

    elements.volumeSlider.addEventListener('input', (event) => {
        const volume = parseInt(event.target.value);
        elements.volumeValue.textContent = volume + '%';

        if (playerState.isPlayerReady) {
            playerState.player.setVolume(volume);
            Logger.info(`🔊 Volume changed to ${volume}%`);
        }
    });

    // Set initial volume display
    elements.volumeValue.textContent = DEFAULT_VOLUME + '%';
    Logger.success('🔊 Volume control has been set up');
}

/**
 * Play specific track by index
 */
function playTrack(index) {
    if (index < 0 || index >= playerState.playlist.length) {
        Logger.error(`❌ Invalid track index: ${index}`);
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
            Logger.track('Playing track', currentTrack);
        } else {
            Logger.error('Invalid video ID', currentTrack.url);
            Logger.info('⏭️ Skipping to the next track...');
            nextTrack();
        }
    } else {
        Logger.warning('⏳ Player is not ready yet');
    }
}

/**
 * Update track information display
 */
function updateTrackInfo() {
    const currentTrack = playerState.playlist[playerState.currentTrackIndex];
    if (!currentTrack) {
        Logger.warning('❌ Current track not found');
        return;
    }

    if (elements.songTitle) {
        elements.songTitle.textContent = currentTrack.title;
    }
    if (elements.channelName) {
        elements.channelName.textContent = currentTrack.channel;
    }

    Logger.info(`🎵 Current track: ${currentTrack.title} - ${currentTrack.channel}`);
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
        Logger.warning('⏳ Player is not ready yet');
        return;
    }

    if (playerState.isPlaying) {
        Logger.info('⏸️ Pausing playback');
        playerState.player.pauseVideo();
    } else {
        // If no video is loaded, start playing current track
        if (playerState.player.getPlayerState() === -1) {
            Logger.info('▶️ Starting current track');
            playTrack(playerState.currentTrackIndex);
        } else {
            Logger.info('▶️ Resuming playback');
            playerState.player.playVideo();
        }
    }
}

/**
 * Play next track
 */
function nextTrack() {
    if (playerState.playlist.length === 0) {
        Logger.warning('📭 Playlist is empty');
        return;
    }

    if (playerState.isShuffled) {
        playerState.shufflePosition = (playerState.shufflePosition + 1) % playerState.shuffledIndices.length;

        // Re-shuffle when we complete a cycle
        if (playerState.shufflePosition === 0) {
            shuffleIndices();
            Logger.info('🔄 One cycle completed - playlist was re-shuffled');
        }

        playerState.currentTrackIndex = playerState.shuffledIndices[playerState.shufflePosition];
    } else {
        playerState.currentTrackIndex = (playerState.currentTrackIndex + 1) % playerState.playlist.length;
    }

    Logger.info(`⏭️ Moving to the next track (${playerState.currentTrackIndex + 1}/${playerState.playlist.length})`);
    playTrack(playerState.currentTrackIndex);
}

/**
 * Play previous track
 */
function previousTrack() {
    if (playerState.playlist.length === 0) {
        Logger.warning('📭 Playlist is empty');
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

    Logger.info(`⏮️ Moving to the previous track (${playerState.currentTrackIndex + 1}/${playerState.playlist.length})`);
    playTrack(playerState.currentTrackIndex);
}

/**
 * Toggle shuffle mode
 */
function toggleShuffle() {
    playerState.isShuffled = !playerState.isShuffled;

    if (!elements.shuffleBtn) {
        Logger.warning('🔀 Shuffle button not found');
        return;
    }

    if (playerState.isShuffled) {
        // Enable shuffle
        shuffleIndices();
        playerState.shufflePosition = playerState.shuffledIndices.indexOf(playerState.currentTrackIndex);
        elements.shuffleBtn.classList.add('active');
        Logger.shuffle(true, playerState.shuffledIndices);
    } else {
        // Disable shuffle
        elements.shuffleBtn.classList.remove('active');
        Logger.shuffle(false);
    }

    updateTrackInfo();
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Skip if user is typing in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowRight':
                event.preventDefault();
                nextTrack();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                previousTrack();
                break;
            case 'KeyS':
                event.preventDefault();
                toggleShuffle();
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (elements.volumeSlider) {
                    const currentVolume = parseInt(elements.volumeSlider.value);
                    const newVolume = Math.min(100, currentVolume + 5);
                    elements.volumeSlider.value = newVolume;
                    elements.volumeSlider.dispatchEvent(new Event('input'));
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (elements.volumeSlider) {
                    const currentVolume = parseInt(elements.volumeSlider.value);
                    const newVolume = Math.max(0, currentVolume - 5);
                    elements.volumeSlider.value = newVolume;
                    elements.volumeSlider.dispatchEvent(new Event('input'));
                }
                break;
        }
    });

    Logger.success('⌨️ Keyboard shortcuts have been set up');
    Logger.info('⌨️ Shortcuts: Space=Play/Pause, ←/→=Prev/Next, ↑/↓=Volume, S=Shuffle');
}

/**
 * Setup media session API for background play and media controls
 */
function setupMediaSession() {
    if (!('mediaSession' in navigator)) {
        Logger.warning('📱 Media Session API is not supported');
        return;
    }

    Logger.info('📱 Setting up Media Session API...');

    // Set action handlers
    navigator.mediaSession.setActionHandler('play', () => {
        togglePlayPause();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        togglePlayPause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        previousTrack();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
    });

    Logger.success('📱 Media Session API has been set up');
}

/**
 * Update media session metadata
 */
function updateMediaSessionMetadata() {
    if (!('mediaSession' in navigator)) return;

    const currentTrack = playerState.playlist[playerState.currentTrackIndex];
    if (!currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.channel,
        album: 'Hardstyle Radio',
        artwork: [
            { src: 'https://via.placeholder.com/96x96?text=HR', sizes: '96x96', type: 'image/png' },
            { src: 'https://via.placeholder.com/128x128?text=HR', sizes: '128x128', type: 'image/png' },
            { src: 'https://via.placeholder.com/192x192?text=HR', sizes: '192x192', type: 'image/png' },
            { src: 'https://via.placeholder.com/256x256?text=HR', sizes: '256x256', type: 'image/png' },
            { src: 'https://via.placeholder.com/384x384?text=HR', sizes: '384x384', type: 'image/png' },
            { src: 'https://via.placeholder.com/512x512?text=HR', sizes: '512x512', type: 'image/png' }
        ]
    });

    Logger.info('📱 Media session metadata updated');
}

/**
 * Initialize the music player
 */
function initializePlayer() {
    Logger.displayHeader();

    Logger.info('🚀 Starting player initialization...');

    initializeElements();
    loadYouTubeAPI();
    loadPlaylist();
    setupVolumeControl();
    setupKeyboardShortcuts();
    setupMediaSession();

    Logger.success('✅ Initialization completed!');
}

// Override the updateTrackInfo function to also update media session
const originalUpdateTrackInfo = updateTrackInfo;
updateTrackInfo = function () {
    originalUpdateTrackInfo();
    updateMediaSessionMetadata();
};

// Initialize player when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlayer);
} else {
    initializePlayer();
}