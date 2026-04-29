import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/openai";

type TranscribeParams = {
  model?: string;
  language?: string;
  response_format?: "json" | "text" | "srt" | "verbose_json";
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const transcribeParams: TranscribeParams = {};

    if (formData.get("model")) {
      transcribeParams.model = formData.get("model") as string;
    }

    if (formData.get("language")) {
      transcribeParams.language = formData.get("language") as string;
    }

    if (formData.get("response_format")) {
      transcribeParams.response_format = formData.get(
        "response_format"
      ) as "json" | "text" | "srt" | "verbose_json";
    }

    const result = await transcribeAudio(file, apiKey, transcribeParams);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
