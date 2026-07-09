import { createClient } from '@supabase/supabase-js';

function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'prime_flavor' }, auth: { persistSession: false } },
  );
}

let _client: ReturnType<typeof createSupabaseAdminClient> | null = null;

// Server-only client (service_role) — used exclusively inside API routes.
// Bypasses RLS, so this must never be imported into client components.
export function getSupabaseAdmin() {
  if (!_client) _client = createSupabaseAdminClient();
  return _client;
}
