// Configuration i18n (routing par URL : /fr, /en)
export const locales = ["fr", "en"];
export const defaultLocale = "fr";

export function isLocale(value) {
  return locales.includes(value);
}
