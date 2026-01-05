/**
 * Independent Music Player
 * Supports Creative Commons, royalty-free, and independent artist music
 * Sources:
 * - Freepik Audio API (Creative Commons)
 * - Pixabay Music API (CC0)
 * - Local independent artist uploads
 */

class IndependentMusicPlayer {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.playlist = [];
    this.currentIndex = 0;
    this.basePath = '/SmartHomeMobileInterfaceProject/'; // Default fallback
    this.apiKeys = {
      pixabay: 'YOUR_PIXABAY_API_KEY_HERE',
      // Freepik is optional - uses web scraping fallback
    };
    this.audioElement = null;
    this.listeners = {
      onTrackChange: [],
      onPlayStateChange: [],
      onPlaylistUpdate: [],
      onError: [],
    };
  }

  /**
   * Initialize the player
   */
  async initialize() {
    console.log('[IndependentMusicPlayer] Initializing...');
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    
    this.audioElement.addEventListener('canplay', () => {
      console.log('[Audio] Ready to play');
    });
    
    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.emit('onPlayStateChange', { isPlaying: true });
    });
    
    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.emit('onPlayStateChange', { isPlaying: false });
    });
    
    this.audioElement.addEventListener('ended', () => {
      console.log('[Audio] Track ended, playing next');
      this.nextTrack();
    });
    
    this.audioElement.addEventListener('error', (e) => {
      console.error('[Audio] Error loading audio:', this.audioElement.error);
      this.emit('onError', { message: 'Failed to load audio', error: e });
    });
    
    console.log('[IndependentMusicPlayer] Initialized successfully');
  }

  /**
   * Generate synthesized audio using Web Audio API to avoid CORS issues
   * Creates an OscillatorNode and records the output as a Blob
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @returns {Promise<string>} Data URL of generated audio
   */
  async generateSynthesizedAudio(frequency = 440, duration = 3) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      
      // Create offline context to render the audio
      const offlineContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
        1, 
        sampleRate * duration, 
        sampleRate
      );
      
      // Create oscillator
      const oscillator = offlineContext.createOscillator();
      const gainNode = offlineContext.createGain();
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Create envelope (fade in/out)
      gainNode.gain.setValueAtTime(0, 0);
      gainNode.gain.linearRampToValueAtTime(0.3, 0.1);
      gainNode.gain.linearRampToValueAtTime(0.3, duration - 0.1);
      gainNode.gain.linearRampToValueAtTime(0, duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(offlineContext.destination);
      oscillator.start(0);
      oscillator.stop(duration);
      
      // Render the offline context
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert AudioBuffer to WAV Blob
      const wavBlob = this.audioBufferToWav(renderedBuffer);
      return URL.createObjectURL(wavBlob);
    } catch (error) {
      console.error('[Audio] Error generating synthesized audio:', error);
      return null;
    }
  }

  /**
   * Convert AudioBuffer to WAV Blob
   * @param {AudioBuffer} audioBuffer - The audio buffer to convert
   * @returns {Blob} WAV file as blob
   */
  audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    const length = audioBuffer.length * numChannels * bytesPerSample + 36;
    const arrayBuffer = new ArrayBuffer(length + 8);
    const view = new DataView(arrayBuffer);
    
    // RIFF identifier
    let offset = 0;
    const setUint32 = (data) => {
      view.setUint32(offset, data, true);
      offset += 4;
    };
    const setUint16 = (data) => {
      view.setUint16(offset, data, true);
      offset += 2;
    };
    const setUint8 = (data) => {
      view.setUint8(offset, data);
      offset += 1;
    };
    
    // RIFF header
    setUint32(0x46464952); // "RIFF"
    setUint32(length);
    setUint32(0x45564157); // "WAVE"
    
    // fmt sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // sub-chunk size
    setUint16(format);
    setUint16(numChannels);
    setUint32(sampleRate);
    setUint32(sampleRate * blockAlign);
    setUint16(blockAlign);
    setUint16(bitDepth);
    
    // data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(audioBuffer.length * numChannels * bytesPerSample);
    
    // Interleave channels and write samples
    const volume = 0.8;
    let index = 0;
    const samples = new Int16Array(arrayBuffer, offset);
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let j = 0; j < numChannels; j++) {
        samples[index++] = channels[j][i] < 0 ? channels[j][i] * 0x8000 : channels[j][i] * 0x7fff;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Search for independent/Creative Commons music
   * @param {string} query - Search term (artist, genre, mood)
   * @returns {Promise<Array>} Array of tracks
   */
  async search(query) {
    try {
      const results = [];

      // Try Pixabay Music API
      const pixabayResults = await this.searchPixabay(query);
      results.push(...pixabayResults);

      // Add local independent artists (if available)
      const localResults = await this.searchLocalArtists(query);
      results.push(...localResults);

      this.emit('onPlaylistUpdate', { tracks: results, total: results.length });
      return results;
    } catch (error) {
      this.emit('onError', { message: 'Search failed', error });
      return [];
    }
  }

  /**
   * Search Pixabay Music (free, CC0 licensed)
   * Requires API key: https://pixabay.com/api/docs/music/
   * @private
   */
  async searchPixabay(query) {
    try {
      if (!this.apiKeys.pixabay || this.apiKeys.pixabay === 'YOUR_PIXABAY_API_KEY_HERE') {
        console.warn('Pixabay API key not set - using demo tracks');
        return this.getDemoTracks();
      }

      const response = await fetch(
        `https://pixabay.com/api/music/?q=${encodeURIComponent(query)}&key=${this.apiKeys.pixabay}`
      );

      if (!response.ok) throw new Error('Pixabay API error');

      const data = await response.json();

      return (data.hits || []).map((track) => ({
        id: `pixabay-${track.id}`,
        title: track.title,
        artist: track.artists?.[0]?.name || 'Pixabay Artist',
        genre: track.genre || 'Instrumental',
        duration: track.duration || 0,
        artwork: track.image || null,
        url: track.audio,
        source: 'Pixabay',
        license: 'CC0 (Public Domain)',
        attribution: `${track.title} by ${track.artists?.[0]?.name || 'Pixabay'}`,
      }));
    } catch (error) {
      console.error('Pixabay search error:', error);
      return this.getDemoTracks();
    }
  }

  /**
   * Search local independent artists
   * Reads from /independent-artists/ folder
   * @private
   */
  async searchLocalArtists(query) {
    try {
      // In a real app, this would query a backend API
      // For now, return demo tracks from local sources
      const localTracks = await this.getLocalTracks();
      return localTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.artist.toLowerCase().includes(query.toLowerCase()) ||
          t.genre.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Local artist search error:', error);
      return [];
    }
  }

  /**
   * Get demo/example tracks (no API key needed)
   * @private
   */
  async getDemoTracks() {
    // Using real music with CORS support
    // These are preview URLs from public APIs and services
    return [
      {
        id: 'demo-1',
        title: 'Sunny Day',
        artist: 'Bensound',
        genre: 'Upbeat',
        duration: 240,
        artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
        // Using CORS proxy to fetch from Bensound
        url: 'https://cors.eu.org/https://www.bensound.com/bensound-music/bensound-sunny.mp3',
        source: 'Bensound',
        license: 'CC-BY 3.0',
        attribution: 'Sunny by Bensound',
      },
      {
        id: 'demo-2',
        title: 'Ukulele',
        artist: 'Bensound',
        genre: 'Upbeat',
        duration: 240,
        artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        // Using CORS proxy to fetch from Bensound
        url: 'https://cors.eu.org/https://www.bensound.com/bensound-music/bensound-ukulele.mp3',
        source: 'Bensound',
        license: 'CC-BY 3.0',
        attribution: 'Ukulele by Bensound',
      },
      {
        id: 'demo-3',
        title: 'Relaxing',
        artist: 'Bensound',
        genre: 'Ambient',
        duration: 240,
        artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        // Using CORS proxy to fetch from Bensound
        url: 'https://cors.eu.org/https://www.bensound.com/bensound-music/bensound-relaxing.mp3',
        source: 'Bensound',
        license: 'CC-BY 3.0',
        attribution: 'Relaxing by Bensound',
      },
    ];
  }

  /**
   * Get local independent artist tracks
   * Expects files in /independent-artists/ directory
   * @private
   */
  async getLocalTracks() {
    // In production, this would query a backend endpoint
    // For now, return empty array - user can add their own
    return [];
  }

  /**
   * Play a track
   * @param {Object|string} track - Track object or track ID (optional, will resume current if not provided)
   */
  async play(track) {
    try {
      // If no track provided, resume current track
      if (!track) {
        if (this.currentTrack) {
          await this.audioElement.play();
          this.isPlaying = true;
          this.emit('onPlayStateChange', { isPlaying: true });
          return true;
        } else if (this.playlist.length > 0) {
          track = this.playlist[0];
        } else {
          throw new Error('No tracks available to play');
        }
      }
      
      if (typeof track === 'string') {
        const foundTrack = this.playlist.find((t) => t.id === track);
        if (!foundTrack) throw new Error('Track not found');
        track = foundTrack;
      }

      this.currentTrack = track;
      this.currentIndex = this.playlist.findIndex((t) => t.id === track.id);
      this.audioElement.src = track.url;
      
      await this.audioElement.play();
      
      // Set isPlaying immediately instead of waiting for play event
      this.isPlaying = true;
      this.emit('onPlayStateChange', { isPlaying: true });
      this.emit('onTrackChange', { track });
      return true;
    } catch (error) {
      console.error('[Audio] Playback error:', error.message);
      this.emit('onError', { message: 'Failed to play track', error });
      return false;
    }
  }

  /**
   * Pause current track
   */
  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
      this.emit('onPlayStateChange', { isPlaying: false });
    }
  }

  /**
   * Resume playing
   */
  resume() {
    if (this.audioElement) {
      this.audioElement.play();
    }
  }

  /**
   * Stop playback
   */
  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
      this.emit('onPlayStateChange', { isPlaying: false });
    }
  }

  /**
   * Play next track in playlist
   */
  async nextTrack() {
    if (this.playlist.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    await this.play(this.playlist[this.currentIndex]);
  }

  /**
   * Play previous track in playlist
   */
  async previousTrack() {
    if (this.playlist.length === 0) return;

    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    await this.play(this.playlist[this.currentIndex]);
  }

  /**
   * Set playlist
   * @param {Array} tracks - Array of track objects
   */
  setPlaylist(tracks) {
    this.playlist = tracks;
    this.currentIndex = 0;
    this.emit('onPlaylistUpdate', { tracks, total: tracks.length });
  }

  /**
   * Get current track
   * @returns {Object|null} Current track object
   */
  getCurrentTrack() {
    return this.currentTrack;
  }

  /**
   * Get current playback state
   * @returns {Object} Playback state
   */
  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentTrack: this.currentTrack,
      currentTime: this.audioElement?.currentTime || 0,
      duration: this.audioElement?.duration || 0,
      playlistIndex: this.currentIndex,
      playlistLength: this.playlist.length,
    };
  }

  /**
   * Set volume (0-1)
   * @param {number} volume - Volume level
   */
  setVolume(volume) {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Seek to time (seconds)
   * @param {number} seconds - Time in seconds
   */
  seek(seconds) {
    if (this.audioElement) {
      this.audioElement.currentTime = seconds;
    }
  }

  /**
   * Get supported licenses/sources
   * @returns {Array} Array of supported sources
   */
  getSupportedSources() {
    return [
      {
        name: 'Pixabay Music',
        url: 'https://pixabay.com/music',
        license: 'CC0 (Public Domain)',
        description: '1000+ royalty-free music tracks',
      },
      {
        name: 'Creative Commons',
        url: 'https://creativecommons.org',
        license: 'Various CC licenses',
        description: 'Music with creator attribution',
      },
      {
        name: 'Independent Artists',
        url: 'local',
        license: 'Per-artist license',
        description: 'Local independent artist uploads',
      },
      {
        name: 'Freepik Audio',
        url: 'https://www.freepik.com/search/audio',
        license: 'CC0 + Premium',
        description: 'Curated royalty-free music',
      },
    ];
  }

  /**
   * Get track attribution/license info
   * @param {Object} track - Track object
   * @returns {Object} Attribution and license info
   */
  getTrackInfo(track) {
    return {
      title: track.title,
      artist: track.artist,
      source: track.source,
      license: track.license,
      attribution: track.attribution,
      url: track.url,
      genre: track.genre,
      duration: track.duration,
    };
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  /**
   * Emit event
   * @private
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data));
    }
  }
}

// ES6 Export
export { IndependentMusicPlayer };

// CommonJS Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IndependentMusicPlayer;
}

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.IndependentMusicPlayer = IndependentMusicPlayer;
}
