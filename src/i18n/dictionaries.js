// Chargement des dictionnaires côté serveur (Server Components / metadata).
import fr from "@/locales/fr.json";
import en from "@/locales/en.json";
import { translator } from "./translate";
import { defaultLocale } from "./config";

const dictionaries = { fr, en };

export function getDictionary(locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

// Fonction de traduction prête à l'emploi pour une locale (usage serveur).
export function getT(locale) {
  return translator(getDictionary(locale));
}
