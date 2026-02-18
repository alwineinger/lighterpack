# AGENTS.md

## Project overview
LighterPack is a Vue 2 + Vuex single-page app with an Express + MongoDB backend. The web UI is the primary product; server-side routes provide auth, persistence, sharing pages, and API endpoints.

### Architecture map
- `app.js`: express bootstrap, middleware, route mounting, webpack dev/prod integration.
- `client/`: Vue application (views, components, Vuex store, utility modules, styles).
- `server/`: auth, API/web endpoints, server-rendered share/export views.
- `templates/`: mustache templates used for shared/public list pages.
- `docs/`: API and mobile implementation docs.
- `test/e2e/`: Playwright end-to-end tests.

## Setup
1. Install dependencies: `npm install`
2. Ensure MongoDB is running.
3. Optional local config: create `config/local.json`.
4. Start app:
   - dev: `npm run dev`
   - prod-ish local: `npm run start`

### Environment variables / config keys
Set in `config/local.json` (preferred) or config override env:
- `databaseUrl`
- `port`
- `devServerPort`
- `bindings`
- `deployUrl`
- `publicUrl`
- `imgurClientID`
- `mailgunDomain`
- `mailgunBaseURL`
- `mailgunAPIKey`
- `moderators`

## Test and lint commands
- JS lint: `npm run lint:js`
- CSS lint: `npm run lint:css`
- E2E: `npx playwright test`

## Code style and folder conventions
- Keep Vue components in `client/components`, views in `client/views`.
- Shared domain structures live in `client/dataTypes.js`.
- Server API endpoints should be versioned under `/api/v1` and implemented in `server/`.
- Prefer small, focused changes and preserve legacy routes/user flows.

## Adding API endpoints + schemas
1. Add endpoint in `server/api-v1.js` (or a nearby versioned server module).
2. Keep response shape consistent (`{ data }` on success, `{ error }` on failures).
3. Update domain schema docs in `docs/api/domain-schemas.json`.
4. Update API reference in `docs/api/openapi-v1.yaml`.
5. If web UI consumes endpoint, wire through `client/api/` abstraction.

## Mobile responsive checks
- Validate at widths around 393px (iPhone 16 Pro portrait), 852px landscape-equivalent constraints, and 375px sanity width.
- Ensure key flows: list editing, item editing, share/export access, totals visibility.
- Confirm inputs remain >=16px on mobile and no horizontal scroll blocking core edits.

## Commit / PR guidelines
- Use incremental commits with clear scope.
- Include tests/lint output in PR description.
- Avoid breaking routes or storage formats.
- Mention migration/backward-compat considerations when touching persistence.

## Definition of done
- Existing user flows still work.
- New behavior is verified by tests or deterministic manual checks.
- Docs updated for any API/config/schema/mobile changes.
- No obvious accessibility regressions.

## Security notes
- Do not commit secrets or production credentials.
- Validate incoming API payloads and IDs.
- Keep cookie/session behavior backward compatible.
- Treat imported/exported content as untrusted input.
