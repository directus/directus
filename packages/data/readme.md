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

await data.registerStore(
	'postgres',
	new DataDriverPostgres({
		connectionString: 'postgresql://root:password@localhost/mydb',
	})
);
```

Query data:

```js
import { DataEngine } from '@directus/data';
import { DataDriverPostgres } from '@directus/data-driver-postgres';

const data = new DataEngine();

await data.registerStore(
	'postgres',
	new DataDriverPostgres({
		connectionString: 'postgresql://root:password@localhost/mydb',
	})
);

await data.query({
	root: true,
	store: 'postgres',
	collection: 'articles',
	nodes: [
		{
			type: 'primitive',
			field: 'id',
		},
	],
});
```

## Flow

This visualizes the general data flow regarding `data`.

```mermaid
graph LR;
    api --> data
    data --> sql-adapter
    data --> no-sql-adapter
	sql-adapter ---> db1[(datastore)]
	sql-adapter  --- data-sql
	no-sql-adapter ---> db2[(datastore)]
```
