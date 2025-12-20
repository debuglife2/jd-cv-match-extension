// Content script for extracting page text
// Only runs when requested by the popup/service worker

// Prevent multiple injections
if (window.jdCvMatchExtensionLoaded) {
    console.log('Content script already loaded, skipping re-initialization');
} else {
    window.jdCvMatchExtensionLoaded = true;
    console.log('JD-CV Match Extension content script initializing...');

    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extractPageContent') {
            try {
                const content = extractPageContent();
                sendResponse({ success: true, content });
            } catch (error) {
                console.error('Error extracting page content:', error);
                sendResponse({ success: false, error: error.message });
            }
            return true; // Keep the message channel open for async response
        }
    });
}

/**
 * Extract relevant text content from the current page
 */
function extractPageContent() {
    const MAX_TEXT_LENGTH = 20000; // Cap at ~20k characters to fit model context

    // Get page metadata
    const pageTitle = document.title || '';
    const pageUrl = window.location.href;

    // Try to extract main content intelligently
    let mainText = '';

    // Strategy 1: Look for common article/content containers
    const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.job-description',
        '.job-details',
        '.description',
        '.content',
        '#content',
        '#main-content',
        '.post-content',
        '.entry-content'
    ];

    for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            mainText = extractTextFromElement(element);
            if (mainText.length > 200) {
                break; // Found substantial content
            }
        }
    }

    // Strategy 2: Fallback to body if no main content found
    if (mainText.length < 200) {
        mainText = extractTextFromElement(document.body);
    }

    // Clean up the text
    mainText = cleanText(mainText);

    // Cap the text length
    if (mainText.length > MAX_TEXT_LENGTH) {
        mainText = mainText.substring(0, MAX_TEXT_LENGTH) + '\n\n[Content truncated to fit context limits]';
    }

    // Try to extract company name (common patterns)
    const company = extractCompanyName();

    // Try to extract job level (seniority)
    const jobLevel = extractJobLevel(pageTitle, mainText);

    // Log extraction details
    console.log('========== CONTENT EXTRACTION ==========');
    console.log('Page Title:', pageTitle);
    console.log('Company:', company || 'Not detected');
    console.log('Job Level:', jobLevel || 'Not detected');
    console.log('Content Length:', mainText.length, 'chars');
    console.log('Content:', mainText, 'chars');
    console.log('URL:', pageUrl);
    console.log('========================================');

    return {
        pageTitle,
        pageUrl,
        mainText,
        company,
        jobLevel,
        extractedAt: new Date().toISOString()
    };
}

/**
 * Extract text from an element, ignoring navigation and footers
 */
function extractTextFromElement(element) {
    // Clone the element to avoid modifying the actual DOM
    const clone = element.cloneNode(true);

    // Remove unwanted elements
    const unwantedSelectors = [
        'script',
        'style',
        'nav',
        'header',
        'footer',
        '.navigation',
        '.menu',
        '.sidebar',
        '.advertisement',
        '.ads',
        '[role="navigation"]',
        '[role="banner"]',
        '[role="contentinfo"]'
    ];

    unwantedSelectors.forEach(selector => {
        const elements = clone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
    });

    return clone.innerText || clone.textContent || '';
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
    return text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
        .trim();
}

/**
 * Attempt to extract company name from page
 */
function extractCompanyName() {
    // Try URL-based detection first (most reliable)
    const hostname = window.location.hostname;
    const urlPatterns = [
        { pattern: /microsoft\.com/, name: 'Microsoft' },
        { pattern: /linkedin\.com/, name: 'LinkedIn' },
        { pattern: /google\.com|careers\.google/, name: 'Google' },
        { pattern: /amazon\.jobs|amazon\.com\/jobs/, name: 'Amazon' },
        { pattern: /apple\.com/, name: 'Apple' },
        { pattern: /meta\.com|facebook\.com\/careers/, name: 'Meta' },
        { pattern: /netflix\.jobs|netflix\.com/, name: 'Netflix' },
        { pattern: /tesla\.com/, name: 'Tesla' },
        { pattern: /uber\.com/, name: 'Uber' },
        { pattern: /airbnb\.com/, name: 'Airbnb' },
        { pattern: /stripe\.com/, name: 'Stripe' },
        { pattern: /spotify\.com/, name: 'Spotify' },
        { pattern: /salesforce\.com/, name: 'Salesforce' },
        { pattern: /oracle\.com/, name: 'Oracle' },
        { pattern: /ibm\.com/, name: 'IBM' },
        { pattern: /adobe\.com/, name: 'Adobe' },
        { pattern: /intel\.com/, name: 'Intel' },
        { pattern: /nvidia\.com/, name: 'NVIDIA' },
        { pattern: /greenhouse\.io/, name: extractFromGreenhouseUrl() },
        { pattern: /lever\.co/, name: extractFromLeverUrl() }
    ];

    for (const { pattern, name } of urlPatterns) {
        if (pattern.test(hostname)) {
            if (typeof name === 'function') {
                const extracted = name();
                if (extracted) return extracted;
            } else if (name) {
                return name;
            }
        }
    }

    // Common patterns for company names
    const patterns = [
        // Meta tags
        () => document.querySelector('meta[property="og:site_name"]')?.content,
        () => document.querySelector('meta[name="author"]')?.content,
        () => document.querySelector('meta[property="og:title"]')?.content?.split('|')[1]?.trim(),

        // Common class/id patterns
        () => document.querySelector('.company-name')?.textContent,
        () => document.querySelector('.employer-name')?.textContent,
        () => document.querySelector('[class*="company"]')?.textContent,
        () => document.getElementById('company')?.textContent,
        () => document.querySelector('[data-company]')?.getAttribute('data-company'),

        // LinkedIn specific
        () => document.querySelector('.topcard__org-name-link')?.textContent,
        () => document.querySelector('.topcard__flavor--black-link')?.textContent,
        () => document.querySelector('.jobs-unified-top-card__company-name')?.textContent,

        // Indeed specific
        () => document.querySelector('[data-company-name]')?.getAttribute('data-company-name'),
        () => document.querySelector('.icl-u-lg-mr--sm')?.textContent,
        () => document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent,

        // Greenhouse
        () => document.querySelector('[class*="company"]')?.textContent,
        () => document.getElementById('header')?.textContent?.split('\n')[0],

        // Fallback: look in page title
        () => {
            const title = document.title;
            // Pattern: "Job Title | Company Name" or "Job Title - Company Name" or "Job at Company"
            const patterns = [
                /\|\s*(.+?)\s*(?:Careers|Jobs|Employment)?$/i,
                /-\s*(.+?)\s*(?:Careers|Jobs|Employment)?$/i,
                /at\s+([^-|]+)/i
            ];

            for (const pattern of patterns) {
                const match = title.match(pattern);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }
            return null;
        }
    ];

    for (const pattern of patterns) {
        try {
            const result = pattern();
            if (result && result.trim().length > 0 && result.trim().length < 100) {
                return cleanText(result.trim());
            }
        } catch (e) {
            // Ignore errors, try next pattern
        }
    }

    return '';
}

/**
 * Extract company name from Greenhouse URL
 */
function extractFromGreenhouseUrl() {
    const match = window.location.hostname.match(/^(?:boards\.)?([^.]+)\.greenhouse\.io/);
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : null;
}

/**
 * Extract company name from Lever URL
 */
function extractFromLeverUrl() {
    const match = window.location.hostname.match(/^(?:jobs\.)?([^.]+)\.lever\.co/);
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : null;
}

/**
 * Attempt to extract job level/seniority from title or content
 */
function extractJobLevel(pageTitle, content) {
    const text = (pageTitle + ' ' + content.substring(0, 500)).toLowerCase();

    // Define level patterns
    const levels = [
        { keywords: ['intern', 'internship', 'co-op', 'trainee'], level: 'Internship' },
        { keywords: ['entry level', 'junior', 'associate', 'jr.', 'graduate'], level: 'Junior' },
        { keywords: ['mid-level', 'intermediate', 'ii', ' 2 '], level: 'Mid-Level' },
        { keywords: ['senior', 'sr.', 'lead', 'principal', 'staff', 'iii', ' 3 '], level: 'Senior' },
        { keywords: ['director', 'head of', 'vp', 'vice president', 'chief'], level: 'Leadership' }
    ];

    for (const { keywords, level } of levels) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return level;
            }
        }
    }

    return null;
}

console.log('JD-CV Match Extension content script loaded and ready');
