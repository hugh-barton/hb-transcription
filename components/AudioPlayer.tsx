"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioFile } from "@/types";

interface AudioPlayerProps {
  audioFile: AudioFile;
}

const waveformBars = [
  18, 28, 14, 34, 44, 26, 52, 36, 18, 42, 55, 30, 22, 48, 32, 60, 40, 24, 50,
  28, 36, 46, 20, 34, 56, 38, 25, 45, 31, 54, 29, 19,
];

export default function AudioPlayer({ audioFile }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioUrl = useMemo(
    () => URL.createObjectURL(audioFile.file),
    [audioFile.file],
  );

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[16px] border border-border bg-surface p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-text-primary">
              {audioFile.name}
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              {formatTime(audioFile.duration)} audio preview
            </p>
          </div>

          <button
            type="button"
            onClick={handlePlayPause}
            className="soft-focus-ring flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_18px_rgba(249,115,22,0.25)] transition-colors hover:bg-primary-hover"
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4Zm8 0h4v16h-4V4Z" />
              </svg>
            ) : (
              <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7L8 5Z" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-5 flex h-20 items-center gap-1 overflow-hidden rounded-[16px] border border-border bg-surface-card px-4">
          {waveformBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={`w-1 flex-1 rounded-full ${
                index % 4 === 0 ? "bg-primary" : "bg-waveform-muted"
              }`}
              style={{ height }}
            />
          ))}
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
          className="audio-control mt-4 w-full"
        />

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <MetadataCard label="Duration" value={formatTime(audioFile.duration)} />
          <MetadataCard
            label="Size"
            value={`${(audioFile.size / 1024 / 1024).toFixed(2)} MB`}
          />
          <MetadataCard label="Type" value={audioFile.type || "Audio"} />
          <MetadataCard
            label="Format"
            value={audioFile.file.name.split(".").pop()?.toUpperCase() || "Audio"}
          />
        </div>
      </div>
    </div>
  );
}

function MetadataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-surface-card p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 truncate font-medium text-text-primary">{value}</p>
    </div>
  );
}
