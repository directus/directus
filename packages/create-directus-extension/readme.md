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

### Interactive Mode

Run the command without any arguments to launch the interactive wizard:

```
npx create-directus-extension
```

You will be prompted to choose:

- Extension type (interface, display, panel, layout, module, hook, endpoint, operation, bundle)
- Extension name
- Language (JavaScript or TypeScript)
- Whether to auto-install dependencies

### Non-Interactive Mode

For automated workflows, coding agnets or when you know exactly what you want, you can provide all options via
command-line arguments:

```
npx create-directus-extension <type> <name> [options]
```

#### Arguments

- `<type>` - The extension type (interface, display, panel, layout, module, hook, endpoint, operation, bundle)
- `<name>` - The name of your extension

#### Options

- `--language <language>` or `-l <language>` - Specify the language (javascript or typescript). Defaults to javascript
- `--no-install` - Skip automatic dependency installation

#### Examples

Create a TypeScript panel extension:

```
npx create-directus-extension panel my-panel --language typescript
```

Create a JavaScript hook without installing dependencies:

```
npx create-directus-extension hook my-hook --no-install
```

Create a TypeScript interface with all options:

```
npx create-directus-extension interface my-interface -l typescript
```
