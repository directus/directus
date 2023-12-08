---
description: Learn about the extension SDK composables and how to utilize them when developing custom extensions.
contributors: Esther Agbaje
---

# Extension SDK Composables

The Extension Composables serve as a powerful toolkit to help developers create extensions in Directus.

Rather than needing to rewrite logic from scratch, extension developers can leverage primitives like `useApi()` or
`useStores()`, to abstract away complexity when building extensions.

Some commonly used composables include:

### useApi()

The `useApi` composable allows extensions to make requests to endpoints within Directus.

Here’s a sample code of how to use it:

```ts
<script setup>
import { useApi } from '@directus/extensions-sdk';

const api = useApi();

async function fetchData() {
      const response = await api.get(ENDPOINT-URL);
      data.value = response.data;
    }
fetchData();
</script>
```
