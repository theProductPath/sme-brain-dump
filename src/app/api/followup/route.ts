import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const { transcript, geminiApiKey, openAiApiKey, anthropicApiKey, customRoleInfo } = await request.json();

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "Transcript is empty" }, { status: 400 });
    }

    const gApiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    const oApiKey = openAiApiKey || process.env.OPENAI_API_KEY;
    const aApiKey = anthropicApiKey || process.env.ANTHROPIC_API_KEY;

    if (!gApiKey && !oApiKey && !aApiKey) {
      return NextResponse.json(
        { error: "An API Key (Gemini, OpenAI, or Anthropic) is required to generate follow-up questions" },
        { status: 400 }
      );
    }

    const transcriptString = transcript
      .map((t: any) => `${t.role}: ${t.text}`)
      .join("\n");

    const prompt = `You are an expert transition advisor AI conducting a live knowledge-transfer interview with a subject matter expert.
The role context: ${customRoleInfo || "General subject matter expert transition"}.

Below is the current dialogue transcript so far. Analyze what has been said, find the key unwritten operational dependencies, workarounds, or risks that need clarification, and generate exactly ONE single, conversational follow-up question to probe deeper.

- Keep your question warm, clear, and highly focused.
- Your question MUST be under 40 words.
- Do NOT include any intro or conversational filler (e.g. "Got it.", "That makes sense."). Speak directly as the interviewer.
- CRITICAL INSTRUCTION: You MUST change the subject or angle from the previous question. Look at the last question asked by the AI, and deliberately ask about a DIFFERENT area of the SME's responsibilities, a DIFFERENT risk, or a DIFFERENT undocumented process. Do NOT ask about the exact same system or scenario again.

TRANSCRIPT SO FAR:
${transcriptString}

Your response must be ONLY the text of the single follow-up question.`;

    let questionText = "";
    let lastError: any = null;

    if (gApiKey && !questionText) {
      try {
        const genAI = new GoogleGenerativeAI(gApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        questionText = result.response.text().trim();
      } catch (e) {
        console.error("Gemini failed:", e);
        lastError = e;
      }
    }
    
    if (oApiKey && !questionText) {
      try {
        const openai = new OpenAI({ apiKey: oApiKey });
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        });
        questionText = response.choices[0].message.content?.trim() || "";
      } catch (e) {
        console.error("OpenAI failed:", e);
        lastError = e;
      }
    }
    
    if (aApiKey && !questionText) {
      try {
        const anthropic = new Anthropic({ apiKey: aApiKey });
        const response = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 150,
          messages: [{ role: "user", content: prompt }]
        });
        questionText = (response.content[0] as any).text.trim();
      } catch (e) {
        console.error("Anthropic failed:", e);
        lastError = e;
      }
    }

    if (!questionText) {
      throw new Error("All configured AI models failed or no keys were provided. Last error: " + (lastError?.message || "Unknown"));
    }

    return NextResponse.json({ question: questionText });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate follow-up question" },
      { status: 500 }
    );
  }
}
