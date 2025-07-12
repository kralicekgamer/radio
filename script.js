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
 * Initialize DOM elements cache
 */
function initializeElements() {
    elements.playPauseBtn = document.getElementById('playPauseBtn');
    elements.songTitle = document.getElementById('songTitle');
    elements.channelName = document.getElementById('channelName');
    elements.volumeSlider = document.getElementById('volumeSlider');
    elements.volumeValue = document.getElementById('volumeValue');
    elements.shuffleBtn = document.getElementById('shuffleBtn');
}

/**
 * YouTube API ready callback
 */
function onYouTubeIframeAPIReady() {
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
}

/**
 * Player ready event handler
 */
function onPlayerReady(event) {
    playerState.isPlayerReady = true;
    console.log('YouTube player is ready');
    playerState.player.setVolume(DEFAULT_VOLUME);
}

/**
 * Player state change event handler
 */
function onPlayerStateChange(event) {
    switch (event.data) {
        case YT.PlayerState.ENDED:
            nextTrack();
            break;
        case YT.PlayerState.PLAYING:
            updatePlayButton(true);
            break;
        case YT.PlayerState.PAUSED:
            updatePlayButton(false);
            break;
    }
}

/**
 * Player error event handler
 */
function onPlayerError(event) {
    console.error('YouTube player error:', event.data);
    nextTrack(); // Skip to next track on error
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
    const tag = document.createElement('script');
    tag.src = YOUTUBE_API_URL;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

/**
 * Load playlist from YAML file
 */
async function loadPlaylist() {
    try {
        const response = await fetch(PLAYLIST_FILE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        if (!data?.playlist || !Array.isArray(data.playlist)) {
            throw new Error('Invalid YAML format - playlist array not found');
        }

        playerState.playlist = data.playlist;
        initializeShuffleIndices();
        console.log(`Loaded ${playerState.playlist.length} tracks`);

        if (playerState.playlist.length > 0) {
            updateTrackInfo();
        }
    } catch (error) {
        console.error('Error loading playlist:', error);
    }
}

/**
 * Initialize shuffle indices array
 */
function initializeShuffleIndices() {
    playerState.shuffledIndices = Array.from({ length: playerState.playlist.length }, (_, i) => i);
    playerState.shufflePosition = 0;
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
}

/**
 * Setup volume control slider
 */
function setupVolumeControl() {
    if (!elements.volumeSlider || !elements.volumeValue) return;

    elements.volumeSlider.addEventListener('input', (event) => {
        const volume = parseInt(event.target.value);
        elements.volumeValue.textContent = volume;

        if (playerState.isPlayerReady) {
            playerState.player.setVolume(volume);
        }
    });

    // Set initial volume display
    elements.volumeValue.textContent = DEFAULT_VOLUME;
}

/**
 * Play specific track by index
 */
function playTrack(index) {
    if (index < 0 || index >= playerState.playlist.length) return;

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
            console.log('Playing:', currentTrack.title);
            console.log('URL:', currentTrack.url);
        } else {
            console.error('Invalid video ID for:', currentTrack.url);
            nextTrack(); // Skip to next track if current is invalid
        }
    }
}

/**
 * Update track information display
 */
function updateTrackInfo() {
    const currentTrack = playerState.playlist[playerState.currentTrackIndex];
    if (!currentTrack) return;

    if (elements.songTitle) {
        elements.songTitle.textContent = currentTrack.title;
    }
    if (elements.channelName) {
        elements.channelName.textContent = currentTrack.channel;
    }
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
    if (!playerState.isPlayerReady) return;

    if (playerState.isPlaying) {
        playerState.player.pauseVideo();
    } else {
        // If no video is loaded, start playing current track
        if (playerState.player.getPlayerState() === -1) {
            playTrack(playerState.currentTrackIndex);
        } else {
            playerState.player.playVideo();
        }
    }
}

/**
 * Play next track
 */
function nextTrack() {
    if (playerState.playlist.length === 0) return;

    if (playerState.isShuffled) {
        playerState.shufflePosition = (playerState.shufflePosition + 1) % playerState.shuffledIndices.length;
        
        // Re-shuffle when we complete a cycle
        if (playerState.shufflePosition === 0) {
            shuffleIndices();
            console.log('New cycle - playlist reshuffled');
        }
        
        playerState.currentTrackIndex = playerState.shuffledIndices[playerState.shufflePosition];
    } else {
        playerState.currentTrackIndex = (playerState.currentTrackIndex + 1) % playerState.playlist.length;
    }
    
    playTrack(playerState.currentTrackIndex);
}

/**
 * Play previous track
 */
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

/**
 * Toggle shuffle mode
 */
function toggleShuffle() {
    playerState.isShuffled = !playerState.isShuffled;
    
    if (!elements.shuffleBtn) return;

    if (playerState.isShuffled) {
        // Enable shuffle
        shuffleIndices();
        playerState.shufflePosition = playerState.shuffledIndices.indexOf(playerState.currentTrackIndex);
        
        elements.shuffleBtn.textContent = '🔀 Shuffle ON';
        elements.shuffleBtn.style.background = 'rgba(0, 255, 0, 0.3)';
        
        console.log('Shuffle enabled - unique shuffled playlist created');
        console.log('Shuffle order:', playerState.shuffledIndices);
    } else {
        // Disable shuffle
        elements.shuffleBtn.textContent = '🔀 Shuffle';
        elements.shuffleBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        
        console.log('Shuffle disabled - returning to original order');
    }

    updateTrackInfo();
}

/**
 * Initialize the music player
 */
function initializePlayer() {
    initializeElements();
    loadYouTubeAPI();
    loadPlaylist();
    setupVolumeControl();
}

// Initialize player when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlayer);
} else {
    initializePlayer();
}