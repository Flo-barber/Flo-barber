// Rendu générique d'un document légal (paragraphes / sous-titres / listes).
// Sans SCSS dédié : styles globaux dans `src/styles/_legal.scss` (.legal*).
export default function LegalDoc({ doc }) {
  return (
    <section className="section">
      <div className="container legal">
        <h1 className="legal-title">{doc.title}</h1>
        {doc.updated && <p className="legal-updated">{doc.updated}</p>}
        {doc.blocks.map((b, i) => {
          if (typeof b === "string") return <p key={i}>{b}</p>;
          if (b.h) return <h2 key={i}>{b.h}</h2>;
          if (b.ul)
            return (
              <ul key={i}>
                {b.ul.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            );
          return null;
        })}
      </div>
    </section>
  );
}
