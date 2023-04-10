---
description: A guide on how to setup your owns custom Migrations in Directus.
readTime: 2 min read
---

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

Migrations can be used to manage the contents of Directus collections (e.g. initial hydration). In order to do it, you
must ensure that the schema is up to date before running your migrations.

`directus database migrate:latest` runs the required Directus internal migrations and the migrations from `migrations`
directory. In general, you need the following flow:

```sh
# Option 1
npx directus bootstrap
npx directus schema apply ./path/to/snapshot.yaml

# Option 2 - without bootstrap, you must ensure that you run all required `bootstrap` tasks
npx directus database install
npx directus database migrate:latest
npx directus schema apply ./path/to/snapshot.yaml
```

Take notice here - to comply with this flow, `migrations` directory **must not contain** tasks that modify the contents
of your Directus, because schema is not yet created when you run `migrate:latest`.

One way of running the contents migrations is to defer them after the schema is applied. Let's assume you store your
migrations in `.custom-migrations` directory:

```sh
1 npx directus database install
2 npx directus database migrate:latest
3 npx directus schema apply ./path/to/snapshot.yaml
4 mv .custom-migrations/* migrations/
5 npx directus database migrate:latest
```

You need to install the database and run Directus migrations to prepare the Directus internals:

```sh
1 npx directus database install
2 npx directus database migrate:latest
```

Then, you can apply your schema:

```sh
3 npx directus schema apply ./path/to/snapshot.yaml
```

When the schema is ready, you can push your migrations to Directus `migrations` directory, and run `migrate:latest`
again. Only your `.custom-migrations` will be applied in the process:

```sh
4 mv .custom-migrations/* migrations/
5 npx directus database migrate:latest
```
