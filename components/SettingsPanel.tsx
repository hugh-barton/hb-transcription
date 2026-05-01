"use client";

import { useState } from "react";

interface Settings {
  language: string;
}

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export default function SettingsPanel({
  settings,
  onSettingsChange,
}: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("assemblyai_api_key") ?? "";
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );

  const handleSave = () => {
    try {
      localStorage.setItem("assemblyai_api_key", apiKey.trim());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const handleClear = () => {
    localStorage.removeItem("assemblyai_api_key");
    setApiKey("");
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const validateApiKey = () => {
    return apiKey.trim().length > 0;
  };

  return (
    <>
      <div className="pr-10">
        <p className="font-[family-name:var(--font-hand)] text-2xl font-semibold text-primary-hover">
          Goldfish
        </p>
        <h2 className="mt-1 text-xl font-semibold text-text-primary">
          Settings
        </h2>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="apiKey"
            className="mb-2 block text-sm font-semibold text-primary-hover"
          >
            AssemblyAI API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AssemblyAI API key"
            className="soft-focus-ring w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-text-primary placeholder-text-muted transition-colors focus:border-primary"
          />
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Your API key is stored locally in your browser. The current
            transcription route uses the configured server environment key.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!validateApiKey()}
              className="primary-button soft-focus-ring rounded-[14px] px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {saveStatus === "saved"
                ? "Saved"
                : saveStatus === "error"
                  ? "Error"
                  : "Save Key"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="soft-focus-ring rounded-[14px] border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/15"
            >
              Clear Key
            </button>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div>
          <label
            htmlFor="language"
            className="mb-2 block text-sm font-semibold text-primary-hover"
          >
            Language (optional)
          </label>
          <input
            type="text"
            id="language"
            value={settings.language}
            onChange={(e) =>
              onSettingsChange({ ...settings, language: e.target.value })
            }
            placeholder="en, es, fr, de, etc."
            className="soft-focus-ring w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-text-primary placeholder-text-muted transition-colors focus:border-primary"
          />
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Optional language code to improve accuracy. Leave empty to let
            AssemblyAI choose the best language route.
          </p>
        </div>

        <div className="rounded-[16px] border border-border bg-primary-wash p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-primary-hover">
            Usage Information
          </h3>
          <div className="space-y-1 text-sm text-text-secondary">
            <p>
              <span className="font-medium text-primary-hover">
                Speech models:
              </span>{" "}
              universal-3-pro, universal-2 fallback
            </p>
            <p>
              <span className="font-medium text-primary-hover">
                Upload limit:
              </span>{" "}
              Up to 2.2 GB via AssemblyAI upload
            </p>
            <p>
              <span className="font-medium text-primary-hover">Mode:</span>{" "}
              Pre-recorded transcription
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
