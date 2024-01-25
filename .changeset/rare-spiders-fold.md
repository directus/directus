---
'@directus/sdk': major
---

Dropped the ability to import parts of the SDK through scoped entrypoints to prevent issues with TypeScript based
libraries consuming the SDK.

To migrate away, please update your scoped imports of @directus/sdk to use the root, for example:

```js
// Before
import { createDirectus } from '@directus/sdk';
import { rest } from '@directus/sdk/rest';

// After
import { createDirectus, rest } from '@directus/sdk';
```
