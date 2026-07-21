import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Espace salon",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/compte/connexion?redirect=/admin");
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    // Connecté mais pas administrateur → renvoyé vers l'espace client
    redirect("/compte");
  }

  return children;
}
