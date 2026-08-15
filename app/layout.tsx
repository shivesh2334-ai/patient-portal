import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guideline-Based Longitudinal Patient Portal",
  description:
    "Longitudinal diabetes, hypertension and lipid management with embedded research data capture",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen flex flex-col">
        <header className="bg-teal-700 text-white">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-serif text-xl font-semibold">
              CareTrack&nbsp;<span className="font-sans font-normal text-teal-100 text-sm">longitudinal DM · HTN · lipid portal</span>
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/" className="hover:text-teal-100">Dashboard</Link>
              <Link href="/patients/new" className="hover:text-teal-100">New Patient</Link>
              <Link href="/research" className="hover:text-teal-100">Research Hub</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          {children}
        </main>
        <footer className="text-center text-xs text-gray-400 py-6">
          Guideline anchors: ESC 2024 (BP target 120–129 mmHg if tolerated) · Indian consensus LDL-C targets (&lt;70, &lt;55 mg/dL very-high-risk) · RSSDI glucose/HbA1c monitoring.
          De-identified research export available in Research Hub.
        </footer>
      </body>
    </html>
  );
}
