-- =============================================================
--  Flo Barber — Schéma base de données fidélité (Supabase)
-- -------------------------------------------------------------
--  À exécuter dans Supabase : SQL Editor > New query > Run.
-- =============================================================

-- ---------- TABLES ----------

-- Profil client (1 ligne par utilisateur authentifié)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  email text,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

-- Comptes administrateurs (le salon)
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- Transactions : chaque crédit de points effectué par le salon
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  amount_eur numeric(10, 2) not null check (amount_eur >= 0),
  points integer not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists transactions_client_id_idx on public.transactions (client_id);

-- ---------- FONCTIONS & TRIGGERS ----------

-- Crée automatiquement un profil à l'inscription d'un utilisateur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Met à jour le total de points quand une transaction est ajoutée
create or replace function public.add_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set points = points + new.points
  where id = new.client_id;
  return new;
end;
$$;

drop trigger if exists on_transaction_created on public.transactions;
create trigger on_transaction_created
after insert on public.transactions
for each row execute function public.add_points();

-- Indique si l'utilisateur courant est un administrateur
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- ---------- SÉCURITÉ (Row Level Security) ----------

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.admins enable row level security;

-- profiles : un client voit/modifie sa ligne ; l'admin voit/modifie tout
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- transactions : lecture par le client concerné ou l'admin ; insertion RÉSERVÉE à l'admin
drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select using (client_id = auth.uid() or public.is_admin());

drop policy if exists transactions_insert_admin on public.transactions;
create policy transactions_insert_admin on public.transactions
  for insert with check (public.is_admin());

-- admins : chacun peut vérifier s'il est lui-même admin
drop policy if exists admins_select_self on public.admins;
create policy admins_select_self on public.admins
  for select using (user_id = auth.uid());

-- ---------- DURCISSEMENT : colonnes modifiables par le client ----------
-- RLS filtre les LIGNES, pas les COLONNES. On empêche donc un client de
-- modifier lui-même ses points : il ne peut mettre à jour que son nom et
-- son téléphone. Les points ne sont modifiés que par le trigger add_points
-- (SECURITY DEFINER), lors d'une transaction créée par un admin.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- =============================================================
--  DÉFINIR UN ADMINISTRATEUR
-- -------------------------------------------------------------
--  1. Crée d'abord un compte via le site (/compte/connexion).
--  2. Récupère son id : Authentication > Users (copie l'UUID).
--  3. Exécute (en remplaçant l'UUID) :
--
--     insert into public.admins (user_id) values ('COLLE_ICI_UUID');
-- =============================================================
