# JavaScript SDK

> The JS SDK provides an intuitive interface for the Directus API from within a JavaScript-powered project (browsers and
> node.js). The default implementation uses [Axios](https://npmjs.com/axios) for transport and `localStorage` for
> storing state.

[[toc]]

## Installation

```bash
npm install @directus/sdk
```

## Usage

```js
import { Directus } from '@directus/sdk';

const directus = new Directus('https://api.example.com/');
```

**NOTE** _All_ methods return promises. Make sure to await methods, for example:

```js
import { Directus } from '@directus/sdk';

const directus = new Directus('https://api.example.com/');

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
```

## Global

### Constructor

Signature:

```js
new Directus(url, options?)
```

#### Parameters

| Parameter | Description                               | Default     | Type              |
| --------- | ----------------------------------------- | ----------- | ----------------- |
| `url`     | Url of your running Directus api instance | none        | `string`          |
| `options` | Configuration options                     | _See below_ | `DirectusOptions` |

#### Options

<table> 
<tr>
<th>Option</th>
<th>Description</th>
<th>Default</th>
<th>Type</th>
</tr>
<tr>
<td>

`storage`

</td>
<td>

Storage implementation. See [Storage](#storage) for more information.

</td>
<td>

`MemoryStorage` when in node.js, and `LocalStorage` when in browsers.

</td>
<td>

`IStorage`

</td>
</tr>
<tr>
<td>

`authOptions`

</td>
<td>

Authentication options. See ([Auth](#auth)) for more information.

</td>
<td>

```js
{
	authStorage: // the above global storage instance,
	mode: // 'json' in nodejs, 'cookie' in browser,
	authRefreshOptions: {
		autoRefresh: true,
		autoRefreshLeadTime: 30000
	}
}
```

</td>
<td>

`AuthOptions`

</td>
</tr>

</table>

::: warning NOTE

If you plan on using multiple SDK instances at once, keep in mind that they will all access the same Storage instance.
This can lead to unpredictable behaviors, and is especially common when writing tests.

For example, one SDK instance executes `login()` and writes the resulting `access_token` into the Storage. Then another
SDK instance does the same thing, and **overwrites** the previous value. `access_token`. The first SDK instance now has
the access rights of the second, which can mess up your tests. Adding prefixes to your Storage instances would solve
this error:

```js
import { Directus, MemoryStorage } from '@directus/sdk';
import { randomBytes } from 'crypto';

// ...

const prefix = randomBytes(8).toString('hex');
const storage = new MemoryStorage(prefix);
const url = `http://${host}:${port}`;
const directus = new Directus(url, { storage });
```

:::

### Example

```js
const directus = new Directus('http://api.example.com/');
```

### Get / Set API URL

```js
// Get the API base URL
console.log(directus.transport.url); // => https://api.example.com/

// Set the API base URL
directus.transport.url = 'https://api2.example.com';
```

### Access to transport/Axios

You can tap into the transport through `directus.transport`. If you are using the (default) `AxiosTransport`, you can
access axios through `directus.transport.axios`.

#### Intercepting requests and responses

Axios transport offers a wrapper around Axios interceptors to make it easy for you to inject/eject interceptors.

```ts
const requestInterceptor = directus.transport.requests.intercept((config) => {
	config.headers['My-Custom-Header'] = 'Header value';
	return config;
});

// If you don't want the interceptor anymore, remove it
requestInterceptor.eject();
```

```ts
const responseInterceptor = directus.transport.responses.intercept((response) => {
	console.log('Response received', { response });
	return response;
});

// If you don't want the interceptor anymore, remove it
responseInterceptor.eject();
```

## Items

You can get an instance of the item handler by providing the collection (and type, in the case of TypeScript) to the
`items` function. The following examples will use the `Article` type.

> JavaScript

```js
// import { Directus, ID } from '@directus/sdk';
const { Directus } = require('@directus/sdk');

const directus = new Directus('https://api.example.com');

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

### Read All Activity

```js
await directus.activity.readMany();
```

### Read Activity By Query

```js
await directus.activity.readMany({
	filter: {
		action: {
			_eq: 'create',
		},
	},
});
```

### Read Activity By Primary Key(s)

```js
await directus.activity.readOne(15);
```

Supports optional query:

```js
await directus.activity.readOne(15, { fields: ['action'] });
```

### Create a Comment

```js
await directus.activity.comments.create({
	collection: 'articles',
	item: 15,
	comment: 'Hello, world!',
});
```

### Update a comment

```js
await directus.activity.comments.update(31, {
	comment: 'Howdy, world!',
});
```

Note: The passed key is the primary key of the comment

### Delete a comment

```js
await directus.activity.comments.delete(31);
```

Note: The passed key is the primary key of the comment

## Auth

By default the SDK will choose sensible defaults for your environment, and automatically refresh your access token
before it expires. Or, you can choose to manually control this behavior using [AuthOptions](#auth-options).

### Login

::: tip Types of Authentication

There are two kinds of authentication Directus can use: static and login (see
[Types of Tokens](/reference/api/authentication#types-of-tokens) for more on how authentication works in Directus).

:::

#### With login credentials

```js
await directus.auth.login({
	email: 'admin@example.com',
	password: 'd1r3ctu5',
});
```

#### With a static token

```js
await directus.auth.static('static_token');
```

### Auth Options

All auth options are optional.

Outline:

```js
{
	authStorage
	mode
	refreshOptions {
		autoRefresh
		autoRefreshLeadTime
	}
}
```

<table>
<tr>
<th>Option</th>
<th>Description</th>
<th>Default</th>
<th>Type</th>
</tr>
<tr>
<td>

`authStorage`

</td>
<td>

Storage implementation for auth information. This is here in case you wish to use a different storage for auth than for
the rest of the sdk. In almost all cases, you won't need to set this at all. See [Storage](#storage) for more
information.

</td>
<td>

Same storage as the main sdk.

</td>
<td>

`IStorage?`

</td>
</tr>
<tr>
<td>

`mode`

</td>
<td>

When in `cookie` mode, the API will set the refresh token in an `httpOnly` secure cookie that can't be accessed from
client side JavaScript. This is the most secure way to connect to the API from a public front-end website.

When you can't rely on cookies (i.e. node.js), or need more control over handling the storage of the cookie, use `json`
mode. This will return the refresh token in the "normal" payload.

</td>
<td>

`cookie` in browsers, `json` in node.js.

</td>
<td>

`cookie | json`

</td>
</tr>
<tr>
<td>

`refreshOptions`

</td>
<td>

Configuration options for the SDK's automatic token refresh functionality.

</td>
<td>

_See below_

</td>
<td>

`AuthAutoRefreshOptions`

</td>
</tr>
<tr>
<td></td>
<td colspan=3>
<table>
<tr>
<td>

`autoRefresh`

</td>
<td>

Whether or not to automatically refresh the auth token (get a new one before the current one expires).

</td>
<td>

`true`

</td>
<td>

`boolean`

</td>
</tr>
<tr>
<td>

`autoRefreshLeadTime`

</td>
<td>

How many milliseconds before the auth token expiration you want to automatically refresh it.

The lead time (in milliseconds) between auth token refreshing and expiration.

The auth token will be refreshed some number of milliseconds _before_ it actually expires. This setting controls exactly
how many.

</td>
<td>

`30000`

</td>
<td>

`number`

</td>
</tr>
</table>
</td>
</tr>

</table>

You can also pass any `AuthAutoRefreshOptions` as a second param to `login()`:

```js
await directus.auth.login(
	{
		email: 'admin@example.com',
		password: 'd1r3ctu5',
	},
	{
		autoRefresh: true,
		autoRefreshLeadTime: 30000,
	}
);
```

### Manual Token Control

You can manually get the auth token:

```ts
const token = directus.auth.token;
```

You can also manually refresh the authentication token. This won't try to refresh the token if it's still valid in the
eyes of the SDK.

```js
await directus.auth.refresh();
```

If you want to force it to regardless, pass in `true`:

```js
await directus.auth.refresh(true);
```

In addition, any concurrent refreshes (trying to refresh while a there's an existing refresh running), will result in
only a single refresh hitting the server, returning a promise resolving/rejecting with the result from the first call.

`refresh` will return the `AuthResult` if the refresh was successful, `false` if the SDK thinks it's not needed, or
throw an error if the refresh fails.

If you wish to control the automatic refresh of the token yourself for whatever reason, here is an example of how you
might do so:

````js

const directus = new Directus('https://api.example.com')
const response = await directus.login({
		email: 'admin@example.com',
		password: 'd1r3ctu5',
	},);

	const accessToken = response.data.data.access_token;

	// Store the access token somewhere to use in auth headers, like
	// request.headers['Authorization'] = `Bearer ${accessToken}`;

	// Refresh the token 10 seconds before the access token expires.
	setTimeout(() => directus.auth.refresh(), response.data.data.expires - 10000);

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

## Storage

The storage is used to load and save SDK data.

### LocalStorage

The storage used in environments where Local Storage is supported.

#### Options

The `LocalStorage` implementation accepts a _transparent_ prefix. Use this when you need multiple SDK instances with
independent authentication for example.

### MemoryStorage

The storage used when SDK data is ephemeral. For example: only during the lifecycle of the process.

#### Options

The `MemoryStorage` implementation accepts a _transparent_ prefix so you can have multiple instances of the SDK without
having clashing keys.

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

## TypeScript

If you are using TypeScript, the JS-SDK requires TypeScript 3.8 or newer. TypeScript will also improve the development
experience by providing relevant information when manipulating your data. For example, `directus.items` knows about your
collection types if you feed the SDK with enough information in the construction of the SDK instance. This allows for a
more detailed IDE suggestions for return types, sorting, and filtering.

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
````
