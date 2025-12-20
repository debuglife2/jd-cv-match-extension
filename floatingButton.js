// Floating button that appears on job pages
// User clicks it to trigger analysis in an overlay

(function () {
    'use strict';

    // Avoid duplicate injection
    if (window.jdCvFloatingButtonLoaded) {
        return;
    }
    window.jdCvFloatingButtonLoaded = true;

    // Check if floating button is enabled
    chrome.storage.local.get(['floatingButtonEnabled'], (result) => {
        const isEnabled = result.floatingButtonEnabled !== false; // Default to true
        if (!isEnabled) {
            console.log('Floating button is disabled');
            return;
        }

        initFloatingButton();
    });

    function initFloatingButton() {
        // Create wrapper to keep hover state
        const wrapper = document.createElement('div');
        wrapper.id = 'jd-cv-floating-wrapper';

        // Create floating button
        const button = document.createElement('div');
        button.id = 'jd-cv-floating-button';
        button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
        button.title = 'JD-CV Match';

        // Create action buttons container (hidden by default, shows on hover)
        const actionsContainer = document.createElement('div');
        actionsContainer.id = 'jd-cv-actions-container';
        actionsContainer.innerHTML = `
        <button class="jd-cv-action-btn" data-action="turnOff" title="Turn off floating button">
            <span class="jd-cv-action-icon">🚫</span>
            <span class="jd-cv-action-label">Turn Off</span>
        </button>
        <button class="jd-cv-action-btn" data-action="analyze" title="Analyze job with AI">
            <span class="jd-cv-action-icon">🤖</span>
            <span class="jd-cv-action-label">Analyze Job</span>
        </button>
        <button class="jd-cv-action-btn" data-action="save" title="Save to tracker">
            <span class="jd-cv-action-icon">📌</span>
            <span class="jd-cv-action-label">Add to Tracker</span>
        </button>
        <button class="jd-cv-action-btn" data-action="openTracker" title="Open job tracker">
            <span class="jd-cv-action-icon">📋</span>
            <span class="jd-cv-action-label">Open Tracker</span>
        </button>
    `;

        // Add to wrapper and then to page
        wrapper.appendChild(actionsContainer);
        wrapper.appendChild(button);
        document.body.appendChild(wrapper);

        // Handle action button clicks
        actionsContainer.addEventListener('click', async (e) => {
            const actionBtn = e.target.closest('.jd-cv-action-btn');
            if (!actionBtn) return;

            const action = actionBtn.dataset.action;

            // Add loading state
            button.classList.add('loading');

            try {
                switch (action) {
                    case 'turnOff':
                        console.log('Turn off clicked');
                        // Save preference and hide the wrapper
                        chrome.storage.local.set({ floatingButtonEnabled: false });
                        wrapper.style.display = 'none';
                        showSuccessToast('Floating button hidden. Re-enable in extension settings.');
                        break;

                    case 'analyze':
                        console.log('Analyze job clicked');
                        await handleAnalyze();
                        break;

                    case 'save':
                        console.log('Add to tracker clicked');
                        await handleSaveToTracker();
                        break;

                    case 'openTracker':
                        console.log('Open tracker clicked');
                        // TODO: Implement open tracker functionality
                        break;
                }
            } finally {
                button.classList.remove('loading');
            }
        });

        // Handle analyze action
        async function handleAnalyze() {
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'analyzeCurrentPage'
                });

                if (response && response.success) {
                    showOverlay(response.data);
                } else {
                    showError(response?.error || 'Analysis failed. Please upload your CV in the extension popup.');
                }
            } catch (error) {
                console.error('Error triggering analysis:', error);
                showError('Could not connect to extension. Please try again.');
            }
        }

        // Handle save to tracker action
        async function handleSaveToTracker() {
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'saveToTracker'
                });

                if (response && response.success) {
                    showSuccessToast('Job saved to tracker!');
                } else {
                    showError(response?.error || 'Failed to save job to tracker.');
                }
            } catch (error) {
                console.error('Error saving to tracker:', error);
                showError('Could not save to tracker. Please try again.');
            }
        }    // Show overlay with results
        function showOverlay(analysisData) {
            // Remove existing overlay
            const existing = document.getElementById('jd-cv-overlay');
            if (existing) {
                existing.remove();
            }

            const overlay = document.createElement('div');
            overlay.id = 'jd-cv-overlay';
            overlay.innerHTML = buildOverlayHTML(analysisData);
            document.body.appendChild(overlay);

            // Attach close handler
            const closeBtn = overlay.querySelector('.jd-cv-close-btn');
            closeBtn?.addEventListener('click', () => overlay.remove());

            // Close on backdrop click
            const backdrop = overlay.querySelector('.jd-cv-backdrop');
            backdrop?.addEventListener('click', () => overlay.remove());

            // Copy bullets handler
            const copyBtn = overlay.querySelector('.jd-cv-copy-bullets');
            copyBtn?.addEventListener('click', () => copyBullets(analysisData.tailored_bullets));

            // Animate in
            setTimeout(() => overlay.classList.add('show'), 10);
        }

        // Build overlay HTML
        function buildOverlayHTML(data) {
            const matchClass = data.match_label || 'medium';

            return `
            <div class="jd-cv-backdrop"></div>
            <div class="jd-cv-content">
                <div class="jd-cv-header">
                    <h2>🎯 Job Match Analysis</h2>
                    <button class="jd-cv-close-btn" title="Close">×</button>
                </div>
                
                <div class="jd-cv-body">
                    <!-- Match Score -->
                    <div class="jd-cv-score-section">
                        <div class="jd-cv-score-circle">
                            <div class="jd-cv-score-value">${data.match_score}%</div>
                            <div class="jd-cv-score-label">Match Score</div>
                        </div>
                        <div class="jd-cv-badge jd-cv-badge-${matchClass}">
                            ${matchClass.toUpperCase()} MATCH
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="jd-cv-section">
                        <h3>📋 Quick Summary</h3>
                        <div class="jd-cv-grid">
                            <div class="jd-cv-card jd-cv-strength">
                                <div class="jd-cv-card-icon">💪</div>
                                <div class="jd-cv-card-content">
                                    <strong>Strength</strong>
                                    <p>${escapeHtml(data.explanation.strength)}</p>
                                </div>
                            </div>
                            <div class="jd-cv-card jd-cv-weakness">
                                <div class="jd-cv-card-icon">⚠️</div>
                                <div class="jd-cv-card-content">
                                    <strong>Weakness</strong>
                                    <p>${escapeHtml(data.explanation.weakness)}</p>
                                </div>
                            </div>
                            <div class="jd-cv-card jd-cv-recommendation">
                                <div class="jd-cv-card-icon">💡</div>
                                <div class="jd-cv-card-content">
                                    <strong>Recommendation</strong>
                                    <p>${escapeHtml(data.explanation.recommendation)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Gap Analysis -->
                    ${data.gap_analysis && data.gap_analysis.length > 0 ? `
                    <div class="jd-cv-section">
                        <h3>🔍 Gap Analysis</h3>
                        <ul class="jd-cv-gap-list">
                            ${data.gap_analysis.map(gap => `<li>${escapeHtml(gap)}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}

                    <!-- Tailored Bullets -->
                    ${data.tailored_bullets && data.tailored_bullets.length > 0 ? `
                    <div class="jd-cv-section">
                        <h3>✨ Tailored CV Bullets</h3>
                        <div class="jd-cv-bullets-header">
                            <p>Use these bullets in your CV/resume:</p>
                            <button class="jd-cv-copy-bullets">📋 Copy All</button>
                        </div>
                        <ul class="jd-cv-bullet-list">
                            ${data.tailored_bullets.map(bullet => `<li>${escapeHtml(bullet)}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        }

        // Show error message
        function showError(message) {
            const overlay = document.createElement('div');
            overlay.id = 'jd-cv-overlay';
            overlay.innerHTML = `
            <div class="jd-cv-backdrop"></div>
            <div class="jd-cv-content jd-cv-error">
                <div class="jd-cv-header">
                    <h2>⚠️ Error</h2>
                    <button class="jd-cv-close-btn">×</button>
                </div>
                <div class="jd-cv-body">
                    <p>${escapeHtml(message)}</p>
                </div>
            </div>
        `;
            document.body.appendChild(overlay);

            const closeBtn = overlay.querySelector('.jd-cv-close-btn');
            closeBtn?.addEventListener('click', () => overlay.remove());

            const backdrop = overlay.querySelector('.jd-cv-backdrop');
            backdrop?.addEventListener('click', () => overlay.remove());

            setTimeout(() => overlay.classList.add('show'), 10);
        }

        // Show success toast
        function showSuccessToast(message) {
            const toast = document.createElement('div');
            toast.className = 'jd-cv-toast jd-cv-toast-success';
            toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>${escapeHtml(message)}</span>
        `;
            document.body.appendChild(toast);

            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }    // Copy bullets to clipboard
        function copyBullets(bullets) {
            const text = bullets.map(b => `• ${b}`).join('\n');
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.querySelector('.jd-cv-copy-bullets');
                if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = '✅ Copied!';
                    btn.style.background = '#10b981';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '';
                    }, 2000);
                }
            });
        }

        // Escape HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

    } // End of initFloatingButton()

    // Listen for toggle messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleFloatingButton') {
            const wrapper = document.getElementById('jd-cv-floating-wrapper');
            if (request.enabled) {
                // Re-enable button
                if (!wrapper) {
                    // Button doesn't exist, initialize it
                    initFloatingButton();
                } else {
                    wrapper.style.display = 'block';
                }
            } else {
                // Disable button
                if (wrapper) {
                    wrapper.style.display = 'none';
                }
            }
            sendResponse({ success: true });
        }
    });

    console.log('JD-CV Floating Button script loaded');
})();
