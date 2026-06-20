# Frontend

## Stack

- Next.js with TypeScript.
- Tailwind CSS for all styling and reusable UI components.
- Local project components only for the bootstrap plan; do not add shadcn/ui, Flowbite, DaisyUI, or another component library without a new explicit task.

## UI Structure

- `/auth/sign-in` and `/auth/sign-up`: email/password authentication.
- `/chat`: chat sessions sidebar, model selector, thinking-level selector, streaming messages, and tool-call/thinking UI.
- `/documents`: uploaded document table/list, status, and upload modal.
- `/documents/[id]`: Markdown/chunk split view with keyword search.
- `/settings`: provider, Pinecone, LangSmith, embedding model, and MCP configuration.

## Component Conventions

- Build reusable Tailwind primitives for buttons, inputs, textareas, selects, tables, modals, navigation, panels, and status badges.
- Controls must have visible focus states and accessible labels.
- Use restrained layouts suitable for operations dashboards.
- Avoid nested cards, oversized hero sections, and decorative background effects.
- Keep fixed-format UI elements dimensionally stable across desktop and mobile.

