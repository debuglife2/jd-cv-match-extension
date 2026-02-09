# Matcha Extension - Developer Guide

This document contains setup instructions for developers who want to contribute to or customize the Matcha extension.

## Prerequisites

- Node.js (v18 or higher)
- npm
- Azure OpenAI account with API access
- Google Cloud project with OAuth 2.0 configured

## Project Structure

```
jd-cv-match-extension/
├── manifest.json              # Extension manifest (MV3)
├── popup.html                 # Extension popup UI
├── popup.js                   # Main popup logic
├── styles.css                 # UI styles
├── storage.js                 # Chrome storage helpers
├── azureOpenAI.js            # Azure OpenAI client
├── contentScript.js          # Page content extraction
├── floatingButton.js         # Floating action button on pages
├── floatingButton.css        # Floating button styles
├── apiClient.js              # Backend API client
├── pdfParser.js              # PDF parsing utilities
├── cvGenerator.js            # CV generation utilities
├── vite.config.js            # Build configuration
├── background/
│   └── service_worker.js     # Background service worker
├── assets/
│   └── icon.png              # App icon
├── icons/
│   ├── icon16.svg            # 16x16 icon
│   ├── icon48.svg            # 48x48 icon
│   └── icon128.svg           # 128x128 icon
└── dist/                     # Built extension (git-ignored)
```

## Build from Source

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd jd-cv-match-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Azure OpenAI credentials:
   ```
   openai=https://YOUR-RESOURCE-NAME.cognitiveservices.azure.com/
   openai_key=YOUR_API_KEY_HERE
   openai_deployment=YOUR_DEPLOYMENT_NAME
   ```

4. **Build the extension**
   ```bash
   npm run build
   ```

5. **Load in Chrome (Developer Mode)**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist` folder

## Development Workflow

### Watch Mode
```bash
npm run dev
```
This rebuilds automatically when files change.

### Manual Refresh
After any code changes:
1. Go to `chrome://extensions/`
2. Click the refresh icon on the Matcha extension card
3. Reload the page you're testing on

## Technical Details

### Permissions Used

| Permission         | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `activeTab`        | Access current tab content when user clicks analyze |
| `scripting`        | Inject content script to extract page text          |
| `storage`          | Store CV, settings, and tracker data locally        |
| `identity`         | Google OAuth sign-in                                |
| `host_permissions` | Work on any webpage                                 |

### Data Storage

All data is stored locally using `chrome.storage.local`:

- **CV Text**: User's uploaded CV content
- **Auth Token**: JWT for backend authentication
- **User**: Google account info
- **Tracker**: Up to 200 job entries
- **Settings**: User preferences

### Backend API

The extension communicates with a backend server for:
- User authentication (Google OAuth)
- AI-powered CV analysis
- Usage tracking

Backend URL: `https://jd-cv-backend-production.up.railway.app`

## Building for Production

1. **Run production build**
   ```bash
   npm run build
   ```

2. **Create ZIP for Chrome Web Store**
   ```bash
   zip -r matcha-extension.zip dist/ -x "*.DS_Store"
   ```

3. **Upload to Chrome Developer Dashboard**
   - Go to https://chrome.google.com/webstore/devconsole
   - Create new item or update existing
   - Upload the ZIP file

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use .env files** for all secrets (git-ignored)
3. **Rotate API keys** regularly
4. **Monitor API usage** in Azure portal
5. **Set spending limits** in Azure

## Troubleshooting

### Content script not loading
- Check manifest.json matches patterns
- Verify dist/ has contentScript.js
- Reload extension and refresh page

### OAuth issues
- Verify Google Cloud OAuth client ID
- Check redirect URI matches `chrome.identity.getRedirectURL()`
- Ensure identity permission is in manifest

### Build errors
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear dist folder: `rm -rf dist && npm run build`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is provided as-is for educational and personal use.
