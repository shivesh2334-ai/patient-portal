import { NextRequest, NextResponse } from "next/server";

// Forwards de-identified visit rows to a Google Apps Script Web App bound to a
// Google Sheet (see README "Google Sheets sync" for the Apps Script code to
// deploy). Keeps the webhook URL server-side only — never exposed to the client.
type SheetsSyncPayload = {
  rows: Record<string, unknown>[];
};

function isSheetsSyncPayload(body: unknown): body is SheetsSyncPayload {
  if (!body || typeof body !== "object" || !("rows" in body)) return false;
  const rows = (body as { rows?: unknown }).rows;
  return Array.isArray(rows) && rows.every((row) => row && typeof row === "object" && !Array.isArray(row));
}

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const webhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "GOOGLE_SHEETS_WEBHOOK_URL is not configured on the server." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isSheetsSyncPayload(body)) {
    return NextResponse.json(
      { error: "Request body must be an object with a rows array of records." },
      { status: 400 }
    );
  }

  try {
    const targetUrl = new URL(webhookUrl);
    if (webhookSecret) {
      targetUrl.searchParams.set("token", webhookSecret);
    }

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: body.rows }),
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: `Apps Script webhook returned ${res.status}: ${text}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true, response: text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach Google Sheets webhook." },
      { status: 502 }
    );
  }
}
