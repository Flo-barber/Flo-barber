"use client";

import NextLink from "next/link";
import { useI18n } from "./I18nProvider";

// Link qui préfixe automatiquement les chemins internes par la locale courante.
// Ex. <Link href="/recherche"> => /fr/recherche. Les URLs absolues / ancres passent brutes.
export default function Link({ href, ...props }) {
  const { locale } = useI18n();
  const localized =
    typeof href === "string" && href.startsWith("/")
      ? `/${locale}${href === "/" ? "" : href}`
      : href;
  return <NextLink href={localized} {...props} />;
}
