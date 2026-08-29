import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3000;
export const AGENTS_URL = process.env.AGENTS_URL || (process.env.RENDER === 'true' ? 'https://m-a-s-h-agents.onrender.com' : 'http://127.0.0.1:8000');
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
