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

:::tip The Directus Marketplace is in Beta This feature is currently in Beta, and we need your feedback to make both the
marketplace and [sandboxed extensions](/extensions/sandbox/introduction) better - join the `#marketplace-beta` channel
on [Discord](https://directus.chat). :::

The [Directus Marketplace](/user-guide/marketplace/overview) provides a way for users to install extensions in their
projects directly in the Data Studio. It's available in all projects, whether run on Directus Cloud or your own
infrastructure.

![A marketplace listing in settings. There is a filter and sort option, and a search extensions box. Each extension is shown with an icon, name, type, author, description, as well as other metadata.](https://marketing.directus.app/assets/9ed89505-ca30-43d7-b4c4-2f6b40223815.png)

## Directus Extensions Registry

Directus hosts and manages our own extensions registry, which currently mirrors the contents of npm with a new API that
allows for greater searching/filtering. It also allows for security features such as the ability to store additional
data - such as extension blocking/delisting.

In the future, the registry may allow extensions or authors to be 'verified' and inclusion of extensions from different
sources on top of npm.

The Directus Extensions Registry is updated every `TODO:X` hours, and only the latest version of an extension is
available in the Marketplace.

### Required Metadata

To be discovered by the Directus Extensions Registry, your extension must be published on npm with the
`directus-extension` keyword in the `package.json` file.

To be listed in the Marketplace, the `package.json` file must also contain the following properties:

| Property                          | Description                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `directus:extension.type`         | The extension type - used to categorize extensions in the Marketplace listing. |
| `directus:extension.host_version` | The minimum Directus version required for the extension to run.                |

```json
{
	"directus:extension": {
		"host_version": "^10.3.3",
		"type": "endpoint"
	}
}
```

If you create an extension with the [create-directus-extension CLI utility](/extensions/creating-extensions), then these
fields will be populated on your behalf.

Additionally, publishing on npm requires the package `name` and `version` to be set. These values are shown in the
Marketplace listing and extension detail page.

### Additional Metadata

| Property      | Description                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `icon`        | Name of an icon from [Material Icons](https://fonts.google.com/icons). |
| `license`     | Your extension's license.                                              |
| `description` | Shown in the Marketplace extension listing.                            |
| `author`      | Automatically populated with your npm username.                        |

## Extension Detail Page

![An extension page showing the key metadata from the home, as well as a readme with a screenshot, install button, and a popularity graph.](https://marketing.directus.app/assets/ac0c5aea-30dc-49d2-a5e7-e7e6f95ba384.png)

### Extension Title

The extension title displayed in the extension detail page is based on your npm package name and the following
processing:

- The `directus-extension-` prefix is removed, if present.
- The package's scope is removed, is present.
- The title is parsed by the [Title Formatter](https://github.com/directus/format-title) used throughout the Data
  Studio.

The full, unprocessed, package name is also shown in the extension detail page.

### README

Your npm package's `README.md` file is also shown on the extension detail page. This can be updated by releasing a new
version of your package to npm.

#### Installation Instructions

Many extension authors provide installation instructions in their README. It is recommended that you update this to
include the Directus Marketplace as an installation method if your extension meets the criteria for Marketplace
publishing.

As extension detail pages are within projects, there is no global direct link to the page which allows installation. We
recommend a prompt to search for the extension in the Marketplace for installation.

#### Images & Screenshots

We encourage screenshots of App and Hybrid extensions to help users understand and evaluate an extension before
installation. We allow external images to be loaded from the `raw.githubusercontent.com` domain inside of the extension
detail page.

To include images, ensure your extension repository is in a public GitHub repository. Add images to your GitHub
repository, visit the direct URL of the image, and use this reference inside your README.

## Author Profile Page

![A page shows an individual author's extensions, along with their name, location, workplace, bio, and links to their NPM, GitHub, and website.](https://marketing.directus.app/assets/88661c0c-21d9-4d0c-8e85-2c3eb77c0a1a.png)

If your email address is public on GitHub and matches your npm account, the Directus Extensions Registry will also
include information from your GitHub profile, including profile image, name, location, bio, and links.

## Extension Types

The Directus Marketplace will allow installation of all App extension types (Interfaces, Layouts, Displays, Panels,
Modules, Themes) and [Sandboxed API/Hybrid extensions](/extensions/sandbox/introduction) (Endpoints, Hooks, Operations,
Bundles).

:::info Non-Sandboxed Extensions API/Hybrid extensions which are not sandboxed will not be available via the Marketplace
by default in an effort to increase security and trust. They can be made available by setting the `MARKETPLACE_TRUST`
environment variable to `TODO:VALUE` (self-hosted and Enterprise Cloud). :::

## Best Practices

### Third-Party Services

- Ensure the terms of service for any third-party services allow use in an extension.
- Do not include sensitive data in your extension code, including authentication keys or access tokens.

### Extension Description

You can use the description to show potential users what your extension does in the Marketplace listing. To make the
most of this placement, here are some guidelines:

- Explain what your extension does concisely and descriptively.
- Start with a verb, followed by a noun.
- Avoid adjectives like 'quickly' or 'simply'.
- Do not start your description with 'An extension to'.
- Do not specify extension type, as this is shown in the listing.

Some examples of good descriptions:

- 'Show items with two dates in a Gantt chart.'
- 'Use OpenAI to generate content in a text field.'
- 'Display dynamic API reference for your project.'

### Screenshots

- Ensure screenshots are legible and high-quality, ideally with high-contrast.
- As Directus supports custom theming, ensure screenshots are created to look good on multiple background colors.
- If you include multiple screenshots, try and use the same theme throughout.
- Ensure there is no sensitive data in screenshots.

### Icons

Select a custom icon from Google's [Material Icons](https://fonts.google.com/icons) library to display next to your
extension title in the listing and extension detail page.

## Removing and Reporting Extensions

Having our own registry means we can remove items, which we will do if we are made aware that extensions are malicious
or at the request of extension authors. If you wish to have an extension removed for either of these reasons, please get
in touch with EMAIL?

## Feedback

The Marketplace is in Beta and there's still work to do. Here's what we know is required:

1. Allowing global options for all extension types to allow for custom data such as API Keys/Tokens for third-party
   services.
2. Improvements to Sandboxed Extensions to allow CRUD access to collection items.

We welcome more feedback to make the Directus Marketplace better. Join the `#marketplace-beta` channel on
[Discord](https://directus.chat) to participate.
