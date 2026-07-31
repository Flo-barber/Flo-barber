import { createClient } from "@supabase/supabase-js";

// Client Supabase à privilèges élevés (clé de service). À N'UTILISER QUE côté
// serveur (server actions / route handlers) — ne JAMAIS l'exposer au navigateur.
// La clé `SUPABASE_SERVICE_ROLE_KEY` contourne la RLS : garder strictement secrète.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
