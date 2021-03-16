# JavaScript SDK

> The JS SDK provides an intuitive interface to work with Directus API from a JavaScript powered project (browsers and
> node.js). The default implementations uses [Axios](https://npmjs.com/axios) for transport and `localStorage` for
> storing state.

[[toc]]

## Installation

```bash
npm install @directus/sdk
```

## TypeScript

If you are using TypeScript, the JS SDK requires TypeScript 3.8 or newer. It will also improve the development
experience by providing relevant information when manipulating your data.

For example, `directus.items` will accept an user data type which allows for a more detailed IDE suggestions for return
types, sorting and filtering.

```ts
type Post = {
	id: ID;
	title: string;
};

const posts = directus.items<Post>('posts');

const post = await posts.readOne(1);
```

You can also extend Directus system type information by providing type information on Directus constructor.

```ts
type UserType = {
	level: number;
	experience: number;
};

type CustomTypes = {
	// This type will be merged with Directus user type.
	// Getting `users` name here is important.
	users: UserType;
};

async function whoami() {
	const directus = new Directus<CustomTypes>('https://api.example.com');

	await directus.auth.login({
		email: 'admin@example.com',
		password: 'password',
	});

	// typeof me = typeof CustomTypes.users;
	const me = await directus.users.me.read();

	// OK
	me.level = 42;

	// Error TS2322: Type 'string' is not assignable to type 'number'.
	me.experience = 'high';
}
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

async function getData() {
	// Wait for login to be done...
	await directus.auth.login({
		email: 'admin@example.com',
		password: 'password',
	});

	// ... before fetching items
	return await directus.items('articles').readMany();
}

getData();
```

## Global

### Initialize

```js
import { Directus } from '@directus/sdk';

const directus = new Directus('https://api.example.com/');
```

#### `url`

The constructor will accept the URL as the first parameter.

#### `options.auth`

The authentication implementation. See [Auth](#auth) for more information.

Defaults to an instance `Auth`.

#### `options.storage`

The storage implementation. See [Storage](#storage) for more information.

Defaults to an instance of `MemoryStorage` when in node.js, and `LocalStorage` when in browsers.

#### `options.transport`

The transport implementation. See [Transport](#transport) for more information.

Defaults to an instance of `AxiosTransport`.

### Full Example

```js
const url = 'http://api.example.com/';

// Storage adapter where refresh tokens are stored in JSON mode.
const storage = new MemoryStorage();

// Transport is what is used to communicate with the server.
const transport = new AxiosTransport(url, storage);

// Auth is how authentication is handled, stored, refreshed.
const auth = new Auth(transport, storage, {
	mode: 'json', // or cookie, depends on your use  case
});

const directus = new Directus(url, {
	auth,
	storage,
	transport,
});
```

### Get / Set API URL

```js
// Get the used API base URL
console.log(directus.url); // => https://api.example.com/

// Set the API base URL
directus.transport.url = 'https://api2.example.com';
```

### Access to transport/Axios

You can tap into the transport through `directus.transport`. If you are using the (default) `AxiosTransport`, you can
access axios through `directus.transport.axios`.

## Items

You can get an instance of the item handler by providing the collection (and type in case of TypeScript) to the `items`
function. The following examples will use the `Article` type and below.

> JavaScript

```js
// import { Directus, ID } from '@directus/sdk';
const { Directus } = require('@directus/sdk');

const directus = new Directus('https://api.example.com');

const articles = directus.items('articles');
```

> TypeScript

```ts
import { ID } from '@directus/sdk';

// This is written by you, but it's not required.
type Article = {
	id: ID;
	title: string;
	body: string;
	published: boolean;
};

// 'articles' refers to the actual collection name.
const articles = directus.items<Article>('articles');

// This also works since the type is optional, but we highly recommended it. See #TypeScript section.
// const articles = directus.items('articles');
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
// One
await articles.readOne(15, { fields: ['title'] });
```

Supports optional query:

```js
await articles.updateOne(15, { title: 'An Updated title' }, { fields: ['title'] });

await articles.updateMany(
	[
		/*...*/
	],
	{ fields: ['title'] }
);
```

### Update Multiple Items

```js
await articles.updateMany([
	{
		id: 15,
		title: 'Article 15',
	},
	{
		id: 42,
		title: 'Article 42',
	},
]);
```

Supports optional query:

```js
await articles.updateMany(
	[
		{
			id: 15,
			title: 'Article 15',
		},
		{
			id: 42,
			title: 'Article 42',
		},
	],
	{ fields: ['title'] }
);
```

<!--
TODO: This needs to be discussed.

### Update Multiple Items by Query, Single Value

```js
await articles.update(
	{
		archived: true,
	},
	{
		filter: {
			publish_date: {
				_gte: '$NOW',
			},
		},
	}
);
```
-->

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

### Configuration

Directus will accept custom implementations of the `IAuth` interface. The default implementation `Auth` can be imported
from `@directus/sdk`. The default implementation will require you to pass the transport and storage implementations.
Options are optional.

```js
import { Auth } from '@directus/sdk';

// ...

const sdk = new Directus('url', {
	auth: new Auth(transport, storage, options);
	// ...
});
```

#### transport

The transport responsible for communicating with Directus backend.

Defaults to an instance of `AxiosTransport` when not creating `Auth` it youself.

#### storage

The storage responsible for storing authentication and sdk state.

When not creating `Auth` it youself, defaults to `MemoryStorage` in node.js, and `LocalStorage` in browsers.

#### options.mode

Accepts `cookie` or `json`.

When in `cookie` mode, the API will set the refresh token in a `httpOnly` secure cookie that can't be accessed from
client side JS. This is the most secure way to connect to the API from a public front-end website.

When you can't rely on cookies, or need more control over handling the storage of the cookie (like in node.js), use
`json` mode. This will return the refresh token like "regular" in the payload. The storage of these tokens are handled
by the `storage` implementation.

Defaults to `cookie` in browsers, `json` in node.js.

### Full example

```js
import { Auth, AxiosTransport, Directus, MemoryStorage } from '@directus/sdk';

async function main() {
	const url = 'http://directus';

	const storage = new MemoryStorage();
	const transport = new AxiosTransport(url, storage);
	const auth = new Auth(transport, storage, {
		mode: 'json',
	});

	const directus = new Directus(url, {
		auth,
		storage,
		transport,
	});

	await directus.auth.login({
		email: 'admin@example.com',
		password: 'password',
	});
}
```

### Get / Set Token

```
directus.auth.token = 'abc.def.ghi';
```

### Login

```js
await directus.auth.login({
	email: 'admin@example.com',
	password: 'd1r3ctu5',
});
```

<!--
TODO: resolve what to do with refreshing.
### Refresh

Note: if you have autoRefresh enabled, you most likely won't need to use this manually.

```js
directus.auth.refresh();
```
-->

### Logout

```js
await directus.auth.logout();
```

### Request a Password Reset

```js
await directus.auth.password.request('admin@example.com');
```

### Reset a Password

```js
await directus.auth.password.reset('abc.def.ghi', 'n3w-p455w0rd');
```

Note: the token passed in the first parameter is sent in an email to the user when using `request()`

## Transport

> TODO

## Storage

> TODO

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

This will move item 15 to the position of item 42, and move everything in between one "slot" up

### Revert to a Previous Revision

```js
await directus.utils.revert(451);
```

Note: the key passed is the primary key of the revision you'd like to apply
