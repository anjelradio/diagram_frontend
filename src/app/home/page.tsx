import { AppHeader } from "@/features/shared/presentation/components/layout/app-header";

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppHeader />

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bienvenido a tu dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Esta es la página principal de tu aplicación. Empieza a construir
            desde aquí.
          </p>
        </div>
      </main>
    </div>
  );
}
