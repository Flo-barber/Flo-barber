"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/i18n/Link";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/I18nProvider";

const EMPTY = {
  slug: "",
  name_fr: "",
  name_en: "",
  tagline_fr: "",
  tagline_en: "",
  priceEuros: "",
  stock: "",
  image: "",
  active: true,
};

function rowFromDb(r) {
  return {
    slug: r.slug,
    name_fr: r.name_fr || "",
    name_en: r.name_en || "",
    tagline_fr: r.tagline_fr || "",
    tagline_en: r.tagline_en || "",
    priceEuros: ((r.price_cents || 0) / 100).toFixed(2).replace(".", ","),
    stock: r.stock == null ? "" : String(r.stock),
    image: r.image || "",
    active: r.active !== false,
  };
}

function toDb(row) {
  const cents = Math.round(
    (parseFloat(String(row.priceEuros).replace(",", ".")) || 0) * 100
  );
  return {
    slug: row.slug.trim(),
    name_fr: row.name_fr.trim(),
    name_en: row.name_en.trim(),
    tagline_fr: row.tagline_fr.trim(),
    tagline_en: row.tagline_en.trim(),
    price_cents: cents,
    stock: Math.max(0, parseInt(String(row.stock), 10) || 0),
    image: row.image.trim(),
    active: !!row.active,
  };
}

// Nom du bucket Storage (par défaut "products", surchargeable via l'env).
const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "products";

// Nettoie le nom d'un fichier pour en faire un nom d'objet Storage sûr :
// minuscules, sans accents ni espaces. Ex : "Mon Huile.JPG" → "mon-huile".
function slugifyFileName(name) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return (
    base
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // enlève les accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "image"
  );
}

// Retrouve le chemin d'un objet Storage à partir de son URL publique.
// Renvoie null si l'image n'est PAS un fichier de notre bucket (ex. un chemin
// statique du seed "/catalogue/products/…"), pour ne jamais tenter de supprimer
// autre chose qu'une image réellement uploadée dans le bucket.
function storagePathFromUrl(url) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length));
}

// Champs d'édition d'un produit. Défini AU NIVEAU MODULE (et non dans le
// composant parent) : sinon React le recrée à chaque render, ce qui démonte /
// remonte le sous-arbre et réinitialise l'<input type="file"> (le libellé
// repassait à « aucun fichier choisi » après sélection).
function ProductFields({ t, row, onChange, onImage }) {
  return (
    <div className="ap-grid">
      <label className="ap-field">
        {t("adminProducts.nameFr")}
        <input value={row.name_fr} onChange={(e) => onChange("name_fr", e.target.value)} />
      </label>
      <label className="ap-field">
        {t("adminProducts.nameEn")}
        <input value={row.name_en} onChange={(e) => onChange("name_en", e.target.value)} />
      </label>
      <label className="ap-field">
        {t("adminProducts.taglineFr")}
        <input value={row.tagline_fr} onChange={(e) => onChange("tagline_fr", e.target.value)} />
      </label>
      <label className="ap-field">
        {t("adminProducts.taglineEn")}
        <input value={row.tagline_en} onChange={(e) => onChange("tagline_en", e.target.value)} />
      </label>
      <label className="ap-field">
        {t("adminProducts.price")}
        <input value={row.priceEuros} onChange={(e) => onChange("priceEuros", e.target.value)} placeholder="16,90" />
      </label>
      <label className="ap-field">
        {t("adminProducts.stock")}
        <input type="number" min="0" value={row.stock} onChange={(e) => onChange("stock", e.target.value)} placeholder="50" />
      </label>
      <label className="ap-field ap-field-wide">
        {t("adminProducts.image")}
        <input value={row.image} readOnly placeholder={t("adminProducts.imagePlaceholder")} />
      </label>
      <label className="ap-field">
        {t("adminProducts.upload")}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])} />
      </label>
      <label className="ap-check">
        <input type="checkbox" checked={row.active} onChange={(e) => onChange("active", e.target.checked)} />
        {t("adminProducts.active")}
      </label>
    </div>
  );
}

export default function AdminProductsPage() {
  const t = useT();
  const supabase = createClient();
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("sort", { ascending: true });
    setRows((data || []).map(rowFromDb));
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  function setRow(i, key, val) {
    setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }

  async function upload(file, slug, apply) {
    setErr(null);
    setMsg(null);
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
    // HEIC/HEIF (photos iPhone) ne s'affichent pas dans un navigateur → on refuse.
    if (!allowed.includes(ext) || !(file.type || "").startsWith("image/")) {
      setErr(t("adminProducts.imageType"));
      return;
    }
    // Le fichier stocké reprend le nom de l'image (nettoyé) + suffixe unique.
    const path = `${slugifyFileName(file.name)}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
        cacheControl: "3600",
      });
    if (error) {
      setErr(`${t("adminProducts.uploadError")} (${error.message})`);
      return;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    apply(data.publicUrl);
    setMsg(t("adminProducts.imageUploaded"));
  }

  async function save(row) {
    setMsg(null);
    setErr(null);
    // Tous les champs sont obligatoires (prix > 0, stock renseigné, image présente).
    const priceNum = parseFloat(String(row.priceEuros).replace(",", "."));
    if (
      !row.slug.trim() ||
      !row.name_fr.trim() ||
      !row.name_en.trim() ||
      !row.tagline_fr.trim() ||
      !row.tagline_en.trim() ||
      !(priceNum > 0) ||
      String(row.stock).trim() === "" ||
      !row.image.trim()
    ) {
      setErr(t("adminProducts.required"));
      return;
    }
    // Image actuellement enregistrée en base (pour la supprimer si elle change).
    const { data: existing } = await supabase
      .from("products")
      .select("image")
      .eq("slug", row.slug.trim())
      .maybeSingle();

    const next = toDb(row);
    const { error } = await supabase
      .from("products")
      .upsert(next, { onConflict: "slug" });
    if (error) {
      setErr(error.message);
      return;
    }
    // Nettoyage : si l'image a changé, retirer l'ancienne du bucket
    // (seulement si c'était bien un fichier uploadé, pas un chemin statique).
    const oldPath = storagePathFromUrl(existing?.image);
    if (oldPath && existing.image !== next.image) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
    }
    setMsg(t("adminProducts.saved"));
    await load();
  }

  async function createProduct() {
    await save(draft);
    if (!err) setDraft(EMPTY);
  }

  async function remove(slug) {
    if (!window.confirm(t("adminProducts.deleteConfirm"))) return;
    const img = rows.find((r) => r.slug === slug)?.image;
    await supabase.from("products").delete().eq("slug", slug);
    // Supprimer aussi son image du bucket (si c'était un fichier uploadé).
    const path = storagePathFromUrl(img);
    if (path) await supabase.storage.from(BUCKET).remove([path]);
    await load();
  }

  return (
    <section className="admin">
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="admin-eyebrow gold-text">{t("admin.eyebrow")}</p>
            <h1>{t("adminProducts.title")}</h1>
          </div>
          <Link href="/admin" className="btn btn-outline">
            {t("scanner.back")}
          </Link>
        </div>

        {msg && <p className="auth-info">{msg}</p>}
        {err && <p className="auth-error">{err}</p>}

        <div className="admin-products">
          {/* Nouveau produit */}
          <div className="ap-card ap-new">
            <div className="ap-card-head">
              <strong>{t("adminProducts.newProduct")}</strong>
            </div>
            <label className="ap-field">
              {t("adminProducts.slug")}
              <input
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                placeholder="pommade-mate"
              />
            </label>
            <ProductFields
              t={t}
              row={draft}
              onChange={(k, v) => setDraft({ ...draft, [k]: v })}
              onImage={(file) =>
                upload(file, draft.slug, (url) =>
                  setDraft((d) => ({ ...d, image: url }))
                )
              }
            />
            <div className="ap-actions">
              <button type="button" className="btn btn-primary" onClick={createProduct}>
                {t("adminProducts.add")}
              </button>
            </div>
          </div>

          {/* Produits existants */}
          {rows.map((row, i) => (
            <div className="ap-card" key={row.slug}>
              <div className="ap-card-head">
                {row.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image} alt="" className="ap-thumb" />
                ) : (
                  <span className="ap-thumb ap-thumb-empty" />
                )}
                <strong>{row.slug}</strong>
              </div>
              <ProductFields
                t={t}
                row={row}
                onChange={(k, v) => setRow(i, k, v)}
                onImage={(file) => upload(file, row.slug, (url) => setRow(i, "image", url))}
              />
              <div className="ap-actions">
                <button type="button" className="btn btn-primary" onClick={() => save(row)}>
                  {t("adminProducts.save")}
                </button>
                <button type="button" className="ap-delete" onClick={() => remove(row.slug)}>
                  {t("adminProducts.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
