import { getProducts } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import CartView from "@/components/organisms/CartView";
import CancelHandler from "./CancelHandler";

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const canceledSession =
    typeof sp.session_id === "string" ? sp.session_id : null;

  const products = await getProducts();

  // Solde de points du client connecté (pour proposer la remise fidélité).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let points = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .maybeSingle();
    points = profile?.points ?? 0;
  }

  return (
    <>
      {canceledSession && <CancelHandler sessionId={canceledSession} />}
      <CartView products={products} points={points} loggedIn={!!user} />
    </>
  );
}
