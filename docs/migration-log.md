# Migration Log

## STEP 2 — Code.gs cleanup

- Duplicate `doGet()` removed.
- Backend kept as Google Apps Script bridge.

## STEP 3 — API Contract + HTTP Router

- Added HTTP `doGet()` / `doPost()` routing.
- Added action-based API bridge.
- Admin authorization explicitly deferred to security phase.

## STEP 4 — Index.html API Adapter

- Added `apiGet()` and `apiPost()`.
- Removed direct `google.script.run` dependency from the frontend.
- UI structure and visual design retained.

## STEP 4A — Integration Test

- Static contract mapping verified.
- Syntax check passed.
- Read-only and negative-path test runner created.
- Live HTTP validation must be executed against the deployed Apps Script Web App.

## STEP 5 — GitHub Repository

- Repository structure created.
- Legacy Apps Script snapshot preserved.
- Production UI reference copied to repository root.
- API contract and migration log added.
- No Vercel API implementation yet.
