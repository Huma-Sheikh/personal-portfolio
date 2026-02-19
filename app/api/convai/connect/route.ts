import { NextResponse } from "next/server";

interface ConvaiErrorResponse {
  message?: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { character_session_id?: string };
    const { character_session_id } = body;

    const apiKey = process.env.CONVAI_API_KEY;
    const characterId = process.env.CONVAI_CHARACTER_ID;

    if (!apiKey || !characterId) {
      return NextResponse.json(
        { error: "Missing CONVAI_API_KEY or CONVAI_CHARACTER_ID in environment variables" },
        { status: 500 }
      );
    }

    const requestBody = {
      character_id: characterId,
      connection_type: "audio",
      ...(character_session_id ? { character_session_id } : {}),
    };

    console.log("🔗 Connecting to Convai (language set in dashboard)");

    const resp = await fetch("https://live.convai.com/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await resp.json() as ConvaiErrorResponse;

    if (!resp.ok) {
      console.error("❌ Convai API error:", data);
      return NextResponse.json({ error: data }, { status: resp.status });
    }

    console.log("✅ Connected - using character's dashboard language settings");
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("💥 Server error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}