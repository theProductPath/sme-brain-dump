# Decisions Log

## 2026-04-09, web app over CLI
**Decision:** Build SME Brain Dump as a static web app rather than a CLI skill.
**Alternatives:** CLI/script bundle, generated HTML from a script.
**Rationale:** The interview itself is the product, so a browser UI is the fastest path to a usable zero-config experience.
**Owner:** sme-dev.

## 2026-04-09, stub-first architecture
**Decision:** Ship a fully working stub interview before live-mode provider integration.
**Alternatives:** Parallel live-mode work, API-first build.
**Rationale:** Brief explicitly requires zero-config behavior and end-to-end stub flow.
**Owner:** sme-dev.

## 2026-04-09, Sally Chen example scenario
**Decision:** Use Sally Chen, Data Pipeline Owner as the shipped example.
**Alternatives:** Invent a new role transition case.
**Rationale:** Existing demo concept already anchors the scenario and it maps cleanly to the four artifacts.
**Owner:** sme-dev.
