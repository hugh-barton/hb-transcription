"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ClipPreview from "@/components/ClipPreview";
import { findClipSuggestions } from "@/lib/triggers";
import { AudioFile, TranscriptResult } from "@/types";

type ClipDownloadFormat = "mp3" | "m4a";

interface AudioUploaderProps {
  audioFile: AudioFile | null;
  transcript: TranscriptResult | null;
  error: string | null;
  onAudioLoaded: (file: AudioFile) => void;
  onTranscribe: (file: File) => void;
  onReset: () => void;
  loading: boolean;
  transcriptionStatus: string | null;
}

export default function AudioUploader({
  audioFile,
  transcript,
  error,
  onAudioLoaded,
  onTranscribe,
  onReset,
  loading,
  transcriptionStatus,
}: AudioUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadFormats, setDownloadFormats] = useState<
    Record<string, ClipDownloadFormat>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clipSuggestions = useMemo(() => {
    if (!transcript?.segments || transcript.segments.length === 0) return [];
    return findClipSuggestions(transcript.segments, transcript.duration);
  }, [transcript]);

  useEffect(() => {
    if (!showTranscript) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowTranscript(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showTranscript]);

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

      if (file.size > 2.2 * 1024 * 1024 * 1024) {
        alert("File size exceeds AssemblyAI's 2.2 GB upload limit");
        return;
      }

      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        onAudioLoaded({
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          duration: duration || 0,
        });
      });
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        alert("Could not read audio metadata from this file");
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

  const handleReset = useCallback(() => {
    setShowTranscript(false);
    setCopied(false);
    setDownloading(null);
    setDownloadFormats({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onReset();
  }, [onReset]);

  const handleCopyTranscript = async () => {
    if (!transcript?.text) return;

    await navigator.clipboard.writeText(transcript.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadClip = async (
    clipStart: number,
    clipEnd: number,
    filename: string,
    format: ClipDownloadFormat,
  ) => {
    if (!audioFile) return;

    const downloadFilename = replaceFileExtension(filename, format);
    setDownloading(downloadFilename);

    try {
      const formData = new FormData();
      formData.append("file", audioFile.file);
      formData.append("clipStart", String(clipStart));
      formData.append("clipEnd", String(clipEnd));
      formData.append("filename", downloadFilename);
      formData.append("format", format);

      const response = await fetch("/api/clip", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Clip download failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative h-full rounded-[20px] transition-colors ${
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

      {audioFile ? (
        <SessionWorkspace
          audioFile={audioFile}
          transcript={transcript}
          error={error}
          loading={loading}
          transcriptionStatus={transcriptionStatus}
          clipSuggestions={clipSuggestions}
          downloading={downloading}
          downloadFormats={downloadFormats}
          onDownloadFormatChange={(filename, format) =>
            setDownloadFormats((current) => ({
              ...current,
              [filename]: format,
            }))
          }
          onDownloadClip={handleDownloadClip}
          onReset={handleReset}
          onTranscribe={onTranscribe}
          onViewTranscript={() => setShowTranscript(true)}
        />
      ) : (
        <DefaultUploadState
          dragActive={dragActive}
          onBrowseClick={handleBrowseClick}
          onKeyDown={handleUploadKeyDown}
        />
      )}

      {showTranscript && transcript && (
        <TranscriptModal
          transcript={transcript}
          copied={copied}
          onCopy={handleCopyTranscript}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </div>
  );
}

function DefaultUploadState({
  dragActive,
  onBrowseClick,
  onKeyDown,
}: {
  dragActive: boolean;
  onBrowseClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="flex h-full flex-col justify-center">
      <div
        onClick={onBrowseClick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        className="soft-focus-ring mx-auto flex max-w-3xl cursor-pointer flex-col items-center rounded-[18px] px-4 text-center md:px-8"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-wash text-primary-hover">
          <span className="flex h-8 w-8 items-center justify-center">
            <UploadTrayIcon className="h-8 w-8" />
          </span>
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
            onBrowseClick();
          }}
          className="primary-button soft-focus-ring mt-5 inline-flex items-center gap-3 px-6 py-3 text-base font-semibold"
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <UploadTrayIcon className="h-5 w-5" />
          </span>
          Upload Session
        </button>

        <p className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
          <LockIcon className="h-4 w-4" />
          Your audio is private and secure
        </p>
      </div>

      <div className="mx-auto mt-7 flex max-w-3xl flex-wrap items-center justify-center gap-3 text-sm text-text-secondary md:gap-5">
        <InfoPill icon={<MusicIcon className="h-5 w-5" />}>
          WAV, MP3, M4A supported
        </InfoPill>
        <span className="hidden h-8 w-px bg-border md:block" />
        <InfoPill icon={<ClockIcon className="h-5 w-5" />}>
          Up to 2.2 GB
        </InfoPill>
        <span className="hidden h-8 w-px bg-border md:block" />
        <InfoPill icon={<SparkleIcon className="h-5 w-5" />}>
          Goldfish auto-detects exciting moments
        </InfoPill>
      </div>
    </div>
  );
}

function SessionWorkspace({
  audioFile,
  transcript,
  error,
  loading,
  transcriptionStatus,
  clipSuggestions,
  downloading,
  downloadFormats,
  onDownloadFormatChange,
  onDownloadClip,
  onReset,
  onTranscribe,
  onViewTranscript,
}: {
  audioFile: AudioFile;
  transcript: TranscriptResult | null;
  error: string | null;
  loading: boolean;
  transcriptionStatus: string | null;
  clipSuggestions: ReturnType<typeof findClipSuggestions>;
  downloading: string | null;
  downloadFormats: Record<string, ClipDownloadFormat>;
  onDownloadFormatChange: (filename: string, format: ClipDownloadFormat) => void;
  onDownloadClip: (
    clipStart: number,
    clipEnd: number,
    filename: string,
    format: ClipDownloadFormat,
  ) => void;
  onReset: () => void;
  onTranscribe: (file: File) => void;
  onViewTranscript: () => void;
}) {
  const isComplete = Boolean(transcript) && !loading;

  return (
    <div className="flex h-full flex-col gap-3 md:gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onReset}
          className="soft-focus-ring inline-flex items-center gap-2 rounded-[12px] border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-primary-wash hover:text-primary-hover"
        >
          <PlusIcon className="h-4 w-4" />
          New Session
        </button>

        {isComplete && (
          <button
            type="button"
            onClick={onViewTranscript}
            className="soft-focus-ring inline-flex items-center gap-2 rounded-[12px] border border-primary/25 bg-primary-wash px-3 py-2 text-sm font-semibold text-primary-hover transition-colors hover:bg-primary-soft"
          >
            <TextIcon className="h-4 w-4" />
            View Transcript
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <StatusCard
            icon={<SpinnerIcon className="h-5 w-5 animate-spin" />}
            title={transcriptionStatus || "Preparing transcription"}
            body="Goldfish is sending this session through AssemblyAI and checking for clip-worthy phrases."
          />
        </div>
      ) : isComplete ? (
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1">
          <ClipStatusPanel
            audioFile={audioFile}
            transcript={transcript}
            error={error}
            loading={loading}
            clipSuggestions={clipSuggestions}
            downloading={downloading}
            downloadFormats={downloadFormats}
            onDownloadFormatChange={onDownloadFormatChange}
            onDownloadClip={onDownloadClip}
            onViewTranscript={onViewTranscript}
          />
        </div>
      ) : (
        <section className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col justify-center gap-4">
          <FileSummaryCard audioFile={audioFile} />
          <AudioControls audioFile={audioFile} />
          <button
            type="button"
            onClick={() => onTranscribe(audioFile.file)}
            className="primary-button soft-focus-ring inline-flex h-12 shrink-0 items-center justify-center gap-2 px-5 text-sm font-semibold"
          >
            <SparkleIcon className="h-4 w-4" />
            Find Gold
          </button>
        </section>
      )}
    </div>
  );
}

function FileSummaryCard({ audioFile }: { audioFile: AudioFile }) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase text-primary-hover">
        Selected File
      </p>
      <h2 className="mt-1 truncate text-base font-semibold text-text-primary">
        {audioFile.name}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <MetadataPill label="Size" value={formatSize(audioFile.size)} />
        <MetadataPill label="Duration" value={formatDuration(audioFile.duration)} />
        <MetadataPill label="Type" value={audioFile.type || "Audio"} />
        <MetadataPill label="Format" value={getFileFormat(audioFile)} />
      </div>
    </div>
  );
}

function AudioControls({ audioFile }: { audioFile: AudioFile }) {
  const audioUrl = useMemo(
    () => URL.createObjectURL(audioFile.file),
    [audioFile.file],
  );

  useEffect(() => {
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  return (
    <div className="flex min-h-0 flex-1 items-center rounded-[16px] border border-border bg-muted p-2 shadow-[var(--shadow-card)]">
      <audio src={audioUrl} controls className="audio-control block w-full" />
    </div>
  );
}

function ClipStatusPanel({
  audioFile,
  transcript,
  error,
  loading,
  clipSuggestions,
  downloading,
  downloadFormats,
  onDownloadFormatChange,
  onDownloadClip,
  onViewTranscript,
}: {
  audioFile: AudioFile;
  transcript: TranscriptResult | null;
  error: string | null;
  loading: boolean;
  clipSuggestions: ReturnType<typeof findClipSuggestions>;
  downloading: string | null;
  downloadFormats: Record<string, ClipDownloadFormat>;
  onDownloadFormatChange: (filename: string, format: ClipDownloadFormat) => void;
  onDownloadClip: (
    clipStart: number,
    clipEnd: number,
    filename: string,
    format: ClipDownloadFormat,
  ) => void;
  onViewTranscript: () => void;
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-[16px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Exciting Moments
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {getClipPanelSubtitle(loading, transcript, clipSuggestions.length)}
          </p>
        </div>
        {loading && <SpinnerIcon className="h-5 w-5 animate-spin text-primary-hover" />}
      </div>

      {error ? (
        <div className="rounded-[14px] border border-danger/30 bg-danger/10 p-4">
          <h3 className="mb-1 text-sm font-semibold text-danger">Error</h3>
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      ) : loading ? (
        <StatusCard
          icon={<SpinnerIcon className="h-5 w-5 animate-spin" />}
          title="AssemblyAI is transcribing"
          body="Goldfish is checking this session for clip-worthy phrases."
        />
      ) : !transcript ? (
        <StatusCard
          icon={<SparkleIcon className="h-5 w-5" />}
          title="Ready for clips"
          body="Use this session to find highlights and generate clip previews."
        />
      ) : clipSuggestions.length === 0 ? (
        <div className="space-y-3">
          <StatusCard
            icon={<SearchIcon className="h-5 w-5" />}
            title="No clips found"
            body="No trigger phrases were detected, but the full transcript is available."
          />
          <button
            type="button"
            onClick={onViewTranscript}
            className="soft-focus-ring inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-primary/25 bg-primary-wash px-3 py-2 text-sm font-semibold text-primary-hover transition-colors hover:bg-primary-soft"
          >
            <TextIcon className="h-4 w-4" />
            View Transcript
          </button>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
          {clipSuggestions.map((clip) => {
            const downloadFormat = downloadFormats[clip.filename] ?? "m4a";
            const downloadFilename = replaceFileExtension(
              clip.filename,
              downloadFormat,
            );

            return (
              <article
                key={`${clip.filename}-${clip.clipStart}`}
                className="rounded-[14px] border border-border bg-surface-card p-3"
              >
                <p className="line-clamp-2 text-sm font-semibold text-text-primary">
                  &ldquo;{clip.matchedSegment.text.trim()}&rdquo;
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Trigger: &ldquo;{clip.triggerPhrase}&rdquo; &middot;{" "}
                  {formatDuration(clip.clipStart)} -{" "}
                  {formatDuration(clip.clipEnd)}
                </p>

                <div className="mt-3">
                  <ClipPreview
                    audioFile={audioFile}
                    clipStart={clip.clipStart}
                    clipEnd={clip.clipEnd}
                  />
                </div>

                <div className="mt-3 flex overflow-hidden rounded-[12px] shadow-[0_8px_18px_rgba(249,115,22,0.18)]">
                  <button
                    type="button"
                    onClick={() =>
                      onDownloadClip(
                        clip.clipStart,
                        clip.clipEnd,
                        clip.filename,
                        downloadFormat,
                      )
                    }
                    disabled={downloading === downloadFilename}
                    className="inline-flex flex-1 items-center justify-center gap-2 bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    {downloading === downloadFilename ? "Clipping" : "Download"}
                  </button>
                  <label className="relative border-l border-white/25 bg-primary text-white transition-colors hover:bg-primary-hover">
                    <span className="sr-only">Download format</span>
                    <select
                      value={downloadFormat}
                      onChange={(e) =>
                        onDownloadFormatChange(
                          clip.filename,
                          e.target.value as ClipDownloadFormat,
                        )
                      }
                      disabled={downloading === downloadFilename}
                      className="h-full appearance-none bg-transparent py-2 pl-3 pr-8 text-sm font-semibold uppercase outline-none disabled:opacity-60"
                    >
                      <option value="m4a">M4A</option>
                      <option value="mp3">MP3</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TranscriptModal({
  transcript,
  copied,
  onCopy,
  onClose,
}: {
  transcript: TranscriptResult;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-text-primary/45 px-4 pt-[8vh]"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[82vh] w-full max-w-3xl flex-col rounded-[24px] border border-border bg-surface-card p-5 shadow-2xl md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Transcript
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Generated with {transcript.model} &middot;{" "}
              {formatDuration(transcript.duration)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="soft-focus-ring inline-flex items-center gap-2 rounded-[12px] bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="soft-focus-ring rounded-full p-2 text-text-muted transition-colors hover:bg-primary-wash hover:text-primary-hover"
              aria-label="Close transcript"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-[16px] border border-border bg-surface p-5">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-text-secondary">
            {transcript.text}
          </p>
        </div>

        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          {transcript.language && (
            <MetadataPill
              label="Language"
              value={transcript.language.toUpperCase()}
            />
          )}
          <MetadataPill
            label="Processed"
            value={new Date(transcript.created_at).toLocaleString()}
          />
          <MetadataPill label="Segments" value={String(transcript.segments?.length ?? 0)} />
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-[14px] border border-primary/20 bg-primary-wash/70 p-5 text-center text-primary-hover">
      <div>
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface">
          {icon}
        </span>
        <h3 className="mt-3 text-sm font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">{body}</p>
      </div>
    </div>
  );
}

function MetadataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[12px] border border-border bg-surface-card p-2">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold text-text-primary">
        {value}
      </p>
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

function getClipPanelSubtitle(
  loading: boolean,
  transcript: TranscriptResult | null,
  clipCount: number,
) {
  if (loading) return "Scanning this session";
  if (!transcript) return "Highlights will appear here";
  if (clipCount === 0) return "Transcript ready";
  return `${clipCount} clip${clipCount === 1 ? "" : "s"} found`;
}

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getFileFormat(audioFile: AudioFile) {
  return audioFile.file.name.split(".").pop()?.toUpperCase() || "Audio";
}

function replaceFileExtension(
  filename: string,
  extension: ClipDownloadFormat,
) {
  return filename.replace(/\.[a-z0-9]+$/i, "") + "." + extension;
}

function UploadTrayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v10" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m7.75 8.75 4.25-4.25 4.25 4.25"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 14.5v3.25A2.25 2.25 0 0 0 7.25 20h9.5A2.25 2.25 0 0 0 19 17.75V14.5"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16.5h8" />
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

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6" />
      <rect width="16" height="18" x="4" y="3" rx="2" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6" />
      <path strokeLinecap="round" d="m16 16 4 4" />
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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect width="12" height="12" x="8" y="8" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
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
