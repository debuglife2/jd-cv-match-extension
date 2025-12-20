# JD-CV Match Analyzer Chrome Extension

A Chrome Extension (Manifest V3) that analyzes job descriptions against your CV using Azure OpenAI, providing match scores, gap analysis, and tailored CV bullet points.

## Features

- 🔍 **Analyze Any Job Description**: Works on any webpage containing a job posting
- 📊 **AI-Powered Match Analysis**: Uses Azure OpenAI to compute match scores and provide insights
- 💡 **Tailored CV Suggestions**: Get rephrased bullet points optimized for each job
- 📋 **One-Click Copy**: Copy tailored bullets to clipboard instantly
- 💾 **Job Tracker**: Track up to 200 jobs with status management and notes
- 🔒 **Privacy-First**: All data stored locally, no external accounts needed

## Prerequisites

- Google Chrome browser
- Azure OpenAI account with:
  - Endpoint URL (e.g., `https://your-resource.openai.azure.com/`)
  - API Key
  - Deployed model (e.g., GPT-4)
  - API Version (default: `2024-02-15-preview`)

## Installation

### Development Mode

1. **Clone or download this repository**

2. **Prepare your CV**
   - For MVP, convert your CV to `.txt` format
   - PDF and DOCX support will be added in future updates

3. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `jd-cv-match-extension` folder
   - The extension should now appear in your extensions list

5. **Pin the extension** (recommended)
   - Click the extensions icon (puzzle piece) in Chrome toolbar
   - Find "JD-CV Match Analyzer" and click the pin icon

## Setup

### First-Time Configuration

1. **Click the extension icon** in your Chrome toolbar

2. **Configure Azure OpenAI Settings**
   - Click the ⚙️ Settings button
   - Enter your Azure OpenAI credentials:
     - **Azure Endpoint**: Your Azure OpenAI resource URL
     - **API Key**: Your Azure OpenAI API key
     - **Deployment Name**: Name of your deployed model
     - **API Version**: Leave default or update if needed
   - Click "Test Connection" to verify settings
   - Click "Save Settings"

3. **Upload Your CV**
   - Click "📄 Upload CV" button
   - Select your CV file (`.txt` format for MVP)
   - Wait for confirmation message

## Usage

### Analyzing a Job Description

1. **Navigate to any job posting** in your browser

2. **Click the extension icon** to open the popup

3. **Click "🔍 Analyze Current Page"**
   - Extension extracts the page content
   - Sends to Azure OpenAI for analysis
   - Displays results including:
     - Match score (0-100) and label (High/Medium/Low)
     - Strength, Risk, and Suggestion
     - Gap analysis (missing skills and what to emphasize)
     - 3-8 tailored CV bullet points

4. **Copy tailored bullets** with one click:
   - Click "📋 Copy Tailored Bullets"
   - Paste into your CV or application

5. **Save to tracker** (optional):
   - Click "💾 Save to Tracker"
   - Job is added to your local tracker

### Managing Your Job Tracker

The tracker section shows your most recent 10 jobs:

- **Search**: Filter jobs by title or company name
- **Filter by Status**: 
  - Inbox (default)
  - Applied
  - Interview
  - Offer
  - Rejected
  - Hidden
- **Update Status**: Use the dropdown for each job
- **Add Notes**: Click in notes area to add/edit notes (max 500 chars)
- **Open Link**: Click "🔗 Open Link" to revisit the job posting
- **Delete**: Click 🗑️ to remove from tracker

## File Structure

```
jd-cv-match-extension/
├── manifest.json              # Extension manifest (MV3)
├── popup.html                 # Extension popup UI
├── popup.js                   # Main popup logic
├── styles.css                 # UI styles
├── storage.js                 # Chrome storage helpers
├── azureOpenAI.js            # Azure OpenAI client
├── contentScript.js          # Page content extraction
├── background/
│   └── service_worker.js     # Background service worker
└── icons/
    ├── icon16.svg            # 16x16 icon
    ├── icon48.svg            # 48x48 icon
    └── icon128.svg           # 128x128 icon
```

## Technical Details

### Permissions Used

- `activeTab`: Access current tab content when user clicks analyze
- `scripting`: Inject content script to extract page text
- `storage`: Store CV, settings, and tracker data locally
- `host_permissions` (`<all_urls>`): Work on any webpage

### Data Storage

All data is stored locally using `chrome.storage.local`:

- **CV Text**: Your uploaded CV content
- **Settings**: Azure OpenAI configuration (endpoint, API key, deployment)
- **Tracker**: Up to 200 job entries with analysis results

### Privacy & Security

- ✅ No data sent to external servers (except Azure OpenAI for analysis)
- ✅ No user accounts or authentication required
- ✅ All data stored locally on your machine
- ✅ API keys stored in Chrome's secure storage
- ⚠️ Keep your Azure OpenAI API key secure
- ⚠️ Don't share your extension data folder

## Limitations & Known Issues

### MVP Limitations

1. **CV Format**: Currently only supports `.txt` files
   - PDF and DOCX parsing will be added in future versions
   - Workaround: Convert your CV to plain text

2. **Content Extraction**: May not work perfectly on all websites
   - Some sites with complex layouts may extract extra content
   - The extension tries to identify main content areas

3. **API Costs**: Each analysis calls Azure OpenAI API
   - Be mindful of API usage costs
   - Consider the cost per analysis based on your Azure pricing

4. **Tracker Limit**: Maximum 200 jobs stored
   - Oldest entries are automatically removed when limit is reached

## Troubleshooting

### "Failed to extract page content"
- Make sure you're on a page with substantial text content
- Some sites may block content extraction
- Try refreshing the page and clicking analyze again

### "Analysis failed: Connection error"
- Check your Azure OpenAI settings in Settings
- Verify your API key is correct and has not expired
- Test connection using "Test Connection" button
- Check that your deployment name matches Azure

### "Please upload your CV first"
- Click "📄 Upload CV" and select your `.txt` CV file
- Check CV Status in Settings to verify upload

### Extension doesn't work on specific sites
- Some sites use shadow DOM or iframes which may block content extraction
- Try using the extension on the direct job posting page, not search results

## Development

### Local Development

The extension is ready to use in development mode. To modify:

1. Make changes to source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Building for Production

For production deployment:

1. Replace placeholder icons in `icons/` folder with proper PNG icons
2. Review and minimize permissions if possible
3. Test thoroughly on various job sites
4. Consider adding analytics (privacy-respecting)
5. Package for Chrome Web Store

## Future Enhancements

- [ ] PDF and DOCX CV parsing
- [ ] Export tracker data to CSV
- [ ] Browser sync across devices (optional)
- [ ] Cover letter generator
- [ ] LinkedIn integration
- [ ] Multiple CV profiles
- [ ] Batch analysis
- [ ] Analytics dashboard
- [ ] Custom prompt templates

## Security Best Practices

1. **Never commit your API keys** to version control
2. **Regularly rotate** your Azure OpenAI API keys
3. **Monitor API usage** in Azure portal
4. **Set spending limits** in Azure to avoid unexpected costs
5. **Review permissions** before loading any extension

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions:
- Check the Troubleshooting section
- Review Azure OpenAI documentation
- Check Chrome Extension development docs

---

**Note**: This is an MVP (Minimum Viable Product). Features and functionality will be enhanced based on feedback and usage.
