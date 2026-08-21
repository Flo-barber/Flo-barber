# CLAUDE.md — Flo Barber

Contexte et règles du projet, lus automatiquement à chaque session de code.
Rôle attendu : expert développement & conception d'applications web JS.

## 1. Le projet en une phrase

Webapp **Next.js 14 (App Router, React 18)** pour la chaîne de barbershops **Flo Barber** :
vitrine + localisateur de salons + programme de **fidélité** (comptes clients, QR code,
Google Wallet) avec un **espace admin** pour créditer les points.

> Le `README.md` a été réécrit pour refléter l'app réelle (fidélité, Supabase, Wallet,
> admin, atomic design). En cas de doute, ce fichier `CLAUDE.md` et le code font foi.

## 2. Stack

- **Next.js 14** App Router, React 18 — Server Components par défaut.
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) : auth + base de données fidélité.
- **Google Wallet** (`google-auth-library` + `jsonwebtoken`) : carte de fidélité mobile.
- **Leaflet / react-leaflet** + géocodage **Nominatim** (OpenStreetMap, sans clé API).
- **QR** : `qrcode.react` (génération), `html5-qrcode` (scan caméra admin).
- **Paiement** : `stripe` (Checkout hébergé, expédition) + webhook → commandes + points.
- **SCSS** (`sass`). Alias d'import : `@/*` → `src/*` (voir `jsconfig.json`).
- Réservation de RDV **déléguée à Planity** (lien par salon, pas de moteur interne).
- PWA : `manifest.js`, `public/sw.js`, `ServiceWorker.js`.

## 3. Fonctionnalités et flux

**Vitrine publique**
- `/` — accueil (hero, prestations, **timeline « Nos barbiers »**, aperçu salons).
  L'équipe est en base Supabase (table `barbers` : `name`, `role_fr/en`, `bio_fr/en`,
  `image`, `active`, `sort`), lue via `src/lib/barbers.js` (`getBarbers`) et passée à
  l'organism client `BarbersTimeline` (apparition « découpe » synchronisée aux ciseaux
  qui suivent le scroll, réversible). Édition sans code via l'**admin `/admin/barbiers`**
  (slug auto depuis le nom, upload photo → bucket `products` préfixe `barbers/`).
- `/recherche` — carte Leaflet + recherche ville/CP + tri par proximité (`"use client"`).
- `/catalogue` — coupes signature : organism client `CatalogueViewer`. **Roue infinie custom**
  (sans dépendance) pilotée par un unique index `active` (modulo → boucle sans fin, toujours
  3 coupes au-dessus/3 en dessous ; molette/glisser/flèches ; animation via WAAPI). La photo
  centrale et la description découlent d'`active` (alignement garanti). Galerie multi-photos
  (thumbs + prev/next). **Coupes en base Supabase** (table `cuts` : `title_fr/en`,
  `description_fr/en`, `images` jsonb [galerie d'URLs], `products` jsonb [slugs liés],
  `active`, `sort`) — lues via `src/lib/cuts.js` (`getCuts`, mappé vers la forme du viewer,
  `alt` = titre). Édition sans code via l'**admin `/admin/coupes`** (upload images → bucket
  `products` préfixe `cuts/`, sélection des produits liés). `src/data/catalogue.json` n'est
  plus utilisé au runtime (conservé comme référence du seed).
- `/boutique` — **vraie boutique** : liste produits + fiche `/boutique/[slug]` (AddToCart),
  panier (`src/cart/CartProvider`, localStorage), page `/boutique/panier` (server → `CartView`
  client) → **Stripe Checkout** (server action `src/lib/shopActions.js`, prix **revalidés côté
  serveur** via `src/lib/products.js`, collecte d'adresse + frais de port `SHIPPING_CENTS`).
  Le **webhook** `POST /api/webhooks/stripe` enregistre la commande (table `orders`), **crédite
  les points** (1 € = 1 pt) et **décrémente le stock** (`rpc decrement_stock`) via la clé de service.
  **Produits en base Supabase** (table `products` : nom/tagline bilingues, `price_cents`, `image`,
  `stock` [null = illimité], `active`, `sort`). Édition sans code via l'**admin `/admin/produits`**
  (RLS `is_admin`, upload image → bucket Storage `products`). `src/data/catalogue.json` ne garde que
  les **coupes** (son tableau `products` sert de **seed** SQL). Pas de click & collect : **expédition uniquement**.
  ⚠️ **Upload Storage — piège à connaître** : l'upload d'image doit se faire en **`upsert: false`**
  (pas `true`). Avec `upsert: true`, Supabase émet un `INSERT ... ON CONFLICT DO UPDATE` qui fait
  évaluer **en plus** la policy UPDATE côté Storage → l'`is_admin()` de cette policy y renvoyait
  faux et **bloquait tout l'upload** (403 « new row violates RLS »). En INSERT pur (`upsert: false`),
  seule la policy INSERT est évaluée et ça passe ; les noms de fichiers sont déjà uniques
  (`slug-<timestamp>.<ext>`), donc `upsert` est inutile. Les **policies RLS Storage** sont keyées sur
  `bucket_id = 'products'` **et** `is_admin()` (INSERT/UPDATE/DELETE), **sans** clause `to authenticated`
  (même modèle que `products_write` de la table). Le **nom de bucket compte, casse comprise** :
  `bucket_id` compare l'**`id`** du bucket (pas son affichage), et le code cible `products` (minuscule,
  surchargeable via `NEXT_PUBLIC_STORAGE_BUCKET`). L'admin **supprime automatiquement l'ancienne image**
  du bucket au remplacement (à l'enregistrement) et à la suppression d'un produit, via `storagePathFromUrl`
  qui ne cible **que** les objets réellement uploadés (les chemins statiques du seed `/catalogue/products/…`
  sont épargnés).

**Espace client** `/compte` (protégé)
- Auth Supabase via `/compte/connexion`.
- Carte de fidélité `LoyaltyCard` : QR = **uniquement l'`id` du client**, solde de points,
  bouton « Ajouter à Google Wallet » (`AddToGoogleWallet` → server action `getWalletSaveUrl`).
- **Valeur des points affichée en euros** (`account.pointsValue`), et bouton **« Espace admin »**
  visible seulement si le compte est admin (vérif serveur via table `admins`).

**Programme de fidélité « Flo Points » (règles)**
- **Gain** : 1 € dépensé = 1 Flo Point (boutique via webhook sur `amount_total` payé ; salon via
  `creditPoints`, `Math.floor`).
- **Valeur** : 1 Flo Point = **0,05 €** (`POINT_VALUE_CENTS` dans `src/lib/format.js`). Helpers
  `pointsToCents`, `maxRedeemablePoints`.
- **Utilisation** : à partir de **100 points** (`POINT_MIN_REDEEM`), tout ou partie (montant libre).
  - **En ligne (boutique)** : le client choisit ses points dans le **panier** (`CartView`) AVANT le
    paiement ; la remise est **recalculée et appliquée côté serveur** dans `createCheckoutSession`
    (jamais le client). Remise = coupon Stripe `amount_off` ; la **livraison est un line item** (pour
    que la remise couvre le total) ; plafond : laisser ≥ 0,50 € payable (`STRIPE_MIN_CENTS`).
    Anti-double-dépense : les points sont **réservés atomiquement** au moment de créer le paiement
    (`rpc hold_points` → débit immédiat + ligne `redemptions` `held`). Le webhook **confirme**
    (`confirm_redemption`) sur `checkout.session.completed` et **libère/rembourse**
    (`release_redemption`) sur `checkout.session.expired` (⚠️ activer cet event côté Stripe ; session
    à expiration courte de 30 min).
  - **En salon (prestations)** : l'admin déduit les points via `redeemPointsAdmin` (scanner, mode
    « Utiliser des points ») → transaction négative `kind = 'redeem'`.

**Espace admin / salon** `/admin` (protégé)
- Liste clients + `/admin/scanner` (caméra `QrScanner`) : **deux modes** — *créditer* un achat
  (`creditPoints`, 1 € = 1 pt) ou *utiliser des points* (`redeemPointsAdmin`, min 100).

## 4. Architecture & conventions Next.js (règles en place — à respecter)

- **Server Components par défaut** ; `"use client"` seulement si nécessaire (carte, scanner,
  formulaires, QR, boutons interactifs).
- **Mutations = Server Actions** dans des fichiers `actions.js` marqués `"use server"`.
- **Deux clients Supabase distincts** : `src/lib/supabase/server.js` (Server Components /
  actions) et `src/lib/supabase/client.js` (navigateur). Ne jamais les mélanger.
- **`src/middleware.js`** : routing i18n (redirige vers la locale par défaut si le préfixe
  manque), protège `/compte` et `/admin` (comparaison sur le chemin sans préfixe de locale),
  rafraîchit la session Supabase, et porte un **mur d'auth Basic optionnel** (`SITE_PASSWORD`).
- **Données salons** centralisées dans `src/data/salons.js` (format objet documenté en tête
  du fichier). Ajouter/éditer un salon = éditer ce tableau, rien d'autre.
- Métadonnées SEO par page (`metadata`), `sitemap.js`, `robots.js` à tenir à jour.

## 4bis. Internationalisation (FR / EN) — custom, sans dépendance

- **Routing par URL** : toutes les pages vivent sous `src/app/[locale]/…` ; locales dans
  `src/i18n/config.js` (`["fr","en"]`, défaut `fr`). `manifest.js`, `robots.js`, `sitemap.js`
  restent à la racine `src/app/` (hors locale).
- **Dictionnaires** clé/valeur : `src/locales/fr.json` et `src/locales/en.json` (imbriqués,
  notation pointée). Toute chaîne visible passe par une clé — jamais de texte en dur dans le JSX.
- **Serveur** (Server Components / `generateMetadata`) : `getT(locale)` depuis
  `src/i18n/dictionaries.js` → `t("home.hero.title")`. La locale vient de `params.locale`.
- **Client** : `<I18nProvider>` (dans `[locale]/layout.js`) fournit `useT()` et `useI18n()`.
  Le dictionnaire est passé par le serveur (pas de fetch client).
- **Liens** : utiliser `@/i18n/Link` (préfixe la locale automatiquement), jamais `next/link`
  directement pour la navigation interne. Navigation programmatique : `useLocalePath()`.
- **Placeholders** : `t("scanner.credited", { points, name })` remplace `{x}`.
- Sélecteur de langue : molecule flottante `LanguageSwitcher` fixée en haut à droite (hors
  navbar, rendue dans `[locale]/layout.js`) ; bascule le segment de locale de l'URL courante.
- Reliquat connu : les messages d'erreur renvoyés par les **server actions**
  (`src/lib/adminActions.js`, `src/lib/walletActions.js`) restent en français.

## 5. Sécurité — principe directeur À NE JAMAIS CASSER

La sécurité vit **dans la base**, pas dans l'UI (voir `supabase/schema.sql`) :
- **RLS** stricte : un client ne voit que ses propres données.
- **Seul un admin** (table `admins`) peut créditer des points — garanti par la policy
  `transactions_insert` avec `check (is_admin())`, pas seulement l'interface.
- Les **points** ne sont modifiables que par le trigger `add_points` (`SECURITY DEFINER`),
  qui **interdit tout solde négatif** (garde-fou : `raise exception` si le solde passerait < 0).
  Côté client : `revoke update` puis `grant update (full_name, phone)` uniquement.
- Le **QR client ne contient que l'identifiant** — il ne permet jamais de créditer.
- **Utilisation de points (remise)** : jamais pilotée par le client. La déduction passe
  **uniquement** par des fonctions `SECURITY DEFINER` : `hold_points` (réservation atomique au
  checkout, avec verrou de ligne + vérif du solde → aucune double-dépense possible),
  `confirm_redemption` / `release_redemption` (appelées par le webhook via la clé de service).
  Le montant de la remise est **recalculé côté serveur** (`createCheckoutSession`), jamais transmis
  par le client. Table `redemptions` (RLS lecture only) pour le suivi des holds.

Toute nouvelle fonctionnalité touchant aux points/comptes doit reproduire ce modèle
(vérif serveur + policy RLS + fonction SECURITY DEFINER), jamais se reposer sur un contrôle front.

## 6. Convention de style — CIBLE : atomic design + 1 SCSS par composant

> **Décision projet.** L'existant utilise des composants à plat (`src/components/`) et des
> partials SCSS par page (`src/styles/_home.scss`…). La **cible** est l'**atomic design**
> avec **un fichier SCSS dédié par composant**.

Règles pour tout **nouveau** composant :
- Organiser en `atoms/` → `molecules/` → `organisms/` (+ templates/pages si utile), un
  dossier par composant : `Composant.js` + `Composant.scss` + `index.js` (barrel).
- Chaque composant a son **propre `.scss`** co-localisé, importé en tête du composant
  (`import "./Composant.scss";`).
- Réutiliser le thème via `@use "variables" as *;` — résolu partout grâce à
  `sassOptions.includePaths` (`src/styles`) dans `next.config.mjs`. **Ne jamais** redéfinir
  les couleurs en dur. Tokens : `$black`, `$gold`, `$gold-gradient`, mixin `gold-fill`,
  placeholder `%field`, breakpoints `$bp-mobile/$bp-tablet/$bp-nav`.
- **`_variables.scss` ne produit AUCUNE sortie CSS** (tokens + mixins seulement). Les
  custom properties `:root` sont émises une seule fois, globalement, dans `_base.scss`.
  → un composant peut donc `@use "variables"` sans jamais dupliquer de règle.
- Importer le composant via son alias : `@/components/atoms/Logo`.
- **Migrer progressivement** l'existant vers cette structure (pas de big-bang) ; quand on
  touche un composant à plat, le refactorer vers atomic design + SCSS dédié, et retirer son
  partial de `src/styles/globals.scss`.

Déjà migrés : **`atoms/Logo/`**, **`atoms/LogoutButton/`** (classe `.logout-button`),
**`molecules/AddToGoogleWallet/`** (classe `.wallet-btn`), **`molecules/LoyaltyCard/`**
(classes `.loyalty*`).
**`molecules/QrScanner/`** (sans SCSS dédié : sa classe `.qr-reader` reste globale dans
`_admin.scss` car le fallback `loading` du `dynamic()` l'utilise avant le chargement du
composant).
Organisms migrés : **`organisms/Navbar/`**, **`organisms/Footer/`**, **`organisms/SalonMap/`**
(ce dernier co-localise tous les overrides Leaflet ; son SCSS est importé APRÈS
`leaflet/dist/leaflet.css` pour primer par cascade). La migration atomic design est
**terminée** : plus aucun composant à plat sauf `ServiceWorker` (utilitaire sans style).
`ServiceWorker` est un utilitaire sans style (peut rester tel quel ou aller en `utils/`).
Les partials de page (`_home`, `_recherche`, `_admin`, `_account`, `_catalogue`) restent
globaux. NB : `.auth-error` est une utilité d'erreur partagée (connexion, scanner, wallet)
→ elle reste globale dans `_account.scss`.

Thème (DA « béton / métal ») : monochrome sombre, fond **béton texturé**
(`public/textures/concrete.jpg` appliqué au body dans `_base.scss`), accent **métal**
(plus de doré). Tokens dans `src/styles/_variables.scss` : `$black/$black-soft/$black-card`,
`$concrete`, `$metal/$metal-light/$metal-dark/$metal-gradient`, mixin `metal-fill`.
Les anciens tokens `$gold*` / `gold-fill` sont conservés comme **alias repointés sur le
métal** (compat) — le nouveau code utilise `$metal*`.
Typographie via `next/font` (dans `layout.js`, exposée en variables CSS
`--font-gothic` / `--font-condensed`, référencées par `$font-gothic` / `$font-condensed`) :
**Grenze Gotisch** (gothique moderne lisible, graisse légère ~500) pour la marque et les
grands titres (`h1`, `h2`), **Oswald** (condensée) pour sur-titres, boutons, nav (`h3`).
Corps en pile système. Fond béton **plat industriel** (`public/textures/concrete.jpg`,
texture fine uniforme) + lumière douce du haut et vignettage bas dans `_base.scss`.

## 7. Commandes

```bash
npm install
npm run dev        # http://localhost:3000
npm run dev:lan    # tests sur mobile en réseau local
npm run build && npm start
npm run lint
```

Config env : copier `.env.local.example` → `.env.local` (Supabase, Google Wallet, mur d'auth).
Mise en route fidélité détaillée dans `GUIDE-FIDELITE.md`.

## 8. Points d'attention / dette

- **Secrets** : `flo-barber-wallet-*.json` (clé de service Google) et `.env.local` sont
  gitignorés — **ne jamais les commiter ni les partager**.
- **RGPD / légal** : base en place — politique de confidentialité (`/confidentialite`),
  mentions légales (`/mentions-legales`) et **CGV/CGU** (`/cgv`) rendues via l'organism
  `LegalDoc` depuis `src/data/legal.js` (bilingue, **placeholders `[CROCHETS]` à compléter** :
  société, SIRET, adresse, email, hébergeur, moyens de paiement, livraison, médiateur…),
  consentement
  obligatoire à l'inscription, bandeau cookies informatif (`molecules/CookieNotice`), et
  **suppression de compte** (`molecules/DeleteAccountButton` → server action
  `src/lib/accountActions.js` via clé de service). ⚠️ À faire relire par un juriste et
  compléter les champs avant production.
- **Clé de service Supabase** : `SUPABASE_SERVICE_ROLE_KEY` (env, secret serveur) requise
  pour la suppression de compte. Client dédié `src/lib/supabase/admin.js` — jamais côté client.
- **Google Wallet** : émetteur en *mode démo* tant que l'accès de publication n'est pas
  demandé. Le logo doit être un PNG public (pas `localhost`).
- **Caméra scanner** : nécessite HTTPS (ou `localhost`) — bloquée en `http://192.168…`.
