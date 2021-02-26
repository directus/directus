# Environment Variables

> Environment Variables are used for all configuration within Directus projects. They are managed in the root `.env`
> file, which is created during the installation process.

[[toc]]

## General

| Variable           | Description                                                                                         | Default Value |
| ------------------ | --------------------------------------------------------------------------------------------------- | ------------- |
| `CONFIG_PATH`      | Where your config file is located. See [Config Files](/reference/config-files/)                     | `.env`        |
| `PORT`             | What port to run the API under.                                                                     | `8055`        |
| `PUBLIC_URL`       | URL where your API can be reached on the web.                                                       | `/`           |
| `LOG_LEVEL`        | What level of detail to log. One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`. | `info`        |
| `LOG_STYLE`        | Render the logs human readable (pretty) or as JSON. One of `pretty`, `raw`.                         | `pretty`      |
| `MAX_PAYLOAD_SIZE` | Controls the maximum request body size. Accepts number of bytes, or human readable string.          | `100kb`       |

## Database

| Variable               | Description                                                                                                                                        | Default Value |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `DB_CLIENT`            | **Required**. What database client to use. One of `pg` or `postgres`, `mysql`, `oracledb`, `mssql`, or `sqlite3`.                                  | --            |
| `DB_HOST`              | Database host. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --            |
| `DB_PORT`              | Database port. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --            |
| `DB_DATABASE`          | Database name. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --            |
| `DB_USER`              | Database user. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                                      | --            |
| `DB_PASSWORD`          | Database user's password. **Required** when using `pg`, `mysql`, `oracledb`, or `mssql`.                                                           | --            |
| `DB_FILENAME`          | Where to read/write the SQLite database. **Required** when using `sqlite3`.                                                                        | --            |
| `DB_CONNECTION_STRING` | When using `pg`, you can submit a connection string instead of individual properties. Using this will ignore any of the other connection settings. | --            |
| `DB_POOL_*`            | Pooling settings. Passed on to [the `tarn.js`](https://github.com/vincit/tarn.js#usage) library.                                                   | --            |

::: tip Additional Database Variables

All `DB_*` environment variables are passed to the `connection` configuration of a [`Knex` instance](http://knexjs.org).
Based on your project's needs, you can extend the `DB_*` environment variables with any config you need to pass to the
database instance.

:::

::: tip Pooling

All the `DB_POOL_` prefixed options are passed [to `tarn.js`](https://github.com/vincit/tarn.js#usage) through
[Knex](http://knexjs.org/#Installation-pooling)

:::

## Security

| Variable                         | Description                                                                                      | Default Value |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ------------- |
| `KEY`                            | Unique identifier for the project.                                                               | --            |
| `SECRET`                         | Secret string for the project.                                                                   | --            |
| `ACCESS_TOKEN_TTL`               | The duration that the access token is valid.                                                     | 15m           |
| `REFRESH_TOKEN_TTL`              | The duration that the refresh token is valid, and also how long users stay logged-in to the App. | 7d            |
| `REFRESH_TOKEN_COOKIE_SECURE`    | Whether or not to use a secure cookie for the refresh token in cookie mode.                      | `false`       |
| `REFRESH_TOKEN_COOKIE_SAME_SITE` | Value for `sameSite` in the refresh token cookie when in cookie mode.                            | `lax`         |

::: tip Cookie Strictness

Browser are pretty strict when it comes to third-party cookies. If you're running into unexpected problems when running
your project and API on different domains, make sure to verify your configuration for `REFRESH_TOKEN_COOKIE_SECURE` and
`REFRESH_TOKEN_COOKIE_SAME_SITE`.

:::

## CORS

| Variable               | Description                                                                                                                                            | Default Value                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `CORS_ENABLED`         | Whether or not to enable the CORS headers.                                                                                                             | `true`                       |
| `CORS_ORIGIN`          | Value for the `Access-Control-Allow-Origin` header. Use `true` to match the Origin header, or provide a domain or a CSV of domains for specific access | `true`                       |
| `CORS_METHODS`         | Value for the `Access-Control-Allow-Methods` header.                                                                                                   | `GET,POST,PATCH,DELETE`      |
| `CORS_ALLOWED_HEADERS` | Value for the `Access-Control-Allow-Headers` header.                                                                                                   | `Content-Type,Authorization` |
| `CORS_EXPOSED_HEADERS` | Value for the `Access-Control-Expose-Headers` header.                                                                                                  | `Content-Range`              |
| `CORS_CREDENTIALS`     | Whether or not to send the `Access-Control-Allow-Credentials` header.                                                                                  | `true`                       |
| `CORS_MAX_AGE`         | Value for the `Access-Control-Max-Age` header.                                                                                                         | `18000`                      |

## Rate Limiting

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

| Variable                | Description                        | Default Value |
| ----------------------- | ---------------------------------- | ------------- |
| `RATE_LIMITER_MEMCACHE` | Location of your memcache instance | ---           |

::: tip Additional Rate Limiter Variables

All `RATE_LIMITER_*` variables are passed directly to a `rate-limiter-flexible` instance. Depending on your project's
needs, you can extend the above environment variables to configure any of
[the `rate-limiter-flexible` options](https://github.com/animir/node-rate-limiter-flexible/wiki/Options).

:::

## Cache

| Variable           | Description                                                                                                | Default Value    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------- |
| `ASSETS_CACHE_TTL` | How long assets will be cached for in the browser. Sets the `max-age` value of the `Cache-Control` header. | `30m`            |
| `CACHE_ENABLED`    | Whether or not caching is enabled.                                                                         | `false`          |
| `CACHE_TTL`        | How long the cache is persisted.                                                                           | `30m`            |
| `CACHE_AUTO_PURGE` | Automatically purge the cache on `create`/`update`/`delete` actions.                                       | `false`          |
| `CACHE_NAMESPACE`  | How to scope the cache data.                                                                               | `directus-cache` |
| `CACHE_STORE`      | Where to store the cache data. Either `memory`, `redis`, or `memcache`.                                    | `memory`         |

Based on the `CACHE_STORE` used, you must also provide the following configurations:

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

| Variable         | Description                        | Default Value |
| ---------------- | ---------------------------------- | ------------- |
| `CACHE_MEMCACHE` | Location of your memcache instance | ---           |

## File Storage

| Variable            | Description                                                                                                           | Default Value |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------- |
| `STORAGE_LOCATIONS` | A CSV of storage locations (eg: `local,digitalocean,amazon`) to use. You can use any names you'd like for these keys. | `local`       |

For each of the storage locations listed, you must provide the following configuration:

| Variable                    | Description                                               | Default Value |
| --------------------------- | --------------------------------------------------------- | ------------- |
| `STORAGE_<LOCATION>_DRIVER` | Which driver to use, either `local`, `s3`, `gcs`, `azure` |               |

Based on your configured driver, you must also provide the following configurations:

### Local (`local`)

| Variable                  | Description                      | Default Value |
| ------------------------- | -------------------------------- | ------------- |
| `STORAGE_<LOCATION>_ROOT` | Where to store the files on disk | --            |

### S3 (`s3`)

| Variable                      | Description | Default Value |
| ----------------------------- | ----------- | ------------- |
| `STORAGE_<LOCATION>_KEY`      | User key    | --            |
| `STORAGE_<LOCATION>_SECRET`   | User secret | --            |
| `STORAGE_<LOCATION>_ENDPOINT` | S3 Endpoint | --            |
| `STORAGE_<LOCATION>_BUCKET`   | S3 Bucket   | --            |
| `STORAGE_<LOCATION>_REGION`   | S3 Region   | --            |

### Azure (`azure`)

| Variable                            | Description                | Default Value |
| ----------------------------------- | -------------------------- | ------------- |
| `STORAGE_<LOCATION>_CONTAINER_NAME` | Azure Storage container    | --            |
| `STORAGE_<LOCATION>_ACCOUNT_NAME`   | Azure Storage account name | --            |
| `STORAGE_<LOCATION>_ACCOUNT_KEY`    | Azure Storage key          | --            |

### Google Cloud Storage (`gcs`)

| Variable                          | Description                 | Default Value |
| --------------------------------- | --------------------------- | ------------- |
| `STORAGE_<LOCATION>_KEY_FILENAME` | Path to key file on disk    | --            |
| `STORAGE_<LOCATION>_BUCKET`       | Google Cloud Storage bucket | --            |

If you don't provide any configuration for storage adapters, Directus will default to the following:

```
STORAGE_LOCATIONS="local"
STORAGE_LOCAL_ROOT="./uploads"
```

## OAuth

| Variable          | Description                             | Default Value |
| ----------------- | --------------------------------------- | ------------- |
| `OAUTH_PROVIDERS` | CSV of oAuth providers you want to use. | --            |

For each of the OAuth providers you list, you must also provide a number of extra variables. These differ per external
service. The following is a list of common required configuration options:

| Variable                         | Description                                                                                            | Default Value |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------- |
| `OAUTH_<PROVIDER>_KEY`           | oAuth key (a.k.a. application id) for the external service.                                            | --            |
| `OAUTH_<PROVIDER>_SECRET`        | oAuth secret for the external service.                                                                 | --            |
| `OAUTH_<PROVIDER>_SCOPE`         | A white-space separated list of privileges directus should ask for. A common value is: `openid email`. | --            |
| `OAUTH_<PROVIDER>_AUTHORIZE_URL` | The authorize page URL of the external service                                                         | --            |
| `OAUTH_<PROVIDER>_ACCESS_URL`    | The access URL of the external service                                                                 | --            |
| `OAUTH_<PROVIDER>_PROFILE_URL`   | Where Directus can fetch the profile information of the authenticated user.                            | --            |

Directus relies on [`grant`](https://www.npmjs.com/package/grant) for the handling of the oAuth flow. Grant includes
[a lot of default values](https://github.com/simov/grant/blob/master/config/oauth.json) for popular services. For
example, if you use `apple` as one of your providers, you only have to specify the key and secret, as Grant has the rest
covered. Checkout [the grant repo](https://github.com/simov/grant) for more information.

## Extensions

| Variable          | Description                           | Default Value  |
| ----------------- | ------------------------------------- | -------------- |
| `EXTENSIONS_PATH` | Path to your local extensions folder. | `./extensions` |

## Email

| Variable          | Description                                            | Default Value          |
| ----------------- | ------------------------------------------------------ | ---------------------- |
| `EMAIL_FROM`      | Email address from which emails are sent.              | `no-reply@directus.io` |
| `EMAIL_TRANSPORT` | What to use to send emails. One of `sendmail`, `smtp`. | `sendmail`             |

Based on the `EMAIL_TRANSPORT` used, you must also provide the following configurations:

### Sendmail (`sendmail`)

| Variable                  | Description                             | Default Value        |
| ------------------------- | --------------------------------------- | -------------------- |
| `EMAIL_SENDMAIL_NEW_LINE` | What new line style to use in sendmail. | `unix`               |
| `EMAIL_SENDMAIL_PATH`     | Path to your sendmail executable.       | `/usr/sbin/sendmail` |

### SMTP (`smtp`)

| Variable              | Description      | Default Value |
| --------------------- | ---------------- | ------------- |
| `EMAIL_SMTP_HOST`     | SMTP Host        | --            |
| `EMAIL_SMTP_PORT`     | SMTP Port        | --            |
| `EMAIL_SMTP_USER`     | SMTP User        | --            |
| `EMAIL_SMTP_PASSWORD` | SMTP Password    | --            |
| `EMAIL_SMTP_POOL`     | Use SMTP pooling | --            |
| `EMAIL_SMTP_SECURE`   | Enable TLS       | --            |

## Misc.

If you're relying on Docker and/or the `directus bootstrap` CLI command, you can pass the following two environment
variables to automatically configure the first user:

| Variable         | Description                                                                                       | Default Value |
| ---------------- | ------------------------------------------------------------------------------------------------- | ------------- |
| `ADMIN_EMAIL`    | The email address of the first user that's automatically created when using `directus bootstrap`. | --            |
| `ADMIN_PASSWORD` | The password of the first user that's automatically created when using `directus bootstrap`.      | --            |

---

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

Directus will attempt to automatically type cast environment variables based on context clues
([see above](#type-casting-and-nesting)). If you have a specific need for a given type, you can tell Directus what type
to use for the given value by prefixing the value with `{type}:`. The following types are available:

| Syntax Prefix | Example                                          | Output                                           |
| ------------- | ------------------------------------------------ | ------------------------------------------------ |
| `string`      | `string:value`                                   | `"value"`                                        |
| `number`      | `number:3306`                                    | `3306`                                           |
| `regex`       | `regex:/\.example\.com$/`                        | `/\.example\.com$/`                              |
| `array`       | `array:https://example.com,https://example2.com` | `["https://example.com","https://example2.com"]` |
