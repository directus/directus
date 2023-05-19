# @directus/errors

A set of often used Error types within the Directus ecosystem. Also includes a small utility to create your own Error objects in the same format.

## Usage

```js
import { ForbiddenError } from '@directus/errors';

throw new ForbiddenError('No script kiddies please.');
```
