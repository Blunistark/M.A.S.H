"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
if (!env_1.SUPABASE_URL || !env_1.SUPABASE_ANON_KEY) {
    console.warn('Warning: SUPABASE_URL or SUPABASE_ANON_KEY is missing in environment variables.');
}
exports.supabase = (0, supabase_js_1.createClient)(env_1.SUPABASE_URL, env_1.SUPABASE_ANON_KEY);
