// Background service worker for Chrome Extension
// Handles extension lifecycle and messaging

// Import Azure OpenAI module
import { analyzeJDWithCV } from '../azureOpenAI.js';

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('JD-CV Match Extension installed');

        // Initialize default storage if needed
        chrome.storage.local.get(['settings', 'tracker'], (result) => {
            if (!result.settings) {
                chrome.storage.local.set({
                    settings: {
                        azureEndpoint: '',
                        apiKey: '',
                        deployment: '',
                        apiVersion: '2024-02-15-preview'
                    }
                });
            }

            // Add mock jobs for testing if tracker is empty
            if (!result.tracker || result.tracker.length === 0) {
                const mockJobs = [
                    {
                        id: '1734700001000',
                        company: 'Microsoft',
                        roleTitle: 'Senior Software Engineer',
                        pageTitle: 'Senior Software Engineer - Microsoft Careers',
                        url: 'https://careers.microsoft.com/us/en/job/1234567/Senior-Software-Engineer',
                        status: 'Inbox',
                        notes: '',
                        matchScore: 85,
                        matchLabel: 'high',
                        updatedAtUtc: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: '1734700002000',
                        company: 'Google',
                        roleTitle: 'Full Stack Developer',
                        pageTitle: 'Full Stack Developer - Google Careers',
                        url: 'https://careers.google.com/jobs/results/123456789/',
                        status: 'Inbox',
                        notes: '',
                        updatedAtUtc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: '1734700003000',
                        company: 'Amazon',
                        roleTitle: 'Frontend Engineer',
                        pageTitle: 'Frontend Engineer - Amazon Jobs',
                        url: 'https://www.amazon.jobs/en/jobs/12345/frontend-engineer',
                        status: 'Interview',
                        notes: 'Phone screen scheduled for next week',
                        matchScore: 72,
                        matchLabel: 'medium',
                        updatedAtUtc: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: '1734700004000',
                        company: 'Meta',
                        roleTitle: 'Software Engineer, Infrastructure',
                        pageTitle: 'Software Engineer, Infrastructure - Meta Careers',
                        url: 'https://www.metacareers.com/jobs/1234567890/',
                        status: 'Interview',
                        notes: 'Completed first round, waiting for feedback',
                        matchScore: 90,
                        matchLabel: 'high',
                        updatedAtUtc: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: '1734700005000',
                        company: 'Apple',
                        roleTitle: 'iOS Developer',
                        pageTitle: 'iOS Developer - Apple Jobs',
                        url: 'https://jobs.apple.com/en-us/details/200123456/ios-developer',
                        status: 'Rejected',
                        notes: 'Not a good fit for the team at this time',
                        matchScore: 65,
                        matchLabel: 'medium',
                        updatedAtUtc: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ];

                chrome.storage.local.set({ tracker: mockJobs });
                console.log('Mock jobs added to tracker for testing');
            }
        });
    }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractFromTab') {
        // Request to extract content from active tab
        handleExtractFromTab(request.tabId)
            .then(content => sendResponse({ success: true, content }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }

    if (request.action === 'analyzeCurrentPage') {
        // Request from floating button to analyze current page
        handleAnalyzeCurrentPage(sender.tab.id)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'saveToTracker') {
        // Request from floating button to save job to tracker
        handleSaveToTracker(sender.tab)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

/**
 * Extract content from a specific tab
 */
async function handleExtractFromTab(tabId) {
    try {
        // Inject content script if not already present
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['contentScript.js']
        });

        // Send message to content script to extract content
        const response = await chrome.tabs.sendMessage(tabId, {
            action: 'extractPageContent'
        });

        if (response.success) {
            return response.content;
        } else {
            throw new Error(response.error || 'Failed to extract content');
        }
    } catch (error) {
        console.error('Error in handleExtractFromTab:', error);
        throw error;
    }
}

/**
 * Handle analyze request from floating button
 */
async function handleAnalyzeCurrentPage(tabId) {
    try {
        // 1. Check if CV is uploaded
        const storage = await chrome.storage.local.get(['cvText', 'settings']);
        if (!storage.cvText) {
            throw new Error('No CV uploaded. Please upload your CV in the extension popup first.');
        }

        // 2. Extract page content
        const content = await handleExtractFromTab(tabId);

        console.log('Extracted content:', content);
        console.log('Main text length:', content.mainText?.length);

        // 3. Analyze with Azure OpenAI
        const analysis = await analyzeJDWithCV(storage.settings, storage.cvText, content.mainText);

        return analysis;
    } catch (error) {
        console.error('Error analyzing page:', error);
        throw error;
    }
}

/**
 * Handle save to tracker request from floating button
 */
async function handleSaveToTracker(tab) {
    try {
        // 1. Extract basic page content
        const content = await handleExtractFromTab(tab.id);

        // 2. Get existing tracker
        const storage = await chrome.storage.local.get(['tracker']);
        const tracker = storage.tracker || [];

        // 3. Create job entry
        const job = {
            id: Date.now().toString(),
            company: content.company,
            title: content.title,
            url: tab.url,
            status: 'Inbox',
            appliedDate: new Date().toISOString().split('T')[0],
            notes: '',
            lastUpdated: new Date().toISOString()
        };

        // 4. Check for duplicates
        const exists = tracker.some(j => j.url === job.url);
        if (exists) {
            const cuteMessages = [
                '👀 Looks like you already saved this one!',
                '🔄 This job is already in your tracker!',
                '✅ Already got this one covered!',
                '📌 This gem is already saved!',
                '🎯 You\'re already tracking this opportunity!',
                '💫 Great minds think alike - already saved!',
                '🌟 This one\'s already on your radar!',
                '🔖 Already bookmarked this beauty!'
            ];
            const randomMessage = cuteMessages[Math.floor(Math.random() * cuteMessages.length)];
            throw new Error(randomMessage);
        }

        // 5. Add to tracker (max 200 jobs)
        tracker.unshift(job);
        if (tracker.length > 200) {
            tracker.pop();
        }

        // 6. Save to storage
        await chrome.storage.local.set({ tracker });

        return job;
    } catch (error) {
        console.error('Error saving to tracker:', error);
        throw error;
    }
}

console.log('JD-CV Match Extension service worker initialized');
