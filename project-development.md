# HB Transcription — Project Development Guide

## Overview

Audio transcription web app built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and AssemblyAI pre-recorded speech-to-text. Users upload audio files (MP3, WAV, M4A, AAC), receive transcriptions, and can auto-clip highlighted moments via trigger-phrase detection and FFmpeg.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.2.4 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS (with `@tailwindcss/postcss`) | 4.x |
| UI Primitives | ShadCN CLI (`base-nova` preset, Base UI primitives) | 4.6.x |
| Language | TypeScript | 5.x |
| Transcription | AssemblyAI pre-recorded STT | universal-3-pro with universal-2 fallback |
| PostCSS | `@tailwindcss/postcss` (v4 plugin) | 4.x |

## Running Locally

```bash
npm install
npm run dev      # development server at localhost:3000, using Webpack fallback
npm run dev:turbo # development server using the Next.js 16 Turbopack default
npm run build    # production build
npm run start    # production server at localhost:3000
npm run lint     # eslint
```

The AssemblyAI API key lives in `.env.local` (gitignored):

```
ASSEMBLYAI_API_KEY=...
```

## Architecture

### Directory Structure

```
app/
  layout.tsx           — Root layout, imports globals.css
  page.tsx             — Main page, orchestrates all components
  globals.css          — Tailwind v4 + ShadCN token setup
  api/
    transcribe/
      route.ts         — POST endpoint, uploads audio to AssemblyAI and starts a job
      [id]/
        route.ts       — GET endpoint, polls AssemblyAI and returns normalised transcript
    clip/
      route.ts         — POST endpoint, FFmpeg-based audio clipping

components/
  ui/                  — ShadCN-generated UI primitives
  AudioUploader.tsx    — Drag-and-drop + browse file upload
  AudioPlayer.tsx      — HTML5 audio playback with metadata display
  TranscriptDisplay.tsx— Transcript result with copy/clear + clip suggestions
  SettingsPanel.tsx    — AssemblyAI key note + optional language config (modal content)

lib/
  utils.ts             — ShadCN `cn()` helper (`clsx` + `tailwind-merge`)
  assemblyai.ts        — AssemblyAI upload/submit/poll helpers + transcript normalisation
  triggers.ts          — Trigger phrase matching, ClipSuggestion generation

types/
  index.ts             — AudioFile, TranscriptResult, Segment, ClipSuggestion, job response types
```

### Data Flow

1. User uploads audio via `AudioUploader` → `AudioFile` object created with file metadata and duration
2. User clicks "Find Gold" → `page.tsx` sends the selected file as the raw request body to `/api/transcribe`, with optional language in the query string
3. Server route reads `ASSEMBLYAI_API_KEY`, streams the file to AssemblyAI `/v2/upload`, then submits `/v2/transcript` with `speech_models: ["universal-3-pro", "universal-2"]`
4. Client polls `/api/transcribe/[id]` while AssemblyAI returns `queued` or `processing`
5. On completion, the polling route fetches `/v2/transcript/{id}` plus `/v2/transcript/{id}/sentences`, normalises sentence timestamps into the app's `Segment[]`, and returns `TranscriptResult`
6. If segments contain trigger phrases, clip suggestions appear. User clicks "Clip" → POST to `/api/clip` with the original file + start/end → FFmpeg trims → downloaded as MP3/M4A

### Settings State Management

Settings currently consist of optional language only. They are managed in `page.tsx` as lifted state, passed down to `SettingsPanel` as props. On change they are:
- Updated in React state
- Persisted to `localStorage` under `transcription_settings`

The settings panel can store a local AssemblyAI key note under `assemblyai_api_key`, but the transcription route reads only from `.env.local`; browser-stored keys are not sent to the server.

### API Route — `/api/transcribe`

- Reads the raw request body as audio
- Reads `ASSEMBLYAI_API_KEY` from `process.env`
- Reads optional `language` from the query string
- Delegates upload and submit to `lib/assemblyai.ts`
- Returns `{ transcriptId, status }`

### API Route — `/api/transcribe/[id]`

- Reads `ASSEMBLYAI_API_KEY` from `process.env`
- Polls `GET /v2/transcript/{id}`
- Returns pending statuses directly
- On completion, fetches sentences and returns the app's normalised `TranscriptResult`

### AssemblyAI Integration — `lib/assemblyai.ts`

`startTranscriptionJob()` uploads raw audio to AssemblyAI, submits a transcript job, and returns the transcript ID. `getTranscriptionJobStatus()` polls the job, fetches sentence-level timing on completion, and normalises AssemblyAI's millisecond timestamps into the app's second-based `Segment` shape. **Clip suggestions depend on these normalised segments.**

### Settings Modal

Settings live in a modal (not inline). Opens via "Settings" button in the page header, closes via backdrop click, X button, or Escape key. `SettingsPanel` returns inner content only (no card wrapper) — the modal shell is provided by `page.tsx`.

### Trigger-Phrase Audio Clipper

Uses AssemblyAI sentence-level timestamps to auto-detect highlights and clip them.

**Trigger phrases** (defined in `lib/triggers.ts`): "that's gold", "thats gold", "clip that", "clip it", "that's perfect", "thats perfect", "beautiful", "that's the one", "thats the one", "save that", "save it", "that's a clip", "thats a clip", "gold".

**Matching logic** (`findClipSuggestions`):
- Case-insensitive substring match against each segment's text
- Each segment can only match once (deduplicated by segment index)
- Individual trigger matches are sorted chronologically, then nearby matches are merged before final clips are returned
- Triggers within 30 seconds of the latest trigger already in a group become one clip
- Merged clip window: `max(0, earliestMatch.start - 30s)` to `min(fileDuration, latestMatch.end + 30s)`
- Filename: slugified text from the matched segment +/- one neighbour segment (max 60 chars, `.mp3` extension)

**Clip download flow**:
1. `TranscriptDisplay` shows a green "Clips Found" panel with each match's quote, trigger phrase, and timestamp range
2. User clicks "Clip" → POST to `/api/clip` with `file`, `clipStart`, `clipEnd`, `filename`
3. `/api/clip/route.ts` writes file to `/tmp`, runs FFmpeg to trim and encode the result as browser-playable MP3, then streams the result back as `audio/mpeg`. Downloads include `Content-Disposition: attachment`; in-browser previews omit it.
4. Temp files cleaned up in `finally` block

**API Route — `/api/clip`**:
- Accepts: `file` (File), `clipStart` (float, seconds), `clipEnd` (float, seconds), `filename` (string)
- Returns: audio file binary with download headers
- FFmpeg path: `/opt/homebrew/bin/ffmpeg` (macOS Homebrew)
- 30-second timeout on FFmpeg process

## Design System

Defined in `app/globals.css` using Tailwind v4 `@theme` blocks and ShadCN-compatible CSS variables. ShadCN is installed with `components.json`, `lib/utils.ts`, and generated primitives in `components/ui/`.

### ShadCN UI Direction

- Prefer ShadCN primitives for new design elements. Generated primitives live under `components/ui/`; keep app-specific composed components in `components/`.
- Current ShadCN preset: `base-nova`, `rsc: true`, `tsx: true`, icon library `lucide`, Tailwind v4 config path intentionally blank in `components.json`.
- Installed primitives: `button`, `card`, `dialog`, `badge`, `separator`, `select`, `input`, `label`, `textarea`, and `scroll-area`.
- Add more primitives with `npx shadcn@latest add <component>`. Do not hand-roll a local primitive if an appropriate ShadCN primitive exists.
- Use semantic classes/tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-primary-foreground`, `ring-ring`, `bg-muted`, `text-muted-foreground`) instead of one-off hex values.
- Keep the current Goldfish aliases (`bg-surface`, `bg-surface-card`, `text-primary-hover`, `bg-primary-wash`, etc.) only for existing UI or app-specific brand states. New reusable primitives should use the ShadCN token names.
- This repo uses Tailwind CSS v4 with no `tailwind.config.ts`; do not add Tailwind v3 configuration for ShadCN. Configure tokens through `app/globals.css`.
- Preserve the existing `@import "tailwindcss"`, `@import "tw-animate-css"`, and `@import "shadcn/tailwind.css"` order in `globals.css`.
- If the CLI updates theme variables, map them back into the Goldfish `:root` palette rather than accepting the neutral default palette.

### Colour Tokens

| ShadCN Token | Hex | Current Usage |
|---|---|---|
| `background` | `#FFF8EF` | Page background |
| `foreground` | `#111827` | Primary text |
| `card` | `#FFFDF9` | Card/panel surfaces |
| `popover` | `#FFFCF7` | Elevated/modal/input surfaces |
| `primary` | `#F97316` | Main actions |
| `primary-foreground` | `#FFFFFF` | Text/icons on primary actions |
| `secondary` | `#FFF1E3` | Secondary warm surfaces |
| `muted` | `#FFF7ED` | Muted backgrounds and audio controls |
| `muted-foreground` | `#8A8178` | Tertiary text/captions |
| `accent` | `#FFE8D1` | Soft highlight states |
| `accent-foreground` | `#EA580C` | Text on accent surfaces |
| `destructive` | `#D07080` | Error/delete states |
| `border` / `input` | `#EADFD3` | Borders, separators, input outlines |
| `ring` | `#F97316` | Focus rings |

### Typography

- **Display (brand/headings)**: `Playfair Display`, falling back to `Georgia, "Times New Roman", serif` — applied via `font-[family-name:var(--font-display)]`
- **Body/UI**: `Inter`, falling back to `system-ui, -apple-system, sans-serif` — set on `<body>` via `globals.css`
- **Handwritten accent**: `Caveat`, available as `var(--font-hand)` for brand accents only

### Border Radius Convention

- ShadCN semantic radius starts at `--radius: 16px` and exposes `--radius-sm`, `--radius-md`, `--radius-lg`, and `--radius-xl` through Tailwind v4.
- App-specific existing radii remain acceptable: `rounded-[14px]` for buttons/inputs, `rounded-[16px]` for cards/subcards, `rounded-[24px]` for the top fixed session card and modals.

### Tailwind v4 Notes

- No `tailwind.config.ts` — all tokens defined via `@theme` in `globals.css`
- PostCSS config is `postcss.config.mjs` using `@tailwindcss/postcss` (not `tailwindcss` directly)
- Use `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- ShadCN's Tailwind v4 support adds `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`, `@custom-variant dark`, and `@theme inline`
- ShadCN-compatible colours are available as utility classes: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-primary`, `text-primary-foreground`, `border-border`, `ring-ring`, etc.

## Key Decisions & Gotchas

- **Tailwind v3 vs v4**: This project was initially scaffolded with v3 conventions (`tailwind.config.ts`, `@tailwind` directives, `postcss.config.js`). These were migrated to v4. Do not reintroduce v3 patterns.
- **No `tailwind.config.ts`**: It was removed. All theme tokens live in `globals.css` `@theme`.
- **ShadCN is installed**: Use `components.json` and `npx shadcn@latest add <component>` for additional primitives. Keep generated primitives in `components/ui/`.
- **Only `postcss.config.mjs`**: A `postcss.config.js` using the old `tailwindcss` plugin existed and caused build errors. Do not recreate it.
- **Development bundler**: Next.js 16 uses Turbopack by default, but this machine has shown runaway Node process spawning on the first browser request under Turbopack. `npm run dev` uses `next dev --webpack` as a stable local fallback. Use `npm run dev:turbo` only when testing Turbopack-specific behavior.
- **Turbopack root**: `next.config.ts` explicitly sets `turbopack.root` to the repository root. This avoids Next inferring `/Users/hughbarton` because that parent directory also contains a `package-lock.json`, which would expand filesystem watching.
- **Object URL memory leaks**: `AudioPlayer` uses `useMemo` + cleanup `useEffect` to revoke blob URLs. If you add more `createObjectURL` calls, always pair with `revokeObjectURL`.
- **SSR and localStorage**: `SettingsPanel` reads localStorage in `useEffect` (not at module/component level) to avoid SSR errors. Any new localStorage access must follow this pattern.
- **Function ordering**: `AudioUploader` had `handleDrop` defined before `handleFileSelect` causing a TypeScript "used before declaration" error. Keep `handleFileSelect` above `handleDrop`.
- **AssemblyAI job flow**: `/api/transcribe` starts the job and `/api/transcribe/[id]` polls. Keep this split so long audio does not depend on one long transcription request.
- **AssemblyAI auth**: REST requests use `Authorization: ASSEMBLYAI_API_KEY` with no `Bearer` prefix.
- **AssemblyAI timestamps**: Sentence timestamps are returned in milliseconds and normalised to seconds before clip detection.

## Future Work / Known Gaps

1. **Client API key passthrough**: The settings panel lets users save an API key to localStorage, but `/api/transcribe` reads exclusively from `process.env.ASSEMBLYAI_API_KEY`. To support client-provided keys, the route would need to accept the key from the request body or a header with appropriate security considerations.
2. **Direct-to-storage upload path**: Proxying 1-2 GB files through the Next server works locally but may not fit all hosted deployment limits. A future production path could upload to object storage first and submit a URL to AssemblyAI.
3. **Light mode**: The design system defines light-mode tokens (stone*, ink900 as text on white) but the app is dark-mode only. A `useColorScheme` toggle could be added.
4. **Progress indication**: Polling shows job status, but upload percentage and estimated completion time would improve long-session UX.
5. **Batch transcription**: Support uploading multiple files at once.
6. **Export formats**: Allow downloading transcript as .txt, .srt, or .json files.
7. **Clip format preservation**: Clips are intentionally output as `.mp3`/`.m4a` for browser preview compatibility. If broader format preservation is needed later, add a separate download format option.
8. **FFmpeg path portability**: Hardcoded to `/opt/homebrew/bin/ffmpeg`. On Linux or other machines this path differs. Should detect or make configurable.
