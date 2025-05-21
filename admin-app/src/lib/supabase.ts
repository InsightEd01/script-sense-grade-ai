import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://pppteoxncuuraqjlrhir.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcHRlb3huY3V1cmFxamxyaGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMzY4MDUsImV4cCI6MjA1OTYxMjgwNX0.XbnTDdFS7Tjgh3XTsrEZr81bJmsGJ4g6UA3lC_x_KTM";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);