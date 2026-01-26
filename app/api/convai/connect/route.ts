import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { character_session_id } = await req.json().catch(() => ({}));
    
    const apiKey = process.env.CONVAI_API_KEY;
    const characterId = process.env.CONVAI_CHARACTER_ID;

    if (!apiKey || !characterId) {
      return NextResponse.json(
        { error: "Missing CONVAI_API_KEY or CONVAI_CHARACTER_ID in environment variables" },
        { status: 500 }
      );
    }

    const resp = await fetch("https://live.convai.com/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        character_id: characterId,
        connection_type: "audio",
        character_session_id: character_session_id || undefined,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Convai API error:", data);
      return NextResponse.json({ error: data }, { status: resp.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}