---
description: A list of any actions you may need to take on upgrades of Directus.
---

# Breaking Changes

As we continue to build Directus, we occasionally make changes that change how certain features works. We try and keep
these to a minimum, but rest assured we only make them with good reason.

[Learn more about Versioning](/getting-started/architecture#versioning)

[Learn more about Upgrading your Instance](/self-hosted/upgrades-migrations)

Starting with Directus 10.0, here is a list of potential breaking changes with remedial action you may need to take.

## Version 10.12.2

### Disallowed Mutation of Special System Collections via Relations

For security reasons, mutations of the following system collections via relations are no longer permitted:

- `directus_collections`
- `directus_fields`
- `directus_relations`
- `directus_sessions`
- `directus_extensions`

## Version 10.10.0

### Deprecated Typed Extension Folders

Legacy extension type directory-based structure (`/interfaces/my-interface/`, `/endpoints/my-endpoint`, etc) are being
removed in favor of relying on the `package.json` file for metadata including extension type.

If your extensions are already relying on the up-to-date extensions folder paradigm (extensions in the root of your
extensions folder prefixed with `directus-extension-`) no action is required at this point. If you're currently relying
on the legacy format for extensions, recognizable by each extension type having it's own folder, like `endpoints`,
`hooks`, etc, you will have to update your extensions before upgrading to this version.

Directus will ignore extensions that use the legacy format starting in this version.

::: details Migration/Mitigation

Move all extension directories from their extension type subdirectory one level up. For example:

- `./extensions/modules/module-a/` becomes `./extensions/module-a/`.
- `./extensions/panels/panel-b/` becomes `./extensions/panel-b/`.

If your extension does not already have one, add a `directus:extension` object to your `package.json` file:

```json
{
	"name": "directus-extension-hello-world",
	"version": "1.0.0",
	"type": "module",
	"directus:extension": {
		"type": "endpoint",
		"path": "dist/index.js",
		"source": "src/index.js",
		"host": "^10.0.0"
	}
}
```

Notes:

- Make sure `type` matches the JS type of your `dist` file (cjs or esm).
- Make sure `directus:extension.type` matches the type of extension. This should match the legacy type folder name.
- Make sure `directus:extension.path`points to your extensions’ `dist` file.
- Make sure `directus:extension.source` points to your extensions’ source code entry point or set to an empty string
  `""` when the source code is not stored alongside the `package.json` file.
- Make sure `directus:extension.host` is set to a Directus version range your extension is compatible with (for example:
  `^10.0.0`)

:::

### Moved Migrations Out of Extensions

Migrations are no longer considered an extension type as of this release. The `migrations` extensions directory must be
migrated.

Place migrations in the `./migrations` directory, or set the new location in the `MIGRATIONS_PATH` environment variable.

### Moved Email Templates Out of Extensions

Email Templates are no longer considered an extension type as of this release. The `templates` extensions directory must
be migrated.

Place email templates in the `./templates` directory, or set the new location in the `EMAIL_TEMPLATES_PATH` environment
variable.

### Content Versioning Output

Starting with 10.10.0, when requesting Item Content Versions via the API, nested relational changes to one-to-many are
resolved rather than returned as a raw changes object (see [#20890](https://github.com/directus/directus/issues/20890)
for more information).

The change makes the output for a versioned record match the format of the `Main` record more closely, which then
natively supports other features like Live Preview. To retrieve the raw staged version (pre-10.10.0 behavior), just add
the new `?versionRaw=true` query parameter to the request.

### Session Cookie Based Authentication

For improved security and ease of use we have implemented session based authentication and have updated the App to use
this method over the previous token based authentication. This impacts `oauth2`, `open-id` and `saml` SSO installations
as they too will now default to the new session based authentication in order to work with the App out-of-the-box. The
new session cookie can be configured using the `SESSION_COOKIE_*` environment variables.

To keep using the previous SSO behavior setting the refresh token instead of session token for use in external
applications, you can set `AUTH_<PROVIDER>_MODE=cookie`. This will however not work with the Directus app.

#### Extensions Extracting the Current Token from `axios`

This affects App extensions that are currently extracting the token from `axios`. This will no longer be either possible
or necessary, as the App now uses a session cookie, which will be sent with each request from the browser.

::: details Migration/Mitigation

::: code-group

```js [Before]
function addQueryToPath(path, query) {
	const queryParams = [];

	for (const [key, value] of Object.entries(query)) {
		queryParams.push(`${key}=${value}`);
	}

	return path.includes('?') ? `${path}&${queryParams.join('&')}` : `${path}?${queryParams.join('&')}`;
}

function getToken() {
	return (
		directusApi.defaults?.headers?.['Authorization']?.split(' ')[1] ||
		directusApi.defaults?.headers?.common?.['Authorization']?.split(' ')[1] ||
		null
	);
}

function addTokenToURL(url) {
	const accessToken = getToken();
	if (!accessToken) return url;
	return addQueryToPath(url, {
		access_token: accessToken,
	});
}

const authenticatedURL = addTokenToURL('/assets/<uuid>')
```

```js [After]
// no extra logic needed to be authenticated
const authenticatedURL = '/assets/<uuid>';
```

:::

#### Extensions using `AuthenticationService`

In the `AuthenticationService` the `login` function signature has been changed to have an `options` object as the third
argument for any extra options:

::: code-group

```js [Before]
AuthenticationService.login('email', 'password', 'otp-code');
```

```js [After]
AuthenticationService.login('email', 'password', { otp: 'otp-code', session: true });
```

:::

### Introduced Allow List for OAuth2/OpenID/SAML Redirects

Due to an Open Redirect vulnerability with the OAuth2, OpenID and SAML SSO providers, we have introduced an allow list
for these redirects.

If your current workflow depends on redirecting to an external domain after successful SSO login using the
`?redirect=http://example.com/login` query parameter, then you'll need to add this URL to the
`AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST` config option.

`AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST` accepts a comma-separated list of URLs (path is included in comparison).

### Email Flow Operation No Longer Waits for Emails to Be Sent

Previously, the [Send Email](https://docs.directus.io/app/flows/operations.html#send-email) Flow Operation has waited
until emails have been sent out before proceeding to the next step.

This is no longer the case, which also means that the operation can no longer be used to receive information about
dispatched emails.

If this is a requirement, it can still be achieved by building a custom operation which directly uses the `MailService`.

## Version 10.9.0

### Updated Exif Tags

The library `exif-reader`, which is used for Exif metadata extraction of images, has been updated to v2. In this
release, tag names have been updated to align with the Exif standard. See
https://github.com/devongovett/exif-reader/pull/30 for a complete list of updated tags.

This might be a breaking change if a custom `FILE_METADATA_ALLOW_LIST` config is in place, or you rely on the generated
Exif tags stored in Directus Files to not change name.

The updated Exif tags only apply to images which are uploaded after upgrading to this release.

### Dropped Support for SDK Scoped Entrypoints

You can no longer import parts of the SDK through scoped entrypoints to prevent issues with TypeScript based libraries
consuming the SDK.

Any scoped imports of `@directus/sdk` will need updating to import functions from the root.

::: details Migration/Mitigation

::: code-group

```js [Before]
import { createDirectus } from '@directus/sdk';
import { rest } from '@directus/sdk/rest';
```

```js [After]
import { createDirectus, rest } from '@directus/sdk';
```

:::

### Dropped Support for Asynchronous Logic In JS Config Files

Environment handling has been moved to a new `@directus/env` package. With this new package, ESM config files are still
supported, but will no longer support running asynchronous code within them.

### Updated Sorting in Schema Snapshots

The sort order of fields and relations inside schema snapshots has been changed to their original creation order. This
is to increase consistency of resulting snapshots artifacts.

While this is not a breaking change, you are advised to regenerate the snapshot after the version update of Directus,
provided you are tracking the snapshot in a version control system.

## Version 10.8.3

### Updated GraphQL Content Version Usage

Previously when accessing content versions via GraphQL, a `version` parameter was used on existing fields. This has now
been changed and is accessed via dedicated query types (`<collection>_by_version` and `versions`).

::: details Migration/Mitigation

::: code-group

```graphql [Before]
# Get an item's version by id
query {
	<collection>_by_id(id: 15, version: "draft") {
		id
		title
		body
	}
}

# Get a version singleton or list versions in a collection
query {
	<collection>(version: "draft") {
		id
		title
		body
	}
}
```

```graphql [After]
# Get an item's version by id
query {
	<collection>_by_version(id: 15, version: "draft") {
		id
		title
		body
	}
}

# Get a version singleton
query {
	<collection>_by_version(version: "draft") {
		id
		title
		body
	}
}

# List versions in a collection (`/graphql/system`)
query {
	versions(filter: { collection: { _eq: "posts" } }) {
        item
        key
    }
}
```

:::

### Renamed `ExtensionItem` Type in the SDK

The `ExtensionItem` type has been renamed to `DirectusExtension` to be inline with other system collections.

## Version 10.7.0

### Replaced Extensions List Endpoints

In previous releases, it was possible to `GET /extensions/:type` to retrieve a list of enabled extensions for a given
type.

This has been replaced with a `GET /extensions` endpoint that returns all extensions along with their type and status.

## Version 10.6.2

### Swapped Parameters and Auth Mode for Refresh Method in the SDK

The parameter order for the `refresh` method and thus also the default auth mode have been swapped in order to work well
with both auth modes, `cookie` and `json`.

::: details Migration/Mitigation

::: code-group

```js [Before]
// refresh http request using a cookie
const result = await client.request(refresh('', 'cookie'));

// refresh http request using json
const result = await client.request(refresh(refresh_token));
const result = await client.request(refresh(refresh_token, 'json'));
```

```js [After]
// refresh http request using a cookie
const result = await client.request(refresh());
const result = await client.request(refresh('cookie'));

// refresh http request using json
const result = await client.request(refresh('json', refresh_token));
```

:::

### Renamed Helper Function in the SDK

The SDK helper function `asSearch` has been renamed to `withSearch` for naming consistency in helpers.

## Version 10.6

### Dropped Support for Custom NPM Modules in the Run Script operation in Flows

Prior to this release, Directus relied on `vm2` to run code from **Run Script** operations in Flows - our automation
feature. `vm2` is now unmaintained with critical security issues that could potentially allow code to escape the sandbox
and potentially access the machine which hosts your Directus project. We have migrated to `isolated-vm` to allow Flows
to continue to run safely.

If you used to rely on axios, node-fetch, or other libraries to make web requests, we strongly recommend migrating to
using the **Webhook / Request URL** operation instead. This operation includes additional security measures, like the IP
allow-list that prevents traffic. For other npm packages in Flows, your will need to
[create a custom operation extension](/guides/extensions/operations-npm-package).

## Version 10.4

### Consolidated Environment Variables for Redis Use

Directus had various different functionalities that required you to use Redis when running Directus in a horizontally
scaled environment such as caching, rate-limiting, realtime, and flows. The configuration for these different parts have
been combined into a single set of `REDIS` environment variables that are reused across the system.

::: details Migration/Mitigation

Combine all the `*_REDIS` environment variables into a single shared one as followed:

::: code-group

```ini [Before]
CACHE_STORE="redis"
CACHE_REDIS_HOST="127.0.0.1"
CACHE_REDIS_PORT="6379"
...
RATE_LIMITER_STORE="redis"
RATE_LIMITER_REDIS_HOST="127.0.0.1"
RATE_LIMITER_REDIS_PORT="6379"
...
SYNCHRONIZATION_STORE="redis"
SYNCHRONIZATION_REDIS_HOST="127.0.0.1"
SYNCHRONIZATION_REDIS_PORT="6379"
...
MESSENGER_STORE="redis"
MESSENGER_REDIS_HOST="127.0.0.1"
MESSENGER_REDIS_PORT="6379"
```

```ini [After]
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"

CACHE_STORE="redis"
RATE_LIMITER_STORE="redis"
SYNCHRONIZATION_STORE="redis"
MESSENGER_STORE="redis"
```

:::

### Dropped Support for Memcached

Directus used to support either memory, Redis, or Memcached for caching and rate-limiting storage. Given a deeper
integration with Redis, and the low overall usage/adoption of Memcached across Directus installations, we've decided to
sunset Memcached in favor of focusing on Redis as the primary solution for pub/sub and hot-storage across load-balanced
Directus installations.

### Updated Errors Structure for Extensions

As part of standardizing how extensions are built and shipped, you must replace any system exceptions you extracted from
`exceptions` with new errors created within the extension itself. We recommend prefixing the error code with your
extension name for improved debugging, but you can keep using the system codes if you relied on that in the past.

::: details Migration/Mitigation

::: code-group

```js [Before]
export default (router, { exceptions }) => {
	const { ForbiddenException } = exceptions;

	router.get('/', (req, res) => {
		throw new ForbiddenException();
	});
};
```

```js [After]
import { createError } from '@directus/errors';

const ForbiddenError = createError('MY_EXTENSION_FORBIDDEN', 'No script kiddies please...');

export default (router) => {
	router.get('/', (req, res) => {
		throw new ForbiddenError();
	});
};
```

:::

## Version 10.2

### Removed Fields from Server Info Endpoint

As a security precaution, we have removed the following information from the `/server/info` endpoint:

- Directus Version
- Node Version and Uptime
- OS Type, Version, Uptime, and Memory
