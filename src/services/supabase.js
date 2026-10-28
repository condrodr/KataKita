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

const cleanMetadataText = value => String(value || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

export async function searchWikimediaImages(query) {
  const keyword = String(query || '').trim();
  if (!keyword) return [];

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: keyword,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: '720',
    format: 'json',
    origin: '*',
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
  if (!response.ok) throw new Error('Pencarian Wikimedia tidak dapat dihubungi.');
  const payload = await response.json();

  return Object.values(payload.query?.pages || {})
    .map(page => {
      const info = page.imageinfo?.[0];
      const meta = info?.extmetadata || {};
      return {
        id: String(page.pageid),
        title: String(page.title || '').replace(/^File:/, ''),
        url: info?.thumburl || info?.url || '',
        pageUrl: info?.descriptionurl || '',
        author: cleanMetadataText(meta.Artist?.value || meta.Credit?.value || 'Kontributor Wikimedia Commons'),
        license: cleanMetadataText(meta.LicenseShortName?.value || meta.UsageTerms?.value || 'Lihat halaman sumber'),
        alt: cleanMetadataText(meta.ImageDescription?.value || page.title || keyword),
        mime: info?.mime || '',
      };
    })
    .filter(image => image.url && image.mime.startsWith('image/'));
}
