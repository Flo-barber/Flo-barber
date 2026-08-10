"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/i18n/Link";
import { createClient } from "@/lib/supabase/client";
import Toast from "@/components/molecules/Toast";
import { useI18n, useT } from "@/i18n/I18nProvider";

// Bucket Storage partagé avec les produits (mêmes policies RLS). Les images de
// coupes sont rangées sous le préfixe "cuts/".
const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "products";

const EMPTY = {
  slug: "",
  title_fr: "",
  title_en: "",
  description_fr: "",
  description_en: "",
  images: [],
  products: [],
  active: true,
  sort: 0,
};

function rowFromDb(r) {
  return {
    slug: r.slug,
    title_fr: r.title_fr || "",
    title_en: r.title_en || "",
    description_fr: r.description_fr || "",
    description_en: r.description_en || "",
    images: Array.isArray(r.images) ? r.images : [],
    products: Array.isArray(r.products) ? r.products : [],
    active: r.active !== false,
    sort: r.sort ?? 0,
  };
}

function toDb(row) {
  return {
    slug: row.slug.trim(),
    title_fr: row.title_fr.trim(),
    title_en: row.title_en.trim(),
    description_fr: row.description_fr.trim(),
    description_en: row.description_en.trim(),
    images: row.images,
    products: row.products,
    active: !!row.active,
    sort: parseInt(String(row.sort), 10) || 0,
  };
}

// Nettoie le nom d'un fichier (minuscules, sans accents ni espaces).
function slugifyFileName(name) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return (
    base
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "image"
  );
}

// Génère un slug à partir d'un texte (titre) : minuscules, sans accents ni espaces.
function slugify(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Chemin d'un objet Storage à partir de son URL publique (null si l'image n'est
// pas un fichier de notre bucket — ex. chemin statique /catalogue/…).
function storagePathFromUrl(url) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length));
}

// Galerie multi-photos d'une coupe (module-level : évite le remount des inputs).
function Gallery({ t, images, onUpload, onRemove, onMove }) {
  return (
    <div className="ac-gallery">
      <div className="ac-thumbs">
        {images.map((url, i) => (
          <div className="ac-thumb" key={url + i}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" />
            <div className="ac-thumb-actions">
              <button
                type="button"
                onClick={() => onMove(i, -1)}
                disabled={i === 0}
                aria-label="↑"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMove(i, 1)}
                disabled={i === images.length - 1}
                aria-label="↓"
              >
                ↓
              </button>
              <button
                type="button"
                className="ac-thumb-del"
                onClick={() => onRemove(i)}
                aria-label="×"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <span className="ac-thumb ac-thumb-empty" />
        )}
      </div>
      <label className="ap-field">
        {t("adminCuts.addPhoto")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files?.[0]) onUpload(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

// Sélection des produits liés (cases à cocher depuis la base).
function ProductPicker({ t, locale, allProducts, selected, onToggle }) {
  return (
    <div className="ac-products">
      <span className="ap-field-label">{t("adminCuts.linkedProducts")}</span>
      <div className="ac-products-grid">
        {allProducts.map((p) => (
          <label className="ac-product" key={p.slug}>
            <input
              type="checkbox"
              checked={selected.includes(p.slug)}
              onChange={() => onToggle(p.slug)}
            />
            {p.name[locale] || p.name.fr}
          </label>
        ))}
        {allProducts.length === 0 && (
          <span className="ac-products-empty">{t("adminCuts.noProducts")}</span>
        )}
      </div>
    </div>
  );
}

function CutFields({ t, row, onChange }) {
  return (
    <div className="ap-grid">
      <label className="ap-field">
        {t("adminCuts.titleFr")}
        <input value={row.title_fr} onChange={(e) => onChange("title_fr", e.target.value)} />
      </label>
      <label className="ap-field">
        {t("adminCuts.titleEn")}
        <input value={row.title_en} onChange={(e) => onChange("title_en", e.target.value)} />
      </label>
      <label className="ap-field ap-field-wide">
        {t("adminCuts.descFr")}
        <textarea
          rows={2}
          value={row.description_fr}
          onChange={(e) => onChange("description_fr", e.target.value)}
        />
      </label>
      <label className="ap-field ap-field-wide">
        {t("adminCuts.descEn")}
        <textarea
          rows={2}
          value={row.description_en}
          onChange={(e) => onChange("description_en", e.target.value)}
        />
      </label>
      <label className="ap-field">
        {t("adminCuts.sort")}
        <input
          type="number"
          value={row.sort}
          onChange={(e) => onChange("sort", e.target.value)}
        />
      </label>
      <label className="ap-check">
        <input
          type="checkbox"
          checked={row.active}
          onChange={(e) => onChange("active", e.target.checked)}
        />
        {t("adminCuts.active")}
      </label>
    </div>
  );
}

export default function AdminCutsPage() {
  const t = useT();
  const { locale } = useI18n();
  const supabase = createClient();
  const [rows, setRows] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(null); // clé de l'action en cours
  const notify = (type, message) => setToast({ type, message });

  // Charge la liste des produits liables (indépendamment des coupes, pour pouvoir
  // la rafraîchir sans écraser une édition de coupe en cours).
  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("slug, name_fr, name_en")
      .order("sort", { ascending: true });
    setAllProducts(
      (data || []).map((p) => ({
        slug: p.slug,
        name: { fr: p.name_fr, en: p.name_en },
      }))
    );
  }, [supabase]);

  const load = useCallback(async () => {
    const { data: cutsData } = await supabase
      .from("cuts")
      .select("*")
      .order("sort", { ascending: true });
    setRows((cutsData || []).map(rowFromDb));
    await loadProducts();
  }, [supabase, loadProducts]);

  useEffect(() => {
    load();
  }, [load]);

  // Rafraîchit la SEULE liste des produits liables au retour sur l'onglet : les
  // produits créés entre-temps apparaissent dans le sélecteur, sans toucher aux
  // coupes en cours d'édition.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") loadProducts();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadProducts]);

  function setRow(i, key, val) {
    setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }

  async function upload(file, slug, apply) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
    if (!allowed.includes(ext) || !(file.type || "").startsWith("image/")) {
      notify("error", t("adminCuts.imageType"));
      return;
    }
    setBusy(`upload:${slug || "new"}`);
    try {
      const path = `cuts/${slug || "coupe"}-${slugifyFileName(file.name)}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
        cacheControl: "3600",
      });
      if (error) {
        notify("error", `${t("adminCuts.uploadError")} (${error.message})`);
        return;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      apply(data.publicUrl);
      notify("success", t("adminCuts.imageUploaded"));
    } finally {
      setBusy(null);
    }
  }

  function moveInArray(arr, i, dir) {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const copy = arr.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  }

  async function save(row, key = "save") {
    // Tous les champs sont obligatoires : titres + descriptions FR/EN, au moins
    // une photo et au moins un produit lié.
    if (
      !row.title_fr.trim() ||
      !row.title_en.trim() ||
      !row.description_fr.trim() ||
      !row.description_en.trim()
    ) {
      notify("error", t("adminCuts.required"));
      return false;
    }
    if (!row.images || row.images.length === 0) {
      notify("error", t("adminCuts.needImage"));
      return false;
    }
    setBusy(key);
    try {
      // Images actuellement en base (pour supprimer celles retirées).
      const { data: existing } = await supabase
        .from("cuts")
        .select("images")
        .eq("slug", row.slug.trim())
        .maybeSingle();
      const oldImages = Array.isArray(existing?.images) ? existing.images : [];

      const next = toDb(row);
      const { error } = await supabase.from("cuts").upsert(next, { onConflict: "slug" });
      if (error) {
        notify("error", error.message);
        return false;
      }
      // Nettoyage : retirer du bucket les images enlevées (objets uploadés uniquement).
      const removed = oldImages.filter((u) => !next.images.includes(u));
      const paths = removed.map(storagePathFromUrl).filter(Boolean);
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);

      notify("success", t("adminCuts.saved"));
      await load();
      return true;
    } finally {
      setBusy(null);
    }
  }

  async function createCut() {
    if (!draft.title_fr.trim() || !draft.title_en.trim()) {
      notify("error", t("adminCuts.required"));
      return;
    }
    // Slug généré automatiquement à partir du titre FR, avec unicité garantie.
    const base = slugify(draft.title_fr) || "coupe";
    const taken = new Set(rows.map((r) => r.slug));
    let slug = base;
    let n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;

    const ok = await save({ ...draft, slug }, "add");
    if (ok) setDraft(EMPTY);
  }

  async function remove(slug) {
    const cut = rows.find((r) => r.slug === slug);
    const title = cut?.title_fr || slug;
    if (!window.confirm(t("adminCuts.deleteConfirm", { title }))) return;
    setBusy(`del:${slug}`);
    try {
      const { error } = await supabase.from("cuts").delete().eq("slug", slug);
      if (error) {
        notify("error", error.message);
        return;
      }
      const paths = (cut?.images || []).map(storagePathFromUrl).filter(Boolean);
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      notify("success", t("adminCuts.deleted"));
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="admin">
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="admin-eyebrow gold-text">{t("admin.eyebrow")}</p>
            <h1>{t("adminCuts.title")}</h1>
          </div>
          <Link href="/admin" className="btn btn-outline">
            {t("scanner.back")}
          </Link>
        </div>

        <Toast
          type={toast?.type}
          message={toast?.message}
          onClose={() => setToast(null)}
        />

        <div className="admin-products">
          {/* Nouvelle coupe */}
          <div className="ap-card ap-new">
            <div className="ap-card-head">
              <strong>{t("adminCuts.newCut")}</strong>
            </div>
            <CutFields
              t={t}
              row={draft}
              onChange={(k, v) => setDraft({ ...draft, [k]: v })}
            />
            <Gallery
              t={t}
              images={draft.images}
              onUpload={(file) =>
                upload(file, draft.slug, (url) =>
                  setDraft((d) => ({ ...d, images: [...d.images, url] }))
                )
              }
              onRemove={(i) =>
                setDraft((d) => ({ ...d, images: d.images.filter((_, idx) => idx !== i) }))
              }
              onMove={(i, dir) =>
                setDraft((d) => ({ ...d, images: moveInArray(d.images, i, dir) }))
              }
            />
            <ProductPicker
              t={t}
              locale={locale}
              allProducts={allProducts}
              selected={draft.products}
              onToggle={(slug) =>
                setDraft((d) => ({
                  ...d,
                  products: d.products.includes(slug)
                    ? d.products.filter((s) => s !== slug)
                    : [...d.products, slug],
                }))
              }
            />
            <div className="ap-actions">
              <button
                type="button"
                className={`btn btn-primary ${busy === "add" ? "is-loading" : ""}`}
                onClick={createCut}
                disabled={!!busy}
              >
                {t("adminCuts.add")}
              </button>
            </div>
          </div>

          {/* Coupes existantes */}
          {rows.map((row, i) => (
            <div className="ap-card" key={row.slug}>
              <div className="ap-card-head">
                {row.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.images[0]} alt="" className="ap-thumb" />
                ) : (
                  <span className="ap-thumb ap-thumb-empty" />
                )}
                <strong>{row.slug}</strong>
              </div>
              <CutFields t={t} row={row} onChange={(k, v) => setRow(i, k, v)} />
              <Gallery
                t={t}
                images={row.images}
                onUpload={(file) =>
                  upload(file, row.slug, (url) =>
                    setRow(i, "images", [...row.images, url])
                  )
                }
                onRemove={(idx) =>
                  setRow(i, "images", row.images.filter((_, k) => k !== idx))
                }
                onMove={(idx, dir) => setRow(i, "images", moveInArray(row.images, idx, dir))}
              />
              <ProductPicker
                t={t}
                locale={locale}
                allProducts={allProducts}
                selected={row.products}
                onToggle={(slug) =>
                  setRow(
                    i,
                    "products",
                    row.products.includes(slug)
                      ? row.products.filter((s) => s !== slug)
                      : [...row.products, slug]
                  )
                }
              />
              <div className="ap-actions">
                <button
                  type="button"
                  className={`btn btn-primary ${busy === `save:${row.slug}` ? "is-loading" : ""}`}
                  onClick={() => save(row, `save:${row.slug}`)}
                  disabled={!!busy}
                >
                  {t("adminCuts.save")}
                </button>
                <button
                  type="button"
                  className={`ap-delete ${busy === `del:${row.slug}` ? "is-loading" : ""}`}
                  onClick={() => remove(row.slug)}
                  disabled={!!busy}
                >
                  {t("adminCuts.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
