# App Architecture

## Stub mode
- Scripted interview flow
- Branching follow-ups
- Transcript capture
- Template-based Knowledge Package generation

## Live mode
- Settings panel for API keys
- LLM provider abstraction for Claude/GPT/Gemini-style providers
- ElevenLabs voice synthesis fallback to browser TTS
- Clean mode switch between stub and live

## Implementation note
This repo ships the product shell, example artifacts, and landing page. The stub/live logic is intentionally documented so the app can be expanded without changing the core user flow.