# create-directus-extension

A small util that will scaffold a Directus extension.

## Installation

This package is meant to be used through `npm` or `yarn`:

```
npx create-directus-extension
```

```
yarn create directus-extension
```

## Usage

Run without arguments to create an extension interactively:

```
npx create-directus-extension
```

Pass the extension type and name to create an extension non-interactively:

```
npx create-directus-extension interface my-interface
```

You can also use the `--language` and `--no-install` options:

```
npx create-directus-extension hook my-hook --language typescript --no-install
```
