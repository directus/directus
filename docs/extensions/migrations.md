# Custom Migrations

> Directus allows adding custom migration files that run whenever the `directus database migrate:*` commands are
> executed. All migrations must reside in the `extensions/migrations` folder.

## File Name

The file name follows the following structure:

```
[identifier]-[name].js
```

for example:

```
20201202A-my-custom-migration.js
```

## Structure

Migrations have to export an `up` and a `down` function. These functions get a [Knex](http://knexjs.org) instance that
can be used to do virtually whatever.

```js
module.exports = {
	async up(knex) {
		await knex.schema.createTable('test', (table) => {
			table.increments();
			table.string('rijk');
		});
	},

	async down(knex) {
		await knex.schema.dropTable('test');
	},
};
```

::: danger Danger

Seeing that these migrations are a bit of a free-for-all, you can really harm your database. Please make sure you know
what you're doing and backup your database before adding these migrations.

:::

## Migrations and Directus schema

Migrations can be used for managing contents of Directus collections (e.g. initial hydration). In order to do it, you
must ensure that schema is up to date before running migrations. One way of achieving it is opting out of default
`directus bootstrap` process and running:

```bash
npx directus database install
# notice that schema is applied before running migrations
npx directus schema apply ./path/to/snapshot.yaml
npx directus database migrate:latest
```

You may want to add additional steps to reflect other responsibilities of `directus bootstrap`.
