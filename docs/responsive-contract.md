# Responsive Contract

This contract defines the supported mobile constraints and the minimum UX guarantees for `/`, `/lists`, and `/gear`.

## Breakpoint constraints

- **393 x 852** (iPhone 16 Pro portrait baseline)
- **375 x 812** (narrow sanity baseline)
- **852 x 393** (landscape-like compact baseline)

## Shared responsive source of truth

All component behavior that depends on viewport or pointer context should derive from `client/utils/responsive.js`.

- `isCompactViewport` controls compact layout logic.
- `isCoarsePointer` captures touch-centric devices that may require compact controls.
- `isLandscape` can tune spacing for the 852x393 constraint.

Avoid direct component-level `window.matchMedia` listeners when equivalent state exists in the shared utility.

## Regression checklist

For each baseline viewport:

1. No clipping of core actions (tabs, add item/category actions, share/settings/help/account affordances).
2. No blocked list editing (item inputs are visible, focusable, and editable).
3. No blocked vertical scroll in list, lists, and gear routes.
4. Touch targets remain accessible (minimum 36px tab controls, no overlapping click zones).
5. Navigation affordances persist across route transitions (`list` <-> `lists` <-> `gear`) and keep session/list state.

## Quality gate

The Playwright suite in `test/e2e/mobile-layout.spec.ts` is the enforcement point for this contract and should be updated when layout behavior intentionally changes.
