import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;

export async function fetchVocabulary() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('themes').select('*, vocabulary(*)').eq('published', true).order('sort_order').order('sort_order', { referencedTable: 'vocabulary' });
  if (error) throw error;
  return data;
}
