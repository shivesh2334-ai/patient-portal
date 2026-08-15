# CareTrack — Guideline-Based Longitudinal Patient Portal

Diabetes · Hypertension · Lipid management, with embedded research data capture.

Combines timeline tracking of visits/labs, family history, and guideline rules
(ESC 2024 BP targets, Indian dyslipidaemia consensus LDL-C targets, RSSDI-aligned
HbA1c/glucose monitoring) with a Research Hub for de-identified, guideline-adherence
and trajectory analytics.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres) · Recharts

## 1. Supabase setup
1. Create a free project at supabase.com.
2. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.

## 2. Local setup
```bash
cp .env.example .env.local
# paste your Supabase URL + anon key into .env.local
npm install
npm run dev
```
Visit http://localhost:3000

## 3. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: guideline-based longitudinal patient portal"
git branch -M main
git remote add origin https://github.com/shivesh2334-ai/YOUR_REPO_NAME.git
git push -u origin main
```
(If working from iPad/Working Copy: create the repo on github.com first, then use
Working Copy's "Push" after committing, same as your other projects.)

## 4. Deploy to Vercel
1. On vercel.com, **New Project → Import** the GitHub repo.
2. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Set the deployment region to **Mumbai (bom1)** under Project Settings → Functions.
4. Deploy. Vercel will auto-redeploy on every push to `main`.

## Data model
See `lib/types.ts` for the full TypeScript model and `supabase/schema.sql` for the
Postgres schema — demographics, history, per-visit timeline (diabetes, BP, lipids,
kidney/complications, advice delivered).

## Guideline engine
`lib/guidelines.ts` computes per-patient risk flags and target attainment:
- **BP**: ESC 2024 default treated SBP target 120–129 mmHg if tolerated; relaxed
  target for age ≥80 / documented frailty.
- **LDL-C**: <70 mg/dL (high-risk diabetes), <55 mg/dL (very-high-risk — established
  ASCVD or diabetes + an additional risk factor), per Indian consensus reviews.
- **HbA1c**: <7% general target (RSSDI-aligned); hypoglycaemia episodes are flagged
  as a signal to individualise/relax the target.
- **Trajectory**: flags worsening/improving HbA1c trend across visits (≥0.5% delta).

These are decision-support defaults, not a replacement for individualised clinical
judgement — review against full current guideline text per patient.

## Research Hub (`/research`)
- Target-attainment summary (HbA1c / BP / LDL-C at latest follow-up).
- Family-history vs. complication-marker cross-tab.
- Poor-trajectory-despite-advice count.
- One-click de-identified CSV export (one row per visit, `patient_code` only —
  no names) for import into Google Sheets, R, or Python for baseline-predictor,
  trend-slope, and time-to-complication modelling addressing the research questions
  in the app (predictors of 1-/3-/5-year complications, incremental value of family
  history, advice-combination effects on HbA1c/LDL-C change, visit-frequency and
  trend-slope as predictors of therapy escalation).

## Google Sheets sync
The Research Hub can push de-identified rows straight into a Google Sheet via a
Google Apps Script Web App webhook (same pattern as your HFpEF Pathway Research
Portal), as an alternative to manual CSV import.

**1. Create the Sheet + Apps Script:**
1. Create a new Google Sheet.
2. Extensions → Apps Script, paste:
```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const body = JSON.parse(e.postData.contents);
  const rows = body.rows || [];
  if (rows.length === 0) return ContentService.createTextOutput("No rows");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(Object.keys(rows[0]));
  }
  rows.forEach(function (row) {
    sheet.appendRow(Object.values(row));
  });
  return ContentService.createTextOutput("OK: " + rows.length + " rows appended");
}
```
3. Deploy → New deployment → **Web app**. Execute as: Me. Who has access: **Anyone with the link**. Copy the deployment URL.

**2. Wire it into the app:**
- Add `GOOGLE_SHEETS_WEBHOOK_URL` (the Apps Script deployment URL) as a **server-only**
  environment variable in Vercel — do not prefix it with `NEXT_PUBLIC_`, since it's only
  ever called from the `/api/sheets-sync` server route, not the browser.
- Redeploy. The "Sync to Google Sheets" button on `/research` will then append every
  de-identified visit row to the Sheet.

Note: this appends rows on every click rather than deduplicating — for repeated syncs,
either clear the Sheet first or extend the Apps Script to key off `patient_code` +
`visit_date` and skip duplicates.

## Extending this MVP
This is a working scaffold covering the full requested data model and guideline
engine. Natural next iterations (say the word and I'll build any of these):
- Clinician authentication (Supabase Auth) and RLS policies scoped to `auth.uid()`
  instead of the open dev policies in `schema.sql`.
- Predictive model integration (e.g. a Python/Vercel Edge Function scoring baseline
  + trend features for complication risk) rather than rule-based flags only.
- Google Sheets live sync (Apps Script webhook, as used in your HFpEF Pathway
  Research Portal) as an alternative/parallel export path to the in-app CSV export.
- Home BP / CGM device integrations.
- Multilingual patient-facing advice summaries (English/Hindi/Punjabi/Bengali).
