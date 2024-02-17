---
description: Understand the requirements and process to publish your extensions on the Directus Marketplace.
contributors: Kevin Lewis
---

<style scoped>
table {
	width: 100%;
	display: table;
}
</style>

# Publish on the Directus Marketplace

:::tip The Directus Marketplace is in Beta
This feature is currently in Beta, and we need your feedback to make both the marketplace and [sandboxed extensions](/extensions/sandbox/introduction) better - join the `#marketplace-beta` channel on [Discord](https://directus.chat).
:::

The Directus Marketplace provides a way for users to install extensions in their projects directly in the Data Studio. It's available in all projects, whether run on Directus Cloud or your own infrastructure.

TODO:SCREENSHOT OF LIST

## Directus Extensions Registry

Directus hosts and manages our own extensions registry, which currently mirrors the contents of npm with a new API that allows for greater searching/filtering. It also allows for security features such as the ability to store additional data - such as extension blocking/delisting.

In the future, the registry may allow extensions or authors to be 'verified' and inclusion of extensions from different sources on top of npm.

The Directus Extensions Registry is updated every `TODO:X` hours, and only the latest version of an extension is available in the Marketplace.

### Required Metadata

To be discovered by the Directus Extensions Registry, your extension must be published on npm with the `directus-extension` keyword in `package.json`.

To be listed in the Marketplace, the `package.json` file must also contain the following properties:

|Property|Description|
|---|---|
|`directus:extension.type`|The extension type - used to categorize extensions in the Marketplace.|
|`directus:extension.host_version`|The minimum Directus version required for the extension to run.|

```json
{
	"directus:extension": {
		"host_version": "^10.3.3",
		"type": "endpoint"
	}
}
```

If you create an extension with the [create-directus-extension CLI utility](/extensions/creating-extensions), then these fields will be populated on your behalf.

Additionally, publishing on npm requires the package `name` and `version` to be set. These values are shown in the Marketplace listing.

## Extension Listing

TODO:SCREENSHOT OF DETAIL

### Extension Title

The extension title displayed in the extension listing is based on your npm package name and the following processing:

- The `directus-extension-` prefix is removed, if present.
- The package's scope is removed, is present.
- The title is parsed by the [Title Formatter](https://github.com/directus/format-title) used throughout the Data Studio.

The full, unprocessed, package name is also shown in the extension listing page.

### README

Your npm package's `README.md` file is also shown on the extension listing page. This can be updated by releasing a new version of your package to npm.

### Other Metadata

TBD

#### Installation Instructions

Many extension authors provide installation instructions in their README. It is recommended that you update this to include the Directus Marketplace as an installation method if your extension meets the criteria for Marketplace publishing.

TODO:Finding URL of Package

#### Images & Screenshots

We encourage screenshots of App and Hybrid extensions to help users understand and evaluate an extension before installation. We allow external images to be loaded from the `raw.githubusercontent.com` domain inside of the extension listing.

To include images, ensure your extension repository is in a public GitHub repository. Add images to your GitHub repository, visit the direct URL of the image, and use this reference inside your README.

## Extension Types

The Directus Marketplace will allow installation of all App extension types (Interfaces, Layouts, Displays, Panels, Modules, Themes) and [Sandboxed API/Hybrid extensions](/extensions/sandbox/introduction) (Endpoints, Hooks, Operations, Bundles).

:::info Non-Sandboxed Extensions
API/Hybrid extensions which are not sandboxed will not be available via the Marketplace by default in an effort to increase security and trust. They can be made available by setting the `TODO:VARIABLE` environment variable to `TODO:VALUE` (self-hosted and Enterprise Cloud).
:::

## Best Practices

### Third-Party Services

- Ensure you can use
- Ensure you don't hard-code authentication keys / access tokens

### Extension Description

TODO: Something like don't open with 'extension to...', standardized jtbd language.

### Screenshots

- high contrast, high quality, legible, good for dark and light mode
- don't share sensitive data, avoid using screenshots from in different themes unless it demonstrates what your extension does

## Removing and Reporting Extensions

Having our own registry means we can remove items, which we will do if we are made aware that extensions are malicious or at the request of extension authors. If you wish to have an extension removed for either of these reasons, please get in touch with TODO:EMAIL?

## Future Work

The Marketplace is in Beta and there's still work to do. Here's what we know is required:

TODO: LIST.
TODO: setting options, improving sandboxed extensions, ?
