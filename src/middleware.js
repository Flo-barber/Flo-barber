import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Pages nécessitant une session Supabase (les autres n'appellent pas Supabase → navigation instantanée)
const PROTECTED = ["/compte", "/admin"];

export async function middleware(request) {
  // --- Mur d'authentification (site en développement) ---
  // Actif uniquement si SITE_PASSWORD est défini. Pour ouvrir le site au public,
  // il suffit de supprimer cette variable d'environnement et de redéployer.
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
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));

  // Pages publiques ou Supabase non configuré → on ne fait aucun appel réseau.
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|xml|txt)$).*)",
  ],
};
