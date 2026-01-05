// ========================================
// SPOTIFY INTEGRATION MODULE
// ========================================

import {
    SPOTIFY_CONFIG,
    getAuthorizationUrl,
    getAccessToken,
    getStoredAccessToken,
    spotifyApiRequest,
} from './spotify-config.js';

class SpotifyPlayer {
    constructor() {
        this.isAuthenticated = false;
        this.currentTrack = null;
        this.isPlaying = false;
        this.devices = [];
        this.activeDevice = null;
    }

    // Initialize Spotify player
    async init() {
        // Check if we're on the callback page
        if (window.location.pathname.includes('callback')) {
            await this.handleCallback();
            return;
        }

        // Check if we have a valid token
        if (getStoredAccessToken()) {
            this.isAuthenticated = true;
            await this.refreshUserData();
        }
    }

    // Handle OAuth callback
    async handleCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');

        if (error) {
            console.error('Authorization error:', error);
            window.location.href = '/';
            return;
        }

        if (!code) {
            console.error('No authorization code');
            window.location.href = '/';
            return;
        }

        // Verify state to prevent CSRF
        const storedState = localStorage.getItem('spotify_state');
        if (state !== storedState) {
            console.error('State mismatch - potential CSRF attack');
            window.location.href = '/';
            return;
        }

        try {
            await getAccessToken(code);
            this.isAuthenticated = true;
            await this.refreshUserData();
            
            // Redirect back to main page
            window.location.href = '/';
        } catch (error) {
            console.error('Failed to authenticate:', error);
            window.location.href = '/';
        }
    }

    // Login with Spotify
    async login() {
        const authUrl = await getAuthorizationUrl();
        // Open in new tab, but also navigate main window for mobile
        window.location.href = authUrl;
    }

    // Logout
    logout() {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiry');
        this.isAuthenticated = false;
        this.currentTrack = null;
        window.location.reload();
    }

    // Get available devices
    async getDevices() {
        try {
            const data = await spotifyApiRequest('/me/player/devices');
            this.devices = data.devices;
            
            // Set active device (prefer one that's playing, otherwise first)
            this.activeDevice = data.devices.find(d => d.is_active) || data.devices[0];
            
            return this.devices;
        } catch (error) {
            console.error('Failed to get devices:', error);
            return [];
        }
    }

    // Get current playback state
    async getPlaybackState() {
        try {
            const data = await spotifyApiRequest('/me/player');
            
            if (data) {
                this.isPlaying = data.is_playing;
                this.currentTrack = data.item;
                this.activeDevice = data.device;
            }
            
            return data;
        } catch (error) {
            console.error('Failed to get playback state:', error);
            return null;
        }
    }

    // Play
    async play(trackUri = null) {
        try {
            const body = {};
            
            if (trackUri) {
                body.uris = [trackUri];
            }
            
            if (this.activeDevice?.id) {
                await spotifyApiRequest(`/me/player/play?device_id=${this.activeDevice.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                });
            } else {
                // Fallback - play without device specification
                await spotifyApiRequest('/me/player/play', {
                    method: 'PUT',
                    body: JSON.stringify(body),
                });
            }
            
            this.isPlaying = true;
            return true;
        } catch (error) {
            console.error('Failed to play:', error);
            return false;
        }
    }

    // Pause
    async pause() {
        try {
            if (this.activeDevice?.id) {
                await spotifyApiRequest(`/me/player/pause?device_id=${this.activeDevice.id}`, {
                    method: 'PUT',
                });
            } else {
                await spotifyApiRequest('/me/player/pause', {
                    method: 'PUT',
                });
            }
            
            this.isPlaying = false;
            return true;
        } catch (error) {
            console.error('Failed to pause:', error);
            return false;
        }
    }

    // Next track
    async nextTrack() {
        try {
            if (this.activeDevice?.id) {
                await spotifyApiRequest(`/me/player/next?device_id=${this.activeDevice.id}`, {
                    method: 'POST',
                });
            } else {
                await spotifyApiRequest('/me/player/next', {
                    method: 'POST',
                });
            }
            
            // Update current track
            await this.getPlaybackState();
            return true;
        } catch (error) {
            console.error('Failed to skip:', error);
            return false;
        }
    }

    // Previous track
    async previousTrack() {
        try {
            if (this.activeDevice?.id) {
                await spotifyApiRequest(`/me/player/previous?device_id=${this.activeDevice.id}`, {
                    method: 'POST',
                });
            } else {
                await spotifyApiRequest('/me/player/previous', {
                    method: 'POST',
                });
            }
            
            await this.getPlaybackState();
            return true;
        } catch (error) {
            console.error('Failed to go previous:', error);
            return false;
        }
    }

    // Search for tracks
    async searchTracks(query) {
        try {
            const params = new URLSearchParams({
                q: query,
                type: 'track',
                limit: 10,
            });
            
            const data = await spotifyApiRequest(`/search?${params.toString()}`);
            return data.tracks.items;
        } catch (error) {
            console.error('Failed to search:', error);
            return [];
        }
    }

    // Get user's saved tracks
    async getSavedTracks(limit = 20) {
        try {
            const data = await spotifyApiRequest(`/me/tracks?limit=${limit}`);
            return data.items.map(item => item.track);
        } catch (error) {
            console.error('Failed to get saved tracks:', error);
            return [];
        }
    }

    // Refresh user data
    async refreshUserData() {
        try {
            await this.getDevices();
            await this.getPlaybackState();
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    }

    // Get current track info
    getCurrentTrackInfo() {
        if (!this.currentTrack) {
            return {
                name: 'No track playing',
                artist: '',
                album: '',
                imageUrl: '',
            };
        }

        return {
            name: this.currentTrack.name,
            artist: this.currentTrack.artists[0]?.name || 'Unknown Artist',
            album: this.currentTrack.album?.name || 'Unknown Album',
            imageUrl: this.currentTrack.album?.images[0]?.url || '',
            duration: this.currentTrack.duration_ms,
            uri: this.currentTrack.uri,
        };
    }
}

// Export singleton instance
export const spotifyPlayer = new SpotifyPlayer();
