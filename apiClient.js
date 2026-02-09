/**
 * API Client for Matcha Backend
 * Handles authentication and API calls
 */

// Backend URL - Production
const API_BASE_URL = 'https://jd-cv-backend-production.up.railway.app';

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = '737539383779-8bc3aah7oc5oasb6tavc68kotv41elip.apps.googleusercontent.com';

// Storage keys
const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    USER: 'user'
};

/**
 * Get stored auth token
 */
export async function getAuthToken() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
    return result[STORAGE_KEYS.AUTH_TOKEN] || null;
}

/**
 * Get stored user info
 */
export async function getUser() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER);
    return result[STORAGE_KEYS.USER] || null;
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn() {
    const token = await getAuthToken();
    return !!token;
}

/**
 * Sign in with Google using launchWebAuthFlow
 */
export async function signInWithGoogle() {
    console.log('signInWithGoogle called');

    try {
        // Get the redirect URL for this extension
        const redirectUrl = chrome.identity.getRedirectURL();
        console.log('Redirect URL:', redirectUrl);

        // Build OAuth URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', redirectUrl);
        authUrl.searchParams.set('response_type', 'token');
        authUrl.searchParams.set('scope', 'openid email profile');

        console.log('Launching auth flow...');

        // Launch the OAuth flow
        const responseUrl = await chrome.identity.launchWebAuthFlow({
            url: authUrl.toString(),
            interactive: true
        });

        console.log('Auth flow complete');

        // Extract access token from response URL
        const url = new URL(responseUrl);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        if (!accessToken) {
            throw new Error('No access token in response');
        }

        console.log('Got access token, getting user info...');

        // Get user info from Google
        const userInfoResponse = await fetch(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        if (!userInfoResponse.ok) {
            throw new Error('Failed to get user info from Google');
        }

        const googleUser = await userInfoResponse.json();
        console.log('Google user:', googleUser.email);

        // Authenticate with our backend
        console.log('Authenticating with backend...');
        const backendResponse = await fetch(`${API_BASE_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accessToken: accessToken,
                googleId: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture
            })
        });

        console.log('Backend response:', backendResponse.status);

        if (!backendResponse.ok) {
            const error = await backendResponse.json();
            console.error('Backend error:', error);
            throw new Error(error.error || 'Backend authentication failed');
        }

        const data = await backendResponse.json();
        console.log('Backend auth successful');

        // Store token and user info
        await chrome.storage.local.set({
            [STORAGE_KEYS.AUTH_TOKEN]: data.token,
            [STORAGE_KEYS.USER]: data.user
        });

        console.log('Sign in complete!');
        return data.user;

    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
}

/**
 * Sign out
 */
export async function signOut() {
    // Clear stored data
    await chrome.storage.local.remove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER]);
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = await getAuthToken();

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });

    // Handle 401 - token expired
    if (response.status === 401) {
        await signOut();
        throw new Error('Session expired. Please sign in again.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || 'API request failed');
    }

    return data;
}

/**
 * Get current user info from backend
 */
export async function getCurrentUser() {
    return apiRequest('/api/auth/me');
}

/**
 * Analyze job description against CV
 */
export async function analyzeJob(cvText, jdText, jobUrl = null) {
    return apiRequest('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ cvText, jdText, jobUrl })
    });
}

/**
 * Update CV with tailored bullets
 */
export async function updateCV(originalCV, tailoredBullets, jobInfo = {}) {
    return apiRequest('/api/update-cv', {
        method: 'POST',
        body: JSON.stringify({ originalCV, tailoredBullets, jobInfo })
    });
}

/**
 * Get usage statistics
 */
export async function getUsage() {
    return apiRequest('/api/usage');
}

/**
 * Check API health
 */
export async function checkHealth() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
}
