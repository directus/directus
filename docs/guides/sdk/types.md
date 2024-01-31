---
contributors: Tim de Heiden
description: Learn about all of the ways to manage types with the Directus SDK
---

# Directus SDK Types

The Directus SDK provides TypeScript types used for auto-completion and generating output item types, these can be quite
complex and can be hard to work with. This guide will go over some approaches that can be taken for workine with these
types and assumes you're working with the SDK in TypeScript 5+.

## Setting up the a Schema

The schema entails a couple of things:

- A root schema type (the type that is provided to the SDK client)
- Adding custom fields on core collections
- A defined type for each available collection and field

### The root Schema type

This type should contain **all collections available** including junction collections for many-to-many and many-to-any
relations because this type is used as lookup table to determine what the relations are.

By defining a collection as an array this is considered a regular collection with multiple records, if left away a
singular type is considered to be a singleton.

For example:

```ts
interface MySchema {
	// regular collections are array types
	collection_a: CollectionA[];
	// singleton collections are singular types
	collection_c: CollectionC;
}
```

::: tip

For the most reliable results the root schema types should be kept as pure as possible, meaning no unions
(`CollectionA | null`), no optional types (`optional_collection?: CollectionA[]`) and preferrably no inline relational
types (types nested directly on the root schema) however an exception can be made here for extending core collections.

:::

#### Custom fields on Core Collections

To define custom fields on the core collections that are shipped with the SDK you can add a type containing only these
custom fields to be applied.

Extending core collections should always be a singular type.

For example:

```ts
interface MySchema {
	// regular collections are array types
	collection_a: CollectionA[];
	// singleton collections are singular types
	collection_c: CollectionC;
	// extend the provided DirectusUser type // [!code ++]
	directus_users: CustomUser; // [!code ++]
}

interface CustomUser {
	custom_field: string;
}
```

::: tip Typing bug

there is currently an unsolved bug where when using directus core collections. To work around this you'll need to add a
`directus_` prefixed item to the root type.

Reference: https://github.com/directus/directus/issues/19815

:::

### Field types

Most Directus field types will map to one of the TypeScript primitive types (`string`, `number`, `boolean`). There are
some exceptions to this where literal types are used to distinguish between primitives in order to add extra
functionality to the auto-completion types.

```ts
interface CollectionA {
	id: number;
	status: string;
	toggle: boolean;
}
```

There are currently 3 literal types that can be applied. The first 2 are both used to apply the `count(field)`
[array function](/reference/query.html#array-functions) in the `filter`/`field` auto-complete suggestions, these are the
`'json'` and `'csv'` string literal type. There is also the `'datetime'` string literal type which is used to apply all
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

::: tip Types to avoid

Some types should be avoided in the Schema as they may not play well with the type logic: `any` or `any[]`, empty type
`{}`, `never` or `void`.

:::

### Adding relational fields

For regular relations without junction collections you define a relation using a union of the primary key type and the
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

### Adding relations with junction collections

For relations that rely on a junction collection you will need to define the junction collection on the root schema and
refer to this new type similar to the one to many relation above.

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

// Many-to-Many junction table // [!code ++]
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
	// many-to-many junction collection // [!code ++]
	collection_b_a_m2a: CollectionBA_Any[]; // [!code ++]
	// extend the provided DirectusUser type
	directus_users: CustomUser;
}

// Many-to-Any junction table // [!code ++]
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

## Working with the generated output types

```ts
async function getCollectionA() {
  return await client.request(
    readItems('collection_a', {
      fields: ['id']
    })
  )
}

type GeneratedType = Awaited<ReturnType<typeof getCollectionA>>;
// ^ this is your generated type that can be used in the component
// resolves to { "id": number } in this example
```

### Debugging generated output types

The SDK provides some utility generic types to help debug issues. The `Identity<>` generic type can be used to try and
resolve generics to their results. This is however not a silver bullit and you may need to reduce the type for this to
work.

```ts
// the output type from the previous example
type GeneratedType = Awaited<ReturnType<typeof getCollectionA>>;

// when hovering over this type it may look unreadable like:
//  Merge<MapFlatFields<object & CollectionA, "id", MappedFunctionFields<MySchema, object & CollectionA>>, {}, MapFlatFields<...>, {}>[]

type ResolvedType = Identity< GeneratedType[0] >;
// ^ should resolve to { id: number; }
```

## Working with input Query types

For the output types to work properly the `fields` list needs to be static so the types can read the fields that were
selected in the query.

```ts
const fields = ["id", "status"];
// ^ does not work! this resolves to string[] losing all information about the fields themselves

const fields = ["id", "status"] as const;
// This correctly resolves to readonly ["id", "status"]
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

::: tip Alias unsuported

At this time `alias` has not been typed yet for use in other query parameters like `deep`.

:::
