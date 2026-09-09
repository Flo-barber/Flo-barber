// =============================================================
//  Intégration Google Wallet (carte de fidélité)
//  Utilisé UNIQUEMENT côté serveur (server actions / server components).
// =============================================================
import jwt from "jsonwebtoken";
import { GoogleAuth } from "google-auth-library";

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const CLASS_SUFFIX = process.env.GOOGLE_WALLET_CLASS_SUFFIX || "flo_barber_loyalty";
const LOGO_URL =
  process.env.GOOGLE_WALLET_LOGO_URL ||
  "https://flo-barber-orcin.vercel.app/icon-512.png";
const BASE = "https://walletobjects.googleapis.com/walletobjects/v1";
const SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";

// Google Wallet est-il configuré (variables d'environnement présentes) ?
export function isConfigured() {
  return Boolean(ISSUER_ID && process.env.GOOGLE_WALLET_SERVICE_ACCOUNT);
}

// Récupère les identifiants du compte de service (JSON brut ou base64).
function serviceAccount() {
  const raw = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GOOGLE_WALLET_SERVICE_ACCOUNT manquant.");
  const json = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json);
}

export function classId() {
  return `${ISSUER_ID}.${CLASS_SUFFIX}`;
}

// Un id d'objet ne peut contenir que [a-zA-Z0-9._-]
export function objectId(clientId) {
  return `${ISSUER_ID}.${String(clientId).replace(/[^\w.-]/g, "")}`;
}

function authClient() {
  const sa = serviceAccount();
  const auth = new GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key,
    },
    scopes: [SCOPE],
  });
  return auth.getClient();
}

// Crée la classe (gabarit de carte) si elle n'existe pas encore.
let classEnsured = false;
export async function ensureClass() {
  if (classEnsured) return;
  const client = await authClient();
  const id = classId();

  try {
    await client.request({ url: `${BASE}/loyaltyClass/${id}`, method: "GET" });
    classEnsured = true;
    return;
  } catch (e) {
    if (e?.response?.status !== 404) throw e;
  }

  await client.request({
    url: `${BASE}/loyaltyClass`,
    method: "POST",
    data: {
      id,
      issuerName: "Flo Barber",
      programName: "Fidélité Flo Barber",
      reviewStatus: "UNDER_REVIEW",
      hexBackgroundColor: "#0a0a0a",
      programLogo: {
        sourceUri: { uri: LOGO_URL },
        contentDescription: {
          defaultValue: { language: "fr-FR", value: "Flo Barber" },
        },
      },
    },
  });
  classEnsured = true;
}

function buildObject({ clientId, name, points }) {
  return {
    id: objectId(clientId),
    classId: classId(),
    state: "ACTIVE",
    accountId: clientId,
    accountName: name || "Client",
    loyaltyPoints: {
      label: "Points",
      balance: { int: Number(points) || 0 },
    },
    barcode: {
      type: "QR_CODE",
      value: clientId,
      alternateText: name || "",
    },
  };
}

// Génère l'URL « Ajouter à Google Wallet » (JWT signé).
export async function getSaveUrl({ clientId, name, points }) {
  await ensureClass();
  const sa = serviceAccount();
  const claims = {
    iss: sa.client_email,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: {
      loyaltyObjects: [buildObject({ clientId, name, points })],
    },
  };
  const token = jwt.sign(claims, sa.private_key, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}

// Met à jour le solde de points sur la carte déjà ajoutée au wallet.
// Si le client n'a pas encore ajouté sa carte (404), on ignore silencieusement.
export async function updatePoints(clientId, points) {
  if (!isConfigured()) return;
  const client = await authClient();
  try {
    await client.request({
      url: `${BASE}/loyaltyObject/${objectId(clientId)}`,
      method: "PATCH",
      data: { loyaltyPoints: { label: "Points", balance: { int: Number(points) || 0 } } },
    });
  } catch (e) {
    if (e?.response?.status !== 404) throw e;
  }
}
