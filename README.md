# Flo Barber — Webapp

Application web **Next.js 14** pour la chaîne de barbershops **Flo Barber** : vitrine,
localisateur de salons sur carte interactive, et **programme de fidélité** complet (comptes
clients, carte QR, Google Wallet) avec un **espace admin** pour créditer les points.

Direction artistique **« béton / métal »** : monochrome sombre, fond béton texturé,
typographie gothique (blackletter) pour la marque et les grands titres, accent métal.
Réservation de rendez-vous déléguée à **Planity** (un lien par salon).

> Pour la mise en route détaillée de la fidélité (Supabase + Google Wallet), voir
> **[`GUIDE-FIDELITE.md`](./GUIDE-FIDELITE.md)**. Pour les règles et conventions internes du
> code, voir **[`CLAUDE.md`](./CLAUDE.md)**.

## Stack

- **Next.js 14** (App Router, React 18) — Server Components par défaut, SSR pour le SEO.
- **Supabase** (`@supabase/ssr`) — authentification + base de données de la fidélité.
- **Google Wallet** (`google-auth-library` + `jsonwebtoken`) — carte de fidélité mobile.
- **Leaflet / react-leaflet** — carte interactive. Fond de carte **vectoriel dark
  d'OpenFreeMap** (gratuit, sans clé API) via **MapLibre GL** (`@maplibre/maplibre-gl-leaflet`),
  géocodage via l'API publique **Nominatim** (gratuit, sans clé API).
  > ⚠️ **`maplibre-gl` est figé en v4.** Le pont `@maplibre/maplibre-gl-leaflet` s'appuie
  > sur `map.transform`, un interne supprimé de l'API publique de MapLibre en v5+. Passer
  > maplibre-gl en v5 ou v6 **casse le rendu de la carte** (canvas noir, aucune tuile).
  > Rester en v4, ou repasser sur un fond raster avec `TileLayer` (ex. CARTO avec clé).
- **QR** — `qrcode.react` (génération de la carte), `html5-qrcode` (scan caméra admin).
- **SCSS** (`sass`) — thème centralisé, architecture atomic design (voir plus bas).
- **PWA** — manifest, service worker, icônes.
- **i18n FR/EN** — routing par URL (`/fr`, `/en`), dictionnaires JSON clé/valeur, sans
  dépendance externe.

## Langues (i18n)

Le site est bilingue **français / anglais** avec routing par URL : `/fr/...` et `/en/...`
(français par défaut ; `/` redirige vers `/fr`). Les textes sont dans
`src/locales/fr.json` et `src/locales/en.json` (clé/valeur imbriqué). Pour ajouter une
chaîne : ajouter la clé dans les deux fichiers, puis l'utiliser via `getT(locale)` (serveur)
ou `useT()` (client). Les liens internes passent par `@/i18n/Link` pour conserver la langue.

## Fonctionnalités

### Vitrine publique

- `/` — accueil (hero, prestations, aperçu des salons).
- `/recherche` — carte interactive + recherche par ville / code postal + tri par proximité,
  avec réservation via Planity.
- `/catalogue` — placeholder produits (à construire).

### Espace client — `/compte` (protégé)

- Connexion / inscription via Supabase (`/compte/connexion`).
- Carte de fidélité : **QR code contenant uniquement l'identifiant du client**, solde de
  points, historique, et bouton **« Ajouter à Google Wallet »** (mise à jour automatique
  des points).

### Espace admin / salon — `/admin` (protégé)

- Liste des clients.
- `/admin/scanner` — scan de la carte QR d'un client via la caméra, saisie du montant, et
  crédit des points (**1 € = 1 point**).

## Démarrer en local

```bash
npm install
npm run dev        # http://localhost:3000
```

Autres commandes :

```bash
npm run dev:lan    # test sur mobile en réseau local
npm run build      # build de production
npm start          # lancer le build
npm run lint
```

### Configuration (variables d'environnement)

Copier `.env.local.example` en **`.env.local`** et renseigner les clés. La vitrine et la
carte fonctionnent sans configuration ; la **fidélité** nécessite Supabase, et le **wallet**
nécessite Google Wallet.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — projet Supabase.
- `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_SERVICE_ACCOUNT` (base64) — Google Wallet.
- `SITE_USER`, `SITE_PASSWORD` — **mur d'authentification Basic optionnel** couvrant tout le
  site tant qu'il est en développement (laisser vide pour ouvrir au public).

Le schéma de base (tables, sécurité RLS, triggers) est dans **`supabase/schema.sql`** ; la
procédure pas à pas est dans `GUIDE-FIDELITE.md`.

> ⚠️ Ne jamais commiter `.env.local` ni la clé de service Google (`flo-barber-wallet-*.json`).
> Ces fichiers sont gitignorés.

## Ajouter / modifier des salons

Toutes les données sont centralisées dans **`src/data/salons.js`**. Il suffit d'éditer ce
tableau — chaque salon suit ce format :

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

Coordonnées GPS : https://www.latlong.net ou clic droit sur une adresse dans Google Maps.

## Architecture

```
src/
├── app/                    # App Router (pages, layouts, server actions, SEO)
│   ├── page.js             # accueil
│   ├── recherche/          # carte + recherche
│   ├── catalogue/          # placeholder
│   ├── compte/             # espace client (+ connexion, actions)
│   ├── admin/              # espace salon (+ scanner, actions)
│   ├── manifest.js · sitemap.js · robots.js
│   └── layout.js
├── components/             # atomic design
│   ├── atoms/              # Logo, LogoutButton
│   ├── molecules/          # AddToGoogleWallet, LoyaltyCard, QrScanner
│   └── organisms/          # Navbar, Footer, SalonMap
├── data/salons.js          # source unique des salons
├── lib/
│   ├── supabase/           # clients server.js et client.js (à ne pas mélanger)
│   └── googleWallet.js     # génération / mise à jour de la carte (serveur uniquement)
├── styles/                 # thème + partials de page (globaux)
└── middleware.js           # protection /compte et /admin + mur d'auth Basic
```

### Conventions

- **Server Components par défaut** ; `"use client"` uniquement si nécessaire (carte, scanner,
  formulaires, QR). Les mutations passent par des **Server Actions** (`actions.js`).
- **Sécurité côté base** : la fidélité repose sur la sécurité de Supabase (RLS, triggers),
  pas sur l'UI. Seul un admin peut créditer des points ; le QR ne contient que l'identifiant
  client. Voir `supabase/schema.sql`.
- **Atomic design + un SCSS par composant** : chaque composant vit dans son dossier
  (`Composant.js` + `Composant.scss` + `index.js`) et importe son SCSS co-localisé. Le thème
  (noir & doré) est centralisé dans `src/styles/_variables.scss` et réutilisé via
  `@use "variables" as *;` (résolu par `sassOptions.includePaths`). Les styles de page
  restent des partials globaux assemblés dans `src/styles/globals.scss`.

## Déploiement (Vercel)

1. Pousser le dépôt sur GitHub / GitLab.
2. Sur https://vercel.com → **New Project** → importer le dépôt (Next.js détecté
   automatiquement).
3. **Settings → Environment Variables** : ajouter les variables Supabase (et Google Wallet
   si utilisé). La caméra du scanner nécessite HTTPS, fourni par Vercel.
4. **Deploy**.

## Personnalisation

- **Thème / couleurs** : tokens dans `src/styles/_variables.scss` (béton + accent métal ;
  ne jamais coder les couleurs en dur). Fond texturé : `public/textures/concrete.jpg`.
- **Polices** : `next/font` dans `src/app/layout.js` (Grenze Gotisch + Oswald).
- **Logo** : atom `src/components/atoms/Logo/` (monogramme SVG) et `public/wordmark.svg`.
