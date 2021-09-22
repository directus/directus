# Config Files

By default, Directus will read the `.env` file located next to your project's `package.json` for it's config. You can
change the path where this file is read from, including the filename, by setting the `CONFIG_PATH` environment variable
before starting Directus.

For example: `CONFIG_PATH="/path/to/config.js" npx directus start`

The config file can be one of the following formats:

[[toc]]

::: tip Configuration Parameters

See [Environment Variables](/reference/environment-variables/) for an overview of all available environment variables.

:::

## .env

If the config path has no file extension, or a file extension that's not one of the other supported formats, Directus
will try reading the file config path as environment variables. This has the following structure:

```
PORT=8055

DB_CLIENT="pg"
DB_HOST="localhost"
DB_PORT=5432

etc
```

## config.json

If you prefer a single JSON file for all your configuration, create a JSON file with the environment variables as keys,
for example:

```
CONFIG_PATH="/path/to/config.json"
```

```json
{
	"PORT": 8055,

	"DB_CLIENT": "pg",
	"DB_HOST": "localhost",
	"DB_PORT": 5432

	// etc
}
```

## config.yaml

Similar to JSON, you can use a `.yaml` (or `.yml`) file for your config:

```
CONFIG_PATH="/path/to/config.yaml"
```

```yaml
PORT: 8055

DB_CLIENT: pg
DB_HOST: localhost
DB_PORT: 5432
#
# etc
```

## config.js

A JavaScript based configuration file allows for two different structures of configuration: an object or a function.
Using a JS file for your config allows you to dynamically generate the configuration of the project during startup.

### Object

Export the configuration object where the key is the environment variable name:

```js
module.exports = {
	PORT: 8055,

	DB_CLIENT: 'pg',
	DB_HOST: 'localhost',
	DB_PORT: 5432,

	// etc
};
```

### Function

Alternatively, you can provide a function that returns the above object. The function gets process.env as it's
parameter.

```js
module.exports = function (env) {
	return {
		PORT: 8055,

		DB_CLIENT: 'pg',
		DB_HOST: 'localhost',
		DB_PORT: 5432,

		// etc
	};
};
```
