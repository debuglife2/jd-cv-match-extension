# 🧪 Testing Mode Guide

## Current Status: MOCK DATA MODE

The extension is currently configured to use **mock/placeholder data** instead of Azure OpenAI. This allows you to test the entire workflow without needing API credentials or incurring any costs.

## What's Changed

### ✅ Working (Mock Mode)
- CV upload and storage
- Page content extraction
- Analysis with mock results (2-second simulated delay)
- Match score display (75% - Medium)
- Pre-populated explanation, gap analysis, and tailored bullets
- Copy to clipboard
- Job tracker (all features)
- Settings storage (optional fields)

### 🔧 Commented Out (Not Active)
- Real Azure OpenAI API calls
- Actual AI analysis
- API credential validation
- Network requests to Azure

## How to Test

### 1. Load the Extension
```
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select jd-cv-match-extension folder
5. Pin extension to toolbar
```

### 2. Upload CV (Required)
```
1. Click extension icon
2. Click "Upload CV" (or skip settings entirely)
3. Select sample-cv.txt (or your own .txt file)
4. Verify success message
```

### 3. Test Analysis Workflow
```
1. Go to any job posting (LinkedIn, Indeed, company site)
2. Click extension icon
3. Click "Analyze Current Page"
4. Wait 2 seconds (mock delay)
5. Review mock analysis results:
   - Match Score: 75%
   - Label: MEDIUM
   - 3 explanation items
   - 5 gap analysis points
   - 5 tailored bullets
```

### 4. Test All Features
- ✅ Click "Copy Tailored Bullets" → verify clipboard
- ✅ Click "Save to Tracker" → check tracker list
- ✅ Change job status → verify it saves
- ✅ Add notes → verify autosave
- ✅ Search tracker → verify filtering
- ✅ Click status filters → verify filtering
- ✅ Open job link → verify new tab opens
- ✅ Delete job → verify removal

### 5. Settings (Optional)
```
Settings are now OPTIONAL for testing.
- You can leave all fields empty
- "Test Connection" will always succeed (mock)
- Settings will be saved but not used
```

## Mock Response Details

The current mock returns:
- **Match Score**: 75
- **Label**: medium
- **Strength**: Positive point about React/full-stack experience
- **Risk**: Experience years gap (5 vs 7 required)
- **Suggestion**: Emphasize leadership and scale
- **Gap Analysis**: 5 points about Kubernetes, GraphQL, etc.
- **Tailored Bullets**: 5 realistic-looking CV bullets

## When Ready for Real Azure OpenAI

To switch back to real Azure OpenAI:

1. **Uncomment the code** in `azureOpenAI.js`:
   - Remove the mock response section (lines ~11-44)
   - Uncomment the real API call (marked with `/* ... */`)
   - Do the same for `testConnection()` function

2. **Update popup.js**:
   - Uncomment the real settings validation (lines ~118-125)
   - Remove the mock settings fallback

3. **Update popup.html**:
   - Remove the yellow testing mode banner
   - Remove "(Optional for testing)" labels
   - Add back `required` attributes to form fields
   - Change button text back to "Test Connection"

4. **Test with real credentials**:
   - Enter actual Azure endpoint, key, and deployment
   - Test connection
   - Analyze a real job posting

## Files Modified

```
azureOpenAI.js    → Mock analyzeJDWithCV() and testConnection()
popup.js          → Skip settings validation, use mock fallback
popup.html        → Optional fields, testing mode notice
```

## Benefits of Testing Mode

✅ **No Azure account needed** → Test immediately  
✅ **No API costs** → Free testing  
✅ **Fast development** → 2-second mock delay vs 5-15 second API calls  
✅ **Consistent results** → Same mock data every time  
✅ **Full workflow testing** → Everything except AI analysis works  

## What You Can Verify

### UI/UX
- [ ] Extension loads correctly
- [ ] Popup displays properly (600x700px)
- [ ] All buttons work
- [ ] Forms validate correctly
- [ ] Loading states appear
- [ ] Error messages display
- [ ] Success toasts show
- [ ] Animations work smoothly

### Data Flow
- [ ] CV uploads and stores
- [ ] Page content extracts
- [ ] Analysis triggers
- [ ] Results display correctly
- [ ] Jobs save to tracker
- [ ] Search/filter works
- [ ] Status updates persist
- [ ] Notes save automatically

### Storage
- [ ] Chrome storage saves data
- [ ] Data persists after closing
- [ ] Multiple jobs track correctly
- [ ] Search performs well
- [ ] Deletion works

## Known Limitations (Testing Mode)

⚠️ **No Real AI Analysis** → Results are always the same mock data  
⚠️ **No Context Awareness** → Mock doesn't actually read your CV or job description  
⚠️ **Fixed Match Score** → Always 75% (medium)  

## Next Steps

1. **Test the workflow thoroughly** with mock data
2. **Verify all UI features** work as expected
3. **Check storage and persistence** across sessions
4. **Test on multiple websites** (LinkedIn, Indeed, etc.)
5. **Document any bugs** you find
6. **When ready**, uncomment Azure OpenAI code and test with real API

---

## Quick Commands

### Check Extension Loaded
```
chrome://extensions/
Look for "JD-CV Match Analyzer v1.0.0"
```

### View Console Logs
```
Right-click extension icon → Inspect popup
Check Console tab for "Using MOCK analysis" messages
```

### Clear Storage (Reset)
```javascript
// In popup console:
chrome.storage.local.clear()
```

---

**Status**: 🟢 Ready for Testing  
**Mode**: Mock Data  
**Cost**: $0  
**Setup Time**: ~2 minutes  

Happy testing! 🚀
