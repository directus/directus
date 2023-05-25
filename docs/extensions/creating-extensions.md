---
description: A guide on how to scaffold your Directus Extension.
readTime: 5 min read
---

# Creating Extensions

## Scaffolding your Directus Extension

The easiest way to start developing extensions is to use the `create-directus-extension` utility:

```bash
npm init directus-extension@latest
```

After specifying the name of the extension, the type of the extension and the programming language you want to use, the
utility will create a folder with the recommended file structure to create an extension.

If you want to combine and share dependencies between one or more extensions, use the
[bundle extension type](/extensions/bundles).

### Extension Folder Structure

The folder created by the utility is in fact an npm package. It comes with a few pre-installed packages depending on the
extension type and the language you chose. The most important one is `@directus/extensions-sdk`. This package includes a
CLI, which allows you to build your extension and to scaffold additional extensions, and it provides Typescript helpers
and other utilities.

Inside the created folder there is a `src/` folder. This folder contains the entrypoint of your extension. If you write
additional source files, they should go into this folder.

::: tip Entrypoint

The entrypoint is either called `index.js` or `index.ts`, depending on which programming language you chose.

:::

The generated `package.json` file contains an additional `directus:extension` field with the following sub-fields:

- `type` — The type of the extension
- `path` — The path to the built extension
- `source` — The path to the source entrypoint
- `host` — A semver string that indicates with which versions of the Directus host, the extension is compatible with

The CLI will use those fields by default to determine the input and output file paths and how the extension should be
built.

## Building your Extension

Before your extension can be used by Directus, it has to be built. If you used the `create-directus-extension` utility
to scaffold your extension, building your extension is as easy as running:

```bash
npm run build
```

The generated `package.json` contains a script that calls the `directus-extension` CLI which is part of
`@directus/extensions-sdk`:

```json
{
	"scripts": {
		"build": "directus-extension build"
	}
}
```

If you prefer to scaffold your extension manually, you can use the `directus-extension` CLI binary directly. The
`--help` flag provides useful information regarding the available options and flags.

Internally, the CLI uses Rollup to bundle your extension to a single entrypoint.

::: tip Watch

The CLI supports rebuilding extensions whenever a file has changed by using the `--watch` flag.

:::

### Configuring the CLI

Most of the time, it should be sufficient to use the CLI as is. But, in some cases it might be necessary to customize it
to your specific needs. This can be done by creating a `extension.config.js` file at the root of your extension package
with the following content:

```js
export default {
	plugins: [],
};
```

#### Supported Options

- `plugins` — An array of Rollup plugins that will be used when building extensions in addition to the built-in ones.

::: tip CommonJS or ESM

By using the `type` field inside your `package.json` file or using the appropriate file extension (`.mjs` or `.cjs`),
the config file can be loaded as a CommonJS or ESM file.

:::

## Developing your Extension

To learn more about developing extensions of a specific type, you can refer to one of the individual guides:

#### App Extensions

- [Interfaces](/extensions/interfaces)
- [Displays](/extensions/displays)
- [Layouts](/extensions/layouts)
- [Modules](/extensions/modules)
- [Panels](/extensions/panels)

#### API Extensions

- [Hooks](/extensions/hooks)
- [Endpoints](/extensions/endpoints)

#### Hybrid Extensions

- [Operations](/extensions/operations)
- [Bundles](/extensions/bundles)

::: tip Live Reloading

When working on extensions, try setting the
[`EXTENSIONS_AUTO_RELOAD` environment variable](/self-hosted/config-options). This will make the API reload extensions
on changes automatically.

:::

::: tip  Component Library

Directus comes shipped with it's own [Vue Component Library and Storybook]((https://components.directus.io)) that you can use to enrich your extensions.
These components can be used in any of the "app extensions", including Interfaces, Displays, Modules, Layouts, and Panels.

:::

## Publishing your Extension

To make an extension available to all Directus users, you can publish the npm package created by
`@directus/extensions-sdk` to the npm registry. Make sure the name of the package follows the naming convention for
package extensions: `directus-extension-<extension-name>` or `@<scope>/directus-extension-<extension-name>`.
`<extension-name>` has to be replaced with the name of your extension.

## Installing an Extension

There are two ways to install an extension.

### Package Extension

Package extensions are essentially npm packages. They can be installed from the npm registry, from a tarball, from a git
repository or any other means supported by npm. On startup, Directus will automatically load any package extension
installed into your Directus project folder.

To install an extension from the npm registry, simply use the npm CLI:

```bash
cd <directus-project-folder>
npm install <full-package-extension-name>
```

`<project-folder>` has to be replaced by the Directus project folder. `<full-package-extension-name>` should be replaced
with the full name of the package extension (e.g. `directus-extension-custom`).

### Local Extension

Local extensions are essentially the files generated by the `directus-extension build` command. They can be installed by
copying those files into a specific extensions folder.

To install an extension locally, you have to move the output from the `dist/` folder into your project's
`./extensions/<extension-folder>/<extension-name>/` folder. `<extension-folder>` has to be replaced by the extension
type in plural form (e.g. interfaces). `<extension-name>` should be replaced with the name of your extension.

### Local Bundle Extension

Bundles require a slightly different method of deployment. There is no dedicated `<extension-folder>/` but instead you create your extension folder in the extension root and prefix the name with `directus-extension-`.

To install a bundle locally, you have to move both the contents of the `dist/` folder and the `package.json` file into your project's
`./extensions/directus-extension-<extension-name>/` folder. `<extension-name>` should be replaced with the name of your extension.


::: warning Configurable Folders

The path to the built extension as well as the extensions directory are configurable and may be located elsewhere.

:::
