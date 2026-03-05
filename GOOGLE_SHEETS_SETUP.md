# 🔌 Google Sheets Integration Setup Guide
## NoCap VC — Form → Google Sheets in 10 minutes

---

## Overview

Form submissions flow like this:

```
User submits form  →  React App  →  Google Apps Script  →  Google Sheet
                                 ↓
                         (Pitch deck PDFs)
                                 ↓
                         Google Drive Folder
```

---

## Step 1 — Create your Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → **New spreadsheet**
2. Name it: `NoCap VC Applications`
3. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
   ```
4. Keep this tab open — you'll need it.

---

## Step 2 — Set up Google Apps Script

1. Go to [script.google.com](https://script.google.com) → **New project**
2. Name the project: `NoCap VC Form Handler`
3. **Delete** the default `myFunction()` code
4. **Paste** the entire contents of `google-apps-script/Code.gs` from this project
5. Find line 17:
   ```javascript
   const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
   ```
6. Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your actual Sheet ID from Step 1
7. Click **Save** (Ctrl/Cmd + S)

---

## Step 3 — Deploy as Web App

1. Click **Deploy** (top right) → **New deployment**
2. Click the **gear icon** next to "Select type" → choose **Web app**
3. Fill in:
   - **Description**: `NoCap VC Form v1`
   - **Execute as**: `Me (your@email.com)`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. Click **Authorize access** → choose your Google account → Allow
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbxxxxx.../exec
   ```

---

## Step 4 — Add URL to your React project

Create a `.env` file in the root of your React project (next to `package.json`):

```env
REACT_APP_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

> ⚠️ **Never commit `.env` to Git.** Add `.env` to your `.gitignore` file.

Then restart your dev server:
```bash
npm start
```

---

## Step 5 — Test it

1. Open your app in the browser
2. Fill out and submit the form
3. Check your Google Sheet — a new row should appear with all the data
4. Check Google Drive — a **"NoCap VC Pitch Decks"** folder should be created with the uploaded PDF

---

## What gets stored in the Sheet

| Column | Description |
|--------|-------------|
| Submitted At | ISO timestamp |
| Full Name | Founder's name |
| Email | Contact email |
| LinkedIn URL | Founder's LinkedIn |
| Startup Name | Name of startup |
| Sector | Industry sector |
| One-Liner | Single sentence description |
| Why This Idea | Founder motivation |
| Stage | Current startup stage |
| Founder Type | Solo / 2 / 3+ founders |
| Co-founder Details | Name + LinkedIn of co-founder |
| Hours / Week | Time commitment |
| Biggest Challenge | Main obstacle |
| Applied Before | Previous applications |
| Why Not A Job | Commitment signal |
| Success Vision | 2-year goal |
| Needs | Funding / Mentorship / etc |
| Video URL | Optional intro video |
| Website | Optional website/prototype |
| Pitch Deck Filename | Name of uploaded PDF |
| Pitch Deck (Drive Link) | Google Drive view link |

---

## Redeploying after changes

If you edit the Apps Script code, you must create a **new deployment**:
1. Click **Deploy** → **Manage deployments**
2. Click **Edit** (pencil icon) on the existing deployment
3. Under "Version", select **New version**
4. Click **Deploy**
5. The URL remains the same ✅

---

## Troubleshooting

**Form submits but nothing appears in sheet?**
- Check you deployed with "Anyone" access
- Make sure you ran the authorization step
- Try opening the Web App URL directly in a browser — it should show `{"status":"NoCap VC API is running"}`

**Pitch deck not appearing in Drive?**
- The Apps Script needs Drive access — re-run authorization if needed
- Check the "NoCap VC Pitch Decks" folder in your Google Drive

**CORS errors in console?**
- This is normal and expected with `mode: 'no-cors'` — the form still submits successfully

---

## Deploying to Production (Vercel/Netlify)

Add the environment variable in your hosting dashboard:
- **Key**: `REACT_APP_GOOGLE_SCRIPT_URL`
- **Value**: Your Apps Script URL

For **Vercel**: Project Settings → Environment Variables
For **Netlify**: Site Settings → Build & Deploy → Environment Variables

Then redeploy your site.
