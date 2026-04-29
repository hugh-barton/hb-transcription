"use client";

import { useMemo, useState } from "react";
import { AudioFile, TranscriptResult } from "@/types";
import { findClipSuggestions } from "@/lib/triggers";
import AudioPlayer from "./AudioPlayer";
import ClipPreview from "./ClipPreview";

type ClipDownloadFormat = "mp3" | "m4a";

interface TranscriptDisplayProps {
  transcript: TranscriptResult | null;
  audioFile: AudioFile;
  onClear?: () => void;
}

export default function TranscriptDisplay({
  transcript,
  audioFile,
  onClear,
}: TranscriptDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadFormats, setDownloadFormats] = useState<
    Record<string, ClipDownloadFormat>
  >({});

  const clipSuggestions = useMemo(() => {
    if (!transcript?.segments || transcript.segments.length === 0) return [];
    return findClipSuggestions(transcript.segments, transcript.duration);
  }, [transcript]);

  const handleCopy = async () => {
    if (transcript?.text) {
      await navigator.clipboard.writeText(transcript.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadClip = async (
    clipStart: number,
    clipEnd: number,
    filename: string,
    format: ClipDownloadFormat,
  ) => {
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

  if (!transcript) {
    return <AudioPlayer audioFile={audioFile} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            Transcript Result
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            Generated with {transcript.model}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="soft-focus-ring inline-flex items-center gap-2 rounded-[12px] bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            title="Copy transcript"
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

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="soft-focus-ring inline-flex items-center justify-center rounded-[12px] border border-danger/30 bg-danger/10 p-2 text-danger transition-colors hover:bg-danger/15"
              title="Clear transcript"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[460px] min-h-[220px] overflow-auto rounded-[16px] border border-border bg-surface p-5">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-text-secondary">
          {transcript.text}
        </p>
      </div>

      {clipSuggestions.length > 0 && (
        <section className="rounded-[16px] border border-primary/25 bg-primary-wash/70 p-4">
          <div className="mb-4 flex items-center gap-2">
            <SparkleIcon className="h-5 w-5 text-primary-hover" />
            <h3 className="text-sm font-semibold uppercase text-primary-hover">
              {clipSuggestions.length} Clip
              {clipSuggestions.length !== 1 ? "s" : ""} Found
            </h3>
          </div>

          <div className="space-y-3">
            {clipSuggestions.map((clip) => {
              const downloadFormat = downloadFormats[clip.filename] ?? "m4a";
              const downloadFilename = replaceFileExtension(
                clip.filename,
                downloadFormat,
              );

              return (
                <div
                  key={clip.filename}
                  className="rounded-[16px] border border-border bg-surface-card p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-text-primary">
                        &ldquo;{clip.matchedSegment.text.trim()}&rdquo;
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Trigger: &ldquo;{clip.triggerPhrase}&rdquo; &middot;{" "}
                        {formatDuration(clip.clipStart)} -{" "}
                        {formatDuration(clip.clipEnd)}
                      </p>
                    </div>

                    <div className="flex shrink-0 overflow-hidden rounded-[12px] shadow-[0_8px_18px_rgba(249,115,22,0.18)]">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadClip(
                            clip.clipStart,
                            clip.clipEnd,
                            clip.filename,
                            downloadFormat,
                          )
                        }
                        disabled={downloading === downloadFilename}
                        className="inline-flex items-center gap-2 bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        {downloading === downloadFilename
                          ? "Clipping..."
                          : "Download clip"}
                      </button>
                      <label className="relative border-l border-white/25 bg-primary text-white transition-colors hover:bg-primary-hover">
                        <span className="sr-only">Download format</span>
                        <select
                          value={downloadFormat}
                          onChange={(e) =>
                            setDownloadFormats((current) => ({
                              ...current,
                              [clip.filename]: e.target
                                .value as ClipDownloadFormat,
                            }))
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
                  </div>

                  <div className="mt-4">
                    <ClipPreview
                      audioFile={audioFile}
                      clipStart={clip.clipStart}
                      clipEnd={clip.clipEnd}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <SummaryCard
          label="Transcript Duration"
          value={formatDuration(transcript.duration)}
        />
        <SummaryCard label="Model Used" value={transcript.model} />
        {transcript.language && (
          <SummaryCard
            label="Detected Language"
            value={transcript.language.toUpperCase()}
          />
        )}
        <SummaryCard
          label="Processed At"
          value={new Date(transcript.created_at).toLocaleString()}
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-surface p-3">
      <p className="mb-1 text-xs text-text-muted">{label}</p>
      <p className="truncate font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function replaceFileExtension(
  filename: string,
  extension: ClipDownloadFormat,
): string {
  return filename.replace(/\.[a-z0-9]+$/i, "") + "." + extension;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6m4-6v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l1 14h10l1-14M9 7V4h6v3" />
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
