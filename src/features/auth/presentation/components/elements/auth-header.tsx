"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, HelpCircle } from "lucide-react";

/**
 * Encabezado contextual para las rutas de autenticación.
 * Proyecta la acción contextual adecuada en AppHeader con proporciones refinadas:
 * - /auth/login: enlace para crear cuenta
 * - /auth/signup: enlace para iniciar sesión
 * - /auth/forgot-password: botón con flecha para volver al login
 * - /auth/reset-password y /auth/verify-email: botón para volver al login
 */
export function AuthHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const signupUrl = callbackUrl
    ? `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/signup";
  const loginUrl = callbackUrl
    ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/auth/login";

  let headerAction = null;

  if (pathname === "/auth/login") {
    headerAction = (
      <div className="flex items-center gap-3 select-none">
        <span className="hidden sm:inline text-xs sm:text-[13px] text-slate-400 font-normal">
          ¿No tienes cuenta?
        </span>
        <Link
          href={signupUrl}
          className="inline-flex items-center justify-center px-4.5 py-2 rounded-full text-xs sm:text-[13px] font-medium text-white bg-[#17181d]/80 hover:bg-[#1e1f24] border border-white/10 hover:border-indigo-500/40 transition-all duration-200 shadow-sm active:scale-[0.98]"
        >
          Crear cuenta
        </Link>
      </div>
    );
  } else if (pathname === "/auth/signup") {
    headerAction = (
      <div className="flex items-center gap-3 select-none">
        <span className="hidden sm:inline text-xs sm:text-[13px] text-slate-400 font-normal">
          ¿Ya tienes una cuenta?
        </span>
        <Link
          href={loginUrl}
          className="inline-flex items-center justify-center px-4.5 py-2 rounded-full text-xs sm:text-[13px] font-medium text-white bg-[#17181d]/80 hover:bg-[#1e1f24] border border-white/10 hover:border-indigo-500/40 transition-all duration-200 shadow-sm active:scale-[0.98]"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  } else if (pathname === "/auth/forgot-password") {
    headerAction = (
      <div className="flex items-center gap-3 select-none">
        <Link
          href={loginUrl}
          className="inline-flex items-center justify-center gap-2 px-4.5 py-2 rounded-full text-xs sm:text-[13px] font-medium text-white bg-[#17181d]/80 hover:bg-[#1e1f24] border border-white/10 hover:border-indigo-500/40 transition-all duration-200 shadow-sm active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Volver a iniciar sesión</span>
        </Link>
      </div>
    );
  } else if (
    pathname === "/auth/reset-password" ||
    pathname === "/auth/verify-email"
  ) {
    headerAction = (
      <div className="flex items-center gap-3 select-none">
        <Link
          href={loginUrl}
          className="inline-flex items-center justify-center px-4.5 py-2 rounded-full text-xs sm:text-[13px] font-medium text-white bg-[#17181d]/80 hover:bg-[#1e1f24] border border-white/10 hover:border-indigo-500/40 transition-all duration-200 shadow-sm active:scale-[0.98]"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-b from-black/80 via-black/35 to-transparent">
      <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-6">
        <Link
          href="/projects"
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <span className="text-lg font-bold tracking-tight text-white">
            Diagram
          </span>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/manual"
            className="w-9 h-9 rounded-full bg-[#17181d]/80 hover:bg-[#1e1f24] border border-white/10 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all duration-200 shadow-sm flex items-center justify-center active:scale-95 cursor-pointer"
            title="Manual de Usuario y Documentación"
            aria-label="Abrir manual de usuario y documentación"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
          {headerAction}
        </div>
      </div>
    </header>
  );
}
