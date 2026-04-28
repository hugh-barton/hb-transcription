"use client";

import { useState, useEffect } from "react";
import AudioUploader from "@/components/AudioUploader";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import SettingsPanel from "@/components/SettingsPanel";
import { AudioFile, TranscriptResult } from "@/types";

export default function Home() {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<{
    model: string;
    language: string;
    responseFormat: "json" | "text" | "srt" | "verbose_json";
  }>({
    model: "whisper-1",
    language: "",
    responseFormat: "verbose_json",
  });

  useEffect(() => {
    const saved = localStorage.getItem("transcription_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!showSettings) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSettings(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSettings]);

  const handleSettingsChange = (updated: typeof settings) => {
    setSettings(updated);
    localStorage.setItem("transcription_settings", JSON.stringify(updated));
  };

  const handleTranscribe = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", settings.model);
      formData.append("response_format", settings.responseFormat);
      if (settings.language) {
        formData.append("language", settings.language);
      }

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();
      setTranscript(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setAudioFile(null);
    setTranscript(null);
    setError(null);
  };

  const handleAudioLoaded = (file: AudioFile) => {
    setAudioFile(file);
    setTranscript(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-ink100 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2 text-center flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-normal leading-tight tracking-tight text-ink900">
              Audio Transcription
            </h1>
            <p className="text-ink700 text-base leading-relaxed">
              Upload audio files and get transcriptions using OpenAI Whisper
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="ml-4 shrink-0 rounded-[14px] border border-ink500 bg-ink300 px-4 py-2 text-sm font-medium text-ink800 transition-all duration-300 hover:border-sapphire400 hover:text-sapphire300"
          >
            Settings
          </button>
        </div>

        <div className="grid gap-6">
          <AudioUploader
            onAudioLoaded={handleAudioLoaded}
            onTranscribe={handleTranscribe}
            loading={loading}
          />

          {audioFile && !transcript && (
            <div className="rounded-[20px] border border-ink500 bg-ink300 p-6">
              <h2 className="mb-4 text-xl font-semibold text-ink900">
                Audio Preview
              </h2>
              <TranscriptDisplay
                transcript={null}
                audioFile={audioFile}
              />
            </div>
          )}

          {audioFile && transcript && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[20px] border border-ink500 bg-ink300 p-6">
                <h2 className="mb-4 text-xl font-semibold text-ink900">
                  Audio Preview
                </h2>
                <TranscriptDisplay
                  transcript={null}
                  audioFile={audioFile}
                />
              </div>

              <div className="rounded-[20px] border border-ink500 bg-ink300 p-6">
                <h2 className="mb-4 text-xl font-semibold text-ink900">
                  Transcript Result
                </h2>
                <TranscriptDisplay
                  transcript={transcript}
                  audioFile={audioFile}
                  onClear={handleClear}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-[14px] border border-rose bg-ink200 p-6">
            <h3 className="mb-2 text-lg font-semibold text-rose">
              Error
            </h3>
            <p className="text-ink700">{error}</p>
          </div>
        )}

      </div>

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[10vh]"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-[20px] border border-ink500 bg-ink300 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSettings(false)}
              className="absolute right-4 top-4 text-ink600 transition-colors duration-200 hover:text-ink900"
              aria-label="Close settings"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            </button>
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        </div>
      )}
    </main>
  );
}
