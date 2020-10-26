# Environment Variables

> Each Directus project supports a number of environment variables for configuration. These variables are added to the `/api/.env` file, with an example file at `/api/example.env` for easier boilerplate setup.


## General

### `PORT`

What port to run the API under.<br>**Default: `8055`**

### `PUBLIC_URL`

URL where your API can be reached on the web.<br>**Default: `/`**

### `LOG_LEVEL`

What level of detail to log. One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`.<br>**Default: `info`**

### `LOG_STYLE`

Render the logs human readable (pretty) or as JSON. One of `pretty`, `raw`.<br>**Default: `pretty`**


## Database

### `DB_CLIENT`

What database client to use. One of `pg`, `mysql`, `mysql2`, `oracledb`, `mssql`, or `sqlite3`. For all database clients except SQLite, you will also need to configure the following variables:

### `DB_HOST`

Database host. Required when using `pg`, `mysql`, `mysql2`, `oracledb`, or `mssql`.

### `DB_PORT`

Database port. Required when using `pg`, `mysql`, `mysql2`, `oracledb`, or `mssql`.

### `DB_DATABASE`

Database name. Required when using `pg`, `mysql`, `mysql2`, `oracledb`, or `mssql`.

### `DB_USER`

Database user. Required when using `pg`, `mysql`, `mysql2`, `oracledb`, or `mssql`.

### `DB_PASSWORD`

Database user's password. Required when using `pg`, `mysql`, `mysql2`, `oracledb`, or `mssql`.

### `DB_FILENAME` (SQLite Only)

Where to read/write the SQLite database. Required when using `sqlite3`.

::: Additional Database Variables
All `DB_*` environment variables are passed to the `connection` configuration of a [`Knex` instance](http://knexjs.org).
Based on your project's needs, you can extend the `DB_*` environment variables with any config you need to pass to the database instance.
:::


## Security

### `KEY`

Unique identifier for the project.

### `SECRET`

Secret string for the project. Generated on installation.

### `ACCESS_TOKEN_TTL`

The duration that the access token is valid.<br>**Default: `15m`**

### `REFRESH_TOKEN_TTL`

The duration that the refresh token is valid, and also how long users stay logged-in to the App.<br>**Default: `7d`**

### `REFRESH_TOKEN_COOKIE_SECURE`

Whether or not to use a secure cookie for the refresh token in cookie mode.<br>**Default: `false`**

### `REFRESH_TOKEN_COOKIE_SAME_SITE`

Value for `sameSite` in the refresh token cookie when in cookie mode.<br>**Default: `lax`**


## CORS

### `CORS_ENABLED`

Whether or not to enable the CORS headers.<br>**Default: `true`**

### `CORS_METHODS`

Value for the `Access-Control-Allow-Methods` header.<br>**Default: `GET,POST,PATCH,DELETE`**

### `CORS_ALLOWED_HEADERS`

Value for the `Access-Control-Allow-Headers` header.<br>**Default: `Content-Type,Authorization`**

### `CORS_EXPOSED_HEADERS`

Value for the `Access-Control-Expose-Headers` header.<br>**Default: `Content-Range`**

### `CORS_CREDENTIALS`

Whether or not to send the `Access-Control-Allow-Credentials` header.<br>**Default: `true`**

### `CORS_MAX_AGE`

Value for the `Access-Control-Max-Age` header.<br>**Default: `18000`**


## Rate Limiting

### `RATE_LIMITER_ENABLED`

Whether or not to enable rate limiting on the API.<br>**Default: `false`**

### `RATE_LIMITER_POINTS`

The amount of allowed hits per duration.<br>**Default: `50`**

### `RATE_LIMITER_DURATION`

The time window in seconds in which the points are counted.<br>**Default: `1`**

### `RATE_LIMITER_STORE`

Where to store the rate limiter counts. Either `memory`, `redis`, or `memcache`. Based on the rate limiter used, you must also provide the following configurations.<br>**Default: `memory`**

* **Memory**
	* No additional configuration required
* **Redis**
	* **`RATE_LIMITER_REDIS`** — Redis connection string
		* eg: `redis://:authpassword@127.0.0.1:6380/4`
	* Alternatively, you can enter individual connection parameters:
		* **`RATE_LIMITER_REDIS_HOST`**
		* **`RATE_LIMITER_REDIS_PORT`**
		* **`RATE_LIMITER_REDIS_PASSWORD`**
		* **`RATE_LIMITER_REDIS_DB`**
* **Memcache**
	* **`RATE_LIMITER_MEMCACHE`** — Location of your memcache instance

::: Additional Rate Limiter Variables
All `RATE_LIMITER_*` variables are passed directly to a `rate-limiter-flexible` instance. Depending on your
project's needs, you can extend the above environment variables to configure any of [the `rate-limiter-flexible` options](https://github.com/animir/node-rate-limiter-flexible/wiki/Options).
:::


## Cache

### `CACHE_ENABLED`

Whether or not caching is enabled.<br>**Default: `false`**

### `CACHE_TTL`

How long the cache is persisted.<br>**Default: `30m`**

:::warning Forced Flush
Regardless of TTL, the cache is always flushed for every create, update, and delete action.
:::

### `CACHE_NAMESPACE`

How to scope the cache data.<br>**Default: `directus-cache`**

### `CACHE_STORE`

Where to store the cache data. Either `memory`, `redis`, or `memcache`. Based on the cache used, you must also provide the following configurations.<br>**Default: `memory`**

* **Memory**
	* No additional configuration required
* **Redis**
	* **`CACHE_REDIS`** — Redis connection string
		* eg: `redis://:authpassword@127.0.0.1:6380/4`
	* Alternatively, you can enter individual connection parameters:
		* **`CACHE_REDIS_HOST`**
		* **`CACHE_REDIS_PORT`**
		* **`CACHE_REDIS_PASSWORD`**
		* **`CACHE_REDIS_DB`**
* **Memcache**
	* **`CACHE_MEMCACHE`** — Location of your memcache instance


## File Storage

### `STORAGE_LOCATIONS`

A CSV of storage locations (eg: `local,digitalocean,amazon`) to use. You can use any names you'd like for these keys, but each must have a matching `<LOCATION>` configuration.<br>**Default: `local`**

For each of the storage locations listed, you must provide the following configuration:

* **`STORAGE_<LOCATION>_PUBLIC_URL`** — Location on the internet where the files are accessible
* **`STORAGE_<LOCATION>_DRIVER`** — Which driver to use, either `local`, `s3`, or `gcl`

Based on your configured driver, you must also provide the following configurations.

* **Local**
	* `STORAGE_<LOCATION>_ROOT` — Where to store the files on disk
* **S3**
	* **`STORAGE_<LOCATION>_KEY`** — User key
	* **`STORAGE_<LOCATION>_SECRET`** — User secret
	* **`STORAGE_<LOCATION>_ENDPOINT`** — S3 Endpoint
	* **`STORAGE_<LOCATION>_BUCKET`** — S3 Bucket
	* **`STORAGE_<LOCATION>_REGION`** — S3 Region
* **Google Cloud**
	* **`STORAGE_<LOCATION>_KEY_FILENAME`** — Path to key file on disk
	* **`STORAGE_<LOCATION>_BUCKET`** — Google Cloud Storage bucket


## External Auth

### `AUTH_PROVIDERS`

CSV of auth providers you want to use. For each of the auth providers you list, you must also provide the following configurations.

* **`AUTH_<PROVIDER>_DRIVER`** — What auth driver to use. One of `oauth2`, `oidc`

When using `oauth` as a storage driver, you also need to provide the following configurations:

* **`AUTH_<PROVIDER>_KEY`** — oAuth key for the external service
* **`AUTH_<PROVIDER>_SECRET`** — oAuth secret for the external service.

When using `oidc` as a storage driver, you also need to provide the following configurations:

@TODO

## Extensions

### `EXTENSIONS_PATH`

Path to your local extensions folder.<br>**Default: `./extensions`**


## Email

### `EMAIL_FROM`

Email address from which emails are sent.<br>**Default: `no-reply@directus.io`**

### `EMAIL_TRANSPORT`

What to use to send emails. One of `sendmail`, `smtp`. Based on the transport used, you must also provide the following configurations.<br>**Default: `sendmail`**

* **Sendmail** (`sendgrid`)
	* **`EMAIL_SENDMAIL_NEW_LINE`** — What new line style to use in sendmail. **Default: `unix`**
	* **`EMAIL_SENDMAIL_PATH`** — Path to your sendmail executable. **Default: `/usr/sbin/sendmail`**
* **SMTP** (`smtp`)
	* **`EMAIL_SMTP_HOST`** — SMTP Host
	* **`EMAIL_SMTP_PORT`** — SMTP Port
	* **`EMAIL_SMTP_USER`** — SMTP User
	* **`EMAIL_SMTP_PASSWORD`** — SMTP Password
	* **`EMAIL_SMTP_POOL`** — Use SMTP pooling
	* **`EMAIL_SMTP_SECURE`** — Enable TLS
