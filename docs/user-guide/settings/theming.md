---
description: A guide on how to create a custom Theme in Directus.
readTime: 2 min read
---

# Theming

> Theming allows you to customize and style the visual appearance of your Directus App.

## App Themes

The Directus App has been developed with customization and extensibility in mind. Colors and styles referenced within
the codebase are based around theme rules which makes it easy to make comprehensive changes to the App styling.

There are two themes included by default: Light and Dark. Each of the rules of these themes can be overridden through
the settings in either Project Settings (Global) or User Settings.

## Custom CSS

You can also override any core CSS directly within the App through Project Settings. This makes it easy to edit the CSS
variables listed in the themes above.

1. Navigate to **Settings Module > Project Settings**
2. Scroll to the **Custom CSS** field
3. Enter any **valid CSS**
4. Click the **Save** action button in the header

### Example

Since App styles are inserted/removed whenever a component is rendered, you'll need to be aware of CSS priority. Using
`:root` or `body` likely isn't scoped enough, you'll need to define a more specific scope, such as `#app`, or use
`!important`.

```css
body {
	--family-sans-serif: 'Comic Sans MS';
	--primary: MediumSlateBlue !important;
}
```

::: warning Action Styling

The `--primary` variable (and its shades) control call-to-actions and all other elements within the App using the
"Directus Purple". While it may be tempting to override this variable with your brand's color, please first review the
following warnings:

- Avoid using yellow, orange, or red hues that give a sense of "danger"
- Avoid low-contrast colors like yellows, grays, etc, that might not be easily visible
- Avoid low-saturation colors like black, which might not properly highlight CTAs

:::
