# `@directus/stores`

Shared Directus Studio state for use in components, extensions, and the `@directus/app` routes. Stores are [Pinia](https://www.npmjs.com/package/pinia)-based stores.

## Installation

```
pnpm add @directus/stores
```

## Usage

```ts
import { useAppStore } from '@directus/stores';

const appStore = useAppStore();
```
