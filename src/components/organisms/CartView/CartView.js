"use client";

import { useState } from "react";
import Link from "@/i18n/Link";
import { useCart } from "@/cart/CartProvider";
import { useI18n, useT } from "@/i18n/I18nProvider";
import {
  formatEuro,
  SHIPPING_CENTS,
  POINT_MIN_REDEEM,
  pointsToCents,
  maxRedeemablePoints,
} from "@/lib/format";
import { createCheckoutSession } from "@/lib/shopActions";

// Vue panier (client). Reçoit les produits (depuis la base) pour l'affichage ;
// les prix (et la remise en points) sont de toute façon revalidés côté serveur.
export default function CartView({ products, points = 0, loggedIn = false }) {
  const { items, setQty, remove, ready } = useCart();
  const { locale } = useI18n();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [usePoints, setUsePoints] = useState(false);
  const [ptsInput, setPtsInput] = useState("");

  const bySlug = Object.fromEntries((products || []).map((p) => [p.slug, p]));
  const rows = items
    .map((i) => ({ ...i, product: bySlug[i.slug] }))
    .filter((r) => r.product);
  const subtotalCents = rows.reduce(
    (s, r) => s + r.product.priceCents * r.qty,
    0
  );
  const totalBeforeCents = subtotalCents + SHIPPING_CENTS;
  const fmt = (cents) => formatEuro(cents, locale);

  // Points utilisables : à partir de 100, plafonnés par le solde et par ce qui
  // laisse au moins 0,50 € à payer.
  const maxUsable = Math.min(points, maxRedeemablePoints(totalBeforeCents));
  const canUsePoints = loggedIn && maxUsable >= POINT_MIN_REDEEM;

  const requested = Math.max(0, Math.floor(Number(ptsInput) || 0));
  const effectivePoints =
    usePoints && canUsePoints
      ? Math.min(Math.max(requested, 0), maxUsable) >= POINT_MIN_REDEEM
        ? Math.min(requested, maxUsable)
        : 0
      : 0;
  const discountCents = pointsToCents(effectivePoints);
  const totalCents = Math.max(0, totalBeforeCents - discountCents);

  async function pay() {
    setBusy(true);
    setErr(null);
    const res = await createCheckoutSession(
      items.map(({ slug, qty }) => ({ slug, qty })),
      locale,
      effectivePoints
    );
    if (res?.url) {
      window.location.href = res.url;
      return;
    }
    setBusy(false);
    setErr(
      res?.error === "not_configured"
        ? t("shop.notConfigured")
        : res?.error === "stock"
          ? t("shop.stockError")
          : res?.error === "empty"
            ? t("shop.emptyCart")
            : res?.error === "points"
              ? t("shop.pointsError")
              : t("shop.checkoutError")
    );
  }

  if (!ready)
    return (
      <section className="section">
        <div className="container" />
      </section>
    );

  return (
    <section className="section">
      <div className="container cart">
        <h1 className="section-title">{t("shop.cart")}</h1>

        {rows.length === 0 ? (
          <div className="cart-empty">
            <p>{t("shop.emptyCart")}</p>
            <Link href="/boutique" className="btn btn-primary">
              {t("shop.continueShopping")}
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <ul className="cart-items">
              {rows.map((r) => (
                <li key={r.slug} className="cart-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.product.image}
                    alt=""
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <span className="cart-item-name">
                      {r.product.name[locale]}
                    </span>
                    <span className="cart-item-price">
                      {fmt(r.product.priceCents)}
                    </span>
                  </div>
                  <div className="cart-qty">
                    <button
                      type="button"
                      onClick={() => setQty(r.slug, r.qty - 1)}
                      aria-label="-"
                    >
                      −
                    </button>
                    <span>{r.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(r.slug, r.qty + 1)}
                      aria-label="+"
                    >
                      +
                    </button>
                  </div>
                  <span className="cart-item-total">
                    {fmt(r.product.priceCents * r.qty)}
                  </span>
                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => remove(r.slug)}
                    aria-label={t("shop.remove")}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <aside className="cart-summary">
              <div className="cart-line">
                <span>{t("shop.subtotal")}</span>
                <strong>{fmt(subtotalCents)}</strong>
              </div>
              <div className="cart-line">
                <span>{t("shop.shipping")}</span>
                <strong>{fmt(SHIPPING_CENTS)}</strong>
              </div>

              {loggedIn && (
                <div className="cart-points">
                  <p className="cart-points-balance">
                    {t("shop.pointsBalance")}{" "}
                    <b className="gold-text">{points}</b>{" "}
                    {t("shop.pointsUnit")} ({fmt(pointsToCents(points))})
                  </p>

                  {canUsePoints ? (
                    <>
                      <label className="cart-points-toggle">
                        <input
                          type="checkbox"
                          checked={usePoints}
                          onChange={(e) => {
                            setUsePoints(e.target.checked);
                            if (e.target.checked && !ptsInput)
                              setPtsInput(String(maxUsable));
                          }}
                        />
                        {t("shop.usePoints")}
                      </label>

                      {usePoints && (
                        <div className="cart-points-field">
                          <input
                            type="number"
                            min={POINT_MIN_REDEEM}
                            max={maxUsable}
                            step="1"
                            value={ptsInput}
                            onChange={(e) => setPtsInput(e.target.value)}
                          />
                          <button
                            type="button"
                            className="cart-points-max"
                            onClick={() => setPtsInput(String(maxUsable))}
                          >
                            {t("shop.pointsMax")}
                          </button>
                          <span className="cart-points-help">
                            {t("shop.pointsRange", {
                              min: POINT_MIN_REDEEM,
                              max: maxUsable,
                            })}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="cart-points-help">{t("shop.pointsMinInfo")}</p>
                  )}
                </div>
              )}

              {discountCents > 0 && (
                <div className="cart-line cart-discount">
                  <span>
                    {t("shop.pointsDiscount")} ({effectivePoints}{" "}
                    {t("shop.pointsUnit")})
                  </span>
                  <strong>−{fmt(discountCents)}</strong>
                </div>
              )}

              <div className="cart-line cart-total">
                <span>{t("shop.total")}</span>
                <strong>{fmt(totalCents)}</strong>
              </div>

              {!loggedIn && <p className="cart-note">{t("shop.pointsNote")}</p>}
              {err && <p className="auth-error">{err}</p>}
              <button
                type="button"
                className="btn btn-primary cart-pay"
                onClick={pay}
                disabled={busy}
              >
                {busy ? "…" : t("shop.checkout")}
              </button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
