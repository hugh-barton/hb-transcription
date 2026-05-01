"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioFile } from "@/types";

const CONTEXT_PADDING_SECONDS = 30;
const MIN_CLIP_DURATION_SECONDS = 5;
const WAVEFORM_HEIGHT = 72;

interface ClipPreviewProps {
  audioFile: AudioFile;
  clipStart: number;
  clipEnd: number;
  contextClipStart?: number;
  contextClipEnd?: number;
  onSelectionChange?: (selection: { clipStart: number; clipEnd: number }) => void;
}

type DragHandle = "start" | "end";
type PlaybackMode = "selection" | "scrub";

export default function ClipPreview({
  audioFile,
  clipStart,
  clipEnd,
  contextClipStart = clipStart,
  contextClipEnd = clipEnd,
  onSelectionChange,
}: ClipPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const activeHandleRef = useRef<DragHandle | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [isDecoding, setIsDecoding] = useState(true);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("selection");
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const [playbackPercent, setPlaybackPercent] = useState<number | null>(null);

  const audioUrl = useMemo(
    () => URL.createObjectURL(audioFile.file),
    [audioFile.file],
  );

  const sourceDuration = audioBuffer?.duration || audioFile.duration || clipEnd;
  const contextStart = Math.max(0, contextClipStart - CONTEXT_PADDING_SECONDS);
  const contextEnd = Math.min(
    sourceDuration,
    Math.max(contextClipEnd + CONTEXT_PADDING_SECONDS, clipEnd),
  );
  const contextDuration = Math.max(0.001, contextEnd - contextStart);
  const selectedStart = clamp(clipStart, contextStart, contextEnd);
  const selectedEnd = clamp(
    Math.max(clipEnd, selectedStart + MIN_CLIP_DURATION_SECONDS),
    selectedStart + MIN_CLIP_DURATION_SECONDS,
    contextEnd,
  );

  const startPercent = ((selectedStart - contextStart) / contextDuration) * 100;
  const endPercent = ((selectedEnd - contextStart) / contextDuration) * 100;
  const percentFromTime = useCallback(
    (time: number) =>
      clamp(((time - contextStart) / contextDuration) * 100, 0, 100),
    [contextDuration, contextStart],
  );

  const updateSelection = useCallback(
    (nextStart: number, nextEnd: number) => {
      const clampedStart = clamp(
        nextStart,
        contextStart,
        Math.max(contextStart, nextEnd - MIN_CLIP_DURATION_SECONDS),
      );
      const clampedEnd = clamp(
        nextEnd,
        Math.min(contextEnd, clampedStart + MIN_CLIP_DURATION_SECONDS),
        contextEnd,
      );

      onSelectionChange?.({
        clipStart: roundTime(clampedStart),
        clipEnd: roundTime(clampedEnd),
      });
    },
    [contextEnd, contextStart, onSelectionChange],
  );

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    let cancelled = false;
    let audioContext: AudioContext | null = null;

    const decodeAudio = async () => {
      setIsDecoding(true);
      setDecodeError(null);

      try {
        const AudioContextConstructor =
          window.AudioContext ||
          (
            window as Window &
              typeof globalThis & {
                webkitAudioContext?: typeof AudioContext;
              }
          ).webkitAudioContext;

        if (!AudioContextConstructor) {
          throw new Error("Your browser cannot render waveforms for this file");
        }

        audioContext = new AudioContextConstructor();
        const arrayBuffer = await audioFile.file.arrayBuffer();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

        if (!cancelled) {
          setAudioBuffer(decodedBuffer);
          setIsDecoding(false);
        }
      } catch (error) {
        if (!cancelled) {
          setDecodeError(
            error instanceof Error ? error.message : "Waveform unavailable",
          );
          setIsDecoding(false);
        }
      } finally {
        await audioContext?.close().catch(() => undefined);
      }
    };

    decodeAudio();

    return () => {
      cancelled = true;
    };
  }, [audioFile.file]);

  useEffect(() => {
    const waveform = waveformRef.current;
    if (!waveform) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setCanvasWidth(Math.floor(entry.contentRect.width));
    });

    resizeObserver.observe(waveform);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    drawWaveform({
      audioBuffer,
      canvas: canvasRef.current,
      contextStart,
      contextEnd,
      selectedStart,
      selectedEnd,
      width: canvasWidth,
    });
  }, [
    audioBuffer,
    canvasWidth,
    contextEnd,
    contextStart,
    selectedEnd,
    selectedStart,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const stopTime = playbackMode === "scrub" ? contextEnd : selectedEnd;

      if (audio.currentTime >= stopTime) {
        audio.pause();
        audio.currentTime = stopTime;
        setIsPlaying(false);
        setPlaybackPercent(null);
      }
    };
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => {
      setIsPlaying(false);
      setPlaybackPercent(null);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
    };
  }, [contextEnd, playbackMode, selectedEnd]);

  useEffect(() => {
    if (!isPlaying) return;

    let animationFrame = 0;
    const updatePlaybackProgress = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;

      setPlaybackPercent(percentFromTime(audio.currentTime));
      animationFrame = window.requestAnimationFrame(updatePlaybackProgress);
    };

    animationFrame = window.requestAnimationFrame(updatePlaybackProgress);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying, percentFromTime]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
    };
  }, []);

  const timeFromPointer = useCallback(
    (clientX: number) => {
      const waveform = waveformRef.current;
      if (!waveform) return selectedStart;

      const rect = waveform.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width);
      return contextStart + (x / rect.width) * contextDuration;
    },
    [contextDuration, contextStart, selectedStart],
  );

  const handleDragMove = useCallback(
    (clientX: number) => {
      const activeHandle = activeHandleRef.current;
      if (!activeHandle) return;

      const nextTime = timeFromPointer(clientX);

      if (activeHandle === "start") {
        updateSelection(nextTime, selectedEnd);
      } else {
        updateSelection(selectedStart, nextTime);
      }
    },
    [selectedEnd, selectedStart, timeFromPointer, updateSelection],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!activeHandleRef.current) return;
      event.preventDefault();
      handleDragMove(event.clientX);
    };

    const handlePointerUp = () => {
      activeHandleRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handleDragMove]);

  const handleWaveformPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const waveform = waveformRef.current;
    if (!waveform) return;

    const rect = waveform.getBoundingClientRect();
    const pointerX = clamp(event.clientX - rect.left, 0, rect.width);
    setHoverPercent((pointerX / rect.width) * 100);
  };

  const handleWaveformPointerLeave = () => {
    setHoverPercent(null);
  };

  const handleWaveformPointerDown = async (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const audio = audioRef.current;
    if (!audio) return;

    const scrubStart = timeFromPointer(event.clientX);
    setPlaybackMode("scrub");
    setPlaybackPercent(percentFromTime(scrubStart));

    try {
      await seekAndPlay(audio, scrubStart);
      setIsPlaying(true);
    } catch {
      setPlaybackPercent(null);
      setIsPlaying(false);
    }
  };

  const handleHandlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    handle: DragHandle,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    activeHandleRef.current = handle;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleTogglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setPlaybackPercent(null);
      return;
    }

    setPlaybackMode("selection");
    setPlaybackPercent(percentFromTime(selectedStart));

    try {
      await seekAndPlay(audio, selectedStart);
      setIsPlaying(true);
    } catch {
      setPlaybackPercent(null);
      setIsPlaying(false);
    }
  };

  const readout = useMemo(
    () => ({
      start: formatTimestamp(selectedStart),
      end: formatTimestamp(selectedEnd),
      duration: formatClipDuration(selectedEnd - selectedStart),
    }),
    [selectedEnd, selectedStart],
  );

  return (
    <div className="rounded-[12px] border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTogglePlayback}
          disabled={!audioUrl}
          className="soft-focus-ring flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-transparent p-0 text-primary-hover transition-transform hover:scale-105 disabled:opacity-50"
          aria-label={isPlaying ? "Pause selected clip" : "Play selected clip"}
        >
          {isPlaying ? (
            <Pause className="h-7 w-7" aria-hidden="true" />
          ) : (
            <Play className="ml-0.5 h-7 w-7" strokeWidth={2.4} aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            ref={waveformRef}
            className="relative h-[72px] cursor-crosshair touch-none select-none"
            onPointerDown={handleWaveformPointerDown}
            onPointerMove={handleWaveformPointerMove}
            onPointerLeave={handleWaveformPointerLeave}
          >
            <canvas
              ref={canvasRef}
              className="h-full w-full rounded-[10px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-y-1 rounded-[6px] bg-primary/10"
              style={{
                left: `${startPercent}%`,
                width: `${Math.max(0, endPercent - startPercent)}%`,
              }}
            />
            {hoverPercent !== null && (
              <div
                className="pointer-events-none absolute inset-y-0 z-[8] w-0.5 -translate-x-1/2 rounded-full bg-text-primary/70 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                style={{ left: `${hoverPercent}%` }}
              />
            )}
            {playbackPercent !== null && (
              <div
                className="pointer-events-none absolute inset-y-0 z-[9] w-1 -translate-x-1/2 rounded-full bg-sparkle shadow-[0_0_0_1px_rgba(255,255,255,0.95),0_0_10px_rgba(251,146,60,0.5)]"
                style={{ left: `${playbackPercent}%` }}
              >
                <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1 rounded-full border border-white bg-sparkle shadow-sm" />
              </div>
            )}
            <Handle
              label={`Clip start ${readout.start}`}
              position={startPercent}
              onPointerDown={(event) => handleHandlePointerDown(event, "start")}
            />
            <Handle
              label={`Clip end ${readout.end}`}
              position={endPercent}
              onPointerDown={(event) => handleHandlePointerDown(event, "end")}
            />
            {isDecoding && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[10px] bg-surface/70 text-xs font-medium text-text-muted backdrop-blur-[1px]">
                Drawing waveform...
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-text-muted">
            <span>{readout.start}</span>
            <span className="text-border">-</span>
            <span>{readout.end}</span>
            <span className="text-primary-hover">{readout.duration}</span>
          </div>
        </div>
      </div>

      {decodeError && (
        <p className="mt-2 text-xs text-text-muted">
          Waveform unavailable, but selected-region playback and downloads still work.
        </p>
      )}

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          playsInline
          className="hidden"
        />
      ) : null}
    </div>
  );
}

function Handle({
  label,
  position,
  onPointerDown,
}: {
  label: string;
  position: number;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={onPointerDown}
      className="soft-focus-ring absolute top-0 z-10 h-full w-7 -translate-x-1/2 cursor-ew-resize touch-none"
      style={{ left: `${position}%` }}
    >
      <span className="mx-auto block h-full w-0.5 rounded-full bg-primary shadow-[0_0_0_1px_rgba(255,255,255,0.95)]" />
      <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-sm" />
    </button>
  );
}

async function seekAndPlay(audio: HTMLAudioElement, startTime: number) {
  await waitForAudioMetadata(audio);
  audio.currentTime = startTime;
  await audio.play();
}

function waitForAudioMetadata(audio: HTMLAudioElement) {
  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve();
  }

  audio.load();

  return new Promise<void>((resolve, reject) => {
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Audio preview could not be loaded"));
    };
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", handleReady);
      audio.removeEventListener("canplay", handleReady);
      audio.removeEventListener("error", handleError);
    };

    audio.addEventListener("loadedmetadata", handleReady, { once: true });
    audio.addEventListener("canplay", handleReady, { once: true });
    audio.addEventListener("error", handleError, { once: true });
  });
}

function drawWaveform({
  audioBuffer,
  canvas,
  contextStart,
  contextEnd,
  selectedStart,
  selectedEnd,
  width,
}: {
  audioBuffer: AudioBuffer | null;
  canvas: HTMLCanvasElement | null;
  contextStart: number;
  contextEnd: number;
  selectedStart: number;
  selectedEnd: number;
  width: number;
}) {
  if (!canvas || width <= 0) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const height = WAVEFORM_HEIGHT;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.scale(pixelRatio, pixelRatio);
  context.clearRect(0, 0, width, height);

  const styles = getComputedStyle(document.documentElement);
  const mutedColor = styles.getPropertyValue("--waveform-muted").trim() || "#D8D1CA";
  const selectedColor = styles.getPropertyValue("--primary").trim() || "#F97316";
  const baselineColor = styles.getPropertyValue("--border").trim() || "#EADFD3";
  const centerY = height / 2;

  context.strokeStyle = baselineColor;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, centerY);
  context.lineTo(width, centerY);
  context.stroke();

  if (!audioBuffer) {
    drawPlaceholderWaveform(context, width, height, mutedColor);
    return;
  }

  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.max(0, Math.floor(contextStart * sampleRate));
  const endSample = Math.min(
    channelData.length,
    Math.ceil(contextEnd * sampleRate),
  );
  const samplesPerPixel = Math.max(1, Math.floor((endSample - startSample) / width));
  const barWidth = 2;
  const gap = 2;
  const step = barWidth + gap;

  for (let x = 0; x < width; x += step) {
    const sampleIndex = startSample + Math.floor(x * samplesPerPixel);
    const maxSampleIndex = Math.min(sampleIndex + samplesPerPixel * step, endSample);
    let peak = 0;

    for (let i = sampleIndex; i < maxSampleIndex; i += 1) {
      peak = Math.max(peak, Math.abs(channelData[i] ?? 0));
    }

    const time = contextStart + (x / width) * (contextEnd - contextStart);
    const barHeight = Math.max(5, peak * (height - 10));
    context.fillStyle =
      time >= selectedStart && time <= selectedEnd ? selectedColor : mutedColor;
    context.fillRect(
      x,
      centerY - barHeight / 2,
      barWidth,
      Math.max(4, barHeight),
    );
  }
}

function drawPlaceholderWaveform(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
) {
  const centerY = height / 2;
  context.fillStyle = color;

  for (let x = 0; x < width; x += 4) {
    const barHeight = 8 + Math.sin(x / 9) * 10 + Math.sin(x / 17) * 7;
    context.fillRect(x, centerY - barHeight / 2, 2, Math.max(4, barHeight));
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundTime(value: number) {
  return Math.round(value * 10) / 10;
}

function formatTimestamp(seconds: number) {
  const roundedSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const secs = roundedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatClipDuration(seconds: number) {
  return `${Math.max(MIN_CLIP_DURATION_SECONDS, Math.round(seconds))} sec clip`;
}
