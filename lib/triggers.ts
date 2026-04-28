import { Segment } from "@/types";

export const TRIGGER_PHRASES = [
  "that's gold",
  "thats gold",
  "clip that",
  "clip it",
  "that's perfect",
  "thats perfect",
  "beautiful",
  "that's the one",
  "thats the one",
  "save that",
  "save it",
  "that's a clip",
  "thats a clip",
  "gold",
];

export interface ClipSuggestion {
  triggerPhrase: string;
  matchedSegment: Segment;
  clipStart: number;
  clipEnd: number;
  filename: string;
}

export function findClipSuggestions(
  segments: Segment[],
  fileDuration: number
): ClipSuggestion[] {
  const matches: ClipSuggestion[] = [];
  const matchedIndexes = new Set<number>();

  for (const phrase of TRIGGER_PHRASES) {
    for (let i = 0; i < segments.length; i++) {
      if (matchedIndexes.has(i)) continue;

      const text = segments[i].text.toLowerCase();
      if (!text.includes(phrase)) continue;

      matchedIndexes.add(i);

      const t = segments[i].start;
      const clipStart = Math.max(0, t - 30);
      const clipEnd = Math.min(fileDuration, segments[i].end + 30);

      const surroundingText = buildSurroundingText(segments, i);
      const filename = slugify(surroundingText) + ".mp3";

      matches.push({
        triggerPhrase: phrase,
        matchedSegment: segments[i],
        clipStart,
        clipEnd,
        filename,
      });
    }
  }

  matches.sort((a, b) => a.matchedSegment.start - b.matchedSegment.start);

  return matches;
}

function buildSurroundingText(segments: Segment[], index: number): string {
  const parts: string[] = [];
  if (index > 0) {
    parts.push(segments[index - 1].text.trim());
  }
  parts.push(segments[index].text.trim());
  if (index < segments.length - 1) {
    parts.push(segments[index + 1].text.trim());
  }
  return parts.join(" ");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
