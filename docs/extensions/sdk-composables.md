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
axios library, providing some extra functionalities. For instance, `useApi` automatically authenticates requests made
from your app extensions with the current user. It also provides concurrency control when making multiple requests.

Use the `useApi` composable when you need to make authorized API requests from your app extension.

Here’s a sample code of how to implement `useApi`

```html
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

## `useStores()`

`useStores` serves as the primary way for App extensions to interact with data and features available within a Directus
instance. It acts as the main entry point when working with collections, fields, permissions, and more. Within
`useStores` are stores like the `usePermissionsStore`, `useCollectionsStore` and `useFieldsStore` among others.

Here’s a sample code of how to implement `useStores`

```html
<script setup>
import { useStores } from '@directus/extensions-sdk';

const { useFieldsStore, usePermissionsStore, useCollectionStore } = useStores();
const fieldsStore = useFieldsStore();
const permissionsStore = usePermissionsStore();
const collectionStore = useCollectionStore();
</script>
```

### `useFieldsStore()`

The `useFieldsStore` is a store designed to provide access to collection and fields when working with App extensions. It
provides methods like `createField`,`updateField` and `deleteField`.

This store is useful when you need to:

- retrieve information about a collection's field
- perform mutations on a collection's field such as create, update, upsert, or delete
- retrieve translations for collection's field (useful for internationalization)

```html
<script setup>
import { useStores } from '@directus/extensions-sdk';

const { useFieldsStore } = useStores();
const fieldsStore = useFieldsStore();

// create a field
const newField = await fieldStore.createField('collection_key', {
  name: 'title',
});

// update a field
const updatedField = await fieldStore.updateField(
  'collection_key',
  'field_key',
  {
    name: 'new title',
  }
);
</script>
```

For a deep dive on how to use the `useFieldsStore` composable,
[see the implementation](https://github.com/directus/directus/blob/main/app/src/stores/fields.ts#L69) in our codebase.

### `usePermissionsStore()`

The `usePermissionsStore` provides permission-related functionalities when working with Directus data within an App
extension.

Methods like `createAllowed`, `deleteAllowed` and `saveAllowed` among others are available within the
`usePermissionStore`.

The `usePermissionsStore` is useful when you need to:

- determine what data a user is allowed to view or edit
- handle permission-restricted operations
- integrate single sign-on and token based permissions

```html
<script setup>
import { useStores } from '@directus/extensions-sdk';

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

// check a user permission
const hasPermission = permissionsStore('collection_name', 'create');
</script>
```

For a deep dive on how to use the `usePermissionsStore` composable,
[see the implementation](https://github.com/directus/directus/blob/main/app/src/stores/permissions.ts#L9) in our
codebase.

### `useCollectionsStore()`

`useCollectionsStore` provides access to collections within Directus. It allows you to retrieve, insert, update and
delete collection data directly through the methods such as `getCollection`, `upsertCollection` and `deleteCollection`
directly from your App extension.

The `useCollectionsStore` is useful when you need to:

- perform CRUD operations on a collection such as create, update, upsert, or delete
- retrieve translations for a collection (useful for internationalization)
- retrieve all collections within a Directus instance

```html
<script setup>
import { useStores } from '@directus/extensions-sdk';

const { useCollectionsStore } = useStores();
const collectionsStore = useCollectionsStore();

// get a collection
const myCollections = getCollection('collection_name');
</script>
```

For a deep dive on how to use the `useCollectionsStore` composable,
[see the implementation](https://github.com/directus/directus/blob/main/app/src/stores/collections.ts#L16) in our
codebase.

::: info Explore all Stores within `useStores`

While `useFieldsStore`, `usePermissionsStore` and `useCollectionsStore` cover the common scenarios, the `useStore`
composable contains additional sub-stores. Reference the full list in of sub-stores in our
[codebase](https://github.com/directus/directus/blob/main/app/src/composables/use-system.ts).

:::

## `useCollection()`

The `useCollection` composable provides access to metadata about collections. `useCollection` focuses only on exposing
metadata, not full functionality. It exposes methods like `fields`, `primaryKeyField`, and `accountabilityScope.`

For full capabilities like retrieving, updating and deleting collection data, use the `useCollectionStore` composable
instead.

The `useCollection` is useful when you need to:

- determine a collection's primary key field
- fetch a collection's metadata like `accountabilityScope`

Here’s a sample code of how to implement `useCollection`

```ts
<script setup>
import { useCollection } from '@directus/extensions-sdk';

const { primaryKeyField } = useCollection('collection_name');
</script>
```

For a deep dive on how to use the `useCollection` composable,
[see the implementation](https://github.com/directus/directus/blob/main/packages/composables/src/use-collection.ts) in
our codebase.

## `useItems()`

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

For a deep dive on how to use the `useItems()` composable,
[see the implementation](https://github.com/directus/directus/blob/main/packages/composables/src/use-items.ts#L39) in
our codebase.

While these core composables cover many common use cases, for a complete reference of all available Extension SDK
composables within Directus, check out our
[GitHub repository](https://github.com/directus/directus/blob/main/app/src/composables/use-system.ts).
