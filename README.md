# SME Brain Dump

An AI-powered interview experience for role transitions that captures institutional knowledge from subject matter experts.

## The Problem
When a key subject matter expert (SME) leaves a role, critical institutional knowledge walks out the door with them. Standard handovers are often rushed, incomplete documents or scattered notes. The successor is left to figure out the undocumented realities of the job through trial and error.

A good handover shouldn't rely on the departing employee guessing what's important. It needs an active, structured extraction process.

## What is this?
This is a Next.js application that turns an advanced LLM and voice AI into an **Automated Knowledge Interviewer**.

It facilitates a conversational "brain dump" with the departing SME, capturing deep context, and automatically synthesizes it into a structured, usable Knowledge Package.

## How it Works

**1. The Interview (Voice or Text)**  
The SME engages in a guided conversation. The AI dynamically asks probing questions about their daily responsibilities, unspoken rules, critical relationships, and historical context. (Includes a "Live" mode with real-time AI and a "Stub" mode for demonstrations without API keys).

**2. The Synthesis**  
The application processes the conversation and extracts the core knowledge, organizing it into structured artifacts.

**3. The Deliverables**  
It generates a comprehensive Knowledge Package including:
- **Successor Brief**: The 10,000-foot view.
- **FAQ**: Common questions and nuanced answers.
- **Decision Log**: Why things were built the way they were.
- **Runbook**: Step-by-step processes for critical tasks.


## Key Features
- **ElevenLabs WebRTC Conversational AI:** Real-time, ultra-low latency voice interview mode using ElevenLabs.
- **Dynamic Variables Mapping:** Seamlessly passes `{{roleName}}` and `{{contextInfo}}` into the ElevenLabs agent's system prompt and greeting.
- **Hybrid Voice & Text Input:** Allows the SME to speak naturally or type technical details during the live ElevenLabs session.
- **Gemini Dynamic STT Backup:** If ElevenLabs fails or keys are missing, the app elegantly falls back to a Gemini-driven text-to-speech & speech-to-text backup interview loop.
- **Fault-Tolerant Synthesis (Multi-LLM):** Compiles the handoff documents automatically. If the primary LLM (Gemini) fails or rate-limits, it cascades sequentially to OpenAI, then Anthropic.
- **Client-Side Key Management:** API keys (ElevenLabs, Gemini, OpenAI, Anthropic) are stored locally and securely in the browser's `localStorage`.

## Repository Structure
```text
sme-brain-dump/
├── src/
│   ├── app/                # Next.js App Router (pages and layouts)
│   └── components/         # React components (LiveInterview, StubInterview, SettingsDrawer)
├── _archive/               # Original HTML prototype, example scenario, and planning docs
├── package.json            # Project dependencies and scripts
└── sync-drive.sh           # Script to sync local git with the Google Drive canonical folder
```

## Quick Start
1. Navigate to the project directory (`~/dev/sme-brain-dump`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (or enter them in the Settings Drawer in the UI). You will need:
   - Google Gemini API Key
   - ElevenLabs API Key
   *(Note: You can run "Stub mode" without keys for a purely front-end demo)*
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment & Syncing
This project is configured for deployment to platforms like Railway (`sme-brain-dump-production.up.railway.app`).

To push your local updates to GitHub and simultaneously sync your changes back to the canonical Google Drive products folder, run:
```bash
npm run sync
```

## Philosophy
This kit is part of the product methodology by theProductPath. It emphasizes capturing high-value qualitative data through conversational interfaces and transforming it into structured, actionable business artifacts.