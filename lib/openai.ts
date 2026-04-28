import { Segment } from "@/types";

export async function transcribeAudio(
  file: File,
  apiKey: string,
  params: {
    model?: string;
    language?: string;
    response_format?: "json" | "text" | "srt" | "verbose_json";
  } = {}
): Promise<{
  text: string;
  duration: number;
  model: string;
  language?: string;
  created_at: string;
  segments?: Segment[];
}> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", params.model || "whisper-1");

  if (params.language) {
    formData.append("language", params.language);
  }

  const responseFormat = params.response_format || "verbose_json";
  formData.append("response_format", responseFormat);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "Unknown API error",
    }));

    throw new Error(
      `Transcription failed: ${errorData.error?.message || response.statusText}`
    );
  }

  if (responseFormat === "text" || responseFormat === "srt") {
    const text = await response.text();
    return {
      text,
      duration: 0,
      model: params.model || "whisper-1",
      created_at: new Date().toISOString(),
    };
  }

  const data = await response.json();

  return {
    text: data.text,
    duration: data.duration || 0,
    model: data.model || params.model || "whisper-1",
    language: data.language,
    created_at: new Date().toISOString(),
    segments: data.segments || undefined,
  };
}
