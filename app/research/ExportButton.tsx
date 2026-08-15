"use client";

export default function ExportButton({ rows }: { rows: Record<string, unknown>[] }) {
  function downloadCsv() {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const val = r[h];
            const s = val === null || val === undefined ? "" : String(val);
            return `"${s.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deidentified_research_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={downloadCsv} className="btn-primary" disabled={rows.length === 0}>
      Download CSV ({rows.length} visit rows)
    </button>
  );
}
