---
description:
  Environment variables are used for all configuration within a Directus project. These variables can be defined in a
  number of ways, which we cover below.
readTime: 28 min read
---

# Configuration Options

> Environment variables are used for all configuration within a Directus project. These variables can be defined in a
> number of ways, which we cover below.

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
// Object Syntax

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
| `json`        | `json:{"items": ["example1", "example2"]}`                                                                      | `{"items": ["example1", "example2"]}`                                                                                        |

---

## General

| Variable                   | Description                                                                                                | Default Value                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `CONFIG_PATH`              | Where your config file is located. See [Configuration Files](#configuration-files)                         | `.env`                       |
| `HOST`                     | IP or host the API listens on.                                                                             | `0.0.0.0`                    |
| `PORT`                     | What port to run the API under.                                                                            | `8055`                       |
| `PUBLIC_URL`<sup>[1]</sup> | URL where your API can be reached on the web.                                                              | `/`                          |
| `LOG_LEVEL`                | What level of detail to log. One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`.        | `info`                       |
| `LOG_STYLE`                | Render the logs human readable (pretty) or as JSON. One of `pretty`, `raw`.                                | `pretty`                     |
| `MAX_PAYLOAD_SIZE`         | Controls the maximum request body size. Accepts number of bytes, or human readable string.                 | `1mb`                        |
| `ROOT_REDIRECT`            | Where to redirect to when navigating to `/`. Accepts a relative path, absolute URL, or `false` to disable. | `./admin`                    |
| `SERVE_APP`                | Whether or not to serve the Admin App under `/admin`.                                                      | `true`                       |
| `GRAPHQL_INTROSPECTION`    | Whether or not to enable GraphQL Introspection                                                             | `true`                       |
| `MAX_BATCH_MUTATION`       | The maximum number of items for batch mutations when creating, updating and deleting.                      | `Infinity`                   |
| `MAX_RELATIONAL_DEPTH`     | The maximum depth when filtering / querying relational fields, with a minimum value of `2`.                | `10`                         |
| `QUERY_LIMIT_DEFAULT`      | The default query limit used when not defined in the API request.                                          | `100`                        |
| `QUERY_LIMIT_MAX`          | The maximum query limit accepted on API requests.                                                          | `-1`                         |
| `ROBOTS_TXT`               | What the `/robots.txt` endpoint should return                                                              | `User-agent: *\nDisallow: /` |

<sup>[1]</sup> The PUBLIC_URL value is used for things like OAuth redirects, forgot-password emails, and logos that
needs to be publicly available on the internet.

::: tip Additional Logger Variables

All `LOGGER_*` environment variables are passed to the `options` configuration of a
[`Pino` instance](https://github.com/pinojs/pino/blob/master/docs/api.md#options). All `LOGGER_HTTP*` environment
variables are passed to the `options` configuration of a
[`Pino-http` instance](https://github.com/pinojs/pino-http#api). Based on your project's needs, you can extend the
`LOGGER_*` environment variables with any config you need to pass to the logger instance. If a LOGGER_LEVELS key is
added, these values will be passed to the logger frontmatter, as described
[here](https://github.com/pinojs/pino/blob/master/docs/help.md#mapping-pino-log-levels-to-google-cloud-logging-stackdriver-severity-levels)
for example. The format for adding LEVELS values is:
`LOGGER_LEVELS="trace:DEBUG,debug:DEBUG,info:INFO,warn:WARNING,error:ERROR,fatal:CRITICAL"`

:::

## Server

| Variable                    | Description                                                       | Default Value                                                                                                |
| --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `SERVER_KEEP_ALIVE_TIMEOUT` | Timeout in milliseconds for socket to be destroyed                | [server.keepAliveTimeout](https://github.com/nodejs/node/blob/master/doc/api/http.md#serverkeepalivetimeout) |
| `SERVER_HEADERS_TIMEOUT`    | Timeout in milliseconds to parse HTTP headers                     | [server.headersTimeout](https://github.com/nodejs/node/blob/master/doc/api/http.md#serverheaderstimeout)     |
| `SERVER_SHUTDOWN_TIMEOUT`   | Timeout in milliseconds before the server is forcefully shut down | 1000                                                                                                         |

::: tip Additional Server Variables

All `SERVER_*` environment variables are merged with `server` instance properties created from
[http.Server](https://github.com/nodejs/node/blob/master/doc/api/http.md#class-httpserver). This allows to configure
server behind a proxy, a load balancer, etc. Be careful to not override methods of this instance otherwise you may incur
into unexpected behaviors.

:::

## Database

| Variable                   | Description                                                                                                                                        | Default Value                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `DB_CLIENT`                | **Required**. What database client to use. One of `pg` or `postgres`, `mysql`, `oracledb`, `mssql`, `sqlite3`, `cockroachdb`.                      | --                            |
| `DB_HOST`                  | Database host. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_PORT`                  | Database port. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_DATABASE`              | Database name. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_USER`                  | Database user. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_PASSWORD`              | Database user's password. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                           | --                            |
| `DB_FILENAME`              | Where to read/write the SQLite database. **Required** when using `sqlite3`.                                                                        | --                            |
| `DB_CONNECTION_STRING`     | When using `pg`, you can submit a connection string instead of individual properties. Using this will ignore any of the other connection settings. | --                            |
| `DB_POOL__*`               | Pooling settings. Passed on to [the `tarn.js`](https://github.com/vincit/tarn.js#usage) library.                                                   | --                            |
| `DB_EXCLUDE_TABLES`        | CSV of tables you want Directus to ignore completely                                                                                               | `spatial_ref_sys,sysdiagrams` |
| `DB_CHARSET`               | Charset/collation to use in the connection to MySQL/MariaDB                                                                                        | `UTF8_GENERAL_CI`             |
| `DB_VERSION`               | Database version, in case you use the PostgreSQL adapter to connect a non-standard database. Not normally required.                                | --                            |
| `DB_HEALTHCHECK_THRESHOLD` | Healthcheck timeout threshold in ms.                                                                                                               | `150`                         |

::: tip Additional Database Variables

All `DB_*` environment variables are passed to the `connection` configuration of a [`Knex` instance](http://knexjs.org).
Based on your project's needs, you can extend the `DB_*` environment variables with any config you need to pass to the
database instance.

:::

::: tip Pooling

All the `DB_POOL__` prefixed options are passed to [`tarn.js`](https://github.com/vincit/tarn.js#usage) through
[Knex](http://knexjs.org#Installation-pooling)

:::

## Security

| Variable                         | Description                                                                                                                                                                                          | Default Value             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `KEY`                            | Unique identifier for the project.                                                                                                                                                                   | --                        |
| `SECRET`                         | Secret string for the project.                                                                                                                                                                       | --                        |
| `ACCESS_TOKEN_TTL`               | The duration that the access token is valid.                                                                                                                                                         | `15m`                     |
| `REFRESH_TOKEN_TTL`              | The duration that the refresh token is valid, and also how long users stay logged-in to the App.                                                                                                     | `7d`                      |
| `REFRESH_TOKEN_COOKIE_DOMAIN`    | Which domain to use for the refresh cookie. Useful for development mode.                                                                                                                             | --                        |
| `REFRESH_TOKEN_COOKIE_SECURE`    | Whether or not to use a secure cookie for the refresh token in cookie mode.                                                                                                                          | `false`                   |
| `REFRESH_TOKEN_COOKIE_SAME_SITE` | Value for `sameSite` in the refresh token cookie when in cookie mode.                                                                                                                                | `lax`                     |
| `REFRESH_TOKEN_COOKIE_NAME`      | Name of refresh token cookie .                                                                                                                                                                       | `directus_refresh_token`  |
| `LOGIN_STALL_TIME`               | The duration in milliseconds that a login request will be stalled for, and it should be greater than the time taken for a login request with an invalid password                                     | `500`                     |
| `PASSWORD_RESET_URL_ALLOW_LIST`  | List of URLs that can be used [as `reset_url` in /password/request](/reference/authentication#request-password-reset)                                                                                | --                        |
| `USER_INVITE_URL_ALLOW_LIST`     | List of URLs that can be used [as `invite_url` in /users/invite](/reference/system/users#invite-a-new-user)                                                                                          | --                        |
| `IP_TRUST_PROXY`                 | Settings for [express' trust proxy setting](https://expressjs.com/en/guide/behind-proxies.html)                                                                                                      | true                      |
| `IP_CUSTOM_HEADER`               | What custom request header to use for the IP address                                                                                                                                                 | false                     |
| `ASSETS_CONTENT_SECURITY_POLICY` | Custom overrides for the Content-Security-Policy header for the /assets endpoint. See [helmet's documentation on `helmet.contentSecurityPolicy()`](https://helmetjs.github.io) for more information. | --                        |
| `IMPORT_IP_DENY_LIST`            | Deny importing files from these IP addresses. Use `0.0.0.0` for any local IP address                                                                                                                 | `0.0.0.0,169.254.169.254` |
| `CONTENT_SECURITY_POLICY_*`      | Custom overrides for the Content-Security-Policy header. See [helmet's documentation on `helmet.contentSecurityPolicy()`](https://helmetjs.github.io) for more information.                          | --                        |
| `HSTS_ENABLED`                   | Enable the Strict-Transport-Security policy header.                                                                                                                                                  | `false`                   |
| `HSTS_*`                         | Custom overrides for the Strict-Transport-Security header. See [helmet's documentation](https://helmetjs.github.io) for more information.                                                            | --                        |
| `FLOWS_EXEC_ALLOWED_MODULES`     | CSV allowlist of node modules that are allowed to be used in the _run script_ operation in flows                                                                                                     | --                        |

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
| `HASH_TYPE`            | The variant of the hash function (`0`: argon2d, `1`: argon2i, or `2`: argon2id).                                                 | `2` (argon2id)      |
| `HASH_ASSOCIATED_DATA` | An extra and optional non-secret value. The value will be included Base64 encoded in the parameters portion of the digest.       | --                  |

Argon2's hashing function is used by Directus for three purposes: 1) hashing user passwords, 2) generating hashes for
the `Hash` field type in collections, and 3) the
[generate a hash API endpoint](/reference/system/utilities#generate-a-hash).

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

:::tip More Details

For more details about each configuration variable, please see the
[CORS package documentation](https://www.npmjs.com/package/cors#configuration-options).

:::

## Rate Limiting

You can use the built-in rate-limiter to prevent users from hitting the API too much. Simply enabling the rate-limiter
will set a default maximum of 50 requests per second, tracked in memory. Once you have multiple copies of Directus
running under a load balancer, or your user base grows so much that memory is no longer a viable place to store the rate
limiter information, you can use an external `memcache` or `redis` instance to store the rate limiter data.

| Variable                                    | Description                                                                      | Default Value |
| ------------------------------------------- | -------------------------------------------------------------------------------- | ------------- |
| `RATE_LIMITER_ENABLED`                      | Whether or not to enable rate limiting per IP on the API.                        | `false`       |
| `RATE_LIMITER_POINTS`                       | The amount of allowed hits per duration.                                         | `50`          |
| `RATE_LIMITER_DURATION`                     | The time window in seconds in which the points are counted.                      | `1`           |
| `RATE_LIMITER_STORE`                        | Where to store the rate limiter counts. One of `memory`, `redis`, or `memcache`. | `memory`      |
| `RATE_LIMITER_HEALTHCHECK_THRESHOLD`        | Healthcheck timeout threshold in ms.                                             | `150`         |
| `RATE_LIMITER_GLOBAL_ENABLED`               | Whether or not to enable global rate limiting on the API.                        | `false`       |
| `RATE_LIMITER_GLOBAL_POINTS`                | The total amount of allowed hits per duration.                                   | `1000`        |
| `RATE_LIMITER_GLOBAL_DURATION`              | The time window in seconds in which the points are counted.                      | `1`           |
| `RATE_LIMITER_GLOBAL_STORE`                 | Where to store the rate limiter counts. One of `memory`, `redis`, or `memcache`. | `memory`      |
| `RATE_LIMITER_GLOBAL_HEALTHCHECK_THRESHOLD` | Healthcheck timeout threshold in ms.                                             | `150`         |

Based on the `RATE_LIMITER_STORE`/`RATE_LIMITER_GLOBAL_STORE` used, you must also provide the following configurations:

### Memory

No additional configuration required.

### Redis

| Variable                    | Description                                                             | Default Value |
| --------------------------- | ----------------------------------------------------------------------- | ------------- |
| `RATE_LIMITER_REDIS`        | Redis connection string, e.g., `redis://user:password@127.0.0.1:6380/4` | ---           |
| `RATE_LIMITER_GLOBAL_REDIS` | Redis connection string, e.g., `redis://user:password@127.0.0.1:6380/4` | ---           |

Alternatively, you can provide the individual connection parameters:

| Variable                             | Description                                                   | Default Value |
| ------------------------------------ | ------------------------------------------------------------- | ------------- |
| `RATE_LIMITER_REDIS_HOST`            | Hostname of the Redis instance, e.g., `"127.0.0.1"`           | --            |
| `RATE_LIMITER_REDIS_PORT`            | Port of the Redis instance, e.g., `6379`                      | --            |
| `RATE_LIMITER_REDIS_USERNAME`        | Username for your Redis instance, e.g., `"default"`           | --            |
| `RATE_LIMITER_REDIS_PASSWORD`        | Password for your Redis instance, e.g., `"yourRedisPassword"` | --            |
| `RATE_LIMITER_REDIS_DB`              | Database of your Redis instance to connect, e.g., `1`         | --            |
| `RATE_LIMITER_GLOBAL_REDIS_HOST`     | Hostname of the Redis instance, e.g., `"127.0.0.1"`           | --            |
| `RATE_LIMITER_GLOBAL_REDIS_PORT`     | Port of the Redis instance, e.g., `6379`                      | --            |
| `RATE_LIMITER_GLOBAL_REDIS_USERNAME` | Username for your Redis instance, e.g., `"default"`           | --            |
| `RATE_LIMITER_GLOBAL_REDIS_PASSWORD` | Password for your Redis instance, e.g., `"yourRedisPassword"` | --            |
| `RATE_LIMITER_GLOBAL_REDIS_DB`       | Database of your Redis instance to connect, e.g., `1`         | --            |

### Memcache

| Variable                       | Description                                                                                                                                                             | Default Value |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `RATE_LIMITER_MEMCACHE`        | Location of your memcache instance. You can use [`array:` syntax](#environment-syntax-prefix), e.g., `array:<instance-1>,<instance-2>` for multiple memcache instances. | ---           |
| `RATE_LIMITER_GLOBAL_MEMCACHE` | Location of your memcache instance. You can use [`array:` syntax](#environment-syntax-prefix), e.g., `array:<instance-1>,<instance-2>` for multiple memcache instances. | ---           |

::: tip Additional Rate Limiter Variables

All `RATE_LIMITER_*`/`RATE_LIMITER_GLOBAL_*` variables are passed directly to a `rate-limiter-flexible` instance.
Depending on your project's needs, you can extend the above environment variables to configure any of
[the `rate-limiter-flexible` options](https://github.com/animir/node-rate-limiter-flexible/wiki/Options).

:::

### Example: Basic

```
# 10 requests per 5 seconds
RATE_LIMITER_POINTS="10"
RATE_LIMITER_DURATION="5"

# globally 100 requests per 5 seconds
RATE_LIMITER_GLOBAL_POINTS="100"
RATE_LIMITER_GLOBAL_DURATION="5"
```

### Example: Redis

```
RATE_LIMITER_ENABLED="true"

RATE_LIMITER_POINTS="10"
RATE_LIMITER_DURATION="5"

RATE_LIMITER_STORE="redis"

RATE_LIMITER_REDIS="redis://@127.0.0.1"

# If you are using Redis ACL
RATE_LIMITER_REDIS_USERNAME="default"
RATE_LIMITER_REDIS_PASSWORD="yourRedisPassword"
RATE_LIMITER_REDIS_HOST="127.0.0.1"
RATE_LIMITER_REDIS_PORT=6379
RATE_LIMITER_REDIS_DB=0
```

### Pressure-based rate limiter

This rate-limiter prevents the API from accepting new requests while the server is experiencing high load. This continuously monitors the current event loop and memory usage, and error out requests with a 503 early when the system is overloaded.

| Variable                                      | Description                                                         | Default Value |
|-----------------------------------------------|---------------------------------------------------------------------|---------------|
| `PRESSURE_LIMITER_ENABLED`                    | Whether or not to enable pressure-based rate limiting on the API.   | `true`        |
| `PRESSURE_LIMITER_SAMPLE_INTERVAL`            | The time window for measuring pressure in ms.                       | `250`         |
| `PRESSURE_LIMITER_MAX_EVENT_LOOP_UTILIZATION` | The maximum allowed utilization where `1` is 100% loop utilization. | `0.99`        |
| `PRESSURE_LIMITER_MAX_EVENT_LOOP_DELAY`       | The maximum amount of time the current loop can be delayed in ms.   | `500`         |
| `PRESSURE_LIMITER_MAX_MEMORY_RSS`             | The maximum allowed memory Resident Set Size (RSS) in bytes.        | `false`       |
| `PRESSURE_LIMITER_MAX_MEMORY_HEAP_USED`       | The maximum allowed heap usage in bytes.                            | `false`       |
| `PRESSURE_LIMITER_RETRY_AFTER`                | Sets the `Retry-After` header when the rate limiter is triggered.   | `false`       |

## Cache

Directus has a built-in data-caching option. Enabling this will cache the output of requests (based on the current user
and exact query parameters used) into configured cache storage location. This drastically improves API performance, as
subsequent requests are served straight from this cache. Enabling cache will also make Directus return accurate
cache-control headers. Depending on your setup, this will further improve performance by caching the request in
middleman servers (like CDNs) and even the browser.

:::tip Internal Caching

In addition to data-caching, Directus also does some internal caching. Note `CACHE_SCHEMA` and `CACHE_PERMISSIONS` which
are enabled by default. These speed up the overall performance of Directus, as we don't want to introspect the whole
database or check all permissions on every request. When running Directus load balanced, you'll need to use a shared
cache storage (like [Redis](#redis-2) or [Memcache](#memcache-2)) or else disable all caching.

:::

::: tip Assets Cache

`Cache-Control` and `Last-Modified` headers for the `/assets` endpoint are separate from the regular data-cache.
`Last-Modified` comes from `modified_on` DB field. This is useful as it's often possible to cache assets for far longer
than you would cache database content. To learn more, see [Assets](#assets).

:::

| Variable                          | Description                                                                                                             | Default Value    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `CACHE_ENABLED`                   | Whether or not data caching is enabled.                                                                                 | `false`          |
| `CACHE_TTL`<sup>[1]</sup>         | How long the data cache is persisted.                                                                                   | `5m`             |
| `CACHE_CONTROL_S_MAXAGE`          | Whether to not to add the `s-maxage` expiration flag. Set to a number for a custom value.                               | `0`              |
| `CACHE_AUTO_PURGE`<sup>[2]</sup>  | Automatically purge the data cache on `create`, `update`, and `delete` actions.                                         | `false`          |
| `CACHE_SYSTEM_TTL`<sup>[3]</sup>  | How long `CACHE_SCHEMA` and `CACHE_PERMISSIONS` are persisted.                                                          | --               |
| `CACHE_SCHEMA`<sup>[3]</sup>      | Whether or not the database schema is cached. One of `false`, `true`                                                    | `true`           |
| `CACHE_PERMISSIONS`<sup>[3]</sup> | Whether or not the user permissions are cached. One of `false`, `true`                                                  | `true`           |
| `CACHE_NAMESPACE`                 | How to scope the cache data.                                                                                            | `directus-cache` |
| `CACHE_STORE`<sup>[4]</sup>       | Where to store the cache data. Either `memory`, `redis`, or `memcache`.                                                 | `memory`         |
| `CACHE_STATUS_HEADER`             | If set, returns the cache status in the configured header. One of `HIT`, `MISS`.                                        | --               |
| `CACHE_VALUE_MAX_SIZE`            | Maximum size of values that will be cached. Accepts number of bytes, or human readable string. Use `false` for no limit | false            |
| `CACHE_SKIP_ALLOWED`              | Whether requests can use the Cache-Control header with `no-store` to skip data caching.                                 | false            |
| `CACHE_HEALTHCHECK_THRESHOLD`     | Healthcheck timeout threshold in ms.                                                                                    | `150`            |

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

| Variable      | Description                                                             | Default Value |
| ------------- | ----------------------------------------------------------------------- | ------------- |
| `CACHE_REDIS` | Redis connection string, e.g., `redis://user:password@127.0.0.1:6380/4` | ---           |

Alternatively, you can provide the individual connection parameters:

| Variable               | Description                                                   | Default Value |
| ---------------------- | ------------------------------------------------------------- | ------------- |
| `CACHE_REDIS_HOST`     | Hostname of the Redis instance, e.g., `"127.0.0.1"`           | --            |
| `CACHE_REDIS_PORT`     | Port of the Redis instance, e.g., `6379`                      | --            |
| `CACHE_REDIS_USERNAME` | Username for your Redis instance, e.g., `"default"`           | --            |
| `CACHE_REDIS_PASSWORD` | Password for your Redis instance, e.g., `"yourRedisPassword"` | --            |
| `CACHE_REDIS_DB`       | Database of your Redis instance to connect, e.g., `1`         | --            |

### Memcache

| Variable         | Description                                                                                                                                                             | Default Value |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `CACHE_MEMCACHE` | Location of your memcache instance. You can use [`array:` syntax](#environment-syntax-prefix), e.g., `array:<instance-1>,<instance-2>` for multiple memcache instances. | ---           |

## File Storage

By default, Directus stores all uploaded files locally on disk. However, you can also configure Directus to use S3,
Google Cloud Storage, Azure, or Cloudinary. You can also configure _multiple_ storage adapters at the same time. This
allows you to choose where files are being uploaded on a file-by-file basis. In the Admin App, files will automatically
be uploaded to the first configured storage location (in this case `local`). The used storage location is saved under
`storage` in `directus_files`.

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

| Variable            | Description                                                                                                             | Default Value |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------- |
| `STORAGE_LOCATIONS` | A CSV of storage locations (e.g., `local,digitalocean,amazon`) to use. You can use any names you'd like for these keys. | `local`       |

For each of the storage locations listed, you must provide the following configuration:

| Variable                                   | Description                                                             | Default Value |
| ------------------------------------------ | ----------------------------------------------------------------------- | ------------- |
| `STORAGE_<LOCATION>_DRIVER`                | Which driver to use, either `local`, `s3`, `gcs`, `azure`, `cloudinary` |               |
| `STORAGE_<LOCATION>_ROOT`                  | Where to store the files on disk                                        | `''`          |
| `STORAGE_<LOCATION>_HEALTHCHECK_THRESHOLD` | Healthcheck timeout threshold in ms.                                    | `750`         |

Based on your configured driver, you must also provide the following configurations:

### Local (`local`)

| Variable                  | Description                      | Default Value |
| ------------------------- | -------------------------------- | ------------- |
| `STORAGE_<LOCATION>_ROOT` | Where to store the files on disk | --            |

### S3 (`s3`)

| Variable                                    | Description               | Default Value      |
| ------------------------------------------- | ------------------------- | ------------------ |
| `STORAGE_<LOCATION>_KEY`                    | User key                  | --                 |
| `STORAGE_<LOCATION>_SECRET`                 | User secret               | --                 |
| `STORAGE_<LOCATION>_BUCKET`                 | S3 Bucket                 | --                 |
| `STORAGE_<LOCATION>_REGION`                 | S3 Region                 | --                 |
| `STORAGE_<LOCATION>_ENDPOINT`               | S3 Endpoint               | `s3.amazonaws.com` |
| `STORAGE_<LOCATION>_ACL`                    | S3 ACL                    | --                 |
| `STORAGE_<LOCATION>_SERVER_SIDE_ENCRYPTION` | S3 Server Side Encryption | --                 |
| `STORAGE_<LOCATION>_FORCE_PATH_STYLE`       | S3 Force Path Style       | false              |

### Azure (`azure`)

| Variable                            | Description                | Default Value                                  |
| ----------------------------------- | -------------------------- | ---------------------------------------------- |
| `STORAGE_<LOCATION>_CONTAINER_NAME` | Azure Storage container    | --                                             |
| `STORAGE_<LOCATION>_ACCOUNT_NAME`   | Azure Storage account name | --                                             |
| `STORAGE_<LOCATION>_ACCOUNT_KEY`    | Azure Storage key          | --                                             |
| `STORAGE_<LOCATION>_ENDPOINT`       | Azure URL                  | `https://{ACCOUNT_NAME}.blob.core.windows.net` |

### Google Cloud Storage (`gcs`)

| Variable                          | Description                 | Default Value |
| --------------------------------- | --------------------------- | ------------- |
| `STORAGE_<LOCATION>_KEY_FILENAME` | Path to key file on disk    | --            |
| `STORAGE_<LOCATION>_BUCKET`       | Google Cloud Storage bucket | --            |

### Cloudinary (`cloudinary`)

| Variable                         | Description                                                         | Default Value |
| -------------------------------- | ------------------------------------------------------------------- | ------------- |
| `STORAGE_<LOCATION>_CLOUD_NAME`  | Cloudinary Cloud Name                                               | --            |
| `STORAGE_<LOCATION>_API_KEY`     | Cloudinary API Key                                                  | --            |
| `STORAGE_<LOCATION>_API_SECRET`  | Cloudinary API Secret                                               | --            |
| `STORAGE_<LOCATION>_ACCESS_MODE` | Default access mode for the file. One of `public`, `authenticated`. | --            |

::: warning One-way sync

Cloudinary is supported as a _storage_ driver. Changes made on Cloudinary are _not_ synced back to Directus, and
Directus _won't_ rely on Cloudinary's asset transformations in the `/assets` endpoint.

:::

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

| Variable                                 | Description                                                                                                                         | Default Value |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `ASSETS_CACHE_TTL`                       | How long assets will be cached for in the browser. Sets the `max-age` value of the `Cache-Control` header.                          | `30d`         |
| `ASSETS_TRANSFORM_MAX_CONCURRENT`        | How many file transformations can be done simultaneously                                                                            | `25`          |
| `ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION`   | The max pixel dimensions size (width/height) that is allowed to be transformed                                                      | `6000`        |
| `ASSETS_TRANSFORM_TIMEOUT`               | Max time spent trying to transform an asset                                                                                         | `7500ms`      |
| `ASSETS_TRANSFORM_MAX_OPERATIONS`        | The max number of transform operations that is allowed to be processed (excludes saved presets)                                     | `5`           |
| `ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL` | Level of sensitivity to invalid images. See the [`sharp.failOn`](https://sharp.pixelplumbing.com/api-constructor#parameters) option | `warning`     |

Image transformations can be fairly heavy on memory usage. If you're using a system with 1GB or less available memory,
we recommend lowering the allowed concurrent transformations to prevent you from overflowing your server.

## Authentication

| Variable               | Description                               | Default Value |
| ---------------------- | ----------------------------------------- | ------------- |
| `AUTH_PROVIDERS`       | A comma-separated list of auth providers. | --            |
| `AUTH_DISABLE_DEFAULT` | Disable the default auth provider         | `false`       |

For each auth provider you list, you must also provide the following configuration:

| Variable                 | Description                                                             | Default Value |
| ------------------------ | ----------------------------------------------------------------------- | ------------- |
| `AUTH_<PROVIDER>_DRIVER` | Which driver to use, either `local`, `oauth2`, `openid`, `ldap`, `saml` | --            |

You may also be required to specify additional variables depending on the auth driver. See configuration details below.

::: tip Multiple Providers

Directus users can only authenticate using the auth provider they are created with. It is not possible to authenticate
with multiple providers for the same user.

:::

### Local (`local`)

The default Directus email/password authentication flow.

No additional configuration required.

### SSO (`oauth2` and `openid`)

Directus' SSO integrations provide powerful alternative ways to authenticate into your project. Directus will ask you to
login on the external service, and return authenticated with a Directus account linked to that service.

For example, you can login to Directus using a GitHub account by creating an
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

More example SSO configurations [can be found here](/self-hosted/sso-examples).

::: warning PUBLIC_URL

These flows rely on the `PUBLIC_URL` variable for redirecting. Ensure the variable is correctly configured.

:::

### OAuth 2.0

| Variable                                    | Description                                                                                   | Default Value    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------- |
| `AUTH_<PROVIDER>_CLIENT_ID`                 | Client identifier for the OAuth provider.                                                     | --               |
| `AUTH_<PROVIDER>_CLIENT_SECRET`             | Client secret for the OAuth provider.                                                         | --               |
| `AUTH_<PROVIDER>_SCOPE`                     | A white-space separated list of permissions to request.                                       | `email`          |
| `AUTH_<PROVIDER>_AUTHORIZE_URL`             | Authorization page URL of the OAuth provider.                                                 | --               |
| `AUTH_<PROVIDER>_ACCESS_URL`                | Access token URL of the OAuth provider.                                                       | --               |
| `AUTH_<PROVIDER>_PROFILE_URL`               | User profile URL of the OAuth provider.                                                       | --               |
| `AUTH_<PROVIDER>_IDENTIFIER_KEY`            | User profile identifier key <sup>[1]</sup>. Will default to `EMAIL_KEY`.                      | --               |
| `AUTH_<PROVIDER>_EMAIL_KEY`                 | User profile email key.                                                                       | `email`          |
| `AUTH_<PROVIDER>_FIRST_NAME_KEY`            | User profile first name key.                                                                  | --               |
| `AUTH_<PROVIDER>_LAST_NAME_KEY`             | User profile last name key.                                                                   | --               |
| `AUTH_<PROVIDER>_ALLOW_PUBLIC_REGISTRATION` | Automatically create accounts for authenticating users.                                       | `false`          |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`           | A Directus role ID to assign created users.                                                   | --               |
| `AUTH_<PROVIDER>_ICON`                      | SVG icon to display with the login link. [See options here](/getting-started/glossary#icons). | `account_circle` |
| `AUTH_<PROVIDER>_LABEL`                     | Text to be presented on SSO button within App.                                                | `<PROVIDER>`     |
| `AUTH_<PROVIDER>_PARAMS`                    | Custom query parameters applied to the authorization URL.                                     | --               |

<sup>[1]</sup> When authenticating, Directus will match the identifier value from the external user profile to a
Directus users "External Identifier".

### OpenID

OpenID is an authentication protocol built on OAuth 2.0, and should be preferred over standard OAuth 2.0 where possible.

| Variable                                    | Description                                                                                   | Default Value          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------- |
| `AUTH_<PROVIDER>_CLIENT_ID`                 | Client identifier for the external service.                                                   | --                     |
| `AUTH_<PROVIDER>_CLIENT_SECRET`             | Client secret for the external service.                                                       | --                     |
| `AUTH_<PROVIDER>_SCOPE`                     | A white-space separated list of permissions to request.                                       | `openid profile email` |
| `AUTH_<PROVIDER>_ISSUER_URL`                | OpenID `.well-known` discovery document URL of the external service.                          | --                     |
| `AUTH_<PROVIDER>_IDENTIFIER_KEY`            | User profile identifier key <sup>[1]</sup>.                                                   | `sub`<sup>[2]</sup>    |
| `AUTH_<PROVIDER>_ALLOW_PUBLIC_REGISTRATION` | Automatically create accounts for authenticating users.                                       | `false`                |
| `AUTH_<PROVIDER>_REQUIRE_VERIFIED_EMAIL`    | Require created users to have a verified email address.                                       | `false`                |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`           | A Directus role ID to assign created users.                                                   | --                     |
| `AUTH_<PROVIDER>_ICON`                      | SVG icon to display with the login link. [See options here](/getting-started/glossary#icons). | `account_circle`       |
| `AUTH_<PROVIDER>_LABEL`                     | Text to be presented on SSO button within App.                                                | `<PROVIDER>`           |
| `AUTH_<PROVIDER>_PARAMS`                    | Custom query parameters applied to the authorization URL.                                     | --                     |

<sup>[1]</sup> When authenticating, Directus will match the identifier value from the external user profile to a
Directus users "External Identifier".

<sup>[2]</sup> `sub` represents a unique user identifier defined by the OpenID provider. For users not relying on
`PUBLIC_REGISTRATION` it is recommended to use a human-readable identifier, such as `email`.

### LDAP (`ldap`)

LDAP allows Active Directory users to authenticate and use Directus without having to be manually configured. User
information and roles will be assigned from Active Directory.

| Variable                                 | Description                                                            | Default Value |
| ---------------------------------------- | ---------------------------------------------------------------------- | ------------- |
| `AUTH_<PROVIDER>_CLIENT_URL`             | LDAP connection URL.                                                   | --            |
| `AUTH_<PROVIDER>_BIND_DN`                | Bind user <sup>[1]</sup> distinguished name.                           | --            |
| `AUTH_<PROVIDER>_BIND_PASSWORD`          | Bind user password.                                                    | --            |
| `AUTH_<PROVIDER>_USER_DN`                | Directory path containing users.                                       | --            |
| `AUTH_<PROVIDER>_USER_ATTRIBUTE`         | Attribute to identify the user.                                        | `cn`          |
| `AUTH_<PROVIDER>_USER_SCOPE`             | Scope of the user search, either `base`, `one`, `sub` <sup>[2]</sup>.  | `one`         |
| `AUTH_<PROVIDER>_MAIL_ATTRIBUTE`         | User email attribute.                                                  | `mail`        |
| `AUTH_<PROVIDER>_FIRST_NAME_ATTRIBUTE`   | User first name attribute.                                             | `givenName`   |
| `AUTH_<PROVIDER>_LAST_NAME_ATTRIBUTE`    | User last name attribute.                                              | `sn`          |
| `AUTH_<PROVIDER>_GROUP_DN`<sup>[3]</sup> | Directory path containing groups.                                      | --            |
| `AUTH_<PROVIDER>_GROUP_ATTRIBUTE`        | Attribute to identify user as a member of a group.                     | `member`      |
| `AUTH_<PROVIDER>_GROUP_SCOPE`            | Scope of the group search, either `base`, `one`, `sub` <sup>[2]</sup>. | `one`         |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`        | A fallback Directus role ID to assign created users.                   | --            |

<sup>[1]</sup> The bind user must have permission to query users and groups to perform authentication. Anonymous binding
can by achieved by setting an empty value for `BIND_DN` and `BIND_PASSWORD`.

<sup>[2]</sup> The scope defines the following behaviors:

- `base`: Limits the scope to a single object defined by the associated DN.
- `one`: Searches all objects within the associated DN.
- `sub`: Searches all objects and sub-objects within the associated DN.

<sup>[3]</sup> If `GROUP_DN` is specified, the user's role will always be updated on authentication to a matching group
configured in AD, or fallback to the `DEFAULT_ROLE_ID`.

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

### SAML

SAML is an open-standard, XML-based authentication framework for authentication and authorization between two entities
without a password.

- Service provider (SP) agrees to trust the identity provider to authenticate users.

- Identity provider (IdP) authenticates users and provides to service providers an authentication assertion that
  indicates a user has been authenticated.

| Variable                                    | Description                                                              | Default Value |
| ------------------------------------------- | ------------------------------------------------------------------------ | ------------- |
| `AUTH_<PROVIDER>_SP_metadata`               | String containing XML metadata for service provider                      | --            |
| `AUTH_<PROVIDER>_IDP_metadata`              | String containing XML metadata for identity provider                     | --            |
| `AUTH_<PROVIDER>_ALLOW_PUBLIC_REGISTRATION` | Automatically create accounts for authenticating users.                  | `false`       |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`           | A Directus role ID to assign created users.                              | --            |
| `AUTH_<PROVIDER>_IDENTIFIER_KEY`            | User profile identifier key <sup>[1]</sup>. Will default to `EMAIL_KEY`. | --            |
| `AUTH_<PROVIDER>_EMAIL_KEY`                 | User profile email key.                                                  | `email`       |

<sup>[1]</sup> When authenticating, Directus will match the identifier value from the external user profile to a
Directus users "External Identifier".

The `SP_metadata` and `IDP_metadata` variables should be set to the XML metadata provided by the service provider and
identity provider respectively.

### Example: Multiple Auth Providers

You can configure multiple providers for handling authentication in Directus. This allows for different options when
logging in. To do this, provide a comma-separated list of provider names, and a config block for each provider:

```
AUTH_PROVIDERS="google,facebook"

AUTH_GOOGLE_DRIVER="openid"
AUTH_GOOGLE_CLIENT_ID="830d...29sd"
AUTH_GOOGLE_CLIENT_SECRET="la23...4k2l"
AUTH_GOOGLE_ISSUER_URL="https://accounts.google.com/.well-known/openid-configuration"
AUTH_GOOGLE_IDENTIFIER_KEY="email"
AUTH_GOOGLE_ICON="google"
AUTH_GOOGLE_LABEL="Google"

AUTH_FACEBOOK_DRIVER="oauth2"
AUTH_FACEBOOK_CLIENT_ID="830d...29sd"
AUTH_FACEBOOK_CLIENT_SECRET="jd8x...685z"
AUTH_FACEBOOK_AUTHORIZE_URL="https://www.facebook.com/dialog/oauth"
AUTH_FACEBOOK_ACCESS_URL="https://graph.facebook.com/oauth/access_token"
AUTH_FACEBOOK_PROFILE_URL="https://graph.facebook.com/me?fields=email"
AUTH_FACEBOOK_ICON="facebook"
AUTH_FACEBOOK_LABEL="Facebook"
```

## Flows

| Variable                     | Description                                      | Default Value |
| ---------------------------- | ------------------------------------------------ | ------------- |
| `FLOWS_ENV_ALLOW_LIST`       | A comma-separated list of environment variables. | `false`       |
| `FLOWS_EXEC_ALLOWED_MODULES` | A comma-separated list of node modules.          | `false`       |

::: tip Usage in Flows Run Script Operation

Allowed modules can be accessed using `require()`.

```js
const axios = require('axios');
```

Allowed environment variables can be accessed through the `$env` within the passed `data` or through `process.env`.

```js
const publicUrl = data['$env']['PUBLIC_URL'];
// OR
const publicUrl = data.$env.PUBLIC_URL;
// OR
const publicUrl = process.env.PUBLIC_URL;
```

:::

## Extensions

| Variable                             | Description                                             | Default Value  |
| ------------------------------------ | ------------------------------------------------------- | -------------- |
| `EXTENSIONS_PATH`                    | Path to your local extensions folder.                   | `./extensions` |
| `EXTENSIONS_AUTO_RELOAD`             | Automatically reload extensions when they have changed. | `false`        |
| `EXTENSIONS_CACHE_TTL`<sup>[1]</sup> | How long custom app Extensions get cached by browsers.  | --             |

<sup>[1]</sup> The `EXTENSIONS_CACHE_TTL` environment variable controls for how long custom app extensions (e.t.,
interface, display, layout, module, panel) are cached by browsers. Caching can speed-up the loading of the app as the
code for the extensions doesn't need to be re-fetched from the server on each app reload. On the other hand, this means
that code changes to app extensions won't be taken into account by the browser until `EXTENSIONS_CACHE_TTL` has expired.
By default, extensions are not cached. The input data type for this environment variable is the same as
[`CACHE_TTL`](#cache).

## Messenger

| Variable              | Description                                                             | Default Value |
| --------------------- | ----------------------------------------------------------------------- | ------------- |
| `MESSENGER_STORE`     | One of `memory`, `redis`<sup>[1]</sup>                                  | `memory`      |
| `MESSENGER_NAMESPACE` | How to scope the channels in Redis                                      | `directus`    |
| `MESSENGER_REDIS`     | Redis connection string, e.g., `redis://user:password@127.0.0.1:6380/4` | ---           |

Alternatively, you can provide the individual connection parameters:

| Variable                   | Description                                                   | Default Value |
| -------------------------- | ------------------------------------------------------------- | ------------- |
| `MESSENGER_REDIS_HOST`     | Hostname of the Redis instance, e.g., `"127.0.0.1"`           | --            |
| `MESSENGER_REDIS_PORT`     | Port of the Redis instance, e.g., `6379`                      | --            |
| `MESSENGER_REDIS_USERNAME` | Username for your Redis instance, e.g., `"default"`           | --            |
| `MESSENGER_REDIS_PASSWORD` | Password for your Redis instance, e.g., `"yourRedisPassword"` | --            |
| `MESSENGER_REDIS_DB`       | Database of your Redis instance to connect, e.g., `1`         | --            |

<sup>[1]</sup> `redis` should be used in load-balanced installations of Directus

## Email

| Variable             | Description                                                                          | Default Value          |
| -------------------- | ------------------------------------------------------------------------------------ | ---------------------- |
| `EMAIL_VERIFY_SETUP` | Check if email setup is properly configured.                                         | `true`                 |
| `EMAIL_FROM`         | Email address from which emails are sent.                                            | `no-reply@example.com` |
| `EMAIL_TRANSPORT`    | What to use to send emails. One of `sendmail`, `smtp`, `mailgun`, `sendgrid`, `ses`. | `sendmail`             |

Based on the `EMAIL_TRANSPORT` used, you must also provide the following configurations:

### Sendmail (`sendmail`)

| Variable                  | Description                             | Default Value        |
| ------------------------- | --------------------------------------- | -------------------- |
| `EMAIL_SENDMAIL_NEW_LINE` | What new line style to use in sendmail. | `unix`               |
| `EMAIL_SENDMAIL_PATH`     | Path to your sendmail executable.       | `/usr/sbin/sendmail` |

### SMTP (`smtp`)

| Variable                | Description          | Default Value |
| ----------------------- | -------------------- | ------------- |
| `EMAIL_SMTP_HOST`       | SMTP server host     | --            |
| `EMAIL_SMTP_PORT`       | SMTP server port     | --            |
| `EMAIL_SMTP_USER`       | SMTP user            | --            |
| `EMAIL_SMTP_PASSWORD`   | SMTP password        | --            |
| `EMAIL_SMTP_POOL`       | Use SMTP pooling     | --            |
| `EMAIL_SMTP_SECURE`     | Enable TLS           | --            |
| `EMAIL_SMTP_IGNORE_TLS` | Ignore TLS           | --            |
| `EMAIL_SMTP_NAME`       | SMTP client hostname | --            |

### Mailgun (`mailgun`)

| Variable                | Description                                                                       | Default Value     |
| ----------------------- | --------------------------------------------------------------------------------- | ----------------- |
| `EMAIL_MAILGUN_API_KEY` | Your Mailgun API key.                                                             | --                |
| `EMAIL_MAILGUN_DOMAIN`  | A domain from [your Mailgun account](https://app.mailgun.com/app/sending/domains) | --                |
| `EMAIL_MAILGUN_HOST`    | Allows you to specify a custom host.                                              | `api.mailgun.net` |

### SendGrid (`sendgrid`)

| Variable                 | Description            | Default Value |
| ------------------------ | ---------------------- | ------------- |
| `EMAIL_SENDGRID_API_KEY` | Your SendGrid API key. | --            |

### AWS SES (`ses`)

| Variable                                   | Description                 | Default Value |
| ------------------------------------------ | --------------------------- | ------------- |
| `EMAIL_SES_CREDENTIALS__ACCESS_KEY_ID`     | Your AWS SES access key ID. | --            |
| `EMAIL_SES_CREDENTIALS__SECRET_ACCESS_KEY` | Your AWS SES secret key.    | --            |
| `EMAIL_SES_REGION`                         | Your AWS SES region.        | --            |

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
