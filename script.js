let playlist = [];
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffled = false;
let shuffledIndices = []; // Array indexů pro zamíchaný playlist
let shufflePosition = 0; // Aktuální pozice v zamíchaném playlistu
let player;
let isPlayerReady = false;

// YouTube API
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'disablekb': 1,
            'enablejsapi': 1,
            'fs': 0,
            'iv_load_policy': 3,
            'modestbranding': 1,
            'playsinline': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    isPlayerReady = true;
    console.log('YouTube přehrávač je připraven');

    // Nastavit výchozí hlasitost
    player.setVolume(50);
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        nextTrack();
    } else if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        document.getElementById('playPauseBtn').innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else if (event.data == YT.PlayerState.PAUSED) {
        isPlaying = false;
        document.getElementById('playPauseBtn').innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

function onPlayerError(event) {
    console.error('Chyba při přehrávání videa:', event.data);
    nextTrack();
}

// Načtení YouTube API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Funkce pro načtení playlistu
async function loadPlaylist() {
    try {
        const response = await fetch('music.yaml');
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        if (data && data.playlist && Array.isArray(data.playlist)) {
            playlist = data.playlist;
            initializeShuffleIndices();
            console.log(`Načteno ${playlist.length} skladeb`);

            if (playlist.length > 0) {
                updateTrackInfo();
            }
        } else {
            throw new Error('Neplatný formát YAML souboru');
        }
    } catch (error) {
        console.error('Chyba při načítání playlistu:', error);
    }
}

// Funkce pro inicializaci indexů pro shuffle
function initializeShuffleIndices() {
    shuffledIndices = [];
    for (let i = 0; i < playlist.length; i++) {
        shuffledIndices.push(i);
    }
    shufflePosition = 0;
}

// Funkce pro zamíchání indexů (Fisher-Yates shuffle)
function shuffleIndices() {
    for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
    }
}

// Funkce pro ovládání hlasitosti
function setupVolumeControl() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');

    volumeSlider.addEventListener('input', function () {
        const volume = this.value;
        volumeValue.textContent = volume;

        if (isPlayerReady) {
            player.setVolume(volume);
        }
    });
}

// Funkce pro přehrání konkrétní skladby
function playTrack(index) {
    if (index >= 0 && index < playlist.length) {
        currentTrackIndex = index;
        
        // Pokud je shuffle zapnutý, najdi pozici v shuffled playlistu
        if (isShuffled) {
            shufflePosition = shuffledIndices.indexOf(index);
        }
        
        updateTrackInfo();

        if (isPlayerReady) {
            const currentTrack = playlist[currentTrackIndex];
            const videoId = extractVideoId(currentTrack.url);

            if (videoId) {
                player.loadVideoById(videoId);
                player.playVideo();
                console.log('Přehrává se:', currentTrack.title);
                console.log('Link:', currentTrack.url);
            } else {
                console.error('Neplatné video ID pro:', currentTrack.url);
            }
        }
    }
}

// Funkce pro aktualizaci informací o skladbě
function updateTrackInfo() {
    const currentTrack = playlist[currentTrackIndex];
    if (currentTrack) {
        document.getElementById('songTitle').textContent = currentTrack.title;
        document.getElementById('channelName').textContent = currentTrack.channel;
    }
}

// Funkce pro extrakci ID videa z YouTube URL
function extractVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : null;
}

// Ovládací funkce
function togglePlayPause() {
    if (!isPlayerReady) return;

    if (isPlaying) {
        player.pauseVideo();
    } else {
        if (player.getPlayerState() === -1) {
            // Pokud není načteno žádné video, začni první skladbu
            playTrack(currentTrackIndex);
        } else {
            player.playVideo();
        }
    }
}

function nextTrack() {
    if (playlist.length === 0) return;

    if (isShuffled) {
        shufflePosition = (shufflePosition + 1) % shuffledIndices.length;
        
        // Pokud jsme prošli celý zamíchaný playlist, zamíchej znovu
        if (shufflePosition === 0) {
            shuffleIndices();
            console.log('Nový cyklus - playlist znovu zamíchán');
        }
        
        currentTrackIndex = shuffledIndices[shufflePosition];
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    }
    
    playTrack(currentTrackIndex);
}

function previousTrack() {
    if (playlist.length === 0) return;

    if (isShuffled) {
        shufflePosition = shufflePosition === 0 ? 
            shuffledIndices.length - 1 : shufflePosition - 1;
        currentTrackIndex = shuffledIndices[shufflePosition];
    } else {
        currentTrackIndex = currentTrackIndex === 0 ? 
            playlist.length - 1 : currentTrackIndex - 1;
    }
    
    playTrack(currentTrackIndex);
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    const shuffleBtn = document.getElementById('shuffleBtn');

    if (isShuffled) {
        // Zapnout shuffle
        shuffleIndices();
        
        // Najít aktuální skladbu v zamíchaném seznamu
        shufflePosition = shuffledIndices.indexOf(currentTrackIndex);
        
        shuffleBtn.textContent = '🔀 Shuffle ON';
        shuffleBtn.style.background = 'rgba(0, 255, 0, 0.3)';
        
        console.log('Shuffle zapnut - vytvořen unikátní zamíchaný playlist');
        console.log('Shuffle pořadí:', shuffledIndices);
    } else {
        // Vypnout shuffle
        shuffleBtn.textContent = '🔀 Shuffle';
        shuffleBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        
        console.log('Shuffle vypnut - návrat k původnímu pořadí');
    }

    updateTrackInfo();
}

function updateStatus(message, type = '') {
    // Prázdná funkce - chyby jdou do konzole
}

// Inicializace
loadPlaylist();
setupVolumeControl();