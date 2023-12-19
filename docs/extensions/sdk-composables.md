---
description: Learn about the extension SDK composables and how to utilize them when developing custom extensions.
contributors: Esther Agbaje
---

# App Extension Composables

There are several composables available as part of the Directus Extensions SDK that make working with Directus easier.

Rather than needing to rewrite logic from scratch, extension developers can leverage primitives like `useApi()` or
`useStores()`, to handle common complexities when building extensions.

## `useApi()`

The `useApi` composable allows extensions to make requests to endpoints within Directus. It acts as a wrapper around the
axios library.

Here’s a sample code of how to implement `useApi`

```ts
<script setup>
import { useApi } from '@directus/extensions-sdk';

const api = useApi();

async function fetchData() {
      const response = await api.get(ENDPOINT_URL);
      data.value = response.data;
};
fetchData();
</script>
```

## useStores()

`useStores` serves as the main entry point for accessing specific functionality when building extensions. Within
`useStores` are sub-stores like the `usePermissionsStore`, `useCollectionsStore` and `useFieldsStore` among others.

```ts
<script setup>
import { useStores } from '@directus/extensions-sdk';

const { useFieldsStore, usePermissionsStore, useCollectionStore } = useStores();
const fieldsStore = useFieldsStore();
const permissionsStore = usePermissionsStore();
const collectionStore = useCollectionStore();
</script>
```

### useFieldsStore

The `useFieldsStore` gives developers access to customizable field properties and functionality. It provides methods
like `fields`, `updateField` , and `getPrimaryKeyFieldForCollection`.

For a deep dive on how to use the `useFieldsStore` composable,
[see the implementation](https://github.com/directus/directus/blob/main/app/src/stores/fields.ts#L69) in our codebase.

### usePermissionsStore

The `usePermissionsStore` exposes permission-related functionalities. It retrieves the user's permissions from the
Directus API and makes them easily accessible.

Methods like `createAllowed`, `deleteAllowed` and `saveAllowed` among others are available within the
`usePermissionStore`.

For a deep dive on how to use the `usePermissionsStore` composable,
[see the implementation](https://www.notion.so/Extension-Composables-f2918516bd9a4c2180a1fc01e1a9f0f1?pvs=21) in our
codebase.

### useCollectionsStore

`useCollectionsStore` provides access to collections within Directus. It allows you to retrieve, insert, update and
delete collection data directly through the methods such as `getCollection`, `upsertCollection` and `deleteCollection`
without having to manually make API requests.

For a deep dive on how to use the `useCollectionsStore` composable,
[see the implementation](https://github.com/directus/directus/blob/main/app/src/stores/collections.ts#L16) in our
codebase.

::: info Explore Sub-stores within `useStores`

While `useFieldsStore`, `usePermissionsStore` and `useCollectionsStore` cover the common scenarios, the `useStore`
composable contains additional sub-stores. Reference the full list in of sub-stores in our
[codebase](https://github.com/directus/directus/blob/main/app/src/composables/use-system.ts).

:::

## useCollection()

The `useCollection` composable provides access to metadata about collections. `useCollection` focuses only on exposing
metadata, not full functionality. It exposes methods like `fields`, `primaryKeyField`, and `accountabilityScope.`

For full capabilities like retrieving, updating and deleting collection data, use the `useCollectionStore` composable
instead.

Here’s a sample code of how to implement `useCollection`

```ts
<script setup>
import { useCollection } from '@directus/extensions-sdk';

const { primaryKeyField } = useCollection(props.collection);
</script>
```

For a deep dive on how to use the `useCollection` composable,
[see the implementation](https://github.com/directus/directus/blob/main/packages/composables/src/use-collection.ts) in
our codebase.

## useItems()

The `useItems` composable handles retrieving and working on items in a collection. It handles fetching multiple items
via methods like `getItems`, `getItemCount` and `getTotalCount`. It also exposes values for pagination data like
`itemCount` and `totalPages`.

Here’s a sample code of how to implement `useItems`

```ts
<script setup>
import { useItems } from '@directus/extensions-sdk';

const { getItems, totalPages } = useItems();
</script>
```

For a deep dive on how to use the `useItems` composable,
[see the implementation](https://github.com/directus/directus/blob/main/packages/composables/src/use-items.ts#L39) in
our codebase.

While these core composables cover many common use cases, for a complete reference of all available Extension SDK
composables within Directus, check out our
[GitHub repository](https://github.com/directus/directus/blob/main/app/src/composables/use-system.ts).
