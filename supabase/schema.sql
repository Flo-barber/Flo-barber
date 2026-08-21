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

-- Commandes boutique (créées par le webhook Stripe via la clé de service)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  email text,
  amount_eur numeric(10, 2),
  currency text default 'eur',
  items jsonb,
  fulfillment text default 'shipping',
  shipping jsonb,
  stripe_session_id text unique,
  status text default 'paid',
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);

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
alter table public.orders enable row level security;

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

-- orders : lecture par le client concerné ou l'admin. Aucune policy d'insertion
-- côté client : les commandes ne sont créées que par le webhook Stripe (clé de
-- service, qui contourne la RLS).
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

-- ---------- DURCISSEMENT : colonnes modifiables par le client ----------
-- RLS filtre les LIGNES, pas les COLONNES. On empêche donc un client de
-- modifier lui-même ses points : il ne peut mettre à jour que son nom et
-- son téléphone. Les points ne sont modifiés que par le trigger add_points
-- (SECURITY DEFINER), lors d'une transaction créée par un admin.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- =============================================================
--  PRODUITS (boutique) — édités par l'admin, lus par tous
-- =============================================================
create table if not exists public.products (
  slug text primary key,
  name_fr text not null,
  name_en text not null,
  tagline_fr text,
  tagline_en text,
  price_cents integer not null default 0 check (price_cents >= 0),
  image text,
  stock integer, -- NULL = stock illimité (non suivi) ; sinon quantité disponible
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Décrémente le stock de façon atomique (appelé par le webhook Stripe).
create or replace function public.decrement_stock(p_slug text, p_qty integer)
returns void
language sql
security definer set search_path = public
as $$
  update public.products
  set stock = greatest(0, stock - p_qty), updated_at = now()
  where slug = p_slug and stock is not null;
$$;

alter table public.products enable row level security;

-- Lecture : produits actifs visibles par tous ; l'admin voit aussi les inactifs.
drop policy if exists products_select on public.products;
create policy products_select on public.products
  for select using (active = true or public.is_admin());

-- Écriture (création / édition / suppression) : réservée aux administrateurs.
drop policy if exists products_write on public.products;
create policy products_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed initial (les 6 produits mock). `on conflict do nothing` : idempotent.
insert into public.products (slug, name_fr, name_en, tagline_fr, tagline_en, price_cents, image, stock, sort) values
  ('pommade-mate', 'Pommade mate', 'Matte pomade', 'Fixation forte, fini naturel', 'Strong hold, natural finish', 1690, '/catalogue/products/pommade-mate.jpg', 50, 1),
  ('cire-coiffante', 'Cire coiffante', 'Styling wax', 'Tenue souple et matière', 'Flexible hold and texture', 1490, '/catalogue/products/cire-coiffante.jpg', 50, 2),
  ('huile-barbe', 'Huile à barbe', 'Beard oil', 'Nourrit et assouplit', 'Nourishes and softens', 1990, '/catalogue/products/huile-barbe.jpg', 40, 3),
  ('shampoing-solide', 'Shampoing solide', 'Solid shampoo', 'Nettoyant doux, zéro déchet', 'Gentle cleanse, zero waste', 1190, '/catalogue/products/shampoing-solide.jpg', 60, 4),
  ('spray-texturisant', 'Spray texturisant', 'Texturising spray', 'Volume et effet matière', 'Volume and texture', 1790, '/catalogue/products/spray-texturisant.jpg', 30, 5),
  ('baume-apres-rasage', 'Baume après-rasage', 'Aftershave balm', 'Apaise et hydrate', 'Soothes and hydrates', 1590, '/catalogue/products/baume-apres-rasage.jpg', 45, 6)
on conflict (slug) do nothing;

-- =============================================================
--  DÉFINIR UN ADMINISTRATEUR
-- -------------------------------------------------------------
--  1. Crée d'abord un compte via le site (/compte/connexion).
--  2. Récupère son id : Authentication > Users (copie l'UUID).
--  3. Exécute (en remplaçant l'UUID) :
--
--     insert into public.admins (user_id) values ('COLLE_ICI_UUID');
-- =============================================================

-- =============================================================
--  FIDÉLITÉ — Valeur des points & utilisation (remises)
-- -------------------------------------------------------------
--  Règles : 1 € dépensé = 1 Flo Point (gain, inchangé).
--           1 Flo Point = 0,05 € de valeur (remise).
--           Utilisation à partir de 100 points (tout ou partie).
--  Bloc idempotent : peut être ré-exécuté sans risque.
-- =============================================================

-- Type de mouvement de points : 'credit' (achat/salon), 'redeem' (utilisation),
-- 'refund' (remboursement d'un hold non payé).
alter table public.transactions
  add column if not exists kind text not null default 'credit';

-- Garde-fou : le solde de points ne peut JAMAIS devenir négatif (protège les
-- utilisations de points contre tout dépassement, même en cas de bug applicatif).
create or replace function public.add_points()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_total integer;
begin
  update public.profiles
  set points = points + new.points
  where id = new.client_id
  returning points into new_total;

  if new_total < 0 then
    raise exception 'Solde de points insuffisant (client %, delta %)',
      new.client_id, new.points using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Remise appliquée sur les commandes boutique.
alter table public.orders
  add column if not exists points_used integer not null default 0;
alter table public.orders
  add column if not exists discount_cents integer not null default 0;

-- Réservations de points (holds) liées à une session Stripe.
--  held      : points déduits, en attente de paiement
--  confirmed : paiement validé (points consommés)
--  released  : paiement abandonné/expiré (points rendus au client)
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null check (points > 0),
  cents integer not null check (cents >= 0),
  stripe_session_id text unique,
  status text not null default 'held' check (status in ('held', 'confirmed', 'released')),
  created_at timestamptz not null default now()
);
create index if not exists redemptions_user_id_idx on public.redemptions (user_id);

alter table public.redemptions enable row level security;
-- Lecture par le client concerné ou l'admin. AUCUNE écriture côté client :
-- tout passe par les RPC SECURITY DEFINER ci-dessous (ou la clé de service).
drop policy if exists redemptions_select on public.redemptions;
create policy redemptions_select on public.redemptions
  for select using (user_id = auth.uid() or public.is_admin());

-- RÉSERVE des points pour la session de paiement courante (appelé par le client
-- connecté au moment de créer le paiement). Atomique : verrou de ligne + vérif du
-- solde, ce qui empêche toute double-dépense (les points quittent le solde tout de
-- suite). Refuse si < 100 points ou solde insuffisant.
create or replace function public.hold_points(p_points integer, p_cents integer, p_session text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bal integer;
begin
  if uid is null then return false; end if;
  if p_points is null or p_points < 100 then return false; end if;
  if p_cents is null or p_cents < 0 then return false; end if;

  select points into bal from public.profiles where id = uid for update;
  if bal is null or bal < p_points then return false; end if;

  insert into public.redemptions (user_id, points, cents, stripe_session_id, status)
  values (uid, p_points, p_cents, p_session, 'held');

  -- Débit immédiat via une transaction négative (le trigger met à jour le solde).
  insert into public.transactions (client_id, amount_eur, points, created_by, kind)
  values (uid, 0, -p_points, uid, 'redeem');

  return true;
end;
$$;

-- CONFIRME un hold après paiement réussi (points déjà déduits au hold).
-- Idempotent (n'agit que sur un hold encore 'held').
create or replace function public.confirm_redemption(p_session text)
returns void
language sql
security definer set search_path = public
as $$
  update public.redemptions set status = 'confirmed'
  where stripe_session_id = p_session and status = 'held';
$$;

-- LIBÈRE un hold (paiement abandonné/expiré) : rend les points au client.
-- Idempotent (n'agit que sur un hold encore 'held').
create or replace function public.release_redemption(p_session text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  r public.redemptions%rowtype;
begin
  select * into r from public.redemptions
  where stripe_session_id = p_session and status = 'held'
  for update;
  if not found then return; end if;

  update public.redemptions set status = 'released' where id = r.id;

  -- Crédit compensatoire (le trigger remet les points sur le solde).
  insert into public.transactions (client_id, amount_eur, points, created_by, kind)
  values (r.user_id, 0, r.points, r.user_id, 'refund');
end;
$$;

-- Autorise l'appel des RPC de hold par les clients connectés (les fonctions sont
-- SECURITY DEFINER : la vérification d'identité se fait via auth.uid() à l'intérieur).
grant execute on function public.hold_points(integer, integer, text) to authenticated;

-- =============================================================
--  COUPES (catalogue) — éditées par l'admin, lues par tous
-- -------------------------------------------------------------
--  Coupes signature de la page /catalogue, reliées à des produits.
--  images  : tableau JSON d'URLs (String[]) — galerie multi-photos.
--  products: tableau JSON de slugs produits (référence public.products.slug).
--  Bloc idempotent.
-- =============================================================
create table if not exists public.cuts (
  slug text primary key,
  title_fr text not null,
  title_en text not null,
  description_fr text,
  description_en text,
  images jsonb not null default '[]'::jsonb,
  products jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cuts enable row level security;

-- Lecture : coupes actives visibles par tous ; l'admin voit aussi les inactives.
drop policy if exists cuts_select on public.cuts;
create policy cuts_select on public.cuts
  for select using (active = true or public.is_admin());

-- Écriture (création / édition / suppression) : réservée aux administrateurs.
drop policy if exists cuts_write on public.cuts;
create policy cuts_write on public.cuts
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed des 5 coupes existantes (idempotent). Images = chemins statiques du projet.
insert into public.cuts (slug, title_fr, title_en, description_fr, description_en, images, products, sort) values
  ('fade-classique', 'Fade classique', 'Classic fade',
   'Dégradé progressif sur les côtés et la nuque, longueur travaillée sur le dessus. Une coupe nette et intemporelle, adaptée à tous les styles.',
   'Progressive taper on the sides and nape, worked length on top. A clean, timeless cut that suits every style.',
   '["/catalogue/fade-classique-1.jpg","/catalogue/fade-classique-2.jpg","/catalogue/fade-classique-3.jpg"]'::jsonb,
   '["pommade-mate","spray-texturisant"]'::jsonb, 1),
  ('undercut', 'Undercut', 'Undercut',
   'Contraste marqué entre des côtés très courts et un dessus long à coiffer en arrière. Un look affirmé, facile à styliser au quotidien.',
   'Bold contrast between very short sides and a long top to slick back. A statement look, easy to style day to day.',
   '["/catalogue/undercut-1.jpg","/catalogue/undercut-2.jpg"]'::jsonb,
   '["cire-coiffante","huile-barbe"]'::jsonb, 2),
  ('crop-francais', 'Crop français', 'French crop',
   'Frange texturée portée vers l''avant, côtés dégradés. Un rendu mat et moderne qui demande peu d''entretien.',
   'Textured fringe worn forward, tapered sides. A modern, matte finish that needs little upkeep.',
   '["/catalogue/crop-francais-1.jpg","/catalogue/crop-francais-2.jpg"]'::jsonb,
   '["pommade-mate"]'::jsonb, 3),
  ('pompadour', 'Pompadour', 'Pompadour',
   'Volume travaillé vers l''arrière et le haut, côtés courts. Un grand classique élégant qui met en valeur la matière.',
   'Volume worked up and back, short sides. An elegant classic that showcases the hair''s texture.',
   '["/catalogue/pompadour-1.jpg","/catalogue/pompadour-2.jpg","/catalogue/pompadour-3.jpg"]'::jsonb,
   '["pommade-mate","cire-coiffante","spray-texturisant"]'::jsonb, 4),
  ('buzz-cut', 'Buzz cut', 'Buzz cut',
   'Coupe très courte et uniforme à la tondeuse. Minimaliste, sans entretien, idéale pour un style franc.',
   'Very short, uniform clipper cut. Minimalist, zero-maintenance, ideal for a no-nonsense style.',
   '["/catalogue/buzz-cut-1.jpg"]'::jsonb,
   '["baume-apres-rasage"]'::jsonb, 5)
on conflict (slug) do nothing;

-- =============================================================
--  BARBIERS (équipe) — édités par l'admin, lus par tous
-- -------------------------------------------------------------
--  Présentés en timeline sur la page d'accueil (section « Nos barbiers »).
--  Bloc idempotent.
-- =============================================================
create table if not exists public.barbers (
  slug text primary key,
  name text not null,
  role_fr text,
  role_en text,
  bio_fr text,
  bio_en text,
  image text,
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.barbers enable row level security;

drop policy if exists barbers_select on public.barbers;
create policy barbers_select on public.barbers
  for select using (active = true or public.is_admin());

drop policy if exists barbers_write on public.barbers;
create policy barbers_write on public.barbers
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed de l'équipe de démo (photos = images de /catalogue, à remplacer par de
-- vraies photos de portrait).
insert into public.barbers (slug, name, role_fr, role_en, bio_fr, bio_en, image, sort) values
  ('flo', 'Flo', 'Fondateur & Master Barber', 'Founder & Master Barber',
   'À l''origine de Flo Barber, il façonne le style de la maison depuis le premier coup de ciseaux.',
   'The founder of Flo Barber — shaping the house style since the very first cut.',
   '/catalogue/fade-classique-1.jpg', 1),
  ('karim', 'Karim', 'Barbier senior', 'Senior Barber',
   'Spécialiste du dégradé net et de la barbe sculptée au rasoir.',
   'Specialist in clean fades and razor-sculpted beards.',
   '/catalogue/pompadour-1.jpg', 2),
  ('antoine', 'Antoine', 'Barbier coiffeur', 'Barber & Stylist',
   'Coupes modernes et texturées, toujours à l''écoute du style de chacun.',
   'Modern, textured cuts — always tuned to each client''s style.',
   '/catalogue/crop-francais-1.jpg', 3),
  ('sofiane', 'Sofiane', 'Barbier & rasage traditionnel', 'Barber & Traditional Shave',
   'Le rituel du coupe-chou et de la serviette chaude, pour un rasage de près.',
   'The straight-razor and hot-towel ritual, for the closest shave.',
   '/catalogue/buzz-cut-1.jpg', 4)
on conflict (slug) do nothing;
