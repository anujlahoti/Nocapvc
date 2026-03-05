// ══════════════════════════════════════════════════════════════════
//  NoCap VC — Google Apps Script  (paste into script.google.com)
// ══════════════════════════════════════════════════════════════════
//
//  SETUP STEPS:
//  1. Go to https://script.google.com  → New project
//  2. Paste this entire file into the editor
//  3. Replace SHEET_ID below with your Google Sheet's ID
//     (from the URL: docs.google.com/spreadsheets/d/SHEET_ID/edit)
//  4. Click "Deploy" → "New deployment" → Web app
//     - Execute as: Me
//     - Who has access: Anyone
//  5. Copy the generated Web App URL
//  6. Paste it into your .env file as REACT_APP_GOOGLE_SCRIPT_URL
//
// ══════════════════════════════════════════════════════════════════

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Applications'; // Tab name in your spreadsheet

// Column headers — must match exactly what the React form sends
const HEADERS = [
  'Submitted At',
  'Full Name',
  'Email',
  'LinkedIn URL',
  'Startup Name',
  'Sector',
  'One-Liner',
  'Why This Idea',
  'Stage',
  'Founder Type',
  'Co-founder Details',
  'Hours / Week',
  'Biggest Challenge',
  'Applied Before',
  'Why Not A Job',
  'Success Vision (2 yrs)',
  'Needs',
  'Video URL',
  'Website',
  'Pitch Deck Filename',
  'Pitch Deck (Drive Link)',
];

// ── Entry point ──────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet + headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length)
        .setBackground('#FFE034')
        .setFontColor('#000000')
        .setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // Handle pitch deck upload → save to Drive
    let deckLink = '';
    let deckName = data.pitchdeck_name || '';
    if (data.pitchdeck_base64 && data.pitchdeck_name) {
      deckLink = savePitchDeckToDrive(data.pitchdeck_base64, data.pitchdeck_name);
    }

    // Build row
    const row = [
      data.submitted_at || new Date().toISOString(),
      data.name,
      data.email,
      data.linkedin_url,
      data.startup_name,
      data.sector,
      data.one_liner,
      data.why_this,
      data.stage,
      data.founder_type,
      data.cofounder_details,
      data.hours,
      data.biggest_challenge,
      data.applied_before,
      data.why_not_job,
      data.success_vision,
      data.needs,
      data.video_url,
      data.website,
      deckName,
      deckLink,
    ];

    sheet.appendRow(row);

    // Auto-resize columns for readability
    sheet.autoResizeColumns(1, HEADERS.length);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Save pitch deck PDF to Google Drive ─────────────────────────
function savePitchDeckToDrive(base64Data, filename) {
  try {
    // Create or find a "NoCap VC Pitch Decks" folder
    let folder;
    const folders = DriveApp.getFoldersByName('NoCap VC Pitch Decks');
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder('NoCap VC Pitch Decks');
    }

    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'application/pdf',
      filename
    );
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return 'Upload failed: ' + err.message;
  }
}

// ── GET handler (health check) ───────────────────────────────────
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'NoCap VC API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
