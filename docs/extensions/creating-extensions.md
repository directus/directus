---
description: A guide on how to scaffold your Directus Extension.
readTime: 5 min read
contributors: Rijk Van Zanten, Esther Agbaje, Kevin Lewis, Lukas Zelenka
---

# Creating Extensions

To create an extension, use the `create-directus-extension` utility:

```shell
npx create-directus-extension@latest
```

After specifying the name of the extension, the type of the extension and the programming language you want to use, the
utility will create a folder with the recommended file structure to create an extension.

If you want to combine and share dependencies between one or more extensions, use the
[bundle extension type](/extensions/bundles).

## Building Your Extension

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

::: tip Automatically Reload Extensions

To automatically reload extensions every time you make a change, without having to restart Directus, in your
`docker-compose.yml` file, set `EXTENSIONS_AUTO_RELOAD=true`.

:::

### Configuring the CLI

Most of the time, it should be sufficient to use the CLI as is. But, in some cases it might be necessary to customize it
to your specific needs. This can be done by creating a `extension.config.js` file at the root of your extension package.
An example with the currently available options will look something like:

```js
export default {
	plugins: [],
	watch: {
		clearScreen: false
	}
};
```

#### Supported Options

- [`plugins`](https://rollupjs.org/configuration-options/#plugins) — An array of Rollup plugins that will be used when
  building extensions in addition to the built-in ones.
- [`watch.clearScreen`](https://rollupjs.org/configuration-options/#watch-clearscreen) — Controls whether or not to
  clear the screen when a rebuild is triggered.

::: tip CommonJS or ESM

By using the `type` field inside your `package.json` file or using the appropriate file extension (`.mjs` or `.cjs`),
the config file can be loaded as a CommonJS or ESM file.

:::

::: tip Component Library

Directus comes shipped with it's own [Vue Component Library](https://components.directus.io) that you can use to enrich
your extensions. These components can be used in any of the "app extensions", including Interfaces, Displays, Modules,
Layouts, and Panels.

:::

### Usage with Docker

After you have created your custom extension, a new folder was created (for example: `custom-extension`). Now, you need
to go to the `package.json` within this newly created folder and copy the `name` of the extension (for example:
`directus-extension-custom-extension`). Then, you just need to mount a volume in your Docker container pointing to this
folder, but remember that you need to use the `name` of the extension as the folder name within Directus. For example,
if you use a `docker-compose.yaml` it would be something like this:

```yaml
	volumes:
		- ./custom-extension:/directus/extensions/directus-extension-custom-extension
```

## Extension Folder Structure

The folder created by the utility is in fact an npm package. It comes with a few pre-installed packages depending on the
extension type and the programming language you chose. The most important one is `@directus/extensions-sdk`. This
package includes a CLI, which allows you to build your extension and to scaffold additional extensions, Typescript
helpers, and other utilities.

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

## Marketplace Requirements

By default, App Extensions and [Sandboxed Extensions](/extensions/sandbox/introduction) are available from the
[Directus Marketplace](/user-guide/marketplace/overview) in all Directus projects (Directus Professional and Enterprise
Cloud, and self-hosted). If you are building an API or Hybrid extension and want to publish it to the Marketplace, it
must use the Sandbox SDK.

## Developing Your Extension

To learn more about how to develop extensions of a specific type, refer to the individual guides:

### App Extensions

- [Interfaces](/extensions/interfaces)
- [Layouts](/extensions/layouts)
- [Displays](/extensions/displays)
- [Panels](/extensions/panels)
- [Modules](/extensions/modules)
- [Themes](/extensions/themes)

### API Extensions

- [Endpoints](/extensions/endpoints)
- [Hooks](/extensions/hooks)

### Hybrid Extensions

- [Operations](/extensions/operations)
- [Bundles](/extensions/bundles)
