# Mobile Companion Integration Notes

This project now exposes API hooks intended for a future native iOS/Android companion app.

## API base and versioning
- Base path: `/api/v1`
- Current endpoints:
  - `GET /api/v1/session`
  - `PUT /api/v1/library`
  - `GET /api/v1/packs`
  - `POST /api/v1/packs/:packId/share`

## Auth strategy
- Current auth uses an `lp` session cookie.
- For native app support, recommended next step is adding token issuance + refresh endpoints while preserving existing cookie-based web sessions.

## Sync strategy
- `syncToken` required on library writes to prevent stale writes.
- On token mismatch, API returns `409` with a stable error code.
- API returns `updatedAt` metadata and a `deletedPacks` tombstone array in session/list metadata.

## Domain schema source
- Canonical schema document: `docs/api/domain-schemas.json`.
- OpenAPI summary: `docs/api/openapi-v1.yaml`.

## Web dogfooding
- Web UI now uses `client/api/mobile-api.js` for session load, library save, and share-id creation.
