# Audio Transcription App

A simple audio transcription app built with Next.js and AssemblyAI. Upload long music sessions, transcribe them with AssemblyAI pre-recorded speech-to-text, and auto-detect clip-worthy moments from trigger phrases.

## Features

- **Large session uploads**: Supports files up to AssemblyAI's 2.2 GB upload limit
- **Multi-format support**: Upload MP3, WAV, M4A, or AAC audio files
- **Job-based transcription**: Uploads, submits, and polls AssemblyAI transcript jobs
- **Audio preview**: Preview audio before transcription
- **Clip detection**: Finds trigger phrases and generates downloadable audio clips
- **Copy to clipboard**: Copy completed transcripts for sharing

## Prerequisites

- Node.js 18+ installed
- AssemblyAI API key from [assemblyai.com/dashboard/api-keys](https://www.assemblyai.com/dashboard/api-keys)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your AssemblyAI API key:
   - Copy `.env.local.example` to `.env.local`
   - Add your API key:
     ```bash
     ASSEMBLYAI_API_KEY=your-assemblyai-api-key-here
     ```

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), upload an audio file, and click "Find Gold".

## Configuration

- The transcription route reads `ASSEMBLYAI_API_KEY` from `.env.local`.
- The settings modal includes an optional language code. Leave it empty to let AssemblyAI route the transcription automatically.
- The active speech model list is `universal-3-pro` with `universal-2` fallback.

## Supported Formats

- MP3
- WAV
- M4A
- AAC

## Development

The app is built with:

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- AssemblyAI pre-recorded STT

## Troubleshooting

- If you get API key errors, make sure `.env.local` exists and contains `ASSEMBLYAI_API_KEY`.
- If transcription fails, check that your AssemblyAI account has access and balance.
- Supported upload size is up to 2.2 GB via AssemblyAI's upload endpoint.
