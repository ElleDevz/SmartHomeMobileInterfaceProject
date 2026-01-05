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
    
    this.audioElement.addEventListener('loadstart', () => {
      console.log('[Audio] Loading started');
    });
    
    this.audioElement.addEventListener('canplay', () => {
      console.log('[Audio] Can play - audio loaded successfully');
    });
    
    this.audioElement.addEventListener('play', () => {
      console.log('[Audio] Play event fired');
      this.isPlaying = true;
      this.emit('onPlayStateChange', { isPlaying: true });
    });
    
    this.audioElement.addEventListener('pause', () => {
      console.log('[Audio] Pause event fired');
      this.isPlaying = false;
      this.emit('onPlayStateChange', { isPlaying: false });
    });
    
    this.audioElement.addEventListener('ended', () => {
      console.log('[Audio] Track ended, going to next');
      this.nextTrack();
    });
    
    this.audioElement.addEventListener('error', (e) => {
      console.error('[Audio] Error loading audio:', this.audioElement.error);
      this.emit('onError', { message: 'Failed to load audio', error: e });
    });
    
    console.log('[IndependentMusicPlayer] Initialized successfully');
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
  getDemoTracks() {
    return [
      {
        id: 'demo-1',
        title: 'Summer Vibes',
        artist: 'Independent Artist',
        genre: 'Indie Pop',
        duration: 3,
        artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
        url: '/SmartHomeMobileInterfaceProject/audio/track1.wav',
        source: 'Local',
        license: 'CC0',
        attribution: 'Demo track',
      },
      {
        id: 'demo-2',
        title: 'Electronic Dreams',
        artist: 'Independent Artist',
        genre: 'Electronic',
        duration: 3,
        artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        url: '/SmartHomeMobileInterfaceProject/audio/track2.wav',
        source: 'Local',
        license: 'CC0',
        attribution: 'Demo track',
      },
      {
        id: 'demo-3',
        title: 'Chill Jazz',
        artist: 'Independent Artist',
        genre: 'Jazz',
        duration: 3,
        artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        url: '/SmartHomeMobileInterfaceProject/audio/track3.wav',
        source: 'Local',
        license: 'CC0',
        attribution: 'Demo track',
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
      console.log('[IndependentMusicPlayer.play] Called with track:', track);
      
      // If no track provided, resume current track
      if (!track) {
        console.log('[IndependentMusicPlayer.play] No track provided, checking current track');
        if (this.currentTrack) {
          console.log('[IndependentMusicPlayer.play] Resuming current track:', this.currentTrack.title);
          await this.audioElement.play();
          this.isPlaying = true;
          this.emit('onPlayStateChange', { isPlaying: true });
          return true;
        } else if (this.playlist.length > 0) {
          console.log('[IndependentMusicPlayer.play] No current track, using first from playlist');
          track = this.playlist[0];
        } else {
          throw new Error('No tracks available to play');
        }
      }
      
      if (typeof track === 'string') {
        // If just an ID, find it in playlist
        console.log('[IndependentMusicPlayer.play] Track is string ID, finding in playlist');
        const foundTrack = this.playlist.find((t) => t.id === track);
        if (!foundTrack) throw new Error('Track not found');
        track = foundTrack;
      }

      console.log('[IndependentMusicPlayer.play] Setting up audio for:', track.title);
      this.currentTrack = track;
      this.currentIndex = this.playlist.findIndex((t) => t.id === track.id);

      console.log('[IndependentMusicPlayer.play] Audio URL:', track.url);
      console.log('[IndependentMusicPlayer.play] Audio element crossOrigin:', this.audioElement.crossOrigin);
      this.audioElement.src = track.url;
      console.log('[IndependentMusicPlayer.play] Audio src set to:', this.audioElement.src);
      
      console.log('[IndependentMusicPlayer.play] Calling audioElement.play()');
      const playPromise = this.audioElement.play();
      console.log('[IndependentMusicPlayer.play] Play promise:', playPromise);
      
      await playPromise;
      console.log('[IndependentMusicPlayer.play] Play call succeeded');
      
      // Set isPlaying immediately instead of waiting for play event
      this.isPlaying = true;
      this.emit('onPlayStateChange', { isPlaying: true });
      this.emit('onTrackChange', { track });
      return true;
    } catch (error) {
      console.error('[IndependentMusicPlayer.play] ERROR:', error);
      console.error('[IndependentMusicPlayer.play] Error name:', error.name);
      console.error('[IndependentMusicPlayer.play] Error message:', error.message);
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
  nextTrack() {
    if (this.playlist.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.play(this.playlist[this.currentIndex]);
  }

  /**
   * Play previous track in playlist
   */
  previousTrack() {
    if (this.playlist.length === 0) return;

    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.play(this.playlist[this.currentIndex]);
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
