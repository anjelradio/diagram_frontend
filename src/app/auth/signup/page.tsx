import { Suspense } from "react";
import { SignupForm } from "@/features/auth/presentation/components/forms/signup-form";

export default function SignupPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-[1.65rem] sm:text-[1.75rem] font-bold text-white tracking-tight">
          Crear cuenta
        </h1>
        <p className="text-[13px] sm:text-sm text-slate-400 mt-2 font-normal leading-relaxed">
          Crea tu cuenta para comenzar en tu lienzo
        </p>
      </div>

      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </>
  );
}

