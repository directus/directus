---
description: A guide on how to create a custom Theme in Directus.
readTime: 2 min read
---

# Theming

> Theming allows you to customize and style the visual appearance of your Directus App.

The Directus App has been developed with customization and extensibility in mind. Colors and styles referenced within
the codebase are based around theme rules which makes it easy to make comprehensive changes to the App styling.

There are two themes included by default: Light and Dark. Each of the rules of these themes can be overridden through
the settings in either Theming or User Settings.

## Branding

<!-- <video title="How to Configure Branding and Style in Project Settings" autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/configuration/project-settings/project-settings-20220815/branding-and-style-20220811A.mp4" type="video/mp4" />
</video> -->

- **Project Color** — Sets color on the project logo, FavIcon and login/public pages.
- **Project Logo** — Adds a 40x40px logo at the top of the
  [Module Bar](/user-guide/overview/data-studio-app#_1-module-bar) and on the login/public pages. The image is inset
  within a 64x64px square filled with the project color. We recommend using a PNG file for optimal compatibility.
- **Public Foreground** — Adds image on the public page's right-pane _(max-width 400px)_.
- **Public Background** — Adds image displayed behind the public foreground image, shown full-bleed within the public
  page's right-pane. When a public background image is not set, the project color is used instead.
- **Public Favicon** — Adds favicon for the app.
- **Public Note** — A helpful note displayed at the bottom of the public page's right-pane, supports markdown for
  rich-text formatting.
- **Default Appearance** — Light or Dark theme (or based on system preference).

## Theming Defaults

- **Light Theme Customization** — Default customization for `light` theme in use.
- **Dark Theme Customization** — Default customization for `dark` theme in use.
- **Custom CSS** — Applies custom CSS rules to override the Data Studio's default styling. Be aware that the Data
  Studio's core code, and therefore its DOM selectors, can change at any time. These updates are not considered a
  breaking change.

::: tip Browser FavIcon & Title

The Project Color is also used to set a dynamic FavIcon and the Project Name is used in the browser's page title, making
it easier to identify different Directus projects.

:::

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
