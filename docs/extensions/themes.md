---
description: A guide on how to build custom Themes in Directus.
readTime: 2 min read
---

# Custom Themes

> Custom Themes allow you to create a new app design that's tailored to your brand or aesthetic.

## Extension Entrypoint

The entrypoint of your theme is the `index` file inside the `src/` folder of your extension package. It exports the
theme configuration and rules. When loading your theme, this rule set is imported by the Directus host app.

Example of a theme:

```js
import { defineTheme } from '@directus/extensions-sdk';

export default defineTheme({
	id: 'custom',
	name: 'My Custom Theme',
	appearance: 'dark',
	rules: {
		background: 'tomato',
	}
});
```

### Available Options

- `id` — The unique key for this theme. It is good practice to scope proprietary interfaces with an author prefix.
- `name` - The displayed name for this theme. This must be unique within your Directus project.
- `appearance` - To which appearance mode the theme belongs to, `light` or `dark`.
- `rules` - A set of theming rules from the theme schema.

### Available Rules

Rules that are configured in the `rules` property have to adhere to the properties defined in the Rules section of the
[theme schema](https://github.com/directus/directus/blob/main/packages/themes/src/schemas/theme.ts). This includes
matching how properties are nested in the JavaScript object, for example:

```js{3-5}
rules: {
	borderRadius: '24px',
	navigation: {
		background: 'rebeccapurple'
	}
}
```

Any rules that are not defined will fallback to the default theme for it's appearance. See the
([`default dark theme`](https://github.com/directus/directus/blob/main/packages/themes/src/themes/dark/default.ts) and
[`default light theme`](https://github.com/directus/directus/blob/main/packages/themes/src/themes/dark/default.ts)).

We recommend using TypeScript for this extension type. The `defineTheme` function is typed to properly check and
auto-complete all available rules.

Custom Themes include only the allowed rules, and do not include custom CSS.

### Theme Usage in the Directus Data Studio

Every rule is automatically inserted in the app's root element as a CSS variable which are used across the app's
components. For example, the JSON path `navigation.modules.button.foregroundActive` will be available as
`var(--theme--navigation--modules--button--foreground-active)`.

:::info Property Names

Nested objects are separated by `--`, and camelCase values are transformed to hyphen-case (for example,
`foregroundActive` becomes `foreground-active`).

:::

Because each rule is used as a CSS variable, each rule value should be valid CSS. This also means you can use any CSS
functions in the rules. For example, CSS'
[`color-mix`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) is a great way to theme palette
alternatives.

## Using User Theming Options as a Development Tool

The Theming Options customization interface found in the global appearance settings and user detail page uses theming
rules. For easier extension development, you can use this interface to configure your theme, and then save the output to
your theme extension by using the "Copy Raw Value" option above the interface.

## Google Fonts

The `fontFamily` rules take any valid CSS `font-family` value. To load a Google Font, wrap the font name in a set of
quotes `""`. This is still valid CSS, but if the font-name is wrapped in quotes, Directus will automatically try
downloading it through Google Fonts. For example:

```
// Use the locally installed font called "Comic Sans MS"
fontFamily: 'Comic Sans MS, sans-serif'

// Use the Google font "Yesteryear"
fontFamily: '"Yesteryear", sans-serif'
```

When using a Google Font, ensure the configured weight is available for the selected font.
