import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vveohtfzbfohbdfxrvym.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_TVRVcMf8zgCXVhMTxFHFOA_TL2zHX2W';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

