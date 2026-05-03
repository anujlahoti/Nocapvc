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
//  AFTER EDITING THIS FILE:
//  Deploy → Manage deployments → Edit (pencil) → New version → Deploy
//  The URL stays the same.
//
// ══════════════════════════════════════════════════════════════════

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

// ── Entry point — routes by _type ────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data._type === 'blog_subscribe') return handleBlogSubscribe(data);
    if (data._type === 'interview_report') return handleInterviewReport(data);

    return handleApplication(data);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET handler (token validation for AI Interview) ───────────────
function doGet(e) {
  try {
    const token = e && e.parameter && e.parameter.token;
    if (!token) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'NoCap VC API is running' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Applications');
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ valid: false, reason: 'no_sheet' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const tokenCol = headers.indexOf('Interview Token');
    const usedCol  = headers.indexOf('Token Used');

    if (tokenCol === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({ valid: false, reason: 'no_token_column' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][tokenCol] === token) {
        if (usedCol !== -1 && data[i][usedCol] === true) {
          return ContentService
            .createTextOutput(JSON.stringify({ valid: false, reason: 'completed' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
        const nameCol     = headers.indexOf('Full Name');
        const startupCol  = headers.indexOf('Startup Name');
        const sectorCol   = headers.indexOf('Sector');
        const stageCol    = headers.indexOf('Stage');
        const linerCol    = headers.indexOf('One-Liner');
        const problemCol  = headers.indexOf('Problem Gap');
        const whyCol      = headers.indexOf('Why This Idea');
        const customerCol = headers.indexOf('Target Customer');
        const productCol  = headers.indexOf('Product Description');
        const domainCol   = headers.indexOf('Domain Expertise');
        const compCol     = headers.indexOf('Competitors');
        const revenueCol  = headers.indexOf('Revenue Model');
        const linkedinCol = headers.indexOf('LinkedIn URL');
        const websiteCol  = headers.indexOf('Website');

        return ContentService
          .createTextOutput(JSON.stringify({
            valid: true,
            founder: {
              name:               nameCol    !== -1 ? data[i][nameCol]     : '',
              startup:            startupCol !== -1 ? data[i][startupCol]  : '',
              sector:             sectorCol  !== -1 ? data[i][sectorCol]   : '',
              stage:              stageCol   !== -1 ? data[i][stageCol]    : '',
              one_liner:          linerCol   !== -1 ? data[i][linerCol]    : '',
              problem:            problemCol !== -1 ? data[i][problemCol]  : '',
              why_this:           whyCol     !== -1 ? data[i][whyCol]      : '',
              target_customer:    customerCol!== -1 ? data[i][customerCol] : '',
              product_description:productCol !== -1 ? data[i][productCol]  : '',
              domain_expertise:   domainCol  !== -1 ? data[i][domainCol]   : '',
              competitors:        compCol    !== -1 ? data[i][compCol]     : '',
              revenue_model:      revenueCol !== -1 ? data[i][revenueCol]  : '',
              linkedin_url:       linkedinCol!== -1 ? data[i][linkedinCol] : '',
              website:            websiteCol !== -1 ? data[i][websiteCol]  : '',
            }
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ valid: false, reason: 'not_found' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ valid: false, reason: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Handle startup application form ──────────────────────────────
function handleApplication(data) {
  const SHEET_NAME = 'Applications';

  const HEADERS = [
    'Submitted At',
    'Full Name',
    'Email',
    'Phone',
    'LinkedIn URL',
    'Startup Name',
    'Sector',
    'One-Liner',
    'Why This Idea',
    'Stage',
    'Founder Type',
    'Co-founder Details',
    'Biggest Challenge',
    'Applied Before',
    'Why Not A Job',
    'Success Vision (2 yrs)',
    'Needs',
    'Problem Gap',
    'Target Customer',
    'Product Description',
    'Domain Expertise',
    'Competitors',
    'Revenue Model',
    'Video URL',
    'Pitch Deck URL',
    'Website',
    'Referred By',
    'Referral Code',
    'Interview Token',
    'Token Used',
  ];

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setBackground('#FFE034')
      .setFontColor('#000000')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  const row = [
    data.submitted_at || new Date().toISOString(),
    data.name        || '',
    data.email       || '',
    data.phone       || '',
    data.linkedin_url || '',
    data.startup_name || '',
    data.sector       || '',
    data.one_liner    || '',
    data.why_this     || '',
    data.stage        || '',
    data.founder_type || '',
    data.cofounder_details || '',
    data.biggest_challenge || '',
    data.applied_before    || '',
    data.why_not_job       || '',
    data.success_vision    || '',
    data.needs             || '',
    data.problem_gap       || '',
    data.target_customer   || '',
    data.product_description || '',
    data.domain_expertise  || '',
    data.competitors       || '',
    data.revenue_model     || '',
    data.video_url         || '',
    data.pitchdeck_url     || '',
    data.website           || '',
    data.referred_by       || '',
    data.referral_code     || '',
    '',   // Interview Token — filled later when you send invite
    false // Token Used
  ];

  sheet.appendRow(row);
  sheet.autoResizeColumns(1, HEADERS.length);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Handle blog email subscriptions ──────────────────────────────
function handleBlogSubscribe(data) {
  const TAB = 'Blog Subscribers';
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(TAB);

  if (!sheet) {
    sheet = ss.insertSheet(TAB);
    sheet.appendRow(['Subscribed At', 'Email', 'Source']);
    sheet.getRange(1, 1, 1, 3)
      .setBackground('#FFE034')
      .setFontColor('#000000')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Avoid duplicate emails
  const existing = sheet.getDataRange().getValues();
  const emailCol = 1; // 0-indexed: Email is column B (index 1)
  for (let i = 1; i < existing.length; i++) {
    if (existing[i][emailCol] === data.email) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'duplicate' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  sheet.appendRow([
    data.subscribed_at || new Date().toISOString(),
    data.email || '',
    data.source || 'blog'
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Handle AI interview report save ──────────────────────────────
function handleInterviewReport(data) {
  const TAB = 'Interview Reports';
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(TAB);

  if (!sheet) {
    sheet = ss.insertSheet(TAB);
    sheet.appendRow(['Submitted At', 'Founder Name', 'Startup', 'Sector', 'Passes Bar', 'Overall Score', 'Verdict', 'Full Report JSON']);
    sheet.getRange(1, 1, 1, 8)
      .setBackground('#FFE034')
      .setFontColor('#000000')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  const report = data.report || {};
  const memo   = report.memo || {};

  sheet.appendRow([
    new Date().toISOString(),
    data.founder_name  || '',
    data.startup_name  || '',
    data.sector        || '',
    data.passes_bar    ? 'YES' : 'NO',
    report.overall_score || '',
    (memo.verdict || '').slice(0, 200),
    JSON.stringify(report).slice(0, 5000)
  ]);

  // Mark token as used in Applications sheet
  if (data.token) {
    try {
      const appSheet = ss.getSheetByName('Applications');
      if (appSheet) {
        const appData   = appSheet.getDataRange().getValues();
        const headers   = appData[0];
        const tokenCol  = headers.indexOf('Interview Token');
        const usedCol   = headers.indexOf('Token Used');
        if (tokenCol !== -1 && usedCol !== -1) {
          for (let i = 1; i < appData.length; i++) {
            if (appData[i][tokenCol] === data.token) {
              appSheet.getRange(i + 1, usedCol + 1).setValue(true);
              break;
            }
          }
        }
      }
    } catch {}
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Manual setup helper — run once to create all sheet tabs ──────
function manualSetup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ['Applications', 'Blog Subscribers', 'Interview Reports'].forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });
  Logger.log('Setup complete.');
}
