"use client";

import { useState, useCallback } from "react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioData, setAudioData] = useState<AudioFile | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileSelect = (file: File) => {
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

    setSelectedFile(file);

    const audio = new Audio(URL.createObjectURL(file));
    audio.addEventListener("loadedmetadata", () => {
      const duration = audio.duration;
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
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleBrowseClick = () => {
    document.getElementById("fileInput")?.click();
  };

  return (
    <div className="rounded-[20px] border-2 border-dashed border-ink500 bg-ink300 p-6 transition-all duration-300">
      <input
        id="fileInput"
        type="file"
        accept=".mp3,.wav,.m4a,audio/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-[14px] p-8 text-center transition-all duration-300 ${
          dragActive
            ? "border-sapphire400 bg-sapphire600/20 scale-105"
            : "border-ink500 bg-ink200 hover:border-sapphire400"
        }`}
      >
        <div className="flex flex-col items-center space-y-3">
          <svg
            className="h-10 w-10 text-sapphire300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-ink900">
              {dragActive ? "Drop your audio file here" : "Upload Audio File"}
            </p>
            <p className="text-sm text-ink700">
              {dragActive
                ? "Release to upload"
                : "Drag and drop MP3, WAV, or M4A files"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-4">
        <button
          onClick={handleBrowseClick}
          className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-sapphire500 px-5 py-3 font-medium text-white transition-all duration-300 hover:bg-sapphire400"
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
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Browse Files
        </button>
        {audioData && !loading && (
          <button
            onClick={() => onTranscribe(audioData.file)}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-emerald px-5 py-3 font-medium text-white transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            Transcribe
          </button>
        )}
      </div>

      {audioData && (
        <div className="mt-5 rounded-[14px] bg-ink200 p-4">
          <h3 className="mb-2 text-base font-semibold text-ink900">
            Selected File
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-ink800">
              <span className="text-sapphire300">Name:</span> {audioData.name}
            </p>
            <p className="text-ink800">
              <span className="text-sapphire300">Size:</span>{" "}
              {(audioData.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-ink800">
              <span className="text-sapphire300">Duration:</span>{" "}
              {audioData.duration.toFixed(2)} seconds
            </p>
            <p className="text-ink800">
              <span className="text-sapphire300">Type:</span> {audioData.type}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-5 rounded-[14px] border border-sapphire400 bg-sapphire600/20 p-4">
          <div className="flex items-center justify-center gap-3">
            <svg
              className="h-5 w-5 animate-spin text-sapphire300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm font-medium text-sapphire300">
              Transcribing audio...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
