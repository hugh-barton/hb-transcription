"use client";

import { useEffect, useRef, useState } from "react";
import { AudioFile } from "@/types";

interface ClipPreviewProps {
  audioFile: AudioFile;
  clipStart: number;
  clipEnd: number;
}

export default function ClipPreview({
  audioFile,
  clipStart,
  clipEnd,
}: ClipPreviewProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchClip = async () => {
      setLoading(true);
      setError(null);
      setAudioUrl(null);

      try {
        const formData = new FormData();
        formData.append("file", audioFile.file);
        formData.append("clipStart", String(clipStart));
        formData.append("clipEnd", String(clipEnd));
        formData.append("filename", "preview.mp3");
        formData.append("preview", "true");

        const response = await fetch("/api/clip", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to generate preview");
        }

        const blob = await response.blob();

        if (cancelled) return;

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Preview failed");
        setLoading(false);
      }
    };

    fetchClip();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [audioFile.file, clipStart, clipEnd]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  const duration = clipEnd - clipStart;
  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-[12px] border border-border bg-surface px-3 py-3">
        <div className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-text-muted">Generating preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-[12px] border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
        Preview unavailable: {error}
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-[12px] border border-border bg-surface p-3">
      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          preload="auto"
          className="audio-control w-full"
        />
      ) : null}
      <p className="text-xs text-text-muted">
        {mins}:{secs.toString().padStart(2, "0")} preview
      </p>
    </div>
  );
}
