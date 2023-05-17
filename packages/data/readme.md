# `@directus/data`

> **Warning** This is a work in progress. Nothing is expected to work yet.

## Installation

```
npm install @directus/data
```

## Usage

Create a new manager:

```js
import { DataEngine } from '@directus/data';

const data = new DataEngine();
```

Register drivers:

```js
import { DataEngine } from '@directus/data';
import { DataDriverPostgres } from '@directus/data-driver-postgres';

const data = new DataEngine();

data.registerStore(
	'postgres',
	new DataDriverPostgres({
		connectionString: 'postgresql://root:password@localhost/mydb',
	})
);
```

Connect to the registered stores:

```js
import { DataEngine } from '@directus/data';
import { DataDriverPostgres } from '@directus/data-driver-postgres';

const data = new DataEngine();

data.registerStore(
	'postgres',
	new DataDriverPostgres({
		connectionString: 'postgresql://root:password@localhost/mydb',
	})
);

await data.connect();
```

Query data:

```js
import { DataEngine } from '@directus/data';
import { DataDriverPostgres } from '@directus/data-driver-postgres';

const data = new DataEngine();

data.registerStore(
	'postgres',
	new DataDriverPostgres({
		connectionString: 'postgresql://root:password@localhost/mydb',
	})
);

await data.connect();

await data.query({
	root: true,
	store: 'postgres',
	collection: 'articles',
	nodes: [
		{
			type: 'primitive',
			field: 'id'
		}
	]
})
```
