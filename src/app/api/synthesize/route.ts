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
        { error: "An API Key (Gemini, OpenAI, or Anthropic) is required for synthesis" },
        { status: 400 }
      );
    }

    const transcriptString = transcript
      .map((t: any) => `${t.role}: ${t.text}`)
      .join("\n");

    const systemPrompt = `You are a transition advisor AI. You have just completed an interview with a Subject Matter Expert (SME) who is transitioning out of their role.
The role details: ${customRoleInfo || "General subject matter expert transition"}.

Your task is to analyze the conversation transcript and compile a highly professional transition Knowledge Package containing four distinct documents:
1. Successor Brief: A high-level orientation for whoever steps into the role. Written for a smart colleague who is new to the role. Covers: Overview, Key Responsibilities, What Will Break Without Intervention, Three Things Not Written Down Anywhere, and Recommended First Week actions.
2. FAQ: Frequently Asked Questions regarding legacy offsets, cache updates, specific team pings, etc. Answered in the expert's own words.
3. Decision Log: Institutional judgment calls. Structure as a clean tabular format or structured list: Decision name, What was decided, Rationale, and Who to ask if unclear.
4. Operational Runbook: A step-by-step procedure for the key recurring tasks, detailing volume thresholds, lag offsets, and vendor hot-channels.

Extract specific operational details from the transcript (like offsets, inbox naming, refresh instructions, timings, Daylight Savings, and Slack channel names). Do not use placeholders. Keep the tone warm, practical, and highly detailed.

You MUST respond with a JSON object matching this exact TypeScript structure:
{
  "brief": "string containing HTML-formatted successor brief",
  "faq": "string containing HTML-formatted FAQ Q&A blocks",
  "decisions": "string containing HTML-formatted Decision Log table or list",
  "runbook": "string containing HTML-formatted step-by-step runbook"
}

Format the HTML cleanly using standard tags: <h1>, <h2>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, <tr>, <th>, <td>. Do not include raw markdown formatting inside the HTML strings, use raw HTML tags instead. Make the output matches the highly polished layout of tPP documents.`;

    let responseText = "";

    if (gApiKey) {
      const genAI = new GoogleGenerativeAI(gApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt = `${systemPrompt}\n\nTRANSCRIPT:\n${transcriptString}`;
      const result = await model.generateContent(prompt);
      responseText = result.response.text();
    } else if (oApiKey) {
      const openai = new OpenAI({ apiKey: oApiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `TRANSCRIPT:\n${transcriptString}` }
        ]
      });
      responseText = response.choices[0].message.content || "";
    } else if (aApiKey) {
      const anthropic = new Anthropic({ apiKey: aApiKey });
      const prompt = `${systemPrompt}\n\nReturn strictly valid JSON and nothing else.\n\nTRANSCRIPT:\n${transcriptString}`;
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }]
      });
      responseText = (response.content[0] as any).text;
    }

    try {
      const parsedData = JSON.parse(responseText);
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error("Failed to parse LLM JSON:", responseText);
      return NextResponse.json({
        brief: `<h1>Handoff Brief</h1><p>Failed to parse synthesis details cleanly, raw details: ${responseText}</p>`,
        faq: `<h1>FAQ</h1><p>Details could not be parsed as JSON</p>`,
        decisions: `<h1>Decision Log</h1><p>Details could not be parsed as JSON</p>`,
        runbook: `<h1>Runbook</h1><p>Details could not be parsed as JSON</p>`
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to synthesize knowledge package" },
      { status: 500 }
    );
  }
}
