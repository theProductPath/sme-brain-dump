# SME Brain Dump

SME Brain Dump is an AI-powered interview experience for role transitions. It captures institutional knowledge from a subject matter expert and turns one conversation into a usable Knowledge Package:

- Successor Brief
- FAQ
- Decision Log
- Runbook

## Modes

- **Stub mode**, fully functional with zero API keys.
- **Live mode**, supports user-provided LLM and ElevenLabs keys.

## Example

The repo includes a complete example scenario for **Sally Chen — Data Pipeline Owner**.

## Run locally

Open `index.html` in a browser, or serve the folder with any static file server.

## Repo contents

- `index.html` - landing page and product shell
- `example/` - complete Sally Chen transcript and Knowledge Package
- `app/` - stub/live architecture notes and source docs
- `_planning/DECISIONS-LOG.md` - technical decisions

## Notes

This product is designed to ship as a browser-first web app with a zero-config stub path and a clean live-mode extension path.