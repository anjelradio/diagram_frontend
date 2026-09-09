import { LandingHeader } from "@/features/shared/presentation/components/layout/landing-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />

      <main className="flex flex-1 flex-col items-center px-6 py-20">
        <div className="mx-auto w-full max-w-3xl space-y-12">
          {/* Hero */}
          <section className="space-y-4 text-center">
            <div className="mx-auto w-fit rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
              Scaffold · Template
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              next-scaffoldcito
            </h1>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted-foreground">
              Un scaffold de Next.js diseñado para partir rápido. Incluye
              autenticación con Better Auth, componentes con shadcn/ui y una
              arquitectura limpia basada en features.
            </p>
          </section>

          <Separator />

          {/* Tech Stack */}
          <section className="space-y-6">
            <h2 className="text-center text-xl font-semibold tracking-tight">
              ¿Qué incluye?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>⚡ Next.js (App Router)</CardTitle>
                  <CardDescription>
                    React Server Components, Server Actions, layouts anidados y
                    enrutamiento basado en archivos.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🔐 Better Auth</CardTitle>
                  <CardDescription>
                    Autenticación lista con login, registro, verificación de
                    email y manejo de sesiones seguras con cookies HTTP-Only.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎨 shadcn/ui</CardTitle>
                  <CardDescription>
                    Componentes accesibles y estilizados con Tailwind CSS y Radix
                    UI. Listos para personalizar.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🏗️ Clean Architecture</CardTitle>
                  <CardDescription>
                    Estructura modular por features con capas de dominio,
                    infraestructura, aplicación y presentación.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Explore */}
          <section className="space-y-4 text-center">
            <h2 className="text-xl font-semibold tracking-tight">
              Explora el proyecto
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
              Este scaffold ya tiene componentes de UI, formularios de
              autenticación, notificaciones, headers y más creados para ti. Siéntete
              libre de explorar las carpetas{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                features/
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                components/ui/
              </code>{" "}
              y{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                app/
              </code>{" "}
              para descubrir todo lo disponible y adaptarlo a tu proyecto.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        next-scaffoldcito — hecho con Next.js, Better Auth y shadcn/ui
      </footer>
    </div>
  );
}
