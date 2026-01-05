// ========================================
// SPOTIFY CONFIGURATION
// ========================================
// Get these from: https://developer.spotify.com/dashboard
// IMPORTANT: For security, never commit your real Client ID to public repos!

const SPOTIFY_CONFIG = {
    // Your Spotify App Client ID
    // Replace with your own from https://developer.spotify.com/dashboard
    clientId: 'YOUR_SPOTIFY_CLIENT_ID_HERE',
    
    // Redirect URI (must match your Spotify app settings)
    // For localhost development:
    // redirectUri: 'http://localhost:5173/callback',
    // For GitHub Pages:
    redirectUri: typeof window !== 'undefined' 
        ? window.location.origin + '/SmartHomeMobileInterfaceProject/callback.html'
        : 'http://localhost:5173/callback',
    
    // Spotify API endpoints
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
    apiEndpoint: 'https://api.spotify.com/v1',
    
    // Scopes - what permissions we need
    scopes: [
        'streaming',                    // Play music
        'user-read-private',           // Read user profile
        'user-read-email',             // Read email
        'user-modify-playback-state',  // Control playback
        'user-read-playback-state',    // Read playback state
        'user-library-read',           // Read saved tracks
        'playlist-read-private',       // Read private playlists
        'playlist-read-public',        // Read public playlists
    ],
};

// ========================================
// HELPER FUNCTIONS
// ========================================

// Generate a random string for OAuth state
const generateRandomString = (length = 16) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// Generate code challenge for PKCE (secure OAuth)
const generateCodeChallenge = async (codeVerifier) => {
    const buffer = new TextEncoder().encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashString = hashArray.map(b => String.fromCharCode(b)).join('');
    return btoa(hashString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Get authorization URL
const getAuthorizationUrl = async () => {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString();
    
    // Store for later
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    localStorage.setItem('spotify_state', state);
    
    const params = new URLSearchParams({
        client_id: SPOTIFY_CONFIG.clientId,
        response_type: 'code',
        redirect_uri: SPOTIFY_CONFIG.redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state: state,
        scope: SPOTIFY_CONFIG.scopes.join(' '),
    });
    
    return `${SPOTIFY_CONFIG.authorizationEndpoint}?${params.toString()}`;
};

// Exchange authorization code for access token
const getAccessToken = async (code) => {
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    
    const params = new URLSearchParams({
        client_id: SPOTIFY_CONFIG.clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_CONFIG.redirectUri,
        code_verifier: codeVerifier,
    });
    
    try {
        const response = await fetch(SPOTIFY_CONFIG.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });
        
        if (!response.ok) {
            throw new Error(`Token error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Store token and expiration
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));
        
        // Clean up
        localStorage.removeItem('spotify_code_verifier');
        localStorage.removeItem('spotify_state');
        
        return data.access_token;
    } catch (error) {
        console.error('Failed to get access token:', error);
        throw error;
    }
};

// Get stored access token (if still valid)
const getStoredAccessToken = () => {
    const token = localStorage.getItem('spotify_access_token');
    const expiry = localStorage.getItem('spotify_token_expiry');
    
    if (!token || !expiry) {
        return null;
    }
    
    // Check if token is expired
    if (Date.now() > parseInt(expiry)) {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiry');
        return null;
    }
    
    return token;
};

// Make API request to Spotify
const spotifyApiRequest = async (endpoint, options = {}) => {
    const token = getStoredAccessToken();
    if (!token) {
        throw new Error('Not authenticated with Spotify');
    }
    
    const response = await fetch(`${SPOTIFY_CONFIG.apiEndpoint}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    
    if (response.status === 401) {
        // Token expired, need to re-authenticate
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiry');
        throw new Error('Token expired - please log in again');
    }
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
};

// Export for use in other files
export {
    SPOTIFY_CONFIG,
    generateRandomString,
    generateCodeChallenge,
    getAuthorizationUrl,
    getAccessToken,
    getStoredAccessToken,
    spotifyApiRequest,
};
