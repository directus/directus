# Translate Shortcut

Translates a given keyboard shortcut in a string that represents it's usage.

```ts
function translateShortcut(keys: string[]): string
```

## Usage

```ts
translateShortcut(['meta', 'shift', 's']);

// on Windows: Ctrl+Shift+S
// on Mac:     ⌘⇧S
```
