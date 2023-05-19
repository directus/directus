# Directus JS SDK

## Installation

```
npm install @directus/sdk
```

## Basic Usage

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

## Reference

See [the docs](https://docs.directus.io/reference/sdk/) for a full usage reference and all supported methods.

## Contributing

### Requirements

- NodeJS LTS
- pnpm 7.5.0 or newer

### Commands

The following `pnpm` scripts are available:

- `pnpm lint` – Lint the code using Eslint / Prettier
- `pnpm test` – Run the unit tests

Make sure that both commands pass locally before creating a Pull Request.

### Pushing a Release

_This applies to maintainers only_

1. Create a new version / tag by running `pnpm version <version>`. Tip: use `pnpm version patch|minor|major` to
   auto-bump the version number
1. Push the version commit / tag to GitHub (`git push && git push --tags`)

The CI will automatically build and release to npm, and generate the release notes.
