# @directus/schema-builder

Directus SchemaBuilder for mocking/constructing a database schema based on code, intended for internal use only.

## Usage

Like so:

```ts
const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('content').text();
		c.field('published').dateTime();
	})
	.build();
```

Or for o2m relation:

```ts
const schema = new SchemaBuilder()
	.collection('countries', (c) => {
		c.field('id').id();
		c.field('cities').o2m('cities', 'country_id');
	})
	.collection('cities', (c) => {
		c.field('id').id();
	})
	.build();
```

Or m2m relations:

```ts
const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('tags').m2m('tags');
	})
	.build();
```

## Snapshots

The builder describes the schema through collections, fields and relations, the same shape a Directus schema snapshot
uses. Next to `build()`, which returns a `SchemaOverview`, the schema can be exported as a snapshot that can be applied
to a Directus instance:

```ts
const snapshot = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
	})
	.snapshot({ directus: '12.0.0', vendor: 'postgres' });
```

The `directus` version and `vendor` have to match the instance the snapshot is applied to, unless the apply is forced.

Any snapshot, including the ones returned by the `/schema/snapshot` endpoint, can be converted into a `SchemaOverview`
with `toSchemaOverview`:

```ts
import { toSchemaOverview } from '@directus/schema-builder';

const schema = toSchemaOverview(snapshot);
```

## TypeScript types

The same schema can be exported as TypeScript interfaces in the shape the Directus SDK expects, so a snapshot and its
types can be generated side by side:

```ts
const builder = new SchemaBuilder().collection('articles', (c) => {
	c.field('id').id();
	c.field('title').string();
	c.field('author').m2o('users');
});

const snapshot = builder.snapshot({ directus: '12.0.0', vendor: 'postgres' });
const types = builder.types(); // export interface Schema { articles: Articles[]; users: Users[]; } ...
```

Types can also be generated from any snapshot with `toTypeScript(snapshot, { schemaName: 'Schema' })`.

## Test schemas

With the `test_schema` snapshot option enabled, all collection names, including related and generated junction
collections, are suffixed with `_1234`. The e2e tests use this suffix to replace the collection names with unique ones
per test run:

```ts
const snapshot = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('author').m2o('users');
	})
	.snapshot({ test_schema: true }); // contains the collections articles_1234 and users_1234
```
