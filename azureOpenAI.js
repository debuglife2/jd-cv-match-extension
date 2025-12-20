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
    // ============================================
    // TEMPORARY: Mock response for testing workflow
    // ============================================
    console.log('Using MOCK analysis (Azure OpenAI commented out)');
    console.log('CV length:', cvText?.length || 0, 'chars');
    console.log('JD length:', jdText?.length || 0, 'chars');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return mock analysis result
    return {
        match_score: 75,
        match_label: "medium",
        explanation: {
            strength: "Your experience with full-stack development and React aligns well with the technical requirements of this role.",
            risk: "The job requires 7+ years of experience while your CV shows 5 years, which may be a concern for strict requirements.",
            suggestion: "Emphasize your leadership experience and the scale of projects you've worked on to demonstrate seniority beyond years."
        },
        gap_analysis: [
            "Missing: Kubernetes experience (mentioned in requirements)",
            "Missing: GraphQL API development",
            "Emphasize: Your microservices architecture experience",
            "Emphasize: Team leadership and mentoring skills",
            "Consider adding: Any relevant certifications or advanced training"
        ],
        tailored_bullets: [
            "Led development of customer-facing web application serving 100K+ daily active users, demonstrating ability to build and scale production systems",
            "Architected microservices backend using Node.js and Express with 99.9% uptime, showing strong system design and reliability skills",
            "Mentored team of 4 junior developers and established React development best practices, proving leadership capabilities",
            "Reduced page load time by 40% through advanced optimization techniques including code splitting and lazy loading",
            "Collaborated cross-functionally with product and design teams to deliver 15+ major features on schedule"
        ]
    };

    /* ============================================
     * COMMENTED OUT: Azure OpenAI Integration
     * Uncomment this section when ready to use real API
     * ============================================
    
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
      
      // Parse the JSON response
      let result;
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse Azure OpenAI response:', content);
        throw new Error('Failed to parse Azure OpenAI response as JSON');
      }
      
      // Validate the response structure
      if (!result.match_score || !result.match_label || !result.explanation || 
          !result.gap_analysis || !result.tailored_bullets) {
        throw new Error('Invalid response structure from Azure OpenAI');
      }
      
      return result;
      
    } catch (error) {
      console.error('Azure OpenAI API call failed:', error);
      throw error;
    }
    
    ============================================ */
}

/**
 * Test Azure OpenAI connection
 */
async function testConnection(settings) {
    // ============================================
    // TEMPORARY: Mock connection test
    // ============================================
    console.log('Using MOCK connection test (Azure OpenAI commented out)');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Always return success for testing
    return true;

    /* ============================================
     * COMMENTED OUT: Real Azure OpenAI connection test
     * ============================================
    
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
    
    ============================================ */
}

// Export functions
export {
    analyzeJDWithCV,
    testConnection
};
