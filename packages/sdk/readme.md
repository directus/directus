# Directus JS SDK

## Installation

```
npm install @directus/sdk
```

## Usage

```js
import { Directus } from '@directus/sdk';

const directus = new Directus('http://directus.example.com');

const items = await directus.items('articles').readOne(15);
console.log(items);
```

```js
import { Directus } from '@directus/sdk';

const directus = new Directus('http://directus.example.com');

directus
	.items('articles')
	.readOne(15)
	.then((item) => {
		console.log(item);
	});
```

## Docs

See [the docs](https://docs.directus.io/reference/sdk/)
