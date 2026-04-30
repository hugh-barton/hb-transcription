# Goldfish / HB Transcription — Project Development Guide

## Overview

Goldfish is a music-session transcription and highlight-finding web app. The current build is a Next.js 16 App Router app where users upload a long audio session, review the selected file, click **Find Gold**, and receive an AssemblyAI-generated transcript plus downloadable clip suggestions based on trigger phrases.

The product direction is focused on a polished single-session workflow:

1. Upload a session from the home page.
2. Review file details before analysis.
3. Send the file to AssemblyAI pre-recorded speech-to-text.
4. Poll the transcription job while showing a branded loading state.
5. Detect exciting moments from transcript segments.
6. Preview and download clipped highlights as MP3 or M4A.

This app no longer uses Whisper. Transcription is handled by AssemblyAI through the server routes in `app/api/transcribe`.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.2.4 |
| UI | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS with `@tailwindcss/postcss` | 4.x |
| UI Primitives | ShadCN CLI, `base-nova` preset, Base UI primitives | 4.6.x |
| Icons | Lucide React plus a few local inline SVGs | 1.14.x |
| Transcription | AssemblyAI pre-recorded STT | `universal-3-pro` with `universal-2` fallback |
| Audio clipping | FFmpeg via API route | Homebrew path locally |

## Running Locally

```bash
npm install
npm run dev       # development server with Webpack fallback
npm run dev:turbo # Next.js 16 Turbopack dev server
npm run build     # production build
npm run start     # production server
npm run lint      # eslint
```

The AssemblyAI API key lives in `.env.local`:

```env
ASSEMBLYAI_API_KEY=...
```

Current local note: `npm run dev` intentionally uses `next dev --webpack`. Turbopack can still be tested with `npm run dev:turbo`, but Webpack has been the more stable local development path on this machine.

## Architecture

### Directory Structure

```text
app/
  layout.tsx             — Root layout, font setup, metadata, globals import
  page.tsx               — Main client page, app shell, settings modal, job orchestration
  globals.css            — Tailwind v4, ShadCN tokens, Goldfish palette, app animations
  api/
    transcribe/
      route.ts           — Starts an AssemblyAI transcription job
      [id]/
        route.ts         — Polls AssemblyAI and returns normalized transcript data
    clip/
      route.ts           — FFmpeg-based clip creation and download endpoint

assets/
  Goldfish-Icon.png
  water-ripples.png      — Current main upload/review/loading panel background
  watter-ripples-transparent.png
  ...other brand/reference assets

components/
  ui/                    — ShadCN-generated primitives
  AudioUploader.tsx      — Upload, file review, loading, transcript modal, clip results/downloads
  ClipPreview.tsx        — In-browser clip preview player using `/api/clip`
  SettingsPanel.tsx      — Settings modal content
  AudioPlayer.tsx        — Older reusable audio player component, not central to the current home flow
  TranscriptDisplay.tsx  — Older transcript/clip display component, not central to the current home flow

lib/
  assemblyai.ts          — AssemblyAI upload/submit/poll helpers and transcript normalization
  triggers.ts            — Trigger phrase matching and clip suggestion generation
  utils.ts               — ShadCN `cn()` helper

types/
  index.ts               — Shared AudioFile, transcript, segment, clip, and job response types
```

### Current User Flow

1. User lands on the Goldfish home page with sidebar/header chrome and a large dashed upload panel over the pale water-ripples background.
2. User clicks **Upload Session** or drops an audio file.
3. `AudioUploader` validates file type/size and creates an `AudioFile` object:
   - Always stores file, name, size, MIME type, duration when the browser can read it, file extension format, and last modified date.
   - Attempts lightweight WAV/AIFF header parsing for sample rate, channels, and bit depth.
   - Uses `Unknown` in the review UI for rich metadata that cannot be read cheaply, such as many MP3/M4A files.
4. User sees the review screen: **“We’ve got your file!”**, file summary, decorative waveform, metadata rows, **Choose a Different File**, and **Find Gold**.
5. User clicks **Find Gold**.
6. `page.tsx` POSTs the selected file as the raw request body to `/api/transcribe`, with optional language as a query parameter.
7. Server uploads the audio to AssemblyAI `/v2/upload`, then submits a `/v2/transcript` job using `speech_models: ["universal-3-pro", "universal-2"]`.
8. Client polls `/api/transcribe/[id]` every 3 seconds while AssemblyAI returns `queued` or `processing`.
9. The loading state displays directly on the ripple background with a looping progress bar and rotating music/gold-themed messages.
10. On completion, the polling route fetches transcript and sentence data, normalizes AssemblyAI millisecond timestamps into second-based `Segment[]`, and returns `TranscriptResult`.
11. `AudioUploader` detects clip-worthy moments from trigger phrases, shows the **Gold Moment(s)** results page, and lets users preview/download clips as M4A or MP3.

## Main UI States

### Home / Empty Upload State

- Large dashed panel with `assets/water-ripples.png` as a CSS background.
- Centered document/audio icon, headline **“Ready to find your next exciting moment?”**, upload CTA, drag/drop hint, and capability pills.
- The lower placeholder **Recent Sessions** and homepage **Exciting Moments** cards were removed. Gold Moment results still appear after transcription.

### Uploaded File Review State

- Title: **“We’ve got your file!”**
- Subtitle: **“Review your session details before we get started.”**
- Shows a detailed file card with a decorative waveform preview, play-shaped visual affordance, file date, duration, size, format, sample rate, channels, and bit depth.
- **Choose a Different File** reopens the hidden file input and replaces the selected file.
- **Find Gold** starts the AssemblyAI job.
- Native audio controls are intentionally not shown on this pre-analysis screen.

### Transcription Loading State

- No card/rectangular container; content sits directly on the parent ripple background.
- Keeps **New Session** available so the user can cancel/reset the current run.
- Uses an indeterminate horizontal progress bar styled by `.goldfish-loading-progress` in `app/globals.css`.
- Cycles through 8 branded messages every 3 seconds:
  - “Panning for gold in your session...”
  - “Searching for your next big hit...”
  - “Digging through the grooves...”
  - “Mining your session for moments...”
  - “Listening for that golden take...”
  - “Sifting through the sound...”
  - “Your next hit is in there somewhere...”
  - “Goldfish is on the hunt...”

### Completed Results State

- Shows **New Session** and **View Transcript** actions.
- Transcript opens in a modal with copy support.
- Clip suggestions appear in a full-width **Gold Moment** / **Gold Moments** results page.
- The top summary card says **“We found 1 gold moment!”** or **“We found n gold moments!”**, shows the uploaded session filename/metadata, includes a decorative waveform, and has a presentational **View Full Session** button.
- Each moment card shows the native browser clip preview from `ClipPreview`, the matched transcript text, the timestamp and clip length, a working download button, an MP3/M4A selector, and a presentational kebab menu.
- The old peak score, trigger phrase label, and **Add to Session** action are intentionally omitted from the results cards.
- Results include a **Help us get smarter** feedback banner with a presentational **Rate Moment** button and keep the **Your audio is private and secure** footer.

## API Routes

### `/api/transcribe`

- Accepts a raw audio request body.
- Reads `ASSEMBLYAI_API_KEY` from `process.env`.
- Reads optional `language` from the query string.
- Delegates upload and job submission to `startTranscriptionJob()` in `lib/assemblyai.ts`.
- Returns `{ transcriptId, status }`.

### `/api/transcribe/[id]`

- Reads `ASSEMBLYAI_API_KEY` from `process.env`.
- Polls `GET /v2/transcript/{id}`.
- Returns `queued`/`processing` statuses directly.
- On completion, fetches `/v2/transcript/{id}/sentences`, normalizes sentence timestamps, and returns `TranscriptResult`.

### `/api/clip`

- Accepts multipart form data:
  - `file`
  - `clipStart`
  - `clipEnd`
  - `filename`
  - optional `format` (`m4a` default, `mp3` also supported)
  - optional `preview=true` to omit attachment headers
- Writes the uploaded source file to `/tmp`.
- Runs FFmpeg to trim the requested window and encode either:
  - M4A/AAC at 44.1 kHz stereo 192 kbps
  - MP3/libmp3lame at 44.1 kHz stereo 192 kbps
- Returns audio bytes with `Content-Type` and, for downloads, `Content-Disposition`.
- Cleans up temp files in `finally`.

## AssemblyAI Integration

`lib/assemblyai.ts` owns the provider contract:

- `startTranscriptionJob()` uploads raw audio to AssemblyAI, submits the transcript job, and returns the transcript ID/status.
- `getTranscriptionJobStatus()` polls job state and returns either pending, error, or completed transcript data.
- Completed jobs fetch both transcript and sentence data. Sentence data is required because trigger phrase clipping depends on segment-level timestamps.
- REST auth uses `Authorization: ASSEMBLYAI_API_KEY` with no `Bearer` prefix.

## Trigger-Phrase Audio Clipper

Trigger phrases are defined in `lib/triggers.ts`:

```text
"that's gold", "thats gold", "clip that", "clip it",
"that's perfect", "thats perfect", "beautiful",
"that's the one", "thats the one", "save that", "save it",
"that's a clip", "thats a clip", "gold"
```

Matching behavior:

- Case-insensitive substring match against each normalized transcript segment.
- Each segment can only match once.
- Matches are sorted chronologically.
- Nearby matches within 30 seconds are merged into one clip group.
- Clip window is `max(0, earliestMatch.start - 30s)` to `min(fileDuration, latestMatch.end + 30s)`.
- Suggested filenames are slugified from the matched segment plus nearby context and default to `.mp3` before the selected download format is applied.

## Settings

Settings are managed in `app/page.tsx` and shown via a modal around `SettingsPanel`.

- Current functional setting: optional AssemblyAI language code.
- Settings persist to `localStorage` under `transcription_settings`.
- Escape, backdrop click, and the X button close the modal.
- `SettingsPanel` also lets users store an AssemblyAI key note under `assemblyai_api_key`, but this is not used by transcription. Server routes only read `.env.local`.

## Design System

The app uses a warm Goldfish palette implemented as ShadCN-compatible CSS variables in `app/globals.css`.

### ShadCN / Tailwind Direction

- Tailwind CSS v4 is used without `tailwind.config.ts`.
- Do not reintroduce Tailwind v3 config or `@tailwind base/components/utilities`.
- Keep the global import order:
  - `@import "tailwindcss";`
  - `@import "tw-animate-css";`
  - `@import "shadcn/tailwind.css";`
- ShadCN primitives live in `components/ui/`.
- Add primitives with `npx shadcn@latest add <component>`.
- Use semantic tokens such as `background`, `foreground`, `card`, `primary`, `muted`, `border`, `input`, and `ring`.
- Preserve the Goldfish palette if the ShadCN CLI touches theme variables.

### Current Brand/UI Direction

- Warm light UI, not dark-only.
- Sidebar/header shell uses the Goldfish icon and warm orange active states.
- Main task surface is a large ripple-backed upload/review/results panel.
- Display headings use Playfair Display via `var(--font-display)`.
- UI/body text uses Inter via `var(--font-body)`.
- Buttons use the existing orange gradient `.primary-button`.
- `app/globals.css` also defines `.goldfish-loading-progress` for the transcription loading bar.

### Core Tokens

| Token | Hex | Usage |
|---|---|---|
| `background` | `#FFF8EF` | Page background |
| `foreground` | `#111827` | Primary text |
| `card` | `#FFFDF9` | Card/panel surfaces |
| `popover` | `#FFFCF7` | Modal/input/elevated surfaces |
| `primary` | `#F97316` | Main actions and progress |
| `primary-hover` | `#EA580C` | Brand text/action hover |
| `primary-soft` | `#FFE8D1` | Active/soft highlight |
| `primary-wash` | `#FFF1E3` | Warm wash backgrounds |
| `muted` | `#FFF7ED` | Muted surfaces |
| `muted-foreground` | `#8A8178` | Tertiary text |
| `border` / `input` | `#EADFD3` | Borders and inputs |
| `destructive` | `#D07080` | Error states |

## Key Decisions & Gotchas

- **AssemblyAI, not Whisper**: Keep provider-specific logic in `lib/assemblyai.ts` and API routes. Do not reintroduce Whisper assumptions.
- **Job split**: `/api/transcribe` starts jobs; `/api/transcribe/[id]` polls. Keep this split for long audio.
- **No client API key passthrough**: LocalStorage API-key text is informational only. Server routes use `.env.local`.
- **Large file constraints**: Client validation follows AssemblyAI's 2.2 GB upload limit. Hosted deployments may have stricter request limits.
- **Audio metadata is best effort**: Browser duration and lightweight WAV/AIFF header parsing are used. MP3/M4A rich details often show `Unknown`.
- **Object URLs**: Any new `URL.createObjectURL()` call must be paired with `URL.revokeObjectURL()`.
- **FFmpeg path**: `/api/clip` currently uses `/opt/homebrew/bin/ffmpeg`.
- **Clip route formats**: M4A is the default download format, with MP3 selectable in the UI.
- **Next 16 docs**: This repo’s `AGENTS.md` warns that Next.js APIs/conventions may differ; check `node_modules/next/dist/docs/` before changing Next-specific behavior.
- **Dev server quirks**: A stale Node listener on port 3000 has appeared during local work. Avoid killing it unless explicitly requested; use another explicit port for testing when needed.

## Future Work / Known Gaps

1. **Browser QA of full upload flow**: Automated visual verification is still limited by local dev server process issues.
2. **Hosted upload strategy**: Proxying very large files through Next may not work on every host. A production path may need direct-to-object-storage uploads before submitting a URL to AssemblyAI.
3. **Real progress**: The loading bar is indeterminate. Upload percentage and estimated transcription completion would improve long-session UX.
4. **Client API key passthrough**: Supporting user-provided keys would require sending a key to the server with clear security boundaries.
5. **FFmpeg portability**: Detect FFmpeg or make the path configurable for Linux/CI/deployment.
6. **Transcript exports**: Add `.txt`, `.srt`, or `.json` downloads.
7. **Batch transcription**: Support multiple uploaded sessions.
8. **Persistent sessions**: The sidebar has Sessions/Moments/Downloads placeholders, but there is no persistence or navigation behind them yet.
9. **More robust audio metadata**: Add dedicated metadata parsing for MP3/M4A if richer review details become important.
