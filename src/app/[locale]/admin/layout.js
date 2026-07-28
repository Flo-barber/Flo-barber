import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/dictionaries";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: getT(locale)("meta.adminTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminLayout({ children, params }) {
  const { locale } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/compte/connexion?redirect=/${locale}/admin`);
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    // Connecté mais pas administrateur → renvoyé vers l'espace client
    redirect(`/${locale}/compte`);
  }

  return children;
}
