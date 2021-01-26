# White-Labeling a Project

> The Directus App UX/UI is meant to be _transparent_, and uses "form follows function" as the
> guiding design principle. This allows the platform to be completely tailored to your branding,
> end-to-end.

## Project Settings

1. Navigate to **Settings > Project Settings**
2. Configure any of the following **branding fields**

-   **Project Name** — The name used at the top of the [Navigation Bar](/concepts/app-overview) and
    on the login/public pages
-   **Project URL** — The URL when clicking the logo at the top of the
    [Module Bar](/concepts/app-overview)
-   **Project Color** — The color used behind the logo at the top of the
    [Module Bar](/concepts/app-overview), on the login/public pages, and for the browser's FavIcon
-   **Project Logo** — A 40x40 pixel logo at the top of the [Module Bar](/concepts/app-overview) and
    on the login/public pages

<!-- prettier-ignore-start -->
::: tip Recommended Logo Styling
The 40x40 pixel Project Logo is inset within the 64x64 pixel Project
Color square. To avoid a "boxy" look, we recommend using a SVG or PNG logo with transparency.
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: tip Browser FavIcon & Title
The project color and logo are also used to set the dynamic favicon, and
the project title is used in the browser's title. This furthers the bespoke appearance of your
platform and makes it easier to differentiate between different Directus projects.
:::
<!-- prettier-ignore-end -->

### Public Page Styling

In addition to the above options, you can also apply the following additional styling to your
project's [public pages](/concepts/app-overview).

-   **Public Foreground** — An image shown on the right-side pane of public pages; max 400px width
-   **Public Background** — An image displayed behind the above foreground image, shown full-bleed
    within the right-side pane of public pages
-   **Public Note** — A helpful note displayed at the bottom of the right-side pane of public pages;
    supports markdown for rich-text formatting

<!-- prettier-ignore-start -->
::: tip Default Background Color
When a Public Background image is not set, the right-side pane of public pages uses the Project Color instead.
:::
<!-- prettier-ignore-end -->

## Themes & Custom CSS

The Directus App has been developed with customization and extensibility in mind. Colors and styles
referenced within the codebase all use CSS variables, and therefore it is easy to make comprehensive
changes to the App styling.

-   **Themes** — See the
    [Light Theme](https://github.com/directus/directus/blob/main/app/src/styles/themes/_light.scss)
    or [Dark Theme](https://github.com/directus/directus/blob/main/app/src/styles/themes/_dark.scss)
-   **Typography** — See the
    [Fonts](https://github.com/directus/directus/blob/main/app/src/styles/_type-styles.scss) and
    [Type Styles](https://github.com/directus/directus/blob/main/app/src/styles/mixins/type-styles.scss)
-   **Variables** — See the
    [Global Variables](https://github.com/directus/directus/blob/main/app/src/styles/_variables.scss)

You can override any core CSS, including the above variables, directly within the App through
project Settings.

1. Navigate to **Settings > Project Settings**
2. Scroll to the **CSS Overrides** field
3. Enter any **valid CSS**
4. Click the **Save** action button in the header

<!-- prettier-ignore-start -->

::: tip Action Styling The `--primary` variable (and its shades) control call-to-actions and all
other "Directus blue" elements within the App. While it may be tempting to override this variable
with your brand's color, please first review the following warnings:

-   Avoid using yellow, orange, or red hues that give a sense of "danger"
-   Avoid low-contrast colors like yellows, grays, etc, that might not be easily visible
-   Avoid low-saturation colors like black, which might not properly highlight CTAs :::
<!-- prettier-ignore-end -->

## API Reference

In addition to the static core docs, Directus also includes a Dynamic API Reference based on your
project's schema. This includes tailored endpoint info for each collection within your data model,
customizing the documentation to your specific project.

<!-- @TODO ## System Table Prefix

Most white-labeling takes place in the presentation layer of the platform's App, but in some cases
even the API and/or database needs to be a bit more agnostic. For that reason, Directus allows
changing the prefix used by system tables. By default this is set to use `directus_*` to avoid any
potential conflicts, but you can override this within the [Environment Variables](/reference/environment-variables). -->
