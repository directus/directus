# Configuring the API

[[toc]]

## Cache

Directus has a built-in way to do data-caching. Enabling this will cache the output of the request (based on the current
user and exact query parameters used) into to configured cache storage location. This will drastically improve API
performance, as subsequent requests are served straight from this cache. Enabling cache will also make Directus return
accurate cache-control headers. Depending on your setup, this will further improve performance by caching the request in
middleman servers (like CDNs) and even the browser.

You can enable the data-cache with the `CACHE_ENABLED` environment variable.

### Cache Store

In bigger projects, you most likely don't want to rely on local memory to keep the caches. Instead, you can use the
`CACHE_STORE` environment variable to tell Directus to use either `memcache` or `redis` to store the caches.

```
CACHE_ENABLED="true"

CACHE_STORE="redis"
CACHE_REDIS="redis://@127.0.0.1"
```

### Auto-Purging

Directus can automatically clear the caches whenever a create/update/delete action is performed. This allows you to keep
the Directus API real-time, while still getting the performance benefits on quick subsequent reads.

```
CACHE_AUTO_PURGE="true"
```

### TTL

Based on your project's needs, you might be able to aggressively cache your data, only requiring new data to be fetched
every hour or so. This allows you to squeeze the most performance out of your Directus instance. This can be incredibly
useful for applications where you have a lot of (public) read-access and where updates aren't real-time (for example a
website). `CACHE_TTL` uses [`ms`](https://www.npmjs.com/package/ms) to parse the value, so you configure it using human
readable values (like `2 days`, `7 hrs`, `5m`).

```
CACHE_TTL="1h"
```

### Assets

The cache-control header for the /assets endpoint is separate from the regular data-cache. This is useful as it's often
possible to cache assets for way longer than you would with the actual content.

```
ASSETS_CACHE_TTL="7d"
```

## Auth

#### Multiple Providers

You can configure multiple providers for handling authentication in Directus. This allows for different options when
logging in. To do this, you can provide a CSV of provider names, and provide a config block for each of them:

```
AUTH_PROVIDERS="google,adobe"

AUTH_GOOGLE_DRIVER="openid"
AUTH_GOOGLE_CLIENT_ID="<google_application_id>"
AUTH_GOOGLE_CLIENT_SECRET= "<google_application_secret_key>"
AUTH_GOOGLE_ISSUER_URL="https://accounts.google.com"
AUTH_GOOGLE_ALLOW_PUBLIC_REGISTRATION="true"
AUTH_GOOGLE_DEFAULT_ROLE_ID="<directus_role_id>"
AUTH_GOOGLE_ICON="google"

AUTH_ADOBE_DRIVER="oauth2"
AUTH_ADOBE_CLIENT_ID="<adobe_application_id>"
AUTH_ADOBE_CLIENT_SECRET="<adobe_application_secret_key>"
AUTH_ADOBE_AUTHORIZE_URL="https://ims-na1.adobelogin.com/ims/authorize/v2"
AUTH_ADOBE_ACCESS_URL="https://ims-na1.adobelogin.com/ims/token/v3"
AUTH_ADOBE_PROFILE_URL="https://ims-na1.adobelogin.com/ims/userinfo/v2"
AUTH_ADOBE_ALLOW_PUBLIC_REGISTRATION="true"
AUTH_ADOBE_DEFAULT_ROLE_ID="<directus_role_id>"
AUTH_ADOBE_ICON="adobe"
```

### OAuth 2.0 and OpenID

Directus' OAuth 2.0 and OpenID integrations provide powerful alternative ways to authenticate into your project.
Directus will ask you to login on the external service, and return authenticated with a Directus account linked to that
service.

Directus supports hundreds of OAuth 2.0 and OpenID services, but requires some configuration to authenticate users
correctly. For example, enabling authentication through GitHub requires creating an
[OAuth 2.0 app in GitHub](https://github.com/settings/developers) and adding the following configuration to Directus:

```
AUTH_PROVIDERS="github"
AUTH_GITHUB_CLIENT_ID="99d3...c3c4"
AUTH_GITHUB_CLIENT_SECRET="34ae...f963"
AUTH_GITHUB_AUTHORIZE_URL="https://github.com/login/oauth/authorize"
AUTH_GITHUB_ACCESS_URL="https://github.com/login/oauth/access_token"
AUTH_GITHUB_PROFILE_URL="https://api.github.com/user"
```

::: warning PUBLIC_URL

These flows rely on the `PUBLIC_URL` variable for redirecting. Make sure that variable is configured correctly.

:::

## File Storage

By default, Directus stores every file you upload locally on disk. Instead of local file storage, you can configure
Directus to use S3 or Google Cloud Storage instead:

```
STORAGE_LOCATIONS="aws"

STORAGE_AWS_DRIVER="s3"
STORAGE_AWS_KEY="tp15c...510vk"
STORAGE_AWS_SECRET="yk29b...b932n"
STORAGE_AWS_REGION="us-east-2"
STORAGE_AWS_BUCKET="my-files"
```

### Multiple Storage Adapters

You can configure multiple storage adapters at the same time. This allows you to choose where files are being uploaded
on a file-by-file basis. To do this, you can provide a CSV of storage location names, and provide a config block for
each of them:

```
STORAGE_LOCATIONS="local,aws"

STORAGE_LOCAL_DRIVER="local"
STORAGE_LOCAL_ROOT="local"

STORAGE_AWS_KEY="tp15c...510vk"
STORAGE_AWS_SECRET="yk29b...b932n"
STORAGE_AWS_REGION="us-east-2"
STORAGE_AWS_BUCKET="my-files"
```

In the Admin App, files will automatically be uploaded to the first configured storage location (in this case `local`).
The used storage location is saved under `storage` in `directus_files`.

## Rate Limiting

You can use the built-in rate-limiter to prevent users from hitting the API too much. To enable the rate-limiter, simply
set

```
RATE_LIMITER_ENABLED="true"
```

This will kick-in the rate-limiter on a maximum of 50 requests a second. You can configure this using:

```
// 10 requests per 5 seconds

RATE_LIMITER_POINTS="10"
RATE_LIMITER_DURATION="5"
```

Once you have multiple copies of Directus running under a load-balancer, or your user base grows so much that memory is
no longer a viable place to store the rate limiter information, you can use an external `memcache` or `redis` instance
to store the rate limiter data:

```
RATE_LIMITER_ENABLED="true"

RATE_LIMITER_POINTS="10"
RATE_LIMITER_DURATION="5"

RATE_LIMITER_STORE="redis"

RATE_LIMITER_REDIS="redis://@127.0.0.1"
```

## File-Based Configuration

In case you prefer using a configuration file instead of environment variables, you can use the `CONFIG_PATH`
environment variable to instruct Directus to use a local configuration file instead of environment variables. See
[Config Files](/reference/config-files.md) for more information.
