// ========================================
// IMPORTS
// ========================================

import { IndependentMusicPlayer } from './independent-music-player.js';

// ========================================
// STATE MANAGEMENT
// ========================================

const state = {
    temperature: 78,
    isLighting: false,
    lightDimmer: 100,
    isPlaying: false,
    spotifyEnabled: false,
    currentService: 'independent',
    independentPlayer: null,
};

// ========================================
// INITIALIZATION & EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // ========================================
    // DOM ELEMENTS (Load after DOM is ready)
    // ========================================
    
    const elements = {
        toggleLights: document.getElementById('toggleLights'),
        lightingStatus: document.getElementById('lightingStatus'),
        lightDimmer: document.getElementById('lightDimmer'),
        dimmerValue: document.getElementById('dimmerValue'),
        temperatureDisplay: document.getElementById('temperatureDisplay'),
        increaseTemp: document.getElementById('increaseTemp'),
        decreaseTemp: document.getElementById('decreaseTemp'),
        playPause: document.getElementById('playPause'),
        nextTrack: document.getElementById('nextTrack'),
        previousTrack: document.getElementById('previousTrack'),
        songName: document.getElementById('songName'),
        songAlbum: document.getElementById('songAlbum'),
        songImage: document.getElementById('songImage'),
        musicServiceSelect: document.getElementById('musicServiceSelect'),
    };
    
    // ========================================
    // UTILITY FUNCTIONS (Define before use!)
    // ========================================
    
    const updateTemperatureDisplay = () => {
        elements.temperatureDisplay.textContent = `${state.temperature}°F`;
    };
    
    const updateLightingStatus = () => {
        state.isLighting = elements.toggleLights.checked;
        elements.lightingStatus.textContent = state.isLighting ? 'On' : 'Off';
    };

    const updateSpotifyStatus = () => {
        const isAuth = spotifyPlayer.isAuthenticated;
        state.spotifyEnabled = isAuth;
    };

    const updateNowPlaying = () => {
        const songDisplayElement = document.querySelector('.song-display');
        
        if (state.currentService === 'spotify') {
            const trackInfo = spotifyPlayer.getCurrentTrackInfo();
            elements.songName.textContent = trackInfo.name || 'Not Playing';
            elements.songAlbum.textContent = trackInfo.album || 'Spotify';
            
            if (trackInfo.imageUrl) {
                elements.songImage.innerHTML = `<img src="${trackInfo.imageUrl}" alt="Album art">`;
            } else {
                elements.songImage.innerHTML = '<i class="fas fa-music"></i>';
            }
            if (songDisplayElement) songDisplayElement.style.display = 'flex';
        } else if (state.currentService === 'independent' && state.independentPlayer) {
            const track = state.independentPlayer.currentTrack;
            if (track) {
                elements.songName.textContent = track.title || 'Unknown Track';
                elements.songAlbum.textContent = track.artist || 'Independent Artist';
                
                if (track.artwork) {
                    elements.songImage.innerHTML = `<img src="${track.artwork}" alt="Album art">`;
                } else {
                    elements.songImage.innerHTML = '<i class="fas fa-music"></i>';
                }
                if (songDisplayElement) songDisplayElement.style.display = 'flex';
            } else {
                if (songDisplayElement) songDisplayElement.style.display = 'none';
            }
        } else {
            if (songDisplayElement) songDisplayElement.style.display = 'none';
        }
        
        // Update play button
        let isPlaying = false;
        if (state.currentService === 'spotify') {
            isPlaying = spotifyPlayer.isPlaying;
        } else if (state.currentService === 'independent' && state.independentPlayer) {
            isPlaying = state.independentPlayer.isPlaying;
        }
        
        if (isPlaying) {
            elements.playPause.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
        } else {
            elements.playPause.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
        }
    };

    const refreshPlaybackState = async () => {
        try {
            if (state.currentService === 'spotify' && state.spotifyEnabled) {
                await spotifyPlayer.getPlaybackState();
            } else if (state.currentService === 'independent' && state.independentPlayer) {
                // Independent player updates internally
            }
            
            updateNowPlaying();
        } catch (error) {
            console.error('Error refreshing playback state:', error);
        }
    };
    
    // ========================================
    // INITIALIZE SPOTIFY AND STATUS
    // ========================================
    
    // Initialize Spotify
    await spotifyPlayer.init();
    updateSpotifyStatus();
    
    // Initialize displays
    updateTemperatureDisplay();
    updateLightingStatus();
    
    // ========================================
    // EVENT LISTENERS - LIGHTING
    // ========================================
    
    elements.toggleLights.addEventListener('change', () => {
        updateLightingStatus();
        console.log(`Lights ${state.isLighting ? 'turned ON' : 'turned OFF'}`);
    });
    
    elements.lightDimmer.addEventListener('input', () => {
        state.lightDimmer = parseInt(elements.lightDimmer.value);
        elements.dimmerValue.textContent = `${state.lightDimmer}%`;
        console.log(`Light brightness set to ${state.lightDimmer}%`);
    });
    
    // ========================================
    // EVENT LISTENERS - TEMPERATURE
    // ========================================
    
    elements.increaseTemp.addEventListener('click', () => {
        state.temperature++;
        updateTemperatureDisplay();
        console.log(`Temperature increased to ${state.temperature}°F`);
    });
    
    elements.decreaseTemp.addEventListener('click', () => {
        state.temperature--;
        updateTemperatureDisplay();
        console.log(`Temperature decreased to ${state.temperature}°F`);
    });
    
    // ========================================
    // EVENT LISTENERS - MUSIC SERVICE SELECTOR
    // ========================================
    
    elements.musicServiceSelect?.addEventListener('change', async (e) => {
        const selectedService = e.target.value;
        console.log(`Switching to ${selectedService} service...`);
        await switchMusicService(selectedService);
    });
    
    // ========================================
    // EVENT LISTENERS - MUSIC PLAYBACK
    // ========================================
    
    elements.playPause.addEventListener('click', async () => {
        await handlePlayPause();
    });
    
    elements.nextTrack.addEventListener('click', async () => {
        await handleNextTrack();
    });

    elements.previousTrack.addEventListener('click', async () => {
        await handlePreviousTrack();
    });
    
    // ========================================
    // MUSIC SERVICE HANDLERS
    // ========================================
    
    async function switchMusicService(service) {
        state.currentService = service;
        
        try {
            if (service === 'independent') {
                // Initialize Independent Music Player if not already done
                if (!state.independentPlayer) {
                    state.independentPlayer = new IndependentMusicPlayer();
                    await state.independentPlayer.initialize();
                    
                    // Load demo tracks
                    const demoTracks = state.independentPlayer.getDemoTracks();
                    state.independentPlayer.setPlaylist(demoTracks);
                    console.log('Independent Music Player initialized with demo tracks');
                }
                elements.songName.textContent = 'Select a track';
                elements.songAlbum.textContent = 'Independent Artists & Creative Commons';
                console.log('Switched to Independent Artists service');
            }
            
            await refreshPlaybackState();
        } catch (error) {
            console.error(`Error switching to ${service}:`, error);
        }
    }
    
    async function handlePlayPause() {
        try {
            if (state.currentService === 'independent') {
                if (!state.independentPlayer) {
                    state.independentPlayer = new IndependentMusicPlayer();
                    await state.independentPlayer.initialize();
                    const demoTracks = state.independentPlayer.getDemoTracks();
                    state.independentPlayer.setPlaylist(demoTracks);
                    console.log('Independent player initialized with', demoTracks.length, 'tracks');
                }
                
                if (state.independentPlayer.isPlaying) {
                    await state.independentPlayer.pause();
                    console.log('Music paused');
                } else {
                    // Always pass the first track if no current track
                    if (!state.independentPlayer.currentTrack) {
                        const firstTrack = state.independentPlayer.playlist[0];
                        await state.independentPlayer.play(firstTrack);
                        console.log('Playing first track:', firstTrack.title);
                    } else {
                        await state.independentPlayer.play();
                        console.log('Resuming playback');
                    }
                }
                
                // Immediately update UI
                updateNowPlaying();
            }
            
            // Also refresh after a short delay to catch any state changes
            setTimeout(() => refreshPlaybackState(), 100);
            
        } catch (error) {
            console.error('Play/Pause error:', error);
            elements.songName.textContent = 'Playback Error';
            elements.songAlbum.textContent = error.message;
        }
    }
    
    async function handleNextTrack() {
        try {
            if (state.currentService === 'independent') {
                if (!state.independentPlayer) {
                    state.independentPlayer = new IndependentMusicPlayer();
                    await state.independentPlayer.initialize();
                    const demoTracks = state.independentPlayer.getDemoTracks();
                    state.independentPlayer.setPlaylist(demoTracks);
                }
                
                // Ensure we're playing before skipping to next
                if (!state.independentPlayer.isPlaying && state.independentPlayer.playlist.length > 0) {
                    await state.independentPlayer.play(state.independentPlayer.playlist[0]);
                }
                
                await state.independentPlayer.nextTrack();
            }
            
            await refreshPlaybackState();
        } catch (error) {
            console.error('Next track error:', error);
        }
    }
    
    async function handlePreviousTrack() {
        try {
            if (state.currentService === 'independent') {
                if (!state.independentPlayer) {
                    state.independentPlayer = new IndependentMusicPlayer();
                    await state.independentPlayer.initialize();
                    const demoTracks = state.independentPlayer.getDemoTracks();
                    state.independentPlayer.setPlaylist(demoTracks);
                }
                
                // Ensure we're playing before skipping to previous
                if (!state.independentPlayer.isPlaying && state.independentPlayer.playlist.length > 0) {
                    await state.independentPlayer.play(state.independentPlayer.playlist[0]);
                }
                
                await state.independentPlayer.previousTrack();
            }
            
            await refreshPlaybackState();
        } catch (error) {
            console.error('Previous track error:', error);
        }
    }
    
    // ========================================
    // KEYBOARD SHORTCUTS (ACCESSIBILITY)
    // ========================================
    
    document.addEventListener('keydown', (e) => {
        if (e.key === '+' || e.key === '=') {
            state.temperature++;
            updateTemperatureDisplay();
        } else if (e.key === '-' || e.key === '_') {
            state.temperature--;
            updateTemperatureDisplay();
        } else if (e.key === ' ') {
            e.preventDefault();
            elements.playPause.click();
        }
    });
    
    // ========================================
    // REFRESH PLAYBACK STATE PERIODICALLY
    // ========================================
    
    setInterval(refreshPlaybackState, 3000);
    
    // ========================================
    // INITIALIZE DEFAULT MUSIC SERVICE
    // ========================================
    
    // Initialize Independent Artists as the default
    if (!state.independentPlayer) {
        state.independentPlayer = new IndependentMusicPlayer();
        await state.independentPlayer.initialize();
        const demoTracks = state.independentPlayer.getDemoTracks();
        state.independentPlayer.setPlaylist(demoTracks);
        console.log('Independent Music Player initialized on startup');
        elements.songName.textContent = 'Ready to play';
        elements.songAlbum.textContent = 'Independent Artists & Creative Commons';
        
        // Set the album art to the first track's artwork
        if (demoTracks.length > 0) {
            elements.songImage.src = demoTracks[0].artwork;
        }
    }
    
    // ========================================
    // SERVICE WORKER REGISTRATION
    // ========================================
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('Service Worker registered'))
            .catch(error => console.log('Service Worker registration failed:', error));
    }
    
    console.log('HomeHarmony initialized');
});
