import "./Logo.scss";

// Monogramme FB (médaillon métal) — détouré en cercle depuis /brand/logo-fb.jpg.
export default function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo-fb-round.webp" alt="Flo Barber" className="fb-logo" width="240" height="240" />
  );
}
