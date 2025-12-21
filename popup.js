// Main popup script
import * as storage from './storage.js';
import { analyzeJDWithCV, testConnection } from './azureOpenAI.js';

// State
let currentPageContent = null;
let currentAnalysis = null;
let currentStatusFilter = 'all';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await initializeUI();
    await loadTrackerData();
    setupEventListeners();
});

/**
 * Initialize UI state
 */
async function initializeUI() {
    // Check if CV is uploaded
    const cvText = await storage.getCVText();
    updateCVStatus(cvText);

    // Load current tab info
    await loadCurrentTabInfo();
}

/**
 * Update CV status display
 */
function updateCVStatus(cvText) {
    const cvStatusEl = document.getElementById('cvStatus');
    const clearCVBtn = document.getElementById('clearCVBtn');

    if (cvText && cvText.length > 0) {
        const wordCount = cvText.split(/\s+/).length;
        cvStatusEl.textContent = `CV uploaded (${wordCount} words)`;
        cvStatusEl.style.color = '#10b981';
        if (clearCVBtn) clearCVBtn.style.display = 'inline-block';
    } else {
        cvStatusEl.textContent = 'No CV uploaded';
        cvStatusEl.style.color = '#ef4444';
        if (clearCVBtn) clearCVBtn.style.display = 'none';
    }
}

/**
 * Load current tab information
 */
async function loadCurrentTabInfo() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab) {
            document.getElementById('pageTitle').textContent = tab.title || 'Untitled';
            document.getElementById('pageUrl').textContent = tab.url || '';
        }
    } catch (error) {
        console.error('Error loading tab info:', error);
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // CV Upload
    document.getElementById('uploadCVBtn').addEventListener('click', () => {
        document.getElementById('cvFileInput').click();
    });

    document.getElementById('cvFileInput').addEventListener('change', handleCVUpload);

    // Analyze button
    document.getElementById('analyzeBtn').addEventListener('click', handleAnalyze);

    // Save to tracker
    document.getElementById('saveToTrackerBtn').addEventListener('click', handleSaveToTracker);

    // Copy bullets
    document.getElementById('copyBulletsBtn').addEventListener('click', handleCopyBullets);

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettingsBtn').addEventListener('click', closeSettings);
    document.getElementById('settingsForm').addEventListener('submit', handleSaveSettings);
    document.getElementById('testConnectionBtn').addEventListener('click', handleTestConnection);
    document.getElementById('clearCVBtn')?.addEventListener('click', handleClearCV);

    // Floating button toggle - instant feedback
    document.getElementById('floatingButtonEnabled').addEventListener('change', handleFloatingButtonToggle);

    // Tracker search
    document.getElementById('trackerSearch').addEventListener('input', handleTrackerSearch);

    // Status filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentStatusFilter = e.target.dataset.status;
            loadTrackerData();
        });
    });
}

/**
 * Handle CV file upload
 */
async function handleCVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await readFileAsText(file);

        if (!text || text.trim().length < 50) {
            showError('CV file appears to be empty or too short');
            return;
        }

        await storage.saveCVText(text);
        updateCVStatus(text);
        showSuccess('CV uploaded successfully!');

        // Reset file input
        event.target.value = '';
    } catch (error) {
        console.error('Error uploading CV:', error);
        showError('Failed to upload CV: ' + error.message);
    }
}

/**
 * Read file as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            resolve(e.target.result);
        };

        reader.onerror = (e) => {
            reject(new Error('Failed to read file'));
        };

        // For PDF and DOCX, we can only read text files directly
        // For production, you'd need a library like pdf.js or mammoth.js
        if (file.name.endsWith('.txt')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.pdf')) {
            // For MVP, ask user to convert to text
            reject(new Error('Please convert PDF to TXT format for now. PDF parsing will be added in a future update.'));
        } else if (file.name.endsWith('.docx')) {
            // For MVP, ask user to convert to text
            reject(new Error('Please convert DOCX to TXT format for now. DOCX parsing will be added in a future update.'));
        } else {
            reader.readAsText(file);
        }
    });
}

/**
 * Generate cache key for analysis
 */
function generateCacheKey(cvText, jobText) {
    // Create a simple hash of CV + job content for caching
    const combined = cvText.substring(0, 500) + '||' + jobText.substring(0, 1000);
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return 'analysis_' + Math.abs(hash).toString(36);
}

/**
 * Handle analyze button click
 */
async function handleAnalyze() {
    // Check if CV is uploaded
    const cvText = await storage.getCVText();
    if (!cvText) {
        showError('Please upload your CV first');
        openSettings();
        return;
    }

    // TEMPORARY: Skip Azure settings check for testing with mock data
    // Get settings anyway (can be empty/dummy for mock)
    const settings = await storage.getSettings() || {
        azureEndpoint: 'mock',
        apiKey: 'mock',
        deployment: 'mock'
    };

    /* COMMENTED OUT: Real Azure settings validation
    // Check if settings are configured
    const settings = await storage.getSettings();
    if (!settings || !settings.azureEndpoint || !settings.apiKey || !settings.deployment) {
      showError('Please configure Azure OpenAI settings first');
      openSettings();
      return;
    }
    */

    // Show loading state
    showLoading(true);
    hideError();
    hideAnalysisResults();

    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            throw new Error('No active tab found');
        }

        console.log('Attempting to inject content script into tab:', tab.id, tab.url);

        // Ensure content script is injected before sending message
        let injectionSucceeded = false;
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['contentScript.js']
            });
            console.log('Content script injected successfully');
            injectionSucceeded = true;
        } catch (injectionError) {
            console.log('Content script injection error:', injectionError);
            // Script might already be injected, try to send message anyway
        }

        // Small delay to ensure script is ready
        await new Promise(resolve => setTimeout(resolve, injectionSucceeded ? 200 : 100));

        // Extract page content
        let response;
        try {
            console.log('Sending message to tab:', tab.id);
            response = await chrome.tabs.sendMessage(tab.id, {
                action: 'extractPageContent'
            });
            console.log('Received response:', response);
        } catch (messageError) {
            console.error('Message sending failed:', messageError);

            // Try one more time after injecting with a longer delay
            try {
                console.log('Retrying injection and message...');
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['contentScript.js']
                });
                await new Promise(resolve => setTimeout(resolve, 500));
                response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'extractPageContent'
                });
                console.log('Retry successful:', response);
            } catch (retryError) {
                console.error('Retry failed:', retryError);
                throw new Error('Failed to communicate with page. This can happen on Chrome internal pages (chrome://, chrome-extension://). Please try on a regular website.');
            }
        }

        if (!response) {
            throw new Error('No response from content script. Please refresh the page and try again.');
        }

        if (!response.success) {
            throw new Error(response.error || 'Failed to extract page content');
        }

        currentPageContent = response.content;

        // Log extracted content details
        console.log('========== EXTRACTED PAGE CONTENT ==========');
        console.log('Company:', currentPageContent.company || 'Not found');
        console.log('Page Title:', currentPageContent.pageTitle);
        console.log('URL:', currentPageContent.pageUrl);
        console.log('Main Text Length:', currentPageContent.mainText?.length || 0, 'characters');
        console.log('Main Text Preview:', currentPageContent.mainText?.substring(0, 200) + '...');
        console.log('Extracted At:', currentPageContent.extractedAt);
        console.log('==========================================');

        // Check if extracted text is substantial
        if (!currentPageContent.mainText || currentPageContent.mainText.length < 100) {
            showError('Page content appears too short. Please navigate to a job description page.');
            showLoading(false);
            return;
        }

        // Check cache first
        const cacheKey = generateCacheKey(cvText, currentPageContent.mainText);
        console.log('🔑 Generated cache key:', cacheKey);
        
        const { analysisCache = {} } = await chrome.storage.local.get('analysisCache');
        const cachedResult = analysisCache[cacheKey];
        
        let analysis;
        if (cachedResult && cachedResult.analysis) {
            console.log('✅ Using cached analysis from', new Date(cachedResult.timestamp).toLocaleString());
            console.log('   Cached job URL:', cachedResult.jobUrl);
            analysis = cachedResult.analysis;
        } else {
            console.log('🔄 No cache found, calling Azure OpenAI...');
            
            // Call Azure OpenAI
            analysis = await analyzeJDWithCV(settings, cvText, currentPageContent.mainText);
            
            // Store in cache
            analysisCache[cacheKey] = {
                analysis: analysis,
                timestamp: Date.now(),
                jobUrl: currentPageContent.pageUrl
            };
            
            // Keep only the 50 most recent analyses
            const cacheEntries = Object.entries(analysisCache);
            if (cacheEntries.length > 50) {
                // Sort by timestamp (oldest first)
                cacheEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
                // Remove oldest entries
                const entriesToRemove = cacheEntries.length - 50;
                for (let i = 0; i < entriesToRemove; i++) {
                    delete analysisCache[cacheEntries[i][0]];
                }
                console.log(`🧹 Removed ${entriesToRemove} old cache entries, keeping 50 most recent`);
            }
            
            await chrome.storage.local.set({ analysisCache });
            console.log('💾 Analysis cached with key:', cacheKey);
        }

        currentAnalysis = analysis;

        // Display results
        displayAnalysisResults(analysis);

        // Enable save and copy buttons
        document.getElementById('saveToTrackerBtn').disabled = false;
        document.getElementById('copyBulletsBtn').disabled = false;

    } catch (error) {
        console.error('Analysis error:', error);
        showError('Analysis failed: ' + error.message);
    } finally {
        showLoading(false);
    }
}

/**
 * Display analysis results
 */
function displayAnalysisResults(analysis) {
    // Match score
    document.getElementById('matchScore').textContent = analysis.match_score;
    const matchLabel = document.getElementById('matchLabel');
    matchLabel.textContent = analysis.match_label.toUpperCase();
    matchLabel.className = 'match-label match-' + analysis.match_label;

    // Explanation
    document.getElementById('strengthText').textContent = analysis.explanation.strength;
    document.getElementById('riskText').textContent = analysis.explanation.risk;
    document.getElementById('suggestionText').textContent = analysis.explanation.suggestion;

    // Gap analysis
    const gapList = document.getElementById('gapAnalysisList');
    gapList.innerHTML = '';
    analysis.gap_analysis.forEach(gap => {
        const li = document.createElement('li');
        li.textContent = gap;
        gapList.appendChild(li);
    });

    // Tailored bullets
    const bulletsList = document.getElementById('tailoredBulletsList');
    bulletsList.innerHTML = '';
    analysis.tailored_bullets.forEach(bullet => {
        const li = document.createElement('li');
        li.textContent = bullet;
        bulletsList.appendChild(li);
    });

    // Show results
    showAnalysisResults();
}

/**
 * Handle save to tracker
 */
async function handleSaveToTracker() {
    if (!currentPageContent || !currentAnalysis) {
        showError('No analysis to save. Please analyze a page first.');
        return;
    }

    try {
        const jobEntry = {
            id: generateJobId(currentPageContent.pageUrl),
            url: currentPageContent.pageUrl,
            pageTitle: currentPageContent.pageTitle,
            company: currentPageContent.company || '',
            roleTitle: extractRoleTitle(currentPageContent.pageTitle),
            status: 'Inbox',
            notes: '',
            matchScore: currentAnalysis.match_score,
            matchLabel: currentAnalysis.match_label,
            explanation: currentAnalysis.explanation,
            gapAnalysis: currentAnalysis.gap_analysis,
            tailoredBullets: currentAnalysis.tailored_bullets
        };

        await storage.saveJobEntry(jobEntry);
        await loadTrackerData();
        showSuccess('Saved to tracker!');
    } catch (error) {
        console.error('Error saving to tracker:', error);
        showError('Failed to save to tracker: ' + error.message);
    }
}

/**
 * Handle copy bullets to clipboard
 */
async function handleCopyBullets() {
    if (!currentAnalysis || !currentAnalysis.tailored_bullets) {
        showError('No bullets to copy');
        return;
    }

    const text = currentAnalysis.tailored_bullets.join('\n\n');

    try {
        await navigator.clipboard.writeText(text);
        showSuccess('Tailored bullets copied to clipboard!');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showError('Failed to copy to clipboard');
    }
}

/**
 * Load and display tracker data
 */
async function loadTrackerData() {
    const trackerList = document.getElementById('trackerList');

    try {
        let entries;
        if (currentStatusFilter === 'all') {
            entries = await storage.getTrackerEntries();
        } else {
            entries = await storage.getTrackerEntriesByStatus(currentStatusFilter);
        }

        // Limit to 10 most recent
        entries = entries.slice(0, 10);

        if (entries.length === 0) {
            trackerList.innerHTML = '<p class="empty-state">No jobs found</p>';
            return;
        }

        trackerList.innerHTML = '';
        entries.forEach(entry => {
            const item = createTrackerItem(entry);
            trackerList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading tracker data:', error);
        trackerList.innerHTML = '<p class="error-state">Failed to load tracker data</p>';
    }
}

/**
 * Create a tracker item element
 */
function createTrackerItem(entry) {
    const div = document.createElement('div');
    div.className = 'tracker-item';

    // Handle cases where job wasn't analyzed
    const hasAnalysis = entry.matchScore !== undefined && entry.matchLabel !== undefined;
    const matchBadge = hasAnalysis
        ? `<span class="match-badge match-${entry.matchLabel}">${entry.matchScore}%</span>`
        : `<span class="match-badge match-pending">Not Analyzed</span>`;

    div.innerHTML = `
    <div class="tracker-item-header">
      <div class="tracker-item-title">${escapeHtml(entry.roleTitle || entry.pageTitle || entry.title || 'Untitled')}</div>
      <button class="btn-icon-small" onclick="deleteTrackerItem('${entry.id}')" title="Delete">🗑️</button>
    </div>
    <div class="tracker-item-company">${escapeHtml(entry.company || 'Unknown Company')}</div>
    <div class="tracker-item-meta">
      ${matchBadge}
      <span class="tracker-item-date">${formatDate(entry.updatedAtUtc || entry.lastUpdated || entry.appliedDate)}</span>
    </div>
    <div class="tracker-item-status">
      <select class="status-select" data-id="${entry.id}">
        <option value="Inbox" ${entry.status === 'Inbox' ? 'selected' : ''}>Inbox</option>
        <option value="Applied" ${entry.status === 'Applied' ? 'selected' : ''}>Applied</option>
        <option value="Interview" ${entry.status === 'Interview' ? 'selected' : ''}>Interview</option>
        <option value="Offer" ${entry.status === 'Offer' ? 'selected' : ''}>Offer</option>
        <option value="Rejected" ${entry.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        <option value="Hidden" ${entry.status === 'Hidden' ? 'selected' : ''}>Hidden</option>
      </select>
    </div>
    <textarea class="tracker-notes" data-id="${entry.id}" placeholder="Add notes (max 500 chars)" maxlength="500">${escapeHtml(entry.notes || '')}</textarea>
    <div class="tracker-item-actions">
      <button class="btn-secondary btn-small" onclick="openJobLink('${escapeHtml(entry.url)}')">🔗 Open Link</button>
    </div>
  `;

    // Add event listeners
    const statusSelect = div.querySelector('.status-select');
    statusSelect.addEventListener('change', (e) => handleStatusChange(entry.id, e.target.value));

    const notesTextarea = div.querySelector('.tracker-notes');
    notesTextarea.addEventListener('blur', (e) => handleNotesChange(entry.id, e.target.value));

    return div;
}

/**
 * Handle status change
 */
async function handleStatusChange(id, newStatus) {
    try {
        await storage.updateJobEntry(id, { status: newStatus });
        // Don't reload if we're on 'all' filter, just update in place
        if (currentStatusFilter !== 'all') {
            await loadTrackerData();
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showError('Failed to update status');
    }
}

/**
 * Handle notes change
 */
async function handleNotesChange(id, newNotes) {
    try {
        await storage.updateJobEntry(id, { notes: newNotes });
    } catch (error) {
        console.error('Error updating notes:', error);
        showError('Failed to update notes');
    }
}

/**
 * Handle tracker search
 */
async function handleTrackerSearch(event) {
    const query = event.target.value;
    const trackerList = document.getElementById('trackerList');

    try {
        const entries = await storage.searchTrackerEntries(query);
        const filtered = entries.slice(0, 10);

        if (filtered.length === 0) {
            trackerList.innerHTML = '<p class="empty-state">No matching jobs found</p>';
            return;
        }

        trackerList.innerHTML = '';
        filtered.forEach(entry => {
            const item = createTrackerItem(entry);
            trackerList.appendChild(item);
        });
    } catch (error) {
        console.error('Error searching tracker:', error);
    }
}

/**
 * Open settings modal
 */
async function openSettings() {
    const modal = document.getElementById('settingsModal');
    const settings = await storage.getSettings();

    if (settings) {
        document.getElementById('azureEndpoint').value = settings.azureEndpoint || '';
        document.getElementById('apiKey').value = settings.apiKey || '';
        document.getElementById('deployment').value = settings.deployment || '';
        document.getElementById('apiVersion').value = settings.apiVersion || '2024-02-15-preview';
    }

    // Load floating button preference
    const result = await chrome.storage.local.get(['floatingButtonEnabled']);
    const floatingButtonEnabled = result.floatingButtonEnabled !== false; // Default to true
    document.getElementById('floatingButtonEnabled').checked = floatingButtonEnabled;

    // Update CV status
    const cvText = await storage.getCVText();
    updateCVStatus(cvText);

    modal.style.display = 'flex';
}

/**
 * Close settings modal
 */
function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
    document.getElementById('connectionTestResult').style.display = 'none';
}

/**
 * Handle floating button toggle - instant feedback
 */
async function handleFloatingButtonToggle(event) {
    const enabled = event.target.checked;

    try {
        // Save preference immediately
        await chrome.storage.local.set({ floatingButtonEnabled: enabled });

        // Send message to all tabs immediately
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleFloatingButton',
                    enabled: enabled
                });
            } catch (e) {
                // Tab might not have content script, ignore
            }
        }

        console.log('Floating button toggled:', enabled);
    } catch (error) {
        console.error('Error toggling floating button:', error);
    }
}

/**
 * Handle save settings
 */
async function handleSaveSettings(event) {
    event.preventDefault();

    const settings = {
        azureEndpoint: document.getElementById('azureEndpoint').value.trim(),
        apiKey: document.getElementById('apiKey').value.trim(),
        deployment: document.getElementById('deployment').value.trim(),
        apiVersion: document.getElementById('apiVersion').value.trim()
    };

    const floatingButtonEnabled = document.getElementById('floatingButtonEnabled').checked;

    try {
        await storage.saveSettings(settings);
        await chrome.storage.local.set({ floatingButtonEnabled });

        // Send message to all tabs to reload floating button
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'toggleFloatingButton',
                    enabled: floatingButtonEnabled
                });
            } catch (e) {
                // Tab might not have content script, ignore
            }
        }

        showSuccess('Settings saved! Floating button ' + (floatingButtonEnabled ? 'enabled' : 'disabled') + '.');
        setTimeout(() => closeSettings(), 1500);
    } catch (error) {
        console.error('Error saving settings:', error);
        showError('Failed to save settings: ' + error.message);
    }
}

/**
 * Handle test connection
 */
async function handleTestConnection() {
    const settings = {
        azureEndpoint: document.getElementById('azureEndpoint').value.trim(),
        apiKey: document.getElementById('apiKey').value.trim(),
        deployment: document.getElementById('deployment').value.trim(),
        apiVersion: document.getElementById('apiVersion').value.trim()
    };

    const resultDiv = document.getElementById('connectionTestResult');
    resultDiv.style.display = 'block';
    resultDiv.textContent = 'Testing connection...';
    resultDiv.className = '';

    try {
        await testConnection(settings);
        resultDiv.textContent = '✅ Connection successful!';
        resultDiv.className = 'success-message';
    } catch (error) {
        resultDiv.textContent = '❌ Connection failed: ' + error.message;
        resultDiv.className = 'error-message';
    }
}

/**
 * Handle clear CV
 */
async function handleClearCV() {
    if (confirm('Are you sure you want to clear your uploaded CV?')) {
        await storage.saveCVText('');
        updateCVStatus('');
        showSuccess('CV cleared');
    }
}

// Global functions for inline event handlers
window.deleteTrackerItem = async function (id) {
    if (confirm('Delete this job from tracker?')) {
        try {
            await storage.deleteJobEntry(id);
            await loadTrackerData();
            showSuccess('Job deleted');
        } catch (error) {
            console.error('Error deleting job:', error);
            showError('Failed to delete job');
        }
    }
};

window.openJobLink = function (url) {
    chrome.tabs.create({ url: url });
};

/**
 * Utility functions
 */
function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'block' : 'none';
    document.getElementById('analyzeBtn').disabled = show;
}

function showError(message) {
    const errorState = document.getElementById('errorState');
    errorState.querySelector('.error-message').textContent = message;
    errorState.style.display = 'block';
}

function hideError() {
    document.getElementById('errorState').style.display = 'none';
}

function showAnalysisResults() {
    document.getElementById('analysisResults').style.display = 'block';
}

function hideAnalysisResults() {
    document.getElementById('analysisResults').style.display = 'none';
}

function showSuccess(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function generateJobId(url) {
    // Simple hash function
    const timestamp = Date.now();
    return `${simpleHash(url)}-${timestamp}`;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

function extractRoleTitle(pageTitle) {
    // Try to extract role title from page title
    // Common patterns: "Job Title | Company", "Job Title - Company", "Job Title at Company"
    const patterns = [
        /^([^|]+)\|/,
        /^([^-]+)-/,
        /^(.+?)\s+at\s+/i,
        /^(.+?)\s+\|\s+/,
    ];

    for (const pattern of patterns) {
        const match = pageTitle.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }

    return pageTitle;
}

function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
