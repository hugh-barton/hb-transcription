"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import AudioUploader from "@/components/AudioUploader";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import SettingsPanel from "@/components/SettingsPanel";
import { AudioFile, TranscriptResult } from "@/types";
import goldfishIcon from "../assets/Goldfish-Icon.png";

const navItems = [
  { label: "Home", icon: HomeIcon, active: true },
  { label: "Sessions", icon: WaveIcon, active: false },
  { label: "Moments", icon: StarIcon, active: false },
  { label: "Downloads", icon: DownloadIcon, active: false },
];

type TranscriptionSettings = {
  model: string;
  language: string;
  responseFormat: "json" | "text" | "srt" | "verbose_json";
};

const defaultSettings: TranscriptionSettings = {
  model: "whisper-1",
  language: "",
  responseFormat: "verbose_json",
};

function loadSavedSettings(): TranscriptionSettings {
  if (typeof window === "undefined") return defaultSettings;

  const saved = localStorage.getItem("transcription_settings");
  if (!saved) return defaultSettings;

  try {
    return { ...defaultSettings, ...JSON.parse(saved) };
  } catch {
    return defaultSettings;
  }
}

export default function Home() {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TranscriptionSettings>(
    loadSavedSettings,
  );

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
        throw new Error(
          errData.error || `Transcription failed: ${response.statusText}`,
        );
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
    <main className="min-h-screen bg-background text-text-primary">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-border bg-sidebar px-4 py-7 lg:flex lg:flex-col">
          <div className="mb-12 flex items-center gap-3 px-2">
            <Image
              src={goldfishIcon}
              alt=""
              width={54}
              height={54}
              className="h-[54px] w-[54px] object-contain"
              priority
            />
            <span className="font-[family-name:var(--font-display)] text-[32px] font-bold leading-none text-primary-hover">
              Goldfish
            </span>
          </div>

          <nav className="space-y-3" aria-label="Placeholder navigation">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`flex w-full items-center gap-4 rounded-[14px] px-4 py-4 text-left text-base font-medium transition-colors ${
                    item.active
                      ? "bg-primary-soft text-primary-hover"
                      : "text-text-secondary hover:bg-primary-wash"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="mt-auto flex w-full items-center gap-4 rounded-[14px] px-4 py-4 text-left text-base font-medium text-text-secondary transition-colors hover:bg-primary-wash hover:text-primary-hover"
          >
            <SettingsIcon className="h-5 w-5" />
            Settings
          </button>
        </aside>

        <section className="min-w-0">
          <header className="flex items-center justify-between border-b border-border bg-surface/80 px-4 py-4 backdrop-blur md:px-8 lg:justify-end lg:px-9">
            <div className="flex items-center gap-2 lg:hidden">
              <Image
                src={goldfishIcon}
                alt=""
                width={42}
                height={42}
                className="h-[42px] w-[42px] object-contain"
                priority
              />
              <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-primary-hover">
                Goldfish
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Help"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-text-primary/60 text-text-primary md:flex"
              >
                <QuestionIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="flex items-center gap-3 rounded-full px-1 py-1 text-text-primary"
                aria-label="Profile menu placeholder"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-hover">
                  <UserIcon className="h-6 w-6" />
                </span>
                <ChevronDownIcon className="hidden h-5 w-5 md:block" />
              </button>
            </div>
          </header>

          <div className="px-4 py-6 md:px-8 lg:px-9">
            <section className="rounded-[24px] border border-dashed border-primary/60 bg-surface-card p-4 shadow-[var(--shadow-soft)] md:p-7 lg:p-9">
              <AudioUploader
                onAudioLoaded={handleAudioLoaded}
                onTranscribe={handleTranscribe}
                loading={loading}
              />

              {error && (
                <div className="mt-5 rounded-[16px] border border-danger/30 bg-danger/10 p-4">
                  <h3 className="mb-1 text-sm font-semibold text-danger">
                    Error
                  </h3>
                  <p className="text-sm text-text-secondary">{error}</p>
                </div>
              )}

              {audioFile && (
                <div className="mt-6 grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
                  <div className="card p-4 md:p-5">
                    <h2 className="mb-4 text-base font-semibold text-text-primary">
                      Audio Preview
                    </h2>
                    <TranscriptDisplay transcript={null} audioFile={audioFile} />
                  </div>

                  {transcript && (
                    <div className="card p-4 md:p-5">
                      <TranscriptDisplay
                        transcript={transcript}
                        audioFile={audioFile}
                        onClear={handleClear}
                      />
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
              <div className="min-h-[260px] rounded-[16px] border border-border bg-surface-card p-5 shadow-[var(--shadow-card)]">
                <h2 className="text-base font-semibold text-text-primary">
                  Recent Sessions
                </h2>
              </div>

              <div className="min-h-[260px] rounded-[16px] border border-border bg-surface-card p-5 shadow-[var(--shadow-card)]">
                <h2 className="text-base font-semibold text-text-primary">
                  Exciting Moments
                </h2>
              </div>
            </section>
          </div>
        </section>
      </div>

      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-text-primary/45 px-4 pt-[8vh]"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-[24px] border border-border bg-surface-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSettings(false)}
              className="soft-focus-ring absolute right-4 top-4 rounded-full p-2 text-text-muted transition-colors duration-200 hover:bg-primary-wash hover:text-primary-hover"
              aria-label="Close settings"
            >
              <CloseIcon className="h-5 w-5" />
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

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.8 12 3l9 7.8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 9.7V21h13V9.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M4 12v2" />
      <path strokeLinecap="round" d="M8 7v10" />
      <path strokeLinecap="round" d="M12 4v16" />
      <path strokeLinecap="round" d="M16 8v8" />
      <path strokeLinecap="round" d="M20 11v2" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.4 5.5 5.9.6-4.4 4 1.3 5.8L12 15.9 6.8 19l1.3-5.8-4.4-4 5.9-.6L12 3Z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 10 5 5 5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a8.1 8.1 0 0 0 .1-1l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-1.7-1l-.3-2.6H9l-.3 2.6a7.7 7.7 0 0 0-1.7 1L4.6 9l-2 3.5 2 1.5a8.1 8.1 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a7.7 7.7 0 0 0 1.7 1l.3 2.6h6.2l.3-2.6a7.7 7.7 0 0 0 1.7-1l2.4 1 2-3.5-2.3-2Z" />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.7 2.7 0 1 1 4.2 2.2c-.9.6-1.7 1.2-1.7 2.8" />
      <path strokeLinecap="round" d="M12 17.2h.01" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
