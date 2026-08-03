import { redirect } from "next/navigation";
import Link from "@/i18n/Link";
import { createClient } from "@/lib/supabase/server";
import LoyaltyCard from "@/components/molecules/LoyaltyCard";
import ProfileForm from "@/components/molecules/ProfileForm";
import DeleteAccountButton from "@/components/molecules/DeleteAccountButton";
import LogoutButton from "@/components/atoms/LogoutButton";
import { isConfigured as walletConfigured } from "@/lib/googleWallet";
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
    redirect(`/${locale}/compte/connexion?redirect=/${locale}/compte`);
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
                      <strong className="gold-text">+{tx.points} {t("account.pts")}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="account-empty">{t("account.historyEmpty")}</p>
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
