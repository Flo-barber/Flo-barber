"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { locales } from "@/i18n/config";
import "./LanguageSwitcher.scss";

// Sélecteur de langue flottant, fixé en haut à droite (hors navbar).
export default function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale } = useI18n();
  const t = useT();

  // Construit l'URL courante dans une autre langue (remplace le segment de locale).
  function pathFor(l) {
    const parts = (pathname || "/").split("/");
    if (locales.includes(parts[1])) parts[1] = l;
    else parts.splice(1, 0, l);
    const p = parts.join("/");
    return p.startsWith("/") ? p : `/${p}`;
  }

  return (
    <div className="lang-switch" aria-label={t("nav.language")}>
      {locales.map((l) => (
        <NextLink
          key={l}
          href={pathFor(l)}
          className={`lang-switch-btn ${l === locale ? "active" : ""}`}
          aria-current={l === locale ? "true" : undefined}
        >
          {l.toUpperCase()}
        </NextLink>
      ))}
    </div>
  );
}
