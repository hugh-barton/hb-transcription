# HB Transcription — Project Development Guide

## Overview

Audio transcription web app built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and the OpenAI Whisper API. Users upload audio files (MP3, WAV, M4A, AAC), receive transcriptions, and can auto-clip highlighted moments via trigger-phrase detection and FFmpeg.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.2.4 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS (with `@tailwindcss/postcss`) | 4.x |
| Language | TypeScript | 5.x |
| Transcription | OpenAI Whisper API | whisper-1 |
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

The OpenAI API key lives in `.env.local` (gitignored):

```
OPENAI_API_KEY=sk-...
```

## Architecture

### Directory Structure

```
app/
  layout.tsx           — Root layout, imports globals.css
  page.tsx             — Main page, orchestrates all components
  globals.css          — Tailwind v4 @theme tokens (design system)
  api/
    transcribe/
      route.ts         — POST endpoint, forwards audio to OpenAI Whisper
    clip/
      route.ts         — POST endpoint, FFmpeg-based audio clipping

components/
  AudioUploader.tsx    — Drag-and-drop + browse file upload
  AudioPlayer.tsx      — HTML5 audio playback with metadata display
  TranscriptDisplay.tsx— Transcript result with copy/clear + clip suggestions
  SettingsPanel.tsx    — Model, language, response format config (modal content)

lib/
  openai.ts            — transcribeAudio() — calls OpenAI API, handles all response formats
  triggers.ts          — Trigger phrase matching, ClipSuggestion generation

types/
  index.ts             — AudioFile, TranscriptResult, Segment, ClipSuggestion, TranscriptionParams
```

### Data Flow

1. User uploads audio via `AudioUploader` → `AudioFile` object created with file metadata and duration
2. User clicks "Transcribe" → `page.tsx` constructs `FormData` with file + settings (model, language, response_format) and POSTs to `/api/transcribe`
3. Server route reads `OPENAI_API_KEY` from env, passes file + params to `lib/openai.ts`
4. `transcribeAudio()` calls OpenAI Whisper API, normalises the response into a `TranscriptResult` regardless of format. When `verbose_json` is used, the `segments` array (with per-segment timestamps) is included.
5. Client receives JSON, displays via `TranscriptDisplay`
6. If segments contain trigger phrases, clip suggestions appear. User clicks "Clip" → POST to `/api/clip` with the original file + start/end → FFmpeg trims → downloaded as MP3

### Settings State Management

Settings (model, language, responseFormat) are managed in `page.tsx` as lifted state, passed down to `SettingsPanel` as props. On change they are:
- Updated in React state
- Persisted to `localStorage` under `transcription_settings`

The API key is stored separately in `localStorage` under `openai_api_key` via `SettingsPanel`. Currently the server reads the key from `.env.local` only — the client-stored key is not forwarded to the API route. This is a known gap (see Future Work below).

### API Route — `/api/transcribe`

- Reads file from FormData
- Reads `OPENAI_API_KEY` from `process.env`
- Reads optional `model`, `language`, `response_format` from FormData
- Delegates to `transcribeAudio()` in `lib/openai.ts`
- Returns JSON `TranscriptResult`

### OpenAI Integration — `lib/openai.ts`

`transcribeAudio(file, apiKey, params)` handles all four Whisper response formats:
- `verbose_json` (default) — returns text, duration, model, language, and **segments** array
- `json` — returns text
- `text` — plain text string
- `srt` — subtitle format

The function normalises all formats into the same `TranscriptResult` shape. Non-JSON formats lose duration/language metadata and segments. **Clip suggestions only work with `verbose_json`** since segments are required for timestamps.

### Settings Modal

Settings live in a modal (not inline). Opens via "Settings" button in the page header, closes via backdrop click, X button, or Escape key. `SettingsPanel` returns inner content only (no card wrapper) — the modal shell is provided by `page.tsx`.

### Trigger-Phrase Audio Clipper

Uses Whisper's segment-level timestamps from `verbose_json` to auto-detect highlights and clip them.

**Trigger phrases** (defined in `lib/triggers.ts`): "that's gold", "thats gold", "clip that", "clip it", "that's perfect", "thats perfect", "beautiful", "that's the one", "thats the one", "save that", "save it", "that's a clip", "thats a clip", "gold".

**Matching logic** (`findClipSuggestions`):
- Case-insensitive substring match against each segment's text
- Each segment can only match once (deduplicated by segment index)
- Results sorted chronologically
- Clip window: `max(0, match.start - 30s)` to `min(fileDuration, match.end + 30s)`
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

Defined in `app/globals.css` using Tailwind v4 `@theme` blocks. Based on a custom dark-mode palette from a shared style guide (`~/Documents/General/Coding Projects/style-sheet.js`).

### Colour Tokens

| Token | Hex | Usage |
|---|---|---|
| `ink100` | `#0E0E10` | Page background (OLED-safe) |
| `ink200` | `#141416` | Input fields, metadata cards |
| `ink300` | `#1C1C1F` | Card/panel surfaces |
| `ink400` | `#2A2A2E` | Elevated surfaces |
| `ink500` | `#3A3A3F` | Borders, separators |
| `ink600` | `#5A5A62` | Secondary text |
| `ink700` | `#8A8A96` | Tertiary text, captions |
| `ink800` | `#C4C4CC` | Primary body text |
| `ink900` | `#F0F0F4` | Headings, high-emphasis text |
| `sapphire300` | `#5B7FA6` | Accent labels, focus rings |
| `sapphire400` | `#4A6D94` | Hover states |
| `sapphire500` | `#3A5A82` | Primary buttons, active states |
| `sapphire600` | `#2E4A6E` | Active button borders |
| `emerald` | `#52B88E` | Transcribe button, success states |
| `rose` | `#D07080` | Error panel, clear/delete buttons |
| `amber` | `#D4953A` | Warning/hint states (defined but unused) |

### Typography

- **Display (headings)**: `Georgia, "Times New Roman", serif` — applied via `font-[family-name:var(--font-display)]`
- **Body**: `"DM Sans", system-ui, -apple-system, sans-serif` — set on `<body>` via `globals.css`

### Border Radius Convention

- `rounded-[14px]` — buttons, inputs, inner cards
- `rounded-[20px]` — outer card panels, uploader, settings panel
- `rounded-full` — play/pause button only

### Tailwind v4 Notes

- No `tailwind.config.ts` — all tokens defined via `@theme` in `globals.css`
- PostCSS config is `postcss.config.mjs` using `@tailwindcss/postcss` (not `tailwindcss` directly)
- Use `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- Custom colours are available as utility classes: `bg-ink300`, `text-sapphire300`, etc.

## Key Decisions & Gotchas

- **Tailwind v3 vs v4**: This project was initially scaffolded with v3 conventions (`tailwind.config.ts`, `@tailwind` directives, `postcss.config.js`). These were migrated to v4. Do not reintroduce v3 patterns.
- **No `tailwind.config.ts`**: It was removed. All theme tokens live in `globals.css` `@theme`.
- **Only `postcss.config.mjs`**: A `postcss.config.js` using the old `tailwindcss` plugin existed and caused build errors. Do not recreate it.
- **Development bundler**: Next.js 16 uses Turbopack by default, but this machine has shown runaway Node process spawning on the first browser request under Turbopack. `npm run dev` uses `next dev --webpack` as a stable local fallback. Use `npm run dev:turbo` only when testing Turbopack-specific behavior.
- **Turbopack root**: `next.config.ts` explicitly sets `turbopack.root` to the repository root. This avoids Next inferring `/Users/hughbarton` because that parent directory also contains a `package-lock.json`, which would expand filesystem watching.
- **Object URL memory leaks**: `AudioPlayer` uses `useMemo` + cleanup `useEffect` to revoke blob URLs. If you add more `createObjectURL` calls, always pair with `revokeObjectURL`.
- **SSR and localStorage**: `SettingsPanel` reads localStorage in `useEffect` (not at module/component level) to avoid SSR errors. Any new localStorage access must follow this pattern.
- **Function ordering**: `AudioUploader` had `handleDrop` defined before `handleFileSelect` causing a TypeScript "used before declaration" error. Keep `handleFileSelect` above `handleDrop`.
- **Response format default**: Defaults to `verbose_json` to get duration, language, and model back from OpenAI. `text` format strips metadata.

## Future Work / Known Gaps

1. **Client API key passthrough**: The settings panel lets users save an API key to localStorage, but `/api/transcribe` reads exclusively from `process.env.OPENAI_API_KEY`. To support client-provided keys, the route would need to accept the key from the request body or a header (with appropriate security considerations).
2. **File size chunking**: OpenAI Whisper has a 25MB limit. Large files could be auto-split into segments before upload.
3. **Light mode**: The design system defines light-mode tokens (stone*, ink900 as text on white) but the app is dark-mode only. A `useColorScheme` toggle could be added.
4. **Progress indication**: The transcription request can be slow for long audio. A progress bar or polling mechanism would improve UX.
5. **Batch transcription**: Support uploading multiple files at once.
6. **Export formats**: Allow downloading transcript as .txt, .srt, or .json files.
7. **Clip format preservation**: Clips are intentionally output as `.mp3` for browser preview compatibility. If format preservation is needed later, add a separate download format option rather than changing preview output.
8. **Overlapping clip windows**: If two triggers are within 30s of each other, their clip windows will overlap. Could merge into a single clip or warn the user.
9. **FFmpeg path portability**: Hardcoded to `/opt/homebrew/bin/ffmpeg`. On Linux or other machines this path differs. Should detect or make configurable.
