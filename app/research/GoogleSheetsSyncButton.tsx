"use client";

import { useState } from "react";

export default function GoogleSheetsSyncButton({ rows }: { rows: Record<string, unknown>[] }) {
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setStatus("syncing");
    setMessage(null);
    try {
      const res = await fetch("/api/sheets-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Sync failed.");
        return;
      }
      setStatus("done");
      setMessage(`Synced ${rows.length} rows to Google Sheets.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Sync failed.");
    }
  }

  return (
    <div>
      <button onClick={sync} disabled={rows.length === 0 || status === "syncing"} className="btn-secondary">
        {status === "syncing" ? "Syncing..." : "Sync to Google Sheets"}
      </button>
      {message && (
        <p className={`text-xs mt-1 ${status === "error" ? "text-rose-500" : "text-teal-600"}`}>{message}</p>
      )}
    </div>
  );
}
