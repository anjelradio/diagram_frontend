// * ─────────────────────────────────────────────────────────────────────────
// * lib/auth-roles.ts — Configuración central de roles del scaffold
// * ─────────────────────────────────────────────────────────────────────────
// *
// * Este es el ÚNICO archivo que debes editar para adaptar los roles
// * de autenticación a tu proyecto. El resto del sistema (auth.ts,
// * auth-client.ts, JWT, APIs admin) los recoge automáticamente.
// *
// * Recomendación: instala la extensión "Better Comments" de Aaron Bond
// * en VS Code para ver las anotaciones de este archivo con colores.
// *   → https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments
// * ─────────────────────────────────────────────────────────────────────────

import { createAccessControl } from "better-auth/plugins/access";

// * ═══════════════════════════════════════════════════════════════════════════
// * SECCIÓN 1 — DEFINICIÓN DE ROLES
// * ═══════════════════════════════════════════════════════════════════════════
// ?
// ? APP_ROLES es el catálogo completo de roles de tu aplicación.
// ? Cada clave es el nombre de la constante (en tu código TypeScript)
// ? y cada valor es el string que se almacena en la columna `role` de la BD.
// ?
// ? Por defecto el scaffold viene con dos roles: "user" y "admin".
// ? Estos son suficientes para la mayoría de los proyectos CRUD simples.

// ! ── ¿Quieres roles personalizados? ────────────────────────────────────────
// !
// ! Reemplaza o amplía las claves y valores según tu dominio.
// ! Ejemplo con roles especializados para un sistema de biblioteca:
// !
// !   export const APP_ROLES = {
// !     MEMBER:    "member",     // Usuario registrado sin privilegios especiales
// !     LIBRARIAN: "librarian",  // Puede gestionar el catálogo
// !     ADMIN:     "admin",      // Acceso total al sistema
// !   } as const;
// !
// ! Ejemplo para un SaaS multi-nivel:
// !
// !   export const APP_ROLES = {
// !     FREE:    "free",         // Plan gratuito
// !     PRO:     "pro",          // Plan de pago
// !     STAFF:   "staff",        // Empleado interno
// !     ADMIN:   "admin",        // Administrador
// !   } as const;
// !
// ! IMPORTANTE: después de cambiar los roles, actualiza también:
// !   → SECCIÓN 2: DEFAULT_ROLE (rol que reciben los nuevos usuarios)
// !   → SECCIÓN 3: ADMIN_ROLES  (roles con acceso a las APIs admin)
// !   → SECCIÓN 4: objeto `roles` (permisos de cada rol)
// !   → Ejecuta `pnpm auth migrate` para aplicar el nuevo default en la BD.
// ! ──────────────────────────────────────────────────────────────────────────

export const APP_ROLES = {
  USER:  "user",   // Usuario estándar (rol por defecto al registrarse)
  ADMIN: "admin",  // Administrador con acceso total
} as const;

/** Tipo inferido automáticamente. TypeScript validará cualquier uso de roles. */
export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];


// * ═══════════════════════════════════════════════════════════════════════════
// * SECCIÓN 2 — ROL POR DEFECTO
// * ═══════════════════════════════════════════════════════════════════════════
// ?
// ? Este es el rol que Better Auth asigna automáticamente cuando un usuario
// ? se registra (email/password u OAuth). Debe ser el rol de menor privilegio.

// ! Cambia este valor si el rol base de tu proyecto no es "user".
// ! Ejemplo: si tus roles son MEMBER, LIBRARIAN, ADMIN → pon APP_ROLES.MEMBER

export const DEFAULT_ROLE: AppRole = APP_ROLES.USER;


// * ═══════════════════════════════════════════════════════════════════════════
// * SECCIÓN 3 — ROLES CON PRIVILEGIOS ADMIN
// * ═══════════════════════════════════════════════════════════════════════════
// ?
// ? Solo los roles listados aquí pueden llamar a las APIs administrativas
// ? de Better Auth (setRole, banUser, listUsers, impersonateUser, etc.).
// ? Un usuario con otro rol recibirá un 403 aunque tenga permisos definidos.

// ! Agrega aquí todos los roles de tu proyecto que deben tener acceso admin.
// ! Ejemplo con varios roles de staff:
// !
// !   export const ADMIN_ROLES: AppRole[] = [
// !     APP_ROLES.ADMIN,
// !     APP_ROLES.STAFF,   // staff también puede administrar
// !   ];

export const ADMIN_ROLES: AppRole[] = [APP_ROLES.ADMIN];


// * ═══════════════════════════════════════════════════════════════════════════
// * SECCIÓN 4 — ACCESS CONTROL Y PERMISOS POR ROL
// * ═══════════════════════════════════════════════════════════════════════════
// ?
// ? El `ac` (AccessControl) define las operaciones que existen en el sistema.
// ? NO modifiques los statements del `ac` — son los que expone el admin plugin.
// ?
// ? Operaciones disponibles sobre `user`:
// ?   "create" | "list" | "set-role" | "ban" | "impersonate" |
// ?   "impersonate-admins" | "delete" | "set-password" | "set-email" |
// ?   "get" | "update"
// ?
// ? Operaciones disponibles sobre `session`:
// ?   "list" | "revoke" | "delete"

export const ac = createAccessControl({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});

// ? ── Permisos por rol ──────────────────────────────────────────────────────
// ?
// ? Aquí defines qué puede hacer cada rol. Usa los statements listados arriba.
// ? Los arrays vacíos significan "sin acceso a operaciones admin".

// ! ── ¿Agregaste un rol nuevo en SECCIÓN 1? ─────────────────────────────────
// !
// ! Debes agregar una entrada en este objeto para ese rol.
// ! Ejemplo — agregar "librarian" con permisos limitados:
// !
// !   [APP_ROLES.LIBRARIAN]: ac.newRole({
// !     user: ["list", "get"],           // Solo puede listar y ver usuarios
// !     session: [],                     // Sin acceso a sesiones
// !   }),
// !
// ! Ejemplo — agregar "staff" con permisos de moderación:
// !
// !   [APP_ROLES.STAFF]: ac.newRole({
// !     user: ["list", "get", "ban", "set-role"],
// !     session: ["list", "revoke"],
// !   }),
// !
// ! NOTA: El `satisfies` al final del objeto valida que hayas definido
// ! permisos para TODOS los roles en APP_ROLES. TypeScript te avisará
// ! si falta alguno.
// ! ──────────────────────────────────────────────────────────────────────────

export const roles = {
  /**
   * USER — Usuario estándar.
   * Sin acceso a ninguna operación administrativa de Better Auth.
   * Sus acciones se limitan a lo que cada página/endpoint le permita.
   */
  [APP_ROLES.USER]: ac.newRole({
    user:    [],
    session: [],
  }),

  /**
   * ADMIN — Administrador completo.
   * Puede realizar cualquier operación sobre usuarios y sesiones.
   * No incluye "impersonate-admins" por seguridad — ajusta si lo necesitas.
   */
  [APP_ROLES.ADMIN]: ac.newRole({
    user: [
      "create",
      "list",
      "set-role",
      "ban",
      "impersonate",
      "delete",
      "set-password",
      "set-email",
      "get",
      "update",
    ],
    session: ["list", "revoke", "delete"],
  }),

} satisfies Record<AppRole, ReturnType<typeof ac.newRole>>;


// * ═══════════════════════════════════════════════════════════════════════════
// * RESUMEN — ¿Qué editar si personalizas los roles?
// * ═══════════════════════════════════════════════════════════════════════════
// *
// *  ✏️  SECCIÓN 1 → Agrega/renombra/elimina roles en APP_ROLES
// *  ✏️  SECCIÓN 2 → Actualiza DEFAULT_ROLE al rol de menor privilegio
// *  ✏️  SECCIÓN 3 → Actualiza ADMIN_ROLES con los roles que gestionan el sistema
// *  ✏️  SECCIÓN 4 → Agrega una entrada en `roles` por cada rol nuevo
// *
// *  ✅  auth.ts        → No necesita cambios (importa todo de aquí)
// *  ✅  auth-client.ts → No necesita cambios (importa todo de aquí)
// *  ⚡  Terminal       → Ejecuta `pnpm auth migrate` si cambias el DEFAULT_ROLE
// *                       para que la BD refleje el nuevo default.
// * ═══════════════════════════════════════════════════════════════════════════
