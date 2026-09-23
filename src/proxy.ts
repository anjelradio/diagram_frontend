import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";
import { headers } from "next/headers";

/**
 * Proxy / Middleware de acceso y sesión para Next.js.
 * Centraliza las reglas de navegación:
 * - Sin sesión: solo permite rutas /auth/*; cualquier otra redirige a /auth/login.
 * - Con sesión: redirige /auth/*, /home y rutas no admitidas a /projects; protege /projects y /projects/*.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = !!session;
  const isAuthRoute = pathname.startsWith("/auth");
  const isProjectsRoute =
    pathname === "/projects" || pathname.startsWith("/projects/");
  const isJoinRoute = pathname.startsWith("/join");
  const isManualRoute =
    pathname === "/manual" || pathname.startsWith("/manual/");

  // 1. Usuario no autenticado
  if (!isAuthenticated) {
    if (isAuthRoute || isManualRoute) {
      return NextResponse.next();
    }
    const redirectUrl = new URL("/auth/login", request.url);
    const targetUrl = pathname + search;
    if (targetUrl && targetUrl !== "/") {
      redirectUrl.searchParams.set("callbackUrl", targetUrl);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Usuario autenticado
  // Permitir acceso a la pantalla de unión de invitaciones o al manual de usuario
  if (isJoinRoute || isManualRoute) {
    return NextResponse.next();
  }

  // Redirigir intentos de acceso a /auth/* o al callback temporal /home
  if (isAuthRoute || pathname === "/home" || pathname.startsWith("/home/")) {
    const callback =
      request.nextUrl.searchParams.get("callbackUrl") ||
      request.nextUrl.searchParams.get("callbackURL");

    if (callback && callback.startsWith("/")) {
      return NextResponse.redirect(new URL(callback, request.url));
    }
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  // Permitir navegación legítima en el módulo de projects
  if (isProjectsRoute) {
    return NextResponse.next();
  }

  // Cualquier otra ruta web no admitida con sesión redirige a /projects
  return NextResponse.redirect(new URL("/projects", request.url));
}

export default proxy;


export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - images, assistant_states (public static assets)
     * - static extensions (.webp, .png, .jpg, .jpeg, .gif, .svg, .ico)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|assistant_states|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
