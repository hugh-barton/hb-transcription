"use client";

import { useState, useMemo } from "react";
import { TranscriptResult, AudioFile } from "@/types";
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
    format: ClipDownloadFormat
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink900">
          Transcription Result
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-[14px] bg-sapphire500 p-2 text-white transition-all duration-300 hover:bg-sapphire400"
            title="Copy transcript"
          >
            {copied ? (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm">Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                <span className="text-sm">Copy</span>
              </>
            )}
          </button>
          {onClear && (
            <button
              onClick={onClear}
              className="rounded-[14px] bg-rose p-2 text-white transition-all duration-300 hover:brightness-110"
              title="Clear transcript"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="min-h-[200px] rounded-[14px] bg-ink200 p-5">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-ink800">
          {transcript.text}
        </p>
      </div>

      {clipSuggestions.length > 0 && (
        <div className="rounded-[14px] border border-emerald/30 bg-emerald/10 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald">
            {clipSuggestions.length} Clip{clipSuggestions.length !== 1 ? "s" : ""} Found
          </h3>
          <div className="space-y-3">
            {clipSuggestions.map((clip) => {
              const downloadFormat = downloadFormats[clip.filename] ?? "m4a";
              const downloadFilename = replaceFileExtension(
                clip.filename,
                downloadFormat
              );

              return (
              <div
                key={clip.filename}
                className="space-y-3 rounded-[14px] bg-ink200/80 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink900">
                      &ldquo;{clip.matchedSegment.text.trim()}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-ink700">
                      Trigger: &ldquo;{clip.triggerPhrase}&rdquo; &middot;{" "}
                      {formatDuration(clip.clipStart)} &ndash; {formatDuration(clip.clipEnd)}
                    </p>
                  </div>
                  <div className="flex shrink-0 overflow-hidden rounded-[14px]">
                    <button
                      onClick={() =>
                        handleDownloadClip(
                          clip.clipStart,
                          clip.clipEnd,
                          clip.filename,
                          downloadFormat
                        )
                      }
                      disabled={downloading === downloadFilename}
                      className="flex items-center gap-2 bg-emerald px-3 py-2 text-sm font-medium text-white transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      {downloading === downloadFilename
                        ? "Clipping..."
                        : "Download clip"}
                    </button>
                    <label className="relative border-l border-white/20 bg-emerald text-white transition-all duration-300 hover:brightness-110">
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
                        className="h-full appearance-none bg-transparent py-2 pl-3 pr-8 text-sm font-medium uppercase outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="m4a">M4A</option>
                        <option value="mp3">MP3</option>
                      </select>
                      <svg
                        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </label>
                  </div>
                </div>
                <ClipPreview
                  audioFile={audioFile}
                  clipStart={clip.clipStart}
                  clipEnd={clip.clipEnd}
                />
              </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[14px] bg-ink200 p-3">
          <p className="mb-1 text-xs text-ink700">Transcript Duration</p>
          <p className="font-semibold text-ink900">
            {formatDuration(transcript.duration)}
          </p>
        </div>
        <div className="rounded-[14px] bg-ink200 p-3">
          <p className="mb-1 text-xs text-ink700">Model Used</p>
          <p className="font-semibold text-ink900">{transcript.model}</p>
        </div>
        {transcript.language && (
          <div className="rounded-[14px] bg-ink200 p-3">
            <p className="mb-1 text-xs text-ink700">Detected Language</p>
            <p className="font-semibold text-ink900">
              {transcript.language.toUpperCase()}
            </p>
          </div>
        )}
        <div className="rounded-[14px] bg-ink200 p-3">
          <p className="mb-1 text-xs text-ink700">Processed At</p>
          <p className="font-semibold text-ink900">
            {new Date(transcript.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function replaceFileExtension(
  filename: string,
  extension: ClipDownloadFormat
): string {
  return filename.replace(/\.[a-z0-9]+$/i, "") + "." + extension;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
