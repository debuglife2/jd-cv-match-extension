// Azure OpenAI client module
// Handles all Azure OpenAI API calls

// Production mode - disable console logging
const PRODUCTION = true;
const log = PRODUCTION ? () => { } : console.log.bind(console);

/**
 * Call Azure OpenAI Chat Completions API
 * @param {Object} settings - Azure OpenAI settings {azureEndpoint, apiKey, accessToken, deployment, apiVersion}
 * @param {string} cvText - User's CV text
 * @param {string} jdText - Job description text
 * @returns {Promise<Object>} Structured analysis result
 */
async function analyzeJDWithCV(settings, cvText, jdText) {
    const { azureEndpoint, apiKey, accessToken, deployment, apiVersion = '2024-04-01-preview' } = settings;

    if (!azureEndpoint || (!apiKey && !accessToken) || !deployment) {
        throw new Error('Missing Azure OpenAI settings. Please configure in Settings with either API Key or Access Token.');
    }

    // Security: Validate HTTPS
    if (!azureEndpoint.startsWith('https://')) {
        throw new Error('Azure endpoint must use HTTPS for security.');
    }

    // Construct Azure OpenAI endpoint
    const url = `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;


    // Construct the system prompt
    const systemPrompt = `You are a professional career advisor and resume expert. Your task is to analyze job descriptions against a candidate's CV and provide helpful, actionable feedback.
  
  CRITICAL RULES:
  1. Do NOT invent or fabricate any experiences, employers, projects, technologies, or metrics not present in the CV.
  2. Only suggest rephrasing or highlighting existing experiences from the CV.
  3. If specific information is missing from the CV but needed for the job, indicate this with placeholders like [ADD METRIC] or [ADD DETAIL] rather than inventing data.
  4. Be honest about gaps and risks - this helps the candidate prepare better.
  5. Always return valid JSON matching the exact schema provided.`;

    const userPrompt = `Analyze the following job description against this candidate's CV and provide a structured analysis.
  
  ===== CANDIDATE'S CV =====
  ${cvText}
  
  ===== JOB DESCRIPTION =====
  ${jdText}
  
  ===== ANALYSIS REQUIRED =====
  Provide your analysis in the following JSON format (respond with ONLY valid JSON, no markdown code blocks):
  
  {
    "match_score": <number 0-100>,
    "match_label": "<high|medium|low>",
    "explanation": {
      "strength": "<One sentence explaining the strongest match point>",
      "risk": "<One sentence explaining the biggest risk or gap>",
      "suggestion": "<One sentence with the most important action item>"
    },
    "gap_analysis": [
      "<Missing skill or requirement 1>",
      "<Missing skill or requirement 2>",
      "<What to emphasize from existing experience>"
    ],
    "tailored_bullets": [
      "<Tailored bullet point 1 - rephrased from CV>",
      "<Tailored bullet point 2 - rephrased from CV>",
      "<Tailored bullet point 3 - rephrased from CV>"
    ]
  }
  
  Guidelines:
  - match_score: 0-100 based on alignment of skills, experience, and requirements
  - match_label: "high" (70-100), "medium" (40-69), "low" (0-39)
  - explanation: Exactly 3 items (strength, risk, suggestion) - each should be one concise sentence
  - gap_analysis: 3-5 bullet points covering missing requirements AND what existing experience to emphasize
  - tailored_bullets: 3-8 bullet points that rephrase/highlight existing CV experience to match job requirements. DO NOT invent new experiences.
  
  Remember: Only use information from the CV. If something is missing, suggest adding it rather than inventing it.`;

    try {
        // Prepare headers based on authentication type
        const headers = {
            'Content-Type': 'application/json'
        };

        // Use Bearer token if accessToken is provided, otherwise use api-key
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        } else if (apiKey) {
            // Support both old and new Azure OpenAI resource types
            headers['api-key'] = apiKey;
            headers['Ocp-Apim-Subscription-Key'] = apiKey;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_completion_tokens: 2000,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Azure OpenAI API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Unexpected response format from Azure OpenAI');
        }

        // Track token usage
        if (data.usage) {
            await trackTokenUsage(data.usage);
        }

        const content = data.choices[0].message.content;

        log('Azure OpenAI raw response:', content);

        // Parse the JSON response
        let result;
        try {
            result = JSON.parse(content);
        } catch (parseError) {
            log('Failed to parse Azure OpenAI response:', content);
            throw new Error('Failed to parse Azure OpenAI response as JSON');
        }

        log('Parsed result:', result);

        // Validate the response structure with detailed logging
        const missingFields = [];
        if (!result.match_score && result.match_score !== 0) missingFields.push('match_score');
        if (!result.match_label) missingFields.push('match_label');
        if (!result.explanation) missingFields.push('explanation');
        if (!result.gap_analysis) missingFields.push('gap_analysis');
        if (!result.tailored_bullets) missingFields.push('tailored_bullets');

        if (missingFields.length > 0) {
            log('Missing fields:', missingFields);
            log('Received structure:', Object.keys(result));
            throw new Error(`Invalid response structure from Azure OpenAI. Missing: ${missingFields.join(', ')}`);
        }

        return result;

    } catch (error) {
        console.error('Azure OpenAI API call failed:', error);
        throw error;
    }
}

/**
 * Test Azure OpenAI connection
 */
async function testConnection(settings) {
    const { azureEndpoint, apiKey, accessToken, deployment, apiVersion = '2024-04-01-preview' } = settings;

    const url = `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    try {
        // Prepare headers based on authentication type
        const headers = {
            'Content-Type': 'application/json'
        };

        // Use Bearer token if accessToken is provided, otherwise use api-key
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        } else if (apiKey) {
            // Support both old and new Azure OpenAI resource types
            headers['api-key'] = apiKey;
            headers['Ocp-Apim-Subscription-Key'] = apiKey;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Hello' }
                ],
                max_completion_tokens: 10
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Connection test failed (${response.status}): ${errorText}`);
        }

        return true;
    } catch (error) {
        console.error('Connection test failed:', error);
        throw error;
    }
}

// Export functions
export {
    analyzeJDWithCV,
    testConnection,
    updateCVWithTailoredBullets,
    getTokenUsageStats
};

/**
 * Track token usage from API response
 * @param {Object} usage - Usage object from Azure OpenAI response
 */
async function trackTokenUsage(usage) {
    try {
        const stats = await chrome.storage.local.get(['tokenUsage']);
        const currentUsage = stats.tokenUsage || {
            totalInputTokens: 0,
            totalCachedTokens: 0,
            totalOutputTokens: 0,
            totalCost: 0,
            requestCount: 0,
            lastUpdated: null
        };

        // Extract token counts
        const promptTokens = usage.prompt_tokens || 0;
        const cachedTokens = usage.prompt_tokens_details?.cached_tokens || 0;
        const completionTokens = usage.completion_tokens || 0;

        // Calculate costs (per 1M tokens)
        const INPUT_COST_PER_M = 1.75;
        const CACHED_COST_PER_M = 0.175;
        const OUTPUT_COST_PER_M = 14.00;

        const inputCost = (promptTokens - cachedTokens) * INPUT_COST_PER_M / 1000000;
        const cachedCost = cachedTokens * CACHED_COST_PER_M / 1000000;
        const outputCost = completionTokens * OUTPUT_COST_PER_M / 1000000;
        const requestCost = inputCost + cachedCost + outputCost;

        // Update totals
        currentUsage.totalInputTokens += (promptTokens - cachedTokens);
        currentUsage.totalCachedTokens += cachedTokens;
        currentUsage.totalOutputTokens += completionTokens;
        currentUsage.totalCost += requestCost;
        currentUsage.requestCount += 1;
        currentUsage.lastUpdated = new Date().toISOString();

        await chrome.storage.local.set({ tokenUsage: currentUsage });

        log('📊 Token Usage Updated:', {
            thisRequest: {
                input: promptTokens - cachedTokens,
                cached: cachedTokens,
                output: completionTokens,
                cost: `$${requestCost.toFixed(4)}`
            },
            totals: {
                input: currentUsage.totalInputTokens,
                cached: currentUsage.totalCachedTokens,
                output: currentUsage.totalOutputTokens,
                cost: `$${currentUsage.totalCost.toFixed(4)}`,
                requests: currentUsage.requestCount
            }
        });
    } catch (error) {
        log('Error tracking token usage:', error);
    }
}

/**
 * Get token usage statistics
 */
async function getTokenUsageStats() {
    const stats = await chrome.storage.local.get(['tokenUsage']);
    return stats.tokenUsage || {
        totalInputTokens: 0,
        totalCachedTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        requestCount: 0,
        lastUpdated: null
    };
}

/**
 * Update CV by intelligently incorporating tailored bullet points
 * @param {Object} settings - Azure OpenAI settings
 * @param {string} originalCV - Original CV text
 * @param {Array<string>} tailoredBullets - Tailored bullet points to incorporate
 * @param {Object} jobInfo - Job information
 * @returns {Promise<string>} Updated CV text in markdown format
 */
async function updateCVWithTailoredBullets(settings, originalCV, tailoredBullets, jobInfo = {}) {
    const { azureEndpoint, apiKey, accessToken, deployment, apiVersion = '2024-04-01-preview' } = settings;

    if (!azureEndpoint || (!apiKey && !accessToken) || !deployment) {
        throw new Error('Missing Azure OpenAI settings.');
    }

    const url = `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const systemPrompt = `You are an expert CV writer. Your task is to intelligently update a CV by incorporating tailored bullet points naturally into the existing content.

CRITICAL RULES:
1. Maintain the original CV's format, structure, and style
2. Incorporate the tailored bullet points by replacing or enhancing similar existing bullet points
3. Keep all personal information, contact details, and section headings unchanged
4. Preserve the professional tone and language style of the original CV
5. Do not add fabricated information - only use what's in the original CV and tailored bullets
6. Return the updated CV in clean markdown format with proper formatting
7. Focus on the experience/achievements section - that's where bullet points go`;

    const userPrompt = `Update this CV by intelligently incorporating the tailored bullet points below. Replace or enhance existing bullet points with the tailored ones where they fit naturally.

===== ORIGINAL CV =====
${originalCV}

===== TAILORED BULLET POINTS =====
${tailoredBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

===== TARGET POSITION =====
${jobInfo.company ? `Company: ${jobInfo.company}\n` : ''}${jobInfo.roleTitle ? `Role: ${jobInfo.roleTitle}\n` : ''}

===== INSTRUCTIONS =====
Return the complete updated CV in markdown format. Incorporate the tailored bullets naturally into the experience section, replacing similar existing points. Keep everything else unchanged. Return ONLY the updated CV content, no explanations.`;

    const headers = {
        'Content-Type': 'application/json'
    };

    if (apiKey) {
        // Support both old and new Azure OpenAI resource types
        headers['api-key'] = apiKey;
        headers['Ocp-Apim-Subscription-Key'] = apiKey;
    } else if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_completion_tokens: 3000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Azure OpenAI API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // Track token usage
        if (data.usage) {
            await trackTokenUsage(data.usage);
        }

        const updatedCV = data.choices[0]?.message?.content;

        if (!updatedCV) {
            throw new Error('No response from Azure OpenAI');
        }

        return updatedCV.trim();
    } catch (error) {
        console.error('Error updating CV:', error);
        throw error;
    }
}
