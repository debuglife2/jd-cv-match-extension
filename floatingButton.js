// Floating button that appears on job pages
// User clicks it to trigger analysis in an overlay

(function () {
    'use strict';

    // Avoid duplicate injection
    if (window.jdCvFloatingButtonLoaded) {
        return;
    }
    window.jdCvFloatingButtonLoaded = true;

    // Helper function to safely send messages to background script
    async function sendMessageSafely(message) {
        try {
            // Check if extension context is valid
            if (!chrome.runtime?.id) {
                throw new Error('Extension context invalidated. Please reload the page.');
            }

            const response = await chrome.runtime.sendMessage(message);
            return response;
        } catch (error) {
            if (error.message.includes('Extension context invalidated') ||
                error.message.includes('message port closed') ||
                error.message.includes('Receiving end does not exist')) {
                throw new Error('Extension was reloaded. Please refresh this page to continue.');
            }
            throw error;
        }
    }

    // Check if floating button is enabled
    chrome.storage.local.get(['floatingButtonEnabled'], (result) => {
        const isEnabled = result.floatingButtonEnabled !== false; // Default to true
        if (!isEnabled) {
            console.log('Floating button is disabled');
            return;
        }

        initFloatingButton();
    });

    // Global reference to showTrackerPanel function
    let showTrackerPanelRef = null;

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
        <button class="jd-cv-action-btn" data-action="save" title="Save to tracker">
            <span class="jd-cv-action-icon">📌</span>
            <span class="jd-cv-action-label">Add to Tracker</span>
        </button>
        <button class="jd-cv-action-btn" data-action="analyze" title="Analyze job with AI">
            <span class="jd-cv-action-icon">🤖</span>
            <span class="jd-cv-action-label">Analyze Job</span>
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
                        showTrackerPanel();
                        break;
                }
            } finally {
                button.classList.remove('loading');
            }
        });

        // Handle analyze action
        async function handleAnalyze() {
            // Show loading indicator
            showLoadingOverlay();

            try {
                const response = await sendMessageSafely({
                    action: 'analyzeCurrentPage'
                });

                // Hide loading indicator
                hideLoadingOverlay();

                if (response && response.success) {
                    showOverlay(response.data);
                } else {
                    showError(response?.error || 'Analysis failed. Please upload your CV in the extension popup.');
                }
            } catch (error) {
                console.error('Error triggering analysis:', error);
                hideLoadingOverlay();
                showError(error.message || 'Could not connect to extension. Please try again.');
            }
        }

        // Handle save to tracker action
        async function handleSaveToTracker() {
            try {
                const response = await sendMessageSafely({
                    action: 'saveToTracker'
                });

                if (response && response.success) {
                    const cuteMessages = [
                        '✨ Job saved! You\'re one step closer!',
                        '🎯 Added to tracker! Go get \'em!',
                        '🚀 Saved! Your future awaits!',
                        '💼 Job tracked! Let\'s land this one!',
                        '⭐ Added! Time to shine!',
                        '🎉 Saved to tracker! You got this!',
                        '💪 Job captured! Ready to apply?',
                        '🌟 Tracked! Your next adventure awaits!'
                    ];
                    const randomMessage = cuteMessages[Math.floor(Math.random() * cuteMessages.length)];
                    showSuccessToast(randomMessage);
                } else {
                    // Check if it's a duplicate message
                    const errorMsg = response?.error || 'Failed to save job to tracker.';
                    if (errorMsg.includes('already')) {
                        showInfoMessage(errorMsg);
                    } else {
                        showError(errorMsg);
                    }
                }
            } catch (error) {
                console.error('Error saving to tracker:', error);
                const errorMsg = error.message || 'Could not save to tracker. Please try again.';
                if (errorMsg.includes('already')) {
                    showInfoMessage(errorMsg);
                } else {
                    showError(errorMsg);
                }
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
                                    <strong>Risk</strong>
                                    <p>${escapeHtml(data.explanation.risk)}</p>
                                </div>
                            </div>
                            <div class="jd-cv-card jd-cv-recommendation">
                                <div class="jd-cv-card-icon">💡</div>
                                <div class="jd-cv-card-content">
                                    <strong>Suggestion</strong>
                                    <p>${escapeHtml(data.explanation.suggestion)}</p>
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
                    <h2>⚠️ Oops!</h2>
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

        // Show info message (for non-error situations like duplicates)
        function showInfoMessage(message) {
            const overlay = document.createElement('div');
            overlay.id = 'jd-cv-overlay';
            overlay.innerHTML = `
            <div class="jd-cv-backdrop"></div>
            <div class="jd-cv-content jd-cv-info">
                <div class="jd-cv-header">
                    <h2>😊 Hey There!</h2>
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

        // Show loading overlay
        function showLoadingOverlay() {
            const existing = document.getElementById('jd-cv-loading-overlay');
            if (existing) return;

            const overlay = document.createElement('div');
            overlay.id = 'jd-cv-loading-overlay';
            overlay.className = 'jd-cv-overlay';
            overlay.innerHTML = `
            <div class="jd-cv-backdrop"></div>
            <div class="jd-cv-content jd-cv-loading">
                <div class="jd-cv-loading-spinner">
                    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="30" cy="30" r="25" fill="none" stroke="#e5e7eb" stroke-width="4"/>
                        <circle cx="30" cy="30" r="25" fill="none" stroke="#3b82f6" stroke-width="4" stroke-linecap="round" stroke-dasharray="120" stroke-dashoffset="30">
                            <animateTransform attributeName="transform" type="rotate" from="0 30 30" to="360 30 30" dur="1s" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                </div>
                <h3 class="jd-cv-loading-text">Analyzing job description...</h3>
                <p class="jd-cv-loading-subtext">This may take a few moments</p>
            </div>
        `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('show'), 10);
        }

        // Hide loading overlay
        function hideLoadingOverlay() {
            const overlay = document.getElementById('jd-cv-loading-overlay');
            if (overlay) {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            }
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

        // Show tracker panel
        function showTrackerPanel() {
            // Remove existing panel if present
            const existing = document.getElementById('jd-cv-tracker-panel');
            if (existing) {
                existing.remove();
                return; // Toggle behavior
            }

            // Get tracker data
            chrome.storage.local.get(['tracker'], (result) => {
                const tracker = result.tracker || [];

                const panel = document.createElement('div');
                panel.id = 'jd-cv-tracker-panel';
                panel.innerHTML = buildTrackerPanelHTML(tracker);
                document.body.appendChild(panel);

                // Attach close handler
                const closeBtn = panel.querySelector('.jd-cv-panel-close');
                closeBtn?.addEventListener('click', () => panel.remove());

                // Attach drag and drop handlers
                attachDragHandlers(panel);

                // Animate in
                setTimeout(() => panel.classList.add('show'), 10);
            });
        }

        // Store reference to showTrackerPanel for external access
        showTrackerPanelRef = showTrackerPanel;

        // Build tracker panel HTML
        function buildTrackerPanelHTML(tracker) {
            // Group jobs by status
            const grouped = {
                Inbox: [],
                Applied: [],
                Interview: [],
                Offer: [],
                Rejected: []
            };

            tracker.forEach(job => {
                if (grouped[job.status]) {
                    grouped[job.status].push(job);
                }
            });

            return `
            <div class="jd-cv-panel-header">
                <h2>📋 Job Tracker</h2>
                <button class="jd-cv-panel-close" title="Close">×</button>
            </div>
            <div class="jd-cv-panel-body">
                ${Object.keys(grouped).map(status => `
                    <div class="jd-cv-tracker-section" data-status="${status}">
                        <h3 class="jd-cv-tracker-status-header">
                            <span>${status}</span>
                            <span class="jd-cv-tracker-count">${grouped[status].length}</span>
                        </h3>
                        ${grouped[status].length > 0 ? `
                            <div class="jd-cv-tracker-jobs">
                                ${grouped[status].map(job => `
                                    <div class="jd-cv-tracker-job" draggable="true" data-job-id="${escapeHtml(job.id)}" data-job-status="${escapeHtml(job.status)}">
                                        <button class="jd-cv-tracker-job-delete" title="Delete job" data-job-id="${escapeHtml(job.id)}">🗑️</button>
                                        <div class="jd-cv-tracker-job-title">${escapeHtml(job.roleTitle || job.pageTitle || job.title || 'Untitled')}</div>
                                        <div class="jd-cv-tracker-job-company">${escapeHtml(job.company || 'Unknown')}</div>
                                        ${job.matchScore ? `<div class="jd-cv-tracker-job-match match-${job.matchLabel}">${job.matchScore}%</div>` : ''}
                                        <a href="${escapeHtml(job.url)}" target="_blank" class="jd-cv-tracker-job-link" title="Open job posting" onclick="event.stopPropagation()">🔗</a>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="jd-cv-tracker-empty">No jobs in ${status}</div>
                        `}
                    </div>
                `).join('')}
            </div>
        `;
        }

        /**
         * Attach drag and drop handlers to enable moving jobs between status sections
         * @param {HTMLElement} panel - The tracker panel element
         */
        function attachDragHandlers(panel) {
            let draggedJobId = null;
            let draggedJobStatus = null;

            // Add dragstart listener to all job cards
            const jobCards = panel.querySelectorAll('.jd-cv-tracker-job');
            jobCards.forEach(card => {
                card.addEventListener('dragstart', (e) => {
                    draggedJobId = e.target.getAttribute('data-job-id');
                    draggedJobStatus = e.target.getAttribute('data-job-status');
                    e.target.style.opacity = '0.5';
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', e.target.innerHTML);
                });

                card.addEventListener('dragend', (e) => {
                    e.target.style.opacity = '1';
                });
            });

            // Add dragover and drop listeners to status sections
            const sections = panel.querySelectorAll('.jd-cv-tracker-section');
            sections.forEach((section) => {
                section.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                });

                section.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    section.classList.add('drag-over');
                });

                section.addEventListener('dragleave', () => {
                    section.classList.remove('drag-over');
                });

                section.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    section.classList.remove('drag-over');

                    if (!draggedJobId) return;

                    const newStatus = section.getAttribute('data-status');

                    // Don't do anything if dropping on the same status
                    if (newStatus === draggedJobStatus) {
                        return;
                    }

                    // Update job status in storage
                    try {
                        const result = await chrome.storage.local.get(['tracker']);
                        const tracker = result.tracker || [];

                        const jobIndex = tracker.findIndex(j => j.id === draggedJobId);
                        if (jobIndex !== -1) {
                            tracker[jobIndex].status = newStatus;
                            tracker[jobIndex].updatedAtUtc = new Date().toISOString();

                            await chrome.storage.local.set({ tracker });

                            // Move the job card in the DOM instead of refreshing
                            const draggedCard = panel.querySelector(`.jd-cv-tracker-job[data-job-id="${draggedJobId}"]`);
                            let targetJobsContainer = section.querySelector('.jd-cv-tracker-jobs');
                            const oldSection = draggedCard.closest('.jd-cv-tracker-section');

                            if (draggedCard) {
                                // Update the card's data-job-status attribute
                                draggedCard.setAttribute('data-job-status', newStatus);

                                // Remove empty message if present
                                const emptyMsg = section.querySelector('.jd-cv-tracker-empty');
                                if (emptyMsg) {
                                    emptyMsg.remove();
                                }

                                // Create jobs container if it doesn't exist
                                if (!targetJobsContainer) {
                                    targetJobsContainer = document.createElement('div');
                                    targetJobsContainer.className = 'jd-cv-tracker-jobs';
                                    section.appendChild(targetJobsContainer);
                                }

                                // Move to new section
                                targetJobsContainer.appendChild(draggedCard);

                                // Move to new section
                                targetJobsContainer.appendChild(draggedCard);

                                // Update count badges
                                const newCount = section.querySelectorAll('.jd-cv-tracker-job').length;
                                const newCountBadge = section.querySelector('.jd-cv-tracker-count');
                                if (newCountBadge) {
                                    newCountBadge.textContent = newCount;
                                }

                                // Update old section
                                const oldCount = oldSection.querySelectorAll('.jd-cv-tracker-job').length;
                                const oldCountBadge = oldSection.querySelector('.jd-cv-tracker-count');
                                if (oldCountBadge) {
                                    oldCountBadge.textContent = oldCount;
                                }

                                // Show empty message if old section is now empty
                                if (oldCount === 0) {
                                    const oldJobsContainer = oldSection.querySelector('.jd-cv-tracker-jobs');
                                    if (oldJobsContainer) {
                                        oldJobsContainer.remove();
                                    }
                                    const emptyDiv = document.createElement('div');
                                    emptyDiv.className = 'jd-cv-tracker-empty';
                                    emptyDiv.textContent = `No jobs in ${oldSection.getAttribute('data-status')}`;
                                    oldSection.appendChild(emptyDiv);
                                }

                                // Show success toast
                                showSuccessToast(`Moved to ${newStatus}`);
                            }
                        }
                    } catch (error) {
                        console.error('Error updating job status:', error);
                        showSuccessToast('Failed to update job status');
                    }

                    // Reset dragged job info
                    draggedJobId = null;
                    draggedJobStatus = null;
                });
            });

            // Add delete button handlers
            const deleteButtons = panel.querySelectorAll('.jd-cv-tracker-job-delete');
            deleteButtons.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const jobId = btn.getAttribute('data-job-id');

                    // Check if already in confirm state
                    if (btn.classList.contains('confirm-delete')) {
                        // Second click - actually delete
                        try {
                            // Remove from storage
                            const result = await chrome.storage.local.get(['tracker']);
                            const tracker = result.tracker || [];
                            const updatedTracker = tracker.filter(j => j.id !== jobId);
                            await chrome.storage.local.set({ tracker: updatedTracker });

                            // Remove from DOM
                            const jobCard = panel.querySelector(`.jd-cv-tracker-job[data-job-id="${jobId}"]`);
                            const section = jobCard.closest('.jd-cv-tracker-section');
                            jobCard.remove();

                            // Update count
                            const count = section.querySelectorAll('.jd-cv-tracker-job').length;
                            const countBadge = section.querySelector('.jd-cv-tracker-count');
                            if (countBadge) {
                                countBadge.textContent = count;
                            }

                            // Show empty message if section is now empty
                            if (count === 0) {
                                const jobsContainer = section.querySelector('.jd-cv-tracker-jobs');
                                if (jobsContainer) {
                                    jobsContainer.remove();
                                }
                                const emptyDiv = document.createElement('div');
                                emptyDiv.className = 'jd-cv-tracker-empty';
                                emptyDiv.textContent = `No jobs in ${section.getAttribute('data-status')}`;
                                section.appendChild(emptyDiv);
                            }

                            showSuccessToast('Job deleted');
                        } catch (error) {
                            console.error('Error deleting job:', error);
                            showSuccessToast('Failed to delete job');
                        }
                    } else {
                        // First click - change to confirm state
                        btn.classList.add('confirm-delete');
                        btn.textContent = 'Delete';
                        btn.title = 'Click again to confirm';

                        // Reset after 3 seconds if not clicked
                        setTimeout(() => {
                            if (btn.classList.contains('confirm-delete')) {
                                btn.classList.remove('confirm-delete');
                                btn.textContent = '🗑️';
                                btn.title = 'Delete job';
                            }
                        }, 3000);
                    }
                });
            });
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
        } else if (request.action === 'openTracker') {
            // Open tracker panel
            if (showTrackerPanelRef) {
                showTrackerPanelRef();
                sendResponse({ success: true });
            } else {
                // Initialize if not already done
                initFloatingButton();
                // Try again after a short delay
                setTimeout(() => {
                    if (showTrackerPanelRef) {
                        showTrackerPanelRef();
                    }
                }, 100);
                sendResponse({ success: true });
            }
        }
    });

    console.log('JD-CV Floating Button script loaded');
})();
