---
contributors: Esther Agbaje
description: Discover how to make your Directus extensions available to other users and in the Marketplace.
---

# Publishing your Extension

Publishing an extension makes it available to all Directus users. Before publishing, first make sure the extension is
[secure](/extensions/creating-extensions.html#secure-extensions).

Next, publish the npm package created by `@directus/extensions-sdk` to the npm registry by running the command:

```bash
npm publish
```

## Publishing to the Marketplace

Before publishing your extension to the Marketplace, you may want to add an icon to your extension. Add the key “icon”
to your `package.json` with a url to a PNG/JPEG file.

```json
{
  ...
  "directus:extension": {
    "secure": true,
    "icon": "PUT_URL_HERE"
  },
  ...
}
```

You could also configure your extension to only support a particular version of Directus. This would look something like
this:

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
