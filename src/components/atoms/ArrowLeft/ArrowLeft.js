import "./ArrowLeft.scss";

// Flèche « retour » (SVG). Hérite de la couleur via currentColor ; l'espacement
// avec le texte est géré par le conteneur (gap du .btn, ou inline-flex du lien).
export default function ArrowLeft({ size = 18 }) {
  return (
    <svg
      className="back-arrow"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 5 5 12 12 19" />
    </svg>
  );
}
