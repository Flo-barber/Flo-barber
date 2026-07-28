// Fabrique une fonction de traduction `t("a.b.c")` sur un dictionnaire.
// - Accès par notation pointée (clés imbriquées).
// - Renvoie la clé elle-même si absente (repérage facile des trous de trad).
// - `t(key, vars)` remplace les placeholders `{x}` par `vars.x`.
export function translator(dict) {
  return function t(key, vars) {
    let value = key
      .split(".")
      .reduce((obj, k) => (obj == null ? undefined : obj[k]), dict);
    if (value === undefined) return key;
    if (vars && typeof value === "string") {
      value = value.replace(/\{(\w+)\}/g, (m, name) =>
        vars[name] != null ? String(vars[name]) : m
      );
    }
    return value;
  };
}
