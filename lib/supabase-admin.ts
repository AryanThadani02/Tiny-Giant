import { createClient } from "@supabase/supabase-js"

// This file should only be imported in server components or API routes
// NEVER import this in client components

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// If service role key is missing, we'll use the anon key with a warning
if (!supabaseServiceKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to anon key, which may cause RLS issues.")
}

// Create an admin client with the service role key if available, otherwise use anon key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

