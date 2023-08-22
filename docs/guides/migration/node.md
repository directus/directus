---
description: Learn how to migrate your data model to a new Directus project using Node.js.
directus_version: 9.23.0
author: Kevin Lewis
---

# Migrate Your Data Model with Node.js

<GuideMeta />

## Explanation

Directus' schema migration endpoints allow users to retrieve a project's data model and apply changes to another
project.

This is useful if you make changes to a data model in a development project and need to apply them to a production
project, or to move from a self-hosted project to Directus Cloud.

## How-To Guide

::: tip Permissions

You must be an admin user to use these endpoints and follow this guide.

:::

You should have two Directus projects - this guide will refer to them as the "base" and the "target". Before starting,
make sure you have a static access token for both projects.

### Set Up Project

Open a new empty directory in your code editor. In your terminal, navigate to the directory and install dependencies
with `npm install cross-fetch`.

Create a new `index.js` file and set it up:

```js
const fetch = require('cross-fetch');

const BASE_DIRECTUS_URL = 'https://your-base-project.directus.app';
const BASE_ACCESS_TOKEN = 'your-access-token';

const TARGET_DIRECTUS_URL = 'https://your-target-project.directus.app';
const TARGET_ACCESS_TOKEN = 'your-access-token';

async function main() {}

main();
```

### Retrieve Data Model Snapshot From Base Project

At the bottom of `index.js`, create a `getSnapshot()` function:

```js
async function getSnapshot() {
	const URL = `${BASE_DIRECTUS_URL}/schema/snapshot?access_token=${BASE_ACCESS_TOKEN}`;
	const { data } = await fetch(URL).then((r) => r.json());
	return data;
}
```

Note that the data property is destructured from the response and returned. In the `main()` function, call
`getSnapshot()`:

```js
async function main() {
	const snapshot = await getSnapshot(); // [!code ++]
	console.log(snapshot); // [!code ++]
}
```

Get your snapshot by running `node index.js`.

### Retrieve Data Model Diff

This section will create a "diff" that describes all differences between your base and target project's data models.

At the bottom of `index.js`, create a `getDiff()` function which accepts a `snapshot` parameter:

```js
async function getDiff(snapshot) {
	const URL = `${TARGET_DIRECTUS_URL}/schema/diff?access_token=${TARGET_ACCESS_TOKEN}`;

	const { data } = await fetch(URL, {
		method: 'POST',
		body: JSON.stringify(snapshot),
		headers: {
			'Content-Type': 'application/json',
		},
	}).then((r) => r.json());

	return data;
}
```

Update your `main()` function:

```js
async function main() {
	const snapshot = await getSnapshot();
	console.log(snapshot); // [!code --]
	const diff = await getDiff(snapshot); // [!code ++]
	console.log(diff); // [!code ++]
}
```

Get your diff by running `node index.js`.

### Apply Diff To Target Project

At the bottom of `index.js`, create a `applyDiff()` function which accepts a `diff` parameter:

```js
async function applyDiff(diff) {
	const URL = `${TARGET_DIRECTUS_URL}/schema/apply?access_token=${TARGET_ACCESS_TOKEN}`;

	await fetch(URL, {
		method: 'POST',
		body: JSON.stringify(diff),
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
```

Update your `main()` function:

```js
async function main() {
	const snapshot = await getSnapshot();
	const diff = await getDiff(snapshot);
	console.log(diff); // [!code --]
	await applyDiff(diff); // [!code ++]
}
```

Apply the diff by running `node index.js`.

## Final Tips

The diff endpoint does not allow different Directus versions and database vendors by default. This is to avoid any
unintentional diffs from being generated. You can opt in to bypass these checks by adding a second query parameter
called `force` with the value of `true`.

The hash property in the diff is based on the target instance's schema and version. It is used to safeguard against
changes that may happen after the current diff was generated which can potentially incur unexpected side effects when
applying the diffs without this safeguard. In case the schema has been changed in the meantime, the diff must be
regenerated.

The complete and final code is available below.

```js
const fetch = require('cross-fetch');

const BASE_DIRECTUS_URL = 'https://your-base-project.directus.app';
const BASE_ACCESS_TOKEN = 'your-access-token';

const TARGET_DIRECTUS_URL = 'https://your-target-project.directus.app';
const TARGET_ACCESS_TOKEN = 'your-access-token';

async function main() {
	const snapshot = await getSnapshot();
	const diff = await getDiff(snapshot);
	await applyDiff(diff);
}

main();

async function getSnapshot() {
	const URL = `${BASE_DIRECTUS_URL}/schema/snapshot?access_token=${BASE_ACCESS_TOKEN}`;
	const { data } = await fetch(URL).then((r) => r.json());
	return data;
}

async function getDiff(snapshot) {
	const URL = `${TARGET_DIRECTUS_URL}/schema/diff?access_token=${TARGET_ACCESS_TOKEN}`;

	const { data } = await fetch(URL, {
		method: 'POST',
		body: JSON.stringify(snapshot),
		headers: {
			'Content-Type': 'application/json',
		},
	}).then((r) => r.json());

	return data;
}

async function applyDiff(diff) {
	const URL = `${TARGET_DIRECTUS_URL}/schema/apply?access_token=${TARGET_ACCESS_TOKEN}`;

	await fetch(URL, {
		method: 'POST',
		body: JSON.stringify(diff),
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
```
