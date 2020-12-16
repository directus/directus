# SDK JS

The JS SDK is a small wrapper around [Axios](https://npmjs.com/axios) that makes it a little easier to use the Directus
API from a JavaScript powered project.

## Installation

```bash
npm install @directus/sdk-js
```

## Usage

```js
import DirectusSDK from '@directus/sdk-js';

const directus = new DirectusSDK('https://api.example.com/');
```

**NOTE** All methods return promises. Make sure to await methods, for example:

```js
import DirectusSDK from '@directus/sdk-js';

const directus = new DirectusSDK('https://api.example.com/');

async function getData() {
	// Wait for login to be done...
	await directus.auth.login({ email: 'admin@example.com', password: 'password' });

	// ... before fetching items
	return await directus.items('articles').read();
}

getData();
```

## Reference

### Global

#### Initialize

```js
import DirectusSDK from '@directus/sdk-js';

const directus = new DirectusSDK('https://api.example.com/');
```

The SDK accepts a second optional `options` parameter:

```js
import DirectusSDK from '@directus/sdk-js';

const directus = new DirectusSDK('https://api.example.com/', {
	auth: {
		storage: new MemoryStore(), // Storage adapter where refresh tokens are stored in JSON mode
		mode: 'json', // What login mode to use. One of `json`, `cookie`
		autoRefresh: true, // Whether or not to automatically refresh the access token on login
	},
});
```

#### Get / set API URL

```js
// Get the used API base URL
console.log(directus.url);
// => https://api.example.com/

// Set the API base URL
directus.url = 'https://api2.example.com';
```

#### Access to Axios

You can tap into the Axios instance used directly through `directus.axios`.

---

### Items

#### Create

##### Single Item

```js
directus.items('articles').create({
	title: 'My New Article',
});
```

##### Multiple Items

```js
directus.items('articles').create([
	{
		title: 'My First Article',
	},
	{
		title: 'My Second Article',
	},
]);
```

#### Read

##### All

```js
directus.items('articles').read();
```

##### By Query

```js
directus.items('articles').read({
	search: 'Directus',
	filter: {
		date_published: {
			_gte: '$NOW',
		},
	},
});
```

##### By Primary Key(s)

```js
// One
directus.items('articles').read(15);

// Multiple
directus.items('articles').read([15, 42]);
```

Supports optional query:

```js
// One
directus.items('articles').read(15, { fields: ['title'] });

// Multiple
directus.items('articles').read([15, 42], { fields: ['title'] });
```

#### Update

##### One or More Item(s), Single Value

```js
// One
directus.items('articles').update(15, {
	title: 'An Updated title',
});

// Multiple
directus.items('articles').update([15, 42], {
	title: 'An Updated title',
});
```

Supports optional query:

```js
directus.items('articles').update(15, { title: 'An Updated title' }, { fields: ['title'] });

directus.items('articles').update([15, 42], { title: 'An Updated title' }, { fields: ['title'] });
```

##### Multiple Items, Multiple Values

```js
directus.items('articles').update([
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
directus.items('articles').update(
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

##### Multiple Items by Query, Single Value

```js
directus.items('articles').update(
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

#### Delete

```js
// One
directus.items('articles').delete(15);

// Multiple
directus.items('articles').delete([15, 42]);
```

---

### Activity

#### Read Activity

##### All

```js
directus.activity.read();
```

##### By Query

```js
directus.activity.read({
	filter: {
		action: {
			_eq: 'create',
		},
	},
});
```

##### By Primary Key(s)

```js
// One
directus.activity.read(15);

// Multiple
directus.activity.read([15, 42]);
```

Supports optional query:

```js
// One
directus.activity.read(15, { fields: ['action'] });

// Multiple
directus.activity.read([15, 42], { fields: ['action'] });
```

#### Create a Comment

```js
directus.activity.comments.create({
	collection: 'articles',
	item: 15,
	comment: 'Hello, world!',
});
```

#### Update a comment

```js
directus.activity.comments.update(31, { comment: 'Howdy, world!' });
```

Note: The passed key is the primary key of the comment

#### Delete a comment

```js
directus.activity.comments.delete(31);
```

Note: The passed key is the primary key of the comment

---

### Auth

#### Configuration

Note: these configuration options are passed in the top level SDK constructor.

##### mode

`cookie` or `json`. When in cookie mode, the API will set the refresh token in a `httpOnly` secure cookie that can't be
accessed from client side JS. This is the most secure way to connect to the API from a public front-end website.

When you can't rely on cookies, or need more control over handling the storage of the cookie, use `json` mode. This will
return the refresh token like "regular" in the payload. You can use the `storage` option (see below) to control where
the refresh token is stored / read from

##### storage

When using `json` for mode, the refresh token needs to be stored somewhere. The `storage` option allows you to plug in
any object that has an async `setItem()` and `getItem()` method. This allows you to plugin things like
[`localforage`](https://github.com/localForage/localForage) directly:

```js
import localforage from 'localforage';
import DirectusSDK from '@directus/sdk-js';

const directus = new DirectusSDK('https://api.example.com', { auth: { storage: localforage, mode: 'json' } });
```

##### autoRefresh

Whether or not to automatically call `refresh()` when the access token is about to expire. Defaults to `true`

#### Get / Set Token

```
directus.auth.token = 'abc.def.ghi';
```

#### Login

```js
directus.auth.login({ email: 'admin@example.com', password: 'd1r3ctu5' });
```

#### Refresh

Note: if you have autoRefresh enabled, you most likely won't need to use this manually.

```js
directus.auth.refresh();
```

#### Logout

```js
directus.auth.logout();
```

#### Request a Password Reset

```js
directus.auth.password.request('admin@example.com');
```

#### Reset a Password

```js
directus.auth.password.reset('abc.def.ghi', 'n3w-p455w0rd');
```

Note: the token passed in the first parameter is sent in an email to the user when using `request()`

---

### Collections

```js
directus.collections;
```

Same methods as `directus.items(collection)`.

---

### Fields

```js
directus.fields;
```

Same methods as `directus.items(collection)`.

---

### Files

```js
directus.files;
```

Same methods as `directus.items(collection)`.

---

### Folders

```js
directus.folders;
```

Same methods as `directus.items(collection)`.

---

### Permissions

```js
directus.permissions;
```

Same methods as `directus.items(collection)`.

---

### Presets

```js
directus.presets;
```

Same methods as `directus.items(collection)`.

---

### Relations

```js
directus.relations;
```

Same methods as `directus.items(collection)`.

---

### Revisions

```js
directus.revisions;
```

Same methods as `directus.items(collection)`.

---

### Roles

```js
directus.roles;
```

Same methods as `directus.items(collection)`.

---

### Server

#### Get the API Spec in OAS Format

```js
directus.server.specs.oas();
```

#### Ping the Server

```js
directus.server.ping();
```

#### Get Server/Project Info

```js
directus.server.info();
```

---

### Settings

```js
directus.settings;
```

Same methods as `directus.items(collection)`.

---

### Users

```js
directus.users;
```

Same methods as `directus.items(collection)`, and:

#### Invite a New User

```js
directus.users.invite('admin@example.com', 'fe38136e-52f7-4622-8498-112b8a32a1e2');
```

The second parameter is the role of the user

#### Accept a User Invite

```js
directus.users.acceptInvite('abc.def.ghi', 'n3w-p455w0rd');
```

The provided token is sent to the user's email

#### Enable Two-Factor Authentication

```js
directus.users.tfa.enable('my-password');
```

#### Disable Two-Factor Authentication

```js
directus.users.tfa.disable('691402');
```

#### Get the Current User

```js
directus.users.me.read();
```

Supports optional query:

```js
directus.users.me.read({
	fields: ['last_access'],
});
```

#### Update the Current Users

```js
directus.users.me.update({ first_name: 'Admin' });
```

Supports optional query:

```js
directus.users.me.update({ first_name: 'Admin' }, { fields: ['last_access'] });
```

---

### Utils

#### Get a Random String

```js
directus.utils.random.string();
```

Supports an optional `length`:

```js
directus.utils.random.string(32);
```

#### Generate a Hash for a Given Value

```js
directus.utils.hash.generate('My String');
```

#### Verify if a Hash is Valid

```js
directus.utils.hash.verify('My String', '$argon2i$v=19$m=4096,t=3,p=1$A5uogJh');
```

#### Sort Items in a Collection

```js
directus.utils.sort('articles', 15, 42);
```

This will move item 15 to the position of item 42, and move everything in between one "slot" up

#### Revert to a Previous Revision

```js
directus.utils.revert(451);
```

Note: the key passed is the primary key of the revision you'd like to apply
