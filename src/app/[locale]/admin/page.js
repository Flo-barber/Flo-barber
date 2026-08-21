import Link from "@/i18n/Link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/atoms/LogoutButton";
import { getT } from "@/i18n/dictionaries";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminPage({ params, searchParams }) {
  const { locale } = await params;
  const sp = (await searchParams) || {};
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, parseInt(sp.page, 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const t = getT(locale);
  const supabase = createClient();

  // Stats globales (non filtrées) : count optimisé + somme des points.
  const { count: totalClients } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
  const { data: ptsRows } = await supabase.from("profiles").select("points");
  const totalPoints = (ptsRows || []).reduce((s, r) => s + (r.points || 0), 0);

  // Liste paginée + recherche par nom (ilike = valeur paramétrée, sûre).
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, points", { count: "exact" })
    .order("points", { ascending: false });
  if (q) query = query.ilike("full_name", `%${q}%`);
  const { data: clients, count: filteredCount } = await query.range(from, to);

  const list = clients || [];
  const totalPages = Math.max(1, Math.ceil((filteredCount || 0) / PAGE_SIZE));

  // Construit une URL /admin en conservant la recherche.
  const pageHref = (p) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin${s ? `?${s}` : ""}`;
  };

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
            <Link href="/admin/coupes" className="btn btn-outline">
              {t("admin.cuts")}
            </Link>
            <Link href="/admin/barbiers" className="btn btn-outline">
              {t("admin.barbers")}
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat-value gold-text">{totalClients || 0}</span>
            <span className="admin-stat-label">{t("admin.statClients")}</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-value gold-text">{totalPoints}</span>
            <span className="admin-stat-label">{t("admin.statPoints")}</span>
          </div>
        </div>

        {/* Recherche par nom (formulaire GET → conserve le préfixe de locale) */}
        <form className="admin-search" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("admin.searchPlaceholder")}
            aria-label={t("admin.searchPlaceholder")}
          />
          <button type="submit" className="btn btn-outline">
            {t("admin.searchBtn")}
          </button>
          {q && (
            <Link href="/admin" className="btn btn-outline">
              {t("admin.searchReset")}
            </Link>
          )}
        </form>

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
                    {q ? t("admin.noResults") : t("admin.empty")}
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        href={`/admin/scanner?client=${c.id}`}
                        className="admin-client-link"
                        title={t("admin.manageClient")}
                      >
                        {c.full_name || "—"}
                      </Link>
                    </td>
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

        {totalPages > 1 && (
          <div className="admin-pagination">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="btn btn-outline">
                {t("admin.prev")}
              </Link>
            ) : (
              <span className="btn btn-outline is-disabled">{t("admin.prev")}</span>
            )}
            <span className="admin-pagination-info">
              {t("admin.pageOf", { page, total: totalPages })}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="btn btn-outline">
                {t("admin.next")}
              </Link>
            ) : (
              <span className="btn btn-outline is-disabled">{t("admin.next")}</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
