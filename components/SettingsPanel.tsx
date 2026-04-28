"use client";

import { useState, useEffect } from "react";

interface Settings {
  model: string;
  language: string;
  responseFormat: "json" | "text" | "srt" | "verbose_json";
}

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export default function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    const savedApiKey = localStorage.getItem("openai_api_key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem("openai_api_key", apiKey.trim());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      setSaveStatus("error");
    }
  };

  const handleClear = () => {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const validateApiKey = () => {
    return apiKey.trim().length > 0;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="mb-6 text-xl font-semibold text-ink900">
          Settings
        </h2>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="apiKey" className="mb-2 block text-sm font-medium text-sapphire300">
            OpenAI API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full rounded-[14px] border border-ink500 bg-ink200 px-4 py-3 text-ink900 placeholder-ink700 transition-all duration-300 focus:border-sapphire400 focus:outline-none focus:ring-1 focus:ring-sapphire400"
          />
          <p className="mt-2 text-xs text-ink700">
            Your API key is stored locally in your browser. It is sent only to the server-side API route which forwards it to OpenAI.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSave}
              disabled={!validateApiKey()}
              className="rounded-[14px] bg-sapphire500 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-sapphire400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Error" : "Save Key"}
            </button>
            <button
              onClick={handleClear}
              className="rounded-[14px] bg-rose px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:brightness-110"
            >
              Clear Key
            </button>
          </div>
        </div>

        <div className="h-px bg-ink500" />

        <div>
          <label htmlFor="model" className="mb-2 block text-sm font-medium text-sapphire300">
            Whisper Model
          </label>
          <select
            id="model"
            value={settings.model}
            onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}
            className="w-full rounded-[14px] border border-ink500 bg-ink200 px-4 py-3 text-ink900 transition-all duration-300 focus:border-sapphire400 focus:outline-none focus:ring-1 focus:ring-sapphire400"
          >
            <option value="whisper-1">whisper-1 (default)</option>
            <option value="whisper-1-large-v2">whisper-1-large-v2 (advanced)</option>
          </select>
          <p className="mt-2 text-xs text-ink700">
            whisper-1 is recommended for most use cases. Large models are more accurate but slower.
          </p>
        </div>

        <div>
          <label htmlFor="language" className="mb-2 block text-sm font-medium text-sapphire300">
            Language (optional)
          </label>
          <input
            type="text"
            id="language"
            value={settings.language}
            onChange={(e) => onSettingsChange({ ...settings, language: e.target.value })}
            placeholder="en, es, fr, de, etc."
            className="w-full rounded-[14px] border border-ink500 bg-ink200 px-4 py-3 text-ink900 placeholder-ink700 transition-all duration-300 focus:border-sapphire400 focus:outline-none focus:ring-1 focus:ring-sapphire400"
          />
          <p className="mt-2 text-xs text-ink700">
            Optional language code to improve accuracy. Leave empty to let Whisper auto-detect.
          </p>
        </div>

        <div>
          <label htmlFor="responseFormat" className="mb-2 block text-sm font-medium text-sapphire300">
            Response Format
          </label>
          <select
            id="responseFormat"
            value={settings.responseFormat}
            onChange={(e) => onSettingsChange({ ...settings, responseFormat: e.target.value as Settings["responseFormat"] })}
            className="w-full rounded-[14px] border border-ink500 bg-ink200 px-4 py-3 text-ink900 transition-all duration-300 focus:border-sapphire400 focus:outline-none focus:ring-1 focus:ring-sapphire400"
          >
            <option value="verbose_json">verbose_json (detailed with timestamps)</option>
            <option value="json">json (structured)</option>
            <option value="text">text (plain text)</option>
            <option value="srt">srt (subtitle format)</option>
          </select>
          <p className="mt-2 text-xs text-ink700">
            verbose_json returns the richest data (duration, language, segments). Other formats return plain text only.
          </p>
        </div>

        <div className="rounded-[14px] bg-ink200 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-sapphire300">Usage Information</h3>
          <div className="space-y-1 text-sm text-ink800">
            <p>
              <span className="text-sapphire300">Current model:</span> {settings.model}
            </p>
            <p>
              <span className="text-sapphire300">OpenAI pricing:</span> ~$0.006 per minute of audio
            </p>
            <p>
              <span className="text-sapphire300">Free tier:</span> 60 minutes included
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
