# Project Settings

> This is where you can adjust all of the **global** settings for your project. Changes saved here are instantly
> reflected throughout the platform.

## General

- **Project Name** — The name used at the top of the [Navigation Bar](/app/overview/#_2-navigation-bar) and on the
  login/public pages
- **Project Descriptor** - The descriptor shown below the Project Name at the top of the
  [Navigation Bar](/app/overview/#_2-navigation-bar) and on the login/public pages
- **Project URL** — The URL when clicking the logo at the top of the [Module Bar](/app/overview/#_1-module-bar)
- **Default Language** - The default language used within the app.

## Branding & Style

- **Project Color** — The color used behind the logo at the top of the [Module Bar](/app/overview/#_1-module-bar), on
  the login/public pages, and for the browser's FavIcon
- **Project Logo** — A 40x40 pixel logo at the top of the [Module Bar](/app/overview/#_1-module-bar) and on the
  login/public pages. The image is _inset_ within the 64x64 pixel square filled with the Project Color, so we recommend
  using a SVG or PNG logo with transparency to avoid a "boxy" look.
- **Public Foreground** — An image centered in the public page's right-pane. Limited to a maximum width of 400px.
- **Public Background** — An image displayed behind the above foreground image, shown full-bleed within the public
  page's right-pane. When a Public Background image is not set, the Project Color is used instead.
- **Public Note** — A helpful note displayed at the bottom of the public page's right-pane; supports markdown for
  rich-text formatting
- **Custom CSS** — Allows for adding CSS rules to override the App's default styling. Be aware that the App's core code,
  and therefore its DOM selectors, can change at any time. These updates are not considered a breaking change.

::: tip Browser FavIcon & Title

The Project Color is also used to set a dynamic favicon and the Project Name is used in the browser's page title, making
it easier to identify different Directus projects.

:::

## Modules

- **Module Bar** - Allows the following customization of links displayed in the module bar. Show or hide modules by
  toggling the checkbox, reorder links by dragging on the sort handle, or create new custom links with these fields:
  - **Name** — The title of the module link, also shown in a tooltip on hover
  - **Icon** — Choose an icon for the module button
  - **URL** — Should start with a `/` for links within the [Directus App](/app/overview/)

## Security

- **Auth Password Policy** — Allows setting a policy requirement for all user's passwords, with the following options:
  - None — Not recommended
  - Weak — Minimum of 8 characters
  - Strong — Uppercase, lowercase, numbers, and special characters
- **Auth Login Attempts** — Sets the number of failed login attempts allowed before a user's account is locked. Once
  locked, an Admin user is required to unlock the account.

## Files & Storage

The platform's file middleware allows for cropping and transforming image assets on the fly. This means you can simply
request an original image, include any desired transformation parameters, and you'll be served the new asset as a
response.

To impede malicious users from consuming your storage by requesting a large number of random sizes, you can use the
following options to limit what transformations are possible.

- **Allowed Transformations** — For enabling, disabling, or limiting image transformations
- **Default Folder** — Sets the default folder where new assets are added. This does not affect existing files. Be aware
  that fields may override this value.
- **Transformation Presets** — Allows setting specific image transformations to simplify requests or limit usage.
  - Key — A unique identifier allowing faster and easier image transformation requests
  - Fit — Contain (preserve aspect ratio), Cover (force exact size), Fit Inside, or Fit Outside
  - Width — The width of the image
  - Height — The height of the image
  - Quality — The compression or quality of the image
  - Upscaling — When enabled, images won't be upscaled
  - Format — Allows changing the output format to: JPG, PNG, WebP, or TIFF
  - Additional Transformations — Allows adding additional transformations using
    [Sharp](https://sharp.pixelplumbing.com/api-constructor)

## Mapping

- **Mapbox Access Token** — Create a [Mapbox Access Token](https://docs.mapbox.com/help/glossary/access-token/) and
  enter it here to improve the platform's mapping experience.
- **Basemaps** — Allows overriding the Mapbox defaults with custom tiles
