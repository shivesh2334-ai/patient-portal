export default function ConfigNotice() {
  return (
    <div className="card max-w-xl mx-auto text-center">
      <h1 className="font-serif text-xl font-semibold text-teal-700 mb-2">Database not configured yet</h1>
      <p className="text-sm text-gray-600 mb-4">
        This deployment is missing its Supabase connection. Add these two environment
        variables in <b>Vercel → Project Settings → Environment Variables</b>, then redeploy:
      </p>
      <pre className="bg-gray-50 text-left text-xs p-3 rounded-lg overflow-x-auto">
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co{"\n"}
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
      </pre>
      <p className="text-xs text-gray-400 mt-3">
        Get these from your Supabase project under Settings → API. Run{" "}
        <code className="font-mono">supabase/schema.sql</code> in the SQL Editor first if you haven&rsquo;t already.
      </p>
    </div>
  );
}
