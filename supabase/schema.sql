-- Jalankan setelah proyek Supabase dibuat. Materi publik dapat dibaca tanpa login.
create table public.levels (
  id text primary key check (id in ('A1','A2','B1','B2','C1','C2')),
  name text not null,
  label text not null,
  target integer not null default 0,
  focus text,
  outcome text,
  sort_order integer not null
);

create table public.themes (
  id text primary key,
  level_id text not null references public.levels(id),
  title text not null,
  category text,
  description text,
  emoji text,
  color text,
  accent text,
  soft text,
  sort_order integer not null default 0,
  published boolean not null default true
);

create table public.vocabulary (
  id text primary key,
  theme_id text not null references public.themes(id) on delete cascade,
  english text not null,
  indonesian text not null,
  definition text not null,
  definition_id text not null,
  example text not null,
  translation text not null,
  breakdown jsonb not null default '[]'::jsonb,
  image_url text,
  audio_url text,
  sort_order integer not null default 0,
  published boolean not null default true
);

alter table public.levels enable row level security;
alter table public.themes enable row level security;
alter table public.vocabulary enable row level security;
create policy "published levels are public" on public.levels for select using (true);
create policy "published themes are public" on public.themes for select using (published = true);
create policy "published vocabulary is public" on public.vocabulary for select using (published = true);

-- Akun dan penyimpanan progres.
create type public.access_level as enum ('free', 'advance', 'admin');
create type public.confirmation_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  access_level public.access_level not null default 'free',
  advance_until timestamptz,
  created_at timestamptz not null default now()
);

create table public.donation_confirmations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  donor_name text not null,
  amount integer not null check (amount > 0),
  transaction_reference text,
  proof_path text,
  status public.confirmation_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text unique not null,
  access_duration_days integer,
  expires_at timestamptz,
  redeemed_by uuid references public.profiles(id),
  redeemed_at timestamptz,
  disabled_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.donation_confirmations enable row level security;
alter table public.activation_codes enable row level security;

create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id)
with check (auth.uid() = id and access_level = (select access_level from public.profiles where id = auth.uid()));
create policy "create own confirmation" on public.donation_confirmations for insert
with check (auth.uid() = user_id);
create policy "read own confirmations" on public.donation_confirmations for select
using (auth.uid() = user_id);

-- Redeem dan persetujuan harus dilakukan melalui fungsi backend berhak istimewa.
-- Jangan pernah mengirim service_role key ke aplikasi React.
