// Storage helper module for Chrome Extension
// Handles all chrome.storage.local operations

const STORAGE_KEYS = {
    CV_TEXT: 'cvText',
    SETTINGS: 'settings',
    TRACKER: 'tracker'
};

const MAX_TRACKER_ITEMS = 200;

/**
 * Save CV text to storage
 */
async function saveCVText(cvText) {
    // Clear analysis cache when CV changes
    await chrome.storage.local.set({
        [STORAGE_KEYS.CV_TEXT]: cvText,
        analysisCache: {} // Clear cache when CV is updated
    });
    console.log('CV updated, analysis cache cleared');
}

/**
 * Get CV text from storage
 */
async function getCVText() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CV_TEXT);
    return result[STORAGE_KEYS.CV_TEXT] || null;
}

/**
 * Save Azure OpenAI settings
 */
async function saveSettings(settings) {
    return chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

/**
 * Get Azure OpenAI settings
 */
async function getSettings() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || null;
}

/**
 * Get all tracker entries
 */
async function getTrackerEntries() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TRACKER);
    return result[STORAGE_KEYS.TRACKER] || [];
}

/**
 * Save a job entry to tracker
 */
async function saveJobEntry(jobEntry) {
    const entries = await getTrackerEntries();

    // Check if entry already exists (by URL)
    const existingIndex = entries.findIndex(e => e.url === jobEntry.url);

    if (existingIndex >= 0) {
        // Update existing entry
        entries[existingIndex] = {
            ...entries[existingIndex],
            ...jobEntry,
            updatedAtUtc: new Date().toISOString()
        };
    } else {
        // Add new entry
        jobEntry.createdAtUtc = new Date().toISOString();
        jobEntry.updatedAtUtc = new Date().toISOString();
        entries.unshift(jobEntry); // Add to beginning

        // Keep only MAX_TRACKER_ITEMS most recent entries
        if (entries.length > MAX_TRACKER_ITEMS) {
            entries.splice(MAX_TRACKER_ITEMS);
        }
    }

    return chrome.storage.local.set({ [STORAGE_KEYS.TRACKER]: entries });
}

/**
 * Update a job entry in tracker
 */
async function updateJobEntry(id, updates) {
    const entries = await getTrackerEntries();
    const index = entries.findIndex(e => e.id === id);

    if (index >= 0) {
        entries[index] = {
            ...entries[index],
            ...updates,
            updatedAtUtc: new Date().toISOString()
        };

        return chrome.storage.local.set({ [STORAGE_KEYS.TRACKER]: entries });
    }

    throw new Error('Job entry not found');
}

/**
 * Delete a job entry from tracker
 */
async function deleteJobEntry(id) {
    const entries = await getTrackerEntries();
    const filtered = entries.filter(e => e.id !== id);
    return chrome.storage.local.set({ [STORAGE_KEYS.TRACKER]: filtered });
}

/**
 * Search tracker entries by title or company
 */
async function searchTrackerEntries(query) {
    const entries = await getTrackerEntries();

    if (!query || query.trim() === '') {
        return entries;
    }

    const lowerQuery = query.toLowerCase();
    return entries.filter(e => {
        const title = (e.roleTitle || e.pageTitle || '').toLowerCase();
        const company = (e.company || '').toLowerCase();
        return title.includes(lowerQuery) || company.includes(lowerQuery);
    });
}

/**
 * Get tracker entries by status
 */
async function getTrackerEntriesByStatus(status) {
    const entries = await getTrackerEntries();

    if (!status || status === 'all') {
        return entries;
    }

    return entries.filter(e => e.status === status);
}

/**
 * Clear all data (for testing/reset)
 */
async function clearAllData() {
    return chrome.storage.local.clear();
}

// Export functions
export {
    saveCVText,
    getCVText,
    saveSettings,
    getSettings,
    getTrackerEntries,
    saveJobEntry,
    updateJobEntry,
    deleteJobEntry,
    searchTrackerEntries,
    getTrackerEntriesByStatus,
    clearAllData
};
