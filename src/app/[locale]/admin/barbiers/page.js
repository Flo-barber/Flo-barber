"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/i18n/Link";
import ArrowLeft from "@/components/atoms/ArrowLeft";
import Toast from "@/components/molecules/Toast";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/I18nProvider";

// Bucket Storage partagé (mêmes policies RLS). Images barbiers sous "barbers/".
const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "products";

const EMPTY = {
  slug: "",
  name: "",
  role_fr: "",
  role_en: "",
  bio_fr: "",
  bio_en: "",
  image: "",
  active: true,
  sort: 0,
};

function rowFromDb(r) {
  return {
    slug: r.slug,
    name: r.name || "",
    role_fr: r.role_fr || "",
    role_en: r.role_en || "",
    bio_fr: r.bio_fr || "",
    bio_en: r.bio_en || "",
    image: r.image || "",
    active: r.active !== false,
    sort: r.sort ?? 0,
  };
}

function toDb(row) {
  return {
    slug: row.slug.trim(),
    name: row.name.trim(),
    role_fr: row.role_fr.trim(),
    role_en: row.role_en.trim(),
    bio_fr: row.bio_fr.trim(),
    bio_en: row.bio_en.trim(),
    image: row.image.trim() || null,
    active: !!row.active,
    sort: parseInt(String(row.sort), 10) || 0,
  };
}

function slugify(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function slugifyFileName(name) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return slugify(base) || "photo";
}

function storagePathFromUrl(url) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length));
}

// Champs d'édition (module-level : évite le remount des inputs à chaque render).
function BarberFields({ t, row, onChange, onImage }) {
  return (
    <div className="ap-grid">
      <label className="ap-field">
        {t("adminBarbers.name")}
        <input value={row.name} onChange={(e) => onChange("name", e.target.value)} />
      </label>
      <label className="ap-field">
        {t("adminBarbers.sort")}
        <input
          type="number"
          value={row.sort}
          onChange={(e) => onChange("sort", e.target.value)}
        />
      </label>
      <label className="ap-field">
        {t("adminBarbers.roleFr")}
        <input value={row.role_fr} onChange={(e) => onChange("role_fr", e.target.value)} />
      </label>
      <label className="ap-field">
        {t("adminBarbers.roleEn")}
        <input value={row.role_en} onChange={(e) => onChange("role_en", e.target.value)} />
      </label>
      <label className="ap-field ap-field-wide">
        {t("adminBarbers.bioFr")}
        <textarea
          rows={2}
          value={row.bio_fr}
          onChange={(e) => onChange("bio_fr", e.target.value)}
        />
      </label>
      <label className="ap-field ap-field-wide">
        {t("adminBarbers.bioEn")}
        <textarea
          rows={2}
          value={row.bio_en}
          onChange={(e) => onChange("bio_en", e.target.value)}
        />
      </label>
      <div className="ap-field ap-field-wide">
        {t("adminBarbers.image")}
        <div className="ap-image">
          {row.image ? (
            <div className="ac-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.image} alt="" />
              <div className="ac-thumb-actions">
                <button
                  type="button"
                  className="ac-thumb-del"
                  onClick={() => onChange("image", "")}
                  aria-label="×"
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <span className="ac-thumb ac-thumb-empty" />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              if (e.target.files?.[0]) onImage(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      <label className="ap-check">
        <input
          type="checkbox"
          checked={row.active}
          onChange={(e) => onChange("active", e.target.checked)}
        />
        {t("adminBarbers.active")}
      </label>
    </div>
  );
}

export default function AdminBarbersPage() {
  const t = useT();
  const supabase = createClient();
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState(EMPTY);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(null);
  const notify = (type, message) => setToast({ type, message });

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("barbers")
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
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
    if (!allowed.includes(ext) || !(file.type || "").startsWith("image/")) {
      notify("error", t("adminBarbers.imageType"));
      return;
    }
    setBusy(`upload:${slug || "new"}`);
    try {
      const path = `barbers/${slug || "barbier"}-${slugifyFileName(file.name)}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
        cacheControl: "3600",
      });
      if (error) {
        notify("error", `${t("adminBarbers.uploadError")} (${error.message})`);
        return;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      apply(data.publicUrl);
      notify("success", t("adminBarbers.imageUploaded"));
    } finally {
      setBusy(null);
    }
  }

  async function save(row, key = "save") {
    if (
      !row.name.trim() ||
      !row.role_fr.trim() ||
      !row.role_en.trim() ||
      !row.bio_fr.trim() ||
      !row.bio_en.trim()
    ) {
      notify("error", t("adminBarbers.required"));
      return false;
    }
    setBusy(key);
    try {
      const { data: existing } = await supabase
        .from("barbers")
        .select("image")
        .eq("slug", row.slug.trim())
        .maybeSingle();

      const next = toDb(row);
      const { error } = await supabase.from("barbers").upsert(next, { onConflict: "slug" });
      if (error) {
        notify("error", error.message);
        return false;
      }
      // Nettoyage : ancienne image du bucket si elle a changé (objets uploadés only).
      const oldPath = storagePathFromUrl(existing?.image);
      if (oldPath && existing.image !== next.image) {
        await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      notify("success", t("adminBarbers.saved"));
      await load();
      return true;
    } finally {
      setBusy(null);
    }
  }

  async function createBarber() {
    if (!draft.name.trim()) {
      notify("error", t("adminBarbers.required"));
      return;
    }
    // Slug généré depuis le nom, avec unicité.
    const base = slugify(draft.name) || "barbier";
    const taken = new Set(rows.map((r) => r.slug));
    let slug = base;
    let n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;

    const ok = await save({ ...draft, slug }, "add");
    if (ok) setDraft(EMPTY);
  }

  async function remove(slug) {
    const b = rows.find((r) => r.slug === slug);
    const name = b?.name || slug;
    if (!window.confirm(t("adminBarbers.deleteConfirm", { name }))) return;
    setBusy(`del:${slug}`);
    try {
      const { error } = await supabase.from("barbers").delete().eq("slug", slug);
      if (error) {
        notify("error", error.message);
        return;
      }
      const path = storagePathFromUrl(b?.image);
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      notify("success", t("adminBarbers.deleted"));
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
            <h1>{t("adminBarbers.title")}</h1>
          </div>
          <Link href="/admin" className="btn btn-outline">
            <ArrowLeft />
            {t("scanner.back")}
          </Link>
        </div>

        <Toast
          type={toast?.type}
          message={toast?.message}
          onClose={() => setToast(null)}
        />

        <div className="admin-products">
          {/* Nouveau barbier */}
          <div className="ap-card ap-new">
            <div className="ap-card-head">
              <strong>{t("adminBarbers.newBarber")}</strong>
            </div>
            <BarberFields
              t={t}
              row={draft}
              onChange={(k, v) => setDraft({ ...draft, [k]: v })}
              onImage={(file) =>
                upload(file, slugify(draft.name), (url) =>
                  setDraft((d) => ({ ...d, image: url }))
                )
              }
            />
            <div className="ap-actions">
              <button
                type="button"
                className={`btn btn-primary ${busy === "add" ? "is-loading" : ""}`}
                onClick={createBarber}
                disabled={!!busy}
              >
                {t("adminBarbers.add")}
              </button>
            </div>
          </div>

          {/* Barbiers existants */}
          {rows.map((row, i) => (
            <div className="ap-card" key={row.slug}>
              <div className="ap-card-head">
                {row.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.image} alt="" className="ap-thumb" />
                ) : (
                  <span className="ap-thumb ap-thumb-empty" />
                )}
                <strong>{row.name}</strong>
              </div>
              <BarberFields
                t={t}
                row={row}
                onChange={(k, v) => setRow(i, k, v)}
                onImage={(file) => upload(file, row.slug, (url) => setRow(i, "image", url))}
              />
              <div className="ap-actions">
                <button
                  type="button"
                  className={`btn btn-primary ${busy === `save:${row.slug}` ? "is-loading" : ""}`}
                  onClick={() => save(row, `save:${row.slug}`)}
                  disabled={!!busy}
                >
                  {t("adminBarbers.save")}
                </button>
                <button
                  type="button"
                  className={`ap-delete ${busy === `del:${row.slug}` ? "is-loading" : ""}`}
                  onClick={() => remove(row.slug)}
                  disabled={!!busy}
                >
                  {t("adminBarbers.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
