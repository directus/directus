---
'@directus/themes': minor
'@directus/types': minor
'@directus/app': minor
---

Refactored focus ring from border/box-shadow to outline @formfcw

::: notice

- Potential breaking change for theme extensions: borderColorFocus, boxShadowHover, and boxShadowFocus are removed from the theme schema — custom themes referencing these will lose their focus overrides silently
- Potential breaking change for interface extensions that relied on --theme--form--field--input--border-color-focus or --theme--form--field--input--box-shadow-focus CSS variables will need to migrate to --theme--form--field--input--focus-ring-color

:::
