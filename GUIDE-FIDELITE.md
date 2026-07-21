# Programme de fidélité — Guide de configuration

Le système de fidélité (comptes clients, points, carte QR, dashboard salon) utilise
**Supabase** (base de données + authentification, gratuit). Voici comment le mettre
en route. Compte ~15 minutes.

## 1. Créer un projet Supabase

1. Va sur https://supabase.com → **Start your project** (connexion avec GitHub).
2. **New project** : choisis un nom, un mot de passe de base de données (garde-le),
   et **surtout la région `West EU (Ireland)` ou `Central EU (Frankfurt)`** (RGPD).
3. Attends ~2 min que le projet soit prêt.

## 2. Récupérer les clés et les mettre dans le projet

1. Dans Supabase : **Settings → API**.
2. Copie **Project URL** et la clé **anon public**.
3. À la racine du projet, copie le fichier `.env.local.example` en **`.env.local`** et
   renseigne :

```
NEXT_PUBLIC_SUPABASE_URL=... (Project URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY=... (clé anon public)
```

## 3. Créer les tables

1. Dans Supabase : **SQL Editor → New query**.
2. Copie tout le contenu de **`supabase/schema.sql`** et colle-le.
3. Clique **Run**. Ça crée les tables (`profiles`, `transactions`, `admins`), la
   sécurité (RLS) et les automatismes (création de profil, crédit de points).

## 4. (Recommandé pour tester) Simplifier la confirmation email

Par défaut Supabase envoie un email de confirmation à l'inscription.
Pour tester rapidement : **Authentication → Sign In / Providers → Email** →
désactive **« Confirm email »**. (Tu pourras le réactiver en production.)

## 5. Lancer le site

```bash
npm install
npm run dev
```

- Va sur `/compte/connexion` et **crée un compte** (ce sera ton compte de test).
- Tu es redirigé vers `/compte` : tu vois tes points (0) et ta carte QR.

## 6. Te désigner comme administrateur (salon)

Pour accéder au dashboard `/admin` et créditer des points :

1. Dans Supabase : **Authentication → Users** → copie l'**UUID** de ton compte.
2. **SQL Editor → New query** :

```sql
insert into public.admins (user_id) values ('COLLE_ICI_TON_UUID');
```

3. Va sur **`/admin`** : tu vois la liste des clients. **`/admin/scanner`** ouvre la
   caméra pour scanner la carte d'un client, saisir le montant payé et créditer les
   points (1 € = 1 point).

> ⚠️ La caméra nécessite **HTTPS** (ou `localhost`). En test réseau local
> (`http://192.168…`), le scan caméra peut être bloqué par le navigateur ; c'est
> normal, ça fonctionne une fois déployé sur Vercel (HTTPS).

## 7. Déploiement sur Vercel

Dans ton projet Vercel : **Settings → Environment Variables**, ajoute les deux mêmes
variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), puis redéploie.

## Comment ça marche (résumé)

- **Le QR code d'un client contient uniquement son identifiant** — il ne permet pas
  de créditer des points.
- **Seul un compte admin** (présent dans la table `admins`) peut créditer des points ;
  c'est garanti côté base de données par la sécurité RLS, pas seulement côté interface.
- Un client ne voit que ses propres points et son historique.

## Points d'attention RGPD

Tu stockes des données personnelles (nom, email, téléphone) et un historique d'achats.
Prévois : une page **politique de confidentialité**, le **consentement** à l'inscription,
et la possibilité de **supprimer un compte**. L'hébergement Supabase en région UE est
déjà un bon point de départ.

## Phase 2 — Carte dans Google Wallet

La carte de fidélité peut être ajoutée au **Google Wallet** du téléphone (Android),
avec **mise à jour automatique des points**. C'est **gratuit** et sans limite de clients.

### Prérequis (comptes Google, à faire une fois)

1. **Google Pay & Wallet Console** (https://pay.google.com/business/console) →
   activer **Google Wallet API** → noter l'**Issuer ID**.
2. **Google Cloud** (https://console.cloud.google.com) → nouveau projet →
   activer l'**API Google Wallet**.
3. **Compte de service** : IAM → Comptes de service → en créer un → onglet **Clés**
   → créer une clé **JSON** (téléchargée).
4. Dans la Wallet Console → **Users** → ajouter l'**email du compte de service**
   (rôle Développeur).

### Configuration dans le projet

Le fichier JSON du compte de service se met dans `.env.local`, **encodé en base64**
(ça évite les problèmes de retours à la ligne de la clé privée).

Encode ton fichier JSON (remplace le nom du fichier) :

```bash
# macOS / Linux
base64 -i chemin/vers/service-account.json | tr -d '\n'
```

Copie le résultat et complète `.env.local` :

```
GOOGLE_WALLET_ISSUER_ID=3388000000023174098
GOOGLE_WALLET_SERVICE_ACCOUNT=<colle_ici_le_base64>
# Optionnel (par défaut : logo du site déployé) :
# GOOGLE_WALLET_LOGO_URL=https://ton-domaine.vercel.app/icon-512.png
```

Puis **relance** `npm run dev`.

### Utilisation

- Sur `/compte`, un bouton **« Ajouter à Google Wallet »** apparaît (uniquement si
  les variables ci-dessus sont présentes). Il ouvre l'écran d'ajout de Google.
- Le **QR de la carte contient le même identifiant** que dans l'app → **ton scanner
  admin fonctionne à l'identique**.
- Quand le salon crédite des points, la carte dans le wallet du client est **mise à
  jour automatiquement** (via l'API Google Wallet).

> Le **logo** de la carte (`GOOGLE_WALLET_LOGO_URL`) doit être une **image PNG
> accessible publiquement** (pas de `localhost`). Par défaut on pointe vers
> `/icon-512.png` de ton site déployé. Pour tester en local, déploie d'abord sur
> Vercel, ou mets une URL de logo publique.

> **Mode démo → production** : ton émetteur démarre en *mode démo* (tu peux tester
> avec tes propres comptes Google). Pour diffuser à tous tes clients, demande
> l'**accès de publication** dans la Wallet Console (gratuit).

## Et ensuite (Phase 2+)

- **Apple Wallet** (nécessite un compte Apple Developer ~99 €/an).
- **Paliers de récompense** (ex. 100 pts = −10 €) et notification au client.
- Statistiques salon (chiffre d'affaires, meilleurs clients).
