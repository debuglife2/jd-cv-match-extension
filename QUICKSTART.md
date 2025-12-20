# Quick Start Guide

## 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `jd-cv-match-extension` folder
5. Pin the extension to your toolbar

## 2. Configure Azure OpenAI

You need an Azure OpenAI account. If you don't have one:
- Go to https://azure.microsoft.com/products/ai-services/openai-service
- Create an Azure account and request access to Azure OpenAI
- Deploy a model (GPT-4 recommended)

Once you have Azure OpenAI set up:

1. Click the extension icon
2. Click ⚙️ Settings
3. Fill in:
   - **Endpoint**: `https://YOUR-RESOURCE-NAME.openai.azure.com/`
   - **API Key**: Your API key from Azure portal
   - **Deployment**: Your model deployment name (e.g., `gpt-4`)
   - **API Version**: `2024-02-15-preview` (default)
4. Click "Test Connection" to verify
5. Click "Save Settings"

## 3. Upload Your CV

**Important**: For MVP, convert your CV to `.txt` format first.

1. In the extension popup, click "📄 Upload CV"
2. Select your CV text file
3. Wait for "CV uploaded successfully!" message

## 4. Analyze Your First Job

1. Navigate to any job posting in your browser (LinkedIn, Indeed, company website, etc.)
2. Click the extension icon
3. Click "🔍 Analyze Current Page"
4. Wait for analysis (usually 5-15 seconds)
5. Review the results:
   - Match score and explanation
   - Gap analysis
   - Tailored CV bullets

## 5. Use the Results

- **Copy tailored bullets**: Click "📋 Copy Tailored Bullets" and paste into your application
- **Save to tracker**: Click "💾 Save to Tracker" to keep track of this job
- **Update status**: Use the dropdown in tracker to mark as Applied, Interview, etc.
- **Add notes**: Click in the notes area to add reminders or details

## Common Issues

### "Please convert PDF to TXT format"
- The MVP only supports `.txt` files
- Use any text editor or online converter to convert your CV to plain text
- Save as UTF-8 encoding

### "Failed to extract page content"
- Make sure you're on an actual job posting page, not a search results page
- Some sites may block content extraction - try a different site
- Refresh the page and try again

### "Missing Azure OpenAI settings"
- Go to Settings and configure your Azure OpenAI credentials
- Make sure all fields are filled in correctly

## Tips for Best Results

1. **Keep your CV text clean**: Remove fancy formatting, use simple plain text
2. **Navigate to the actual job posting**: Don't analyze from search results pages
3. **Review suggestions carefully**: The AI suggests rephrasing, not fabrication
4. **Update tracker regularly**: Change status as you progress with applications
5. **Use notes**: Add application deadlines, contact info, or other reminders

## What to Expect

### Match Score Interpretation
- **70-100 (High)**: Strong match, apply with confidence
- **40-69 (Medium)**: Decent match, may need to address gaps
- **0-39 (Low)**: Weak match, consider if worth applying

### Analysis Components
- **Strength**: What makes you a good fit
- **Risk**: Main concerns or gaps
- **Suggestion**: Most important action to take
- **Gap Analysis**: Skills/experience to address or emphasize
- **Tailored Bullets**: CV points optimized for this specific job

## Next Steps

Once you're comfortable with the basics:
- Build up your tracker with multiple jobs
- Use search to find specific applications
- Filter by status to focus on active opportunities
- Export your notes for interview preparation (copy manually for MVP)

## Need Help?

Check the full README.md for detailed documentation and troubleshooting.

---

Happy job hunting! 🚀
