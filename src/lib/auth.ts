import { betterAuth } from "better-auth";
import { admin, jwt } from "better-auth/plugins";
import { Pool } from "pg";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email";
import { ac, DEFAULT_ROLE, ADMIN_ROLES, roles } from "@/lib/auth-roles";

/**
 * Pool de conexión a PostgreSQL reutilizado por auth.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true, // Si trabajas en local (docker) entonces false
});

export const auth = betterAuth({
  plugins: [
    /**
     * Admin Plugin — agrega el campo `role` (y campos de ban) a la tabla `user`.
     *
     * ── Configuración de roles ────────────────────────────────────────────────
     * Los roles, permisos y defaults se gestionan en lib/auth-roles.ts.
     * Ese es el único archivo que debes editar para adaptar el scaffold.
     *
     * ── Campos que agrega a la tabla `user` ──────────────────────────────────
     *   - role          TEXT        → rol del usuario (default: DEFAULT_ROLE)
     *   - banned        BOOLEAN     → si el usuario está baneado
     *   - banReason     TEXT        → motivo del ban (opcional)
     *   - banExpires    TIMESTAMP   → expiración del ban (null = permanente)
     *
     * ── APIs administrativas expuestas ───────────────────────────────────────
     * POST /api/auth/admin/set-role
     * POST /api/auth/admin/ban-user
     * POST /api/auth/admin/unban-user
     * POST /api/auth/admin/create-user
     * GET  /api/auth/admin/list-users
     * POST /api/auth/admin/remove-user
     * POST /api/auth/admin/impersonate-user
     * ...y más. Solo accesibles para roles en ADMIN_ROLES.
     */
    admin({
      defaultRole: DEFAULT_ROLE,
      adminRoles: ADMIN_ROLES,
      ac,
      roles,
    }),

    /**
     * JWT Plugin — emite JWT firmados con clave asimétrica (EdDSA/Ed25519)
     * para autenticar peticiones a backends externos (FastAPI, etc.).
     *
     * ── Verificación en el backend externo ───────────────────────────────────
     * El backend externo obtiene la clave pública desde el JWKS endpoint:
     *   GET /api/auth/jwks
     *
     * Usa el algoritmo EdDSA (Ed25519) por defecto — NO HS256.
     * FastAPI debe usar PyJWKClient apuntando a ese endpoint.
     *
     * ── Payload del JWT ──────────────────────────────────────────────────────
     * Definido por definePayload(). Contiene:
     *   - sub   → user.id  (seteado automáticamente por Better Auth)
     *   - email → user.email
     *   - name  → user.name
     *   - role  → el rol del usuario (viene del campo `role` en la tabla `user`)
     *   - iat, exp
     *
     * ── Expiration ───────────────────────────────────────────────────────────
     * 15 minutos es el estándar profesional para JWTs de API.
     * La sesión de Better Auth (7 días) refresca el JWT silenciosamente.
     * Configurable con la variable de entorno JWT_EXPIRATION_TIME.
     *
     * Variables de entorno relevantes:
     *   JWT_EXPIRATION_TIME → Tiempo de vida del JWT (default: "15m")
     *   JWT_ISSUER          → Identificador del emisor (tu dominio)
     *   JWT_AUDIENCE        → Identificador del receptor (tu API externa)
     */
    jwt({
      jwks: {
        // Fijamos la ruta del JWKS para que FastAPI siempre sepa dónde
        // encontrar la clave pública sin depender del default.
        jwksPath: "/jwks",
      },
      jwt: {
        expirationTime: process.env.JWT_EXPIRATION_TIME ?? "15m",
        issuer:
          process.env.JWT_ISSUER ??
          process.env.BETTER_AUTH_URL ??
          "http://localhost:3000",
        audience: process.env.JWT_AUDIENCE,

        /**
         * definePayload — se ejecuta una vez al emitir o refrescar el JWT.
         * NO se ejecuta en cada petición al backend (es por request al /token).
         *
         * El plugin Admin enriquece el objeto `user` con el campo `role`
         * directamente desde la tabla `user` de Better Auth — sin queries
         * adicionales a tablas externas.
         *
         * ⚠️ Lo que devuelves aquí REEMPLAZA el payload base.
         *    Debes incluir explícitamente los campos que necesites.
         */
        definePayload: ({ user }) => {
          return {
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            // El rol viene del campo `role` en la tabla `user`,
            // gestionado por el plugin Admin. Sin queries adicionales.
            role: (user as typeof user & { role?: string }).role ?? DEFAULT_ROLE,
          };
        },
      },
    }),
  ],

  // Database — reutilizamos el mismo pool declarado arriba
  database: pool,

  // Email Provider
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },
  emailVerification: {
    sendOnSignIn: true,
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        url,
      });
    },
  },

  // Proveedores OAuth
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
