import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less client for public storefront reads.
 * Always uses the anon role so RLS "active products" policies apply consistently.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
