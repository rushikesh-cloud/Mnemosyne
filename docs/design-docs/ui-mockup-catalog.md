# UI Mockup Catalog

## Purpose

This catalog defines the planned UI mockup direction for the core Mnemosyne application pages. It is a design reference for later Tailwind implementation, not an application code specification.

Mnemosyne should feel like an enterprise knowledge operations workbench: compact, secure, transparent, and built for repeated use by people who need to inspect source material, ingestion quality, and agent behavior with confidence.

## Stitch Source Mapping

The first implementation pass uses the Stitch project `Mnemosyne UI Mockup Catalog` (`projects/8143223870574927493`) as the visual source of truth.

| Route | Stitch Source |
|---|---|
| `/auth/sign-in` | `Sign In | Mnemosyne` |
| `/auth/sign-up` | Derived from `Sign In | Mnemosyne` because Stitch has no distinct sign-up screen. |
| `/chat` | `Chat | Mnemosyne` |
| `/documents` | `Documents | Mnemosyne` |
| `/documents/[id]` | `Document Detail | Mnemosyne` |
| `/settings` | `Settings | Mnemosyne` |

The Stitch screen `Mnemosyne Ops Workbench` renders duplicate sign-in HTML and is not treated as a separate route.

## Shared Visual System

### Product Tone

- Calm, precise, and operational rather than promotional.
- Enterprise-grade without looking heavy or legacy.
- Trustworthy through visible state, provenance, and clear recovery paths.
- Designed for daily workflows where users scan, compare, configure, and investigate.

### App Shell

- Protected app pages use a persistent left navigation rail with clear destinations for Chat, Documents, and Settings.
- The top content area should be compact: page title, short context line, primary action, and any page-level status.
- Main content should use full-width work surfaces and panels, not nested card stacks.
- Keep density high but readable. Tables, split panes, sidebars, and inspector panels are preferred over decorative layouts.
- Auth pages are exceptions: they use a focused centered panel with a restrained trust/context column or header treatment.

### Palette

- Use a neutral foundation: near-white backgrounds, soft gray borders, dark text, and muted secondary text.
- Use restrained accent colors only for meaning:
  - Success: completed ingestion, connected settings, saved configuration.
  - Warning: partial configuration, retryable job issue, missing optional observability.
  - Error: failed ingestion, invalid credentials, provider connection failure.
  - Processing: queued, parsing, chunking, embedding, storing, streaming.
  - Configured: saved provider or MCP state without revealing secret values.
- Avoid broad purple gradients, decorative color fields, and marketing-style glow effects.

### Typography

- Use a restrained product UI hierarchy:
  - Page titles: compact and direct.
  - Section titles: small, scannable, and action-oriented.
  - Body text: readable, neutral, and concise.
  - Tables and inspector panels: strong label/value rhythm.
- Reserve large display type for auth page brand presence only. Protected app pages should favor dense, scan-friendly text.

### Component Direction

- Use local Tailwind primitives for buttons, inputs, selects, textareas, tables, modals, tabs, panels, navigation, and status badges.
- Buttons should be clear commands: primary for the page's main action, secondary for reversible or lower-priority actions, destructive only for irreversible operations.
- Status badges should combine color, text, and stable shape; color must not be the only signal.
- Modals should be used for upload and focused configuration actions, not for primary reading or inspection.
- Do not introduce shadcn/ui, Flowbite, DaisyUI, or another component library for this design pass.

### Accessibility And Responsiveness

- Every interactive control needs a visible focus state and accessible label.
- Forms should expose validation inline and avoid leaking security-sensitive details.
- Tables should convert to dense stacked rows on narrow screens without hiding critical status.
- Split views should collapse into tabs or stacked panels on mobile.
- Fixed-format UI elements such as nav items, status badges, controls, and upload progress rows should keep stable dimensions during loading and updates.

## `/auth/sign-in`

### Page Purpose

Allow existing users to securely access their tenant-scoped knowledge workspace.

### Primary User Goal

Sign in with email and password, understand errors clearly, and trust that the workspace is security-focused.

### Layout Description

Use a restrained full-height auth layout. The sign-in form should sit in a narrow, professional panel with ample breathing room. A simple brand area can sit above or beside the form depending on viewport width, but it should not become a marketing hero.

### Key UI Regions

- Brand header with Mnemosyne name and a short operational descriptor.
- Email and password fields with clear labels.
- Primary sign-in button with loading state.
- Link to sign up.
- Non-leaky error region for invalid credentials or unavailable auth service.
- Compact tenant trust note about isolated workspaces and secure access.

### Recommended Components

- Auth layout primitive.
- Text input.
- Password input.
- Primary button.
- Inline alert.
- Text link.

### States

- Empty: form fields ready with no promotional clutter.
- Loading: button shows signing-in state and disables duplicate submission.
- Error: show a generic authentication failure without revealing whether the email exists.
- Success: transition immediately into the protected app shell.

### Enterprise Polish Details

- Keep the form visually quiet and exact.
- Use crisp border treatment and strong focus rings.
- Align helper text and errors consistently under fields.
- Avoid background illustrations, oversized taglines, and soft gradient hero treatments.

### Mockup Emphasis

The mockup should emphasize secure entry, tenant trust, and a professional first impression.

## `/auth/sign-up`

### Page Purpose

Allow new users to create a tenant-scoped Mnemosyne account.

### Primary User Goal

Create an account with confidence that documents, settings, and future chat history will be isolated to the user's workspace.

### Layout Description

Reuse the sign-in layout structure for continuity, with slightly more emphasis on onboarding readiness and validation. The page should still feel like enterprise software, not a consumer registration funnel.

### Key UI Regions

- Brand header and concise workspace creation context.
- Email, password, and confirm password fields if required by implementation.
- Password requirement helper text.
- Primary create-account button with loading state.
- Link back to sign in.
- Inline validation and account creation error region.
- Security cue explaining tenant isolation in plain language.

### Recommended Components

- Auth layout primitive.
- Text input.
- Password input.
- Primary button.
- Inline validation text.
- Inline alert.
- Text link.

### States

- Empty: ready-to-complete account form.
- Loading: account creation in progress, controls disabled.
- Error: validation or account creation failure with actionable copy.
- Success: proceed to authenticated app or confirmation flow, depending on Supabase auth configuration.

### Enterprise Polish Details

- Use explicit field labels rather than placeholder-only input guidance.
- Password helper copy should be practical and compact.
- Avoid celebratory visuals; account creation should feel controlled and reliable.

### Mockup Emphasis

The mockup should emphasize secure onboarding, account isolation, and continuity with the sign-in experience.

## `/chat`

### Page Purpose

Provide the main agentic RAG workspace where users ask questions, manage chat sessions, configure per-session model behavior, and inspect transparent reasoning and tool activity.

### Primary User Goal

Ask a question, receive a streamed answer, and understand which tools, retrieval steps, and thinking states contributed to the response.

### Layout Description

Use a workbench layout. A persistent session sidebar sits on the left inside the protected app shell. The central column is the conversation surface. A compact top bar exposes the active session name, Gemini model selector, thinking-level selector, and session status. Tool calls and thinking events should appear inline or in a right-side inspector pattern when space allows.

### Key UI Regions

- App navigation rail.
- Chat session sidebar with new chat action, session list, active state, and timestamps.
- Conversation header with model selector, thinking-level selector, and connection/streaming state.
- Message stream with user and assistant turns.
- Transparent reasoning area for thinking states and tool-call logs.
- Composer with prompt input, submit action, and disabled state when settings are missing.
- Empty state that directs users to configure settings or upload documents when needed.

### Recommended Components

- App shell.
- Sidebar navigation.
- Session list.
- Select controls.
- Segmented thinking-level control.
- Message bubble or message block.
- Collapsible disclosure for thinking and tool calls.
- Streaming status indicator.
- Textarea composer.
- Icon buttons for new chat, collapse, retry, and copy where appropriate.

### States

- Empty: no session selected or new session ready; show direct next action without marketing copy.
- Loading: historical messages or sessions loading with stable skeleton rows.
- Streaming: assistant message grows while tool/thinking events update separately.
- Error: failed stream or missing provider settings with retry and settings remediation.
- Success: completed answer remains connected to visible reasoning/tool evidence.

### Enterprise Polish Details

- Do not make the chat feel like a simple consumer chatbot.
- Treat tool calls as inspectable operational events with names, status, duration, and concise result summaries.
- Keep thinking and tool-call panels visually distinct from assistant prose.
- The composer should remain stable and accessible during streaming.

### Mockup Emphasis

The mockup should emphasize transparency: users can see the answer, the session configuration, and the agent activity that produced it.

## `/documents`

### Page Purpose

Let users upload source documents, monitor ingestion progress, and manage the tenant-scoped document collection.

### Primary User Goal

Understand document ingestion status at a glance and open a document to inspect parsed Markdown and chunks.

### Layout Description

Use a compact operational table as the primary surface. The page header should include the title, short context, and upload action. The table should prioritize document name, type, upload date, ingestion status, progress, and last update. The upload modal should expose supported file types and live ingestion progress after upload.

### Key UI Regions

- Page header with Upload document primary action.
- Optional search/filter row prepared for document name and status filtering.
- Document table/list with tenant-scoped rows.
- Status badges for queued, parsing, chunking, embedding, storing, complete, and failed.
- Progress indicator for active jobs.
- Row action to open document detail.
- Upload modal with file picker, validation, and progress feedback.

### Recommended Components

- App shell.
- Page header.
- Table.
- Status badge.
- Progress bar.
- File upload input.
- Modal.
- Inline alert.
- Empty state panel.

### States

- Empty: no documents yet; primary action is upload.
- Loading: stable table skeleton.
- Uploading/processing: active job row updates without layout shift.
- Error: failed upload or failed ingestion with visible reason and retry/reupload guidance.
- Success: completed documents are clearly openable and marked complete.

### Enterprise Polish Details

- Make ingestion status durable and central, not hidden in a toast.
- Failed rows should look recoverable, not terminally broken.
- Use concise status labels that map to backend job stages.
- Keep row heights stable as progress changes.

### Mockup Emphasis

The mockup should emphasize operational clarity: users can scan a table and immediately know what is ready, running, or blocked.

## `/documents/[id]`

### Page Purpose

Allow users to inspect how an uploaded source document was parsed and chunked for retrieval.

### Primary User Goal

Validate ingestion quality by comparing parsed Markdown with the generated vector chunks.

### Layout Description

Use a split inspection view. A compact document header spans the top with filename, status, upload date, parse metadata, and any job warning. Below, the left pane shows parsed Markdown and the right pane shows searchable chunks. On desktop, panes sit side by side. On mobile, use tabs for Markdown and Chunks.

### Key UI Regions

- Document metadata header with status and source details.
- Left Markdown pane with readable document rendering.
- Right chunks pane with keyword search, chunk count, and ordered chunk list.
- Chunk rows/cards with index, token/character metadata if available, and text preview.
- Failure or partial-ingestion banner when parsed content or chunks are unavailable.
- Back navigation to documents.

### Recommended Components

- App shell.
- Page header.
- Split pane layout.
- Markdown viewer.
- Search input.
- Chunk list.
- Status badge.
- Alert banner.
- Tabs for small screens.

### States

- Empty: document exists but parsed content or chunks are not available yet.
- Loading: split-pane skeletons keep dimensions stable.
- Processing: show current ingestion stage and disable assumptions about chunk availability.
- Error: unauthorized or failed document state with clear return path.
- Success: Markdown and chunks render together for inspection.

### Enterprise Polish Details

- The split view is a trust surface and should look precise.
- Chunk order and search matches must be visually easy to track.
- Use line length constraints in Markdown so dense source content remains readable.
- Avoid turning each chunk into oversized decorative cards; favor compact inspection rows.

### Mockup Emphasis

The mockup should emphasize source-to-retrieval transparency: users can see what the system will search and why.

## `/settings`

### Page Purpose

Let users configure providers, embeddings, Pinecone, LangSmith, and MCP connections without exposing stored secrets.

### Primary User Goal

Save required configuration, verify connection readiness, and understand what is missing before ingestion or chat fails.

### Layout Description

Use grouped configuration sections in a single settings surface. A left-side section index can help on desktop, with the main area containing provider groups. Each group should show saved/configured state, masked secret values, validation messages, and connection test results where supported.

### Key UI Regions

- Page header with save state and global configuration readiness.
- Section index for Google, embeddings, Pinecone, LangSmith, and MCP.
- Google Gemini API key section.
- Embedding model selector/input.
- Pinecone index, environment/host, and namespace explanation.
- LangSmith key and tracing toggle or configured state.
- MCP server list with add/edit connection flow.
- Save action, per-section validation, and connection/test status.

### Recommended Components

- App shell.
- Settings section panel.
- Text input.
- Password/secret input with masked saved value.
- Select.
- Toggle.
- Table or compact list for MCP servers.
- Status badge.
- Inline alert.
- Save bar or page-level action row.

### States

- Empty: no settings saved; highlight required minimum for chat and ingestion.
- Loading: existing settings loading with stable section skeletons.
- Error: validation or connection failure with remediation guidance.
- Partial: optional services missing but core functionality configured.
- Success: saved settings show configured state without exposing plaintext secrets.

### Enterprise Polish Details

- Never display stored secrets in full after save.
- Distinguish required configuration from optional observability.
- Surface missing settings before users encounter failures in chat or ingestion.
- MCP should feel controlled and explicit: server name, connection state, available tools summary, and credential status.

### Mockup Emphasis

The mockup should emphasize configurable intelligence with safe secret handling and clear readiness signals.

## Implementation Guardrails

- Keep future UI implementation in Next.js, TypeScript, Tailwind CSS, and local components.
- Do not add a third-party UI kit without a new explicit task.
- Do not add marketing pages, pricing pages, landing pages, or a dashboard from this catalog.
- Preserve tenant isolation language wherever document, chat, settings, or tool state could be confused across users.
- Prioritize transparency surfaces: ingestion progress, parsed Markdown, chunks, thinking states, tool calls, and configuration readiness.
