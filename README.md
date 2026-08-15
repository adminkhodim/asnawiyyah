# PPTQ Asnawiyyah — GitHub Repository

Migration repository for PPTQ Asnawiyyah from Google Apps Script UI coupling toward a GitHub + Vercel architecture.

## Current status

- Frontend: Vanilla HTML/CSS/JavaScript.
- Production UI reference: `Index.html`.
- Legacy Apps Script backend: `legacy/Code.gs`.
- Legacy frontend snapshot: `legacy/Index.html`.
- API contract test: `tests/api-contract-test.html`.
- Google Sheets remains the current source of truth.
- Vercel API layer is intentionally NOT implemented in STEP 5.

## Architecture direction

```text
Browser
  |
  v
Index.html
  |
  v
API Adapter
  |
  +---- current bridge ----> Google Apps Script Web App
  |
  +---- target ------------> Vercel API
                              |
                              v
                        Repository Layer
                              |
                              v
                        Google Sheets / Drive
```

## API actions currently supported by Apps Script bridge

### GET

- `action=getKabar`
- `action=getBanner`
- `action=checkStatus&nisn={nisn}`

### POST

- `action=submitPPDB`
- `action=saveBerita`
- `action=saveBanner`
- `action=deleteBanner`
- `action=toggleBanner`

## Important

Do not commit secrets, service-account credentials, private keys, or production `.env` files.

Admin API authorization is not yet production-ready in the Apps Script bridge. Do not expose admin mutations as a trusted production security boundary until the Vercel/server-side auth layer is implemented.
