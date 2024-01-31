---
contributors: Tim de Heiden
description: Learn about all of the ways to manage types with the Directus SDK
---

# Directus SDK Types

The Directus SDK provides TypeScript types used for auto-completion and generating output item types, these can be quite complex and can be hard to work with. This guide will go over some approaches that can be taken for workine with these types and assumes you're working with the SDK in TypeScript 5+.

## Setting up the a Schema

The schema entails a couple of things:
- A root schema type (the type that is provided to the SDK client)
- Adding custom fields on core collections
- A defined type for each available collection and field

### The root Schema type

This type should contain **all collections available** including junction collections for many-to-many and many-to-any relations because this type is used as lookup table to determine what the relations are.

By defining a collection as an array this is considered a regular collection with multiple records, if left away a singular type is considered to be a singleton.

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

For the most reliable results the root schema types should be kept as pure as possible, meaning no unions (`CollectionA | null`), no optional types (`optional_collection?: CollectionA[]`) and preferrably no inline relational types (types nested directly on the root schema) however an exception can be made here for extending core collections.

:::

#### Custom fields on Core Collections

To define custom fields on the core collections that are shipped with the SDK you can add a type containing only these custom fields to be applied.

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

### Field types

Most Directus field types will map to one of the TypeScript primitive types (`string`, `number`, `boolean`). There are some exceptions to this where literal types are used to distinguish between primitives in order to add extra functionality to the auto-completion types.

```ts


```

::: tip Types to avoid

Some types should be avoided in the Schema as they may not play well with the type logic: `any` or `any[]`, empty type `{}`, `never` or `void`.

:::

### Adding relational fields



### Adding relations with junction collections

### The root Schema type
- schema rules and things to avoid
- literal types for functions 'json' etc

```ts
// The main schema type containing all collections available
interface MySchema {
	collection_a: CollectionA[]; // regular collections are array types
	collection_b: CollectionB[];
	collection_c: CollectionC; // this is a singleton
	// junction collections are collections too
	collection_a_b_m2m: CollectionAB_Many[];
	collection_a_b_m2a: CollectionAB_Any[];
}
// these should be pure types, meaning not-optional, no unions and no inline types with the exception of core collection extensions.

// collection A
interface CollectionA {
	id: number;
	status: string;
	// relations
	m2o: number | CollectionB;
	o2m: number[] | CollectionB[];
	m2m: number[] | CollectionAB_Many[];
	m2a: number[] | CollectionAB_Any[];
}

// Many-to-Many junction table
interface CollectionAB_Many {
	id: number;
	collection_a_id: CollectionA;
	collection_b_id: CollectionB;
}

// Many-to-Any junction table
interface CollectionAB_Any {
	id: number;
	collection_a_id: CollectionA;
	collection: 'collection_b' | 'collection_c';
	item: string | CollectionB | CollectionC;
}

// collection B
interface CollectionB {
	id: number;
	value: string;
}

// singleton collection
interface CollectionC {
	id: number;
	app_settings: string;
	something: string;
}
```

## Working with Directus Collections

```ts
import { DirectusUser } from '@directus/sdk';

interface MySchema {
	// ... types
	collection_d: CollectionD[];
	directus_files: {
		custom_field: string;
	};
}

interface CollectionD {
	id: number;
	user_created: string | DirectusUser<MySchema>;
}
```

::: tip Typing bug

there is currently an unsolved bug where when using directus core collections. To work around this you'll need to add a `directus_` prefixed item to the root type.

:::

## Working with the generated output types

```ts
async function getCustomers() {
  return await client.request(
    readItems('customer', {
      fields: ['id']
    })
  )
}

type ApiCustomer = Awaited<ReturnType<typeof getCustomers>>
// ^ this is your generated type that can be used in the component
```

## Working with Query types

```ts
const query: Query<MySchema, CollectionA> = {
	limit: 20,
	offset: 0,
};

let search = '5'

if (search) {
	query.search = search;
}

const query2 =  {
  ...query,
	fields: [
    "id", "status"
	],
} satisfies Query<MySchema, CollectionA>;

search = 'a';

const results = await directusClient.request(readItems("collection_a", query2));

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
