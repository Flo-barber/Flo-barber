"use client";

import { useI18n } from "./I18nProvider";

// Aide pour la navigation programmatique (router.push) : préfixe un chemin par la locale.
export function useLocalePath() {
  const { locale } = useI18n();
  return (path) =>
    typeof path === "string" && path.startsWith("/")
      ? `/${locale}${path === "/" ? "" : path}`
      : path;
}
