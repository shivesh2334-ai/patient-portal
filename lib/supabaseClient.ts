import { createClient } from "@supabase/supabase-js";

// IMPORTANT: this module is imported at build time (Next.js "Collecting page
// data" step imports every route, even dynamic ones), so createClient() must
// never throw just because env vars aren't set yet in the deployment
// environment. We fall back to an inert placeholder URL so the build always
// succeeds; real reads/writes will simply fail at runtime with a clear
// Supabase error until the real env vars are configured in Vercel.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!isSupabaseConfigured && typeof window === "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "in Vercel Project Settings > Environment Variables (and in .env.local for local dev)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
