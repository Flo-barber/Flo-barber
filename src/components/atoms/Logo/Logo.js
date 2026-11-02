import "./Logo.scss";

// Monogramme FB (médaillon métal sur béton) — image fournie par la marque.
export default function Logo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo-fb.jpg" alt="Flo Barber" className="fb-logo" width="240" height="240" />
  );
}
