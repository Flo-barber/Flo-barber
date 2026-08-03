import Link from "@/i18n/Link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/atoms/LogoutButton";
import { getT } from "@/i18n/dictionaries";

export default async function AdminPage({ params }) {
  const { locale } = await params;
  const t = getT(locale);
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
            <p className="admin-eyebrow gold-text">{t("admin.eyebrow")}</p>
            <h1>{t("admin.title")}</h1>
          </div>
          <div className="admin-head-actions">
            <Link href="/admin/scanner" className="btn btn-primary">
              {t("admin.scanClient")}
            </Link>
            <Link href="/admin/produits" className="btn btn-outline">
              {t("admin.products")}
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat-value gold-text">{list.length}</span>
            <span className="admin-stat-label">{t("admin.statClients")}</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value gold-text">{totalPoints}</span>
            <span className="admin-stat-label">{t("admin.statPoints")}</span>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.thClient")}</th>
                <th>{t("admin.thEmail")}</th>
                <th>{t("admin.thPhone")}</th>
                <th className="ta-right">{t("admin.thPoints")}</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    {t("admin.empty")}
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
