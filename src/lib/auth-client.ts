import { createAuthClient } from "better-auth/react";
import { adminClient, jwtClient } from "better-auth/client/plugins";
import { ac, roles } from "@/lib/auth-roles";

export const authClient = createAuthClient({
  /**
   * Base URL del servidor de autenticación.
   * En desarrollo apunta a localhost; en producción a tu dominio.
   *
   * Debe coincidir con BETTER_AUTH_URL en el servidor.
   */
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  plugins: [
    /**
     * Cliente del JWT Plugin.
     * Agrega el método `authClient.jwt.getToken()` que llama a
     * GET /api/auth/token usando la cookie de sesión activa.
     */
    jwtClient(),

    /**
     * Cliente del Admin Plugin.
     * Desbloquea las APIs administrativas desde el cliente:
     *
     *   authClient.admin.setRole({ userId, role })
     *   authClient.admin.listUsers({ query })
     *   authClient.admin.banUser({ userId, banReason?, banExpiresIn? })
     *   authClient.admin.unbanUser({ userId })
     *   authClient.admin.createUser({ email, name, role?, password?, data? })
     *   authClient.admin.removeUser({ userId })
     *   authClient.admin.impersonateUser({ userId })
     *   authClient.admin.hasPermission({ permission })
     *   authClient.admin.revokeUserSession({ sessionToken })
     *   authClient.admin.revokeUserSessions({ userId })
     *
     * Solo funcionan si el usuario autenticado tiene un rol en ADMIN_ROLES.
     * La configuración de roles y permisos viene de lib/auth-roles.ts.
     */
    adminClient({ ac, roles } as Parameters<typeof adminClient>[0]),
  ],
});