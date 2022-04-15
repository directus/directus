# Configuration Options

> Environment variables are used for all configuration within a Directus project. These variables can be defined in a
> number of ways, which we cover below.

[[toc]]

## Configuration Files

By default, Directus will read the `.env` file located next to your project's `package.json` (typically in the root
folder of your project) for its configuration. You can change this path and filename by setting the `CONFIG_PATH`
environment variable before starting Directus. For example:

```bash
CONFIG_PATH="/path/to/config.js" npx directus start
```

In case you prefer using a configuration file instead of environment variables, you can also use the `CONFIG_PATH`
environment variable to instruct Directus to use a local configuration file instead of environment variables. The config
file can be one of the following formats:

- [.env](#env)
- [config.json](#config-json)
- [config.yaml](#config-yaml)
- [config.js](#config-js)

### .env

If the config path has no file extension, or a file extension that's not one of the other supported formats, Directus
will try reading the file config path as environment variables. This has the following structure:

```
HOST="0.0.0.0"
PORT=8055

DB_CLIENT="pg"
DB_HOST="localhost"
DB_PORT=5432

etc
```

### config.json

If you prefer a single JSON file for your configuration, create a JSON file with the environment variables as keys, for
example:

```
CONFIG_PATH="/path/to/config.json"
```

```json
{
	"HOST": "0.0.0.0",
	"PORT": 8055,

	"DB_CLIENT": "pg",
	"DB_HOST": "localhost",
	"DB_PORT": 5432

	// etc
}
```

### config.yaml

Similar to JSON, you can use a `.yaml` (or `.yml`) file for your config:

```
CONFIG_PATH="/path/to/config.yaml"
```

```yaml
HOST: 0.0.0.0
PORT: 8055

DB_CLIENT: pg
DB_HOST: localhost
DB_PORT: 5432
#
# etc
```

### config.js

Using a JavaScript file for your config allows you to dynamically generate the configuration of the project during
startup. The JavaScript configuration supports two different formats, either an **Object Structure** where the key is
the environment variable name:

```js
// Object Sytax

module.exports = {
	HOST: '0.0.0.0',
	PORT: 8055,

	DB_CLIENT: 'pg',
	DB_HOST: 'localhost',
	DB_PORT: 5432,

	// etc
};
```

Or a **Function Structure** that _returns_ the same object format as above. The function gets `process.env` as its
parameter.

```js
// Function Syntax

module.exports = function (env) {
	return {
		HOST: '0.0.0.0',
		PORT: 8055,

		DB_CLIENT: 'pg',
		DB_HOST: 'localhost',
		DB_PORT: 5432,

		// etc
	};
};
```

## Environment Variable Files

Any of the environment variable values can be imported from a file, by appending `_FILE` to the environment variable
name. This is especially useful when used in conjunction with Docker Secrets, so you can keep sensitive data out of your
compose files. For example:

```
DB_PASSWORD_FILE="/run/secrets/db_password"
```

## Type Casting and Nesting

Environment variables are automatically type cast based on the structure of the variable, for example:

```
PUBLIC_URL="https://example.com"
// "https://example.com"

DB_HOST="3306"
// 3306

CORS_ENABLED="false"
// false

STORAGE_LOCATIONS="s3,local,example"
// ["s3", "local", "example"]
```

In cases where the environment variables are converted to a configuration object for third party library use, like in
`DB_*` or `RATE_LIMITER_REDIS_*`, the environment variable will be converted to camelCase. You can use a double
underscore (`__`) for nested objects:

```
DB_CLIENT="pg"
DB_CONNECTION_STRING="postgresql://postgres:example@127.0.0.1"
DB_SSL__REJECT_UNAUTHORIZED="false"

{
	client: "pg",
	connectionString: "postgresql://postgres:example@127.0.0.1",
	ssl: {
		rejectUnauthorized: false
	}
}
```

## Environment Syntax Prefix

Directus will attempt to [automatically type cast environment variables](#type-casting-and-nesting) based on context
clues. If you have a specific need for a given type, you can tell Directus what type to use for the given value by
prefixing the value with `{type}:`. The following types are available:

| Syntax Prefix | Example                                                                                                         | Output                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `string`      | `string:value`                                                                                                  | `"value"`                                                                                                                    |
| `number`      | `number:3306`                                                                                                   | `3306`                                                                                                                       |
| `regex`       | `regex:\.example\.com$`                                                                                         | `/\.example\.com$/`                                                                                                          |
| `array`       | `array:https://example.com,https://example2.com` <br> `array:string:https://example.com,regex:\.example3\.com$` | `["https://example.com", "https://example2.com"]` <br> `["https://example.com", "https://example2.com", /\.example3\.com$/]` |

---

## General

| Variable                   | Description                                                                                                | Default Value |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------- |
| `CONFIG_PATH`              | Where your config file is located. See [Configuration Files](#configuration-files)                         | `.env`        |
| `HOST`                     | IP or host the API listens on.                                                                             | `0.0.0.0`     |
| `PORT`                     | What port to run the API under.                                                                            | `8055`        |
| `PUBLIC_URL`<sup>[1]</sup> | URL where your API can be reached on the web.                                                              | `/`           |
| `LOG_LEVEL`                | What level of detail to log. One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`.        | `info`        |
| `LOG_STYLE`                | Render the logs human readable (pretty) or as JSON. One of `pretty`, `raw`.                                | `pretty`      |
| `MAX_PAYLOAD_SIZE`         | Controls the maximum request body size. Accepts number of bytes, or human readable string.                 | `100kb`       |
| `ROOT_REDIRECT`            | Where to redirect to when navigating to `/`. Accepts a relative path, absolute URL, or `false` to disable. | `./admin`     |
| `SERVE_APP`                | Whether or not to serve the Admin App under `/admin`.                                                      | `true`        |

<sup>[1]</sup> The PUBLIC_URL value is used for things like OAuth redirects, forgot-password emails, and logos that
needs to be publicly available on the internet.

::: tip Additional Logger Variables

All `LOGGER_*` environment variables are passed to the `options` configuration of a
[`Pino` instance](https://github.com/pinojs/pino/blob/master/docs/api.md#options). All `LOGGER_HTTP*` environment
variables are passed to the `options` configuration of a
[`Pino-http` instance](https://github.com/pinojs/pino-http#api). Based on your project's needs, you can extend the
`LOGGER_*` environment variables with any config you need to pass to the logger instance. If a LOGGER_LEVELS key is
added, these values will be passed to the logger formatter, as described
[here](https://github.com/pinojs/pino/blob/master/docs/help.md#mapping-pino-log-levels-to-google-cloud-logging-stackdriver-serverity-levels)
for example. The format for adding LEVELS values is:
`LOGGER_LEVELS="trace:DEBUG,debug:DEBUG,info:INFO,warn:WARNING,error:ERROR,fatal:CRITICAL"`

:::

## Server

| Variable                    | Description                                        | Default Value                                                                                                |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `SERVER_KEEP_ALIVE_TIMEOUT` | Timeout in milliseconds for socket to be destroyed | [server.keepAliveTimeout](https://github.com/nodejs/node/blob/master/doc/api/http.md#serverkeepalivetimeout) |
| `SERVER_HEADERS_TIMEOUT`    | Timeout in milliseconds to parse HTTP headers      | [server.headersTimeout](https://github.com/nodejs/node/blob/master/doc/api/http.md#serverheaderstimeout)     |

::: tip Additional Server Variables

All `SERVER_*` environment variables are merged with `server` instance properties created from
[http.Server](https://github.com/nodejs/node/blob/master/doc/api/http.md#class-httpserver). This allows to configure
server behind a proxy, a load balancer, etc. Be careful to not override methods of this instance otherwise you may incur
into unexpected behaviors.

:::

## Database

| Variable               | Description                                                                                                                                        | Default Value                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `DB_CLIENT`            | **Required**. What database client to use. One of `pg` or `postgres`, `mysql`, `oracledb`, `mssql`, `sqlite3`, `cockroachdb`.                      | --                            |
| `DB_HOST`              | Database host. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_PORT`              | Database port. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_DATABASE`          | Database name. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_USER`              | Database user. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_PASSWORD`          | Database user's password. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                           | --                            |
| `DB_FILENAME`          | Where to read/write the SQLite database. **Required** when using `sqlite3`.                                                                        | --                            |
| `DB_CONNECTION_STRING` | When using `pg`, you can submit a connection string instead of individual properties. Using this will ignore any of the other connection settings. | --                            |
| `DB_POOL_*`            | Pooling settings. Passed on to [the `tarn.js`](https://github.com/vincit/tarn.js#usage) library.                                                   | --                            |
| `DB_EXCLUDE_TABLES`    | CSV of tables you want Directus to ignore completely                                                                                               | `spatial_ref_sys,sysdiagrams` |
| `DB_CHARSET`           | Charset/collation to use in the connection to MySQL/MariaDB                                                                                        | `UTF8_GENERAL_CI`             |
| `DB_VERSION`           | Database version, in case you use the PostgreSQL adapter to connect a non-standard database. Not normally required.                                | --                            |

::: tip Additional Database Variables

All `DB_*` environment variables are passed to the `connection` configuration of a [`Knex` instance](http://knexjs.org).
Based on your project's needs, you can extend the `DB_*` environment variables with any config you need to pass to the
database instance.

:::

::: tip Pooling

All the `DB_POOL_` prefixed options are passed to [`tarn.js`](https://github.com/vincit/tarn.js#usage) through
[Knex](http://knexjs.org/#Installation-pooling)

:::

## Security

| Variable                         | Description                                                                                                                                                      | Default Value            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `KEY`                            | Unique identifier for the project.                                                                                                                               | --                       |
| `SECRET`                         | Secret string for the project.                                                                                                                                   | --                       |
| `ACCESS_TOKEN_TTL`               | The duration that the access token is valid.                                                                                                                     | `15m`                    |
| `REFRESH_TOKEN_TTL`              | The duration that the refresh token is valid, and also how long users stay logged-in to the App.                                                                 | `7d`                     |
| `REFRESH_TOKEN_COOKIE_DOMAIN`    | Which domain to use for the refresh cookie. Useful for development mode.                                                                                         | --                       |
| `REFRESH_TOKEN_COOKIE_SECURE`    | Whether or not to use a secure cookie for the refresh token in cookie mode.                                                                                      | `false`                  |
| `REFRESH_TOKEN_COOKIE_SAME_SITE` | Value for `sameSite` in the refresh token cookie when in cookie mode.                                                                                            | `lax`                    |
| `REFRESH_TOKEN_COOKIE_NAME`      | Name of refresh token cookie .                                                                                                                                   | `directus_refresh_token` |
| `PASSWORD_RESET_URL_ALLOW_LIST`  | List of URLs that can be used [as `reset_url` in /password/request](/reference/authentication/#request-password-reset)                                           | --                       |
| `USER_INVITE_URL_ALLOW_LIST`     | List of URLs that can be used [as `invite_url` in /users/invite](/reference/system/users/#invite-a-new-user)                                                     | --                       |
| `IP_TRUST_PROXY`                 | Settings for [express' trust proxy setting](https://expressjs.com/en/guide/behind-proxies.html)                                                                  | true                     |
| `IP_CUSTOM_HEADER`               | What custom request header to use for the IP address                                                                                                             | false                    |
| `CONTENT_SECURITY_POLICY`        | Custom overrides for the Content-Security-Policy header. See [helmet's documentation](https://helmetjs.github.io) for more information.                          | --                       |
| `ASSETS_CONTENT_SECURITY_POLICY` | Custom overrides for the Content-Security-Policy header for the /assets endpoint. See [helmet's documentation](https://helmetjs.github.io) for more information. | --                       |
| `IMPORT_IP_DENY_LIST`            | Deny importing files from these IP addresses. Use `0.0.0.0` for any local IP address                                                                             | `0.0.0.0`                |

::: tip Cookie Strictness

Browser are pretty strict when it comes to third-party cookies. If you're running into unexpected problems when running
your project and API on different domains, make sure to verify your configuration for `REFRESH_TOKEN_COOKIE_NAME`,
`REFRESH_TOKEN_COOKIE_SECURE` and `REFRESH_TOKEN_COOKIE_SAME_SITE`.

:::

### Hashing

| Variable               | Description                                                                                                                      | Default Value       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `HASH_MEMORY_COST`     | How much memory to use when generating hashes, in KiB.                                                                           | `4096` (4 MiB)      |
| `HASH_LENGTH`          | The length of the hash function output in bytes.                                                                                 | `32`                |
| `HASH_TIME_COST`       | The amount of passes (iterations) used by the hash function. It increases hash strength at the cost of time required to compute. | `3`                 |
| `HASH_PARALLELISM`     | The amount of threads to compute the hash on. Each thread has a memory pool with `HASH_MEMORY_COST` size.                        | `1` (single thread) |
| `HASH_TYPE`            | The variant of the hash function (`0`: argon2d, `1`: argon2i, or `2`: argon2id).                                                 | `1` (argon2i)       |
| `HASH_ASSOCIATED_DATA` | An extra and optional non-secret value. The value will be included B64 encoded in the parameters portion of the digest.          | --                  |

Argon2's hashing function is used by Directus for three purposes: 1) hashing user passwords, 2) generating hashes for
the `Hash` field type in collections, and 3) the
[generate a hash API endpoint](/reference/system/utilities/#generate-a-hash).

All `HASH_*` environment variable parameters are passed to the `argon2.hash` function. See the
[node-argon2 library options page](https://github.com/ranisalt/node-argon2/wiki/Options) for reference.

::: tip Memory Usage

Modifying `HASH_MEMORY_COST` and/or `HASH_PARALLELISM` will affect the amount of memory directus uses when computing
hashes; each thread gets `HASH_MEMORY_COST` amount of memory, so the total additional memory will be these two values
multiplied. This may cause out of memory errors, especially when running in containerized environments.

:::

## CORS

| Variable               | Description                                                                                                                                            | Default Value                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `CORS_ENABLED`         | Whether or not to enable the CORS headers.                                                                                                             | `false`                      |
| `CORS_ORIGIN`          | Value for the `Access-Control-Allow-Origin` header. Use `true` to match the Origin header, or provide a domain or a CSV of domains for specific access | `false`                      |
| `CORS_METHODS`         | Value for the `Access-Control-Allow-Methods` header.                                                                                                   | `GET,POST,PATCH,DELETE`      |
| `CORS_ALLOWED_HEADERS` | Value for the `Access-Control-Allow-Headers` header.                                                                                                   | `Content-Type,Authorization` |
| `CORS_EXPOSED_HEADERS` | Value for the `Access-Control-Expose-Headers` header.                                                                                                  | `Content-Range`              |
| `CORS_CREDENTIALS`     | Whether or not to send the `Access-Control-Allow-Credentials` header.                                                                                  | `true`                       |
| `CORS_MAX_AGE`         | Value for the `Access-Control-Max-Age` header.                                                                                                         | `18000`                      |

## Rate Limiting

You can use the built-in rate-limiter to prevent users from hitting the API too much. Simply enabling the rate-limiter
will set a default maximum of 50 requests per second, tracked in memory. Once you have multiple copies of Directus
running under a load-balancer, or your user base grows so much that memory is no longer a viable place to store the rate
limiter information, you can use an external `memcache` or `redis` instance to store the rate limiter data.

| Variable                | Description                                                                      | Default Value |
| ----------------------- | -------------------------------------------------------------------------------- | ------------- |
| `RATE_LIMITER_ENABLED`  | Whether or not to enable rate limiting on the API.                               | `false`       |
| `RATE_LIMITER_POINTS`   | The amount of allowed hits per duration.                                         | `50`          |
| `RATE_LIMITER_DURATION` | The time window in seconds in which the points are counted.                      | `1`           |
| `RATE_LIMITER_STORE`    | Where to store the rate limiter counts. One of `memory`, `redis`, or `memcache`. | `memory`      |

Based on the `RATE_LIMITER_STORE` used, you must also provide the following configurations:

### Memory

No additional configuration required.

### Redis

| Variable             | Description                                                           | Default Value |
| -------------------- | --------------------------------------------------------------------- | ------------- |
| `RATE_LIMITER_REDIS` | Redis connection string, eg: `redis://:authpassword@127.0.0.1:6380/4` | ---           |

Alternatively, you can provide the individual connection parameters:

| Variable                      | Description                      | Default Value |
| ----------------------------- | -------------------------------- | ------------- |
| `RATE_LIMITER_REDIS_HOST`     | Hostname of the Redis instance   | --            |
| `RATE_LIMITER_REDIS_PORT`     | Port of the Redis instance       | --            |
| `RATE_LIMITER_REDIS_PASSWORD` | Password for your Redis instance | --            |

### Memcache

| Variable                | Description                                                                                                                                                           | Default Value |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `RATE_LIMITER_MEMCACHE` | Location of your memcache instance. You can use [`array:` syntax](#environment-syntax-prefix), eg: `array:<instance-1>,<instance-2>` for multiple memcache instances. | ---           |

::: tip Additional Rate Limiter Variables

All `RATE_LIMITER_*` variables are passed directly to a `rate-limiter-flexible` instance. Depending on your project's
needs, you can extend the above environment variables to configure any of
[the `rate-limiter-flexible` options](https://github.com/animir/node-rate-limiter-flexible/wiki/Options).

:::

### Example: Basic

```
// 10 requests per 5 seconds

RATE_LIMITER_POINTS="10"
RATE_LIMITER_DURATION="5"
```

### Example: Redis

```
RATE_LIMITER_ENABLED="true"

RATE_LIMITER_POINTS="10"
RATE_LIMITER_DURATION="5"

RATE_LIMITER_STORE="redis"

RATE_LIMITER_REDIS="redis://@127.0.0.1"
```

## Cache

Directus has a built-in data-caching option. Enabling this will cache the output of requests (based on the current user
and exact query parameters used) into configured cache storage location. This drastically improves API performance, as
subsequent requests are served straight from this cache. Enabling cache will also make Directus return accurate
cache-control headers. Depending on your setup, this will further improve performance by caching the request in
middleman servers (like CDNs) and even the browser.

::: tip Assets Cache

`Cache-Control` and `Last-Modified` headers for the `/assets` endpoint are separate from the regular data-cache.
`Last-Modified` comes from `modified_on` DB field. This is useful as it's often possible to cache assets for far longer
than you would cache database content. [Learn More](#assets)

:::

| Variable                          | Description                                                                              | Default Value    |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ---------------- |
| `CACHE_ENABLED`                   | Whether or not caching is enabled.                                                       | `false`          |
| `CACHE_TTL`<sup>[1]</sup>         | How long the cache is persisted.                                                         | `5m`             |
| `CACHE_CONTROL_S_MAXAGE`          | Whether to not to add the `s-maxage` expiration flag. Set to a number for a custom value | `0`              |
| `CACHE_AUTO_PURGE`<sup>[2]</sup>  | Automatically purge the cache on `create`, `update`, and `delete` actions.               | `false`          |
| `CACHE_SYSTEM_TTL`<sup>[3]</sup>  | How long the schema caches (schema/permissions) are persisted.                           | `10m`            |
| `CACHE_SCHEMA`<sup>[3]</sup>      | Whether or not the database schema is cached. One of `false`, `true`                     | `true`           |
| `CACHE_PERMISSIONS`<sup>[3]</sup> | Whether or not the user permissions are cached. One of `false`, `true`                   | `true`           |
| `CACHE_NAMESPACE`                 | How to scope the cache data.                                                             | `directus-cache` |
| `CACHE_STORE`<sup>[4]</sup>       | Where to store the cache data. Either `memory`, `redis`, or `memcache`.                  | `memory`         |
| `CACHE_STATUS_HEADER`             | If set, returns the cache status in the configured header. One of `HIT`, `MISS`.         | --               |

<sup>[1]</sup> `CACHE_TTL` Based on your project's needs, you might be able to aggressively cache your data, only
requiring new data to be fetched every hour or so. This allows you to squeeze the most performance out of your Directus
instance. This can be incredibly useful for applications where you have a lot of (public) read-access and where updates
aren't real-time (for example a website). `CACHE_TTL` uses [`ms`](https://www.npmjs.com/package/ms) to parse the value,
so you configure it using human readable values (like `2 days`, `7 hrs`, `5m`).

<sup>[2]</sup> `CACHE_AUTO_PURGE` allows you to keep the Directus API real-time, while still getting the performance
benefits on quick subsequent reads.

<sup>[3]</sup> Not affected by the `CACHE_ENABLED` value.

<sup>[4]</sup> `CACHE_STORE` For larger projects, you most likely don't want to rely on local memory for caching.
Instead, you can use the above `CACHE_STORE` environment variable to use either `memcache` or `redis` as the cache
store. Based on the chosen `CACHE_STORE`, you must also provide the following configurations:

### Memory

No additional configuration required.

### Redis

| Variable      | Description                                                           | Default Value |
| ------------- | --------------------------------------------------------------------- | ------------- |
| `CACHE_REDIS` | Redis connection string, eg: `redis://:authpassword@127.0.0.1:6380/4` | ---           |

Alternatively, you can provide the individual connection parameters:

| Variable               | Description                      | Default Value |
| ---------------------- | -------------------------------- | ------------- |
| `CACHE_REDIS_HOST`     | Hostname of the Redis instance   | --            |
| `CACHE_REDIS_PORT`     | Port of the Redis instance       | --            |
| `CACHE_REDIS_PASSWORD` | Password for your Redis instance | --            |

### Memcache

| Variable         | Description                                                                                                                                                           | Default Value |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `CACHE_MEMCACHE` | Location of your memcache instance. You can use [`array:` syntax](#environment-syntax-prefix), eg: `array:<instance-1>,<instance-2>` for multiple memcache instances. | ---           |

## File Storage

By default, Directus stores all uploaded files locally on disk. However, you can also configure Directus to use S3,
Google Cloud Storage, or Azure. You can also configure _multiple_ storage adapters at the same time. This allows you to
choose where files are being uploaded on a file-by-file basis. In the Admin App, files will automatically be uploaded to
the first configured storage location (in this case `local`). The used storage location is saved under `storage` in
`directus_files`.

::: tip File Storage Default

If you don't provide any configuration for storage adapters, this default will be used:

```
STORAGE_LOCATIONS="local"
STORAGE_LOCAL_ROOT="./uploads"
```

:::

::: warning Case sensitivity

The location value(s) you specify should be capitalized when specifying the additional configuration values. For
example, this will not work:

```
STORAGE_LOCATIONS="s3"
STORAGE_s3_DRIVER="s3" # Will not work, lowercase "s3" ❌
```

but this will work:

```
STORAGE_LOCATIONS="s3"
STORAGE_S3_DRIVER="s3" # Will work, "s3" is uppercased ✅
```

:::

| Variable            | Description                                                                                                           | Default Value |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------- |
| `STORAGE_LOCATIONS` | A CSV of storage locations (eg: `local,digitalocean,amazon`) to use. You can use any names you'd like for these keys. | `local`       |

For each of the storage locations listed, you must provide the following configuration:

| Variable                    | Description                                               | Default Value |
| --------------------------- | --------------------------------------------------------- | ------------- |
| `STORAGE_<LOCATION>_DRIVER` | Which driver to use, either `local`, `s3`, `gcs`, `azure` |               |
| `STORAGE_<LOCATION>_ROOT`   | Where to store the files on disk                          | `''`          |

Based on your configured driver, you must also provide the following configurations:

### Local (`local`)

| Variable                  | Description                      | Default Value |
| ------------------------- | -------------------------------- | ------------- |
| `STORAGE_<LOCATION>_ROOT` | Where to store the files on disk | --            |

### S3 (`s3`)

| Variable                      | Description | Default Value      |
| ----------------------------- | ----------- | ------------------ |
| `STORAGE_<LOCATION>_KEY`      | User key    | --                 |
| `STORAGE_<LOCATION>_SECRET`   | User secret | --                 |
| `STORAGE_<LOCATION>_BUCKET`   | S3 Bucket   | --                 |
| `STORAGE_<LOCATION>_REGION`   | S3 Region   | --                 |
| `STORAGE_<LOCATION>_ENDPOINT` | S3 Endpoint | `s3.amazonaws.com` |
| `STORAGE_<LOCATION>_ACL`      | S3 ACL      | --                 |

### Azure (`azure`)

| Variable                            | Description                | Default Value                                 |
| ----------------------------------- | -------------------------- | --------------------------------------------- |
| `STORAGE_<LOCATION>_CONTAINER_NAME` | Azure Storage container    | --                                            |
| `STORAGE_<LOCATION>_ACCOUNT_NAME`   | Azure Storage account name | --                                            |
| `STORAGE_<LOCATION>_ACCOUNT_KEY`    | Azure Storage key          | --                                            |
| `STORAGE_<LOCATION>_ENDPOINT`       | Azure URL                  | `https://{ACCOUNT_KEY}.blob.core.windows.net` |

### Google Cloud Storage (`gcs`)

| Variable                          | Description                 | Default Value |
| --------------------------------- | --------------------------- | ------------- |
| `STORAGE_<LOCATION>_KEY_FILENAME` | Path to key file on disk    | --            |
| `STORAGE_<LOCATION>_BUCKET`       | Google Cloud Storage bucket | --            |

### Example: Multiple Storage Adapters

Below showcases a CSV of storage location names, with a config block for each:

```
STORAGE_LOCATIONS="local,aws"

STORAGE_LOCAL_DRIVER="local"
STORAGE_LOCAL_ROOT="local"

STORAGE_AWS_KEY="tp15c...510vk"
STORAGE_AWS_SECRET="yk29b...b932n"
STORAGE_AWS_REGION="us-east-2"
STORAGE_AWS_BUCKET="my-files"
```

### Metadata

When uploading an image, Directus persists the _description, title, and tags_ from available EXIF metadata. For security
purposes, collection of additional metadata must be configured:

| Variable                   | Description                                                                                           | Default Value                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `FILE_METADATA_ALLOW_LIST` | A comma-separated list of metadata keys to collect during file upload. Use `*` for all<sup>[1]</sup>. | ifd0.Make,ifd0.Model,exif.FNumber,exif.ExposureTime,exif.FocalLength,exif.ISO |

<sup>[1]</sup>: Extracting all metadata might cause memory issues when the file has an unusually large set of metadata

## Assets

| Variable                               | Description                                                                                                                             | Default Value |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `ASSETS_CACHE_TTL`                     | How long assets will be cached for in the browser. Sets the `max-age` value of the `Cache-Control` header.                              | `30m`         |
| `ASSETS_TRANSFORM_MAX_CONCURRENT`      | How many file transformations can be done simultaneously                                                                                | `4`           |
| `ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION` | The max pixel dimensions size (width/height) that is allowed to be transformed                                                          | `6000`        |
| `ASSETS_TRANSFORM_MAX_OPERATIONS`      | The max number of transform operations that is allowed to be processed (excludes saved presets)                                         | `5`           |
| `ASSETS_CONTENT_SECURITY_POLICY`       | Custom overrides for the Content-Security-Policy header. See [helmet's documentation](https://helmetjs.github.io) for more information. | --            |

Image transformations can be fairly heavy on memory usage. If you're using a system with 1GB or less available memory,
we recommend lowering the allowed concurrent transformations to prevent you from overflowing your server.

## Authentication

| Variable               | Description                            | Default Value |
| ---------------------- | -------------------------------------- | ------------- |
| `AUTH_PROVIDERS`       | CSV of auth providers you want to use. | --            |
| `AUTH_DISABLE_DEFAULT` | Disable the default auth provider      | `false`       |

For each of the auth providers you list, you must provide the following configuration:

| Variable                 | Description                                                     | Default Value |
| ------------------------ | --------------------------------------------------------------- | ------------- |
| `AUTH_<PROVIDER>_DRIVER` | Which driver to use, either `local`, `oauth2`, `openid`, `ldap` | --            |

You must also provide a number of extra variables. These differ per auth driver service. The following is a list of
common required configuration options:

### Local (`local`)

No additional configuration required.

### SSO (`oauth2` and `openid`)

Directus' SSO integrations provide powerful alternative ways to authenticate into your project. Directus will ask you to
login on the external service, and return authenticated with a Directus account linked to that service.

For example, you can login to Directus using a github account by creating an
[OAuth 2.0 app in GitHub](https://github.com/settings/developers) and adding the following configuration to Directus:

```
AUTH_PROVIDERS="github"

AUTH_GITHUB_DRIVER="oauth2"
AUTH_GITHUB_CLIENT_ID="99d3...c3c4"
AUTH_GITHUB_CLIENT_SECRET="34ae...f963"
AUTH_GITHUB_AUTHORIZE_URL="https://github.com/login/oauth/authorize"
AUTH_GITHUB_ACCESS_URL="https://github.com/login/oauth/access_token"
AUTH_GITHUB_PROFILE_URL="https://api.github.com/user"
```

::: warning PUBLIC_URL

These flows rely on the `PUBLIC_URL` variable for redirecting. Make sure that variable is configured correctly.

:::

#### OAuth 2.0

| Variable                                    | Description                                                                                                                        | Default Value    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `AUTH_<PROVIDER>_CLIENT_ID`                 | OAuth identifier for the external service.                                                                                         | --               |
| `AUTH_<PROVIDER>_CLIENT_SECRET`             | OAuth secret for the external service.                                                                                             | --               |
| `AUTH_<PROVIDER>_SCOPE`                     | A white-space separated list of privileges Directus will request.                                                                  | `email`          |
| `AUTH_<PROVIDER>_AUTHORIZE_URL`             | The authorize page URL of the external service.                                                                                    | --               |
| `AUTH_<PROVIDER>_ACCESS_URL`                | The token access URL of the external service.                                                                                      | --               |
| `AUTH_<PROVIDER>_PROFILE_URL`               | The user profile information URL of the external service.                                                                          | --               |
| `AUTH_<PROVIDER>_EMAIL_KEY`                 | OAuth profile email key used to find the email address.                                                                            | `email`          |
| `AUTH_<PROVIDER>_IDENTIFIER_KEY`            | OAuth profile identifier key used to verify the user. Will default to `EMAIL_KEY`.                                                 | --               |
| `AUTH_<PROVIDER>_ALLOW_PUBLIC_REGISTRATION` | Automatically create accounts for authenticating users.                                                                            | `false`          |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`           | The Directus role ID assigned to created users.                                                                                    | --               |
| `AUTH_<PROVIDER>_ICON`                      | SVG icon to display with the login link. You can choose from [Social icon or Material icon set](/getting-started/glossary/#icons). | `account_circle` |
| `AUTH_<PROVIDER>_PARAMS`                    | Custom parameters to send to the auth provider                                                                                     | --               |

#### OpenID

OpenID is an authentication protocol built on OAuth 2.0, and should be preferred over standard OAuth 2.0 where possible.
OpenID offers better user verification and consistent profile information, allowing for more complete user
registrations.

| Variable                                    | Description                                                                                                                        | Default Value          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `AUTH_<PROVIDER>_CLIENT_ID`                 | OpenID identifier for the external service.                                                                                        | --                     |
| `AUTH_<PROVIDER>_CLIENT_SECRET`             | OpenID secret for the external service.                                                                                            | --                     |
| `AUTH_<PROVIDER>_SCOPE`                     | A white-space separated list of privileges Directus will request.                                                                  | `openid profile email` |
| `AUTH_<PROVIDER>_ISSUER_URL`                | The OpenID `.well-known` Discovery Document URL.                                                                                   | --                     |
| `AUTH_<PROVIDER>_IDENTIFIER_KEY`            | OpenID profile identifier key used to verify the user.                                                                             | `sub`                  |
| `AUTH_<PROVIDER>_ALLOW_PUBLIC_REGISTRATION` | Automatically create accounts for authenticating users.                                                                            | `false`                |
| `AUTH_<PROVIDER>_REQUIRE_VERIFIED_EMAIL`    | Require users to have a verified email address.                                                                                    | `false`                |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`           | The Directus role ID assigned to created users.                                                                                    | --                     |
| `AUTH_<PROVIDER>_ICON`                      | SVG icon to display with the login link. You can choose from [Social icon or Material icon set](/getting-started/glossary/#icons). | `account_circle`       |
| `AUTH_<PROVIDER>_PARAMS`                    | Custom parameters to send to the auth provider                                                                                     | --                     |

### LDAP (`ldap`)

LDAP allows Active Directory users to authenticate and use Directus without having to be manually configured. User
information and roles will be assigned from Active Directory.

| Variable                                        | Description                                                            | Default Value |
| ----------------------------------------------- | ---------------------------------------------------------------------- | ------------- |
| `AUTH_<PROVIDER>_CLIENT_URL`                    | LDAP connection URL.                                                   | --            |
| `AUTH_<PROVIDER>_BIND_DN`                       | Bind user <sup>[1]</sup> distinguished name.                           | --            |
| `AUTH_<PROVIDER>_BIND_PASSWORD`                 | Bind user password.                                                    | --            |
| `AUTH_<PROVIDER>_USER_DN`                       | Directory path containing users.                                       | --            |
| `AUTH_<PROVIDER>_USER_ATTRIBUTE`                | Attribute to identify users by.                                        | `cn`          |
| `AUTH_<PROVIDER>_USER_SCOPE`                    | Scope of the user search, either `base`, `one`, `sub` <sup>[2]</sup>.  | `one`         |
| `AUTH_<PROVIDER>_GROUP_DN`<sup>[3]</sup>        | Directory path containing groups.                                      | --            |
| `AUTH_<PROVIDER>_GROUP_ATTRIBUTE`               | Attribute to identify user as a member of a group.                     | `member`      |
| `AUTH_<PROVIDER>_GROUP_SCOPE`                   | Scope of the group search, either `base`, `one`, `sub` <sup>[2]</sup>. | `one`         |
| `AUTH_<PROVIDER>_MAIL_ATTRIBUTE`                | Attribute containing the email of the user.                            | `mail`        |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`<sup>[3]</sup> | Role to use on user sign-up. Only used when GROUP_DN isn't configured. | --            |

<sup>[1]</sup> The bind user must have permission to query users and groups to perform authentication. To bind
anonymously use `AUTH_LDAP_BIND_DN=""` and `AUTH_LDAP_BIND_PASSWORD=""`

<sup>[2]</sup> The scope defines the following behaviors:

- `base`: Limits the scope to a single object defined by the associated DN.
- `one`: Searches all objects within the associated DN.
- `sub`: Searches all objects and sub-objects within the associated DN.

<sup>[3]</sup> If you specify groupDn, the user's role will always get updated on authentication to what's configured in
AD. It will fallback to the configured default role id if supplied.

### Example: LDAP

```
AUTH_PROVIDERS="ldap"

AUTH_LDAP_DRIVER="ldap"
AUTH_LDAP_CLIENT_URL="ldap://ldap.directus.io"
AUTH_LDAP_BIND_DN="CN=Bind User,OU=Users,DC=ldap,DC=directus,DC=io"
AUTH_LDAP_BIND_PASSWORD="p455w0rd"
AUTH_LDAP_USER_DN="OU=Users,DC=ldap,DC=directus,DC=io"
AUTH_LDAP_GROUP_DN="OU=Groups,DC=ldap,DC=directus,DC=io"
```

### Example: Multiple Auth Providers

You can configure multiple providers for handling authentication in Directus. This allows for different options when
logging in. To do this, you can provide a CSV of provider names, and provide a config block for each of them:

```
AUTH_PROVIDERS="google,adobe"

AUTH_GOOGLE_DRIVER="openid"
AUTH_GOOGLE_CLIENT_ID="<google_application_id>"
AUTH_GOOGLE_CLIENT_SECRET= "<google_application_secret_key>"
AUTH_GOOGLE_ISSUER_URL="https://accounts.google.com"
AUTH_GOOGLE_IDENTIFIER_KEY="email"
AUTH_GOOGLE_ICON="google"

AUTH_ADOBE_DRIVER="oauth2"
AUTH_ADOBE_CLIENT_ID="<adobe_application_id>"
AUTH_ADOBE_CLIENT_SECRET="<adobe_application_secret_key>"
AUTH_ADOBE_AUTHORIZE_URL="https://ims-na1.adobelogin.com/ims/authorize/v2"
AUTH_ADOBE_ACCESS_URL="https://ims-na1.adobelogin.com/ims/token/v3"
AUTH_ADOBE_PROFILE_URL="https://ims-na1.adobelogin.com/ims/userinfo/v2"
AUTH_ADOBE_ICON="adobe"
```

## Extensions

| Variable                 | Description                                             | Default Value  |
| ------------------------ | ------------------------------------------------------- | -------------- |
| `EXTENSIONS_PATH`        | Path to your local extensions folder.                   | `./extensions` |
| `EXTENSIONS_AUTO_RELOAD` | Automatically reload extensions when they have changed. | `false`        |

## Email

| Variable          | Description                                                              | Default Value          |
| ----------------- | ------------------------------------------------------------------------ | ---------------------- |
| `EMAIL_FROM`      | Email address from which emails are sent.                                | `no-reply@directus.io` |
| `EMAIL_TRANSPORT` | What to use to send emails. One of `sendmail`, `smtp`, `mailgun`, `ses`. | `sendmail`             |

Based on the `EMAIL_TRANSPORT` used, you must also provide the following configurations:

### Sendmail (`sendmail`)

| Variable                  | Description                             | Default Value        |
| ------------------------- | --------------------------------------- | -------------------- |
| `EMAIL_SENDMAIL_NEW_LINE` | What new line style to use in sendmail. | `unix`               |
| `EMAIL_SENDMAIL_PATH`     | Path to your sendmail executable.       | `/usr/sbin/sendmail` |

### SMTP (`smtp`)

| Variable                | Description      | Default Value |
| ----------------------- | ---------------- | ------------- |
| `EMAIL_SMTP_HOST`       | SMTP Host        | --            |
| `EMAIL_SMTP_PORT`       | SMTP Port        | --            |
| `EMAIL_SMTP_USER`       | SMTP User        | --            |
| `EMAIL_SMTP_PASSWORD`   | SMTP Password    | --            |
| `EMAIL_SMTP_POOL`       | Use SMTP pooling | --            |
| `EMAIL_SMTP_SECURE`     | Enable TLS       | --            |
| `EMAIL_SMTP_IGNORE_TLS` | Ignore TLS       | --            |

### Mailgun (`mailgun`)

| Variable                | Description                                                                       | Default Value     |
| ----------------------- | --------------------------------------------------------------------------------- | ----------------- |
| `EMAIL_MAILGUN_API_KEY` | Your Mailgun API key.                                                             | --                |
| `EMAIL_MAILGUN_DOMAIN`  | A domain from [your Mailgun account](https://app.mailgun.com/app/sending/domains) | --                |
| `EMAIL_MAILGUN_HOST`    | Allows you to specify a custom host.                                              | `api.mailgun.net` |

### AWS SES (`ses`)

| Variable                                   | Description                  | Default Value |
| ------------------------------------------ | ---------------------------- | ------------- |
| `EMAIL_SES_CREDENTIALS__ACCESS_KEY_ID`     | Your AWS SES access key. ID. | --            |
| `EMAIL_SES_CREDENTIALS__SECRET_ACCESS_KEY` | Your AWS SES secret key.     | --            |
| `EMAIL_SES_REGION`                         | Your AWS SES region.         | --            |

## Admin Account

If you're relying on Docker and/or the `directus bootstrap` CLI command, you can pass the following two environment
variables to automatically configure the first user:

| Variable         | Description                                                                                       | Default Value |
| ---------------- | ------------------------------------------------------------------------------------------------- | ------------- |
| `ADMIN_EMAIL`    | The email address of the first user that's automatically created when using `directus bootstrap`. | --            |
| `ADMIN_PASSWORD` | The password of the first user that's automatically created when using `directus bootstrap`.      | --            |

## Telemetry

To more accurately gauge the frequency of installation, version fragmentation, and general size of the userbase,
Directus collects little and anonymized data about your environment. You can easily opt-out with the following
environment variable:

| Variable    | Description                                                       | Default Value |
| ----------- | ----------------------------------------------------------------- | ------------- |
| `TELEMETRY` | Allow Directus to collect anonymized data about your environment. | `true`        |

## Limits & Optimizations

Allows you to configure hard technical limits, to prevent abuse and optimize for your particular server environment.

| Variable                | Description                                                                               | Default Value |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------- |
| `RELATIONAL_BATCH_SIZE` | How many rows are read into memory at a time when constructing nested relational datasets | 25000         |
| `EXPORT_BATCH_SIZE`     | How many rows are read into memory at a time when constructing exports                    | 5000          |
