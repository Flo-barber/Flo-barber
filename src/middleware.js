import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Rafraîchit la session Supabase à chaque requête (nécessaire avec l'App Router).
export async function middleware(request) {
  // --- Mur d'authentification (site en développement) ---
  // Actif uniquement si SITE_PASSWORD est défini. Pour ouvrir le site au public,
  // il suffit de supprimer cette variable d'environnement et de redéployer.
  if (process.env.SITE_PASSWORD) {
    const expected =
      "Basic " +
      btoa(`${process.env.SITE_USER || "flo"}:${process.env.SITE_PASSWORD}`);
    if (request.headers.get("authorization") !== expected) {
      return new NextResponse("Accès restreint", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Flo Barber — Accès restreint"',
        },
      });
    }
  }

  // Tant que Supabase n'est pas configuré, on ne fait rien (le site vitrine fonctionne).
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

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
  // On applique le middleware partout sauf sur les fichiers statiques.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|xml|txt)$).*)",
  ],
};
