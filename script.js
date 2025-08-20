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

// DOM element cache
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

// Simple logging
function log(message) {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${message}`);
}

function initializeElements() {
    log('Initializing DOM elements...');
    
    elements.playPauseBtn = document.getElementById('playPauseBtn');
    elements.songTitle = document.getElementById('songTitle');
    elements.channelName = document.getElementById('channelName');
    elements.volumeSlider = document.getElementById('volumeSlider');
    elements.volumeValue = document.getElementById('volumeValue');
    elements.shuffleBtn = document.getElementById('shuffleBtn');

    log('DOM elements initialized');
}

// YouTube API ready callback
function onYouTubeIframeAPIReady() {
    log('YouTube API ready, creating player...');

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

    log('YouTube player created');
}

// Player ready event handler
function onPlayerReady(event) {
    playerState.isPlayerReady = true;
    playerState.player.setVolume(DEFAULT_VOLUME);
    log('Player ready');
    setupMediaSession();
}

// Player state change event handler
function onPlayerStateChange(event) {
    switch (event.data) {
        case YT.PlayerState.ENDED:
            log('Track ended, playing next...');
            nextTrack();
            break;
        case YT.PlayerState.PLAYING:
            log('Playing');
            playerState.isPlaying = true;
            updatePlayButton(true);
            updateMediaSession();
            break;
        case YT.PlayerState.PAUSED:
            log('Paused');
            playerState.isPlaying = false;
            updatePlayButton(false);
            updateMediaSession();
            break;
        case YT.PlayerState.BUFFERING:
            log('Loading...');
            break;
    }
}

// Player error event handler
function onPlayerError(event) {
    log(`YouTube error: ${event.data}, skipping...`);
    nextTrack();
}

// Update play/pause button
function updatePlayButton(isPlaying) {
    if (elements.playPauseBtn) {
        elements.playPauseBtn.innerHTML = isPlaying
            ? '<i class="fa-solid fa-pause"></i>'
            : '<i class="fa-solid fa-play"></i>';
    }
}

// Load YouTube API script
function loadYouTubeAPI() {
    log('Loading YouTube API...');
    const tag = document.createElement('script');
    tag.src = YOUTUBE_API_URL;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Load playlist from YAML file
async function loadPlaylist() {
    log('Loading playlist...');
    
    try {
        const response = await fetch(PLAYLIST_FILE);
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        if (!data?.playlist || !Array.isArray(data.playlist)) {
            throw new Error('Invalid playlist format');
        }

        playerState.playlist = data.playlist;
        initializeShuffleIndices();
        
        log(`Playlist loaded: ${playerState.playlist.length} tracks`);
        
        if (playerState.playlist.length > 0) {
            updateTrackInfo();
        }
    } catch (error) {
        log(`Playlist load error: ${error.message}`);
    }
}

// Initialize shuffle indices
function initializeShuffleIndices() {
    playerState.shuffledIndices = Array.from({ length: playerState.playlist.length }, (_, i) => i);
    playerState.shufflePosition = 0;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleIndices() {
    const indices = playerState.shuffledIndices;
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
}

// Setup volume control
function setupVolumeControl() {
    if (!elements.volumeSlider || !elements.volumeValue) return;

    log('Setting up volume control...');

    elements.volumeSlider.addEventListener('input', (event) => {
        const volume = parseInt(event.target.value);
        elements.volumeValue.textContent = volume + '%';

        if (playerState.isPlayerReady) {
            playerState.player.setVolume(volume);
        }
    });

    elements.volumeValue.textContent = DEFAULT_VOLUME + '%';
}

// Play specific track by index
function playTrack(index) {
    if (index < 0 || index >= playerState.playlist.length) return;

    playerState.currentTrackIndex = index;

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
            log(`Playing: ${currentTrack.title}`);
        } else {
            log('Invalid video ID, skipping...');
            nextTrack();
        }
    }
}

// Update track information display
function updateTrackInfo() {
    const currentTrack = playerState.playlist[playerState.currentTrackIndex];
    if (!currentTrack) return;

    if (elements.songTitle) {
        elements.songTitle.textContent = currentTrack.title;
    }
    if (elements.channelName) {
        elements.channelName.textContent = currentTrack.channel;
    }

    updateMediaSession();
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// Toggle play/pause
function togglePlayPause() {
    if (!playerState.isPlayerReady) return;

    if (playerState.isPlaying) {
        playerState.player.pauseVideo();
    } else {
        if (playerState.player.getPlayerState() === -1) {
            playTrack(playerState.currentTrackIndex);
        } else {
            playerState.player.playVideo();
        }
    }
}

// Play next track
function nextTrack() {
    if (playerState.playlist.length === 0) return;

    if (playerState.isShuffled) {
        playerState.shufflePosition = (playerState.shufflePosition + 1) % playerState.shuffledIndices.length;

        if (playerState.shufflePosition === 0) {
            shuffleIndices();
        }

        playerState.currentTrackIndex = playerState.shuffledIndices[playerState.shufflePosition];
    } else {
        playerState.currentTrackIndex = (playerState.currentTrackIndex + 1) % playerState.playlist.length;
    }

    playTrack(playerState.currentTrackIndex);
}

// Play previous track
function previousTrack() {
    if (playerState.playlist.length === 0) return;

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

    playTrack(playerState.currentTrackIndex);
}

// Toggle shuffle mode
function toggleShuffle() {
    playerState.isShuffled = !playerState.isShuffled;

    if (elements.shuffleBtn) {
        if (playerState.isShuffled) {
            shuffleIndices();
            playerState.shufflePosition = playerState.shuffledIndices.indexOf(playerState.currentTrackIndex);
            elements.shuffleBtn.classList.add('active');
            log('Shuffle ON');
        } else {
            elements.shuffleBtn.classList.remove('active');
            log('Shuffle OFF');
        }
    }
}

// Setup keyboard shortcuts - SIMPLE VERSION
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

        switch (event.key) {
            case ' ':
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
            case 's':
            case 'S':
                event.preventDefault();
                toggleShuffle();
                break;
        }
    });

    log('Keyboard shortcuts ready');
}

// Setup Media Session for background playback on mobile
function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    log('Setting up media session for background playback...');

    // Action handlers
    navigator.mediaSession.setActionHandler('play', () => {
        if (!playerState.isPlaying && playerState.isPlayerReady) {
            if (playerState.player.getPlayerState() === -1) {
                playTrack(playerState.currentTrackIndex);
            } else {
                playerState.player.playVideo();
            }
        }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        if (playerState.isPlaying && playerState.isPlayerReady) {
            playerState.player.pauseVideo();
        }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        previousTrack();
    });

    updateMediaSession();
    log('Media session ready');
}

// Update media session metadata and state
function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const currentTrack = playerState.playlist[playerState.currentTrackIndex];
    if (!currentTrack) return;

    // Update metadata
    navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.channel,
        album: 'Hardstyle Radio',
        artwork: [
            { src: 'https://via.placeholder.com/96x96/e74c3c/white?text=🎵', sizes: '96x96', type: 'image/png' },
            { src: 'https://via.placeholder.com/128x128/e74c3c/white?text=🎵', sizes: '128x128', type: 'image/png' },
            { src: 'https://via.placeholder.com/256x256/e74c3c/white?text=🎵', sizes: '256x256', type: 'image/png' },
            { src: 'https://via.placeholder.com/512x512/e74c3c/white?text=🎵', sizes: '512x512', type: 'image/png' }
        ]
    });

    // Update playback state
    navigator.mediaSession.playbackState = playerState.isPlaying ? 'playing' : 'paused';
}

// Keep screen wake for mobile - helps with background playback
function keepScreenWake() {
    if ('wakeLock' in navigator) {
        let wakeLock = null;
        
        const requestWakeLock = async () => {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                log('Screen wake lock activated');
                
                wakeLock.addEventListener('release', () => {
                    log('Screen wake lock released');
                });
            } catch (err) {
                log('Wake lock failed: ' + err.message);
            }
        };

        document.addEventListener('click', requestWakeLock, { once: true });
    }
}

// Initialize the music player
function initializePlayer() {
    console.clear();
    log('🎵 HARDSTYLE RADIO STARTING...');

    initializeElements();
    loadYouTubeAPI();
    loadPlaylist();
    setupVolumeControl();
    setupKeyboardShortcuts();
    keepScreenWake();

    log('🎵 READY TO ROCK!');
}

// Initialize player when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlayer);
} else {
    initializePlayer();
}