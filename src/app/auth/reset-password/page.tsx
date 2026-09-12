import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/presentation/components/forms/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-[1.65rem] sm:text-[1.75rem] font-bold text-white tracking-tight">
          Restablecer contraseña
        </h1>
        <p className="text-[13px] sm:text-sm text-slate-400 mt-2 font-normal leading-relaxed">
          Crea tu nueva contraseña para volver a acceder a tu lienzo
        </p>
      </div>

      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
