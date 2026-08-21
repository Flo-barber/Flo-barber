// Fallback affiché INSTANTANÉMENT à chaque navigation interne sous [locale]
// (la navbar/footer du layout restent visibles). Le serveur rend la page — et
// fait ses vérifs éventuelles — en arrière-plan ; ensuite le contenu s'affiche
// (ou l'utilisateur est redirigé s'il n'est pas autorisé). Une route peut fournir
// son propre loading.js plus spécifique (ex. /compte avec un squelette dédié).
export default function Loading() {
  return (
    <div className="route-loading" aria-live="polite" aria-busy="true">
      <span className="route-loading-spin" aria-hidden="true" />
    </div>
  );
}
