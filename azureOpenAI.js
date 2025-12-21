// Azure OpenAI client module
// Handles all Azure OpenAI API calls

/**
 * Call Azure OpenAI Chat Completions API
 * @param {Object} settings - Azure OpenAI settings {azureEndpoint, apiKey, deployment, apiVersion}
 * @param {string} cvText - User's CV text
 * @param {string} jdText - Job description text
 * @returns {Promise<Object>} Structured analysis result
 */
async function analyzeJDWithCV(settings, cvText, jdText) {
    const { azureEndpoint, apiKey, deployment, apiVersion = '2024-02-15-preview' } = settings;

    if (!azureEndpoint || !apiKey || !deployment) {
        throw new Error('Missing Azure OpenAI settings. Please configure in Settings.');
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
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 2000,
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

        const content = data.choices[0].message.content;

        console.log('Azure OpenAI raw response:', content);

        // Parse the JSON response
        let result;
        try {
            result = JSON.parse(content);
        } catch (parseError) {
            console.error('Failed to parse Azure OpenAI response:', content);
            throw new Error('Failed to parse Azure OpenAI response as JSON');
        }

        console.log('Parsed result:', result);

        // Validate the response structure with detailed logging
        const missingFields = [];
        if (!result.match_score && result.match_score !== 0) missingFields.push('match_score');
        if (!result.match_label) missingFields.push('match_label');
        if (!result.explanation) missingFields.push('explanation');
        if (!result.gap_analysis) missingFields.push('gap_analysis');
        if (!result.tailored_bullets) missingFields.push('tailored_bullets');

        if (missingFields.length > 0) {
            console.error('Missing fields:', missingFields);
            console.error('Received structure:', Object.keys(result));
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
    const { azureEndpoint, apiKey, deployment, apiVersion = '2024-02-15-preview' } = settings;

    const url = `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Hello' }
                ],
                max_tokens: 10
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
    testConnection
};
