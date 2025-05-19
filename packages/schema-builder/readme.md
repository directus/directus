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
