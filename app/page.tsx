"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import AudioUploader from "@/components/AudioUploader";
import SettingsPanel from "@/components/SettingsPanel";
import {
  AudioFile,
  TranscriptResult,
  TranscriptionJobStart,
  TranscriptionJobStatus,
} from "@/types";
import goldfishIcon from "../assets/Goldfish-Icon.png";
import waterRipples from "../assets/water-ripples.png";

const navItems = [
  { label: "Home", icon: HomeIcon, active: true },
  { label: "Sessions", icon: WaveIcon, active: false },
  { label: "Moments", icon: StarIcon, active: false },
  { label: "Downloads", icon: DownloadIcon, active: false },
];

type TranscriptionSettings = {
  language: string;
};

const defaultSettings: TranscriptionSettings = {
  language: "",
};

function loadSavedSettings(): TranscriptionSettings {
  if (typeof window === "undefined") return defaultSettings;

  const saved = localStorage.getItem("transcription_settings");
  if (!saved) return defaultSettings;

  try {
    const parsed = JSON.parse(saved) as Partial<TranscriptionSettings>;
    return {
      language: typeof parsed.language === "string" ? parsed.language : "",
    };
  } catch {
    return defaultSettings;
  }
}

export default function Home() {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] =
    useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const transcribeRunRef = useRef(0);
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
    const runId = transcribeRunRef.current + 1;
    transcribeRunRef.current = runId;
    setLoading(true);
    setError(null);
    setTranscriptionStatus("Uploading session to AssemblyAI");

    try {
      const params = new URLSearchParams();
      if (settings.language) {
        params.set("language", settings.language);
      }

      const startUrl = params.size
        ? `/api/transcribe?${params.toString()}`
        : "/api/transcribe";

      const response = await fetch(startUrl, {
        method: "POST",
        headers: {
          "content-type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `Transcription failed: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as TranscriptionJobStart;
      if (transcribeRunRef.current !== runId) return;
      setTranscriptionStatus(getStatusMessage(data.status));

      await pollTranscriptionJob(data.transcriptId, runId);
    } catch (err) {
      if (transcribeRunRef.current !== runId) return;
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      if (transcribeRunRef.current === runId) {
        setLoading(false);
      }
    }
  };

  const handleClear = () => {
    transcribeRunRef.current += 1;
    setAudioFile(null);
    setTranscript(null);
    setError(null);
    setTranscriptionStatus(null);
    setLoading(false);
  };

  const handleAudioLoaded = (file: AudioFile) => {
    setAudioFile(file);
    setTranscript(null);
    setError(null);
    setTranscriptionStatus(null);
  };

  const pollTranscriptionJob = async (transcriptId: string, runId: number) => {
    while (transcribeRunRef.current === runId) {
      await wait(3000);
      if (transcribeRunRef.current !== runId) return;

      const response = await fetch(`/api/transcribe/${transcriptId}`);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `Transcription failed: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as TranscriptionJobStatus;
      if (transcribeRunRef.current !== runId) return;

      if (data.status === "completed") {
        setTranscript(data.transcript);
        setTranscriptionStatus("Transcript ready");
        return;
      }

      if (data.status === "error") {
        throw new Error(data.error);
      }

      setTranscriptionStatus(getStatusMessage(data.status));
    }
  };

  return (
    <main className="min-h-screen bg-background text-text-primary lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen lg:h-screen lg:min-h-0 lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-border bg-sidebar px-4 py-5 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
          <div className="mb-9 flex items-center gap-3 px-2">
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

          <nav className="space-y-2" aria-label="Placeholder navigation">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`flex w-full items-center gap-4 rounded-[14px] px-4 py-3.5 text-left text-base font-medium transition-colors ${
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
            className="mt-auto flex w-full items-center gap-4 rounded-[14px] px-4 py-3.5 text-left text-base font-medium text-text-secondary transition-colors hover:bg-primary-wash hover:text-primary-hover"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <SettingsIcon className="h-5 w-5" />
            </span>
            Settings
          </button>
        </aside>

        <section className="min-w-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
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

          <div className="min-h-0 px-4 py-4 md:px-8 lg:flex-1 lg:px-9">
            <section
              className="min-h-[650px] overflow-hidden rounded-[24px] border border-dashed border-primary/60 bg-card p-4 shadow-[var(--shadow-soft)] md:p-7 lg:h-full lg:min-h-0 lg:p-6"
              style={{
                backgroundImage: `url(${waterRipples.src})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            >
              <AudioUploader
                audioFile={audioFile}
                transcript={transcript}
                error={error}
                onAudioLoaded={handleAudioLoaded}
                onTranscribe={handleTranscribe}
                onReset={handleClear}
                loading={loading}
                transcriptionStatus={transcriptionStatus}
              />
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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getStatusMessage(status: "queued" | "processing") {
  if (status === "queued") return "Session queued with AssemblyAI";
  return "AssemblyAI is transcribing the session";
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
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.25" />
      <path strokeLinecap="round" d="M12 3.25v3" />
      <path strokeLinecap="round" d="M12 17.75v3" />
      <path strokeLinecap="round" d="M3.25 12h3" />
      <path strokeLinecap="round" d="M17.75 12h3" />
      <path strokeLinecap="round" d="m5.8 5.8 2.1 2.1" />
      <path strokeLinecap="round" d="m16.1 16.1 2.1 2.1" />
      <path strokeLinecap="round" d="m18.2 5.8-2.1 2.1" />
      <path strokeLinecap="round" d="m7.9 16.1-2.1 2.1" />
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
