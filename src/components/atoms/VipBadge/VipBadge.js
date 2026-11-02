import "./VipBadge.scss";

// Badge « VIP » (statut client attribué par l'admin).
export default function VipBadge({ className = "" }) {
  return <span className={`vip-badge ${className}`.trim()}>VIP</span>;
}
