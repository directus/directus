# Custom Migrations

Directus allows you to plug in your own custom migration files that will run whenever the
`directus database migrate:*` commands are used.

All migrations have to reside in the extensions/migrations folder

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

Migrations have to export an `up` and a `down` function. These functions get a
[Knex](http://knexjs.org) instance that can be used to do virtually whatever.

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

<!-- prettier-ignore-start -->
::: danger
Seeing that these migrations are a bit of a free-for-all, you can really harm your database. Please make sure you know what you're doing and backup your database before adding these migrations.
:::
<!-- prettier-ignore-end -->
