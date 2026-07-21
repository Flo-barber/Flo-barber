# Flo Barber — Webapp

Application web de localisation des salons de coiffure **Flo Barber**, avec carte interactive, recherche par ville/code postal et réservation via Planity.

Construite avec **Next.js 14 (App Router)** pour bénéficier du SSR et d'un bon référencement (SEO). La carte utilise **Leaflet + OpenStreetMap** (gratuit, sans clé API).

## Stack

- Next.js 14 (App Router, React 18)
- Leaflet / react-leaflet (fonds de carte CARTO dark + OpenStreetMap)
- Géocodage de la recherche via l'API publique Nominatim (gratuit)
- Aucune clé API requise → déploiement Vercel en 1 clic

## Démarrer en local

```bash
npm install
npm run dev
```

Le site est accessible sur http://localhost:3000

Autres commandes :

```bash
npm run build   # build de production
npm start       # lancer le build
```

## Pages

- `/` — Accueil (hero, prestations, aperçu des salons)
- `/recherche` — Carte interactive + barre de recherche par ville/CP
- `/catalogue` — Placeholder (produits à venir)

## Ajouter / modifier des salons

Toutes les données sont dans **`src/data/salons.js`**. Il suffit d'éditer ce
fichier — chaque salon suit ce format :

```js
{
  id: "identifiant-unique",
  name: "Flo Barber — Ville",
  address: "12 rue Exemple",
  postalCode: "51100",
  city: "Reims",
  phone: "03 26 00 00 00",   // optionnel
  lat: 49.2543,               // latitude GPS
  lng: 4.0287,                // longitude GPS
  planityUrl: "https://www.planity.com/votre-salon", // lien de réservation
  hours: "Mar–Sam : 9h – 19h", // optionnel
  image: ""                    // optionnel
}
```

**Trouver les coordonnées GPS** d'une adresse : https://www.latlong.net
ou clic droit sur une adresse dans Google Maps → les coordonnées s'affichent.

Le lien **Planity** (`planityUrl`) est celui que vous renseignez à la main pour
chaque salon ; il alimente les boutons « Réserver ».

## Déploiement sur Vercel

1. Poussez ce dossier sur un dépôt GitHub / GitLab.
2. Sur https://vercel.com → **New Project** → importez le dépôt.
3. Vercel détecte Next.js automatiquement — aucune variable d'environnement
   n'est nécessaire.
4. Cliquez sur **Deploy**. C'est tout.

Alternative sans Git, en ligne de commande :

```bash
npm i -g vercel
vercel
```

## Personnalisation

- **Couleurs / thème doré** : variables CSS dans `src/app/globals.css` (`:root`).
- **Logo FB** : `public/logo.svg` et le composant `src/components/Logo.js`.
- **Design** inspiré de blackboxparis.com (noir & doré, épuré).
