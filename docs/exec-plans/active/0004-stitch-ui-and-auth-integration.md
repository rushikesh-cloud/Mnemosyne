# 0004 Stitch UI And Auth Integration

## Context

This task implements the first application code for Mnemosyne. The repo is currently documentation-only, so the implementation must initialize the documented monorepo foundation and then port the Stitch mockups into a Next.js/Tailwind app.

The design source of truth is the Stitch project `Mnemosyne UI Mockup Catalog` (`projects/8143223870574927493`). The available concrete screens are:

- `Sign In | Mnemosyne`
- `Chat | Mnemosyne`
- `Documents | Mnemosyne`
- `Document Detail | Mnemosyne`
- `Settings | Mnemosyne`
- `Mnemosyne Ops Workbench`, which is treated as duplicate sign-in HTML rather than a separate route.

## Domains Touched

- Monorepo and frontend foundation.
- Supabase Auth integration.
- Exact Stitch UI replication.
- Protected app routing with mock data.
- Documentation and task tracking.

## Implementation Notes

- Create a Next.js App Router web app under `apps/web`.
- Use Tailwind CSS and local React components only.
- Preserve Stitch colors, spacing, radii, fonts, Material Symbols icons, visible copy, and layout anatomy.
- Implement real Supabase sign-in/sign-up using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Keep chat, documents, document detail, settings, ingestion progress, MCP rows, and tool-call logs as local fixtures in this pass.
- Do not add database migrations, RLS policies, real uploads, chat streaming, settings persistence, secret encryption, shadcn/ui, Flowbite, DaisyUI, lucide, marketing pages, pricing pages, landing pages, or dashboards.

## Test Plan

- Write tests before production UI implementation.
- Auth tests:
  - sign-in requires email/password.
  - sign-in calls Supabase and redirects to `/chat` on success.
  - sign-in shows generic non-leaky failure copy on auth error.
  - sign-up requires matching passwords.
  - sign-up redirects to `/chat` when Supabase returns a session.
  - sign-up shows check-email state when Supabase requires confirmation.
- Route and render tests:
  - unauthenticated protected routes redirect to `/auth/sign-in`.
  - authenticated `/chat` renders sessions, model controls, reasoning/tool-call blocks, and composer landmarks.
  - authenticated `/documents` renders document table/progress and ingestion activity landmarks.
  - authenticated `/documents/[id]` renders metadata, parsed Markdown, chunks, and actions.
  - authenticated `/settings` renders provider settings, masked keys, and MCP rows.
- Verification:
  - Run test suite.
  - Run lint and typecheck.
  - Run production build.
  - Run browser visual checks at desktop and mobile sizes.
  - Capture screenshots and compare against Stitch screenshots for copy, layout, typography, palette, icons, spacing, and responsive behavior.

## Status

`in progress`

## Completion Criteria

- App foundation exists and compiles.
- Supabase Auth sign-in and sign-up flows are implemented with safe error handling.
- Protected Stitch-backed pages render with faithful UI and mock data.
- Tests, lint, typecheck, build, and visual checks pass or documented blockers are recorded.
- `tasks.md` and this execution plan are updated with completion status.
