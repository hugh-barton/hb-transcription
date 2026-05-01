import { Segment, TranscriptResult } from "@/types";

const DEFAULT_BASE_URL = "https://api.assemblyai.com";
const SPEECH_MODELS = ["universal-3-pro", "universal-2"];

type AssemblyTranscriptStatus = "queued" | "processing" | "completed" | "error";

type AssemblyTranscript = {
  id: string;
  status: AssemblyTranscriptStatus;
  text?: string | null;
  error?: string | null;
  audio_duration?: number | null;
  language_code?: string | null;
  speech_model_used?: string | null;
};

type AssemblySentences = {
  audio_duration?: number | null;
  sentences?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
};

type SubmitOptions = {
  language?: string;
};

export type TranscriptionJobStart = {
  transcriptId: string;
  status: Extract<AssemblyTranscriptStatus, "queued" | "processing">;
};

export type TranscriptionJobPending = {
  status: Extract<AssemblyTranscriptStatus, "queued" | "processing">;
};

export type TranscriptionJobComplete = {
  status: "completed";
  transcript: TranscriptResult;
};

export type TranscriptionJobError = {
  status: "error";
  error: string;
};

export type TranscriptionJobStatus =
  | TranscriptionJobPending
  | TranscriptionJobComplete
  | TranscriptionJobError;

export async function startTranscriptionJob(
  audio: ReadableStream<Uint8Array>,
  apiKey: string,
  options: SubmitOptions = {},
): Promise<TranscriptionJobStart> {
  const uploadUrl = await uploadAudio(audio, apiKey);
  const transcript = await submitTranscript(uploadUrl, apiKey, options);

  if (transcript.status === "error") {
    throw new Error(transcript.error || "AssemblyAI could not start transcription");
  }

  return {
    transcriptId: transcript.id,
    status: transcript.status === "processing" ? "processing" : "queued",
  };
}

export async function getTranscriptionJobStatus(
  transcriptId: string,
  apiKey: string,
): Promise<TranscriptionJobStatus> {
  const transcript = await getTranscript(transcriptId, apiKey);

  if (transcript.status === "error") {
    return {
      status: "error",
      error: transcript.error || "AssemblyAI transcription failed",
    };
  }

  if (transcript.status !== "completed") {
    return { status: transcript.status };
  }

  const sentences = await getSentences(transcriptId, apiKey);

  return {
    status: "completed",
    transcript: normalizeTranscript(transcript, sentences),
  };
}

async function uploadAudio(
  audio: ReadableStream<Uint8Array>,
  apiKey: string,
): Promise<string> {
  const response = await assemblyFetch("/v2/upload", apiKey, {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
    },
    body: audio,
    duplex: "half",
  });

  const data = (await response.json()) as { upload_url?: string };

  if (!data.upload_url) {
    throw new Error("AssemblyAI upload did not return an upload URL");
  }

  return data.upload_url;
}

async function submitTranscript(
  audioUrl: string,
  apiKey: string,
  options: SubmitOptions,
): Promise<AssemblyTranscript> {
  const body: Record<string, unknown> = {
    audio_url: audioUrl,
    speech_models: SPEECH_MODELS,
  };

  if (options.language) {
    body.language_code = options.language;
  } else {
    body.language_detection = true;
  }

  const response = await assemblyFetch("/v2/transcript", apiKey, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return (await response.json()) as AssemblyTranscript;
}

async function getTranscript(
  transcriptId: string,
  apiKey: string,
): Promise<AssemblyTranscript> {
  const response = await assemblyFetch(`/v2/transcript/${transcriptId}`, apiKey);
  return (await response.json()) as AssemblyTranscript;
}

async function getSentences(
  transcriptId: string,
  apiKey: string,
): Promise<AssemblySentences> {
  const response = await assemblyFetch(
    `/v2/transcript/${transcriptId}/sentences`,
    apiKey,
  );
  return (await response.json()) as AssemblySentences;
}

async function assemblyFetch(
  path: string,
  apiKey: string,
  init: (RequestInit & { duplex?: "half" }) = {},
): Promise<Response> {
  const baseUrl = process.env.ASSEMBLYAI_BASE_URL || DEFAULT_BASE_URL;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: apiKey,
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getAssemblyErrorMessage(response));
  }

  return response;
}

async function getAssemblyErrorMessage(response: Response): Promise<string> {
  const data = await response.json().catch(() => null);
  const message =
    data?.error ||
    data?.message ||
    data?.detail ||
    response.statusText ||
    "Unknown AssemblyAI error";

  return `AssemblyAI request failed (${response.status}): ${message}`;
}

function normalizeTranscript(
  transcript: AssemblyTranscript,
  sentences: AssemblySentences,
): TranscriptResult {
  const segments = normalizeSegments(sentences);

  return {
    text: transcript.text || "",
    duration: transcript.audio_duration || sentences.audio_duration || 0,
    model: transcript.speech_model_used || SPEECH_MODELS[0],
    language: transcript.language_code || undefined,
    created_at: new Date().toISOString(),
    segments,
  };
}

function normalizeSegments(sentences: AssemblySentences): Segment[] | undefined {
  if (!sentences.sentences?.length) return undefined;

  return sentences.sentences.map((sentence) => ({
    text: sentence.text,
    start: sentence.start / 1000,
    end: sentence.end / 1000,
  }));
}
