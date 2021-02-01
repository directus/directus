# Environment Variables

> Each Directus project supports a number of environment variables for configuration. These variables are added to the
> `/api/.env` file, with an example file at `/api/example.env` for easier boilerplate setup.

## General

### `PORT`

What port to run the API under.<br>**Default: `8055`**

### `PUBLIC_URL`

URL where your API can be reached on the web.<br>**Default: `/`**

### `LOG_LEVEL`

What level of detail to log. One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`.<br>**Default:
`info`**

### `LOG_STYLE`

Render the logs human readable (pretty) or as JSON. One of `pretty`, `raw`.<br>**Default: `pretty`**

## Database

### `DB_CLIENT`

What database client to use. One of `pg` or `postgres`, `mysql`, `mysql2`, `oracledb`, `mssql`, or `sqlite3`. For all
database clients except SQLite, you will also need to configure the following variables:

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

<!-- prettier-ignore-start -->
::: tip Additional Database Variables
All `DB_*` environment variables are passed to the `connection`
configuration of a [`Knex` instance](http://knexjs.org). Based on your project's needs, you can
extend the `DB_*` environment variables with any config you need to pass to the database instance.
:::
<!-- prettier-ignore-end -->

### `DB_CONNECTION_STRING` (Postgres Only)

When using Postgres, you can submit a connection string instead of individual properties. Using this will ignore any of
the other connection settings.

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

### `CORS_ORIGIN`

Value for the `Access-Control-Allow-Origin` header. Possible values:

- `true` - reflect the Origin header
- String - set the origin to a specific domain
- CSV - multiple domains

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

Where to store the rate limiter counts. Either `memory`, `redis`, or `memcache`. Based on the rate limiter used, you
must also provide the following configurations.<br>**Default: `memory`**

- **Memory**
  - No additional configuration required
- **Redis**
  - **`RATE_LIMITER_REDIS`** — Redis connection string
    - eg: `redis://:authpassword@127.0.0.1:6380/4`
  - Alternatively, you can enter individual connection parameters:
    - **`RATE_LIMITER_REDIS_HOST`**
    - **`RATE_LIMITER_REDIS_PORT`**
    - **`RATE_LIMITER_REDIS_PASSWORD`**
    - **`RATE_LIMITER_REDIS_DB`**
- **Memcache**
  - **`RATE_LIMITER_MEMCACHE`** — Location of your memcache instance

<!-- prettier-ignore-start -->
::: tip Additional Rate Limiter Variables All `RATE_LIMITER_*` variables are passed directly to a
`rate-limiter-flexible` instance. Depending on your project's needs, you can extend the above
environment variables to configure any of
[the `rate-limiter-flexible` options](https://github.com/animir/node-rate-limiter-flexible/wiki/Options).
:::
<!-- prettier-ignore-end -->

## Cache

### `CACHE_ENABLED`

Whether or not caching is enabled.<br>**Default: `false`**

### `CACHE_TTL`

How long the cache is persisted.<br>**Default: `30m`**

<!-- prettier-ignore-start -->
::: warning Forced Flush
Regardless of TTL, the cache is always flushed for every create, update, and
delete action.
:::
<!-- prettier-ignore-end -->

### `CACHE_NAMESPACE`

How to scope the cache data.<br>**Default: `directus-cache`**

### `CACHE_STORE`

Where to store the cache data. Either `memory`, `redis`, or `memcache`. Based on the cache used, you must also provide
the following configurations.<br>**Default: `memory`**

- **Memory**
  - No additional configuration required
- **Redis**
  - **`CACHE_REDIS`** — Redis connection string
    - eg: `redis://:authpassword@127.0.0.1:6380/4`
  - Alternatively, you can enter individual connection parameters:
    - **`CACHE_REDIS_HOST`**
    - **`CACHE_REDIS_PORT`**
    - **`CACHE_REDIS_PASSWORD`**
    - **`CACHE_REDIS_DB`**
- **Memcache**
  - **`CACHE_MEMCACHE`** — Location of your memcache instance

### `CACHE_AUTO_PURGE`

Controls whether or not the cache will be auto-purged on create/update/delete actions within the system. Enabling this
feature means that the API will remain real-time, while caching subsequent read calls when no changes have happened.
**Note**: enabling auto-purge will remove the `Cache-Control` header, as the cache can be invalidated at any point.

### `ASSETS_CACHE_TTL`

How long assets will be cached for in the browser. Sets the `max-age` value of the `Cache-Control` header.

## File Storage

### `STORAGE_LOCATIONS`

A CSV of storage locations (eg: `local,digitalocean,amazon`) to use. You can use any names you'd like for these keys,
but each must have a matching `<LOCATION>` configuration.<br>**Default: `local`**

For each of the storage locations listed, you must provide the following configuration:

- **`STORAGE_<LOCATION>_PUBLIC_URL`** — Location on the internet where the files are accessible
- **`STORAGE_<LOCATION>_DRIVER`** — Which driver to use, either `local`, `s3`, or `gcs`

Based on your configured driver, you must also provide the following configurations.

- **Local**
  - `STORAGE_<LOCATION>_ROOT` — Where to store the files on disk
- **S3**
  - **`STORAGE_<LOCATION>_KEY`** — User key
  - **`STORAGE_<LOCATION>_SECRET`** — User secret
  - **`STORAGE_<LOCATION>_ENDPOINT`** — S3 Endpoint
  - **`STORAGE_<LOCATION>_BUCKET`** — S3 Bucket
  - **`STORAGE_<LOCATION>_REGION`** — S3 Region
- **Google Cloud**
  - **`STORAGE_<LOCATION>_KEY_FILENAME`** — Path to key file on disk
  - **`STORAGE_<LOCATION>_BUCKET`** — Google Cloud Storage bucket

## oAuth

### `OAUTH_PROVIDERS`

CSV of oAuth providers you want to use. For each of the oAuth providers you list, you must also provide 
a number of extra variables. The exact configuration is going to be provider dependant, so please check the 
provider's reference documentation.

- **`OAUTH_<PROVIDER>_KEY`** — oAuth key (a.k.a. application id) for the external service.
- **`OAUTH_<PROVIDER>_SECRET`** — oAuth secret for the external service.
- **`OAUTH_<PROVIDER>_SCOPE`** — A white-space separated list of privileges directus should ask for. 
A very common value is: `openid email`.
- **`OAUTH_<PROVIDER>_ACCESS_URL`** — The provider's oAuth *authorization endpoint*. 
- **`OAUTH_<PROVIDER>_AUTHORIZE_URL`** — The provider's oAuth *token endpoint*.

**`OAUTH_<PROVIDER>_ACCESS_URL`** and **`OAUTH_<PROVIDER>_AUTHORIZE_URL`** will be only necessary
to access data from a particular tenant (e.g. a particular instance/domain of G-Suite or MS Office 365).

For a complete list of supported providers please see the [grant library](https://www.npmjs.com/package/grant).

#### oAuth And Reverse Proxy

In case you are running Directus behind a reverse proxy (e.g. for implementing SSL/TLS) you also need to pay
attention to the configation of the **`PUBLIC_URL`**, or the oAuth provider will be try to reach Directus on 
the its private URL. 

More specifically, the **`PUBLIC_URL`** variable is used to construct the oAuth request's *redirection endpoint*.

#### oAuth Example

Assuming that your providers are Google and Microsoft, that Directus is running behind a proxy, and that Microsoft's 
login is not multi-tenant, then you would need to set the following environment variables:

```
OAUTH_PROVIDERS ="google microsoft"

OAUTH_GOOGLE_KEY = "<google_application_id>"
OAUTH_GOOGLE_SECRET=  "<google_application_secret_key>"
OAUTH_GOOGLE_SCOPE="openid email"

OAUTH_MICROSOFT_KEY = "<microsoft_application_id>"
OAUTH_MICROSOFT_SECRET = "<microsoft_application_secret_key>"
OAUTH_MICROSOFT_SCOPE = "openid email"
OAUTH_MICROSOFT_AUTHORIZE_URL = "https://login.microsoftonline.com/<microsoft_application_id>/oauth2/v2.0/authorize"
OAUTH_MICROSOFT_ACCESS_URL = "https://login.microsoftonline.com/<microsoft_application_id>/oauth2/v2.0/token"

PUBLIC_URL = "<public_url_of_directus_instance>"
```

## Extensions

### `EXTENSIONS_PATH`

Path to your local extensions folder.<br>**Default: `./extensions`**

## Email

### `EMAIL_FROM`

Email address from which emails are sent.<br>**Default: `no-reply@directus.io`**

### `EMAIL_TRANSPORT`

What to use to send emails. One of `sendmail`, `smtp`. Based on the transport used, you must also provide the following
configurations.<br>**Default: `sendmail`**

- **Sendmail** (`sendmail`)
  - **`EMAIL_SENDMAIL_NEW_LINE`** — What new line style to use in sendmail. **Default: `unix`**
  - **`EMAIL_SENDMAIL_PATH`** — Path to your sendmail executable. **Default: `/usr/sbin/sendmail`**
- **SMTP** (`smtp`)
  - **`EMAIL_SMTP_HOST`** — SMTP Host
  - **`EMAIL_SMTP_PORT`** — SMTP Port
  - **`EMAIL_SMTP_USER`** — SMTP User
  - **`EMAIL_SMTP_PASSWORD`** — SMTP Password
  - **`EMAIL_SMTP_POOL`** — Use SMTP pooling
  - **`EMAIL_SMTP_SECURE`** — Enable TLS

## Misc.

If you're relying on Docker and/or the `directus bootstrap` CLI command, you can pass the following two environment
variables to automatically configure the first user:

### `ADMIN_EMAIL`

The email address of the first user that's automatically created when using `directus bootstrap`. Defaults to
`admin@example.com`

### `ADMIN_PASSWORD`

The password of the first user that's automatically created when using `directus bootstrap`. Defaults to a random string
of 12 characters.
