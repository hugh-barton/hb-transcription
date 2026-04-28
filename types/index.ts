export interface AudioFile {
  file: File;
  name: string;
  size: number;
  type: string;
  duration: number;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
}

export interface ClipSuggestion {
  triggerPhrase: string;
  matchedSegment: Segment;
  clipStart: number;
  clipEnd: number;
  filename: string;
}

export interface TranscriptResult {
  text: string;
  duration: number;
  model: string;
  language?: string;
  created_at: string;
  segments?: Segment[];
}

export interface TranscriptionParams {
  api_key: string;
  model?: string;
  language?: string;
  response_format?: "json" | "text" | "srt" | "verbose_json";
}
