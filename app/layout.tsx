import "./globals.css";

export const metadata = {
  title: "Audio Transcription App",
  description: "Transcribe audio files using OpenAI Whisper API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
