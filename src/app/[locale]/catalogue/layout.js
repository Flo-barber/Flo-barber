import { redirect } from "next/navigation";
import { getPageFlags } from "@/lib/pageSettings";

// Page désactivable depuis l'admin : désactivée → redirection vers l'accueil
// (toutes les sous-pages).
export default async function CatalogueLayout({ children, params }) {
  const { locale } = await params;
  const { catalogue } = await getPageFlags();
  if (!catalogue) redirect(`/${locale}`);
  return children;
}
