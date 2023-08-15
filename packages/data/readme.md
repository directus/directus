# `@directus/data`

> **Warning** This is a work in progress. Nothing is expected to work yet.

## Installation

```
npm install @directus/data
```

## Usage

Instantiate the engine:

```js
import { DataEngine } from '@directus/data';

const data = new DataEngine();
```

Register a driver to the engine:

```js
import { DataEngine } from '@directus/data';
import { DataDriverPostgres } from '@directus/data-driver-postgres';

const engine = new DataEngine();

const pgDriver = new DataDriverPostgres({
	connectionString: 'postgresql://root:password@localhost/mydb',
});

await engine.registerStore('postgres', pgDriver);
```

Query data:

```js
import { DataEngine } from '@directus/data';
import { DataDriverPostgres } from '@directus/data-driver-postgres';

const engine = new DataEngine();

const pgDriver = new DataDriverPostgres({
	connectionString: 'postgresql://root:password@localhost/mydb',
});

await engine.registerStore('postgres', pgDriver);

await engine.query({
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

## Overall composition of the packages

This visualizes the general data flow regarding `data`.

```mermaid
graph TB;
    api --> data
	subgraph data[data abstraction/ -pipeline]
	direction TB
    engine --> data-driver-x
    engine --> data-driver-y
	data-driver-x ---> db1[(datastore)]
	data-driver-x  -- if driver is SQL --> data-sql
	data-driver-y ---> db2[(datastore)]
	end
```
