# Quick Start Guide

## 1. Setup API Key

Create a `.env.local` file in the project root:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

Get your API key from [platform.openai.com](https://platform.openai.com)

## 2. Start the Server

```bash
npm run dev
```

Or use the startup script:

```bash
./start.sh
```

## 3. Open in Browser

Visit [http://localhost:3000](http://localhost:3000)

## 4. Start Transcribing

1. Click "Browse Files" or drag and drop an audio file
2. Wait for the file to load and preview
3. Click "Transcribe" button
4. Copy the transcription when ready

## Troubleshooting

- If you get API key errors, make sure `.env.local` exists and contains your API key
- Audio files must be under 25MB
- Supported formats: MP3, WAV, M4A

## Environment Variables

Create a `.env.local` file with your OpenAI API key:

```
OPENAI_API_KEY=sk-your-api-key-here
```

This key is stored locally in your browser and never sent to any server except OpenAI.
