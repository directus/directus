---
contributors: Tim de Heiden
description: Learn about all of the ways to manage types with the Directus SDK
---

# Directus SDK Types

The Directus SDK provides TypeScript types used for auto-completion and generating output item types, but these can be
complex to work with. This guide will cover some approaches to more easily work with these types.

This guide assumes you're working with the Directus SDK and using TypeScript 5 or later.

## Setting Up a Schema

A schema contains a root schema type, custom fields on core collections, and a defined type for each available
collection and field.

### The root Schema type

The root schema type is the type provided to the SDK client. It should contain **all available collections**, including
junction collections for many-to-many and many-to-any relations. This type is used by the SDK as a lookup table to
determine what relations exist.

If a collection if defined as an array, it is considered a regular collection with multiple items. If not defined as an
array, but instead as a single type, the collection is considered to be a singleton.

```ts
interface MySchema {
	// regular collections are array types
	collection_a: CollectionA[];
	// singleton collections are singular types
	collection_c: CollectionC;
}
```

::: tip Improving Results

For the most reliable results, the root schema types should be kept as pure as possible. This means avoiding unions
(`CollectionA | null`), optional types (`optional_collection?: CollectionA[]`), and preferably inline relational types
(types nested directly on the root schema) except when adding custom fields to core collections.

:::

## Custom Fields on Core Collections

Core collections are provided and required in every Directus project, and are prefixed with `directus_`. Directus
projects can add additional fields to these collections, but should also be included in the schema when initializing the
Directus SDK.

To define custom fields on the core collections, add a type containing only your custom fields as a singular type.

```ts
interface MySchema {
	// regular collections are array types
	collection_a: CollectionA[];
	// singleton collections are singular types
	collection_c: CollectionC;
	// extend the provided DirectusUser type // [!code ++]
	directus_users: CustomUser; // [!code ++]
}
// [!code ++]
interface CustomUser { // [!code ++]
	custom_field: string; // [!code ++]
} // [!code ++]
```

### Collection Field Types

Most Directus field types will map to one of the TypeScript primitive types (`string`, `number`, `boolean`). There are
some exceptions to this where literal types are used to distinguish between primitives in order to add extra
functionality.

```ts
interface CollectionA {
	id: number;
	status: string;
	toggle: boolean;
}
```

There are currently 3 literal types that can be applied. The first 2 are both used to apply the `count(field)`
[array function](/reference/query.html#array-functions) in the `filter`/`field` auto-complete suggestions, these are the
`'json'` and `'csv'` string literal types. The `'datetime'` string literal type which is used to apply all
[datetime functions](/reference/query.html#datetime-functions) in the `filter`/`field` auto-complete suggestions.

```ts
interface CollectionA {
	id: number;
	status: string;
	toggle: boolean;

	tags: 'csv'; // [!code ++]
	json_field: 'json'; // [!code ++]
	date_created: 'datetime'; // [!code ++]
}
```

In the output types these string literals will get resolved to their appropriate types:

- `'csv'` resolves to `string[]`
- `'datetime'` resolves to `string`
- `'json'` resolves to [`JsonValue`](https://github.com/directus/directus/blob/main/sdk/src/types/output.ts#L105)

::: tip Types to Avoid

Some types should be avoided in the Schema as they may not play well with the type logic: `any` or `any[]`, empty type
`{}`, `never` or `void`.

:::

### Adding Relational Fields

For regular relations without junction collections, define a relation using a union of the primary key type and the
related object.

```ts
interface MySchema {
	// regular collections are array types
	collection_a: CollectionA[];
	collection_b: CollectionB[]; // [!code ++]
	// singleton collections are singular types
	collection_c: CollectionC;
	// extend the provided DirectusUser type
	directus_users: CustomUser;
}

interface CollectionB { // [!code ++]
	id: string; // [!code ++]
} // [!code ++]
```

#### Many to One

```ts
interface CollectionB {
	id: string;
	m2o: number | CollectionA; // [!code ++]
}
```

#### One to Many

```ts
interface CollectionB {
	id: string;
	m2o: number | CollectionA;
	o2m: number[] | CollectionA[]; // [!code ++]
}
```

### Working with Junction Collections

For relations that rely on a junction collection, define the junction collection on the root schema and refer to this
new type similar to the one to many relation above.

#### Many to Many

```ts
interface MySchema {
	// regular collections are array types
	collection_a: CollectionA[];
	collection_b: CollectionB[];
	// singleton collections are singular types
	collection_c: CollectionC;
	// many-to-many junction collection // [!code ++]
	collection_b_a_m2m: CollectionBA_Many[]; // [!code ++]
	// extend the provided DirectusUser type
	directus_users: CustomUser;
}

// many-to-many junction table // [!code ++]
interface CollectionBA_Many { // [!code ++]
	id: number; // [!code ++]
	collection_b_id: string | CollectionB; // [!code ++]
	collection_a_id: number | CollectionA; // [!code ++]
} // [!code ++]

interface CollectionB {
	id: string;
	m2o: number | CollectionA;
	o2m: number[] | CollectionA[];
	m2m: number[] | CollectionBA_Many[]; // [!code ++]
}
```

#### Many to Any

```ts
interface MySchema {
	// regular collections are array types
	collection_a: CollectionA[];
	collection_b: CollectionB[];
	// singleton collections are singular types
	collection_c: CollectionC;
	// many-to-many junction collection
	collection_b_a_m2m: CollectionBA_Many[];
	// many-to-any junction collection // [!code ++]
	collection_b_a_m2a: CollectionBA_Any[]; // [!code ++]
	// extend the provided DirectusUser type
	directus_users: CustomUser;
}

// many-to-any junction table // [!code ++]
interface CollectionBA_Any { // [!code ++]
	id: number; // [!code ++]
	collection_b_id: string | CollectionB; // [!code ++]
	collection: 'collection_a' | 'collection_c'; // [!code ++]
	item: string | CollectionA | CollectionC; // [!code ++]
} // [!code ++]

interface CollectionB {
	id: string;
	m2o: number | CollectionA;
	o2m: number[] | CollectionA[];
	m2m: number[] | CollectionBA_Many[];
	m2m: number[] | CollectionBA_Any[]; // [!code ++]
}
```

## Working with Generated Output

```ts
async function getCollectionA() {
  return await client.request(
    readItems('collection_a', {
      fields: ['id']
    })
  )
}

// generated type that can be used in the component
// resolves to { "id": number } in this example
type GeneratedType = Awaited<ReturnType<typeof getCollectionA>>;
```

## Working with Input Query Types

For the output types to work properly, the `fields` list needs to be static so the types can read the fields that were
selected in the query.

```ts
// this does not work and resolves to string[], losing all information about the fields themselves
const fields = ["id", "status"];

// correctly resolves to readonly ["id", "status"]
const fields = ["id", "status"] as const;
```

Complete example:

```ts
const query: Query<MySchema, CollectionA> = {
	limit: 20,
	offset: 0,
};

let search = 'test';
if (search) {
	query.search = search;
}

// create a second query for literal/readonly type inference
const query2 =  {
    ...query,
	fields: [
        "id", "status"
	],
} satisfies Query<MySchema, CollectionA>;

const results = await directusClient.request(readItems("collection_a", query2));

// or build the query directly inline
const results2 = await directusClient.request(readItems("collection_a", {
    ...query,
    search,
	fields: [
        "id", "status"
	],
}));
```

::: tip Alias Unsupported

At this time, `alias` has not been typed yet for use in other query parameters like `deep`.

:::
