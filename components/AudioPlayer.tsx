"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { AudioFile } from "@/types";

interface AudioPlayerProps {
  audioFile: AudioFile;
}

export default function AudioPlayer({ audioFile }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioUrl = useMemo(() => URL.createObjectURL(audioFile.file), [audioFile.file]);

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
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (currentTime === duration && currentTime > 0) {
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[14px] bg-ink200 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink900">{audioFile.name}</h3>
          <button
            onClick={handlePlayPause}
            className="rounded-full bg-sapphire500 p-3 text-white transition-all duration-300 hover:bg-sapphire400"
          >
            {isPlaying ? (
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          controls
          className="w-full"
        />

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[14px] bg-ink300 p-3">
            <p className="text-xs text-ink700">Duration</p>
            <p className="font-medium text-ink900">
              {formatTime(audioFile.duration)}
            </p>
          </div>
          <div className="rounded-[14px] bg-ink300 p-3">
            <p className="text-xs text-ink700">Size</p>
            <p className="font-medium text-ink900">
              {(audioFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <div className="rounded-[14px] bg-ink300 p-3">
            <p className="text-xs text-ink700">Type</p>
            <p className="font-medium text-ink900">{audioFile.type}</p>
          </div>
          <div className="rounded-[14px] bg-ink300 p-3">
            <p className="text-xs text-ink700">Format</p>
            <p className="font-medium text-ink900">
              {audioFile.file.name.split(".").pop()?.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
