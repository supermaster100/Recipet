import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Populated incrementally as tables are defined.
export type Database = Record<string, never>;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
