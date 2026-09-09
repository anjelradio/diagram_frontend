<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Workflow

- Use pnpm: `pnpm-lock.yaml` is the committed lockfile.
- Available scripts: `pnpm dev`, `pnpm lint`, `pnpm build`, `pnpm start`, and `pnpm email:dev` (React Email preview).
- There is no test or typecheck script. Use `pnpm exec tsc --noEmit` for a focused type check and `pnpm build` for full Next.js validation.

## Structure

- `src/app/` contains App Router pages and route handlers. `src/app/api/auth/[...all]/route.ts` is the single Better Auth handler.
- Reusable UI primitives are shadcn/Radix components in `src/components/ui/`; `components.json` configures them for RSC and `src/styles/globals.css`.
- Feature modules and shared code live in `src/features/{feature-name,shared}/{domain,infrastructure,presentation}`. The `@/*` TypeScript alias resolves from `src/`.
- Email templates live in `src/lib/emails/` and are previewed with `pnpm email:dev`.
- For React or Next.js work, use the repository's `vercel-react-best-practices` skill.

## Auth And Backend Integration

- Keep Better Auth configuration in `src/lib/auth.ts`, browser client setup in `src/lib/auth-client.ts`, and role/permission changes in `src/lib/auth-roles.ts`; these modules share the same role definitions.
- `src/proxy.ts` currently runs only for `/home/:path*`; expand its matcher deliberately when protecting new routes.
- `src/features/shared/infrastructure/http/api-client.ts` sends a Better Auth JWT by default and retries one 401 after refresh. Set `withAuth: false` for public backend endpoints.
- Select external-backend error parsing with `NEXT_PUBLIC_BACKEND_ADAPTER` (`fastapi` or `laravel`); the default is `fastapi` and changing it requires a restart.

## Environment

- Treat `.env.template` as the environment contract for PostgreSQL, Better Auth, external-backend, OAuth, JWT, and Brevo settings. `.env*` files are ignored except the template.
