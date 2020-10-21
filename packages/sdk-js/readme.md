# Directus JS SDK

[WIP] v9

## To-Do

- [ ] Docs

- [ ] Items
	- [x] Create
	- [x] Read
	- [x] Update
	- [x] Delete
- [ ] Activity
	- [ ] Read
	- [ ] Create Comment
	- [ ] Update Comment
	- [ ] Delete Comment
- [ ] Assets??? (not sure if needed)
	- [ ] Read
- [ ] Auth
	- [ ] Login
	- [ ] Refresh
	- [ ] Logout
	- [ ] Request Password Reset
	- [ ] Reset Password
	- [ ] oAuth
		- [ ] Get available providers
		- [ ] Login with provider
- [ ] Collections
	- [ ] Create
	- [ ] Read
	- [ ] Update
	- [ ] Delete
- [ ] Extensions??? (not sure if needed)
	- [ ] Read
- [ ] Fields
	- [ ] Create
	- [ ] Read
	- [ ] Update
	- [ ] Delete
- [ ] Files
	- [ ] Create (upload)
	- [ ] Read
	- [ ] Update
	- [ ] Delete
- [ ] Folders
	- [ ] Create
	- [ ] Read
	- [ ] Update
	- [ ] Delete
- [ ] GraphQL
	- [ ] Run
- [ ] Permissions
	- [ ] Create
	- [ ] Read
	- [ ] Update
	- [ ] Delete
- [ ] Presets
	- [ ] Create
	- [ ] Read
	- [ ] Update
	- [ ] Delete
- [ ] Relations
	- [ ] Create
	- [ ] Read
	- [ ] Update
	- [ ] Delete
- [ ] Revisions
	- [ ] Create
	- [ ] Read
	- [ ] Update
	- [ ] Delete
- [ ] Roles
	- [ ] Create
	- [ ] Read
	- [ ] Update
	- [ ] Delete
- [ ] Server
	- [ ] Specs
		- [ ] OAS
	- [ ] Ping
	- [ ] Info
- [ ] Settings
	- [ ] Read
	- [ ] Update
- [ ] Users
	- [ ] Create
	- [ ] Read
	- [ ] Update
	- [ ] Delete
	- [ ] Invite
	- [ ] Accept Invite
	- [ ] Enable TFA
	- [ ] Disable TFA
- [ ] Utils
	- [ ] Get random string
	- [ ] Hash a value
	- [ ] Verify a hashed value
	- [ ] Sort in collection
	- [ ] Revert revision


## Installation

```
npm install @directus/sdk-js
```

## Usage

```js
import DirectusSDK from '@directus/sdk-js';

const directus = new DirectusSDK('https://api.example.com/');

directus.items('articles').read(15);
```

## Docs

**NOTE** All methods return promises. Make sure to await methods, for example:

```js
import DirectusSDK from '@directus/sdk-js';

const directus = new DirectusSDK('https://api.example.com/');

async function getData() {
	await directus.auth.login({ email: 'admin@example.com', password: 'password' });
	return await directus.items('articles').read();
}
```

### Global SDK

#### Initialize

```js
import DirectusSDK from '@directus/sdk-js';

const directus = new DirectusSDK('https://api.example.com/');
```

#### Get / set API URL

```js
// Get the used API base URL
console.log(directus.url);
// => https://api.example.com/

// Set the API base URL
directus.url = 'https://api2.example.com';
```

---

### Items

#### Create

```js
// Create an item
directus.items('articles').create({
	title: 'My New Article'
});

// Create multiple items
directus.items('articles').create([
	{
		title: 'My First Article'
	},
	{
		title: 'My Second Article'
	},
]);
```

#### Read

```js
// Get all
directus.items('articles').read();

// Get item by ID (w/ optional query)
directus.items('articles').read(15);
directus.items('articles').read(15, { fields: ['title'] });

// Get items by IDs (w/ optional query)
directus.items('articles').read([15, 42]);
directus.items('articles').read([15, 42], { fields: ['title' ]});

// Get items by search query params
directus.items('articles').read({
	search: 'Directus',
	filter: {
		date_published: {
			_gte: '$NOW'
		}
	}
});
```

#### Update

```js
// Update an item (w/ optional query)
directus.items('articles').update(15, {
	title: 'An Updated title'
});
directus.items('articles').update(
	15,
	{ title: 'An Updated title' },
	{ fields: ['title'] }
);

// Update multiple items to the same value (w/ optional query)
directus.items('articles').update([15, 42], {
	title: 'An Updated title'
});
directus.items('articles').update(
	[15, 42],
	{ title: 'An Updated title' },
	{ fields: ['title'] }
);

// Update multiple items to multiple values (w/ optional query)
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
directus.items('articles').update([
	{
		id: 15,
		title: 'Article 15',
	},
	{
		id: 42,
		title: 'Article 42',
	},
], { fields: ['title'] });

// Update by query
directus.items('articles').update(
	{ title: 'An Updated title' },
	{ filter: { title: 'An Old Title' }}
);
```

#### Delete

```js
// Delete an item
directus.items('articles').delete(15);

// Delete multiple items
directus.items('articles').delete([15, 42]);
```
