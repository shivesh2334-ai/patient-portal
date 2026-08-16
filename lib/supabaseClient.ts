import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function decodeBase64Url(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const base64 =
      typeof window === "undefined"
        ? Buffer.from(normalized + padding, "base64").toString("utf-8")
        : window.atob(normalized + padding);
    return JSON.parse(base64) as { role?: string };
  } catch {
    return null;
  }
}

function isPublicSupabaseKey(key: string | undefined) {
  if (!key) return false;
  if (key.startsWith("sb_publishable_")) return true;
  if (key.startsWith("sb_secret_")) return false;

  const jwtParts = key.split(".");
  if (jwtParts.length !== 3) return false;
  const payload = decodeBase64Url(jwtParts[1]);
  return payload?.role === "anon";
}

// IMPORTANT: this module is imported at build time (Next.js "Collecting page
// data" step imports every route, even dynamic ones), so createClient() must
// never throw just because env vars aren't set yet in the deployment
// environment. We fall back to an inert placeholder URL so the build always
// succeeds; real reads/writes will simply fail at runtime with a clear
// Supabase error until the real env vars are configured in Vercel.
export const supabaseConfigError = !rawSupabaseUrl
  ? "NEXT_PUBLIC_SUPABASE_URL is missing."
  : !rawSupabaseAnonKey
    ? "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
    : !isPublicSupabaseKey(rawSupabaseAnonKey)
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY must be the Supabase anon/publishable key, not a secret or service_role key."
      : null;

const supabaseUrl = rawSupabaseUrl || "https://placeholder.supabase.co";
const supabaseAnonKey = supabaseConfigError ? "placeholder-anon-key" : rawSupabaseAnonKey || "placeholder-anon-key";

export const isSupabaseConfigured = supabaseConfigError === null;

if (!isSupabaseConfigured && typeof window === "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    `${supabaseConfigError} Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ` +
      "in Vercel Project Settings > Environment Variables (and in .env.local for local dev). " +
      "Use the Supabase anon/publishable key for NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
