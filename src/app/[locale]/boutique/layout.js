import { redirect } from "next/navigation";
import { getPageFlags } from "@/lib/pageSettings";

// Page désactivable depuis l'admin : désactivée → redirection vers l'accueil
// (toutes les sous-pages).
export default async function ShopLayout({ children, params }) {
  const { locale } = await params;
  const { boutique } = await getPageFlags();
  if (!boutique) redirect(`/${locale}`);
  return children;
}
