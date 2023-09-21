---
contributors: Esther Agbaje
description: Discover how to make your Directus extensions available to other users and in the Marketplace.
---

# Publishing your Extension

To publish an extension and make it available to all Directus users, follow the steps below:

**1. Ensure the extension is secure**

Inside the `package.json` file of your extension, make the extension secure by setting secure to `true`.

```json
{
  ...
  "directus:extension": {
    "secure": true,
  },
  ...
}
```

**2. Publish the NPM package**

Publish the npm package created by `@directus/extensions-sdk` to the npm registry by running the command:

```bash
npm publish
```

## Publishing to the Marketplace

Before you publish your extension to the Marketplace, you may want to add an icon to your extension. Add the key “icon”
to your `package.json` with a url to a PNG/JPEG file.

```json
{
  ...
  "directus:extension": {
    "secure": true,
    "key": "PUT_URL_HERE"
  },
  ...
}
```

You could also configure your extension to only support a set version of Directus. This would look something like this:

```json
{
  ...
  "directus:extension": {
    ...
    "type": "bundle",
    "host": "^10.3.1"
  },
  ...
}
```

::: tip Naming Convention for Extensions

Make sure the name of your package follows the naming convention for extensions: `directus-extension-<extension-name>`
or `@<scope>/directus-extension-<extension-name>`. `<extension-name>` should be replaced with the name of your
extension.

:::
