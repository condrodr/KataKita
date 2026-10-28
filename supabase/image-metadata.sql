-- Jalankan sekali di Supabase SQL Editor sebelum menyimpan gambar dari panel admin.
-- File gambar tetap berada di Wikimedia Commons; database hanya menyimpan URL dan atribusi.
alter table public.vocabulary
  add column if not exists image_provider text,
  add column if not exists image_page_url text,
  add column if not exists image_author text,
  add column if not exists image_license text,
  add column if not exists image_alt text;

comment on column public.vocabulary.image_url is 'URL CDN gambar eksternal; bukan data file gambar.';
comment on column public.vocabulary.image_page_url is 'Halaman sumber untuk atribusi dan informasi lisensi.';
