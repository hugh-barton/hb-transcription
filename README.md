# Audio Transcription App

A simple and elegant audio transcription app built with Next.js and OpenAI Whisper API.

## Features

- **Multi-format Support**: Upload MP3, WAV, or M4A audio files
- **Client-side Processing**: All transcription happens in your browser
- **Audio Preview**: Preview audio before and after transcription
- **Clean UI**: Modern, responsive design with Tailwind CSS
- **Settings Management**: Configure API keys and model parameters
- **Copy to Clipboard**: Easily copy transcriptions for sharing

## Prerequisites

- Node.js 18+ installed
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your OpenAI API key:
   - Copy `.env.local.example` to `.env.local` (or create `.env.local` manually)
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=sk-your-actual-api-key-here
     ```

## Running the App

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Upload an audio file and click "Transcribe" to get started

## Configuration

### API Key

- Enter your OpenAI API key in the Settings panel
- Key is stored locally in your browser (localStorage)
- Never sent to any server except OpenAI

### Model Selection

- **whisper-1** (default): Good balance of accuracy and speed
- **whisper-1-large-v2**: More accurate but slower

### Language Detection

- Optional: Specify language code (en, es, fr, de, etc.) to improve accuracy
- Leave empty for automatic detection

### Response Format

- **text**: Plain text output (recommended for reading)
- **json**: Structured JSON output (for programmatic access)
- **srt**: Subtitle format
- **verbose_json**: Detailed JSON with timestamps and more info

## Usage

1. **Upload**: Drag and drop or click "Browse Files" to select an audio file
2. **Preview**: Click the play button to preview your audio
3. **Transcribe**: Click the "Transcribe" button to process the audio
4. **Review**: Read and copy your transcription from the result panel
5. **Clear**: Click the trash icon to clear results and start fresh

## Supported Formats

- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- AAC (.aac)

## File Size Limit

Files must be under 25MB. Larger files will be rejected.

## Pricing

OpenAI Whisper pricing:
- ~$0.006 per minute of audio
- Free tier includes 60 minutes of transcription

## Development

The app is built with:
- Next.js 16+ (App Router)
- React 19
- TypeScript
- Tailwind CSS
- OpenAI API

## Troubleshooting

### API Key Issues
- Ensure your API key is valid and has credits
- Check that the API key is saved in the Settings panel
- Verify the API key format: `sk-...`

### File Upload Issues
- Ensure the file is in a supported format (MP3, WAV, M4A)
- Check file size (under 25MB)
- Try uploading a different file

### Transcription Errors
- Check your internet connection
- Verify API key has sufficient credits
- Try re-uploading the file
- Check the console for detailed error messages

## License

This project is open source and available for personal and commercial use.
