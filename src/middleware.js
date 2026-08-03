import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { locales, defaultLocale } from "@/i18n/config";

// Pages nécessitant une session Supabase (comparé au chemin SANS préfixe de locale).
const PROTECTED = ["/compte", "/admin"];

function hasLocalePrefix(pathname) {
  return locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
}

// Retire le préfixe de locale : /fr/compte -> /compte, /en -> /
function stripLocale(pathname) {
  for (const l of locales) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

export async function middleware(request) {
  // --- Mur d'authentification (site en développement) ---
  // Actif uniquement si SITE_PASSWORD est défini.
  if (process.env.SITE_PASSWORD) {
    const expected =
      "Basic " +
      btoa(`${process.env.SITE_USER || "flo"}:${process.env.SITE_PASSWORD}`);
    if (request.headers.get("authorization") !== expected) {
      return new NextResponse("Acces restreint", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Flo Barber"' },
      });
    }
  }

  const { pathname } = request.nextUrl;

  // --- Routing i18n : redirige vers la locale par défaut si le préfixe est absent ---
  if (!hasLocalePrefix(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const bare = stripLocale(pathname);
  const needsAuth = PROTECTED.some((p) => bare === p || bare.startsWith(`${p}/`));

  // Pages publiques ou Supabase non configuré → aucun appel réseau.
  if (
    !needsAuth ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  // Rafraîchit la session Supabase uniquement sur les pages authentifiées.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // Exclut /api (webhooks Stripe…), les assets Next et les fichiers statiques.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|xml|txt)$).*)",
  ],
};
