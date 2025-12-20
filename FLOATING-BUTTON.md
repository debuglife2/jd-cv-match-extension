# Floating Button Feature

## What's New

A **floating button** now appears on every webpage. Click it to analyze the current job description directly on the page!

## How It Works

1. **Floating Button**: A purple gradient button appears in the bottom-right corner of every page
2. **Click to Analyze**: Click the button to trigger analysis
3. **Overlay Results**: Analysis results appear in a beautiful overlay on the page
4. **No Popup Needed**: You don't need to open the extension popup anymore!

## Features

- **Always Visible**: Button floats on every page you visit
- **One-Click Analysis**: Just click the button to analyze
- **Beautiful Overlay**: Results display in a styled overlay with:
  - Match score with visual badge
  - Strength/Weakness/Recommendation cards
  - Gap analysis list
  - Tailored CV bullets with copy button
- **Easy to Close**: Click X or click outside the overlay to close

## Testing

1. **Upload CV First**: Open the extension popup and upload your CV (this only needs to be done once)
2. **Visit Any Job Page**: Navigate to any job posting (e.g., Microsoft careers, LinkedIn jobs)
3. **Click Floating Button**: Look for the purple "Analyze Job" button in the bottom-right
4. **View Results**: Results appear instantly in an overlay on the page

## Current Status

- Using **mock data** for testing (no API calls)
- Mock analysis returns after 2 second delay
- Real Azure OpenAI integration is ready to be enabled later

## Files Added

- `floatingButton.js` - Floating button and overlay logic
- `floatingButton.css` - Styles for button and overlay
- Updated `manifest.json` - Includes new scripts in content_scripts
- Updated `background/service_worker.js` - Handles analysis requests from button

## Mobile Responsive

- Button text hides on mobile (icon only)
- Overlay adjusts to smaller screens
- Touch-friendly interactions
