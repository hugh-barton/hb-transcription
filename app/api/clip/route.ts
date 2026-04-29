import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

const FFMPEG = "/opt/homebrew/bin/ffmpeg";

const OUTPUT_FORMATS = {
  mp3: {
    extension: "mp3",
    mimeType: "audio/mpeg",
    ffmpegArgs: ["-acodec", "libmp3lame", "-ar", "44100", "-ac", "2", "-b:a", "192k"],
  },
  m4a: {
    extension: "m4a",
    mimeType: "audio/mp4",
    ffmpegArgs: ["-c:a", "aac", "-ar", "44100", "-ac", "2", "-b:a", "192k"],
  },
} as const;

type OutputFormat = keyof typeof OUTPUT_FORMATS;

export async function POST(request: NextRequest) {
  let inputPath = "";
  let outputPath = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clipStart = parseFloat(formData.get("clipStart") as string);
    const clipEnd = parseFloat(formData.get("clipEnd") as string);
    const requestedFormat = formData.get("format");
    const format = isOutputFormat(requestedFormat) ? requestedFormat : "m4a";
    const outputFormat = OUTPUT_FORMATS[format];
    const filename = withExtension(
      (formData.get("filename") as string) || "clip.mp3",
      outputFormat.extension
    );

    if (!file || isNaN(clipStart) || isNaN(clipEnd)) {
      return NextResponse.json(
        { error: "Missing file, clipStart, or clipEnd" },
        { status: 400 }
      );
    }

    if (clipStart < 0 || clipEnd <= clipStart) {
      return NextResponse.json(
        { error: "Invalid clip window" },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const ext = file.name.split(".").pop() || "mp3";
    inputPath = join("/tmp", `hb-clip-in-${id}.${ext}`);
    outputPath = join("/tmp", `hb-clip-out-${id}.${outputFormat.extension}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(inputPath, buffer);

    const duration = clipEnd - clipStart;
    await execFileAsync(FFMPEG, [
      "-ss", String(clipStart),
      "-i", inputPath,
      "-t", String(duration),
      "-vn",
      ...outputFormat.ffmpegArgs,
      "-y",
      outputPath,
    ], { timeout: 30000 });

    if (!existsSync(outputPath)) {
      return NextResponse.json(
        { error: "FFmpeg produced no output" },
        { status: 500 }
      );
    }

    const clipBuffer = readFileSync(outputPath);

    const headers = new Headers();
    headers.set("Content-Type", outputFormat.mimeType);
    headers.set("Content-Length", String(clipBuffer.byteLength));
    if (formData.get("preview") !== "true") {
      headers.set(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
    }

    return new NextResponse(clipBuffer, { headers });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  } finally {
    try {
      if (inputPath) unlinkSync(inputPath);
    } catch {}
    try {
      if (outputPath) unlinkSync(outputPath);
    } catch {}
  }
}

function isOutputFormat(value: FormDataEntryValue | null): value is OutputFormat {
  return value === "mp3" || value === "m4a";
}

function withExtension(filename: string, extension: string) {
  const withoutExtension = filename.replace(/\.[a-z0-9]+$/i, "");
  return `${withoutExtension}.${extension}`;
}
