# Project Environment Variables

## General

| Env. Var.    | Description                                                                                        | Default Value |
|--------------|----------------------------------------------------------------------------------------------------|---------------|
| `PORT`       | What port to run the API under                                                                     | 8055          |
| `PUBLIC_URL` | URL where your API can be reached on the web                                                       | `/`           |
| `LOG_LEVEL`  | What level of detail to log. One of `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` | `info`        |
| `LOG_STYLE`  | Render the logs human readable (pretty) or as JSON. One of `pretty`, `raw`.                        | `pretty`      |

---

## Database

| Env. Var.   | Description                                                                                 | Default Value |
|-------------|---------------------------------------------------------------------------------------------|---------------|
| `DB_CLIENT` | What database client to use. One of `pg`, `mysql`, `mysql2`, `sqlite3`, `oracledb`, `mssql` | --            |

Depending on what DB client you use, the config is one of:

### `sqlite3`

| Env. Var.     | Description                             | Default Value |
|---------------|-----------------------------------------|---------------|
| `DB_FILENAME` | Where to read/write the SQLite database | --            |

### `pg`, `mysql`, `mysql2`, `oracledb`, `mssql`

| Env. Var.     | Description              | Default Value |
|---------------|--------------------------|---------------|
| `DB_HOST`     | Database host            | --            |
| `DB_PORT`     | Database port            | --            |
| `DB_DATABASE` | Database name            | --            |
| `DB_USER`     | Database user            | --            |
| `DB_PASSWORD` | Database user's password | --            |

::: tip
All `DB_*` environment variables are passed to the `connection` configuration of a [`Knex` instance](http://knexjs.org).
Based on your exact needs, you can extend the `DB_*` environment variables with any config you need to pass to the database instance.
:::

---

## Security

| Env. Var.                        | Description                                                                | Default Value |
|----------------------------------|----------------------------------------------------------------------------|---------------|
| `KEY`                            | Unique identifier for the current instance                                 | --            |
| `SECRET`                         | Secret string                                                              | --            |
| `ACCESS_TOKEN_TTL`               | The time the access token is valid                                         | `15m`         |
| `REFRESH_TOKEN_TTL`              | The time the refresh token is valid                                        | `7d`          |
| `REFRESH_TOKEN_COOKIE_SECURE`    | Whether or not to use a secure cookie for the refresh token in cookie mode | `false`       |
| `REFRESH_TOKEN_COOKIE_SAME_SITE` | Value for the `sameSite` value in the refresh token cookie in cookie mode  | `lax`         |

::: tip
`REFRESH_TOKEN_TTL` also controls how long a user stays logged in to the app
:::

---

## CORS

| Env. Var.              | Description                                                          | Default Value                |
|------------------------|----------------------------------------------------------------------|------------------------------|
| `CORS_ENABLED`         | Whether or not to enable the CORS headers                            | `true`                       |
| `CORS_METHODS`         | Value for the `Access-Control-Allow-Methods` header                  | `GET,POST,PATCH,DELETE`      |
| `CORS_ALLOWED_HEADERS` | Value for the `Access-Control-Allow-Headers` header                  | `Content-Type,Authorization` |
| `CORS_EXPOSED_HEADERS` | Value for the `Access-Control-Expose-Headers` header                 | `Content-Range`              |
| `CORS_CREDENTIALS`     | Whether or not to send the `Access-Control-Allow-Credentials` header | `true`                       |
| `CORS_MAX_AGE`         | Value for the `Access-Control-Max-Age` header                        | 18000                        |

---

## Rate Limiting

| Env. Var.               | Description                                                                  | Default Value |
|-------------------------|------------------------------------------------------------------------------|---------------|
| `RATE_LIMITER_ENABLED`  | Whether or not to enable rate limiting on the API                            | `false`       |
| `RATE_LIMITER_POINTS`   | The amount of allowed hits per duration                                      | 50            |
| `RATE_LIMITER_DURATION` | The time window in seconds in which the points are counted                   | 1             |
| `RATE_LIMITER_STORE`    | Where to store the rate limiter counts. One of `memory`, `redis`, `memcache` | `memory`      |

::: tip
Every other `RATE_LIMITER_*` environment variable is passed directly to a `rate-limiter-flexible` instance. Depending on your
exact needs, you can extend the above environment variables to configure any of [the `rate-limiter-flexible` options](https://github.com/animir/node-rate-limiter-flexible/wiki/Options)
:::

Based on your used store, you might need to add the following configuration:

### Redis

The connection to Redis can be configured in two ways. As a connection string, or as individual parameters:

#### Connection String

| Env. Var.            | Description                                                                   | Default Value |
|----------------------|-------------------------------------------------------------------------------|---------------|
| `RATE_LIMITER_REDIS` | Redis connection string, for example `redis://:authpassword@127.0.0.1:6380/4` | --            |

#### Individual Connection Parameters

| Env. Var.                     | Description    | Default Value |
|-------------------------------|----------------|---------------|
| `RATE_LIMITER_REDIS_HOST`     | Redis Host     | --            |
| `RATE_LIMITER_REDIS_PORT`     | Redis Port     | --            |
| `RATE_LIMITER_REDIS_PASSWORD` | Redis Password | --            |
| `RATE_LIMITER_REDIS_DB`       | Redis DB       | --            |

### Memcache

| Env. Var.               | Description                        | Default Value |
|-------------------------|------------------------------------|---------------|
| `RATE_LIMITER_MEMCACHE` | Location of your memcache instance | --            |

---

## Cache

| Env. Var.               | Description                                                         | Default Value   |
|-------------------------|---------------------------------------------------------------------|-----------------|
| `CACHE_ENABLED`         | Whether or not caching is enabled                                   | `false`         |
| `CACHE_TTL`<sup>1</sup> | How long the cache is persisted                                     | `30m`           |
| `CACHE_NAMESPACE`       | How to scope the cache data                                         | `directus-cache |
| `CACHE_STORE`           | Where to store the cache data. One of `memory`, `redis`, `memcache` | `memory`        |

<small><sup>1</sup> The cache is flushed on every edit (create/update/delete) regardless of TTL.</small>

Based on your used store, you might need to add the following configuration:

### Redis

The connection to Redis can be configured in two ways. As a connection string, or as individual parameters:

#### Connection String

| Env. Var.            | Description                                                                   | Default Value |
|----------------------|-------------------------------------------------------------------------------|---------------|
| `RATE_LIMITER_REDIS` | Redis connection string, for example `redis://:authpassword@127.0.0.1:6380/4` | --            |

#### Individual Connection Parameters

| Env. Var.                     | Description    | Default Value |
|-------------------------------|----------------|---------------|
| `RATE_LIMITER_REDIS_HOST`     | Redis Host     | --            |
| `RATE_LIMITER_REDIS_PORT`     | Redis Port     | --            |
| `RATE_LIMITER_REDIS_PASSWORD` | Redis Password | --            |
| `RATE_LIMITER_REDIS_DB`       | Redis DB       | --            |

### Memcache

| Env. Var.               | Description                        | Default Value |
|-------------------------|------------------------------------|---------------|
| `RATE_LIMITER_MEMCACHE` | Location of your memcache instance | --            |

---

## File Storage

| Env. Var.           | Description                              | Default Value |
|---------------------|------------------------------------------|---------------|
| `STORAGE_LOCATIONS` | CSV of storage locations you want to use | `local`       |

The names for the individual storage locations is up to you. The value accepts a CSV to enable multiple
storage locations at the same time (for example `STORAGE_LOCATIONS="local,digitalocean,amazon"`).

For each of the storage locations you have listed, you have to provide the following configuration:

| Env. Var.                       | Description                                                   | Default Value |
|---------------------------------|---------------------------------------------------------------|---------------|
| `STORAGE_<LOCATION>_PUBLIC_URL` | Location on the internet where the files are accessible       | --            |
| `STORAGE_<LOCATION>_DRIVER`     | What driver to use for the files. One of `local`, `s3`, `gcl` | --            |

Based on your configured driver, you'll have to add the following configuration:

### `local`

| Env. Var.                 | Description                      | Default Value |
|---------------------------|----------------------------------|---------------|
| `STORAGE_<LOCATION>_ROOT` | Where to store the files on disk | --            |

### `s3`

| Env. Var.                     | Description | Default Value |
|-------------------------------|-------------|---------------|
| `STORAGE_<LOCATION>_KEY`      | User key    | --            |
| `STORAGE_<LOCATION>_SECRET`   | User secret | --            |
| `STORAGE_<LOCATION>_ENDPOINT` | S3 Endpoint | --            |
| `STORAGE_<LOCATION>_BUCKET`   | S3 Bucket   | --            |
| `STORAGE_<LOCATION>_REGION`   | S3 Region   | --            |

### `gcl`

| Env. Var.                         | Description                 | Default Value |
|-----------------------------------|-----------------------------|---------------|
| `STORAGE_<LOCATION>_KEY_FILENAME` | Path to key file on disk    | --            |
| `STORAGE_<LOCATION>_BUCKET`       | Google Cloud Storage bucket | --            |

---

## oAuth

| Env. Var.         | Description                            | Default Value |
|-------------------|----------------------------------------|---------------|
| `OAUTH_PROVIDERS` | CSV of oAuth providers you want to use | --            |

For each of the oAuth providers you have listed, you have to provide the following config:

| Env. Var.                 | Description                           | Default Value |
|---------------------------|---------------------------------------|---------------|
| `OAUTH_<PROVIDER>_KEY`    | oAuth key for the external service    | --            |
| `OAUTH_<PROVIDER>_SECRET` | oAuth secret for the external service | --            |

---

## Extensions

| Env. Var.         | Description                          | Default Value  |
|-------------------|--------------------------------------|----------------|
| `EXTENSIONS_PATH` | Path to your local extensions folder | `./extensions` |

---

## Email

| Env. Var.         | Description                                           | Default Value          |
|-------------------|-------------------------------------------------------|------------------------|
| `EMAIL_FROM`      | Email address from which emails are sent              | `no-reply@directus.io` |
| `EMAIL_TRANSPORT` | What to use to send emails. One of `sendmail`, `smtp` | `sendmail`             |

Based on your used transport, you will have to configure the following:

### `sendmail`

| Env. Var.                 | Description                            | Default Value        |
|---------------------------|----------------------------------------|----------------------|
| `EMAIL_SENDMAIL_NEW_LINE` | What new line style to use in sendmail | `unix`               |
| `EMAIL_SENDMAIL_PATH`     | Path to your sendmail executable       | `/usr/sbin/sendmail` |

### `smtp`

| Env. Var.             | Description      | Default Value |
|-----------------------|------------------|---------------|
| `EMAIL_SMTP_HOST`     | SMTP Host        | --            |
| `EMAIL_SMTP_PORT`     | SMTP Port        | --            |
| `EMAIL_SMTP_USER`     | SMTP User        | --            |
| `EMAIL_SMTP_PASSWORD` | SMTP Password    | --            |
| `EMAIL_SMTP_POOL`     | Use SMTP pooling | --            |
| `EMAIL_SMTP_SECURE`   | Enable TLS       | --            |
