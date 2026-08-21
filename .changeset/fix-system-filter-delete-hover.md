---
'@directus/app': patch
---

Fixed the filter delete (x) button in the search bar's filter popover becoming unclickable on hover. The global tooltip stays mounted in the DOM after closing, and its leftover positioning wrapper kept intercepting pointer events over whatever was underneath its last position. Also passed the `inline` prop down to the root `Nodes` component in the system filter interface so filter chips in the popover use the intended compact layout.
