<!-- BEGIN:goldfish-project-context-rules -->
# Goldfish Project Context Rules

At the start of each new chat context, read both `AGENTS.md` and `project-development.md` before making plans or code changes. Use `project-development.md` as the current product/architecture guide for Goldfish-specific workflow, UI, API, and gotcha context.

After large or behaviorally important changes, prompt the user to update `project-development.md` if it has not already been updated in the same work session. Prefer updating it directly when the user asks for documentation maintenance or when the change clearly alters documented behavior.
<!-- END:goldfish-project-context-rules -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:goldfish-ui-rules -->
# Goldfish UI / ShadCN Rules

ShadCN is installed. Use generated primitives from `components/ui/` for new design elements, and add more with `npx shadcn@latest add <component>` when needed. The project currently uses the `base-nova` preset with Base UI primitives, Lucide icons, React Server Components, TypeScript, and Tailwind CSS v4.

Prefer semantic tokens from `app/globals.css` such as `background`, `foreground`, `card`, `primary`, `primary-foreground`, `muted`, `muted-foreground`, `border`, `input`, and `ring`.

This repo uses Tailwind CSS v4 without `tailwind.config.ts`; do not reintroduce Tailwind v3 config for ShadCN. Add or adjust design tokens in `app/globals.css`, and keep reusable primitives under `components/ui/`. If the ShadCN CLI updates theme variables, preserve the Goldfish palette rather than accepting the default neutral palette.
<!-- END:goldfish-ui-rules -->
