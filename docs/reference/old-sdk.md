---
description:
  The JS SDK provides an intuitive interface for the Directus API from within a JavaScript-powered project (browsers and
  Node.js). The default implementation uses [Axios](https://npmjs.com/axios) for transport and `localStorage` for
  storing state.
readTime: 14 min read
---

# JavaScript SDK (pre v11)

> The JS SDK provides an intuitive interface for the Directus API from within a JavaScript-powered project (browsers and
> Node.js). The default implementation uses [Axios](https://npmjs.com/axios) for transport and `localStorage` for
> storing state. Advanced customizations are available.

::: danger This SDK is no longer supported!

Version 11 introduced a complete rewrite of our SDK and the version referenced on this page is no longer supported
either in terms of code or help in our community spaces. This page is purely for reference. New SDK docs can be found
[here](/guides/sdk/getting-started).

:::

## Installation

```bash
npm install @directus/sdk@10
```

## Basic Usage

This is the starting point to use the JS SDK. After you've created the `Directus` instance, you can start invoking
methods from it to access your project and data.

```js
import { Directus } from '@directus/sdk';

const directus = new Directus('http://directus.example.com');
```

You can always access data available to the
[public role](/user-guide/user-management/users-roles-permissions#directus-roles).

```js
async function publicData() {
	// GET DATA

	// We don't need to authenticate if the public role has access to some_public_collection.
	const publicData = await directus.items('some_public_collection').readByQuery({ sort: ['id'] });

	console.log(publicData.data);
}
```

### Basic Authentication

To access anything that is not available to the
[public role](/user-guide/user-management/users-roles-permissions#directus-roles), you must be
[authenticated](/reference/authentication).

```js
async function start() {
	// AUTHENTICATION

	let authenticated = false;

	// Try to authenticate with token if exists
	await directus.auth
		.refresh()
		.then(() => {
			authenticated = true;
		})
		.catch(() => {});

	// Let's login in case we don't have token or it is invalid / expired
	while (!authenticated) {
		const email = window.prompt('Email:');
		const password = window.prompt('Password:');

		await directus.auth
			.login({ email, password })
			.then(() => {
				authenticated = true;
			})
			.catch(() => {
				window.alert('Invalid credentials');
			});
	}

	// GET DATA

	// After authentication, we can fetch data from any collections that the user has permissions to.
	const privateData = await directus.items('some_private_collection').readByQuery({ sort: ['id'] });

	console.log(privateData.data);
}

start();
```

## Custom Configuration

The previous section covered basic installation and usage of the JS SDK with default configurations for `init`. But
sometimes you may need to customize these defaults.

### Constructor

```js
import { Directus } from '@directus/sdk';

const directus = new Directus(url, init);
```

### Parameters

<br />

#### `url` _required_

- **Type** — `String`
- **Description** — A string that points to your Directus instance. E.g., `https://example.directus.io`
- **Default** — N/A

<br />

#### `init` _optional_

- **Type** — `Object`
- **Description** — Defines authentication, storage and transport settings.
- **Default** — The following shows the default values for `init`.

```js
// This is the default init object
const config = {
	auth: {
		mode: 'cookie', // 'json' in Node.js
		autoRefresh: true,
		msRefreshBeforeExpires: 30000,
		staticToken: '',
	},
	storage: {
		prefix: '',
		mode: 'LocalStorage', // 'MemoryStorage' in Node.js
	},
	transport: {
		params: {},
		headers: {},
		onUploadProgress: (ProgressEvent) => {},
		maxBodyLength: null,
		maxContentLength: null,
	},
};
```

## Customize `auth`

Defines how authentication is handled by the SDK. By default, Directus creates an instance of `auth` which handles
refresh tokens automatically.

```js
const auth = {
	mode: 'cookie', // 'json' in Node.js
	autoRefresh: true,
	msRefreshBeforeExpires: 30000,
	staticToken: '',
};
```

### Options

<br />

#### `mode`

- **Type** — `String`
- **Description** — Defines the mode you want to use for authentication. It can be `'cookie'` for cookies or `'json'`
  for JWT.
- **Default** — Defaults to `'cookie'` on browsers and `'json'` otherwise.

::: tip

We recommend using cookies when possible to prevent any kind of attacks, mostly XSS.

:::

#### `autoRefresh`

- **Type** — `Boolean`
- **Description** — Determines whether SDK handles refresh tokens automatically.
- **Default** — Defaults to `true`.

<br />

#### `msRefreshBeforeExpires`

- **Type** — `Number`
- **Description** — When `autoRefresh` is enabled, this tells how many milliseconds before the refresh token expires and
  needs to be refreshed.
- **Default** — Defaults to `30000`.

<br />

#### `staticToken`

- **Type** — `String`
- **Description** - Defines the static token to use. It is not compatible with the options above since it does not
  refresh.
- **Default** — Defaults to `''` (no static token).

### Extend `auth`

It is possible to provide a custom implementation by extending `IAuth`. While this could be useful in certain advanced
situations, it is not needed for most use-cases.

```js
import { IAuth, Directus } from '@directus/sdk';

class MyAuth extends IAuth {
	async login() {
		return { access_token: '', expires: 0 };
	}

	async logout() {}
	async refresh() {
		return { access_token: '', expires: 0 };
	}

	async static() {
		return true;
	}
}

const directus = new Directus('https://example.directus.app', {
	auth: new MyAuth(),
});
```

## Customize `storage`

The storage is used to load and save token information. By default, Directus creates an instance of `storage` which
handles store information automatically.

```js
const storage = {
	prefix: '',
	mode: 'LocalStorage', // 'MemoryStorage' in Node.js
};
```

::: tip Multiple Instances

If you want to use multiple instances of the SDK you should set a different [`prefix`](#prefix) for each one.

:::

::: tip

The axios instance can be used for custom requests by calling:

```ts
await directus.transport<method>('/path/to/endpoint', {
	/* body, params, ... */
});
```

:::

### Options

<br />

#### `prefix`

- **Type** — `String`
- **Description** — Defines the tokens prefix tokens that are saved. This should be fulfilled with different values when
  using multiple instances of SDK.
- **Default** — Defaults to `''` (no prefix).

<br />

#### `mode`

- **Type** — `String`
- **Description** — Defines the storage location to be used to save tokens. Allowed values are `LocalStorage` and
  `MemoryStorage`. The mode `LocalStorage` is not compatible with Node.js. `MemoryStorage` is not persistent, so once
  you leave the tab or quit the process, you will need to authenticate again.
- **Default** — Defaults to `LocalStorage` on browsers and `MemoryStorage` on Node.js.

### Extend `storage`

It is possible to provide a custom implementation by extending `BaseStorage`. While this could be useful in certain
advanced situations, it is not needed for most use-cases.

```js
import { BaseStorage, Directus } from '@directus/sdk';

class SessionStorage extends BaseStorage {
	get(key) {
		return sessionStorage.getItem(key);
	}

	set(key, value) {
		return sessionStorage.setItem(key, value);
	}

	delete(key) {
		return sessionStorage.removeItem(key);
	}
}

const directus = new Directus('https://example.directus.app', {
	storage: new SessionStorage(),
});
```

## Customize `transport`

Defines settings you want to customize regarding [Transport](#extend-transport).

By default, Directus creates an instance of `Transport` which handles requests automatically. It uses
[`axios`](https://axios-http.com/) so it is compatible in both browsers and Node.js. With axios, it is also possible to
handle upload progress (a downside of `fetch`).

The configurations within `init.transport` are passed to `axios`. For more details, see
[Request Config](https://axios-http.com/docs/req_config) in the axios documentation.

```js
export default {
	params: {},
	headers: {},
	onUploadProgress: (ProgressEvent) => {},
	maxBodyLength: null,
	maxContentLength: null,
};
```

### Options

<br />

#### `params`

- **Type** — `Object`
- **Description** — Defines an object with keys and values to be passed as additional query string.
- **Default** — N/A

<br />

#### `headers`

- **Type** — `Object`
- **Description** - Defines an object with keys and values to be passed as additional headers.
- **Default** — N/A

<br />

#### `onUploadProgress`

- **Type** — `Function`
- **Description** — Defines a callback function to indicate the upload progress.
- **Default** — N/A

::: tip ProgressEvent

Please see the MDN documentation to learn more about the
[ProgressEvent](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent).

:::

<br />

#### `maxBodyLength`

- **Type** — `Number`
- **Description** — The maximum body length in bytes. Set `Infinity` for no limit.
- **Default** — N/A

<br />

#### `maxContentLength`

- **Type** — `Number`
- **Description** — The maximum content length in bytes. Set `Infinity` for no limit.
- **Default** — N/A

### Extend `Transport`

It is possible to provide a custom implementation by extending `ITransport`. For example, you can customize it to use
different HTTP libraries. While this could be useful in certain advanced situations, it is not needed for most
use-cases.

```js
import { ITransport, Directus } from '@directus/sdk';

class MyTransport extends ITransport {
	buildResponse() {
		return {
			raw: '',
			data: {},
			status: 0,
			headers: {},
		};
	}

	async get(path, options) {
		return this.buildResponse();
	}

	async head(path, options) {
		return this.buildResponse();
	}

	async options(path, options) {
		return this.buildResponse();
	}

	async delete(path, data, options) {
		return this.buildResponse();
	}

	async post(path, data, options) {
		return this.buildResponse();
	}

	async put(path, data, options) {
		return this.buildResponse();
	}

	async patch(path, data, options) {
		return this.buildResponse();
	}
}

const directus = new Directus('https://example.directus.app', {
	transport: new MyTransport(),
});
```

## TypeScript

Version >= 4.1

Although it's not required, it is recommended to use TypeScript to have an easy development experience. This allows more
detailed IDE suggestions for return types, sorting, filtering, etc.

To feed the SDK with your current schema, you need to pass it on the constructor.

```ts
type BlogPost = {
	id: ID;
	title: string;
};

type BlogSettings = {
	display_promotions: boolean;
};

type MyCollections = {
	posts: BlogPost;
	settings: BlogSettings;
};

// This is how you feed custom type information to Directus.
const directus = new Directus<MyCollections>('https://example.directus.app');

// ...

const post = await directus.items('posts').readOne(1);
// typeof(post) is a partial BlogPost object

const settings = await posts.singleton('settings').read();
// typeof(settings) is a partial BlogSettings object
```

You can also extend the Directus system type information by providing type information for system collections as well.

```ts
import { Directus } from '@directus/sdk';

// Custom fields added to Directus user collection.
type UserType = {
	level: number;
	experience: number;
};

type CustomTypes = {
	/*
	This type will be merged with Directus user type.
	It's important that the naming matches a directus
	collection name exactly. Typos won't get caught here
	since SDK will assume it's a custom user collection.
	*/
	directus_users: UserType;
};

const directus = new Directus<CustomTypes>('https://example.directus.app');

await directus.auth.login({
	email: 'admin@example.com',
	password: 'password',
});

const me = await directus.users.me.read();
// typeof me = partial DirectusUser & UserType;

// OK
me.level = 42;

// Error TS2322: Type "string" is not assignable to type "number".
me.experience = 'high';
```

## Authentication

### Get current token

```ts
await directus.auth.token;
```

::: warning Async

Reading the token is an asynchronous getter. This makes sure that any currently active `refresh` calls are being awaited
before the current token is returned.

:::

### Login

#### With credentials

```js
await directus.auth.login({
	email: 'admin@example.com',
	password: 'd1r3ctu5',
});
```

#### With static tokens

```js
await directus.auth.static('static_token');
```

### Refresh Auth Token

By default, Directus will handle token refreshes. Although, you can handle this behavior manually by setting
[`autoRefresh`](#options.auth.autoRefresh) to `false`.

```js
await directus.auth.refresh();
```

::: tip Developing Locally

If you're developing locally, you might not be able to refresh your auth token automatically in all browsers. This is
because the default auth configuration requires secure cookies to be set, and not all browsers allow this for localhost.
You can use a browser which does support this such as Firefox, or
[disable secure cookies](/self-hosted/config-options#security).

:::

### Logout

```js
await directus.auth.logout();
```

### Request a Password Reset

By default, the address defined in `PUBLIC_URL` on `.env` file is used for the link to the reset password page sent in
the email:

```js
await directus.auth.password.request('admin@example.com');
```

But a custom address can be passed as second argument:

```js
await directus.auth.password.request(
	'admin@example.com',
	'https://myapp.com' // In this case, the link will be https://myapp.com?token=FEE0A...
);
```

**Note**: To use a custom address you need to configure the
[`PASSWORD_RESET_URL_ALLOW_LIST` environment variable](/self-hosted/config-options#security) to enable this feature.

### Reset a Password

```js
await directus.auth.password.reset('abc.def.ghi', 'n3w-p455w0rd');
```

Note: The token passed in the first parameter is sent in an email to the user when using `request()`

## Items

You can get an instance of the item handler by providing the collection (and type, in the case of TypeScript) to the
`items` function. The following examples will use the `Article` type.

> JavaScript

```js
// import { Directus, ID } from '@directus/sdk';
const { Directus } = require('@directus/sdk');

const directus = new Directus('https://example.directus.app');

const articles = directus.items('articles');
```

> TypeScript

```ts
import { Directus, ID } from '@directus/sdk';

// Map your collection structure based on its fields.
type Article = {
	id: ID;
	title: string;
	body: string;
	published: boolean;
};

// Map your collections to its respective types. The SDK will
// infer its types based on usage later.
type MyBlog = {
	// [collection_name]: typescript_type
	articles: Article;

	// You can also extend Directus collection. The naming has
	// to match a Directus system collection and it will be merged
	// into the system spec.
	directus_users: {
		bio: string;
	};
};

// Let the SDK know about your collection types.
const directus = new Directus<MyBlog>('https://example.directus.app');

// typeof(article) is a partial "Article"
await directus.items('articles').readOne(10);

// Error TS2322: "hello" is not assignable to type "boolean".
// post.published = 'hello';
```

### Create Single Item

```js
await articles.createOne({
	title: 'My New Article',
});
```

### Create Multiple Items

```js
await articles.createMany([
	{
		title: 'My First Article',
	},
	{
		title: 'My Second Article',
	},
]);
```

### Read By Query

```js
await articles.readByQuery({
	search: 'Directus',
	filter: {
		date_published: {
			_gte: '$NOW',
		},
	},
});
```

### Read All

```js
await articles.readByQuery({
	// By default API limits results to 100.
	// With -1, it will return all results, but it may lead to performance degradation
	// for large result sets.
	limit: -1,
});
```

### Read Single Item

```js
await articles.readOne(15);
```

Supports optional query:

```js
await articles.readOne(15, {
	fields: ['title'],
});
```

### Read Multiple Items

```js
await articles.readMany([15, 16, 17]);
```

Supports optional query:

```js
await articles.readMany([15, 16, 17], {
	fields: ['title'],
});
```

### Update Single Item

```js
await articles.updateOne(15, {
	title: 'This articles now has a different title',
});
```

Supports optional query:

```js
await articles.updateOne(
	42,
	{
		title: 'This articles now has a similar title',
	},
	{
		fields: ['title'],
	}
);
```

### Update Multiple Items

```js
await articles.updateMany([15, 42], {
	title: 'Both articles now have the same title',
});
```

Supports optional query:

```js
await articles.updateMany(
	[15, 42],
	{
		title: 'Both articles now have the same title',
	},
	{
		fields: ['title'],
	}
);
```

### Delete

```js
// One
await articles.deleteOne(15);

// Multiple
await articles.deleteMany([15, 42]);
```

### Request Parameter Overrides

To override any of the axios request parameters, provide an additional parameter with a `requestOptions` object:

```js
await articles.createOne(
	{ title: 'example' },
	{ fields: ['id'] },
	{
		requestOptions: {
			headers: {
				'X-My-Custom-Header': 'example',
			},
		},
	}
);
```

## Activity

```js
directus.activity;
```

The activity property has all the methods of directus.items('directus_activity') with the addition of an alias to the
activity comments (below).

```js
directus.activity.comments;
```

## Comments

```js
directus.comments;
```

### Create a comment

```js
await directus.comments.create({
	// ...
});
```

### Update a comment

```js
await directus.comments.update(/* comment activity id */ 15, 'Yo, dawg!');
```

### Delete a comment

```js
await directus.comments.delete(/* comment activity id */ 15);
```

## Collections

```js
directus.collections;
```

### Read a single collection

```js
await directus.collections.readOne(/* collection name */ 'articles');
```

### Read all collections

```js
await directus.collections.readAll(); // Doesn't currently support query or searching
```

### Create a collection

```js
await directus.collections.createOne({ collection: 'articles', /* ... */ });
```

### Create multiple collections

```js
await directus.collections.createMany([{ collection: 'articles', /* ... */ }, /* ... */]);
```

### Update a collection

```js
await directus.collections.updateOne(/* collection name */ 'articles', /* patch */ { note: 'All the articles' }, query);
```

### Delete a collection

```js
await directus.collections.deleteOne(/* collection name */ 'articles');
```

## Fields

```js
directus.fields;
```

### Read a single field

```js
await directus.fields.readOne(/* collection name */ 'articles', /* id of the field */ 15);
```

### Read multiple fields

```js
await directus.fields.readMany(/* collection name */ 'articles'); // Doesn't currently support query parameter
```

### Read all fields

```js
await directus.fields.readAll(); // Doesn't currently support query or searching
```

### Create a field

```js
await directus.fields.createOne(/* collection name */ 'articles', { field: 'alt_title', /* ... */ });
```

### Update a field

```js
await directus.fields.updateOne(
	/* collection name */ 'articles',
	/* field_name */ 'alt_title',
	/* patch */ { hidden: true }
);
```

### Delete a field

```js
await directus.fields.deleteOne(/* collection name */ 'articles', /* field_name */ 'alt_title');
```

## Files

```js
directus.files;
```

The files property support all of the functions common to all items - directus.items('directus_files') with one
addition: import.

### Import

In addition to the items common methods, the files property adds the import method for importing files.

```js
directus.files.import(/* ... */);
```

See [API File Import](https://docs.directus.io/reference/files/#import-a-file)

### Uploading a file

To upload a file you will need to send a `multipart/form-data` as body. On browser side you do so:

```js
/* index.js */
import { Directus } from 'https://unpkg.com/@directus/sdk@latest/dist/sdk.esm.min.js';

const directus = new Directus('https://example.directus.app', {
	auth: {
		staticToken: 'STATIC_TOKEN', // If you want to use a static token, otherwise check below how you can use email and password.
	},
});

// await directus.auth.login({ email, password })
// If you want to use email and password, remove the staticToken above.

const form = document.querySelector('#upload-file');

if (form && form instanceof HTMLFormElement) {
	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		const form = new FormData(event.target);
		await directus.files.createOne(form);
	});
}
```

```html
<!-- index.html -->
<html>
	<head></head>
	<body>
		<form id="upload-file">
			<input type="text" name="title" />
			<input type="file" name="file" />
			<button>Send</button>
		</form>
		<script src="/index.js" type="module"></script>
	</body>
</html>
```

#### NodeJS usage

When uploading a file from a NodeJS environment, you'll have to override the headers to ensure the correct boundary is
set:

```js
import { Directus } from 'https://unpkg.com/@directus/sdk@latest/dist/sdk.esm.min.js';

const directus = new Directus('https://example.directus.app', {
	auth: {
		staticToken: 'STATIC_TOKEN', // If you want to use a static token, otherwise check below how you can use email and password.
	},
});

const form = new FormData();
form.append('file', fs.createReadStream('./to_upload.jpeg'));

await directus.files.createOne(
	form,
	{},
	{
		requestOptions: {
			headers: {
				...form.getHeaders(),
			},
		},
	}
);
```

### Importing a file

Example of [importing a file from a URL](/reference/files#import-a-file):

```js
await directus.files.import({
	url: 'http://www.example.com/example-image.jpg',
});
```

Example of importing file with custom data:

```js
await directus.files.import({
	url: 'http://www.example.com/example-image.jpg',
	data: {
		title: 'My Custom File',
	},
});
```

## Folders

```js
directus.folders;
```

Same methods as `directus.items("directus_folders")`.

## Permissions

```js
directus.permissions;
```

Same methods as `directus.items("directus_permissions")`.

## Presets

```js
directus.presets;
```

Same methods as `directus.items("directus_presets")`.

## Relations

```js
directus.relations;
```

Same methods as `directus.items("directus_relations")`.

## Revisions

```js
directus.revisions;
```

Same methods as `directus.items("directus_revisions")`.

## Roles

```js
directus.roles;
```

Same methods as `directus.items("directus_roles")`.

## Settings

```js
directus.settings;
```

Same methods as `directus.items("directus_settings")`.

## Server

### Ping the Server

```js
await directus.server.ping();
```

### Get Server/Project Info

```js
await directus.server.info();
```

## Users

```js
directus.users;
```

Same methods as `directus.items("directus_users")`, and:

### Invite a New User

```js
await directus.users.invites.send('admin@example.com', 'fe38136e-52f7-4622-8498-112b8a32a1e2');
```

The second parameter is the role of the user

### Accept a User Invite

```js
await directus.users.invites.accept('<accept-token>', 'n3w-p455w0rd');
```

The provided token is sent to the user's email

### Enable Two-Factor Authentication

```js
await directus.users.tfa.enable('my-password');
```

### Disable Two-Factor Authentication

```js
await directus.users.tfa.disable('691402');
```

### Get the Current User

```js
await directus.users.me.read();
```

Supports optional query:

```js
await directus.users.me.read({
	fields: ['last_access'],
});
```

### Update the Current Users

```js
await directus.users.me.update({ first_name: 'Admin' });
```

Supports optional query:

```js
await directus.users.me.update({ first_name: 'Admin' }, { fields: ['last_access'] });
```

## Utils

### Get a Random String

```js
await directus.utils.random.string();
```

Supports an optional `length` (defaults to 32):

```js
await directus.utils.random.string(50);
```

### Generate a Hash for a Given Value

```js
await directus.utils.hash.generate('My String');
```

### Verify if a Hash is Valid

```js
await directus.utils.hash.verify('My String', '$argon2i$v=19$m=4096,t=3,p=1$A5uogJh');
```

### Sort Items in a Collection

```js
await directus.utils.sort('articles', 15, 42);
```

This will move item `15` to the position of item `42`, and move everything in between one "slot" up.

### Revert to a Previous Revision

```js
await directus.utils.revert(451);
```

Note: The key passed is the primary key of the revision you'd like to apply.
