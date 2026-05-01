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

type TriggerMatch = {
  triggerPhrase: string;
  matchedSegment: Segment;
  segmentIndex: number;
};

export function findClipSuggestions(
  segments: Segment[],
  fileDuration: number
): ClipSuggestion[] {
  const matches: TriggerMatch[] = [];
  const matchedIndexes = new Set<number>();

  for (const phrase of TRIGGER_PHRASES) {
    for (let i = 0; i < segments.length; i++) {
      if (matchedIndexes.has(i)) continue;

      const text = segments[i].text.toLowerCase();
      if (!text.includes(phrase)) continue;

      matchedIndexes.add(i);

      matches.push({
        triggerPhrase: phrase,
        matchedSegment: segments[i],
        segmentIndex: i,
      });
    }
  }

  matches.sort((a, b) => a.matchedSegment.start - b.matchedSegment.start);

  return mergeNearbyMatches(matches, segments, fileDuration);
}

function mergeNearbyMatches(
  matches: TriggerMatch[],
  segments: Segment[],
  fileDuration: number,
): ClipSuggestion[] {
  const suggestions: ClipSuggestion[] = [];
  let currentGroup: TriggerMatch[] = [];

  for (const match of matches) {
    const latestTriggerStart =
      currentGroup[currentGroup.length - 1]?.matchedSegment.start;

    if (
      currentGroup.length === 0 ||
      match.matchedSegment.start - latestTriggerStart <= 30
    ) {
      currentGroup.push(match);
      continue;
    }

    suggestions.push(buildClipSuggestion(currentGroup, segments, fileDuration));
    currentGroup = [match];
  }

  if (currentGroup.length > 0) {
    suggestions.push(buildClipSuggestion(currentGroup, segments, fileDuration));
  }

  return suggestions;
}

function buildClipSuggestion(
  group: TriggerMatch[],
  segments: Segment[],
  fileDuration: number,
): ClipSuggestion {
  const earliestMatch = group[0];
  const latestMatch = group[group.length - 1];
  const triggerPhrases = Array.from(
    new Set(group.map((match) => match.triggerPhrase)),
  );
  const surroundingText = buildSurroundingText(
    segments,
    earliestMatch.segmentIndex,
  );

  return {
    triggerPhrase: triggerPhrases.join(", "),
    matchedSegment: earliestMatch.matchedSegment,
    clipStart: Math.max(0, earliestMatch.matchedSegment.start - 30),
    clipEnd: Math.min(fileDuration, latestMatch.matchedSegment.end + 30),
    filename: slugify(surroundingText) + ".mp3",
  };
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
