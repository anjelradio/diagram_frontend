import { Suspense } from "react";
import { LoginForm } from "@/features/auth/presentation/components/forms/login-form";
import AuthErrorNotifier from "@/features/auth/presentation/components/elements/auth-error-notifier";

export default function LoginPage() {
  return (
    <>
      {/* Lee ?error= en la URL y muestra el toast informativo correspondiente */}
      <Suspense fallback={null}>
        <AuthErrorNotifier />
      </Suspense>

      <div className="text-center mb-8">
        <h1 className="text-[1.65rem] sm:text-[1.75rem] font-bold text-white tracking-tight">
          Iniciar sesión
        </h1>
        <p className="text-[13px] sm:text-sm text-slate-400 mt-2 font-normal leading-relaxed">
          Ingresa tus credenciales para acceder a tu lienzo
        </p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </>
  );
}

