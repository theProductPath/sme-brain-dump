# DECISIONS LOG — SME Brain Dump

## 2026-04-06

### 1) Ship static reviewable pages before any backend work
- **Decision:** Build `stub.html`, `live.html`, and `example.html` as fully static, browser-openable artifacts.
- **Reason:** The repo was scaffold-only and needed to be reviewable locally immediately.
- **Impact:** Users can evaluate the full product story and the end-to-end stub experience without API keys.

### 2) Stub mode is the working default
- **Decision:** Make the stub interview flow fully functional with local state, scripted branching, transcript capture, and package assembly.
- **Reason:** Priority was to deliver an end-to-end usable flow first.
- **Impact:** The product demonstrates the core UX even without backend services.

### 3) Sally Chen example scenario
- **Decision:** Use Sally Chen — Data Pipeline Owner as the built-in example knowledge package.
- **Reason:** Matches the requested scenario and demonstrates a concrete operational handoff.
- **Impact:** The example page and package excerpts are aligned to a realistic data-ops transition.

### 4) Honest live-mode placeholder
- **Decision:** Keep live mode as an architectural placeholder with explicit API key guidance and no fake generation.
- **Reason:** Better to be truthful than to simulate unsupported behavior.
- **Impact:** Reviewers can see the intended runtime shape and required config variables.

### 5) Reviewable local artifact set
- **Decision:** Keep the repo focused on browser-openable HTML artifacts instead of introducing build tooling.
- **Reason:** Faster review and lower friction for this prototype stage.
- **Impact:** The product can be opened directly from the filesystem or served statically.
