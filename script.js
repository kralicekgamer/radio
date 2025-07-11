let playlist = [];
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffled = false;
let shuffledPlaylist = [];
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
        document.getElementById('playPauseBtn').textContent = '⏸️ Pauza';
    } else if (event.data == YT.PlayerState.PAUSED) {
        isPlaying = false;
        document.getElementById('playPauseBtn').textContent = '▶️ Přehrát';
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
            shuffledPlaylist = [...playlist];
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
    if (index >= 0 && index < getCurrentPlaylist().length) {
        currentTrackIndex = index;
        updateTrackInfo();

        if (isPlayerReady) {
            const currentTrack = getCurrentPlaylist()[currentTrackIndex];
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
    const currentTrack = getCurrentPlaylist()[currentTrackIndex];
    if (currentTrack) {
        document.getElementById('songTitle').textContent = currentTrack.title;
        document.getElementById('channelName').textContent = currentTrack.channel;
        document.getElementById('trackInfo').textContent =
            `${currentTrackIndex + 1} / ${getCurrentPlaylist().length}`;
    }
}

// Funkce pro získání aktuálního playlistu
function getCurrentPlaylist() {
    return isShuffled ? shuffledPlaylist : playlist;
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
    const currentPlaylist = getCurrentPlaylist();
    if (currentPlaylist.length === 0) return;

    currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
    playTrack(currentTrackIndex);
}

function previousTrack() {
    const currentPlaylist = getCurrentPlaylist();
    if (currentPlaylist.length === 0) return;

    currentTrackIndex = currentTrackIndex === 0 ?
        currentPlaylist.length - 1 : currentTrackIndex - 1;
    playTrack(currentTrackIndex);
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    const shuffleBtn = document.getElementById('shuffleBtn');

    if (isShuffled) {
        // Zamíchat playlist
        shuffledPlaylist = [...playlist];
        for (let i = shuffledPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlaylist[i], shuffledPlaylist[j]] = [shuffledPlaylist[j], shuffledPlaylist[i]];
        }
        shuffleBtn.textContent = '🔀 Shuffle ON';
        shuffleBtn.style.background = 'rgba(0, 255, 0, 0.3)';

        // Najít aktuální skladbu v zamíchaném playlistu
        const currentTrack = playlist[currentTrackIndex];
        currentTrackIndex = shuffledPlaylist.findIndex(track =>
            track.url === currentTrack.url);

        console.log('Shuffle zapnut');
    } else {
        // Vrátit původní playlist
        const currentTrack = shuffledPlaylist[currentTrackIndex];
        currentTrackIndex = playlist.findIndex(track =>
            track.url === currentTrack.url);
        shuffleBtn.textContent = '🔀 Shuffle';
        shuffleBtn.style.background = 'rgba(255, 255, 255, 0.2)';

        console.log('Shuffle vypnut');
    }

    updateTrackInfo();
}

function updateStatus(message, type = '') {
    // Prázdná funkce - chyby jdou do konzole
}

// Inicializace
loadPlaylist();
setupVolumeControl();