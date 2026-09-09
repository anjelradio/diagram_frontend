import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";
import { headers } from "next/headers";

/** Nombre de la cookie de sesión de Better Auth (prefijo por defecto): "better-auth.session_token" */
// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
  // const { pathname } = request.nextUrl;
  // Obtenemos la sesion de Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAuthenticated = !!session;

  // Tomamos el rol de la sesion del usuario: const userRole = session?.user.role;

  // 1. Proteger rutas privadas (Si no esta autenticado ira al login)
  if (!isAuthenticated)
    return NextResponse.redirect(new URL("/auth/login", request.url));

  // 2. Proteccion por Rol
  if (isAuthenticated) {
    // ! implementar
  }

  // 3. Redireccionamiento por Rol
  if (isAuthenticated) {
    // ! implementar
  }

  return NextResponse.next();
}

// Alternatively, you can use a default export:
// export default function proxy(request: NextRequest) { ... }

export const config = {
  // El matcher define en que rutas se ejecuta el proxy
  // ! Modificar segun necesidad
  matcher: ["/home/:path*"],
};
