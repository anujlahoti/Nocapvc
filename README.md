# NoCap VC — React Landing Page

India's Founder-First Funding Layer. One Form. Many Doors. Zero Ghosting.

## Project Structure

```
src/
├── components/
│   ├── Cursor.jsx / .css          — Custom mouse cursor
│   ├── Navbar.jsx / .css          — Fixed navigation bar
│   ├── Hero.jsx / .css            — Hero section
│   ├── Problem.jsx / .css         — Problem statement
│   ├── HowItWorks.jsx / .css      — 3-step process
│   ├── FeedbackFramework.jsx/.css — Feedback framework + mockup
│   ├── ForInvestors.jsx / .css    — Investor section
│   ├── ProofSection.jsx / .css    — Stats + ticker
│   ├── ApplicationSection.jsx     — Form section wrapper
│   ├── ApplicationForm.jsx / .css — Main application form
│   └── Footer.jsx / .css          — Footer
├── hooks/
│   └── useScrollReveal.js         — Intersection Observer hook
├── App.js                         — Root component
├── index.js                       — Entry point
└── index.css                      — Global styles + CSS variables

google-apps-script/
└── Code.gs                        — Google Apps Script (paste to script.google.com)

GOOGLE_SHEETS_SETUP.md             — Full setup guide for Google Sheets integration
.env.example                       — Environment variable template
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file and add your Google Script URL
cp .env.example .env

# Start development server
npm start

# Build for production
npm run build
```

## Google Sheets Setup

See **GOOGLE_SHEETS_SETUP.md** for full step-by-step instructions.

## New Form Fields Added

The following fields were added to the original form:
- **LinkedIn URL** (required) — Founder's personal LinkedIn profile
- **Co-founder Details** — Toggle: if yes, shows Name + LinkedIn URL fields
- **Pitch Deck Upload** — PDF upload (max 10MB), stored in Google Drive

## Deployment

### Vercel (recommended)
```bash
npm install -g vercel
vercel
```
Add `REACT_APP_GOOGLE_SCRIPT_URL` in Vercel project settings.

### Netlify
```bash
npm run build
# Upload the /build folder to Netlify
```
Add `REACT_APP_GOOGLE_SCRIPT_URL` in Netlify environment variables.
