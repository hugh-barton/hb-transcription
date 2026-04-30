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

export interface TranscriptionJobStart {
  transcriptId: string;
  status: "queued" | "processing";
}

export type TranscriptionJobStatus =
  | {
      status: "queued" | "processing";
    }
  | {
      status: "completed";
      transcript: TranscriptResult;
    }
  | {
      status: "error";
      error: string;
    };
