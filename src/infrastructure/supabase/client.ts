/**
 * WILLShop OS — Supabase Client Setup
 * Infrastructure Layer.
 */

import { createBrowserClient } from '@supabase/ssr';

const DEFAULT_SUPABASE_URL = 'https://stbzctncpvgqdpybcrmg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YnpjdG5jcHZncWRweWJjcm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MDAzMjYsImV4cCI6MjEwNDE3NjMyNn0.G7QlTqyz4_D6nxbn72tIX1K-nbAKBzSX7CuMB2jixvs';

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : DEFAULT_SUPABASE_URL;

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : DEFAULT_SUPABASE_ANON_KEY;

  return createBrowserClient(url, key);
}
