# Project Settings

> TK

All project configuration is handled by the `.env` file within the `/api` directory. This file accepts a number of
environment variables, each is explained in the following reference:

- [Environment Variables](/reference/environment-variables)

## Adjusting Project Settings

1. Navigate to **Settings > Project Settings**
2. Configure any of the following **branding fields**

- **Project Name** — The name used at the top of the [Navigation Bar](/concepts/application/#_2-navigation-bar) and on
  the login/public pages
- **Project URL** — The URL when clicking the logo at the top of the [Module Bar](/concepts/application/#_1-module-bar)
- **Project Color** — The color used behind the logo at the top of the
  [Module Bar](/concepts/application/#_1-module-bar), on the login/public pages, and for the browser's FavIcon
- **Project Logo** — A 40x40 pixel logo at the top of the [Module Bar](/concepts/application/#_1-module-bar) and on the
  login/public pages. The image is _inset_ within the 64x64 pixel square filled with the Project Color, so we recommend
  using a SVG or PNG logo with transparency to avoid a "boxy" look.

::: tip Browser FavIcon & Title

The Project Color is also used to set a dynamic favicon, and the Project Name is used in the browser's page title. This
makes it easier to identify different Directus projects in the browser.

:::

### Public Pages

In addition to the above global Project Settings, you can also apply the following styling to tailor your project's
[public pages](/guides/projects/#public-pages).

- **Public Foreground** — An image centered in the public page's right-pane. Limited to a maximum width of 400px.
- **Public Background** — An image displayed behind the above foreground image, shown full-bleed within the public
  page's right-pane. When a Public Background image is not set, the Project Color is used instead.
- **Public Note** — A helpful note displayed at the bottom of the public page's right-pane; supports markdown for
  rich-text formatting

### Security

- **Auth Password Policy** — Allows setting a policy requirement for all user's passwords, with the following options:
  - None — Not recommended
  - Weak — Minimum of 8 characters
  - Strong — Uppercase, lowercase, numbers, and special characters
- **Auth Login Attempts** — Sets the number of failed login attempts allowed before a user's account is locked. Once
  locked, an Admin user is required to unlock the account.

### Files & Thumbnails

#### Creating a Thumbnail Preset

1. Navigate to **Settings > Project Settings**
2. Scroll to the **Storage Asset Presets** field
3. Click **Add a New Item**
4. Enter a unique **Key** for the preset
5. Enter the **Fit**, **Width**, **Height**, and **Quality** for the preset
6. Click the **Save** action button in the header

### App Overrides

See [Styles > Custom CSS](/guides/styles/#custom-css)

### Modules

- **Module Bar** — Allows the customisation of links displayed in the module bar:
  - Module Visibility — Show or hide modules by toggling the checkbox.
  - Link Reordering — Reorder links by dragging on the sort handle.
  - Link Creation — URLs should start with a `/` for links within the
    [Directus App](/concepts/application/#the-directus-application).
