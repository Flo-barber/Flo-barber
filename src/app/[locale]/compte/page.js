import { redirect } from "next/navigation";
import Link from "@/i18n/Link";
import { createClient } from "@/lib/supabase/server";
import LoyaltyCard from "@/components/molecules/LoyaltyCard";
import ProfileForm from "@/components/molecules/ProfileForm";
import DeleteAccountButton from "@/components/molecules/DeleteAccountButton";
import LogoutButton from "@/components/atoms/LogoutButton";
import { isConfigured as walletConfigured } from "@/lib/googleWallet";
import { formatEuro, pointsToCents } from "@/lib/format";
import { getProductsBySlugs } from "@/lib/products";
import { getT } from "@/i18n/dictionaries";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: getT(locale)("meta.accountTitle"),
    robots: { index: false, follow: false },
  };
}

function formatDate(d, locale) {
  return new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ComptePage({ params }) {
  const { locale } = await params;
  const t = getT(locale);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Pas de paramètre ?redirect : la connexion renvoie déjà par défaut vers
    // /compte, donc l'URL reste propre (/compte/connexion).
    redirect(`/${locale}/compte/connexion`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email, points")
    .eq("id", user.id)
    .single();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, amount_eur, points, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, amount_eur, items, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Noms des produits commandés (pour le détail de chaque commande).
  const orderSlugs = [
    ...new Set(
      (orders || []).flatMap((o) =>
        Array.isArray(o.items) ? o.items.map((it) => it.slug) : []
      )
    ),
  ];
  const orderProducts = orderSlugs.length
    ? await getProductsBySlugs(orderSlugs)
    : {};

  // Statut admin (RLS `admins_select_self` : chacun peut lire sa propre ligne).
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const isAdmin = !!adminRow;

  const points = profile?.points ?? 0;

  return (
    <section className="account">
      <div className="container">
        <div className="account-head">
          <div>
            <p className="account-eyebrow gold-text">{t("account.eyebrow")}</p>
            <h1>
              {t("account.hello")} {profile?.full_name || ""}
            </h1>
          </div>
          <div className="account-actions">
            {isAdmin && (
              <Link href="/admin" className="btn btn-outline">
                {t("account.adminSection")}
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        <div className="account-grid">
          <div className="account-main">
            <div className="points-box">
              <span className="points-label">{t("account.pointsLabel")}</span>
              <span className="points-value gold-text">{points}</span>
              <span className="points-euros">
                {t("account.pointsValue", {
                  value: formatEuro(pointsToCents(points), locale),
                })}
              </span>
              <span className="points-note">{t("account.pointsNote")}</span>
            </div>

            <ProfileForm
              userId={user.id}
              initialName={profile?.full_name}
              initialPhone={profile?.phone}
              email={profile?.email || user.email}
            />

            <div className="account-history">
              <h2>{t("account.historyTitle")}</h2>
              {transactions && transactions.length > 0 ? (
                <ul>
                  {transactions.map((tx) => (
                    <li key={tx.id}>
                      <span>{formatDate(tx.created_at, locale)}</span>
                      <span>{Number(tx.amount_eur).toFixed(2)} €</span>
                      <strong className="gold-text">
                        {tx.points >= 0 ? "+" : ""}
                        {tx.points} {t("account.pts")}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="account-empty">{t("account.historyEmpty")}</p>
              )}
            </div>

            <div className="account-orders" id="commandes">
              <h2>{t("account.ordersTitle")}</h2>
              {orders && orders.length > 0 ? (
                <ul>
                  {orders.map((o) => {
                    const items = Array.isArray(o.items) ? o.items : [];
                    const count = items.reduce(
                      (s, it) => s + (parseInt(it.qty, 10) || 1),
                      0
                    );
                    return (
                      <li key={o.id}>
                        <details className="account-order">
                          <summary>
                            <span>{formatDate(o.created_at, locale)}</span>
                            <span>
                              {count} {t("account.items")}
                            </span>
                            <strong>{Number(o.amount_eur).toFixed(2)} €</strong>
                            <svg
                              className="account-order-chevron"
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </summary>
                          <ul className="account-order-items">
                            {items.length > 0 ? (
                              items.map((it, k) => {
                                const qty = parseInt(it.qty, 10) || 1;
                                // Nom figé au moment de l'achat, sinon repli sur
                                // le produit actuel, sinon l'identifiant.
                                const snapName =
                                  locale === "en" ? it.name_en : it.name_fr;
                                const name =
                                  snapName ||
                                  orderProducts[it.slug]?.name?.[locale] ||
                                  it.slug;
                                const unit =
                                  it.price_cents != null
                                    ? it.price_cents
                                    : orderProducts[it.slug]?.priceCents;
                                return (
                                  <li key={k}>
                                    <span>
                                      {qty} × {name}
                                    </span>
                                    {unit != null && (
                                      <span>{formatEuro(unit, locale)}</span>
                                    )}
                                  </li>
                                );
                              })
                            ) : (
                              <li>—</li>
                            )}
                          </ul>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="account-empty">{t("account.ordersEmpty")}</p>
              )}
            </div>

            <DeleteAccountButton />
          </div>

          <aside className="account-side">
            <LoyaltyCard
              clientId={user.id}
              name={profile?.full_name}
              points={points}
              walletEnabled={walletConfigured()}
            />
          </aside>
        </div>
      </div>
    </section>
  );
}
