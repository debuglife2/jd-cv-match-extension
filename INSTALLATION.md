# Installation & Testing Guide

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Google Chrome browser installed
- [ ] Azure OpenAI account (or plan to create one)
- [ ] Your CV ready (in `.txt` format for MVP)

## Step-by-Step Installation

### 1. Prepare the Extension

The extension is ready to use! The folder structure should look like this:

```
jd-cv-match-extension/
├── manifest.json
├── popup.html
├── popup.js
├── storage.js
├── azureOpenAI.js
├── contentScript.js
├── styles.css
├── background/
│   └── service_worker.js
├── icons/
│   ├── icon16.svg
│   ├── icon48.svg
│   └── icon128.svg
├── README.md
├── QUICKSTART.md
└── sample-cv.txt
```

### 2. Load Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/` (or Menu → More Tools → Extensions)
3. **Enable "Developer mode"** using the toggle in the top-right corner
4. Click the **"Load unpacked"** button
5. Browse to and select the `jd-cv-match-extension` folder
6. The extension should now appear in your extensions list

### 3. Verify Installation

Check that:
- Extension appears with "JD-CV Match Analyzer" name
- Version shows as "1.0.0"
- No errors are displayed

### 4. Pin the Extension (Recommended)

1. Click the puzzle piece icon (Extensions) in Chrome toolbar
2. Find "JD-CV Match Analyzer"
3. Click the pin icon to pin it to your toolbar

## Azure OpenAI Setup

### If You Already Have Azure OpenAI

Skip to "Configure Extension" section.

### If You Need to Set Up Azure OpenAI

1. **Create Azure Account**
   - Go to https://azure.microsoft.com/
   - Sign up or log in

2. **Request Azure OpenAI Access**
   - Go to https://azure.microsoft.com/products/ai-services/openai-service
   - Click "Request access to Azure OpenAI Service"
   - Fill out the form (may take 1-2 business days for approval)

3. **Create Azure OpenAI Resource**
   - Once approved, go to Azure Portal
   - Create a new "Azure OpenAI" resource
   - Choose your subscription and resource group
   - Select a region and pricing tier

4. **Deploy a Model**
   - In your Azure OpenAI resource, go to "Model deployments"
   - Click "Create new deployment"
   - Choose a model (GPT-4 recommended, GPT-3.5-turbo works too)
   - Give it a deployment name (e.g., "gpt-4")
   - Note down this deployment name

5. **Get Your Credentials**
   - In Azure OpenAI resource, go to "Keys and Endpoint"
   - Copy:
     - **Endpoint**: Something like `https://your-resource.openai.azure.com/`
     - **Key**: Either Key 1 or Key 2

## Configure Extension

1. **Open the Extension**
   - Click the extension icon in Chrome toolbar

2. **Open Settings**
   - Click the ⚙️ (Settings) button in the extension

3. **Enter Azure OpenAI Credentials**
   - **Azure OpenAI Endpoint**: Paste your endpoint URL
     - Example: `https://your-resource.openai.azure.com/`
     - Make sure to include `https://` and trailing `/`
   
   - **API Key**: Paste your API key from Azure
     - This will be hidden for security
   
   - **Deployment Name**: Enter your model deployment name
     - Example: `gpt-4` or `gpt-35-turbo`
   
   - **API Version**: Leave as `2024-02-15-preview` (default)
     - Or update if you're using a different version

4. **Test Connection**
   - Click "Test Connection" button
   - Wait for result:
     - ✅ "Connection successful!" → Proceed to next step
     - ❌ "Connection failed" → Double-check your credentials

5. **Save Settings**
   - Click "Save Settings"
   - Close the settings modal

## Upload Your CV

### Prepare Your CV

1. **Convert to Plain Text** (for MVP)
   - Open your CV in any text editor (Notepad, TextEdit, VS Code, etc.)
   - Save as `.txt` file
   - Make sure encoding is UTF-8
   
   OR
   
   - Use the provided `sample-cv.txt` for testing

2. **Clean Up Format**
   - Remove fancy formatting
   - Use simple text with clear sections
   - Keep bullet points as dashes (-) or asterisks (*)

### Upload Process

1. In the extension popup, click **"📄 Upload CV"**
2. Select your CV `.txt` file
3. Wait for confirmation: "CV uploaded successfully!"
4. Verify in Settings that CV status shows word count

## Test the Extension

### Test 1: Analyze a Job Posting

1. **Navigate to a Job Posting**
   - Go to LinkedIn, Indeed, or any job board
   - Open a specific job posting page (not search results)
   
   Recommended test sites:
   - LinkedIn Jobs
   - Indeed
   - Company career pages

2. **Open Extension**
   - Click the extension icon
   - You should see the page title and URL

3. **Click "🔍 Analyze Current Page"**
   - Loading spinner should appear
   - Wait 5-15 seconds

4. **Verify Results Display**
   - Match score (0-100) and label
   - 3 explanation items (Strength, Risk, Suggestion)
   - Gap analysis list
   - Tailored bullets list

### Test 2: Copy Tailored Bullets

1. After analysis, click **"📋 Copy Tailored Bullets"**
2. Open a text editor
3. Paste (Cmd+V or Ctrl+V)
4. Verify bullet points are copied

### Test 3: Save to Tracker

1. After analysis, click **"💾 Save to Tracker"**
2. Scroll down to "Job Tracker" section
3. Verify the job appears in the list
4. Check that it shows:
   - Job title
   - Company name (if extracted)
   - Match score badge
   - "Today" timestamp

### Test 4: Tracker Features

1. **Update Status**
   - Change status dropdown to "Applied"
   - Verify it saves

2. **Add Notes**
   - Click in notes textarea
   - Type a note
   - Click outside the textarea
   - Verify it saves

3. **Search**
   - Type in search box
   - Verify filtering works

4. **Open Link**
   - Click "🔗 Open Link"
   - Verify it opens the original job page in new tab

5. **Filter by Status**
   - Click different status filter buttons
   - Verify only matching jobs show

## Troubleshooting

### Extension Won't Load

**Issue**: "Manifest file is missing or unreadable"
- **Fix**: Make sure you selected the correct folder containing `manifest.json`

**Issue**: SVG icons not loading
- **Fix**: Chrome should support SVG icons. If issues persist, you can convert SVGs to PNGs and update manifest.json

### Connection Issues

**Issue**: "Connection test failed"

Check these in order:
1. **Endpoint URL format**: Must include `https://` and end with `/`
2. **API Key**: Copy again from Azure portal (don't include extra spaces)
3. **Deployment name**: Must match exactly what you named it in Azure
4. **Network**: Check if you can access Azure OpenAI from your network
5. **Azure status**: Check Azure status page for outages

### Analysis Issues

**Issue**: "Failed to extract page content"
- Make sure you're on an actual job posting, not search results
- Try a different job site
- Some sites may block content extraction

**Issue**: "Page content appears too short"
- Navigate to the full job description page
- Some sites load content dynamically - wait for page to fully load

**Issue**: Analysis takes too long
- Normal range: 5-15 seconds
- If over 30 seconds: Check Azure API rate limits
- Check Azure portal for service issues

### CV Upload Issues

**Issue**: "CV file appears empty or too short"
- Make sure file has actual content (at least 50 characters)
- Check file encoding (should be UTF-8)
- Try opening file in text editor to verify content

## What's Next?

Once everything is working:

1. **Start Tracking Jobs**: Analyze and save multiple jobs to build your pipeline
2. **Customize Your CV**: Use tailored bullets to update your CV for specific applications
3. **Monitor Progress**: Use tracker to manage your application process
4. **Review Analytics**: Pay attention to match scores to identify best-fit roles

## Need Help?

- Review the full `README.md` for detailed documentation
- Check `QUICKSTART.md` for usage tips
- Review Azure OpenAI documentation for API-specific issues
- Check Chrome extension developer documentation for extension issues

## Reporting Issues

If you find bugs or have suggestions:
1. Note the exact error message
2. Check browser console (F12 → Console tab)
3. Note which page you were on when error occurred
4. Document steps to reproduce

---

**Congratulations!** Your JD-CV Match Analyzer extension is ready to use! 🎉
