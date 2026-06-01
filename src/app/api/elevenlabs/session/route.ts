import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { agentId, apiKey } = await request.json();

    if (!agentId || !apiKey) {
      return NextResponse.json(
        { error: "Agent ID and API Key are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
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
    return NextResponse.json({ signed_url: data.signed_url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
