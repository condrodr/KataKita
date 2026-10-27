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


export async function getCurrentUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  const user = data.user;
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'Teman',
    access_level: user.user_metadata?.access_level || 'free',
  };
}


const accountFromUser = user => ({
  id: user.id,
  email: user.email,
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'Teman',
  access_level: user.user_metadata?.access_level || 'free',
});

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return accountFromUser(data.user);
}

export async function signUp(name, email, password) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  if (!data.session) return { pendingVerification: true };
  return accountFromUser(data.user);
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function saveVocabulary(payload) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const record = { ...payload };
  if (!record.id) delete record.id;
  const { data, error } = await supabase
    .from('vocabulary')
    .upsert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeVocabulary(id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { error } = await supabase.from('vocabulary').delete().eq('id', id);
  if (error) throw error;
}
