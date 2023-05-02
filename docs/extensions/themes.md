---
description: A guide on how to build custom Themes in Directus.
readTime: 2 min read
---

# Themes & Styling

> **Form Follows Function** is the guiding design principle of Directus. The minimal UI allows the platform to be easily
> tailored to your brand. [Learn more about the App](/app/overview).

## App Themes

The Directus App has been developed with customization and extensibility in mind. Colors and styles referenced within
the codebase all use CSS variables, and therefore it is easy to make comprehensive changes to the App styling.

There are two themes included by default: Light and Dark. You can duplicate these files to create your own themes — with
no limit to customization. Below are several code resources for key SCSS files.

- **Themes** — See the [Light Theme](https://github.com/directus/directus/blob/main/app/src/styles/themes/_light.scss)
  or [Dark Theme](https://github.com/directus/directus/blob/main/app/src/styles/themes/_dark.scss)
- **Typography** — See the [Fonts](https://github.com/directus/directus/blob/main/app/src/styles/_type-styles.scss) and
  [Type Styles](https://github.com/directus/directus/blob/main/app/src/styles/mixins/type-styles.scss)
- **Variables** — See the
  [Global Variables](https://github.com/directus/directus/blob/main/app/src/styles/_variables.scss)

## Project Styling

See [Adjusting Project Settings](/app/project-settings)

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
