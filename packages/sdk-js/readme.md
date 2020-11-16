# Directus JS SDK

## Installation

```
npm install @directus/sdk-js
```

## Usage

```js
import DirectusSDK from '@directus/sdk-js';

const directus = new DirectusSDK('https://api.example.com/');

directus.items('articles').read(15);
```

## Docs

See [the docs](../../docs/reference/sdk-js.md)
