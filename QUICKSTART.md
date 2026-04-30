# Quick Start Guide

## 1. Setup API Key

Create a `.env.local` file in the project root:

```bash
ASSEMBLYAI_API_KEY=your-assemblyai-api-key-here
```

Get your API key from [assemblyai.com/dashboard/api-keys](https://www.assemblyai.com/dashboard/api-keys).

## 2. Start the Server

```bash
npm run dev
```

Or use the startup script:

```bash
./start.sh
```

## 3. Open in Browser

Visit [http://localhost:3000](http://localhost:3000).

## 4. Start Transcribing

1. Click "Browse Files" or drag and drop an audio file.
2. Wait for the file to load and preview.
3. Click "Find Gold".
4. Wait while AssemblyAI uploads, queues, and processes the transcript.
5. Copy the transcription or download detected clips when ready.

## Troubleshooting

- If you get API key errors, make sure `.env.local` exists and contains `ASSEMBLYAI_API_KEY`.
- Audio files can be up to AssemblyAI's 2.2 GB upload limit.
- Supported formats: MP3, WAV, M4A, AAC.
