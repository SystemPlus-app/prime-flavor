import { createClient } from '@supabase/supabase-js';

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'prime_flavor' } },
  );
}

let _client: ReturnType<typeof createSupabaseClient> | null = null;

// Read-only (anon) client for the browser — Kiosk, Kitchen, and Admin use this
// for live queries + Realtime subscriptions. RLS only grants it SELECT.
export function getSupabase() {
  if (!_client) _client = createSupabaseClient();
  return _client;
}
