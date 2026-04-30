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
