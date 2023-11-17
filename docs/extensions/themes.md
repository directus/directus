---
description: A guide on how to build custom Themes in Directus.
readTime: 2 min read
---

# Custom Themes <small></small>

> Custom Themes allow you to create a new app design that's tailored to your brand or aesthetic.

## Extension Entrypoint

The entrypoint of your theme is the `index` file inside the `src/` folder of your extension package. It exports the
theme configuration and its' rules. When loading your theme, this rule set is imported by the Directus host app.

Example of a theme:

```js
import { defineTheme } from '@directus/extensions-sdk';

export default defineTheme({
	name: 'My Custom Theme',
	appearance: 'dark',
	rules: {
		background: 'tomato',
	}
});
```

### Available Rules

Rules that are configured in the `rules` property have to adhere to the rules defined in the theme schema:

https://github.com/directus/directus/blob/main/packages/themes/src/schemas/theme.ts

We recommend using TypeScript for this extension type. The `defineTheme` function is typed to properly auto-complete all
available rules.

Any rules that are not defined will fallback to the default theme for it's appearance.
([dark](https://github.com/directus/directus/blob/main/packages/themes/src/themes/dark/default.ts) |
[light](https://github.com/directus/directus/blob/main/packages/themes/src/themes/dark/default.ts))

Every rule is automatically inserted in the app's root element as a CSS variable which are used across the app's
components. For example, the JSON path `navigation.modules.button.foregroundActive` will be available as
`var(--theme--navigation--modules--button--foreground-active)`. Note that nested objects are separated by `--`, and
camelCase values are transformed to hyphen-case (so `foregroundActive` -> `foreground-active`).

Because each rule is used as a CSS variable, each rule value should be valid CSS. This also means you can use any CSS
functions in the rules. For example, CSS'
[`color-mix`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) is a great way to theme palette
alternatives.

## Using "Overrides" as a dev tool

The Theme Overrides interface found in Settings > Appearance or on the user detail page uses the same rules available to
the theme extensions. For easier extension development, you can use that interface to configure your ideal theme, and
then save the output to your theme extension by using the "Copy Raw Value" option.

## Google Fonts

The `fontFamily` rules take any standard CSS `font-family` value. To load in a font from Google Fonts, simply wrap the
font-name in a set of quotes `""`. This is still valid CSS, but if the font-name is wrapped in quotes, Directus will
automatically try downloading it through Google Fonts.

For example:

```
// Use the locally installed font called "Comic Sans MS"
fontFamily: 'Comic Sans MS, sans-serif'

// Use the Google font "Yesteryear"
fontFamily: '"Yesteryear", sans-serif'
```
