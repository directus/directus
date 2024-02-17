---
description: An introduction to the Directus Marketplace - a new way to publish and install Directus extensions.
---

# Directus Marketplace

:::tip The Directus Marketplace is in Beta This feature is currently in Beta, and we need your feedback to make the
marketplace - join the `#marketplace-beta` channel on [Discord](https://directus.chat). :::

The [Directus Marketplace](/user-guide/marketplace/overview) provides a way for users to install extensions in their
projects directly in the Data Studio. It's available in all projects, whether run on Directus Cloud or your own
infrastructure.

## Discover Extensions

![A marketplace listing in settings. There is a filter and sort option, and a search extensions box. Each extension is shown with an icon, name, type, author, description, as well as other metadata.](https://marketing.directus.app/assets/9ed89505-ca30-43d7-b4c4-2f6b40223815.png)

Navigate to **Settings > Marketplace** to access the Directus Marketplace. You can now browse extensions to install.

You can filter by extension type and change the sorting order. Each extension entry in the Marketplace listing shows the
author, description, extension type, last update, downloads, and license.

You can click any extension in the Marketplace listing to enter the extension detail page.

## Install Extensions

![An extension page showing the key metadata from the home, as well as a readme with a screenshot, install button, and a popularity graph.](https://marketing.directus.app/assets/ac0c5aea-30dc-49d2-a5e7-e7e6f95ba384.png)

On extension detail pages, click the **Install Extension** button to install the extension in your project.

:::info Compatibility Warnings When creating extensions, authors specify which versions the extensions have been tested
to work with. If authors don't update this value, we may show an incompatibility warning.

This does not mean that an extension does not work, but that the author has not explicitly stated that it does. You can
still install and try them. :::

## Manage Extensions

![An extension listing in settings. One extension is shown under a Modules header. The extension name and version number is shown, along with an Enabled indicator.](https://marketing.directus.app/assets/61ea239c-5116-4c82-a677-acd1323972f0.png)

Navigate to **Settings > Extensions** to see all installed extensions in your Directus project. They are grouped by
extension type.

From this page, you can click <span mi="" icon="">more_vert</span> to disable or uninstall extensions. Extensions in
bundles can be disabled, but only the whole bundle can be uninstalled.
