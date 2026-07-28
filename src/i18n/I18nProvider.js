"use client";

import { createContext, useContext, useMemo } from "react";
import { translator } from "./translate";
import { defaultLocale } from "./config";

// Contexte i18n pour les composants clients : expose la locale courante et `t()`.
// Le dictionnaire est fourni par le layout serveur (pas de fetch côté client).
const I18nContext = createContext({
  locale: defaultLocale,
  t: (key) => key,
});

export function I18nProvider({ locale, dict, children }) {
  const value = useMemo(
    () => ({ locale, t: translator(dict) }),
    [locale, dict]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

// Raccourci : récupère uniquement la fonction de traduction.
export function useT() {
  return useContext(I18nContext).t;
}
