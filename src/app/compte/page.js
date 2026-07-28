import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoyaltyCard from "@/components/molecules/LoyaltyCard";
import LogoutButton from "@/components/atoms/LogoutButton";
import { isConfigured as walletConfigured } from "@/lib/googleWallet";

export const metadata = {
  title: "Mon compte fidélité",
  robots: { index: false, follow: false },
};

function formatDate(d) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function ComptePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/compte/connexion?redirect=/compte");
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

  const points = profile?.points ?? 0;

  return (
    <section className="account">
      <div className="container">
        <div className="account-head">
          <div>
            <p className="account-eyebrow gold-text">Programme de fidélité</p>
            <h1>Bonjour {profile?.full_name || ""}</h1>
          </div>
          <LogoutButton />
        </div>

        <div className="account-grid">
          <div className="account-main">
            <div className="points-box">
              <span className="points-label">Vos points</span>
              <span className="points-value gold-text">{points}</span>
              <span className="points-note">1 € dépensé = 1 point</span>
            </div>

            <div className="account-info">
              <h2>Mes informations</h2>
              <ul>
                <li>
                  <span>Nom</span>
                  <strong>{profile?.full_name || "—"}</strong>
                </li>
                <li>
                  <span>Email</span>
                  <strong>{profile?.email || user.email}</strong>
                </li>
                <li>
                  <span>Téléphone</span>
                  <strong>{profile?.phone || "—"}</strong>
                </li>
              </ul>
            </div>

            <div className="account-history">
              <h2>Historique</h2>
              {transactions && transactions.length > 0 ? (
                <ul>
                  {transactions.map((t) => (
                    <li key={t.id}>
                      <span>{formatDate(t.created_at)}</span>
                      <span>{Number(t.amount_eur).toFixed(2)} €</span>
                      <strong className="gold-text">+{t.points} pts</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="account-empty">
                  Aucun point pour l'instant. Votre premier passage au salon les
                  ajoutera ici.
                </p>
              )}
            </div>
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
