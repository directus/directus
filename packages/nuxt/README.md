# Directus Nuxt Module

> If you are using Nuxt 2, you can check out this guide on how to setup the
> [Directus SDK](https://docs.directus.io/reference/sdk) as a plugin in your Nuxt 2 project.

## Installation

1. Add `@directus/nuxt` dependency in your project:

   ```shell
   npm install @directus/nuxt
   ```

2. Add `@directus/nuxt` to the [`modules`](http://v3.nuxtjs.org/docs/directory-structure/nuxt.config#modules) property
   of your [nuxt config file](https://v3.nuxtjs.org/docs/directory-structure/nuxt.config):

   ```ts
   // nuxt.config.ts
   import { defineNuxtConfig } from 'nuxt3';

   export default defineNuxtConfig({
   	modules: ['@directus/nuxt'],
   });
   ```

## Options

Example configuration:

```ts
import { defineNuxtConfig } from 'nuxt3';

export default defineNuxtConfig({
	modules: ['@directus/nuxt'],

	directus: {
		url: 'http://localhost:8055',
	},

	// Or you can use publicRuntimeConfig
	publicRuntimeConfig: {
		directus: {
			url: 'http://localhost:8055',
		},
	},
});
```

- `url` [*Required*] - should be a valid URL to your Directus instance

- `auth` [*Optional*] - defines if server-side requests will have authentication or not. You should define this if you
  want access to non-public content.
  [View more about permissions](https://docs.directus.io/configuration/users-roles-permissions/#users-roles-permissions).

  - `auth.token` [*Optional*] - should be the static token of the user which will make the requests server-side. You can
    define one on user detail page.

  - `auth.email` [*Optional, but required with password and ignored if `auth.token` defined*] - should be the email of
    the user which will make the requests server-side.

  - `auth.password` [*Optional, but required with email and ignored if `auth.token` defined*] - should be the password
    of the user which will make the requests server-side.

## Usage

### Composition API

```vue
<template>
	<h1>Server Info</h1>
	<pre>{{ serverInfo }}</pre>
</template>

<script lang="ts" setup>
const { $directus } = useNuxtApp();
const { data: serverInfo } = await useAsyncData('serverInfo', () => $directus.server.info());
</script>
```

### Additional Usage Note

#### Client

⚠ If you are running Nuxt in development, you may need to add `CORS_ORIGIN="http://localhost:3000"`
([Reference](https://docs.directus.io/configuration/config-options/#cors)) to your Directus instance to avoid CORS
issues for client-side API calls in the browser.

#### Server

For server-side rendering, you can include auth options to authenticate and access restricted resources. In order to
avoid exposing the token or credentials, we should use
[privateRuntimeConfig](http://v3.nuxtjs.org/docs/directory-structure/nuxt.config#privateruntimeconfig) for them to be
accessible from server-side only.

```ts
import { defineNuxtConfig } from 'nuxt3';

export default defineNuxtConfig({
	privateRuntimeConfig: {
		directus: {
			auth: {
				token: 'admintoken', // You can use a static token from a user

				// Or you can use the credentials of a user
				// email: "admin@example.com",
				// password: "password",
			},
		},
	},
});
```

## Development

- Run `npm run dev:prepare` to generate type stubs.
- Use `npm run dev` to start [playground](./playground) in development mode.
