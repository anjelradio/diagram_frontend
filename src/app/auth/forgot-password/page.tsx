import Link from "next/link";
import { ForgotPasswordForm } from "@/features/auth/presentation/components/forms/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-[1.65rem] sm:text-[1.75rem] font-bold text-white tracking-tight">
          Recuperar contraseña
        </h1>
        <p className="text-[13px] sm:text-sm text-slate-400 mt-2 font-normal leading-relaxed">
          Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu cuenta
        </p>
      </div>

      <ForgotPasswordForm />

      <div className="text-center mt-6">
        <p className="text-[13px] sm:text-sm text-slate-400 font-normal">
          ¿Recordaste tu contraseña?{" "}
          <Link
            href="/auth/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </>
  );
}
