import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { apiKey } = await request.json();

    if (!id || !apiKey) {
      return NextResponse.json(
        { error: "Conversation ID and API Key are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${id}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs API error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract dialog transcript turns
    const transcriptTurns = data.transcript || [];
    const formattedTranscript = transcriptTurns.map((turn: any) => ({
      role: turn.role === "user" ? "SME" : "AI",
      text: turn.message,
      time: turn.time_in_call_secs
    }));

    return NextResponse.json({
      conversation_id: id,
      transcript: formattedTranscript,
      raw: data
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
