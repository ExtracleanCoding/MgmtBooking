# Repository Guidelines

## Project Structure & Module Organization
The app is a static single-page dashboard rooted at `index.html`. Core logic lives in `script.js`, while security utilities (sanitizers, validators) sit in `security.js`. Styling remains in `style.css`. Automated test helpers reside in `automated-test.js`, and seeded data is in `testdata.json`. Extended references, rollout plans, and troubleshooting guides are grouped under `documents/`—start with `documents/START_HERE.md` for a curated reading order.

## Build, Test, and Development Commands
No bundler is required; any static server works. From the repo root run `python -m http.server 8080` (or `npx http-server .`) to preview locally, then open `http://localhost:8080/index.html`. Import `testdata.json` via the in-app Settings > Import Backup flow. Run the quick regression suite by pasting the contents of `automated-test.js` into your browser console. Manual scenarios are documented in `documents/TEST_GUIDE.md`.

## Coding Style & Naming Conventions
Use four-space indentation and semicolons. Prefer `const` for immutable bindings and `let` otherwise; avoid `var`. Functions, data objects, and DOM IDs follow lower camelCase (e.g., `checkAndScheduleSMSReminders`). Keep modules self-contained: utility helpers belong in `security.js`, and view logic stays in `script.js`. When adding new templates, sanitize user-facing strings with `sanitizeHTML` or related helpers.

## Testing Guidelines
Browser-based tests rely on seeded state. After importing `testdata.json`, confirm the dashboard reflects six customers and twelve bookings before executing checks. Automated tests focus on time utilities and core state structures; extend that file with additional suites when fixing regressions. Name manual test cases after the business flow they cover (e.g., “Credits - Deduct Remaining Hours”). Capture console output or screenshots for any failing steps and attach them to the PR.

## Commit & Pull Request Guidelines
This workspace ships without Git history, so use Conventional Commit prefixes (e.g., `fix: prevent duplicate billing`) to keep contributions scannable. Each PR should include: a summary of the change, reproduction steps (or test plan) referencing automated/manual scripts, and links to relevant docs in `documents/`. Surface security impacts explicitly—note whenever `security.js` is touched or new user input is introduced.

## Security & Configuration Tips
Always route new DOM insertions through the sanitizers in `security.js`, and update `ValidationRules` when introducing new input types. If adding external libraries, document the source and integrity strategy in `documents/SECURITY.md` before merging.***
