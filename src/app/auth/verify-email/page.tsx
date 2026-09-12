import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerificationPage() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Icono decorativo accesible de Stitch con escala ampliada */}
      <div
        className="relative mb-6 flex h-18 w-18 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-600/10 text-indigo-400 shadow-lg shadow-indigo-600/25"
        aria-hidden="true"
      >
        <Mail className="h-9 w-9 text-indigo-400" />
      </div>

      <h1 className="text-[1.65rem] sm:text-[1.75rem] font-bold tracking-tight text-white">
        Revisa tu correo
      </h1>

      <p className="mt-2.5 max-w-sm text-[13px] sm:text-sm font-normal leading-relaxed text-slate-400">
        Hemos enviado un enlace de verificación a tu dirección de correo electrónico.
        Por favor revisa tu bandeja de entrada o spam para activar tu cuenta.
      </p>

      <div className="mt-8 w-full space-y-3">
        <Link
          href="/auth/login"
          className="inline-flex w-full items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:bg-indigo-500 active:scale-[0.98]"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
