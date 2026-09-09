-- =============================================================
--  Policies RLS du Storage — bucket "products"
--  À exécuter dans Supabase → SQL Editor APRÈS schema.sql.
--
--  Prérequis : créer le bucket "products" (minuscule) en PUBLIC
--  (Storage → New bucket → Public bucket ON). Le bucket public
--  assure la LECTURE des images (URLs publiques) : aucune policy
--  SELECT n'est nécessaire ici.
--
--  Modèle (cf. CLAUDE.md) : écritures réservées aux admins,
--  keyées sur bucket_id = 'products' ET public.is_admin(),
--  sans clause "to authenticated" (même modèle que products_write).
--  is_admin() est défini par schema.sql.
--
--  ⚠️ L'upload admin se fait en upsert:false (INSERT pur). Ne pas
--     repasser en upsert:true, sinon la policy UPDATE est aussi
--     évaluée et bloque l'upload (403 new row violates RLS).
-- =============================================================

-- INSERT (upload d'une nouvelle image)
drop policy if exists "products_objects_insert" on storage.objects;
create policy "products_objects_insert"
on storage.objects for insert
with check ( bucket_id = 'products' and public.is_admin() );

-- UPDATE (remplacement)
drop policy if exists "products_objects_update" on storage.objects;
create policy "products_objects_update"
on storage.objects for update
using ( bucket_id = 'products' and public.is_admin() )
with check ( bucket_id = 'products' and public.is_admin() );

-- DELETE (suppression de l'ancienne image / d'un produit)
drop policy if exists "products_objects_delete" on storage.objects;
create policy "products_objects_delete"
on storage.objects for delete
using ( bucket_id = 'products' and public.is_admin() );
