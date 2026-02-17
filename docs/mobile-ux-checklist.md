# Mobile UX Checklist (iPhone 16 Pro / iOS Safari)

## Layout
- [x] Viewport uses `viewport-fit=cover`.
- [x] App uses safe-area insets for left/right and bottom padding.
- [x] Header remains reachable with sticky behavior on small screens.
- [x] Item rows adapt into card-like stacked layout under 820px.

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

## Screens verified
- [x] Pack detail editing (categories/items)
- [x] Share popover flows
- [x] Totals/footer readability on narrow viewport
