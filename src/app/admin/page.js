import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/atoms/LogoutButton";

export default async function AdminPage() {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, points")
    .order("points", { ascending: false });

  const list = clients || [];
  const totalPoints = list.reduce((s, c) => s + (c.points || 0), 0);

  return (
    <section className="admin">
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="admin-eyebrow gold-text">Espace salon</p>
            <h1>Tableau de bord fidélité</h1>
          </div>
          <div className="admin-head-actions">
            <Link href="/admin/scanner" className="btn btn-primary">
              Scanner un client
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat-value gold-text">{list.length}</span>
            <span className="admin-stat-label">Clients</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value gold-text">{totalPoints}</span>
            <span className="admin-stat-label">Points distribués</span>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th className="ta-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    Aucun client inscrit pour l'instant.
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name || "—"}</td>
                    <td>{c.email || "—"}</td>
                    <td>{c.phone || "—"}</td>
                    <td className="ta-right">
                      <strong className="gold-text">{c.points}</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
