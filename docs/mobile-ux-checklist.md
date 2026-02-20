# Mobile UX Checklist (iPhone 16 Pro / iOS Safari)

## Layout
- [x] Viewport uses `viewport-fit=cover`.
- [x] App uses safe-area insets for left/right and bottom padding.
- [x] Header remains reachable with sticky behavior on small screens.
- [x] Item rows adapt into card-like stacked layout under 820px.
- [x] List/Lists/Gear tabs are shared by one reusable component.
- [x] Mobile routes no longer hard-redirect on width alone; compact mode now uses viewport + pointer capabilities.

## Inputs and touch
- [x] Input/select/textarea/button font size is 16px+ on mobile to avoid iOS zoom.
- [x] Numeric fields use `inputmode="decimal"`.
- [x] Action controls become visible on touch widths.
- [x] Tap targets for small buttons were increased.

## Accessibility
- [x] Added `:focus-visible` outline styling.
- [x] Added ARIA labels on item text and numeric inputs.

## Performance
- [x] Reduced horizontal overflow pressure by stacking item fields on narrow widths.
- [x] Sticky header reduces repeated scroll-to-top interactions.
- [x] Sidebar gear rows now use responsive grid layout (no fixed 235px content width).

## Screens verified
- [x] Pack detail editing (categories/items)
- [x] Library gear editing (including mobile gear view)
- [x] Share popover flows
- [x] Totals/footer readability on narrow viewport

## Automated checks
- [x] Playwright mobile editing + overflow checks at `393x852` and `375x812`.
- [x] Playwright compact landscape tab flow checks at `852x393` (List/Lists/Gear).
