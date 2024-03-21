---
description: An introduction to the Directus Marketplace - a new way to publish and install Directus extensions.
---

# Directus Marketplace

:::tip The Directus Marketplace is in Beta

This feature is currently in Beta, and we need your feedback to make the marketplace - join the `#marketplace-beta`
channel on [Discord](https://directus.chat).

:::

The Directus Marketplace provides a way for users to install extensions in their projects directly in the Data Studio.
It's available in all projects, whether run on Directus Cloud or your own infrastructure.

## Discover Extensions

![A marketplace listing in settings. There is a filter and sort option, and a search extensions box. Each extension is shown with an icon, name, type, author, description, as well as other metadata.](https://marketing.directus.app/assets/2d38c367-5498-4257-94fe-a9da922b27c5.png)

Navigate to **Settings > Marketplace** to access the Directus Marketplace. You can now browse extensions to install.

You can filter by extension type and change the sorting order. Each extension entry in the Marketplace listing shows the
author, description, extension type, last update, downloads, and license.

You can click any extension in the Marketplace listing to enter the extension detail page.

## Install Extensions

![An extension page showing the key metadata from the home, as well as a readme with a screenshot, install button, and a popularity graph.](https://marketing.directus.app/assets/30431b63-1297-432a-aa22-5fde8aaccf24.png)

On extension detail pages, click the **Install Extension** button to install the extension in your project.

:::info Compatibility Warnings

When creating extensions, authors specify which versions the extensions have been tested to work with. If authors don't
update this value, we may show an incompatibility warning.

This does not mean that an extension does not work, but that the author has not explicitly stated that it does. You can
still install and try them.

:::

## Manage Extensions

![An extension listing in settings. One extension is shown under a Modules header. The extension name and version number is shown, along with an Enabled indicator.](https://marketing.directus.app/assets/62c170a8-ea6b-4fae-b824-7c701c7e7521.png)

Navigate to **Settings > Extensions** to see all installed extensions in your Directus project. They are grouped by
extension type.

From this page, you can click <span mi="" icon="">more_vert</span> to disable or uninstall extensions. Extensions in
bundles can be disabled, but only the whole bundle can be uninstalled.
