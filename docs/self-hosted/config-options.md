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
startup.

By default, the file is expected to be a ESM, while CommonJS is supported too by using `.cjs` as the file extension.

The JavaScript configuration supports two different formats, either an **Object Structure** where the key is the
environment variable name:

::: code-group

```js [config.js]
export default {
	HOST: '0.0.0.0',
	PORT: 8055,

	DB_CLIENT: 'pg',
	DB_HOST: 'localhost',
	DB_PORT: 5432,

	// etc
};
```

```js [config.cjs]
module.exports = {
	HOST: '0.0.0.0',
	PORT: 8055,

	DB_CLIENT: 'pg',
	DB_HOST: 'localhost',
	DB_PORT: 5432,

	// etc
};
```

:::

Or a **Function Structure** that _returns_ the same object format as above. The function gets `process.env` as its
parameter.

::: code-group

```js [config.js]
export default function (env) {
	return {
		HOST: '0.0.0.0',
		PORT: 8055,

		DB_CLIENT: 'pg',
		DB_HOST: 'localhost',
		DB_PORT: 5432,

		// etc
	};
}
```

```js [config.cjs]
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

:::

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
`DB_*` or `REDIS_*`, the environment variable will be converted to camelCase. You can use a double underscore (`__`) for
nested objects:

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

| Syntax Prefix | Example                                                                                                         | Output                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `string`      | `string:value`                                                                                                  | `"value"`                                                                                            |
| `number`      | `number:3306`                                                                                                   | `3306`                                                                                               |
| `regex`       | `regex:\.example\.com$`                                                                                         | `/\.example\.com$/`                                                                                  |
| `array`       | `array:https://example.com,https://example2.com` <br> `array:string:https://example.com,regex:\.example3\.com$` | `["https://example.com", "https://example2.com"]` <br> `["https://example.com", /\.example3\.com$/]` |
| `json`        | `json:{"items": ["example1", "example2"]}`                                                                      | `{"items": ["example1", "example2"]}`                                                                |

Explicit casting is also available when reading from a file with the `_FILE` suffix.

---

## General

| Variable                                   | Description                                                                                                                 | Default Value                |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `CONFIG_PATH`                              | Where your config file is located. See [Configuration Files](#configuration-files)                                          | `.env`                       |
| `HOST`                                     | IP or host the API listens on.                                                                                              | `0.0.0.0`                    |
| `PORT`                                     | What port to run the API under.                                                                                             | `8055`                       |
| `UNIX_SOCKET_PATH`                         | The Unix socket the API listens on, `PORT` and `HOST` will be ignored if this is provided.                                  | --                           |
| `PUBLIC_URL`<sup>[1]</sup>                 | URL where your API can be reached on the web.                                                                               | `/`                          |
| `LOG_LEVEL`                                | What level of detail to log. One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`.                         | `info`                       |
| `LOG_STYLE`                                | Render the logs human readable (pretty) or as JSON. One of `pretty`, `raw`.                                                 | `pretty`                     |
| `LOG_HTTP_IGNORE_PATHS`                    | List of HTTP request paths which should not appear in the log, for example `/server/ping`.                                  | --                           |
| `MAX_PAYLOAD_SIZE`                         | Controls the maximum request body size. Accepts number of bytes, or human readable string.                                  | `1mb`                        |
| `ROOT_REDIRECT`                            | Redirect the root of the application `/` to a specific route. Accepts a relative path, absolute URL, or `false` to disable. | `./admin`                    |
| `SERVE_APP`                                | Whether or not to serve the Data Studio                                                                                     | `true`                       |
| `GRAPHQL_INTROSPECTION`                    | Whether or not to enable GraphQL Introspection                                                                              | `true`                       |
| `GRAPHQL_SCHEMA_CACHE_CAPACITY`            | How many user GraphQL schemas to store in memory                                                                            | `100`                        |
| `GRAPHQL_SCHEMA_GENERATION_MAX_CONCURRENT` | How many GraphQL schemas can be generated simultaneously                                                                    | `5`                          |
| `MAX_BATCH_MUTATION`                       | The maximum number of items for batch mutations when creating, updating and deleting.                                       | `Infinity`                   |
| `MAX_RELATIONAL_DEPTH`                     | The maximum depth when filtering / querying relational fields, with a minimum value of `2`.                                 | `10`                         |
| `QUERY_LIMIT_DEFAULT`                      | The default query limit used when not defined in the API request.                                                           | `100`                        |
| `QUERY_LIMIT_MAX`                          | The maximum query limit accepted on API requests.                                                                           | `-1`                         |
| `ROBOTS_TXT`                               | What the `/robots.txt` endpoint should return                                                                               | `User-agent: *\nDisallow: /` |
| `TEMP_PATH`                                | Where Directus' temporary files should be managed                                                                           | `./node_modules/.directus`   |
| `MIGRATIONS_PATH`                          | Where custom migrations are located                                                                                         | `./migrations`               |

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

| Variable                           | Description                                                                                                                                        | Default Value                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `DB_CLIENT`                        | **Required**. What database client to use. One of `pg` or `postgres`, `mysql`, `oracledb`, `mssql`, `sqlite3`, `cockroachdb`.                      | --                            |
| `DB_HOST`                          | Database host. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_PORT`                          | Database port. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_DATABASE`                      | Database name. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_USER`                          | Database user. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --                            |
| `DB_PASSWORD`                      | Database user's password. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                           | --                            |
| `DB_FILENAME`                      | Where to read/write the SQLite database. **Required** when using `sqlite3`.                                                                        | --                            |
| `DB_CONNECTION_STRING`             | When using `pg`, you can submit a connection string instead of individual properties. Using this will ignore any of the other connection settings. | --                            |
| `DB_EXCLUDE_TABLES`                | CSV of tables you want Directus to ignore completely                                                                                               | `spatial_ref_sys,sysdiagrams` |
| `DB_CHARSET` / `DB_CHARSET_NUMBER` | Charset/collation to use in the connection to MySQL/MariaDB                                                                                        | `UTF8_GENERAL_CI`             |
| `DB_VERSION`                       | Database version, in case you use the PostgreSQL adapter to connect a non-standard database. Not normally required.                                | --                            |
| `DB_HEALTHCHECK_THRESHOLD`         | Healthcheck timeout threshold in ms.                                                                                                               | `150`                         |

::: tip Additional Database Variables

All `DB_*` environment variables are passed to the `connection` configuration of a
[`Knex` instance](https://knexjs.org/guide/#configuration-options). This means, based on your project's needs, you can
extend the `DB_*` environment variables with any config you need to pass to the database instance.

This includes:

- `DB_POOL__` prefixed options which are passed to [`tarn.js`](https://github.com/vincit/tarn.js#usage).

- `DB_SSL__` prefixed options which are passed to the respective database driver.

  - For example `DB_SSL__CA` which can be used to specify a custom CA certificate for SSL connections. This is
    **required** if the database server CA is not part of [Node.js' trust store](https://nodejs.org/api/tls.html).

    Note: `DB_SSL__CA_FILE` may be preferred to load the CA directly from a file, see
    [Environment Variable Files](#environment-variable-files) for more information.

:::

## Redis

Directus requires Redis for multi-container deployments. This ensures that things like caching, rate-limiting, and
WebSockets work reliably across multiple containers of Directus.

| Variable         | Description                                                                                                                                                | Default Value |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `REDIS_ENABLED`  | Whether or not Redis should be used. Defaults to whether or not you have any of the vars below configured                                                  | --            |
| `REDIS`          | Redis connection string, e.g., `redis://user:password@127.0.0.1:6380/4`. Using this will ignore the other Redis connection parameter environment variables | --            |
| `REDIS_HOST`     | Hostname of the Redis instance, e.g., `"127.0.0.1"`                                                                                                        | --            |
| `REDIS_PORT`     | Port of the Redis instance, e.g., `6379`                                                                                                                   | --            |
| `REDIS_USERNAME` | Username for your Redis instance, e.g., `"default"`                                                                                                        | --            |
| `REDIS_PASSWORD` | Password for your Redis instance, e.g., `"yourRedisPassword"`                                                                                              | --            |

Redis is required when you run Directus load balanced across multiple containers/processes.

::: tip Additional Redis Variables

All `REDIS_*` environment variables are passed to the `connection` configuration of a
[`Redis` instance](https://redis.github.io/ioredis/classes/Redis.html). This means, based on your project's needs, you
can extend the `REDIS_*` environment variables with any config you need to pass to the Redis instance.

This includes:

- `REDIS_SENTINEL_` prefixed options which are passed to
  [`SentinelConnectionOptions`](https://redis.github.io/ioredis/interfaces/SentinelConnectionOptions.html).

  Note: `REDIS_SENTINELS` is required for specifying sentinel instances and expects to receive an array of objects:
  `REDIS_SENTINELS=json:[{"host": "127.0.0.1", "port": 26379}, ...]`

  For example:

  ```
  REDIS_NAME: "redis-cache" # Sentinel cluster name
  REDIS_SENTINEL_PASSWORD: <password>
  REDIS_SENTINELS: 'json:[{"host": <fdqn or ip>, "port": 26379}]'
  ```

  Make sure to explicitly prefix the value with `json` so it will be treated as a json array.

:::

## Data Retention

| Variable              | Description                                                                                                      | Default Value |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------- |
| `RETENTION_ENABLED`   | Whether or not to enable custom data retention settings. `false` will not delete data.                           | `false`       |
| `RETENTION_SCHEDULE`  | The cron schedule at which to check for removable records, the default is once a day at 00:00.                   | `0 0 * * *`   |
| `RETENTION_BATCH`     | The maximum number of records to delete in a single query.                                                       | `500`         |
| `ACTIVITY_RETENTION`  | The maximum amount of time to retain `directus_activity` records or `false` to disable. This excludes flow logs. | `90d`         |
| `REVISIONS_RETENTION` | The maximum amount of time to retain `directus_revisions` records or `false` to disable.                         | `90d`         |
| `FLOW_LOGS_RETENTION` | The maximum amount of time to retain flow logs or `false` to disable.                                            | `90d`         |

## Security

| Variable                            | Description                                                                                                                                                                                          | Default Value             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `SECRET`<sup>[1]</sup>              | Secret string for the project.                                                                                                                                                                       | Random value              |
| `ACCESS_TOKEN_TTL`                  | The duration that the access token is valid.                                                                                                                                                         | `15m`                     |
| `EMAIL_VERIFICATION_TOKEN_TTL`      | The duration that the email verification token is valid.                                                                                                                                             | `7d`                      |
| `REFRESH_TOKEN_TTL`                 | The duration that the refresh token is valid. This value should be higher than `ACCESS_TOKEN_TTL` resp. `SESSION_COOKIE_TTL`.                                                                        | `7d`                      |
| `REFRESH_TOKEN_COOKIE_DOMAIN`       | Which domain to use for the refresh token cookie. Useful for development mode.                                                                                                                       | --                        |
| `REFRESH_TOKEN_COOKIE_SECURE`       | Whether or not to set the `secure` attribute for the refresh token cookie.                                                                                                                           | `false`                   |
| `REFRESH_TOKEN_COOKIE_SAME_SITE`    | Value for `sameSite` in the refresh token cookie.                                                                                                                                                    | `lax`                     |
| `REFRESH_TOKEN_COOKIE_NAME`         | Name of the refresh token cookie.                                                                                                                                                                    | `directus_refresh_token`  |
| `SESSION_COOKIE_TTL`                | The duration that the session cookie/token is valid, and also how long users stay logged-in to the App.                                                                                              | `1d`                      |
| `SESSION_COOKIE_DOMAIN`             | Which domain to use for the session cookie. Useful for development mode.                                                                                                                             | --                        |
| `SESSION_COOKIE_SECURE`             | Whether or not to set the `secure` attribute for the session cookie.                                                                                                                                 | `false`                   |
| `SESSION_COOKIE_SAME_SITE`          | Value for `sameSite` in the session cookie.                                                                                                                                                          | `lax`                     |
| `SESSION_COOKIE_NAME`               | Name of the session cookie.                                                                                                                                                                          | `directus_session_token`  |
| `SESSION_REFRESH_GRACE_PERIOD`      | The duration during which a refresh request will permit recently refreshed sessions to be used, thereby preventing race conditions in refresh calls                                                  | `10s`                     |
| `LOGIN_STALL_TIME`                  | The duration in milliseconds that a login request will be stalled for, and it should be greater than the time taken for a login request with an invalid password                                     | `500`                     |
| `REGISTER_STALL_TIME`               | The duration in milliseconds that a registration request will be stalled for, and it should be greater than the time taken for a registration request with an already registered email               | `750`                     |
| `PASSWORD_RESET_URL_ALLOW_LIST`     | List of URLs that can be used [as `reset_url` in /password/request](/reference/authentication#request-password-reset)                                                                                | --                        |
| `USER_INVITE_TOKEN_TTL`             | The duration that the invite token is valid.                                                                                                                                                         | `7d`                      |
| `USER_INVITE_URL_ALLOW_LIST`        | List of URLs that can be used [as `invite_url` in /users/invite](/reference/system/users#invite-a-new-user)                                                                                          | --                        |
| `USER_REGISTER_URL_ALLOW_LIST`      | List of URLs that can be used as `verification_url` in /users/register                                                                                                                               | --                        |
| `IP_TRUST_PROXY`                    | Settings for [express' trust proxy setting](https://expressjs.com/en/guide/behind-proxies.html)                                                                                                      | true                      |
| `IP_CUSTOM_HEADER`                  | What custom request header to use for the IP address                                                                                                                                                 | false                     |
| `ASSETS_CONTENT_SECURITY_POLICY`    | Custom overrides for the Content-Security-Policy header for the /assets endpoint. See [helmet's documentation on `helmet.contentSecurityPolicy()`](https://helmetjs.github.io) for more information. | --                        |
| `IMPORT_IP_DENY_LIST`<sup>[2]</sup> | Deny importing files from these IP addresses / IP ranges / CIDR blocks. Use `0.0.0.0` to match any local IP address.                                                                                 | `0.0.0.0,169.254.169.254` |
| `CONTENT_SECURITY_POLICY_*`         | Custom overrides for the Content-Security-Policy header. See [helmet's documentation on `helmet.contentSecurityPolicy()`](https://helmetjs.github.io) for more information.                          | --                        |
| `HSTS_ENABLED`                      | Enable the Strict-Transport-Security policy header.                                                                                                                                                  | `false`                   |
| `HSTS_*`                            | Custom overrides for the Strict-Transport-Security header. See [helmet's documentation](https://helmetjs.github.io) for more information.                                                            | --                        |

<sup>[1]</sup> When `SECRET` is not set, a random value will be used. This means sessions won't persist across system
restarts or horizontally scaled deployments. Must be explicitly set to a secure random value in production.

<sup>[2]</sup> localhost can get resolved to `::1` as well as `127.0.0.1` depending on the system - ensure to include
both if you want to specifically block localhost.

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

::: tip More Details

For more details about each configuration variable, please see the
[CORS package documentation](https://www.npmjs.com/package/cors#configuration-options).

:::

## Rate Limiting

You can use the built-in rate-limiter to prevent users from hitting the API too much. Simply enabling the rate-limiter
will set a default maximum of 50 requests per second, tracked in memory.

| Variable                                    | Description                                                             | Default Value |
| ------------------------------------------- | ----------------------------------------------------------------------- | ------------- |
| `RATE_LIMITER_ENABLED`                      | Whether or not to enable rate limiting per IP on the API.               | `false`       |
| `RATE_LIMITER_POINTS`                       | The amount of allowed hits per duration.                                | `50`          |
| `RATE_LIMITER_DURATION`                     | The time window in seconds in which the points are counted.             | `1`           |
| `RATE_LIMITER_STORE`                        | Where to store the rate limiter counts. One of `memory`, `redis`.       | `memory`      |
| `RATE_LIMITER_HEALTHCHECK_THRESHOLD`        | Healthcheck timeout threshold in ms.                                    | `150`         |
| `RATE_LIMITER_GLOBAL_ENABLED`               | Whether or not to enable global rate limiting on the API.               | `false`       |
| `RATE_LIMITER_GLOBAL_POINTS`                | The total amount of allowed hits per duration.                          | `1000`        |
| `RATE_LIMITER_GLOBAL_DURATION`              | The time window in seconds in which the points are counted.             | `1`           |
| `RATE_LIMITER_GLOBAL_HEALTHCHECK_THRESHOLD` | Healthcheck timeout threshold in ms.                                    | `150`         |
| `RATE_LIMITER_REGISTRATION_ENABLED`         | Whether or not to enable rate limiting per IP on the user registration. | `true`        |
| `RATE_LIMITER_REGISTRATION_POINTS`          | The amount of allowed hits per duration.                                | `5`           |
| `RATE_LIMITER_REGISTRATION_DURATION`        | The time window in seconds in which the points are counted.             | `60`          |

Based on the `RATE_LIMITER_STORE` used, you must also provide the following configurations:

### Example: Basic

```
# 10 requests per 5 seconds
RATE_LIMITER_POINTS="10"
RATE_LIMITER_DURATION="5"

# globally 100 requests per 5 seconds
RATE_LIMITER_GLOBAL_POINTS="100"
RATE_LIMITER_GLOBAL_DURATION="5"
```

### Pressure-based rate limiter

This rate-limiter prevents the API from accepting new requests while the server is experiencing high load. This
continuously monitors the current event loop and memory usage, and error out requests with a 503 early when the system
is overloaded.

| Variable                                      | Description                                                         | Default Value |
| --------------------------------------------- | ------------------------------------------------------------------- | ------------- |
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

::: tip Internal Caching

In addition to data-caching, Directus also does some internal caching. Note `CACHE_SCHEMA` which is enabled by default.
This speed up the overall performance of Directus, as we don't want to introspect the whole database on every request.

:::

::: tip Assets Cache

`Cache-Control` and `Last-Modified` headers for the `/assets` endpoint are separate from the regular data-cache.
`Last-Modified` comes from `modified_on` DB field. This is useful as it's often possible to cache assets for far longer
than you would cache database content. To learn more, see [Assets](#assets).

:::

| Variable                                     | Description                                                                                                               | Default Value                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `CACHE_ENABLED`                              | Whether or not data caching is enabled.                                                                                   | `false`                              |
| `CACHE_TTL`<sup>[1]</sup>                    | How long the data cache is persisted.                                                                                     | `5m`                                 |
| `CACHE_CONTROL_S_MAXAGE`                     | Whether to not to add the `s-maxage` expiration flag. Set to a number for a custom value.                                 | `0`                                  |
| `CACHE_AUTO_PURGE`<sup>[2]</sup>             | Automatically purge the data cache on actions that manipulate the data.                                                   | `false`                              |
| `CACHE_AUTO_PURGE_IGNORE_LIST`<sup>[3]</sup> | List of collections that prevent cache purging when `CACHE_AUTO_PURGE` is enabled.                                        | `directus_activity,directus_presets` |
| `CACHE_SYSTEM_TTL`<sup>[4]</sup>             | How long `CACHE_SCHEMA` is persisted.                                                                                     | --                                   |
| `CACHE_SCHEMA`<sup>[4]</sup>                 | Whether or not the database schema is cached. One of `false`, `true`                                                      | `true`                               |
| `CACHE_SCHEMA_MAX_ITERATIONS`<sup>[4]</sup>  | Safe value to limit max iterations on get schema cache. This value should only be adjusted for high scaling applications. | `100`                                |
| `CACHE_SCHEMA_SYNC_TIMEOUT`                  | How long to wait for other containers to message before trying again                                                      | `10000`                              |
| `CACHE_SCHEMA_FREEZE_ENABLED`                | Whether or not to freeze the schema to improve memory efficiency                                                          | false                                |
| `CACHE_NAMESPACE`                            | How to scope the cache data.                                                                                              | `system-cache`                       |
| `CACHE_STORE`<sup>[5]</sup>                  | Where to store the cache data. Either `memory`, `redis`.                                                                  | `memory`                             |
| `CACHE_STATUS_HEADER`                        | If set, returns the cache status in the configured header. One of `HIT`, `MISS`.                                          | --                                   |
| `CACHE_VALUE_MAX_SIZE`                       | Maximum size of values that will be cached. Accepts number of bytes, or human readable string. Use `false` for no limit   | false                                |
| `CACHE_SKIP_ALLOWED`                         | Whether requests can use the Cache-Control header with `no-store` to skip data caching.                                   | false                                |
| `CACHE_HEALTHCHECK_THRESHOLD`                | Healthcheck timeout threshold in ms.                                                                                      | `150`                                |

<sup>[1]</sup> `CACHE_TTL` Based on your project's needs, you might be able to aggressively cache your data, only
requiring new data to be fetched every hour or so. This allows you to squeeze the most performance out of your Directus
instance. This can be incredibly useful for applications where you have a lot of (public) read-access and where updates
aren't real-time (for example a website). `CACHE_TTL` uses [`ms`](https://www.npmjs.com/package/ms) to parse the value,
so you configure it using human readable values (like `2 days`, `7 hrs`, `5m`).

<sup>[2]</sup> `CACHE_AUTO_PURGE` allows you to keep the Directus API real-time, while still getting the performance
benefits on quick subsequent reads.

<sup>[3]</sup> The cache has to be manually cleared when requiring to access updated results for collections in
`CACHE_AUTO_PURGE_IGNORE_LIST`.

<sup>[4]</sup> Not affected by the `CACHE_ENABLED` value.

<sup>[5]</sup> `CACHE_STORE` For larger projects, you most likely don't want to rely on local memory for caching.
Instead, you can use the above `CACHE_STORE` environment variable to use `redis` as the cache store.

## File Storage

By default, Directus stores all uploaded files locally on disk. However, you can also configure Directus to use S3,
Google Cloud Storage, Azure, Cloudinary or Supabase. You can also configure _multiple_ storage adapters at the same
time. This allows you to choose where files are being uploaded on a file-by-file basis. In the Data Studio, files will
automatically be uploaded to the first configured storage location (in this case `local`). The used storage location is
saved under `storage` in `directus_files`.

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

| Variable                                   | Description                                                                         | Default Value |
| ------------------------------------------ | ----------------------------------------------------------------------------------- | ------------- |
| `STORAGE_<LOCATION>_DRIVER`                | Which driver to use, either `local`, `s3`, `gcs`, `azure`, `cloudinary`, `supabase` |               |
| `STORAGE_<LOCATION>_ROOT`                  | Where to store the files on disk                                                    | `''`          |
| `STORAGE_<LOCATION>_HEALTHCHECK_THRESHOLD` | Healthcheck timeout threshold in ms.                                                | `750`         |

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
| `STORAGE_<LOCATION>_ENDPOINT`<sup>[1]</sup> | S3 Endpoint               | `s3.amazonaws.com` |
| `STORAGE_<LOCATION>_ACL`                    | S3 ACL                    | --                 |
| `STORAGE_<LOCATION>_SERVER_SIDE_ENCRYPTION` | S3 Server Side Encryption | --                 |
| `STORAGE_<LOCATION>_FORCE_PATH_STYLE`       | S3 Force Path Style       | false              |

<sup>[1]</sup> When overriding this variable for S3, make sure to add your bucket's region in the endpoint:
`s3.{region}.amazonaws.com`.

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

### Supabase (`supabase`)

| Variable                          | Description                | Default Value |
| --------------------------------- | -------------------------- | ------------- |
| `STORAGE_<LOCATION>_SERVICE_ROLE` | The admin service role JWT | --            |
| `STORAGE_<LOCATION>_BUCKET`       | Storage bucket             | --            |
| `STORAGE_<LOCATION>_PROJECT_ID`   | Project id                 | --            |
| `STORAGE_<LOCATION>_ENDPOINT`     | Optional custom endpoint   | --            |

::: warning Endpoint

Using a custom endpoint will overwrite the project id, so you need to provide the full endpoint url.

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

When uploading an image, Directus persists the _description, title, and tags_ from available Exif metadata. For security
purposes, collection of additional metadata must be configured:

| Variable                   | Description                                                                                           | Default Value                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `FILE_METADATA_ALLOW_LIST` | A comma-separated list of metadata keys to collect during file upload. Use `*` for all<sup>[1]</sup>. | ifd0.Make,ifd0.Model,exif.FNumber,exif.ExposureTime,exif.FocalLength,exif.ISOSpeedRatings |

<sup>[1]</sup>: Extracting all metadata might cause memory issues when the file has an unusually large set of metadata

### Upload Limits

| Variable                     | Description                                                                      | Default Value |
| ---------------------------- | -------------------------------------------------------------------------------- | ------------- |
| `FILES_MAX_UPLOAD_SIZE`      | Maximum file upload size allowed. For example `10mb`, `1gb`, `10kb`              | --            |
| `FILES_MIME_TYPE_ALLOW_LIST` | Allow list of mime types that are allowed to be uploaded. Supports `glob` syntax | `*/*`         |

### Chunked Uploads

Large files can be uploaded in chunks to improve reliability and efficiency, especially in scenarios with network
instability or limited bandwidth. This is implemented using the [TUS protocol](https://tus.io/).

| Variable                | Description                                                       | Default Value |
| ----------------------- | ----------------------------------------------------------------- | ------------- |
| `TUS_ENABLED`           | Whether or not to enable the chunked uploads                      | `false`       |
| `TUS_CHUNK_SIZE`        | The size of each file chunks. For example `10mb`, `1gb`, `10kb`   | `8mb`         |
| `TUS_UPLOAD_EXPIRATION` | The expiry duration for uncompleted files with no upload activity | `10m`         |
| `TUS_CLEANUP_SCHEDULE`  | Cron schedule to clean up the expired uncompleted uploads         | `0 * * * *`   |

::: warning Chunked Upload Restrictions

Some storage drivers have specific chunk size restrictions. The `TUS_CHUNK_SIZE` must meet the relevant restrictions for
the storage driver(s) being used.

| Storage Driver              | `TUS_CHUNK_SIZE` Restriction                                                     |
| --------------------------- | -------------------------------------------------------------------------------- |
| `storage-driver-gcs`        | Must be a power of 2 with a minimum of `256kb` (e.g. `256kb`, `512kb`, `1024kb`) |
| `storage-driver-azure`      | Must not be larger than `100mb`                                                  |
| `storage-driver-cloudinary` | Must not be smaller than `5mb`                                                   |

:::

## Assets

| Variable                                 | Description                                                                                                                         | Default Value |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `ASSETS_CACHE_TTL`                       | How long assets will be cached for in the browser. Sets the `max-age` value of the `Cache-Control` header.                          | `30d`         |
| `ASSETS_TRANSFORM_MAX_CONCURRENT`        | How many file transformations can be done simultaneously                                                                            | `25`          |
| `ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION`   | The max pixel dimensions size (width/height) that is allowed to be transformed[^1]                                                  | `6000`        |
| `ASSETS_TRANSFORM_TIMEOUT`               | Max time spent trying to transform an asset                                                                                         | `7500ms`      |
| `ASSETS_TRANSFORM_MAX_OPERATIONS`        | The max number of transform operations that is allowed to be processed (excludes saved presets)                                     | `5`           |
| `ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL` | Level of sensitivity to invalid images. See the [`sharp.failOn`](https://sharp.pixelplumbing.com/api-constructor#parameters) option | `warning`     |

Image transformations can be fairly heavy on memory usage. If you're using a system with 1GB or less available memory,
we recommend lowering the allowed concurrent transformations to prevent you from overflowing your server.

[^1]:
    The maximum value is the square root of Node's `Number.MAX_SAFE_INTEGER`, or 95,906,265 at time of writing. Be
    advised: transforming gigantic files can hurt your server performance and cause outages.

## Authentication

| Variable               | Description                               | Default Value |
| ---------------------- | ----------------------------------------- | ------------- |
| `AUTH_PROVIDERS`       | A comma-separated list of auth providers. | --            |
| `AUTH_DISABLE_DEFAULT` | Disable the default auth provider         | `false`       |

For each auth provider you list, you must also provide the following configuration:

| Variable                 | Description                                                                                                                                | Default Value |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `AUTH_<PROVIDER>_DRIVER` | Which driver to use, either `local`, `oauth2`, `openid`, `ldap`, `saml`                                                                    | --            |
| `AUTH_<PROVIDER>_MODE`   | Whether to use `'cookie'` or `'session'` authentication mode when redirecting. Applies to the following drivers `oauth2`, `openid`, `saml` | `session`     |

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
AUTH_GITHUB_ALLOW_PUBLIC_REGISTRATION=true
```

More example SSO configurations [can be found here](/self-hosted/sso-examples).

::: warning PUBLIC_URL

These flows rely on the `PUBLIC_URL` variable for redirecting. Ensure the variable is correctly configured.

:::

### OAuth 2.0

| Variable                                    | Description                                                                                               | Default Value    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------- |
| `AUTH_<PROVIDER>_CLIENT_ID`                 | Client identifier for the OAuth provider.                                                                 | --               |
| `AUTH_<PROVIDER>_CLIENT_SECRET`             | Client secret for the OAuth provider.                                                                     | --               |
| `AUTH_<PROVIDER>_SCOPE`                     | A white-space separated list of permissions to request.                                                   | `email`          |
| `AUTH_<PROVIDER>_AUTHORIZE_URL`             | Authorization page URL of the OAuth provider.                                                             | --               |
| `AUTH_<PROVIDER>_ACCESS_URL`                | Access token URL of the OAuth provider.                                                                   | --               |
| `AUTH_<PROVIDER>_PROFILE_URL`               | User profile URL of the OAuth provider.                                                                   | --               |
| `AUTH_<PROVIDER>_IDENTIFIER_KEY`            | User profile identifier key <sup>[1]</sup>. Will default to `EMAIL_KEY`.                                  | --               |
| `AUTH_<PROVIDER>_EMAIL_KEY`                 | User profile email key.                                                                                   | `email`          |
| `AUTH_<PROVIDER>_FIRST_NAME_KEY`            | User profile first name key.                                                                              | --               |
| `AUTH_<PROVIDER>_LAST_NAME_KEY`             | User profile last name key.                                                                               | --               |
| `AUTH_<PROVIDER>_ALLOW_PUBLIC_REGISTRATION` | Automatically create accounts for authenticating users.                                                   | `false`          |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`           | A Directus role ID to assign created users.                                                               | --               |
| `AUTH_<PROVIDER>_SYNC_USER_INFO`            | Set user's first name, last name and email from provider's user info on each login.                       | `false`          |
| `AUTH_<PROVIDER>_ICON`                      | SVG icon to display with the login link. [See options here](/user-guide/overview/glossary#icons).         | `account_circle` |
| `AUTH_<PROVIDER>_LABEL`                     | Text to be presented on SSO button within App.                                                            | `<PROVIDER>`     |
| `AUTH_<PROVIDER>_PARAMS`                    | Custom query parameters applied to the authorization URL.                                                 | --               |
| `AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST`       | A comma-separated list of external URLs (including paths) allowed for redirecting after successful login. | --               |

<sup>[1]</sup> When authenticating, Directus will match the identifier value from the external user profile to a
Directus users "External Identifier".

### OpenID

OpenID is an authentication protocol built on OAuth 2.0, and should be preferred over standard OAuth 2.0 where possible.

| Variable                                    | Description                                                                                                                                                                                                          | Default Value          |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `AUTH_<PROVIDER>_CLIENT_ID`                 | Client identifier for the external service.                                                                                                                                                                          | --                     |
| `AUTH_<PROVIDER>_CLIENT_SECRET`             | Client secret for the external service.                                                                                                                                                                              | --                     |
| `AUTH_<PROVIDER>_SCOPE`                     | A white-space separated list of permissions to request.                                                                                                                                                              | `openid profile email` |
| `AUTH_<PROVIDER>_ISSUER_URL`                | OpenID `.well-known` discovery document URL of the external service.                                                                                                                                                 | --                     |
| `AUTH_<PROVIDER>_IDENTIFIER_KEY`            | User profile identifier key <sup>[1]</sup>.                                                                                                                                                                          | `sub`<sup>[2]</sup>    |
| `AUTH_<PROVIDER>_ALLOW_PUBLIC_REGISTRATION` | Automatically create accounts for authenticating users.                                                                                                                                                              | `false`                |
| `AUTH_<PROVIDER>_REQUIRE_VERIFIED_EMAIL`    | Require created users to have a verified email address.                                                                                                                                                              | `false`                |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`           | A Directus role ID to assign created users.                                                                                                                                                                          | --                     |
| `AUTH_<PROVIDER>_SYNC_USER_INFO`            | Set user's first name, last name and email from provider's user info on each login.                                                                                                                                  | `false`                |
| `AUTH_<PROVIDER>_ICON`                      | SVG icon to display with the login link. [See options here](/user-guide/overview/glossary#icons).                                                                                                                    | `account_circle`       |
| `AUTH_<PROVIDER>_LABEL`                     | Text to be presented on SSO button within App.                                                                                                                                                                       | `<PROVIDER>`           |
| `AUTH_<PROVIDER>_PARAMS`                    | Custom query parameters applied to the authorization URL.                                                                                                                                                            | --                     |
| `AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST`       | A comma-separated list of external URLs (including paths) allowed for redirecting after successful login.                                                                                                            | --                     |
| `AUTH_<PROVIDER>_ROLE_MAPPING`              | A JSON object in the form of `{ "openid_group_name": "directus_role_id" }` that you can use to map OpenID groups to Directus roles <sup>[3]</sup>. If not specified, falls back to `AUTH_<PROVIDER>_DEFAULT_ROLE_ID` | --                     |
| `AUTH_<PROVIDER>_GROUP_CLAIM_NAME`          | The name of the OIDC claim that contains your user's groups.                                                                                                                                                         | `groups`               |

<sup>[1]</sup> When authenticating, Directus will match the identifier value from the external user profile to a
Directus users "External Identifier".

<sup>[2]</sup> `sub` represents a unique user identifier defined by the OpenID provider. For users not relying on
`PUBLIC_REGISTRATION` it is recommended to use a human-readable identifier, such as `email`.

<sup>[3]</sup> As directus only allows one role per user, evaluating stops after the first match. An OpenID user that is
member of both e.g. developer and admin groups may be assigned different roles depending on the order that you specify
your role-mapping in: In the following example said OpenID user will be assigned the role `directus_developer_role_id`

```
AUTH_<PROVIDER>_ROLE_MAPPING: json:{ "developer": "directus_developer_role_id", "admin": "directus_admin_role_id" }"
```

Whereas in the following example the OpenID user will be assigned the role `directus_admin_role_id`

```
AUTH_<PROVIDER>_ROLE_MAPPING: json:{ "admin": "directus_admin_role_id", "developer": "directus_developer_role_id" }"
```

### LDAP (`ldap`)

LDAP allows Active Directory users to authenticate and use Directus without having to be manually configured. User
information and roles will be assigned from Active Directory.

| Variable                                 | Description                                                                         | Default Value |
| ---------------------------------------- | ----------------------------------------------------------------------------------- | ------------- |
| `AUTH_<PROVIDER>_CLIENT_URL`             | LDAP connection URL.                                                                | --            |
| `AUTH_<PROVIDER>_BIND_DN`                | Bind user <sup>[1]</sup> distinguished name.                                        | --            |
| `AUTH_<PROVIDER>_BIND_PASSWORD`          | Bind user password.                                                                 | --            |
| `AUTH_<PROVIDER>_USER_DN`                | Directory path containing users.                                                    | --            |
| `AUTH_<PROVIDER>_USER_ATTRIBUTE`         | Attribute to identify the user.                                                     | `cn`          |
| `AUTH_<PROVIDER>_USER_SCOPE`             | Scope of the user search, either `base`, `one`, `sub` <sup>[2]</sup>.               | `one`         |
| `AUTH_<PROVIDER>_MAIL_ATTRIBUTE`         | User email attribute.                                                               | `mail`        |
| `AUTH_<PROVIDER>_FIRST_NAME_ATTRIBUTE`   | User first name attribute.                                                          | `givenName`   |
| `AUTH_<PROVIDER>_LAST_NAME_ATTRIBUTE`    | User last name attribute.                                                           | `sn`          |
| `AUTH_<PROVIDER>_GROUP_DN`<sup>[3]</sup> | Directory path containing groups.                                                   | --            |
| `AUTH_<PROVIDER>_GROUP_ATTRIBUTE`        | Attribute to identify user as a member of a group.                                  | `member`      |
| `AUTH_<PROVIDER>_GROUP_SCOPE`            | Scope of the group search, either `base`, `one`, `sub` <sup>[2]</sup>.              | `one`         |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`        | A fallback Directus role ID to assign created users.                                | --            |
| `AUTH_<PROVIDER>_SYNC_USER_INFO`         | Set user's first name, last name and email from provider's user info on each login. | `false`       |

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

| Variable                                    | Description                                                                                               | Default Value                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `AUTH_<PROVIDER>_SP_metadata`               | String containing XML metadata for service provider                                                       | --                                                                     |
| `AUTH_<PROVIDER>_IDP_metadata`              | String containing XML metadata for identity provider                                                      | --                                                                     |
| `AUTH_<PROVIDER>_ALLOW_PUBLIC_REGISTRATION` | Automatically create accounts for authenticating users.                                                   | `false`                                                                |
| `AUTH_<PROVIDER>_DEFAULT_ROLE_ID`           | A Directus role ID to assign created users.                                                               | --                                                                     |
| `AUTH_<PROVIDER>_IDENTIFIER_KEY`            | User profile identifier key <sup>[1]</sup>.                                                               | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier` |
| `AUTH_<PROVIDER>_EMAIL_KEY`                 | User profile email key.                                                                                   | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`   |
| `AUTH_<PROVIDER>_GIVEN_NAME_KEY`            | User first name attribute.                                                                                | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname`      |
| `AUTH_<PROVIDER>_FAMILY_NAME_KEY`           | User last name attribute.                                                                                 | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname`        |
| `AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST`       | A comma-separated list of external URLs (including paths) allowed for redirecting after successful login. | --                                                                     |

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

| Variable                      | Description                                                                                                      | Default Value |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------- |
| `FLOWS_ENV_ALLOW_LIST`        | A comma-separated list of environment variables.                                                                 | `false`       |
| `FLOWS_RUN_SCRIPT_MAX_MEMORY` | The maximum amount of memory the 'Run Script'-Operation can allocate in megabytes. A minimum of 8MB is required. | `32`          |
| `FLOWS_RUN_SCRIPT_TIMEOUT`    | The maximum duration the 'Run Script'-Operation can run for in milliseconds.                                     | `10000`       |

::: tip Usage in Flows Run Script Operation

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

| Variable                               | Description                                                                    | Default Value  |
| -------------------------------------- | ------------------------------------------------------------------------------ | -------------- |
| `EXTENSIONS_PATH`<sup>[1]</sup>        | Path to your local extensions folder.                                          | `./extensions` |
| `EXTENSIONS_MUST_LOAD`                 | Exit the server when any API extension fails to load.                          | `false`        |
| `EXTENSIONS_AUTO_RELOAD`<sup>[2]</sup> | Automatically reload extensions when they have changed.                        | `false`        |
| `EXTENSIONS_CACHE_TTL`<sup>[3]</sup>   | How long custom app Extensions get cached by browsers.                         | --             |
| `EXTENSIONS_LOCATION`<sup>[4]</sup>    | What configured storage location to use for extensions.                        | --             |
| `EXTENSIONS_LIMIT`                     | Maximum number of extensions you allow to be installed through the marketplace |                |

<sup>[1]</sup> If `EXTENSIONS_LOCATION` is configured, this is the path to the extensions folder within the selected
storage location.

<sup>[2]</sup> `EXTENSIONS_AUTO_RELOAD` will not work when the `EXTENSION_LOCATION` environment variable is set.

<sup>[3]</sup> The `EXTENSIONS_CACHE_TTL` environment variable controls for how long custom app extensions (e.t.,
interface, display, layout, module, panel) are cached by browsers. Caching can speed-up the loading of the app as the
code for the extensions doesn't need to be re-fetched from the server on each app reload. On the other hand, this means
that code changes to app extensions won't be taken into account by the browser until `EXTENSIONS_CACHE_TTL` has expired.
By default, extensions are not cached. The input data type for this environment variable is the same as
[`CACHE_TTL`](#cache).

<sup>[4]</sup> By default extensions are loaded from the local file system. `EXTENSIONS_LOCATION` can be used to load
extensions from a storage location instead. Under the hood, they are synced into a local directory within
[`TEMP_PATH`](#general) and then loaded from there.

## Marketplace

| Variable               | Description                                       | Default Value                  |
| ---------------------- | ------------------------------------------------- | ------------------------------ |
| `MARKETPLACE_TRUST`    | One of `sandbox`, `all`                           | `sandbox`                      |
| `MARKETPLACE_REGISTRY` | The registry to use for the Directus Marketplace. | `https://registry.directus.io` |

## Synchronization

| Variable                    | Description                            | Default Value   |
| --------------------------- | -------------------------------------- | --------------- |
| `SYNCHRONIZATION_STORE`     | One of `memory`, `redis`<sup>[1]</sup> | `memory`        |
| `SYNCHRONIZATION_NAMESPACE` | How to scope the channels in Redis     | `directus-sync` |

## Email

| Variable               | Description                                                              | Default Value          |
| ---------------------- | ------------------------------------------------------------------------ | ---------------------- |
| `EMAIL_VERIFY_SETUP`   | Check if email setup is properly configured.                             | `true`                 |
| `EMAIL_FROM`           | Email address from which emails are sent.                                | `no-reply@example.com` |
| `EMAIL_TRANSPORT`      | What to use to send emails. One of `sendmail`, `smtp`, `mailgun`, `ses`. | `sendmail`             |
| `EMAIL_TEMPLATES_PATH` | Where custom templates are located                                       | `./templates`          |

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
| `EMAIL_SMTP_SECURE`     | Enable initial TLS   | --            |
| `EMAIL_SMTP_IGNORE_TLS` | Ignore STARTTLS      | --            |
| `EMAIL_SMTP_NAME`       | SMTP client hostname | --            |

For more details about these options, see the
[SMTP configuration documentation for Nodemailer](https://nodemailer.com/smtp/#general-options), which Directus uses
under the hood.

### Mailgun (`mailgun`)

| Variable                | Description                                                                       | Default Value     |
| ----------------------- | --------------------------------------------------------------------------------- | ----------------- |
| `EMAIL_MAILGUN_API_KEY` | Your Mailgun API key.                                                             | --                |
| `EMAIL_MAILGUN_DOMAIN`  | A domain from [your Mailgun account](https://app.mailgun.com/app/sending/domains) | --                |
| `EMAIL_MAILGUN_HOST`    | Allows you to specify a custom host.                                              | `api.mailgun.net` |

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
| `ADMIN_TOKEN`    | The API token of the first user that's automatically created when using `directus bootstrap`.     | --            |

## Telemetry

To more accurately gauge the frequency of installation, version fragmentation, and general size of the user base,
Directus collects little and anonymized data about your environment.

| Variable                  | Description                                                       | Default Value                    |
| ------------------------- | ----------------------------------------------------------------- | -------------------------------- |
| `TELEMETRY`               | Allow Directus to collect anonymized data about your environment. | `true`                           |
| `TELEMETRY_URL`           | URL that the usage report is submitted to.                        | `https://telemetry.directus.io/` |
| `TELEMETRY_AUTHORIZATION` | Optional authorization header value.                              | --                               |

## Metrics

To enable performance and error measurement of connected services, Directus can provide Prometheus metrics.

| Variable           | Description                                                                                                             | Default Value                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `METRICS_ENABLED`  | Whether or not to enable metrics.                                                                                       | `false`                        |
| `METRICS_SCHEDULE` | The cron schedule at which to generate the metrics, the default is every minute                                         | `*/1 * * * *`                  |
| `METRICS_TOKENS`   | A CSV of tokens to allow access to via a `Authorization: Metrics <token>` header. By default it is restricted to admins | --                             |
| `METRICS_SERVICES` | A CSV of directus services to observe metrics for. Currently `database`, `cache`, `redis` and `storage` are supported   | `database,cache,redis,storage` |

::: warning Metric Aggregation

If Directus is running within a PM2 context, then metrics will be aggregated on a per scheduled job frequency. Ensure
Prometheus' scrape frequency takes that into account.

:::

## Limits & Optimizations

Allows you to configure hard technical limits, to prevent abuse and optimize for your particular server environment.

| Variable                    | Description                                                                                                                     | Default Value |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `RELATIONAL_BATCH_SIZE`     | How many rows are read into memory at a time when constructing nested relational datasets                                       | 25000         |
| `EXPORT_BATCH_SIZE`         | How many rows are read into memory at a time when constructing exports                                                          | 5000          |
| `USERS_ADMIN_ACCESS_LIMIT`  | How many active users with admin privilege are allowed                                                                          | `Infinity`    |
| `USERS_APP_ACCESS_LIMIT`    | How many active users with access to the Data Studio are allowed                                                                | `Infinity`    |
| `USERS_API_ACCESS_LIMIT`    | How many active API access users are allowed                                                                                    | `Infinity`    |
| `GRAPHQL_QUERY_TOKEN_LIMIT` | How many GraphQL query tokens will be parsed. [More details here](https://graphql-js.org/api/interface/parseoptions/#maxTokens) | 5000          |

## WebSockets

| Variable                                    | Description                                                                                                                      | Default Value |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `WEBSOCKETS_ENABLED`                        | Whether or not to enable all WebSocket functionality.                                                                            | `false`       |
| `WEBSOCKETS_HEARTBEAT_ENABLED`              | Whether or not to enable the heartbeat ping signal.                                                                              | `true`        |
| `WEBSOCKETS_HEARTBEAT_PERIOD`<sup>[1]</sup> | The period in seconds at which to send the ping. This period doubles as the timeout used for closing an unresponsive connection. | 30            |

<sup>[1]</sup> It's recommended to keep this value between 30 and 120 seconds, otherwise the connections could be
considered idle by other parties and therefore terminated. See
https://websockets.readthedocs.io/en/stable/topics/timeouts.html.

### REST

| Variable                       | Description                                                                                                                                                                                             | Default Value |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `WEBSOCKETS_REST_ENABLED`      | Whether or not to enable the REST message handlers.                                                                                                                                                     | `true`        |
| `WEBSOCKETS_REST_PATH`         | The URL path at which the WebSocket REST endpoint will be available.                                                                                                                                    | `/websocket`  |
| `WEBSOCKETS_REST_CONN_LIMIT`   | How many simultaneous connections are allowed.                                                                                                                                                          | `Infinity`    |
| `WEBSOCKETS_REST_AUTH`         | The method of authentication to require for this connection. One of `public`, `handshake` or `strict`. Refer to the [authentication guide](/guides/real-time/authentication.html) for more information. | `handshake`   |
| `WEBSOCKETS_REST_AUTH_TIMEOUT` | The amount of time in seconds to wait before closing an unauthenticated connection.                                                                                                                     | 30            |

### GraphQL

| Variable                          | Description                                                                                                                                                                                             | Default Value |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `WEBSOCKETS_GRAPHQL_ENABLED`      | Whether or not to enable the GraphQL Subscriptions.                                                                                                                                                     | `true`        |
| `WEBSOCKETS_GRAPHQL_PATH`         | The URL path at which the WebSocket GraphQL endpoint will be available.                                                                                                                                 | `/graphql`    |
| `WEBSOCKETS_GRAPHQL_CONN_LIMIT`   | How many simultaneous connections are allowed.                                                                                                                                                          | `Infinity`    |
| `WEBSOCKETS_GRAPHQL_AUTH`         | The method of authentication to require for this connection. One of `public`, `handshake` or `strict`. Refer to the [authentication guide](/guides/real-time/authentication.html) for more information. | `handshake`   |
| `WEBSOCKETS_GRAPHQL_AUTH_TIMEOUT` | The amount of time in seconds to wait before closing an unauthenticated connection.                                                                                                                     | 30            |

### Logs

The WebSocket Logs endpoint is accessible at `/websocket/logs`. The method of authentication is limited to `strict` and
the connection will be disconnected when the authentication expires. Refer to the
[authentication guide](/guides/real-time/authentication.html) for more information.

| Variable                     | Description                                                                                            | Default Value |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| `WEBSOCKETS_LOGS_ENABLED`    | Whether or not to enable the Logs Subscriptions.                                                       | `true`        |
| `WEBSOCKETS_LOGS_LEVEL`      | What level of detail to stream. One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`. | `info`        |
| `WEBSOCKETS_LOGS_STYLE`      | Stream just the message (pretty) or the full JSON log. One of `pretty`, `raw`.                         | `pretty`      |
| `WEBSOCKETS_LOGS_CONN_LIMIT` | How many simultaneous connections are allowed.                                                         | `Infinity`    |

---

## PM2

::: warning Requirements

These environment variables only exist when you're using the official Docker Container, or are using the provided
[`ecosystem.config.cjs`](https://github.com/directus/directus/blob/main/ecosystem.config.cjs) file with `pm2` directly.

:::

For more information on what these options do, please refer to
[the `pm2` documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/).

| Variable                      | Description                                                        | Default                                      |
| ----------------------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| `PM2_INSTANCES`<sup>[1]</sup> | Number of app instance to be launched                              | `1`                                          |
| `PM2_EXEC_MODE`               | One of `fork`, `cluster`                                           | `'cluster'`                                  |
| `PM2_MAX_MEMORY_RESTART`      | App will be restarted if it exceeds the amount of memory specified | —                                            |
| `PM2_MIN_UPTIME`              | Min uptime of the app to be considered started                     | —                                            |
| `PM2_LISTEN_TIMEOUT`          | Time in ms before forcing a reload if app not listening            | —                                            |
| `PM2_KILL_TIMEOUT`            | Time in milliseconds before sending a final SIGKILL                | —                                            |
| `PM2_MAX_RESTARTS`            | Number of failed restarts before the process is killed             | —                                            |
| `PM2_RESTART_DELAY`           | Time to wait before restarting a crashed app                       | `0`                                          |
| `PM2_AUTO_RESTART`            | Automatically restart Directus if it crashes unexpectedly          | `false`                                      |
| `PM2_LOG_ERROR_FILE`          | Error file path                                                    | `$HOME/.pm2/logs/<app name>-error-<pid>.log` |
| `PM2_LOG_OUT_FILE`            | Output file path                                                   | `$HOME/.pm2/logs/<app name>-out-<pid>.log`   |

<sup>[1]</sup> [Redis](#redis) is required in case of multiple instances.
