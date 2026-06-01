import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { transcript, geminiApiKey, customRoleInfo } = await request.json();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "Transcript is empty" }, { status: 400 });
    }

    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API Key is required to generate follow-up questions" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const transcriptString = transcript
      .map((t: any) => `${t.role}: ${t.text}`)
      .join("\n");

    const prompt = `You are an expert transition advisor AI conducting a live knowledge-transfer interview with a subject matter expert.
The role context: ${customRoleInfo || "General subject matter expert transition"}.

Below is the current dialogue transcript so far. Analyze what has been said, find the key unwritten operational dependencies, workarounds, or risks that need clarification, and generate exactly ONE single, conversational follow-up question to probe deeper.
- Keep your question warm, clear, and highly focused.
- Your question MUST be under 40 words.
- Do NOT include any intro or conversational filler (e.g. "Got it.", "That makes sense."). Speak directly as the interviewer.

TRANSCRIPT SO FAR:
${transcriptString}

Your response must be ONLY the text of the single follow-up question.`;

    const result = await model.generateContent(prompt);
    const questionText = result.response.text().trim();

    return NextResponse.json({ question: questionText });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate follow-up question" },
      { status: 500 }
    );
  }
}
