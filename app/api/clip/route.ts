import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

const FFMPEG = "/opt/homebrew/bin/ffmpeg";
const OUTPUT_MIME_TYPE = "audio/mpeg";
const OUTPUT_EXTENSION = "mp3";

export async function POST(request: NextRequest) {
  let inputPath = "";
  let outputPath = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clipStart = parseFloat(formData.get("clipStart") as string);
    const clipEnd = parseFloat(formData.get("clipEnd") as string);
    const filename = (formData.get("filename") as string) || "clip.mp3";

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
    outputPath = join("/tmp", `hb-clip-out-${id}.${OUTPUT_EXTENSION}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(inputPath, buffer);

    const duration = clipEnd - clipStart;
    await execFileAsync(FFMPEG, [
      "-ss", String(clipStart),
      "-i", inputPath,
      "-t", String(duration),
      "-vn",
      "-acodec", "libmp3lame",
      "-ar", "44100",
      "-ac", "2",
      "-b:a", "192k",
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
    headers.set("Content-Type", OUTPUT_MIME_TYPE);
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
