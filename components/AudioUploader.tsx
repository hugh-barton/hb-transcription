"use client";

import { useCallback, useRef, useState } from "react";
import { AudioFile } from "@/types";

interface AudioUploaderProps {
  onAudioLoaded: (file: AudioFile) => void;
  onTranscribe: (file: File) => void;
  loading: boolean;
}

export default function AudioUploader({
  onAudioLoaded,
  onTranscribe,
  loading,
}: AudioUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [audioData, setAudioData] = useState<AudioFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const validTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/x-wav",
        "audio/x-m4a",
        "audio/mp4",
        "audio/aac",
      ];

      if (!validTypes.includes(file.type) && !file.name.endsWith(".mp3")) {
        alert("Please select a valid audio file (MP3, WAV, or M4A)");
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        alert("File size exceeds 25MB limit");
        return;
      }

      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        const audioFile: AudioFile = {
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          duration: duration || 0,
        };
        setAudioData(audioFile);
        onAudioLoaded(audioFile);
      });
    },
    [onAudioLoaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUploadKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleBrowseClick();
      }
    },
    [handleBrowseClick],
  );

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`rounded-[20px] transition-colors ${
        dragActive ? "bg-primary-wash" : "bg-transparent"
      }`}
    >
      <input
        id="fileInput"
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,audio/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
      />

      <div
        onClick={handleBrowseClick}
        onKeyDown={handleUploadKeyDown}
        role="button"
        tabIndex={0}
        className="soft-focus-ring mx-auto flex max-w-3xl cursor-pointer flex-col items-center rounded-[18px] px-4 py-8 text-center md:px-8 md:py-10"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-wash text-primary-hover">
          <UploadIcon className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-semibold text-text-primary md:text-[28px]">
          {dragActive ? "Drop your jam session here" : "Start a New Session"}
        </h1>
        <p className="mt-2 max-w-sm text-base leading-relaxed text-text-secondary">
          {dragActive
            ? "Release to upload your audio"
            : "Drag your jam session here or upload audio from your device"}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseClick();
          }}
          className="primary-button soft-focus-ring mt-5 inline-flex items-center gap-3 px-6 py-3 text-base font-semibold"
        >
          <UploadIcon className="h-5 w-5" />
          Upload Session
        </button>

        <p className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
          <LockIcon className="h-4 w-4" />
          Your audio is private and secure
        </p>
      </div>

      <div className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center justify-center gap-3 text-sm text-text-secondary md:gap-5">
        <InfoPill icon={<MusicIcon className="h-5 w-5" />}>
          WAV, MP3, M4A supported
        </InfoPill>
        <span className="hidden h-8 w-px bg-border md:block" />
        <InfoPill icon={<ClockIcon className="h-5 w-5" />}>
          Up to 25 MB
        </InfoPill>
        <span className="hidden h-8 w-px bg-border md:block" />
        <InfoPill icon={<SparkleIcon className="h-5 w-5" />}>
          Goldfish auto-detects exciting moments
        </InfoPill>
      </div>

      {audioData && (
        <div className="mx-auto mt-7 max-w-3xl rounded-[16px] border border-border bg-surface p-4 text-left shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-primary-hover">
                Selected File
              </p>
              <h2 className="mt-1 truncate text-base font-semibold text-text-primary">
                {audioData.name}
              </h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                <span>{(audioData.size / 1024 / 1024).toFixed(2)} MB</span>
                <span>{audioData.duration.toFixed(2)} seconds</span>
                <span>{audioData.type || "Audio file"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onTranscribe(audioData.file)}
              disabled={loading}
              className="primary-button soft-focus-ring inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                  Transcribing
                </>
              ) : (
                <>
                  <MicIcon className="h-4 w-4" />
                  Use Session
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="mx-auto mt-4 max-w-3xl rounded-[16px] border border-primary/25 bg-primary-wash p-4">
          <div className="flex items-center justify-center gap-3">
            <SpinnerIcon className="h-5 w-5 animate-spin text-primary-hover" />
            <span className="text-sm font-medium text-primary-hover">
              Transcribing audio...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoPill({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface text-text-secondary">
        {icon}
      </span>
      {children}
    </span>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 9 5-5 5 5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 16.5a4 4 0 0 1-4 4H8a4 4 0 0 1-.8-7.9 5.4 5.4 0 0 1 10.5 1.4H18a2 2 0 0 1 2 2.5Z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10V8a5 5 0 0 1 10 0v2" />
      <rect width="14" height="10" x="5" y="10" rx="2" />
    </svg>
  );
}

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l10-2v13" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 13.7 8.3 19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 15v4m-2-2h4" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 0 1-14 0m7 7v3m-4 0h8" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
    </svg>
  );
}
