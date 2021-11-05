# JavaScript SDK

> The JS SDK provides an intuitive interface for the Directus API from within a JavaScript-powered project (browsers and
> Node.js). The default implementation uses [Axios](https://npmjs.com/axios) for transport and `localStorage` for
> storing state.

[[toc]]

## Installation

```bash
npm install @directus/sdk
```

## Usage

```js
import { Directus } from '@directus/sdk';

const directus = new Directus('http://directus.example.com');

async function start() {
	// Wait for login to be done...
	await directus.auth.login({
		email: 'admin@example.com',
		password: 'password',
	});

	// ... before fetching items
	const articles = await directus.items('articles').readMany();

	console.log({
		items: articles.data,
		total: articles.meta.total_count,
	});
}

start();
```

## TypeScript

Version >= 4.1

Although it's not required, it is recommended to use Typescript to have an easy development experience. This allows more
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
const directus = new Directus<MyCollections>('http://url');

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

const directus = new Directus<CustomTypes>('https://api.example.com');

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

## Reference

### Constructor

This is the starting point to use the SDK. You need to create an instance and invoke methods from it. In most cases a
single instance is sufficient, but in case you need more, you need to define
[`options.storage.prefix`](#options.storage.prefix).

```js
import { Directus } from '@directus/sdk';

const directus = new Directus(url, init);
```

- `url` [required] _String_ - A string pointing to your Directus instance. E.g. `https://admin.directus.io`

  <a name="options"></a>

- `init` [optional] _Object_ - Define settings that you want to customize .The possible options are:

  <a name="options.auth"></a>

  - `auth` [optional] _Object_ - Defines settings you want to customize regarding [authentication](#auth). The possible
    options are:

    - `mode` [optional] _String_ - Defines the mode you want to use for authentication. It can be `'cookie'` for cookies
      or `'json'` for JWT. Defaults to `'cookie'` on browsers and `'json'` otherwise. We recommend using cookies when
      possible to prevent any kind of attacks, mostly XSS.

      <a name="options.auth.autoRefresh"></a>

    - `autoRefresh` [optional] _Boolean_ - Tells SDK ifit should handle refresh tokens automatically. Defaults to
      `true`.
    - `msRefreshBeforeExpires` [optional] _Number_ - When `autoRefresh` is enabled, this tells how many milliseconds
      before the refresh token expires and needs to be refreshed. Defaults to `30000`.
    - `staticToken` [optional] _String_ - Defines the static token to use. It is not compatible with the options above
      since it does not refresh. Defaults to `''` (no static token).

  <a name="options.storage"></a>

  - `storage` [optional] _Object_ - Defines settings you want to customize regarding [storage](#storage).

    <a name="options.storage.prefix"></a>

    - `prefix` [optional] _String_ - Defines the tokens prefix tokens that are saved. This should be fulfilled with
      different values when using multiple instances of SDK. Defaults to `''` (no prefix).
    - `mode` [optional] _String_ - Defines the storage location to be used to save tokens. Allowed values are
      `LocalStorage` and `MemoryStorage`. Defaults to `LocalStorage` on browsers and `MemoryStorage` on Node.js. The
      mode `LocalStorage` is not compatible with Node.js.

  <a name="options.transport"></a>

  - `transport` [optional] _Object_ - Defines settings you want to customize regarding [transport](#transport).
    - `params` [optional] _Object_ - Defines an object with keys and values to be passed as additional query string.
    - `headers` [optional] _Object_ - Defines an object with keys and values to be passed as additional headers.
    - `onUploadProgress` [optional] _(event:
      [ProgressEvent](https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent) => void)_ - Defines a callback
      function to indicate the upload progress.

## Auth

Defines how authentication is handled by the SDK.

### Custom Implementation

It is possible to provide a custom implementation by extending `IAuth`. While this could be useful for advanced usage,
most use-cases do not need it.

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

const directus = new Directus('http://directus.example.com', { auth: new MyAuth() });
```

### Directus Implementation

By default, Directus creates an instance of `Auth` which handles refresh tokens automatically. Check
[`options.auth`](#options.auth) to see the available settings.

### Get current token

```ts
const token = directus.auth.token;
```

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

By default, Directus will handle token refreshes. Although, you can handle this behaviour manually by setting
[`autoRefresh`](#options.auth.autoRefresh) to `false`.

```js
await directus.auth.refresh();
```

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

### Reset a Password

```js
await directus.auth.password.reset('abc.def.ghi', 'n3w-p455w0rd');
```

Note: The token passed in the first parameter is sent in an email to the user when using `request()`

## Transport

The transport object abstracts how you communicate with Directus. Transports can be customized to use different HTTP
libraries for example.

### Custom Implementation

It is possible to provide a custom implementation by extending `ITransport`. While, this could be useful for advanced
usage, it is not needed for most use-cases.

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

const directus = new Directus('http://directus.example.com', { transport: new MyTransport() });
```

### Directus Implementation

By default, Directus creates an instance of `Transport` which handles requests automatically. Check
[`options.transport`](#options.transport) to see the available settings.

To make HTTP requests SDK uses `axios` so it is compatible in both browsers and Node.js. Also, it is possible to handle
upload progress (a downside of `fetch`).

## Storage

The storage is used to load and save token information.

### Custom Implementatin

It is possible to provide a custom implementation by extending `IStorage`. While, this could be useful for advanced
usage, it is not needed for most use-cases.

```js
import { IStorage, Directus } from '@directus/sdk';

class MyStorage extends IStorage {
	get auth_token() {
		return this.get('auth_token');
	}
	get auth_expires() {
		return Number(this.get('auth_expires'));
	}
	get auth_refresh_token() {
		return this.get('auth_refresh_token');
	}

	get(key) {
		return '';
	}
	set(key, value) {
		return value;
	}
	delete(key) {
		return null;
	}
}

const directus = new Directus('http://directus.example.com', { storage: new MyStorage() });
```

### Directus Implementation

By default, Directus creates an instance of `Storage` which handles store information automatically. Check
[`options.storage`](#options.storage) to see the available settings.

SDK uses `localStorage` on browsers and the memory itself on Node.js to save tokens. This behavior can be configured in
[`options.storage.mode`](#options.storage.mode). The `LocalStorage` is only available on browsers and the
`MemoryStorage` is not persitent, i.e., once you leave the tab or quit the process, you will need to authenticate again.

If you want to use multiple instances of the SDK you should set a different [`prefix`](#options.storage.prefix) for each
one.

When using

## Items

You can get an instance of the item handler by providing the collection (and type, in the case of TypeScript) to the
`items` function. The following examples will use the `Article` type.

> JavaScript

```js
// import { Directus, ID } from '@directus/sdk';
const { Directus } = require('@directus/sdk');

const directus = new Directus('http://directus.example.com');

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
const directus = new Directus<MyBlog>('https://directus.myblog.com');

// typeof(article) is a partial "Article"
const article = await directus.items('articles').readOne(10);

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

### Read All

```js
await articles.readMany();
```

### Read By Query

```js
await articles.readMany({
	search: 'Directus',
	filter: {
		date_published: {
			_gte: '$NOW',
		},
	},
});
```

### Read By Primary Key(s)

```js
await articles.readOne(15);
```

Supports optional query:

```js
await articles.readOne(15, { fields: ['title'] });
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

## Activity

```js
directus.activity;
```

Same methods as `directus.items("directus_activity")`.

## Comments

```js
directus.comments;
```

Same methods as `directus.items("directus_comments")`.

## Collections

```js
directus.collections;
```

Same methods as `directus.items("directus_collections")`.

## Fields

```js
directus.fields;
```

Same methods as `directus.items("directus_fields")`.

## Files

```js
directus.files;
```

Same methods as `directus.items("directus_files")`.

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

---
