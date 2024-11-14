---
description: Learn about the extension SDK composables and how to utilize them when developing app extensions.
contributors: Esther Agbaje
---

# App Extension Composables

There are several composables available as part of the Directus Extensions SDK that make working with Directus easier.

Rather than needing to rewrite logic from scratch, extension developers can leverage primitives like `useApi()` or
`useStores()`, to handle common complexities when building extensions.

## `useApi()`

The `useApi` composable is a wrapper around the `axios` library that uses the session cookie and provides concurrency
control when making multiple requests.

Use the `useApi` composable when you need to make authorized API requests from your App extension.

```html
<script setup>
import { useApi } from '@directus/extensions-sdk';

const api = useApi();

async function fetchData() {
    const response = await api.get('ENDPOINT_URL');
    data.value = response.data;
};
fetchData();
</script>
```

## `useStores()`

`useStores` serves as the primary way for App extensions to interact with data and features within a Directus instance.

Within `useStores` are stores like the `usePermissionsStore`, `useCollectionsStore` and `useFieldsStore` among others.

```html
<script setup>
import { useStores } from '@directus/extensions-sdk';

const { useFieldsStore, usePermissionsStore, useCollectionsStore } = useStores();

const fieldsStore = useFieldsStore();
const permissionsStore = usePermissionsStore();
const collectionStore = useCollectionsStore();
</script>
```

### `useFieldsStore()`

The `useFieldsStore` is used to access and modify collections and fields.

Use this store when you need to:

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
[see the implementation](https://github.com/directus/directus/blob/main/app/src/stores/fields.ts) in our codebase.

### `usePermissionsStore()`

The `usePermissionsStore` is used to check for access control before performing operations within your App extension.

```html
<script setup>
import { useStores } from '@directus/extensions-sdk';

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

// check if user can create a collection
const canCreate = permissionsStore.hasPermission('collection_name', 'create');

// check if user can read a collection
const canRead = permissionsStore.hasPermission('collection_name', 'read');
</script>
```

For a deep dive on how to use the `usePermissionsStore` composable,
[see the implementation](https://github.com/directus/directus/blob/main/app/src/stores/permissions.ts) in our codebase.

### `useCollectionsStore()`

`useCollectionsStore` provides access to collections directly from your App extension.

Use this store when you need to:

- perform CRUD operations on a collection such as create, update, upsert, or delete
- retrieve translations for a collection (useful for internationalization)
- retrieve all collections or visible collections within a Directus instance

```html
<script setup>
import { useStores } from '@directus/extensions-sdk';

const { useCollectionsStore } = useStores();
const collectionsStore = useCollectionsStore();

// get all collections
collectionsStore.collections.value;

// get all visible collections
collectionsStore.visibleCollections.value;

// get a collection
collectionStore.getCollection("collection_key");

// delete a collection
await collectionStore.deleteCollection("collection_key");

// upsert (create or update) a collection
await collectionStore.upsertCollection("collection_key", {...});
</script>
```

For a deep dive on how to use the `useCollectionsStore` composable,
[see the implementation](https://github.com/directus/directus/blob/main/app/src/stores/collections.ts) in our codebase.

::: info Explore all Stores within `useStores`

While `useFieldsStore`, `usePermissionsStore` and `useCollectionsStore` cover the common scenarios, the `useStore`
composable contains additional sub-stores. Reference the full list in of sub-stores in our
[codebase](https://github.com/directus/directus/blob/main/app/src/composables/use-system.ts).

:::

## `useCollection()`

The `useCollection` composable provides access to metadata about collections (such as name, fields, type, icon).

Use `useCollection` composable when you need to retrieve:

- metadata about a collection (such as name, type, icon)
- fields within a collection and their default values
- the primary key and user created field
- accountability scope

```html
<script setup>
import { useCollection } from '@directus/extensions-sdk';
const { info, fields, defaults, primaryKeyField } = useCollection('collection_name');

info.value;
// => [{ name: 'collection_name', icon: 'box', type: 'table', ... }]

fields.value;
// => [{ name: 'title', type: 'string', ... }]

defaults.value;
// => { title: 'default_value' }

primaryKeyField.value;
// => { name: 'id', type: 'uuid', ... }
</script>
```

::: tip `useCollection` vs `useCollectionsStore`

For full capabilities like retrieving, updating and deleting collection items, use the `useCollectionsStore` composable
instead.

:::

For a deep dive on how to use the `useCollection` composable,
[see the implementation](https://github.com/directus/directus/blob/main/packages/composables/src/use-collection.ts) in
our codebase.

## `useItems()`

The `useItems` composable is used to retrieve items in a collection and provides pagination features.

### Fetching items in a collection

```html
<script setup>
import { useItems } from '@directus/extensions-sdk';

const collectionRef = ref('collection_key');

const query = {
		fields: ref(['*']),
		limit: ref(1),
		sort: ref(null),
		search: ref(null),
		filter: ref(null),
		page: ref(1),
	}

const { getItems, items } = useItems(collectionRef, query);

query.search.value = 'search_value' // update query search

query.limit.value = 10 // update query limit

await getItems(); // fetch the items

const data = items.value; // read the items
</script>
```

### Fetching the item and page count

```html
<script setup>
import { useItems } from '@directus/extensions-sdk';

const collectionRef = ref('collection_key')

const { getItemCount, itemCount, totalPages } = useItems(collectionRef);

await getItemCount(); // fetch the item count

const data = itemCount.value; // read the item count

const pages = totalPages.value; // read the total pages
</script>
```

### Fetching the total count

```html
<script setup>
import { useItems } from '@directus/extensions-sdk';

const collectionRef = ref('collection_key')

const { getTotalCount, totalCount } = useItems(collectionRef);

await getTotalCount(); // fetch the total item count

const data = totalCount.value; // read the total item count
</script>
```

For a deep dive on how to use the `useItems()` composable,
[see the implementation](https://github.com/directus/directus/blob/main/packages/composables/src/use-items.ts) in our
codebase.

::: tip Explore all Composables

While these core composables cover many common use cases, for a complete reference of all available Extension SDK
composables within Directus, check out our
[GitHub repository](https://github.com/directus/directus/blob/main/app/src/composables/use-system.ts).

:::
